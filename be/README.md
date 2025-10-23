# Watch Store Pickup & Delivery Backend

RESTful backend API for a watch repair and sales store with customer portal, admin dashboard, and delivery management.

## Features

- Customer OTP login (SMS-only)
- Multi-part service request form with media uploads
- Admin quote management with voice notes
- Delivery personnel assignment and tracking
- AWS S3 media storage
- Google Maps reverse geocoding
- SMS notifications (toggleable)

## Tech Stack

- Node.js + Express
- MySQL (InnoDB)
- AWS S3
- Google Maps API
- JWT Authentication
- Flyway Migrations

## Prerequisites

- Node.js 16+
- MySQL 8+
- AWS Account (S3)
- Google Maps API Key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd watch-store-backend
```
Install dependencies:
```bash
npm install
```
Create .env file:
```bash
cp .env.example .env
```
Configure environment variables in .env

Run database migrations:

```bash
npm run migrate
```
Start the server:
```bash
# Development
npm run dev

# Production
npm start
```
## Environment Variables

See .env.example for all required environment variables.

## Key variables:

DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME - Database config
JWT_CUSTOMER_SECRET, JWT_DELIVERY_SECRET, JWT_ADMIN_SECRET - JWT secrets
AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY - S3 config
GOOGLE_MAPS_API_KEY - Google Maps API key
NOTIFICATIONS_ENABLED - Toggle SMS notifications
API Documentation
Base URL

http://localhost:4000/api
Authentication
Three separate authentication flows:

Customer: SMS OTP → JWT (customer secret)
Delivery: SMS OTP (if phone exists) → JWT (delivery secret)
Admin: Password/OTP → JWT (admin secret)
Endpoints
Auth
POST /auth/customer/request-otp - Request customer OTP
POST /auth/customer/verify-otp - Verify OTP & get token
POST /auth/delivery/request-otp - Request delivery OTP
POST /auth/delivery/verify-otp - Verify OTP & get token
Customer (requires customer JWT)
GET /customer/profile - Get profile
PATCH /customer/profile - Update profile
GET /customer/categories - Get service categories
Service Requests (requires customer JWT)
POST /service-requests - Create service request
GET /service-requests - List customer's requests
GET /service-requests/:id - Get request detail
POST /service-requests/:id/accept-quote - Accept quote
Admin (requires admin JWT)
GET /admin/service-requests - List all requests
GET /admin/service-requests/:id - Get request detail
POST /admin/service-requests/:id/send-quote - Send quote
POST /admin/service-requests/:id/confirm - Confirm order
POST /admin/service-requests/:id/assign-delivery - Assign delivery person
POST /admin/service-requests/:id/mark-* - Update status
GET /admin/delivery-personnel - List delivery personnel
POST /admin/delivery-personnel - Create delivery person
GET /admin/shops - List shops
POST /admin/shops - Create shop
GET /admin/settings - Get settings
PATCH /admin/settings - Update settings
Delivery (requires delivery JWT)
GET /delivery/assignments - Get assigned deliveries
POST /delivery/:request_id/mark-pickup - Mark picked up
POST /delivery/:request_id/mark-delivered - Mark delivered
Media (requires any JWT)
POST /media/presign - Get presigned upload URL
POST /media - Register uploaded media
GET /media/request/:request_id - Get request media
DELETE /media/:id - Delete media (admin only)

Project Structure

watch-store-backend/
├── src/
│   ├── config/          # Configuration files
│   ├── middlewares/     # Express middlewares
│   ├── models/          # Database models
│   ├── controllers/     # Route controllers
│   ├── routes/          # API routes
│   ├── services/        # Business logic services
│   ├── utils/           # Utility functions
│   └── app.js           # Express app entry point
├── db/
│   └── migrations/      # Flyway SQL migrations
└── package.json
Database Schema
shops - Shop/branch information
customers - Customer profiles
delivery_personnel - Delivery staff
admins - Admin users
service_requests - Service orders
service_items - Items within requests
media - Uploaded files metadata
otp_sessions - OTP verification
notifications_log - SMS notification history
Status Flow

requested → quoted → accepted → scheduled → picked_up → 
received_shop → in_repair → ready_for_payment → 
payment_received → out_for_delivery → delivered → completed
Security
Helmet.js for security headers
Rate limiting on all endpoints
Separate JWT secrets per role
Bcrypt password hashing
Input validation with Joi
S3 presigned URLs (15-60 min expiry)
SMS Provider
Currently uses DEV provider (console logging). To add real SMS provider, implement in src/services/smsService.js.

License
MIT