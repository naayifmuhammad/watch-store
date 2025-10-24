-- Watch Store Database Schema

-- Shops table
CREATE TABLE IF NOT EXISTS shops (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(32) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(120) NULL,
    email VARCHAR(255) NULL,
    default_address TEXT NULL,
    latitude DECIMAL(10,7) NULL,
    longitude DECIMAL(10,7) NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX idx_phone (phone),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Delivery Personnel table
CREATE TABLE IF NOT EXISTS delivery_personnel (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(120) NULL,
    active TINYINT(1) DEFAULT 1,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX idx_phone (phone),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    password_hash VARCHAR(255) NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Service Requests (Orders) table
CREATE TABLE IF NOT EXISTS service_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    shop_id INT NOT NULL,
    customer_id INT NOT NULL,
    status ENUM(
        'requested',
        'quoted',
        'accepted',
        'scheduled',
        'picked_up',
        'received_shop',
        'in_repair',
        'ready_for_payment',
        'payment_received',
        'out_for_delivery',
        'delivered',
        'completed'
    ) NOT NULL DEFAULT 'requested',
    quote_min INT NULL,
    quote_max INT NULL,
    quote_note TEXT NULL,
    quote_voice_s3_key VARCHAR(1024) NULL,
    description TEXT NULL,
    gps_lat DECIMAL(10,7) NULL,
    gps_lon DECIMAL(10,7) NULL,
    address_manual TEXT NOT NULL,
    scheduled_pickup_at DATETIME NULL,
    delivery_person_id INT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE RESTRICT,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    FOREIGN KEY (delivery_person_id) REFERENCES delivery_personnel(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_customer_id (customer_id),
    INDEX idx_delivery_person_id (delivery_person_id),
    INDEX idx_shop_id (shop_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Service Items table
CREATE TABLE IF NOT EXISTS service_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT NOT NULL,
    category ENUM('watch', 'clock', 'timepiece', 'smart_wearable', 'custom') NOT NULL,
    title VARCHAR(255) NULL,
    problem_description TEXT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
    INDEX idx_request_id (request_id),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Media table
CREATE TABLE IF NOT EXISTS media (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT NULL,
    uploader_type ENUM('customer', 'admin', 'tech', 'delivery') NOT NULL,
    type ENUM('image', 'video', 'voice') NOT NULL,
    s3_key VARCHAR(1024) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    size_bytes BIGINT NOT NULL,
    duration_seconds INT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
    INDEX idx_request_id (request_id),
    INDEX idx_type (type),
    INDEX idx_s3_key (s3_key(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- OTP Sessions table
CREATE TABLE IF NOT EXISTS otp_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(255) NOT NULL,
    purpose ENUM('customer_login', 'delivery_login', 'admin_invite') NOT NULL,
    expires_at DATETIME NOT NULL,
    verified TINYINT(1) DEFAULT 0,
    created_at DATETIME NOT NULL,
    INDEX idx_phone (phone),
    INDEX idx_expires_at (expires_at),
    INDEX idx_verified (verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications Log table
CREATE TABLE IF NOT EXISTS notifications_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('sms') NOT NULL,
    to_phone VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    sent_at DATETIME NOT NULL,
    status VARCHAR(50) NOT NULL,
    INDEX idx_to_phone (to_phone),
    INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
