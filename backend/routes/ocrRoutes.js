const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ocrController = require('../controllers/ocrController');

// Route for uploading and processing an image
router.post('/process', protect, ocrController.upload, ocrController.processImage);

module.exports = router;