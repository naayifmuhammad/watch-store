const { verifyToken } = require('../utils/jwt');
const { ROLES } = require('../utils/constants');

const authenticate = (role) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'No token provided'
          }
        });
      }
      
      const token = authHeader.substring(7);
      
      try {
        const decoded = verifyToken(token, role);
        
        // Attach user info to request
        req.user = {
          id: decoded.sub,
          role: decoded.role,
          phone: decoded.phone
        };
        
        // Verify role matches
        if (req.user.role !== role) {
          return res.status(403).json({
            error: {
              code: 'FORBIDDEN',
              message: 'Invalid token for this resource'
            }
          });
        }
        
        next();
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({
            error: {
              code: 'TOKEN_EXPIRED',
              message: 'Token has expired'
            }
          });
        }
        
        return res.status(401).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid token'
          }
        });
      }
    } catch (error) {
      next(error);
    }
  };
};

const authenticateCustomer = authenticate(ROLES.CUSTOMER);
const authenticateDelivery = authenticate(ROLES.DELIVERY);
const authenticateAdmin = authenticate(ROLES.ADMIN);

module.exports = {
  authenticateCustomer,
  authenticateDelivery,
  authenticateAdmin
};
