// routes/customer.js
const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/customerController');
const { authenticateCustomer } = require('../middlewares/auth');
const validate = require('../middlewares/validator');
const { updateProfileSchema } = require('../utils/validation');

// All routes require customer authentication
router.use(authenticateCustomer);

// Customer profile routes
router.get('/profile', CustomerController.getProfile);
router.patch(
  '/profile',
  validate(updateProfileSchema),
  CustomerController.updateProfile
);

// Geocoding route
router.get('/geocode', CustomerController.reverseGeocode);

module.exports = router;