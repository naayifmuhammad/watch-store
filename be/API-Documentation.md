# API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Customer APIs](#customer-apis)
4. [Service Request APIs](#service-request-apis)
5. [Admin APIs](#admin-apis)
6. [Delivery APIs](#delivery-apis)
7. [Media APIs](#media-apis)
8. [Error Responses](#error-responses)
9. [Status Constants](#status-constants)

---

## Overview

### Base URL
```
http://your-domain.com/api
```

### Authentication
Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Response Format
All responses follow this general structure:
```json
{
  "success": true,
  "data": {},
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

---

## Authentication

### 1. Admin Request OTP

**Endpoint:** `POST /auth/admin/request-otp`

**Description:** Request OTP for admin login

**Auth Required:** No

**Request Body:**
```json
{
  "phone": "string (required, 10 digits)"
}
```

**Response (200):**
```json
{
  "ok": true
}
```

**Use Case:** Admin enters phone number to receive OTP for login

---

### 2. Admin Verify OTP

**Endpoint:** `POST /auth/admin/verify-otp`

**Description:** Verify OTP and get admin JWT token

**Auth Required:** No

**Request Body:**
```json
{
  "phone": "string (required)",
  "code": "string (required, 6 digits)"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "string (JWT token)",
  "admin": {
    "id": "number",
    "phone": "string",
    "name": "string"
  }
}
```

**Use Case:** Admin verifies OTP and receives authentication token

---

### 3. Customer Request OTP

**Endpoint:** `POST /auth/customer/request-otp`

**Description:** Request OTP for customer login/registration

**Auth Required:** No

**Request Body:**
```json
{
  "phone": "string (required, 10 digits)"
}
```

**Response (200):**
```json
{
  "ok": true
}
```

**Use Case:** Customer enters phone number to receive OTP

---

### 4. Customer Verify OTP

**Endpoint:** `POST /auth/customer/verify-otp`

**Description:** Verify OTP - returns token for existing users or prompts registration for new users

**Auth Required:** No

**Request Body:**
```json
{
  "phone": "string (required)",
  "code": "string (required, 6 digits)"
}
```

**Response for Existing User (200):**
```json
{
  "success": true,
  "is_new_user": false,
  "token": "string (JWT token)",
  "customer": {
    "id": "number",
    "phone": "string",
    "name": "string",
    "email": "string"
  }
}
```

**Response for New User (200):**
```json
{
  "success": true,
  "is_new_user": true,
  "message": "OTP verified. First-time user. Please complete registration."
}
```

**Use Case:** After OTP verification, system determines if user needs to register or can login directly

---

### 5. Customer Register

**Endpoint:** `POST /auth/customer/register`

**Description:** Register new customer after OTP verification

**Auth Required:** No

**Request Body:**
```json
{
  "phone": "string (required)",
  "name": "string (optional)",
  "email": "string (optional, valid email)",
  "default_address": "string (optional)",
  "lat": "number (optional)",
  "lon": "number (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "string (JWT token)",
  "customer": {
    "id": "number",
    "phone": "string",
    "name": "string",
    "email": "string"
  }
}
```

**Use Case:** Complete customer registration after first-time OTP verification

---

### 6. Delivery Request OTP

**Endpoint:** `POST /auth/delivery/request-otp`

**Description:** Request OTP for delivery personnel login

**Auth Required:** No

**Request Body:**
```json
{
  "phone": "string (required, 10 digits)"
}
```

**Response (200):**
```json
{
  "ok": true
}
```

**Error (403):**
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Delivery personnel not found or inactive"
  }
}
```

**Use Case:** Delivery person enters registered phone to receive OTP

---

### 7. Delivery Verify OTP

**Endpoint:** `POST /auth/delivery/verify-otp`

**Description:** Verify OTP and get delivery personnel JWT token

**Auth Required:** No

**Request Body:**
```json
{
  "phone": "string (required)",
  "code": "string (required, 6 digits)"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "string (JWT token)",
  "delivery": {
    "id": "number",
    "phone": "string",
    "name": "string"
  }
}
```

**Use Case:** Delivery person verifies OTP and receives authentication token

---

## Customer APIs

### 8. Get Customer Profile

**Endpoint:** `GET /customer/profile`

**Description:** Get logged-in customer's profile information

**Auth Required:** Yes (Customer)

**Response (200):**
```json
{
  "customer": {
    "id": "number",
    "phone": "string",
    "name": "string",
    "email": "string",
    "default_address": "string",
    "latitude": "number",
    "longitude": "number",
    "created_at": "datetime"
  }
}
```

**Use Case:** Display customer profile information

---

### 9. Update Customer Profile

**Endpoint:** `PATCH /customer/profile`

**Description:** Update customer profile information

**Auth Required:** Yes (Customer)

**Request Body:**
```json
{
  "name": "string (optional)",
  "email": "string (optional, valid email)",
  "default_address": "string (optional)",
  "latitude": "number (optional)",
  "longitude": "number (optional)"
}
```

**Response (200):**
```json
{
  "customer": {
    "id": "number",
    "phone": "string",
    "name": "string",
    "email": "string",
    "default_address": "string",
    "latitude": "number",
    "longitude": "number"
  }
}
```

**Use Case:** Customer updates their profile information

---

### 10. Reverse Geocode

**Endpoint:** `GET /customer/geocode`

**Description:** Convert GPS coordinates to human-readable address

**Auth Required:** Yes (Customer)

**Query Parameters:**
- `lat`: number (required, -90 to 90)
- `lon`: number (required, -180 to 180)

**Example:**
```
GET /customer/geocode?lat=28.6139&lon=77.2090
```

**Response (200):**
```json
{
  "address": "string (formatted address)",
  "lat": "number",
  "lon": "number"
}
```

**Response when address not found (200):**
```json
{
  "address": null,
  "message": "Could not determine address from coordinates"
}
```

**Use Case:** Convert customer's GPS location to readable address for service request

---

## Service Request APIs

### 11. Create Service Request

**Endpoint:** `POST /service-requests`

**Description:** Create a new service request with items and media

**Auth Required:** Yes (Customer)

**Request Body:**
```json
{
  "items": [
    {
      "category": "string (required, e.g., 'watch', 'clock')",
      "title": "string (optional)",
      "description": "string (optional, problem description)"
    }
  ],
  "media_ids": ["number (optional, array of media IDs)"],
  "address_manual": "string (required, delivery address)",
  "gps_lat": "number (optional)",
  "gps_lon": "number (optional)"
}
```

**Response (201):**
```json
{
  "success": true,
  "id": "number (service request ID)",
  "status": "requested"
}
```

**Use Case:** Customer creates a service request for watch/clock repair

**Flow:**
1. Customer uploads media first (see Media APIs)
2. Customer fills in service details
3. Creates request with media_ids and items
4. Admin receives notification of new request

---

### 12. Get Customer's Service Requests

**Endpoint:** `GET /service-requests`

**Description:** Get all service requests for logged-in customer

**Auth Required:** Yes (Customer)

**Response (200):**
```json
{
  "requests": [
    {
      "id": "number",
      "shop_id": "number",
      "customer_id": "number",
      "status": "string",
      "description": "string",
      "address_manual": "string",
      "gps_lat": "number",
      "gps_lon": "number",
      "quote_min": "number",
      "quote_max": "number",
      "quote_note": "string",
      "quote_voice_s3_key": "string",
      "scheduled_pickup_at": "datetime",
      "delivery_person_id": "number",
      "created_at": "datetime",
      "updated_at": "datetime",
      "items_count": "number",
      "media_count": "number"
    }
  ]
}
```

**Use Case:** Display customer's service request history

---

### 13. Get Service Request Detail

**Endpoint:** `GET /service-requests/:id`

**Description:** Get detailed information about a specific service request

**Auth Required:** Yes (Customer)

**URL Parameters:**
- `id`: number (service request ID)

**Response (200):**
```json
{
  "request": {
    "id": "number",
    "shop_id": "number",
    "customer_id": "number",
    "status": "string",
    "description": "string",
    "address_manual": "string",
    "gps_lat": "number",
    "gps_lon": "number",
    "quote_min": "number",
    "quote_max": "number",
    "quote_note": "string",
    "quote_voice_s3_key": "string",
    "quote_voice_url": "string (presigned URL if voice note exists)",
    "scheduled_pickup_at": "datetime",
    "delivery_person_id": "number",
    "created_at": "datetime",
    "updated_at": "datetime"
  },
  "items": [
    {
      "id": "number",
      "request_id": "number",
      "category": "string",
      "title": "string",
      "problem_description": "string",
      "created_at": "datetime",
      "updated_at": "datetime"
    }
  ],
  "media": [
    {
      "id": "number",
      "request_id": "number",
      "uploader_type": "string",
      "type": "string (image/video/voice)",
      "s3_key": "string",
      "url": "string (presigned download URL)",
      "original_filename": "string",
      "size_bytes": "number",
      "duration_seconds": "number",
      "created_at": "datetime"
    }
  ]
}
```

**Use Case:** View complete details of a service request including items, media, and quote

---

### 14. Accept Quote

**Endpoint:** `POST /service-requests/:id/accept-quote`

**Description:** Customer accepts the quote provided by admin

**Auth Required:** Yes (Customer)

**URL Parameters:**
- `id`: number (service request ID)

**Request Body:**
```json
{
  "accept": true
}
```

**Response (200):**
```json
{
  "success": true,
  "status": "accepted"
}
```

**Error (400) - Invalid Status:**
```json
{
  "error": {
    "code": "INVALID_STATUS",
    "message": "Request must be in quoted status"
  }
}
```

**Use Case:** Customer reviews quote and accepts it to proceed with service

---

## Admin APIs

### 15. Get All Service Requests

**Endpoint:** `GET /admin/service-requests`

**Description:** Get all service requests with optional filtering and pagination

**Auth Required:** Yes (Admin)

**Query Parameters:**
- `status`: string (optional, filter by status)
- `shop_id`: number (optional, filter by shop)
- `page`: number (optional, default: 1)
- `limit`: number (optional, default: 20)

**Example:**
```
GET /admin/service-requests?status=requested&page=1&limit=20
```

**Response (200):**
```json
{
  "requests": [
    {
      "id": "number",
      "shop_id": "number",
      "customer_id": "number",
      "status": "string",
      "description": "string",
      "address_manual": "string",
      "quote_min": "number",
      "quote_max": "number",
      "scheduled_pickup_at": "datetime",
      "delivery_person_id": "number",
      "created_at": "datetime",
      "updated_at": "datetime",
      "customer_name": "string",
      "customer_phone": "string",
      "shop_name": "string",
      "delivery_person_name": "string",
      "items_count": "number"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "pages": "number"
  }
}
```

**Use Case:** Admin dashboard displaying all service requests with filtering

---

### 16. Get Service Request Detail (Admin)

**Endpoint:** `GET /admin/service-requests/:id`

**Description:** Get detailed view of service request (admin view with full customer info)

**Auth Required:** Yes (Admin)

**URL Parameters:**
- `id`: number (service request ID)

**Response (200):**
```json
{
  "request": {
    "id": "number",
    "shop_id": "number",
    "customer_id": "number",
    "status": "string",
    "description": "string",
    "address_manual": "string",
    "gps_lat": "number",
    "gps_lon": "number",
    "quote_min": "number",
    "quote_max": "number",
    "quote_note": "string",
    "quote_voice_s3_key": "string",
    "quote_voice_url": "string (presigned URL)",
    "scheduled_pickup_at": "datetime",
    "delivery_person_id": "number",
    "created_at": "datetime",
    "updated_at": "datetime",
    "customer_name": "string",
    "customer_phone": "string",
    "customer_email": "string",
    "customer_default_address": "string",
    "shop_name": "string",
    "delivery_person_name": "string",
    "delivery_person_phone": "string"
  },
  "items": [...],
  "media": [...]
}
```

**Use Case:** Admin views complete service request details with customer information

---

### 17. Send Quote

**Endpoint:** `POST /admin/service-requests/:id/send-quote`

**Description:** Send price quote to customer

**Auth Required:** Yes (Admin)

**URL Parameters:**
- `id`: number (service request ID)

**Request Body:**
```json
{
  "quote_min": "number (required, minimum price)",
  "quote_max": "number (required, maximum price)",
  "quote_note": "string (optional, text explanation)",
  "voice_note_s3_key": "string (optional, S3 key of voice note)"
}
```

**Response (200):**
```json
{
  "success": true,
  "status": "quoted"
}
```

**Use Case:** Admin reviews service request and sends price quote to customer

**Flow:**
1. Admin reviews items and photos
2. Determines price range
3. Optionally records voice note explanation
4. Sends quote to customer (triggers SMS notification)

---

### 18. Confirm Order

**Endpoint:** `POST /admin/service-requests/:id/confirm`

**Description:** Confirm order and optionally schedule pickup

**Auth Required:** Yes (Admin)

**URL Parameters:**
- `id`: number (service request ID)

**Request Body:**
```json
{
  "scheduled_pickup_at": "datetime (optional, ISO 8601 format)"
}
```

**Response (200):**
```json
{
  "success": true,
  "status": "accepted" // or "scheduled" if pickup time provided
}
```

**Use Case:** After customer accepts quote, admin confirms and schedules pickup

---

### 19. Assign Delivery Person

**Endpoint:** `POST /admin/service-requests/:id/assign-delivery`

**Description:** Assign delivery personnel to service request

**Auth Required:** Yes (Admin)

**URL Parameters:**
- `id`: number (service request ID)

**Request Body:**
```json
{
  "delivery_person_id": "number (required)"
}
```

**Response (200):**
```json
{
  "success": true,
  "delivery_person": {
    "id": "number",
    "name": "string"
  }
}
```

**Error (404):**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Delivery person not found or inactive"
  }
}
```

**Use Case:** Admin assigns active delivery person to pick up customer's items

---

### 20. Mark Received at Shop

**Endpoint:** `POST /admin/service-requests/:id/mark-received`

**Description:** Mark that items have been received at the shop

**Auth Required:** Yes (Admin)

**URL Parameters:**
- `id`: number (service request ID)

**Request Body:**
```json
{
  "notes": "string (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "status": "received_shop"
}
```

**Use Case:** After delivery person brings items to shop, admin confirms receipt

---

### 21. Mark In Repair

**Endpoint:** `POST /admin/service-requests/:id/mark-in-repair`

**Description:** Mark that repair work has started

**Auth Required:** Yes (Admin)

**URL Parameters:**
- `id`: number (service request ID)

**Response (200):**
```json
{
  "success": true,
  "status": "in_repair"
}
```

**Use Case:** Admin marks that technician has started working on the items

---

### 22. Mark Ready for Payment

**Endpoint:** `POST /admin/service-requests/:id/mark-ready-for-payment`

**Description:** Mark that repair is complete and awaiting payment

**Auth Required:** Yes (Admin)

**URL Parameters:**
- `id`: number (service request ID)

**Response (200):**
```json
{
  "success": true,
  "status": "ready_for_payment"
}
```

**Use Case:** Repair completed, admin notifies customer to make payment

---

### 23. Mark Paid

**Endpoint:** `POST /admin/service-requests/:id/mark-paid`

**Description:** Confirm payment received from customer

**Auth Required:** Yes (Admin)

**URL Parameters:**
- `id`: number (service request ID)

**Response (200):**
```json
{
  "success": true,
  "status": "payment_received"
}
```

**Use Case:** Customer pays, admin confirms and items are ready for return delivery

---

### 24. Create Delivery Personnel

**Endpoint:** `POST /admin/delivery-personnel`

**Description:** Create new delivery personnel account

**Auth Required:** Yes (Admin)

**Request Body:**
```json
{
  "phone": "string (required, 10 digits)",
  "name": "string (required, max 255 chars)"
}
```

**Response (201):**
```json
{
  "delivery_person": {
    "id": "number",
    "phone": "string",
    "name": "string",
    "active": "boolean"
  }
}
```

**Error (400):**
```json
{
  "error": {
    "code": "ALREADY_EXISTS",
    "message": "Delivery person with this phone already exists"
  }
}
```

**Use Case:** Admin adds new delivery personnel to the system

---

### 25. Get All Delivery Personnel

**Endpoint:** `GET /admin/delivery-personnel`

**Description:** Get list of all delivery personnel

**Auth Required:** Yes (Admin)

**Query Parameters:**
- `active`: boolean (optional, filter by active status: "true" or "false")

**Example:**
```
GET /admin/delivery-personnel?active=true
```

**Response (200):**
```json
{
  "personnel": [
    {
      "id": "number",
      "phone": "string",
      "name": "string",
      "active": "boolean",
      "created_at": "datetime"
    }
  ]
}
```

**Use Case:** Display list of delivery personnel for assignment

---

### 26. Toggle Delivery Person Status

**Endpoint:** `PATCH /admin/delivery-personnel/:id/status