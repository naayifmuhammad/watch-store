-- Seed data for Watch Store

-- Insert default shop (only if not exists)
INSERT INTO shops (name, address, phone, created_at, updated_at)
SELECT 'Main Watch Store', '123 MG Road, Kochi, Kerala 682001', '9876543210', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM shops WHERE name = 'Main Watch Store');

-- Insert default admin (only if not exists)
INSERT INTO admins (phone, name, created_at, updated_at)
SELECT '9847103497', 'Kattoor Basheer', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM admins WHERE phone = '9847103497');

-- Insert sample delivery personnel (only if not exists)
INSERT INTO delivery_personnel (phone, name, active, created_at, updated_at)
SELECT '9999999999', 'Bassam Kattoor', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM delivery_personnel WHERE phone = '0000000000');