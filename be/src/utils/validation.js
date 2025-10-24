const Joi = require('joi');

// Phone validation (Indian format)
const phoneSchema = Joi.string()
  .pattern(/^\+91[6-9]\d{9}$/)
  .required()
  .messages({
    'string.pattern.base': 'Phone must be in format +91XXXXXXXXXX'
  });

// OTP validation
const otpSchema = Joi.string()
  .length(6)
  .pattern(/^\d+$/)
  .required();

// Request OTP schema
const requestOtpSchema = Joi.object({
  phone: phoneSchema
});

// Verify OTP schema (customer)
const verifyOtpCustomerSchema = Joi.object({
  phone: phoneSchema,
  code: otpSchema,
  name: Joi.string().max(120).optional(),
  email: Joi.string().email().max(255).optional(),
  default_address: Joi.string().optional(),
  lat: Joi.number().min(-90).max(90).optional(),
  lon: Joi.number().min(-180).max(180).optional()
});

// Verify OTP schema (delivery)
const verifyOtpDeliverySchema = Joi.object({
  phone: phoneSchema,
  code: otpSchema
});

// Service request item schema (old but better  - implement this later)

// const serviceItemSchema = Joi.object({
//   category: Joi.string()
//     .valid('watch', 'clock', 'timepiece', 'smart_wearable', 'custom')
//     .required(),
//   title: Joi.string().max(255).optional(),
//   problem_description: Joi.string().optional()
// });

// // Create service request schema
// const createServiceRequestSchema = Joi.object({
//   categories: Joi.array()
//     .items(Joi.string().valid('watch', 'clock', 'timepiece', 'smart_wearable', 'custom'))
//     .min(1)
//     .required(),
//   items: Joi.array().items(serviceItemSchema).min(1).required(),
//   description: Joi.string().required(),
//   images: Joi.array().items(Joi.string()).optional(),
//   videos: Joi.array().items(Joi.string()).optional(),
//   voice_note: Joi.string().optional(),
//   address_manual: Joi.string().required(),
//   gps_lat: Joi.number().min(-90).max(90).optional(),
//   gps_lon: Joi.number().min(-180).max(180).optional()
// });

// Single service request item
const serviceItemSchema = Joi.object({
  category: Joi.string()
    .valid('watch', 'clock', 'timepiece', 'smart_wearable', 'custom')
    .required()
    .messages({
      'any.only': 'Category must be one of: watch, clock, timepiece, smart_wearable, custom',
      'string.empty': 'Category is required',
    }),
  title: Joi.string().max(255).optional().allow('', null),
  description: Joi.string().max(1000).optional().allow('', null),
});

// Create new service request
const createServiceRequestSchema = Joi.object({
  items: Joi.array().items(serviceItemSchema).min(1).required().messages({
    'array.min': 'At least one service item is required',
  }),
  shop_id: Joi.number().integer().optional(), // Made optional, will use default
  media_ids: Joi.array().items(Joi.number().integer()).optional(),
  address_manual: Joi.string().required().messages({
    'string.empty': 'Address is required',
  }),
  gps_lat: Joi.number().min(-90).max(90).optional().allow(null),
  gps_lon: Joi.number().min(-180).max(180).optional().allow(null),
});


module.exports = {
  createServiceRequestSchema,
};


// Send quote schema
const sendQuoteSchema = Joi.object({
  quote_min: Joi.number().integer().min(0).required(),
  quote_max: Joi.number().integer().min(Joi.ref('quote_min')).required(),
  quote_note: Joi.string().optional(),
  voice_note_s3_key: Joi.string().optional()
});

// Assign delivery schema
const assignDeliverySchema = Joi.object({
  delivery_person_id: Joi.number().integer().required()
});

// Create delivery personnel schema
const createDeliveryPersonSchema = Joi.object({
  phone: phoneSchema,
  name: Joi.string().max(120).required()
});

// Media presign schema
const presignMediaSchema = Joi.object({
  filename: Joi.string().required(),
  contentType: Joi.string().required(),
  type: Joi.string().valid('image', 'video', 'voice').required(),
  request_id: Joi.number().integer().optional()
});

// Update registerMediaSchema to make request_id optional
const registerMediaSchema = Joi.object({
  s3_key: Joi.string().required(),
  type: Joi.string().valid('image', 'video', 'voice').required(),
  original_filename: Joi.string().max(255).required(),
  size_bytes: Joi.number().integer().max(104857600).required(), // 100MB
  duration_seconds: Joi.number().integer().optional()
});

// Mark pickup/delivery schema
const markPickupSchema = Joi.object({
  photo_s3_key: Joi.string().optional()
});

const markDeliveredSchema = Joi.object({
  photo_s3_key: Joi.string().optional(),
  notes: Joi.string().optional()
});

// Update customer profile schema
const updateProfileSchema = Joi.object({
  name: Joi.string().max(120).optional(),
  email: Joi.string().email().max(255).optional(),
  default_address: Joi.string().optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional()
}).min(1);

module.exports = {
  requestOtpSchema,
  verifyOtpCustomerSchema,
  verifyOtpDeliverySchema,
  createServiceRequestSchema,
  sendQuoteSchema,
  assignDeliverySchema,
  createDeliveryPersonSchema,
  presignMediaSchema,
  registerMediaSchema,
  markPickupSchema,
  markDeliveredSchema,
  updateProfileSchema
};
