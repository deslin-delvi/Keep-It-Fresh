const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const schedule = require('node-schedule');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const User = require('./models/User');

// Load environment variables
dotenv.config();

const chatbotRoutes = require('./routes/chatbotRoutes');
const ocrRoutes = require('./routes/ocrRoutes');
const pushRoutes = require('./routes/pushRoutes');
const PushNotificationService = require('./services/pushNotificationService');
const connectDB = require('./config/db');

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Initialize Web Push
PushNotificationService.initializeWebPush();

// Schedule daily expiry notifications
const job = schedule.scheduleJob('05 10 * * *', () => {
  console.log('Scheduled job triggered at:', new Date().toISOString());
  PushNotificationService.sendExpiryNotifications();
});

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(express.json());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Session middleware (required for passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'session_secret',
  resave: false,
  saveUninitialized: false
}));

// ── Passport Google OAuth Setup ──
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    const name  = profile.displayName;
    const googleId = profile.id;
    const avatar = profile.photos?.[0]?.value || null;

    // Find existing user by googleId or email
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Update googleId if user registered with email before
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar   = avatar;
        await user.save();
      }
    } else {
      // Create new Google user
      user = await User.create({ name, email, googleId, avatar });
    }

    // Attach JWT token to user object for the callback route
    user.token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    return done(null, user);

  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// Serve static files from frontend directory (except for pages)
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/groceries', require('./routes/groceryRoutes'));
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/push', pushRoutes);


// Specific page routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/login.html'));
});

app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/register.html'));
});

app.get('/home.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/home.html'));
});

app.get('/ocr.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/ocr.html'));
});

// This should be the last route
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});