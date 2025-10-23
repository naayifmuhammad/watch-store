const Database = require('../models/db');
const S3Service = require('../services/s3Service');
const config = require('../config/env');
const logger = require('../middlewares/logger');

class MediaController {
  // Generate presigned upload URL
  static async generatePresignedUrl(req, res, next) {
    try {
      const { filename, contentType, type, request_id } = req.body;
      
      // Validate file type
      const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      const allowedAudioTypes = ['audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/wav'];
      
      let isValidType = false;
      
      if (type === 'image') {
        isValidType = allowedImageTypes.includes(contentType);
      } else if (type === 'video') {
        isValidType = allowedVideoTypes.includes(contentType);
      } else if (type === 'voice') {
        isValidType = allowedAudioTypes.includes(contentType);
      }
      
      if (!isValidType) {
        return res.status(400).json({
          error: {
            code: 'INVALID_FILE_TYPE',
            message: `Invalid content type for ${type}`
          }
        });
      }
      
      // Get shop ID (default to first shop for now)
      const shop = await Database.queryOne('SELECT id FROM shops LIMIT 1');
      
      if (!shop) {
        return res.status(500).json({
          error: {
            code: 'NO_SHOP',
            message: 'No shop configured'
          }
        });
      }
      
      // Generate S3 key
      const s3Key = S3Service.generateS3Key(
        shop.id,
        request_id || 'temp',
        type,
        filename
      );
      
      // Generate presigned URL
      const result = await S3Service.generatePresignedUploadUrl(
        s3Key,
        contentType
      );
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  
  // Register media after upload
  static async registerMedia(req, res, next) {
    try {
      const { s3_key, request_id, type, original_filename, size_bytes, duration_seconds } = req.body;
      
      // Validate file size
      if (size_bytes > config.maxMediaBytes) {
        return res.status(400).json({
          error: {
            code: 'FILE_TOO_LARGE',
            message: `File size exceeds maximum allowed size of ${config.maxMediaBytes} bytes`
          }
        });
      }
      
      // Validate duration for videos and voice notes
      if (type === 'video' && duration_seconds && duration_seconds > config.maxVideoDuration) {
        return res.status(400).json({
          error: {
            code: 'VIDEO_TOO_LONG',
            message: `Video duration exceeds maximum of ${config.maxVideoDuration} seconds`
          }
        });
      }
      
      if (type === 'voice' && duration_seconds && duration_seconds > config.maxVoiceDuration) {
        return res.status(400).json({
          error: {
            code: 'VOICE_TOO_LONG',
            message: `Voice note duration exceeds maximum of ${config.maxVoiceDuration} seconds`
          }
        });
      }
      
      // Determine uploader type from user role
      let uploaderType = 'customer';
      if (req.user.role === 'admin') {
        uploaderType = 'admin';
      } else if (req.user.role === 'delivery') {
        uploaderType = 'delivery';
      }
      
      // Insert media record
      const mediaId = await Database.insert('media', {
        request_id,
        uploader_type: uploaderType,
        type,
        s3_key,
        original_filename,
        size_bytes,
        duration_seconds: duration_seconds || null,
        created_at: new Date()
      });
      
      const media = await Database.queryOne(
        'SELECT * FROM media WHERE id = ?',
        [mediaId]
      );
      
      logger.info(`Media registered: ${s3_key}`);
      
      res.status(201).json({ media });
    } catch (error) {
      next(error);
    }
  }
  
  // Get media by request ID
  static async getMediaByRequest(req, res, next) {
    try {
      const { request_id } = req.params;
      
      // Verify user has access to this request
      let hasAccess = false;
      
      if (req.user.role === 'customer') {
        const request = await Database.queryOne(
          'SELECT id FROM service_requests WHERE id = ? AND customer_id = ?',
          [request_id, req.user.id]
        );
        hasAccess = !!request;
      } else if (req.user.role === 'admin') {
        hasAccess = true;
      } else if (req.user.role === 'delivery') {
        const request = await Database.queryOne(
          'SELECT id FROM service_requests WHERE id = ? AND delivery_person_id = ?',
          [request_id, req.user.id]
        );
        hasAccess = !!request;
      }
      
      if (!hasAccess) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied to this request'
          }
        });
      }
      
      // Get media
      const media = await Database.query(
        'SELECT * FROM media WHERE request_id = ? ORDER BY created_at DESC',
        [request_id]
      );
      
      // Generate signed URLs
      for (const m of media) {
        m.url = await S3Service.generatePresignedDownloadUrl(m.s3_key);
      }
      
      res.json({ media });
    } catch (error) {
      next(error);
    }
  }
  
  // Delete media (admin only)
  static async deleteMedia(req, res, next) {
    try {
      const { id } = req.params;
      
      const media = await Database.queryOne(
        'SELECT * FROM media WHERE id = ?',
        [id]
      );
      
      if (!media) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Media not found'
          }
        });
      }
      
      // Delete from S3
      await S3Service.deleteFile(media.s3_key);
      
      // Delete from database
      await Database.delete('media', 'id = ?', [id]);
      
      logger.info(`Media deleted: ${media.s3_key}`);
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = MediaController;
