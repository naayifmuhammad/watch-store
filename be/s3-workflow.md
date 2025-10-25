┌─────────────┐
│  Customer   │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. Select images/videos/audio
       │
       ▼
┌─────────────────────────────────────────────────────┐
│  Step 1: Get Presigned URLs                         │
└─────────────────────────────────────────────────────┘
       │
       │ POST /api/media/presign
       │ Body: { filename, contentType, type }
       │
       ▼
┌──────────────────────────────────────┐
│  Backend: mediaController.js         │
│  - generatePresignedUrl()            │
└──────────────────────────────────────┘
       │
       │ Generates temp S3 key:
       │ "shops/1/requests/temp/images/uuid.jpg"
       │                    ^^^^
       │                    placeholder
       │
       ▼
┌──────────────────────────────────────┐
│  Backend: S3Service                  │
│  - generatePresignedUploadUrl()      │
└──────────────────────────────────────┘
       │
       │ AWS SDK generates signed URL valid for 15 mins
       │
       ▼
       │ Returns:
       │ {
       │   presignedUrl: "http://localhost:4566/...",
       │   s3Key: "shops/1/requests/temp/images/uuid.jpg",
       │   expiresIn: 900
       │ }
       │
       ▼
┌─────────────────────────────────────────────────────┐
│  Step 2: Upload Directly to S3                      │
└─────────────────────────────────────────────────────┘
       │
       │ PUT to presignedUrl
       │ Body: <binary file data>
       │ Headers: { Content-Type: "image/jpeg" }
       │
       ▼
┌──────────────────────────────────────┐
│  LocalStack S3                       │
│  File stored at:                     │
│  shops/1/requests/temp/images/uuid.jpg
└──────────────────────────────────────┘
       │
       │ ✅ File uploaded to S3
       │
       ▼
┌─────────────────────────────────────────────────────┐
│  Step 3: Register Media in Database                 │
└─────────────────────────────────────────────────────┘
       │
       │ POST /api/media
       │ Body: {
       │   s3_key: "shops/1/requests/temp/images/uuid.jpg",
       │   type: "image",
       │   original_filename: "photo.jpg",
       │   size_bytes: 123456
       │ }
       │
       ▼
┌──────────────────────────────────────┐
│  Backend: mediaController.js         │
│  - registerMedia()                   │
└──────────────────────────────────────┘
       │
       │ Inserts into 'media' table:
       │ {
       │   id: 1,
       │   request_id: NULL,  ← Not linked yet!
       │   s3_key: "shops/1/requests/temp/images/uuid.jpg",
       │   uploader_type: "customer"
       │ }
       │
       ▼
       │ Returns: { media: { id: 1, ... } }
       │
       ▼
┌─────────────────────────────────────────────────────┐
│  Step 4: Create Service Request                     │
└─────────────────────────────────────────────────────┘
       │
       │ POST /api/service-requests
       │ Body: {
       │   items: [...],
       │   media_ids: [1],  ← Links to uploaded media
       │   address_manual: "123 Main St",
       │   gps_lat: 28.6139,
       │   gps_lon: 77.2090
       │ }
       │
       ▼
┌──────────────────────────────────────┐
│  Backend: serviceRequestController   │
│  - create()                          │
└──────────────────────────────────────┘
       │
       │ 1. Creates service_requests record → ID = 1
       │ 2. Creates service_items records
       │ 3. Links media:
       │
       ▼
┌──────────────────────────────────────┐
│  For each media_id:                  │
│  - Get media record from DB          │
│  - Update s3_key:                    │
│    OLD: "shops/1/requests/temp/..."  │
│    NEW: "shops/1/requests/1/..."     │
│                          ^            │
│                   actual request ID  │
│  - Update request_id: 1              │
└──────────────────────────────────────┘
       │
       │ ⚠️  PROBLEM: Database updated but S3 NOT updated!
       │
       ▼
┌─────────────────────────────────────────────────────┐
│  Current State (BROKEN):                            │
│                                                      │
│  Database:                                          │
│    s3_key = "shops/1/requests/1/images/uuid.jpg"   │
│                                                      │
│  S3 (Actual):                                       │
│    File at: "shops/1/requests/temp/images/uuid.jpg"│
│                                                      │
│  ❌ MISMATCH!                                       │
└─────────────────────────────────────────────────────┘
       │
       │ When customer tries to view image...
       │
       ▼
┌─────────────────────────────────────────────────────┐
│  Step 5: View Media (FAILS)                         │
└─────────────────────────────────────────────────────┘
       │
       │ GET /api/service-requests/1
       │
       ▼
┌──────────────────────────────────────┐
│  Backend: Generates presigned URL    │
│  from database s3_key:               │
│  "shops/1/requests/1/images/uuid.jpg"│
└──────────────────────────────────────┘
       │
       │ Tries to download from:
       │ http://localhost:4566/.../1/images/uuid.jpg
       │
       ▼
┌──────────────────────────────────────┐
│  S3: File NOT FOUND                  │
│  404 Error                           │
│  (File is actually at /temp/)        │
└──────────────────────────────────────┘