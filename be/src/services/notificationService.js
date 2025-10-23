const Database = require('../models/db');
const smsService = require('./smsService');
const logger = require('../middlewares/logger');
const { NOTIFICATION_TYPES } = require('../utils/constants');

class NotificationService {
  static async sendQuoteNotification(customer, requestId, quoteMin, quoteMax) {
    const message = `Your service request #${requestId} has received a quote: ₹${quoteMin} - ₹${quoteMax}. Please check your portal to accept.`;
    
    const result = await smsService.sendNotification(customer.phone, message);
    
    await this.logNotification(
      NOTIFICATION_TYPES.SMS,
      customer.phone,
      message,
      result.sent
    );
    
    return result;
  }
  
  static async sendQuoteAcceptedNotification(adminPhone, requestId) {
    const message = `Service request #${requestId} quote has been accepted by customer.`;
    
    const result = await smsService.sendNotification(adminPhone, message);
    
    await this.logNotification(
      NOTIFICATION_TYPES.SMS,
      adminPhone,
      message,
      result.sent
    );
    
    return result;
  }
  
  static async sendPickupNotification(customer, requestId) {
    const message = `Your item for service request #${requestId} has been picked up and is on the way to our shop.`;
    
    const result = await smsService.sendNotification(customer.phone, message);
    
    await this.logNotification(
      NOTIFICATION_TYPES.SMS,
      customer.phone,
      message,
      result.sent
    );
    
    return result;
  }
  
  static async sendDeliveryNotification(customer, requestId) {
    const message = `Your repaired item for service request #${requestId} has been delivered. Thank you for choosing our service!`;
    
    const result = await smsService.sendNotification(customer.phone, message);
    
    await this.logNotification(
      NOTIFICATION_TYPES.SMS,
      customer.phone,
      message,
      result.sent
    );
    
    return result;
  }
  
  static async sendScheduledPickupNotification(customer, requestId, scheduledDate) {
    const message = `Your pickup for service request #${requestId} is scheduled for ${scheduledDate}.`;
    
    const result = await smsService.sendNotification(customer.phone, message);
    
    await this.logNotification(
      NOTIFICATION_TYPES.SMS,
      customer.phone,
      message,
      result.sent
    );
    
    return result;
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
