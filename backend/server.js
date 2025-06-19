const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const schedule = require('node-schedule');
const dotenv = require('dotenv');

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