const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/customerController');
const { authenticateCustomer } = require('../middlewares/auth');
const validate = require('../middlewares/validator');
const { updateProfileSchema } = require('../utils/validation');

// All routes require customer authentication
router.use(authenticateCustomer);

// Profile routes
router.get('/profile', CustomerController.getProfile);
router.patch('/profile', validate(updateProfileSchema), CustomerController.updateProfile);

// Categories
router.get('/categories', CustomerController.getCategories);

module.exports = router;
