const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const validate = require('../middlewares/validator');
const {
  requestOtpSchema,
  verifyOtpCustomerSchema,
  verifyOtpDeliverySchema
} = require('../utils/validation');

// Admin OTP
router.post('/admin/request-otp', AuthController.adminRequestOTP);
router.post('/admin/verify-otp', AuthController.adminVerifyOTP);

// Customer auth routes
router.post(
  '/customer/request-otp',
  validate(requestOtpSchema),
  AuthController.customerRequestOTP
);

router.post(
  '/customer/verify-otp',
  validate(verifyOtpCustomerSchema),
  AuthController.customerVerifyOTP
);

router.post(
  '/customer/register',
  AuthController.customerRegister
);

// Delivery auth routes
router.post(
  '/delivery/request-otp',
  validate(requestOtpSchema),
  AuthController.deliveryRequestOTP
);

router.post(
  '/delivery/verify-otp',
  validate(verifyOtpDeliverySchema),
  AuthController.deliveryVerifyOTP
);

module.exports = router;
