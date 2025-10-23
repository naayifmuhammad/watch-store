# Star Watch House - Complete Watch Care & Repair Platform

## Application Overview

**Star Watch House** is a comprehensive digital platform that modernizes the traditional watch repair and timepiece servicing industry by connecting customers, service centers, and delivery personnel through an intelligent, mobile-first web application.

### The Problem We Solve

Traditional watch repair services suffer from several pain points:
- **Lack of transparency**: Customers don't know repair costs until they visit the shop
- **Inconvenient logistics**: Customers must physically drop off and pick up their timepieces
- **Poor tracking**: No visibility into repair status or estimated completion time
- **Communication gaps**: Difficulty in conveying specific problems or understanding quotes
- **Time-consuming**: Multiple trips to the shop disrupt busy schedules

### Our Solution

Star Watch House creates a seamless, end-to-end digital experience that eliminates these friction points through three specialized portals:

#### **Customer Portal** - Your Timepiece, Your Convenience
Customers can request repair services from the comfort of their homes. They simply describe the problem, upload photos and videos of their timepiece, and even record voice notes to explain issues that are hard to describe in text. Our platform handles doorstep pickup and delivery, provides transparent pricing with detailed quotes, and offers real-time status tracking throughout the entire repair journey.

#### **Admin Dashboard** - Intelligent Service Management
Service center administrators gain complete operational control. They can review incoming requests with rich media context (images, videos, voice notes), provide accurate quote ranges with optional voice explanations, manage the entire repair workflow from pickup to delivery, assign delivery personnel efficiently, and track business metrics through comprehensive analytics.

#### **Delivery Portal** - Streamlined Logistics
Delivery personnel receive a dedicated mobile-optimized interface showing only their assigned tasks. They can view pickup and delivery addresses with GPS coordinates, mark status updates with photo documentation, and maintain a clear view of their daily assignments without administrative clutter.

### Key Features That Set Us Apart

**🎙️ Multimedia Communication**: Beyond text - customers can show their watch problems through photos, videos, and voice recordings, ensuring nothing gets lost in translation.

**📍 Smart Location Services**: Integrated GPS and reverse geocoding automatically capture accurate addresses, reducing delivery errors and confusion.

**💰 Transparent Pricing**: Customers receive quote ranges before committing, with the option to accept or decline. No surprise costs.

**📱 Mobile-First Design**: Every interface is optimized for smartphones, recognizing that most users will interact on-the-go.

**🔐 Secure Role-Based Access**: Separate authentication and authorization for customers, admins, and delivery personnel ensures data privacy and appropriate access levels.

**📊 Business Intelligence**: Real-time analytics help service centers understand demand patterns, track performance metrics, and optimize operations.

**☁️ Cloud-Native Architecture**: All customer data and media securely stored in AWS S3, with scalable backend infrastructure ready for multi-branch expansion.

**🔔 Proactive Notifications**: SMS alerts keep customers informed at every step - quote received, pickup scheduled, repair completed, out for delivery.

### The Technology Behind It

Built with modern, scalable technologies:
- **Backend**: Node.js + Express REST API with MySQL database
- **Frontend**: Next.js 14 with React and Tailwind CSS for responsive, fast interfaces
- **Storage**: AWS S3 for secure, reliable media management
- **Authentication**: JWT-based with separate tokens per role for enhanced security
- **Integrations**: Google Maps API for geocoding, SMS gateway for notifications

### Our Vision

Star Watch House aims to become the standard platform for timepiece servicing, starting with single-location watch repair shops and scaling to multi-branch operations. We're digitizing an industry that has remained largely analog, bringing the convenience and transparency customers expect from modern digital services to the world of watch and clock repair.

Whether you're a customer with a beloved vintage timepiece that needs care, a service center looking to modernize operations, or a delivery professional seeking efficient route management - Star Watch House provides the tools to make every interaction smooth, transparent, and satisfying.

---

**Now let's build the customer-facing experience that brings this vision to life.**

# 📘 API Documentation

**Base URL (Development):**

```
http://localhost:4000/api
```

All responses follow structures defined directly in controller methods.

---

## 🔐 Authentication Overview

| Role     | Description                     | Auth Type                                     |
| -------- | ------------------------------- | --------------------------------------------- |
| Customer | End users of the app            | JWT (Bearer Token)                            |
| Delivery | Delivery personnel              | JWT (Bearer Token)                            |
| Admin    | Internal management (dashboard) | JWT (Bearer Token or server-protected routes) |

All protected endpoints require the following header:

```
Authorization: Bearer <JWT_TOKEN>
```

---

## 🧩 AUTH ROUTES

### 1. Customer Request OTP

**POST** `/auth/customer/request-otp`

Request body:

```json
{
  "phone": "9876543210"
}
```

Example cURL:

```bash
curl -X POST http://localhost:4000/api/auth/customer/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'
```

Response:

```json
{ "ok": true }
```

---

### 2. Customer Verify OTP

**POST** `/auth/customer/verify-otp`

Request body:

```json
{
  "phone": "9876543210",
  "code": "1234",
  "name": "John Doe",
  "email": "john@example.com",
  "default_address": "123 Main St",
  "lat": 9.9312,
  "lon": 76.2673
}
```

Response:

```json
{
  "token": "<JWT_TOKEN>",
  "customer": {
    "id": 1,
    "phone": "9876543210",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

### 3. Delivery Request OTP

**POST** `/auth/delivery/request-otp`

Request body:

```json
{
  "phone": "9876543210"
}
```

Response:

```json
{ "ok": true }
```

---

### 4. Delivery Verify OTP

**POST** `/auth/delivery/verify-otp`

Request body:

```json
{
  "phone": "9876543210",
  "code": "1234"
}
```

Response:

```json
{
  "token": "<JWT_TOKEN>",
  "delivery": {
    "id": 4,
    "phone": "9876543210",
    "name": "Ravi Kumar"
  }
}
```

---

## 🧑‍💼 ADMIN ROUTES

All admin routes require valid admin authorization (JWT or internal auth middleware).

### 1. Get All Service Requests

**GET** `/admin/service-requests`

Query parameters:

| Param     | Type   | Description              |
| --------- | ------ | ------------------------ |
| `status`  | string | Filter by request status |
| `shop_id` | number | Filter by shop           |
| `page`    | number | Pagination page          |
| `limit`   | number | Results per page         |

Example:

```bash
curl -X GET "http://localhost:4000/api/admin/service-requests?status=QUOTED&page=1&limit=10" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

Response:

```json
{
  "requests": [
    {
      "id": 12,
      "customer_name": "John Doe",
      "shop_name": "ABC Electronics",
      "status": "QUOTED",
      "items_count": 2
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

---

### 2. Get Single Service Request

**GET** `/admin/service-requests/:id`

Example:

```bash
curl -X GET http://localhost:4000/api/admin/service-requests/12 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

Response:

```json
{
  "request": {
    "id": 12,
    "customer_name": "John Doe",
    "shop_name": "ABC Electronics",
    "status": "QUOTED",
    "quote_min": 200,
    "quote_max": 400
  },
  "items": [
    { "id": 1, "name": "Mobile Screen Replacement" }
  ],
  "media": [
    {
      "id": 3,
      "url": "https://s3.presigned-url"
    }
  ]
}
```

---

### 3. Send Quote

**POST** `/admin/service-requests/:id/quote`

Body:

```json
{
  "quote_min": 200,
  "quote_max": 400,
  "quote_note": "Estimate includes parts and service.",
  "voice_note_s3_key": "quotes/audio123.mp3"
}
```

Response:

```json
{
  "success": true,
  "status": "QUOTED"
}
```

---

### 4. Confirm Order

**POST** `/admin/service-requests/:id/confirm`

Body:

```json
{
  "scheduled_pickup_at": "2025-10-24T10:00:00Z"
}
```

Response:

```json
{
  "success": true,
  "status": "SCHEDULED"
}
```

---

### 5. Assign Delivery Person

**POST** `/admin/service-requests/:id/assign-delivery`

Body:

```json
{
  "delivery_person_id": 3
}
```

Response:

```json
{
  "success": true,
  "delivery_person": {
    "id": 3,
    "name": "Ravi Kumar"
  }
}
```

---

### 6. Mark Received at Shop

**POST** `/admin/service-requests/:id/mark-received`

Response:

```json
{
  "success": true,
  "status": "RECEIVED_SHOP"
}
```

---

### 7. Mark In Repair

**POST** `/admin/service-requests/:id/mark-in-repair`

Response:

```json
{
  "success": true,
  "status": "IN_REPAIR"
}
```

---

### 8. Mark Ready for Payment

**POST** `/admin/service-requests/:id/mark-ready-for-payment`

Response:

```json
{
  "success": true,
  "status": "READY_FOR_PAYMENT"
}
```

---

### 9. Mark Paid

**POST** `/admin/service-requests/:id/mark-paid`

Response:

```json
{
  "success": true,
  "status": "PAYMENT_RECEIVED"
}
```

---

### 10. Get All Delivery Personnel

**GET** `/admin/delivery-personnel`

Query:

| Param    | Type    | Description                  |
| -------- | ------- | ---------------------------- |
| `active` | boolean | (optional) true/false filter |

Response:

```json
{
  "personnel": [
    { "id": 1, "name": "Ravi Kumar", "phone": "9876543210", "active": 1 }
  ]
}
```

---

### 11. Create Delivery Person

**POST** `/admin/delivery-personnel`

Body:

```json
{
  "name": "Ravi Kumar",
  "phone": "9876543210"
}
```

Response:

```json
{
  "delivery_person": {
    "id": 1,
    "name": "Ravi Kumar",
    "phone": "9876543210",
    "active": 1
  }
}
```

---

### 12. Toggle Delivery Person Status

**PATCH** `/admin/delivery-personnel/:id/toggle`

Body:

```json
{
  "active": false
}
```

Response:

```json
{ "success": true }
```

---

### 13. Get All Shops

**GET** `/admin/shops`

Response:

```json
{
  "shops": [
    {
      "id": 1,
      "name": "ABC Electronics",
      "phone": "9998887776"
    }
  ]
}
```

---

### 14. Create Shop

**POST** `/admin/shops`

Body:

```json
{
  "name": "ABC Electronics",
  "address": "Market Road, Kochi",
  "phone": "9998887776"
}
```

Response:

```json
{
  "shop": {
    "id": 2,
    "name": "ABC Electronics",
    "address": "Market Road, Kochi",
    "phone": "9998887776"
  }
}
```

---

## 🚚 DELIVERY ROUTES

Protected via Delivery JWT.

### 1. Get Assigned Requests

**GET** `/delivery/requests`

Query:

| Param    | Type   | Description              |
| -------- | ------ | ------------------------ |
| `status` | string | Filter by request status |
| `page`   | number | Pagination               |
| `limit`  | number | Page size                |

---

### 2. Mark as Picked Up

**POST** `/delivery/requests/:id/pickup`

Response:

```json
{ "success": true, "status": "PICKED_UP" }
```

---

### 3. Mark as Delivered

**POST** `/delivery/requests/:id/deliver`

Response:

```json
{ "success": true, "status": "DELIVERED" }
```

---

## 👤 CUSTOMER ROUTES

Protected via Customer JWT.

### 1. Create Service Request

**POST** `/customer/service-requests`

Body:

```json
{
  "items": [
    { "category": "Mobile", "description": "Broken screen" }
  ],
  "shop_id": 1,
  "media_s3_keys": ["uploads/img1.jpg", "uploads/img2.jpg"]
}
```

Response:

```json
{
  "success": true,
  "request_id": 15
}
```

---

### 2. Get My Service Requests

**GET** `/customer/service-requests`

Response:

```json
{
  "requests": [
    { "id": 15, "status": "QUOTED", "quote_min": 200, "quote_max": 400 }
  ]
}
```

---

### 3. Accept Quote

**POST** `/customer/service-requests/:id/accept-quote`

Response:

```json
{ "success": true, "status": "ACCEPTED" }
```

---

### 4. Cancel Request

**POST** `/customer/service-requests/:id/cancel`

Response:

```json
{ "success": true, "status": "CANCELLED" }
```

---

## ⚙️ Notes

* `S3Service.generatePresignedDownloadUrl` returns temporary signed URLs for media and voice files.
* Timestamps follow ISO 8601 format.
* Status constants include:
  `PENDING`, `QUOTED`, `ACCEPTED`, `SCHEDULED`, `RECEIVED_SHOP`, `IN_REPAIR`, `READY_FOR_PAYMENT`, `PAYMENT_RECEIVED`, `DELIVERED`, `CANCELLED`.
* All date/times are in UTC unless otherwise noted.

---

📄 **End of API Documentation**
