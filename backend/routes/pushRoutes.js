const express = require('express');
const router = express.Router();
const PushNotificationService = require('../services/pushNotificationService');
const { protect } = require('../middleware/auth');

// Subscribe to push notifications
router.post('/subscribe', protect, async (req, res) => {
  try {
    const subscription = req.body;
    await PushNotificationService.addSubscription(req.user._id, subscription);
    res.status(201).json({ message: 'Subscription added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add subscription', error: error.message });
  }
});

// Add this route to your existing pushRoutes.js
router.post('/trigger-expiry-notifications', protect, async (req, res) => {
    try {
      await PushNotificationService.sendExpiryNotifications();
      res.status(200).json({ message: 'Expiry notifications triggered successfully' });
    } catch (error) {
      console.error('Error triggering expiry notifications:', error);
      res.status(500).json({ message: 'Failed to trigger expiry notifications', error: error.message });
    }
  });

// Get VAPID public key
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// Add this to your existing pushRoutes.js
router.get('/test-notification', protect, async (req, res) => {
    try {
      const result = await PushNotificationService.sendTestNotification(req.user._id);
      if (result) {
        res.status(200).json({ message: 'Test notification sent successfully' });
      } else {
        res.status(400).json({ message: 'Failed to send test notification' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error sending test notification', error: error.message });
    }
  });

module.exports = router;