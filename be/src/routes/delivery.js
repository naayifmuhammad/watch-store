const express = require('express');
const router = express.Router();
const DeliveryController = require('../controllers/deliveryController');
const { authenticateDelivery } = require('../middlewares/auth');
const validate = require('../middlewares/validator');
const {
  markPickupSchema,
  markDeliveredSchema
} = require('../utils/validation');

// All routes require delivery authentication
router.use(authenticateDelivery);

// Assignment routes
router.get('/assignments', DeliveryController.getAssignments);
router.get('/requests/:id', DeliveryController.getDeliveryRequestDetail);

router.post(
  '/:request_id/mark-pickup',
  validate(markPickupSchema),
  DeliveryController.markPickup
);

router.post(
  '/:request_id/mark-out-for-delivery',
  DeliveryController.markOutForDelivery
);

router.post(
  '/:request_id/mark-delivered',
  validate(markDeliveredSchema),
  DeliveryController.markDelivered
);

module.exports = router;
