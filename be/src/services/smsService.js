const logger = require('../middlewares/logger');
const config = require('../config/env');
const twilio = require('twilio');

class SMSService {
  constructor() {
    this.provider = this.getProvider();
  }
  
  getProvider() {
    const providerName = config.sms.provider;
    
    switch (providerName) {
      case 'twilio':
        return new TwilioWhatsAppProvider();
      case 'dev':
        return new DevSMSProvider();
      default:
        return new DevSMSProvider();
    }
  }
  
  async sendOTP(phone, code) {
    const message = `Your OTP for Star watch house login is: ${code}. Valid for ${config.otp.ttlMinutes} minutes.`;
    return await this.provider.send(phone, message);
  }
  
  async sendNotification(phone, message) {
    if (!config.notificationsEnabled) {
      logger.info(`Notifications disabled. Would send to ${phone}: ${message}`);
      return { sent: false, reason: 'notifications_disabled' };
    }
    
    return await this.provider.send(phone, message);
  }
}

// Twilio WhatsApp Provider
class TwilioWhatsAppProvider {
  constructor() {
    this.client = twilio(
      config.sms.twilioAccountSid,
      config.sms.twilioAuthToken
    );
    this.fromNumber = config.sms.twilioWhatsAppNumber;
  }

  async send(phone, message) {
    try {
      // Format phone number for WhatsApp (must include country code)
      const formattedPhone = this.formatPhoneNumber(phone);
      
      const result = await this.client.messages.create({
        from: this.fromNumber,
        body: message,
        to: formattedPhone
      });

      logger.info(`[TWILIO WhatsApp] Message sent to: ${formattedPhone}`);
      logger.info(`[TWILIO WhatsApp] SID: ${result.sid}`);
      
      return {
        sent: true,
        provider: 'twilio_whatsapp',
        messageId: result.sid,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`[TWILIO WhatsApp] Error sending message: ${error.message}`);
      throw new Error(`Failed to send WhatsApp message: ${error.message}`);
    }
  }

  formatPhoneNumber(phone) {
    // Remove any spaces, dashes, or special characters
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // Add + if not present
    if (!cleaned.startsWith('+')) {
      // For Indian numbers (10 digits), add +91
      if (cleaned.length === 10) {
        cleaned = '+91' + cleaned;
      } else if (!cleaned.startsWith('91') && cleaned.length === 12) {
        cleaned = '+' + cleaned;
      } else {
        cleaned = '+' + cleaned;
      }
    }
    
    // Add whatsapp: prefix for Twilio
    return `whatsapp:${cleaned}`;
  }
}

// Dev SMS Provider (logs to console)
class DevSMSProvider {
  async send(phone, message) {
    logger.info(`[DEV SMS] To: ${phone}`);
    logger.info(`[DEV SMS] Message: ${message}`);
    logger.info(`[DEV SMS] ========================`);
    
    return {
      sent: true,
      provider: 'dev',
      timestamp: new Date()
    };
  }
}

module.exports = new SMSService();