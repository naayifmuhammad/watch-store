const Database = require('../models/db');

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
}

module.exports = CustomerController;