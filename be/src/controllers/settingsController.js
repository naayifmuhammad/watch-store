const config = require('../config/env');
const logger = require('../middlewares/logger');

// In-memory settings (in production, use database)
let settings = {
  notificationsEnabled: config.notificationsEnabled,
  maxMediaBytes: config.maxMediaBytes,
  maxVideoDuration: config.maxVideoDuration,
  maxVoiceDuration: config.maxVoiceDuration
};

class SettingsController {
  // Get settings
  static async getSettings(req, res, next) {
    try {
      res.json({ settings });
    } catch (error) {
      next(error);
    }
  }
  
  // Update settings
  static async updateSettings(req, res, next) {
    try {
      const updates = req.body;
      
      // Validate and update allowed settings
      if (updates.notificationsEnabled !== undefined) {
        settings.notificationsEnabled = Boolean(updates.notificationsEnabled);
        config.notificationsEnabled = settings.notificationsEnabled;
        logger.info(`Notifications ${settings.notificationsEnabled ? 'enabled' : 'disabled'}`);
      }
      
      if (updates.maxMediaBytes !== undefined) {
        settings.maxMediaBytes = parseInt(updates.maxMediaBytes);
      }
      
      if (updates.maxVideoDuration !== undefined) {
        settings.maxVideoDuration = parseInt(updates.maxVideoDuration);
      }
      
      if (updates.maxVoiceDuration !== undefined) {
        settings.maxVoiceDuration = parseInt(updates.maxVoiceDuration);
      }
      
      res.json({ settings });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SettingsController;
