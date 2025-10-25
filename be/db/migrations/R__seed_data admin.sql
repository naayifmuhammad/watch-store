
INSERT INTO admins (phone, name, created_at, updated_at)
SELECT '9847103497', 'Kattoor Basheer', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM admins WHERE phone = '9847103497');