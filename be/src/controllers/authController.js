const Database = require('../models/db');
const OTPService = require('../services/otpService');
const smsService = require('../services/smsService');
const { generateToken } = require('../utils/jwt');
const { ROLES, OTP_PURPOSES } = require('../utils/constants');

class AuthController {

  // Admin: Request OTP
static async adminRequestOTP(req, res, next) {
  try {
    const { phone } = req.body; 

    // Check if admin exists
    const admin = await Database.queryOne(
      'SELECT * FROM admins WHERE phone = ?',
      [phone]
    );

    if (!admin) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Admin not found'
        }
      });
    }

    const { code } = await OTPService.createOTPSession(
      phone,
      OTP_PURPOSES.ADMIN_INVITE
    );

    await smsService.sendOTP(phone, code);

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

// Admin: Verify OTP
static async adminVerifyOTP(req, res, next) {
  try {
    const { phone, code } = req.body;

    // Verify OTP
    await OTPService.verifyOTP(phone, code, OTP_PURPOSES.ADMIN_INVITE);

    // Get admin details
    const admin = await Database.queryOne(
      'SELECT * FROM admins WHERE phone = ?',
      [phone]
    );

    if (!admin) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Admin not found'
        }
      });
    }

    // Generate JWT
    const token = generateToken(
      {
        sub: admin.id,
        role: ROLES.ADMIN,
        phone: admin.phone
      },
      ROLES.ADMIN
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        phone: admin.phone,
        name: admin.name
      }
    });
  } catch (error) {
    next(error);
  }
}

  // Customer: Request OTP
  static async customerRequestOTP(req, res, next) {
    try {
      const { phone } = req.body;

      const { code } = await OTPService.createOTPSession(
        phone,
        OTP_PURPOSES.CUSTOMER_LOGIN
      );

      await smsService.sendOTP(phone, code);

      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }

  // Customer: Verify OTP (check if existing or new user)
  static async customerVerifyOTP(req, res, next) {
    try {
      const { phone, code } = req.body;

      // Verify OTP
      await OTPService.verifyOTP(phone, code, OTP_PURPOSES.CUSTOMER_LOGIN);

      // Check if customer exists
      const customer = await Database.queryOne(
        'SELECT * FROM customers WHERE phone = ?',
        [phone]
      );

      if (!customer) {
        // First-time user
        return res.json({
          success: true,
          is_new_user: true,
          message: 'OTP verified. First-time user. Please complete registration.'
        });
      }

      // Existing user → generate token
      const token = generateToken(
        {
          sub: customer.id,
          role: ROLES.CUSTOMER,
          phone: customer.phone
        },
        ROLES.CUSTOMER
      );

      res.json({
        success: true,
        is_new_user: false,
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

  // Customer: Register new user after verifying OTP
  static async customerRegister(req, res, next) {
    try {
      const { phone, name, email, default_address, lat, lon } = req.body;

      // Check if user already exists
      let existing = await Database.queryOne(
        'SELECT * FROM customers WHERE phone = ?',
        [phone]
      );

      if (existing) {
        return res.status(400).json({
          error: {
            code: 'USER_EXISTS',
            message: 'Customer already registered.'
          }
        });
      }

      // Create new customer
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

      const customer = await Database.queryOne(
        'SELECT * FROM customers WHERE id = ?',
        [customerId]
      );

      // Generate JWT after registration
      const token = generateToken(
        {
          sub: customer.id,
          role: ROLES.CUSTOMER,
          phone: customer.phone
        },
        ROLES.CUSTOMER
      );

      res.json({
        success: true,
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

      await OTPService.verifyOTP(phone, code, OTP_PURPOSES.DELIVERY_LOGIN);

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

      const token = generateToken(
        {
          sub: deliveryPerson.id,
          role: ROLES.DELIVERY,
          phone: deliveryPerson.phone
        },
        ROLES.DELIVERY
      );

      res.json({
        success: true,
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
