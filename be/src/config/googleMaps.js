const axios = require('axios');
const config = require('./env');

const GEOCODE_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

const reverseGeocode = async (lat, lon) => {
  try {
    const response = await axios.get(GEOCODE_API_URL, {
      params: {
        latlng: `${lat},${lon}`,
        key: config.googleMapsApiKey
      }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      return response.data.results[0].formatted_address;
    }
    
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error.message);
    return null;
  }
};

module.exports = {
  reverseGeocode
};
