const { s3, bucket } = require('../config/s3');
const { v4: uuidv4 } = require('uuid');
const logger = require('../middlewares/logger');

class S3Service {
  static generateS3Key(shopId, requestId, type, filename) {
    const uuid = uuidv4();
    const extension = filename.split('.').pop();
    const folder = type === 'image' ? 'images' : type === 'video' ? 'videos' : 'audio';
    
    return `shops/${shopId}/requests/${requestId}/${folder}/${uuid}.${extension}`;
  }
  
  static async generatePresignedUploadUrl(s3Key, contentType, expiresIn = 900) {
    try {
      const params = {
        Bucket: bucket,
        Key: s3Key,
        ContentType: contentType,
        Expires: expiresIn
      };
      
      const url = await s3.getSignedUrlPromise('putObject', params);
      
      return {
        presignedUrl: url,
        s3Key,
        expiresIn
      };
    } catch (error) {
      logger.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate upload URL');
    }
  }
  
  static async generatePresignedDownloadUrl(s3Key, expiresIn = 3600) {
    try {
      const params = {
        Bucket: bucket,
        Key: s3Key,
        Expires: expiresIn
      };
      
      const url = await s3.getSignedUrlPromise('getObject', params);
      return url;
    } catch (error) {
      logger.error('Error generating download URL:', error);
      throw new Error('Failed to generate download URL');
    }
  }
  
  static async deleteFile(s3Key) {
    try {
      const params = {
        Bucket: bucket,
        Key: s3Key
      };
      
      await s3.deleteObject(params).promise();
      return true;
    } catch (error) {
      logger.error('Error deleting file:', error);
      return false;
    }
  }
  
  static async getFileMetadata(s3Key) {
    try {
      const params = {
        Bucket: bucket,
        Key: s3Key
      };
      
      const metadata = await s3.headObject(params).promise();
      return metadata;
    } catch (error) {
      logger.error('Error getting file metadata:', error);
      return null;
    }
  }
  static async copyFile(sourceKey, destinationKey) {
  const params = {
    Bucket: bucket,
    CopySource: `${bucket}/${sourceKey}`,
    Key: destinationKey
  };

  try {
    await s3.copyObject(params).promise();
    logger.info(`✅ Copied S3 file: ${sourceKey} -> ${destinationKey}`);
    return true;
  } catch (error) {
    logger.error(`❌ Failed to copy S3 file:`, error);
    throw error;
  }
}


  /**
   * Delete file from S3
   */
  static async deleteFile(s3Key) {
  const params = {
    Bucket: bucket, // fix here too
    Key: s3Key
  };

  try {
    await s3.deleteObject(params).promise();
    logger.info(`✅ Deleted S3 file: ${s3Key}`);
    return true;
  } catch (error) {
    logger.error(`❌ Failed to delete S3 file:`, error);
    throw error;
  }
}


  /**
   * Move file within S3 (copy + delete)
   */
  static async moveFile(sourceKey, destinationKey) {
    await this.copyFile(sourceKey, destinationKey);
    await this.deleteFile(sourceKey);
    logger.info(`✅ Moved S3 file: ${sourceKey} -> ${destinationKey}`);
  }

}

module.exports = S3Service;
