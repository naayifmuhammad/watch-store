const { reverseGeocode } = require('../config/googleMaps');
const logger = require('../middlewares/logger');

class GeocodingService {
  static async getAddressFromCoordinates(lat, lon) {
    try {
      const address = await reverseGeocode(lat, lon);
      return address;
    } catch (error) {
      logger.error('Geocoding error:', error);
      return null;
    }
  }
}

module.exports = GeocodingService;
