const AWS = require('aws-sdk');
const config = require('./env');

AWS.config.update({
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  region: config.aws.region
});

const s3 = new AWS.S3();

module.exports = {
  s3,
  bucket: config.aws.s3Bucket
};
