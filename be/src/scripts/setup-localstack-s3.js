const AWS = require('aws-sdk');

// Configure for LocalStack
const s3 = new AWS.S3({
  endpoint: 'http://localhost:4566',
  accessKeyId: 'test',
  secretAccessKey: 'test',
  region: 'us-east-1',
  s3ForcePathStyle: true
});

async function setupBucket() {
  const bucketName = 'watch-store-media-local';

  try {
    // Check if bucket exists
    await s3.headBucket({ Bucket: bucketName }).promise();
    console.log(`✅ Bucket ${bucketName} already exists`);
  } catch (error) {
    if (error.statusCode === 404) {
      // Create bucket
      await s3.createBucket({ Bucket: bucketName }).promise();
      console.log(`✅ Created bucket: ${bucketName}`);
    } else {
      throw error;
    }
  }

  // Set bucket CORS for local development
  await s3.putBucketCors({
    Bucket: bucketName,
    CORSConfiguration: {
      CORSRules: [{
        AllowedHeaders: ['*'],
        AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE'],
        AllowedOrigins: ['*'],
        ExposeHeaders: ['ETag']
      }]
    }
  }).promise();

  console.log('✅ CORS configured');
}

setupBucket()
  .then(() => {
    console.log('\n🎉 LocalStack S3 setup complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Setup failed:', err);
    process.exit(1);
  });