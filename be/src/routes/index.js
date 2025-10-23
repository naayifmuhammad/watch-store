const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const customerRoutes = require('./customer');
const serviceRequestRoutes = require('./serviceRequest');
const adminRoutes = require('./admin');
const deliveryRoutes = require('./delivery');
const mediaRoutes = require('./media');

// Mount routes
router.use('/auth', authRoutes);
router.use('/customer', customerRoutes);
router.use('/service-requests', serviceRequestRoutes);
router.use('/admin', adminRoutes);
router.use('/delivery', deliveryRoutes);
router.use('/media', mediaRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
