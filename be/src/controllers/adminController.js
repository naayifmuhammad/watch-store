const Database = require('../models/db');
const S3Service = require('../services/s3Service');
const NotificationService = require('../services/notificationService');
const { SERVICE_REQUEST_STATUS } = require('../utils/constants');
const logger = require('../middlewares/logger');

class AdminController {
  // Get all service requests (with filters)
  static async getServiceRequests(req, res, next) {
    try {
      const { status, shop_id, page = 1, limit = 20 } = req.query;
      
      let sql = `
        SELECT sr.*, 
               c.name as customer_name, 
               c.phone as customer_phone,
               s.name as shop_name,
               dp.name as delivery_person_name,
               COUNT(DISTINCT si.id) as items_count
        FROM service_requests sr
        LEFT JOIN customers c ON sr.customer_id = c.id
        LEFT JOIN shops s ON sr.shop_id = s.id
        LEFT JOIN delivery_personnel dp ON sr.delivery_person_id = dp.id
        LEFT JOIN service_items si ON sr.id = si.request_id
        WHERE 1=1
      `;
      
      const params = [];
      
      if (status) {
        sql += ' AND sr.status = ?';
        params.push(status);
      }
      
      if (shop_id) {
        sql += ' AND sr.shop_id = ?';
        params.push(shop_id);
      }
      
      sql += ' GROUP BY sr.id ORDER BY sr.created_at DESC';
      
      // Pagination
      const offset = (page - 1) * limit;
      sql += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);
      
      const requests = await Database.query(sql, params);
      
      // Get total count
      let countSql = 'SELECT COUNT(*) as total FROM service_requests WHERE 1=1';
      const countParams = [];
      
      if (status) {
        countSql += ' AND status = ?';
        countParams.push(status);
      }
      
      if (shop_id) {
        countSql += ' AND shop_id = ?';
        countParams.push(shop_id);
      }
      
      const [{ total }] = await Database.query(countSql, countParams);
      
      res.json({
        requests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Get single service request detail (admin view)
  static async getServiceRequestDetail(req, res, next) {
    try {
      const { id } = req.params;
      
      // Get request with customer info
      const request = await Database.queryOne(
        `SELECT sr.*, 
                c.name as customer_name, 
                c.phone as customer_phone,
                c.email as customer_email,
                c.default_address as customer_default_address,
                s.name as shop_name,
                dp.name as delivery_person_name,
                dp.phone as delivery_person_phone
         FROM service_requests sr
         LEFT JOIN customers c ON sr.customer_id = c.id
         LEFT JOIN shops s ON sr.shop_id = s.id
         LEFT JOIN delivery_personnel dp ON sr.delivery_person_id = dp.id
         WHERE sr.id = ?`,
        [id]
      );
      
      if (!request) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Service request not found'
          }
        });
      }
      
      // Get items
      const items = await Database.query(
        'SELECT * FROM service_items WHERE request_id = ?',
        [id]
      );
      
      // Get media with signed URLs
      const media = await Database.query(
        'SELECT * FROM media WHERE request_id = ?',
        [id]
      );
      
      for (const m of media) {
        m.url = await S3Service.generatePresignedDownloadUrl(m.s3_key);
      }
      
      // Generate signed URL for quote voice note if exists
      if (request.quote_voice_s3_key) {
        request.quote_voice_url = await S3Service.generatePresignedDownloadUrl(
          request.quote_voice_s3_key
        );
      }
      
      res.json({
        request,
        items,
        media
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Send quote
  static async sendQuote(req, res, next) {
    try {
      const { id } = req.params;
      const { quote_min, quote_max, quote_note, voice_note_s3_key } = req.body;
      
      // Get request with customer info
      const request = await Database.queryOne(
        `SELECT sr.*, c.phone as customer_phone, c.name as customer_name
         FROM service_requests sr
         LEFT JOIN customers c ON sr.customer_id = c.id
         WHERE sr.id = ?`,
        [id]
      );
      
      if (!request) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Service request not found'
          }
        });
      }
      
      // Update request with quote
      await Database.update(
        'service_requests',
        {
          quote_min,
          quote_max,
          quote_note: quote_note || null,
          quote_voice_s3_key: voice_note_s3_key || null,
          status: SERVICE_REQUEST_STATUS.QUOTED,
          updated_at: new Date()
        },
        'id = ?',
        [id]
      );
      
      // Send notification to customer
      await NotificationService.sendQuoteNotification(
        { phone: request.customer_phone, name: request.customer_name },
        id,
        quote_min,
        quote_max
      );
      
      logger.info(`Quote sent for request ${id}: ₹${quote_min} - ₹${quote_max}`);
      
      res.json({
        success: true,
        status: SERVICE_REQUEST_STATUS.QUOTED
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Confirm order (mark as accepted)
  static async confirmOrder(req, res, next) {
    try {
      const { id } = req.params;
      const { scheduled_pickup_at } = req.body;
      
      const request = await Database.queryOne(
        'SELECT * FROM service_requests WHERE id = ?',
        [id]
      );
      
      if (!request) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Service request not found'
          }
        });
      }
      
      const updateData = {
        status: scheduled_pickup_at ? SERVICE_REQUEST_STATUS.SCHEDULED : SERVICE_REQUEST_STATUS.ACCEPTED,
        updated_at: new Date()
      };
      
      if (scheduled_pickup_at) {
        updateData.scheduled_pickup_at = new Date(scheduled_pickup_at);
      }
      
      await Database.update(
        'service_requests',
        updateData,
        'id = ?',
        [id]
      );
      
      // Notify customer if scheduled
      if (scheduled_pickup_at) {
        const customer = await Database.queryOne(
          'SELECT phone FROM customers WHERE id = ?',
          [request.customer_id]
        );
        
        if (customer) {
          await NotificationService.sendScheduledPickupNotification(
            customer,
            id,
            new Date(scheduled_pickup_at).toLocaleString()
          );
        }
      }
      
      res.json({
        success: true,
        status: updateData.status
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Assign delivery person
  static async assignDelivery(req, res, next) {
    try {
      const { id } = req.params;
      const { delivery_person_id } = req.body;
      
      // Verify delivery person exists and is active
      const deliveryPerson = await Database.queryOne(
        'SELECT * FROM delivery_personnel WHERE id = ? AND active = 1',
        [delivery_person_id]
      );
      
      if (!deliveryPerson) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Delivery person not found or inactive'
          }
        });
      }
      
      // Verify request exists
      const request = await Database.queryOne(
        'SELECT * FROM service_requests WHERE id = ?',
        [id]
      );
      
      if (!request) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Service request not found'
          }
        });
      }
      
      // Assign delivery person
      await Database.update(
        'service_requests',
        {
          delivery_person_id,
          updated_at: new Date()
        },
        'id = ?',
        [id]
      );
      
      logger.info(`Delivery person ${delivery_person_id} assigned to request ${id}`);
      
      res.json({
        success: true,
        delivery_person: {
          id: deliveryPerson.id,
          name: deliveryPerson.name
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Mark as received at shop
  static async markReceived(req, res, next) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      
      await Database.update(
        'service_requests',
        {
          status: SERVICE_REQUEST_STATUS.RECEIVED_SHOP,
          updated_at: new Date()
        },
        'id = ?',
        [id]
      );
      
      res.json({
        success: true,
        status: SERVICE_REQUEST_STATUS.RECEIVED_SHOP
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Mark as in repair
  static async markInRepair(req, res, next) {
    try {
      const { id } = req.params;
      
      await Database.update(
        'service_requests',
        {
          status: SERVICE_REQUEST_STATUS.IN_REPAIR,
          updated_at: new Date()
        },
        'id = ?',
        [id]
      );
      
      res.json({
        success: true,
        status: SERVICE_REQUEST_STATUS.IN_REPAIR
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Mark as ready for payment
  static async markReadyForPayment(req, res, next) {
    try {
      const { id } = req.params;
      
      await Database.update(
        'service_requests',
        {
          status: SERVICE_REQUEST_STATUS.READY_FOR_PAYMENT,
          updated_at: new Date()
        },
        'id = ?',
        [id]
      );
      
      res.json({
        success: true,
        status: SERVICE_REQUEST_STATUS.READY_FOR_PAYMENT
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Mark payment received
  static async markPaid(req, res, next) {
    try {
      const { id } = req.params;
      
      await Database.update(
        'service_requests',
        {
          status: SERVICE_REQUEST_STATUS.PAYMENT_RECEIVED,
          updated_at: new Date()
        },
        'id = ?',
        [id]
      );
      
      res.json({
        success: true,
        status: SERVICE_REQUEST_STATUS.PAYMENT_RECEIVED
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Create delivery personnel
  static async createDeliveryPerson(req, res, next) {
    try {
      const { phone, name } = req.body;
      
      // Check if already exists
      const existing = await Database.queryOne(
        'SELECT * FROM delivery_personnel WHERE phone = ?',
        [phone]
      );
      
      if (existing) {
        return res.status(400).json({
          error: {
            code: 'ALREADY_EXISTS',
            message: 'Delivery person with this phone already exists'
          }
        });
      }
      
      const id = await Database.insert('delivery_personnel', {
        phone,
        name,
        active: 1,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      const deliveryPerson = await Database.queryOne(
        'SELECT id, phone, name, active FROM delivery_personnel WHERE id = ?',
        [id]
      );
      
      res.status(201).json({
        delivery_person: deliveryPerson
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Get all delivery personnel
  static async getDeliveryPersonnel(req, res, next) {
    try {
      const { active } = req.query;
      
      let sql = 'SELECT id, phone, name, active, created_at FROM delivery_personnel';
      const params = [];
      
      if (active !== undefined) {
        sql += ' WHERE active = ?';
        params.push(active === 'true' ? 1 : 0);
      }
      
      sql += ' ORDER BY name ASC';
      
      const personnel = await Database.query(sql, params);
      
      res.json({ personnel });
    } catch (error) {
      next(error);
    }
  }
  
  // Toggle delivery person active status
  static async toggleDeliveryPersonStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { active } = req.body;
      
      await Database.update(
        'delivery_personnel',
        {
          active: active ? 1 : 0,
          updated_at: new Date()
        },
        'id = ?',
        [id]
      );
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
  
  // Get shops
  static async getShops(req, res, next) {
    try {
      const shops = await Database.query(
        'SELECT * FROM shops ORDER BY created_at DESC'
      );
      
      res.json({ shops });
    } catch (error) {
      next(error);
    }
  }
  
  // Create shop
  static async createShop(req, res, next) {
    try {
      const { name, address, phone } = req.body;
      
      const id = await Database.insert('shops', {
        name,
        address,
        phone,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      const shop = await Database.queryOne(
        'SELECT * FROM shops WHERE id = ?',
        [id]
      );
      
      res.status(201).json({ shop });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AdminController;
