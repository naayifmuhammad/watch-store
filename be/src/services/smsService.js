const logger = require('../middlewares/logger');
const config = require('../config/env');

class SMSService {
  constructor() {
    this.provider = this.getProvider();
  }
  
  getProvider() {
    const providerName = config.sms.provider;
    
    switch (providerName) {
      case 'dev':
        return new DevSMSProvider();
      default:
        return new DevSMSProvider();
    }
  }
  
  async sendOTP(phone, code) {
    const message = `Your OTP for Watch Store is: ${code}. Valid for ${config.otp.ttlMinutes} minutes.`;
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
