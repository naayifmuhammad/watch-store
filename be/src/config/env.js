require('dotenv').config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 4000,
  
  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'watch_store',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },
  
  // JWT
  jwt: {
    customerSecret: process.env.JWT_CUSTOMER_SECRET,
    deliverySecret: process.env.JWT_DELIVERY_SECRET,
    adminSecret: process.env.JWT_ADMIN_SECRET,
    expiry: process.env.JWT_EXPIRY || '365d'
  },
  
  // AWS
  aws: {
    region: process.env.AWS_REGION || 'ap-south-1',
    s3Bucket: process.env.AWS_S3_BUCKET,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  
  // Google Maps
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
  
  // SMS
  sms: {
    provider: process.env.SMS_PROVIDER || 'dev',
    apiKey: process.env.SMS_API_KEY,
    apiSecret: process.env.SMS_API_SECRET,
    fromNumber: process.env.SMS_FROM_NUMBER,
    // Twilio
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioWhatsAppNumber: process.env.TWILIO_WHATSAPP_NUMBER
  },
  
  // Feature Flags
  notificationsEnabled: process.env.NOTIFICATIONS_ENABLED === 'true',
  
  // Limits
  maxMediaBytes: parseInt(process.env.MAX_MEDIA_BYTES) || 104857600,
  maxVideoDuration: parseInt(process.env.MAX_VIDEO_DURATION_SECONDS) || 60,
  maxVoiceDuration: parseInt(process.env.MAX_VOICE_DURATION_SECONDS) || 600,
  
  // OTP
  otp: {
    ttlMinutes: parseInt(process.env.OTP_TTL_MINUTES) || 10,
    length: parseInt(process.env.OTP_LENGTH) || 6,
    maxAttemptsPerHour: parseInt(process.env.OTP_MAX_ATTEMPTS_PER_HOUR) || 5
  }
};