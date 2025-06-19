const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { protect } = require('../middleware/auth');

// Re-add auth middleware to protect routes
router.post('/chat', protect, (req, res) => {
  chatbotController.getChatbotResponse(req, res);
});

router.post('/recipes', protect, (req, res) => {
  chatbotController.getRecipeSuggestions(req, res);
});

// Add a public test endpoint that doesn't require auth
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'API endpoint working' });
});

module.exports = router;