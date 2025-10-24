const AWS = require('aws-sdk');
const config = require('./env');

// Configure AWS SDK
const s3Config = {
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  region: config.aws.region
};

// Add LocalStack endpoint for development
if (process.env.AWS_ENDPOINT) {
  s3Config.endpoint = process.env.AWS_ENDPOINT;
  s3Config.s3ForcePathStyle = true; // Required for LocalStack
}

AWS.config.update(s3Config);

const s3 = new AWS.S3();

module.exports = {
  s3,
  bucket: config.aws.s3Bucket
};