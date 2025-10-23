const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const SettingsController = require('../controllers/settingsController');
const { authenticateAdmin } = require('../middlewares/auth');
const validate = require('../middlewares/validator');
const {
  sendQuoteSchema,
  assignDeliverySchema,
  createDeliveryPersonSchema
} = require('../utils/validation');
const Joi = require('joi');

// All routes require admin authentication
router.use(authenticateAdmin);

// Service requests management
router.get('/service-requests', AdminController.getServiceRequests);
router.get('/service-requests/:id', AdminController.getServiceRequestDetail);

router.post(
  '/service-requests/:id/send-quote',
  validate(sendQuoteSchema),
  AdminController.sendQuote
);

router.post(
  '/service-requests/:id/confirm',
  AdminController.confirmOrder
);

router.post(
  '/service-requests/:id/assign-delivery',
  validate(assignDeliverySchema),
  AdminController.assignDelivery
);

router.post(
  '/service-requests/:id/mark-received',
  AdminController.markReceived
);

router.post(
  '/service-requests/:id/mark-in-repair',
  AdminController.markInRepair
);

router.post(
  '/service-requests/:id/mark-ready-for-payment',
  AdminController.markReadyForPayment
);

router.post(
  '/service-requests/:id/mark-paid',
  AdminController.markPaid
);

// Delivery personnel management
router.post(
  '/delivery-personnel',
  validate(createDeliveryPersonSchema),
  AdminController.createDeliveryPerson
);

router.get('/delivery-personnel', AdminController.getDeliveryPersonnel);

router.patch(
  '/delivery-personnel/:id/status',
  AdminController.toggleDeliveryPersonStatus
);

// Shop management
router.get('/shops', AdminController.getShops);

router.post(
  '/shops',
  validate(Joi.object({
    name: Joi.string().max(255).required(),
    address: Joi.string().required(),
    phone: Joi.string().max(32).required()
  })),
  AdminController.createShop
);

// Settings
router.get('/settings', SettingsController.getSettings);
router.patch('/settings', SettingsController.updateSettings);

module.exports = router;
