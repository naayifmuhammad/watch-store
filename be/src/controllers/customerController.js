const Database = require('../models/db');

const GeocodingService = require('../services/geocodingService');

class CustomerController {
  // Get customer profile
  static async getProfile(req, res, next) {
    try {
      const customerId = req.user.id;
      
      const customer = await Database.queryOne(
        'SELECT id, phone, name, email, default_address, latitude, longitude, created_at FROM customers WHERE id = ?',
        [customerId]
      );
      
      if (!customer) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Customer not found'
          }
        });
      }
      
      res.json({ customer });
    } catch (error) {
      next(error);
    }
  }
  
  // Update customer profile
  static async updateProfile(req, res, next) {
    try {
      const customerId = req.user.id;
      const { name, email, default_address, latitude, longitude } = req.body;
      
      const updateData = {
        updated_at: new Date()
      };
      
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (default_address !== undefined) updateData.default_address = default_address;
      if (latitude !== undefined) updateData.latitude = latitude;
      if (longitude !== undefined) updateData.longitude = longitude;
      
      await Database.update(
        'customers',
        updateData,
        'id = ?',
        [customerId]
      );
      
      const customer = await Database.queryOne(
        'SELECT id, phone, name, email, default_address, latitude, longitude FROM customers WHERE id = ?',
        [customerId]
      );
      
      res.json({ customer });
    } catch (error) {
      next(error);
    }
  }
  
  // Get service categories
  static async getCategories(req, res, next) {
    try {
      const categories = [
        { value: 'watch', label: 'Watch' },
        { value: 'clock', label: 'Clock' },
        { value: 'timepiece', label: 'Timepiece' },
        { value: 'smart_wearable', label: 'Smart Wearable' },
        { value: 'custom', label: 'Custom' }
      ];
      
      res.json({ categories });
    } catch (error) {
      next(error);
    }
  }
  static async reverseGeocode(req, res, next) {
    try {
      const { lat, lon } = req.query;

      if (!lat || !lon) {
        return res.status(400).json({
          error: {
            code: 'MISSING_COORDINATES',
            message: 'Latitude and longitude are required'
          }
        });
      }

      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);

      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_COORDINATES',
            message: 'Invalid latitude or longitude'
          }
        });
      }

      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({
          error: {
            code: 'OUT_OF_RANGE',
            message: 'Coordinates out of valid range'
          }
        });
      }

      const address = await GeocodingService.getAddressFromCoordinates(latitude, longitude);

      if (!address) {
        return res.json({
          address: null,
          message: 'Could not determine address from coordinates'
        });
      }

      res.json({
        address,
        lat: latitude,
        lon: longitude
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CustomerController;