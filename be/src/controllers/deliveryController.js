const Database = require('../models/db');
const S3Service = require('../services/s3Service');
const NotificationService = require('../services/notificationService');
const { SERVICE_REQUEST_STATUS } = require('../utils/constants');
const logger = require('../middlewares/logger');

class DeliveryController {
    // Get assigned deliveries
    static async getAssignments(req, res, next) {
        try {
            const deliveryPersonId = req.user.id;

            const assignments = await Database.query(
                `SELECT sr.*, 
                c.name as customer_name,
                c.phone as customer_phone,
                c.default_address as customer_address,
                s.name as shop_name,
                s.address as shop_address
         FROM service_requests sr
         LEFT JOIN customers c ON sr.customer_id = c.id
         LEFT JOIN shops s ON sr.shop_id = s.id
         WHERE sr.delivery_person_id = ?
         AND sr.status IN (?, ?, ?)
         ORDER BY sr.scheduled_pickup_at ASC, sr.created_at DESC`,
                [
                    deliveryPersonId,
                    SERVICE_REQUEST_STATUS.SCHEDULED,
                    SERVICE_REQUEST_STATUS.PICKED_UP,
                    SERVICE_REQUEST_STATUS.OUT_FOR_DELIVERY
                ]
            );

            res.json({ assignments });
        } catch (error) {
            next(error);
        }
    }

    // Get single service request detail (admin view)
  static async getDeliveryRequestDetail(req, res, next) {
    try {
      const { id } = req.params;
      const deliveryPersonId = req.user.id;
      
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
         WHERE sr.id = ? and sr.delivery_person_id = ?`,
        [id, deliveryPersonId]
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

    // Mark pickup
    static async markPickup(req, res, next) {
        try {
            const { request_id } = req.params;
            const deliveryPersonId = req.user.id;
            const { photo_s3_key } = req.body;

            // Verify assignment
            const request = await Database.queryOne(
                `SELECT sr.*, c.phone as customer_phone
         FROM service_requests sr
         LEFT JOIN customers c ON sr.customer_id = c.id
         WHERE sr.id = ? AND sr.delivery_person_id = ?`,
                [request_id, deliveryPersonId]
            );

            if (!request) {
                return res.status(404).json({
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Assignment not found'
                    }
                });
            }

            if (request.status !== SERVICE_REQUEST_STATUS.SCHEDULED) {
                return res.status(400).json({
                    error: {
                        code: 'INVALID_STATUS',
                        message: 'Request must be in scheduled status'
                    }
                });
            }

            // Update status
            await Database.update(
                'service_requests',
                {
                    status: SERVICE_REQUEST_STATUS.PICKED_UP,
                    updated_at: new Date()
                },
                'id = ?',
                [request_id]
            );

            // Save pickup photo if provided
            if (photo_s3_key) {
                await Database.insert('media', {
                    request_id,
                    uploader_type: 'delivery',
                    type: 'image',
                    s3_key: photo_s3_key,
                    original_filename: 'pickup_photo.jpg',
                    size_bytes: 0,
                    created_at: new Date()
                });
            }

            // Notify customer
            await NotificationService.sendPickupNotification(
                { phone: request.customer_phone },
                request_id
            );

            logger.info(`Request ${request_id} marked as picked up by delivery person ${deliveryPersonId}`);

            res.json({
                success: true,
                status: SERVICE_REQUEST_STATUS.PICKED_UP
            });
        } catch (error) {
            next(error);
        }
    }

    // Mark out for delivery
    static async markOutForDelivery(req, res, next) {
        try {
            const { request_id } = req.params;
            const deliveryPersonId = req.user.id;

            // Verify assignment
            const request = await Database.queryOne(
                'SELECT * FROM service_requests WHERE id = ? AND delivery_person_id = ?',
                [request_id, deliveryPersonId]
            );

            if (!request) {
                return res.status(404).json({
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Assignment not found'
                    }
                });
            }

            if (request.status !== SERVICE_REQUEST_STATUS.PAYMENT_RECEIVED) {
                return res.status(400).json({
                    error: {
                        code: 'INVALID_STATUS',
                        message: 'Request must be in payment_received status'
                    }
                });
            }

            // Update status
            await Database.update(
                'service_requests',
                {
                    status: SERVICE_REQUEST_STATUS.OUT_FOR_DELIVERY,
                    updated_at: new Date()
                },
                'id = ?',
                [request_id]
            );

            res.json({
                success: true,
                status: SERVICE_REQUEST_STATUS.OUT_FOR_DELIVERY
            });
        } catch (error) {
            next(error);
        }
    }

    // Mark delivered
    static async markDelivered(req, res, next) {
        try {
            const { request_id } = req.params;
            const deliveryPersonId = req.user.id;
            const { photo_s3_key, notes } = req.body;

            // Verify assignment
            const request = await Database.queryOne(
                `SELECT sr.*, c.phone as customer_phone
         FROM service_requests sr
         LEFT JOIN customers c ON sr.customer_id = c.id
         WHERE sr.id = ? AND sr.delivery_person_id = ?`,
                [request_id, deliveryPersonId]
            );

            if (!request) {
                return res.status(404).json({
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Assignment not found'
                    }
                });
            }

            if (request.status !== SERVICE_REQUEST_STATUS.OUT_FOR_DELIVERY) {
                return res.status(400).json({
                    error: {
                        code: 'INVALID_STATUS',
                        message: 'Request must be in out_for_delivery status'
                    }
                });
            }

            // Update status
            await Database.update(
                'service_requests',
                {
                    status: SERVICE_REQUEST_STATUS.DELIVERED,
                    updated_at: new Date()
                },
                'id = ?',
                [request_id]
            );

            // Save delivery photo if provided
            if (photo_s3_key) {
                await Database.insert('media', {
                    request_id,
                    uploader_type: 'delivery',
                    type: 'image',
                    s3_key: photo_s3_key,
                    original_filename: 'delivery_photo.jpg',
                    size_bytes: 0,
                    created_at: new Date()
                });
            }

            // Notify customer
            await NotificationService.sendDeliveryNotification(
                { phone: request.customer_phone },
                request_id
            );

            logger.info(`Request ${request_id} marked as delivered by delivery person ${deliveryPersonId}`);

            res.json({
                success: true,
                status: SERVICE_REQUEST_STATUS.DELIVERED
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = DeliveryController;
