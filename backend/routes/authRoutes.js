const express = require('express');
const router = express.Router();
const passport = require('passport');
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Standard auth routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

// ── Google OAuth routes ──
// Step 1: Redirect to Google
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Step 2: Google callback
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login.html', session: false }),
  (req, res) => {
    // Successful auth — redirect to home with token as query param
    const token = req.user.token;
    const name  = encodeURIComponent(req.user.name);
    const id    = req.user._id;
    res.redirect(`/home.html?token=${token}&name=${name}&id=${id}`);
  }
);

module.exports = router;