// controllers/serviceRequestController.js
const Database = require('../models/db');
const GeocodingService = require('../services/geocodingService');
const S3Service = require('../services/s3Service');
const NotificationService = require('../services/notificationService');
const { SERVICE_REQUEST_STATUS } = require('../utils/constants');
const logger = require('../middlewares/logger');

class ServiceRequestController {
  // Create service request (customer)
  static async create(req, res, next) {
    let connection; // CHANGE 1: Declare outside try block

    try {
      connection = await Database.getConnection();
      await connection.beginTransaction();

      const customerId = req.user.id;
      const {
        items,
        media_ids,
        address_manual,
        gps_lat,
        gps_lon
      } = req.body;

      logger.info('Creating service request', { customerId, items, media_ids }); // CHANGE 2: Add logging

      // Validate required fields
      if (!address_manual) {
        await connection.rollback();
        return res.status(400).json({
          error: {
            code: 'MISSING_ADDRESS',
            message: 'Address is required'
          }
        });
      }

      if (!items || items.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          error: {
            code: 'NO_ITEMS',
            message: 'At least one service item is required'
          }
        });
      }

      // CHANGE 3: Fix shop query to work with connection
      const [shops] = await connection.query('SELECT id FROM shops LIMIT 1');
      const shop = shops[0];

      if (!shop) {
        await connection.rollback();
        return res.status(500).json({
          error: {
            code: 'NO_SHOP',
            message: 'No shop configured'
          }
        });
      }

      // Create service request
      const [requestResult] = await connection.query(
        `INSERT INTO service_requests (
          shop_id, 
          customer_id, 
          status, 
          description,
          address_manual,
          gps_lat, 
          gps_lon, 
          created_at, 
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          shop.id,
          customerId,
          SERVICE_REQUEST_STATUS.REQUESTED,
          null, // Optional description at request level
          address_manual,
          gps_lat || null,
          gps_lon || null
        ]
      );

      const requestId = requestResult.insertId;
      logger.info('Service request created', { requestId }); // CHANGE 4: Add logging

      // Create service items
      for (const item of items) {
        await connection.query(
          `INSERT INTO service_items (
            request_id, 
            category, 
            title, 
            problem_description, 
            created_at, 
            updated_at
          ) VALUES (?, ?, ?, ?, NOW(), NOW())`,
          [
            requestId,
            item.category,
            item.title || null,
            item.description || null
          ]
        );
      }
      logger.info('Service items created', { count: items.length }); // CHANGE 5: Add logging

      // Link media to this request
      if (media_ids && media_ids.length > 0) {
        for (const mediaId of media_ids) {
          // CHANGE 6: Fix media query result destructuring
          const [mediaRows] = await connection.query(
            'SELECT * FROM media WHERE id = ? AND uploader_type = ?',
            [mediaId, 'customer']
          );

          if (mediaRows.length === 0) { // CHANGE 7: Check mediaRows.length
            logger.warn('Media not found', { mediaId }); // CHANGE 8: Add logging
            await connection.rollback();
            return res.status(400).json({
              error: {
                code: 'INVALID_MEDIA',
                message: `Media ID ${mediaId} not found or not owned by you`
              }
            });
          }

          const media = mediaRows[0]; // CHANGE 9: Get first row

          // Update media with request_id
          await connection.query(
            'UPDATE media SET request_id = ? WHERE id = ?',
            [requestId, mediaId]
          );

          // Update S3 key to include actual request_id
          const oldKey = media.s3_key;
          const newKey = oldKey.replace('/temp/', `/${requestId}/`);



          try {
            await S3Service.moveFile(oldKey, newKey);
            logger.info(`✅ Moved media file: ${oldKey} -> ${newKey}`);
          } catch (s3Error) {
            logger.error('❌ S3 file move failed:', s3Error);
            await connection.rollback();
            return res.status(500).json({
              error: {
                code: 'S3_ERROR',
                message: 'Failed to move media file in storage'
              }
            });
          }

          // Update database with new key and request_id
          await connection.query(
            'UPDATE media SET s3_key = ?, request_id = ? WHERE id = ?',
            [newKey, requestId, mediaId]
          );
        }
        logger.info('Media linked', { count: media_ids.length });
      }

      await connection.commit();
      logger.info(`Service request ${requestId} created successfully by customer ${customerId}`);

      // CHANGE 11: Make notification non-blocking
      setImmediate(async () => {
        try {
          const admin = await Database.queryOne('SELECT phone FROM admins LIMIT 1');
          if (admin) {
            await NotificationService.sendNewRequestNotification(admin.phone, requestId);
          }
        } catch (notificationError) {
          logger.error('Failed to send notification (non-critical):', notificationError);
        }
      });

      res.status(201).json({
        success: true,
        id: requestId,
        status: SERVICE_REQUEST_STATUS.REQUESTED
      });
    } catch (error) {
      logger.error('Error creating service request:', error); // CHANGE 12: Log before rollback
      if (connection) { // CHANGE 13: Check if connection exists
        try {
          await connection.rollback();
        } catch (rollbackError) {
          logger.error('Rollback failed:', rollbackError); // CHANGE 14: Log rollback errors
        }
      }
      next(error);
    } finally {
      if (connection) { // CHANGE 15: Check if connection exists before releasing
        connection.release();
      }
    }
  }

  // Get customer's service requests
  static async getCustomerRequests(req, res, next) {
    try {
      const customerId = req.user.id;

      const requests = await Database.query(
        `SELECT sr.*, 
                COUNT(DISTINCT si.id) as items_count,
                COUNT(DISTINCT m.id) as media_count
         FROM service_requests sr
         LEFT JOIN service_items si ON sr.id = si.request_id
         LEFT JOIN media m ON sr.id = m.request_id
         WHERE sr.customer_id = ?
         GROUP BY sr.id
         ORDER BY sr.created_at DESC`,
        [customerId]
      );

      res.json({ requests });
    } catch (error) {
      next(error);
    }
  }

  // Get single service request detail
  static async getRequestDetail(req, res, next) {
    try {
      const { id } = req.params;
      const customerId = req.user.id;

      // Get request
      const request = await Database.queryOne(
        'SELECT * FROM service_requests WHERE id = ? AND customer_id = ?',
        [id, customerId]
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

      // Generate signed URLs for media
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

  // Accept quote (customer)
  static async acceptQuote(req, res, next) {
    try {
      const { id } = req.params;
      const customerId = req.user.id;
      const { accept } = req.body;

      if (!accept) {
        return res.status(400).json({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Accept must be true'
          }
        });
      }

      // Get request
      const request = await Database.queryOne(
        'SELECT * FROM service_requests WHERE id = ? AND customer_id = ?',
        [id, customerId]
      );

      if (!request) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Service request not found'
          }
        });
      }

      if (request.status !== SERVICE_REQUEST_STATUS.QUOTED) {
        return res.status(400).json({
          error: {
            code: 'INVALID_STATUS',
            message: 'Request must be in quoted status'
          }
        });
      }

      if (!request.quote_min || !request.quote_max) {
        return res.status(400).json({
          error: {
            code: 'NO_QUOTE',
            message: 'No quote available for this request'
          }
        });
      }

      // Update status to accepted
      await Database.update(
        'service_requests',
        {
          status: SERVICE_REQUEST_STATUS.ACCEPTED,
          updated_at: new Date()
        },
        'id = ?',
        [id]
      );

      // CHANGE 16: Make notification non-blocking
      setImmediate(async () => {
        try {
          const admin = await Database.queryOne('SELECT phone FROM admins LIMIT 1');
          if (admin) {
            await NotificationService.sendQuoteAcceptedNotification(admin.phone, id);
          }
        } catch (notificationError) {
          logger.error('Failed to send notification (non-critical):', notificationError);
        }
      });

      res.json({
        success: true,
        status: SERVICE_REQUEST_STATUS.ACCEPTED
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ServiceRequestController;