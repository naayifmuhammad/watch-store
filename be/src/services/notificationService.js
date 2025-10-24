// services/notificationService.js
const Database = require('../models/db');
const smsService = require('./smsService');
const logger = require('../middlewares/logger');
const { NOTIFICATION_TYPES } = require('../utils/constants');

class NotificationService {
  static async sendNewRequestNotification(adminPhone, requestId) {
    try {
      const message = `New service request #${requestId} has been created and needs review.`;
      
      const result = await smsService.sendNotification(adminPhone, message);
      
      await this.logNotification(
        NOTIFICATION_TYPES.SMS,
        adminPhone,
        message,
        result.sent
      );
      
      return result;
    } catch (error) {
      logger.error('Error sending new request notification:', error);
      return { sent: false, error: error.message };
    }
  }

  static async sendQuoteNotification(customer, requestId, quoteMin, quoteMax) {
    try {
      const message = `Your service request #${requestId} has received a quote: ₹${quoteMin} - ₹${quoteMax}. Please check your portal to accept.`;
      
      const result = await smsService.sendNotification(customer.phone, message);
      
      await this.logNotification(
        NOTIFICATION_TYPES.SMS,
        customer.phone,
        message,
        result.sent
      );
      
      return result;
    } catch (error) {
      logger.error('Error sending quote notification:', error);
      return { sent: false, error: error.message };
    }
  }
  
  static async sendQuoteAcceptedNotification(adminPhone, requestId) {
    try {
      const message = `Service request #${requestId} quote has been accepted by customer.`;
      
      const result = await smsService.sendNotification(adminPhone, message);
      
      await this.logNotification(
        NOTIFICATION_TYPES.SMS,
        adminPhone,
        message,
        result.sent
      );
      
      return result;
    } catch (error) {
      logger.error('Error sending quote accepted notification:', error);
      return { sent: false, error: error.message };
    }
  }
  
  static async sendPickupNotification(customer, requestId) {
    try {
      const message = `Your item for service request #${requestId} has been picked up and is on the way to our shop.`;
      
      const result = await smsService.sendNotification(customer.phone, message);
      
      await this.logNotification(
        NOTIFICATION_TYPES.SMS,
        customer.phone,
        message,
        result.sent
      );
      
      return result;
    } catch (error) {
      logger.error('Error sending pickup notification:', error);
      return { sent: false, error: error.message };
    }
  }
  
  static async sendDeliveryNotification(customer, requestId) {
    try {
      const message = `Your repaired item for service request #${requestId} has been delivered. Thank you for choosing our service!`;
      
      const result = await smsService.sendNotification(customer.phone, message);
      
      await this.logNotification(
        NOTIFICATION_TYPES.SMS,
        customer.phone,
        message,
        result.sent
      );
      
      return result;
    } catch (error) {
      logger.error('Error sending delivery notification:', error);
      return { sent: false, error: error.message };
    }
  }
  
  static async sendScheduledPickupNotification(customer, requestId, scheduledDate) {
    try {
      const message = `Your pickup for service request #${requestId} is scheduled for ${scheduledDate}.`;
      
      const result = await smsService.sendNotification(customer.phone, message);
      
      await this.logNotification(
        NOTIFICATION_TYPES.SMS,
        customer.phone,
        message,
        result.sent
      );
      
      return result;
    } catch (error) {
      logger.error('Error sending scheduled pickup notification:', error);
      return { sent: false, error: error.message };
    }
  }
  
  static async logNotification(type, toPhone, content, sent) {
    try {
      await Database.insert('notifications_log', {
        type,
        to_phone: toPhone,
        content,
        sent_at: new Date(),
        status: sent ? 'sent' : 'failed'
      });
    } catch (error) {
      logger.error('Error logging notification:', error);
    }
  }
}

module.exports = NotificationService;
