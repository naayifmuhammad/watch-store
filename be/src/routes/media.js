const express = require('express');
const router = express.Router();
const MediaController = require('../controllers/mediaController');
const { authenticateCustomer, authenticateAdmin, authenticateDelivery } = require('../middlewares/auth');
const validate = require('../middlewares/validator');
const {
  presignMediaSchema,
  registerMediaSchema
} = require('../utils/validation');

// Middleware to authenticate any valid user (customer, admin, or delivery)
const authenticateAny = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'No token provided'
          }
    });
  }
  
  // Try customer auth first
  authenticateCustomer(req, res, (err) => {
    if (!err) return next();
    
    // Try admin auth
    authenticateAdmin(req, res, (err) => {
      if (!err) return next();
      
      // Try delivery auth
      authenticateDelivery(req, res, (err) => {
        if (!err) return next();
        
        // All failed
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid token'
          }
        });
      });
    });
  });
};

// Media routes (require any authentication)
router.post(
  '/presign',
  authenticateAny,
  validate(presignMediaSchema),
  MediaController.generatePresignedUrl
);

router.post(
  '/',
  authenticateAny,
  validate(registerMediaSchema),
  MediaController.registerMedia
);

router.get(
  '/request/:request_id',
  authenticateAny,
  MediaController.getMediaByRequest
);

// Delete media (admin only)
router.delete(
  '/:id',
  authenticateAdmin,
  MediaController.deleteMedia
);

module.exports = router;
