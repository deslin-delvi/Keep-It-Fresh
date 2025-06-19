const webpush = require('web-push');
const User = require('../models/User');
const Grocery = require('../models/Grocery');

class PushNotificationService {
  static subscriptions = new Map();

  static async initializeWebPush() {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      const vapidKeys = webpush.generateVAPIDKeys();
      process.env.VAPID_PUBLIC_KEY = vapidKeys.publicKey;
      process.env.VAPID_PRIVATE_KEY = vapidKeys.privateKey;
    }

    webpush.setVapidDetails(
      'mailto:your-email@example.com', 
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }

  static async addSubscription(userId, subscription) {
    try {
      await User.findByIdAndUpdate(userId, 
        { $set: { pushSubscription: subscription } }, 
        { new: true }
      );
      this.subscriptions.set(userId.toString(), subscription);
    } catch (error) {
      console.error('Error adding subscription:', error);
    }
  }

  static async sendExpiryNotifications() {
    try {
      console.log('------------------------------');
      console.log('Expiry Notification Job Started');
      console.log(`Current Time: ${new Date().toISOString()}`);
  
      // Find groceries expiring in the next 3 days
      const now = new Date();
      const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  
      console.log(`Checking groceries expiring between:
        Now: ${now.toISOString()}
        Three Days Later: ${threeDaysLater.toISOString()}`);
  
      const expiringGroceries = await Grocery.find({
        expiryDate: { 
          $gte: now, 
          $lte: threeDaysLater 
        }
      }).populate('user');
  
      console.log(`Found ${expiringGroceries.length} expiring groceries`);
  
      for (const grocery of expiringGroceries) {
        const userId = grocery.user._id.toString();
        const subscription = this.subscriptions.get(userId) || 
          grocery.user.pushSubscription;
  
        console.log(`Processing grocery: ${grocery.name}`);
        console.log(`User ID: ${userId}`);
        console.log(`Subscription exists: ${!!subscription}`);
  
        if (subscription) {
          const payload = {
            title: 'Grocery Expiry Alert',
            body: `${grocery.name} is expiring on ${grocery.expiryDate.toLocaleDateString()}`,
            icon: '/images/grocery-icon.png'
          };
  
          try {
            await webpush.sendNotification(subscription, JSON.stringify(payload));
            console.log(`Notification sent for ${grocery.name}`);
          } catch (error) {
            console.error(`Failed to send notification for ${grocery.name}:`, error);
            
            // Remove invalid subscription
            this.subscriptions.delete(userId);
            await User.findByIdAndUpdate(userId, { $unset: { pushSubscription: 1 } });
          }
        }
      }
  
      console.log('Expiry Notification Job Completed');
      console.log('------------------------------');
    } catch (error) {
      console.error('Error in sendExpiryNotifications:', error);
    }
  }

  // In PushNotificationService
static async manualTriggerExpiryNotifications() {
  console.log('Manually triggering expiry notifications');
  await this.sendExpiryNotifications();
}

  static async sendTestNotification(userId) {
    try {
      const user = await User.findById(userId);
      const subscription = user.pushSubscription;
  
      if (!subscription) {
        console.error('No push subscription found for user');
        return false;
      }
  
      const payload = {
        title: 'Push Notification Test',
        body: 'Notification system is working correctly!',
        icon: '/images/grocery-icon.png'
      };
  
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      return true;
    } catch (error) {
      console.error('Test notification failed:', error);
      return false;
    }
  }
}

module.exports = PushNotificationService;