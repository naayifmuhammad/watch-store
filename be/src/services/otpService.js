const Database = require('../models/db');
const { hash, compare } = require('../utils/hash');
const config = require('../config/env');
const logger = require('../middlewares/logger');

class OTPService {
  static generateOTP() {
    const length = config.otp.length;
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    
    return otp;
  }
  
  static async createOTPSession(phone, purpose) {
    console.log('Creating OTP session for', phone, 'with purpose', purpose);
    // Check rate limiting
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentAttempts = await Database.query(
      `SELECT COUNT(*) as count FROM otp_sessions 
       WHERE phone = ? AND created_at > ?`,
      [phone, oneHourAgo]
    );
    
    if (recentAttempts[0].count >= config.otp.maxAttemptsPerHour) {
      throw new Error('Too many OTP requests. Please try again later.');
    }
    console.log('Creating OTP session for', phone, 'with purpose', purpose);
    const code = this.generateOTP();
    const hashedCode = await hash(code);
    const expiresAt = new Date(Date.now() + config.otp.ttlMinutes * 60 * 1000);
    
    const sessionId = await Database.insert('otp_sessions', {
      phone,
      code: hashedCode,
      purpose,
      expires_at: expiresAt,
      verified: 0,
      created_at: new Date()
    });
    
    logger.info(`OTP created for ${phone}: ${code} (DEV MODE)`);
    
    return { sessionId, code };
  }
  
  static async verifyOTP(phone, code, purpose) {
    const session = await Database.queryOne(
      `SELECT * FROM otp_sessions 
       WHERE phone = ? AND purpose = ? AND verified = 0 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [phone, purpose]
    );
    
    if (!session) {
      throw new Error('Invalid or expired OTP');
    }
    
    const isValid = await compare(code, session.code);
    
    if (!isValid) {
      throw new Error('Invalid OTP');
    }
    
    // Mark as verified
    await Database.update(
      'otp_sessions',
      { verified: 1 },
      'id = ?',
      [session.id]
    );
    
    return true;
  }
  
  static async cleanupExpiredOTPs() {
    await Database.query(
      `DELETE FROM otp_sessions WHERE expires_at < NOW()`
    );
  }
}

module.exports = OTPService;