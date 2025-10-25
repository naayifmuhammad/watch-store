-- Seed data for Watch Store

-- Insert default shop (only if not exists)
INSERT INTO shops (name, address, phone, created_at, updated_at)
SELECT 'Main Watch Store', '123 MG Road, Kochi, Kerala 682001', '9876543210', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM shops WHERE name = 'Main Watch Store');

-- Insert default admin (only if not exists)
-- Password: admin123 (hashed with bcrypt - $2b$10$rO0X0KpqT3yO1xK1ZvZjd.xqK3ZYX7KGX4YvQ5YJZ0FZ1X2X3X4X5)
INSERT INTO admins (phone, name, password_hash, created_at, updated_at)
SELECT '9999999999', 'System Admin', '$2b$10$rO0X0KpqT3yO1xK1ZvZjd.xqK3ZYX7KGX4YvQ5YJZ0FZ1X2X3X4X5', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM admins WHERE phone = '9999999999');

-- Insert sample delivery personnel (only if not exists)
INSERT INTO delivery_personnel (phone, name, active, created_at, updated_at)
SELECT '9111111111', 'Rajesh Kumar', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM delivery_personnel WHERE phone = '9111111111');

INSERT INTO delivery_personnel (phone, name, active, created_at, updated_at)
SELECT '9222222222', 'Suresh Nair', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM delivery_personnel WHERE phone = '9222222222');