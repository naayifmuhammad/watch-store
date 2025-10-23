const express = require('express');
const router = express.Router();
const ServiceRequestController = require('../controllers/serviceRequestController');
const { authenticateCustomer } = require('../middlewares/auth');
const validate = require('../middlewares/validator');
const { createServiceRequestSchema } = require('../utils/validation');

// All routes require customer authentication
router.use(authenticateCustomer);

// Service request routes
router.post(
  '/',
  validate(createServiceRequestSchema),
  ServiceRequestController.create
);

router.get('/', ServiceRequestController.getCustomerRequests);
router.get('/:id', ServiceRequestController.getRequestDetail);

router.post('/:id/accept-quote', ServiceRequestController.acceptQuote);

module.exports = router;
