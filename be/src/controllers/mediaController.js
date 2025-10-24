// controllers/mediaController.js
const Database = require('../models/db');
const S3Service = require('../services/s3Service');
const logger = require('../middlewares/logger');

class MediaController {
  // Generate presigned URL for upload
  static async generatePresignedUrl(req, res, next) {
    try {
      const { filename, contentType, type } = req.body;
      
      // Generate temporary S3 key (will be used for upload)
      const shopId = 1; // Default shop for now
      const tempRequestId = 'temp'; // Temporary, will be updated when request is created
      const s3Key = S3Service.generateS3Key(shopId, tempRequestId, type, filename);
      
      // Generate presigned URL
      const { presignedUrl, expiresIn } = await S3Service.generatePresignedUploadUrl(
        s3Key,
        contentType
      );
      
      res.json({
        presignedUrl,
        s3Key,
        expiresIn
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Register media after upload to S3
  static async registerMedia(req, res, next) {
    try {
      const { s3_key, type, original_filename, size_bytes, duration_seconds } = req.body;
      
      // Determine uploader type from auth
      let uploaderType = 'customer';
      if (req.user.role === 'admin') uploaderType = 'admin';
      else if (req.user.role === 'delivery') uploaderType = 'delivery';
      
      // Verify file exists in S3
      const metadata = await S3Service.getFileMetadata(s3_key);
      if (!metadata) {
        return res.status(400).json({
          error: {
            code: 'FILE_NOT_FOUND',
            message: 'File not found in S3. Please upload first.'
          }
        });
      }
      
      // Insert media record (without request_id initially)
      const mediaId = await Database.insert('media', {
        request_id: null, // Will be set when service request is created
        uploader_type: uploaderType,
        type,
        s3_key,
        original_filename,
        size_bytes,
        duration_seconds: duration_seconds || null,
        created_at: new Date()
      });
      
      // Get the created media record
      const media = await Database.queryOne(
        'SELECT * FROM media WHERE id = ?',
        [mediaId]
      );
      
      logger.info(`Media ${mediaId} registered by ${uploaderType} ${req.user.id}`);
      
      res.status(201).json({
        media
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Get media by request ID
  static async getMediaByRequest(req, res, next) {
    try {
      const { request_id } = req.params;
      
      // Get media records
      const mediaList = await Database.query(
        'SELECT * FROM media WHERE request_id = ? ORDER BY created_at ASC',
        [request_id]
      );
      
      // Generate presigned download URLs
      for (const media of mediaList) {
        media.url = await S3Service.generatePresignedDownloadUrl(media.s3_key);
      }
      
      res.json({
        media: mediaList
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Delete media (admin only)
  static async deleteMedia(req, res, next) {
    try {
      const { id } = req.params;
      
      // Get media record
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
      
      logger.info(`Media ${id} deleted by admin ${req.user.id}`);
      
      res.json({
        success: true
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = MediaController;