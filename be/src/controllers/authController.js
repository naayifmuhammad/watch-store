const Database = require('../models/db');
const OTPService = require('../services/otpService');
const smsService = require('../services/smsService');
const { generateToken } = require('../utils/jwt');
const { ROLES, OTP_PURPOSES } = require('../utils/constants');
const logger = require('../middlewares/logger');

class AuthController {
  // Customer: Request OTP
  static async customerRequestOTP(req, res, next) {
    try {
      const { phone } = req.body;
      
      const { code } = await OTPService.createOTPSession(
        phone,
        OTP_PURPOSES.CUSTOMER_LOGIN
      );
      
      // Send OTP via SMS
      await smsService.sendOTP(phone, code);
      
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }
  
  // Customer: Verify OTP
  static async customerVerifyOTP(req, res, next) {
    try {
      const { phone, code, name, email, default_address, lat, lon } = req.body;
      
      // Verify OTP
      await OTPService.verifyOTP(phone, code, OTP_PURPOSES.CUSTOMER_LOGIN);
      
      // Check if customer exists
      let customer = await Database.queryOne(
        'SELECT * FROM customers WHERE phone = ?',
        [phone]
      );
      
      // Create customer if first login
      if (!customer) {
        const customerId = await Database.insert('customers', {
          phone,
          name: name || null,
          email: email || null,
          default_address: default_address || null,
          latitude: lat || null,
          longitude: lon || null,
          created_at: new Date(),
          updated_at: new Date()
        });
        
        customer = await Database.queryOne(
          'SELECT * FROM customers WHERE id = ?',
          [customerId]
        );
      } else if (name || email || default_address || lat || lon) {
        // Update profile if data provided
        await Database.update(
          'customers',
          {
            name: name || customer.name,
            email: email || customer.email,
            default_address: default_address || customer.default_address,
            latitude: lat || customer.latitude,
            longitude: lon || customer.longitude,
            updated_at: new Date()
          },
          'id = ?',
          [customer.id]
        );
        
        customer = await Database.queryOne(
          'SELECT * FROM customers WHERE id = ?',
          [customer.id]
        );
      }
      
      // Generate JWT
      const token = generateToken(
        {
          sub: customer.id,
          role: ROLES.CUSTOMER,
          phone: customer.phone
        },
        ROLES.CUSTOMER
      );
      
      res.json({
        token,
        customer: {
          id: customer.id,
          phone: customer.phone,
          name: customer.name,
          email: customer.email
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Delivery: Request OTP
  static async deliveryRequestOTP(req, res, next) {
    try {
      const { phone } = req.body;
      
      // Check if delivery person exists
      const deliveryPerson = await Database.queryOne(
        'SELECT * FROM delivery_personnel WHERE phone = ? AND active = 1',
        [phone]
      );
      
      if (!deliveryPerson) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Delivery personnel not found or inactive'
          }
        });
      }
      
      const { code } = await OTPService.createOTPSession(
        phone,
        OTP_PURPOSES.DELIVERY_LOGIN
      );
      
      // Send OTP via SMS
      await smsService.sendOTP(phone, code);
      
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }
  
  // Delivery: Verify OTP
  static async deliveryVerifyOTP(req, res, next) {
    try {
      const { phone, code } = req.body;
      
      // Verify OTP
      await OTPService.verifyOTP(phone, code, OTP_PURPOSES.DELIVERY_LOGIN);
      
      // Get delivery person
      const deliveryPerson = await Database.queryOne(
        'SELECT * FROM delivery_personnel WHERE phone = ? AND active = 1',
        [phone]
      );
      
      if (!deliveryPerson) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Delivery personnel not found or inactive'
          }
        });
      }
      
      // Generate JWT
      const token = generateToken(
        {
          sub: deliveryPerson.id,
          role: ROLES.DELIVERY,
          phone: deliveryPerson.phone
        },
        ROLES.DELIVERY
      );
      
      res.json({
        token,
        delivery: {
          id: deliveryPerson.id,
          phone: deliveryPerson.phone,
          name: deliveryPerson.name
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
