const Database = require('../models/db');
const GeocodingService = require('../services/geocodingService');
const S3Service = require('../services/s3Service');
const NotificationService = require('../services/notificationService');
const { SERVICE_REQUEST_STATUS } = require('../utils/constants');
const logger = require('../middlewares/logger');

class ServiceRequestController {
    // Create service request (customer)
    static async create(req, res, next) {
        try {
            const customerId = req.user.id;
            const {
                categories,
                items,
                description,
                images,
                videos,
                voice_note,
                address_manual,
                gps_lat,
                gps_lon
            } = req.body;

            // Get default shop (for now, first shop)
            const shop = await Database.queryOne('SELECT id FROM shops LIMIT 1');

            if (!shop) {
                return res.status(500).json({
                    error: {
                        code: 'NO_SHOP',
                        message: 'No shop configured'
                    }
                });
            }

            // Reverse geocode if GPS provided
            let geocodedAddress = null;
            if (gps_lat && gps_lon) {
                geocodedAddress = await GeocodingService.getAddressFromCoordinates(gps_lat, gps_lon);
            }

            // Create service request
            const requestId = await Database.insert('service_requests', {
                shop_id: shop.id,
                customer_id: customerId,
                status: SERVICE_REQUEST_STATUS.REQUESTED,
                description,
                gps_lat: gps_lat || null,
                gps_lon: gps_lon || null,
                address_manual,
                created_at: new Date(),
                updated_at: new Date()
            });

            // Create service items
            for (const item of items) {
                await Database.insert('service_items', {
                    request_id: requestId,
                    category: item.category,
                    title: item.title || null,
                    problem_description: item.problem_description || null,
                    created_at: new Date(),
                    updated_at: new Date()
                });
            }

            // Link media to request
            const allMedia = [
                ...(images || []),
                ...(videos || []),
                ...(voice_note ? [voice_note] : [])
            ];

            if (allMedia.length > 0) {
                for (const s3Key of allMedia) {
                    // Update media record with request_id
                    await Database.update(
                        'media',
                        { request_id: requestId },
                        's3_key = ?',
                        [s3Key]
                    );
                }
            }

            logger.info(`Service request ${requestId} created by customer ${customerId}`);

            res.status(201).json({
                id: requestId,
                status: SERVICE_REQUEST_STATUS.REQUESTED
            });
        } catch (error) {
            next(error);
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

            // Notify admin (get first admin for now)
            const admin = await Database.queryOne('SELECT phone FROM admins LIMIT 1');
            if (admin) {
                await NotificationService.sendQuoteAcceptedNotification(admin.phone, id);
            }

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
