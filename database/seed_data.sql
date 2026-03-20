-- ============================================================
-- seed_data.sql
-- Development seed data for Smart Door system.
-- Run after schema.sql or after: alembic upgrade head
-- ============================================================

-- Default admin user (password: admin123 — bcrypt hash)
INSERT INTO users (username, email, hashed_password, is_active, is_superuser)
VALUES (
    'admin',
    'admin@smartdoor.local',
    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', -- "admin123"
    TRUE,
    TRUE
)
ON CONFLICT (username) DO NOTHING;

-- Sample residents
INSERT INTO residents (name, email, phone, is_active) VALUES
    ('Nguyen Van A',   'vana@example.com',   '0901111111', TRUE),
    ('Tran Thi B',     'thib@example.com',   '0902222222', TRUE),
    ('Le Van C',       'vanc@example.com',   '0903333333', TRUE),
    ('Pham Thi D',     'thid@example.com',   '0904444444', TRUE),
    ('Hoang Van E',    'vane@example.com',   NULL,         FALSE)
ON CONFLICT DO NOTHING;

-- Sample access logs (last 7 days)
INSERT INTO access_logs (resident_id, timestamp, method, status, notes) VALUES
    (1, NOW() - INTERVAL '10 minutes', 'face',   'granted', 'Face recognized: 94% confidence'),
    (2, NOW() - INTERVAL '35 minutes', 'pin',    'granted', 'Correct PIN entered'),
    (NULL, NOW() - INTERVAL '1 hour',  'face',   'denied',  'Unknown face detected'),
    (3, NOW() - INTERVAL '2 hours',    'face',   'granted', 'Face recognized: 91% confidence'),
    (NULL, NOW() - INTERVAL '3 hours', 'pin',    'denied',  'Wrong PIN (3 attempts)'),
    (1, NOW() - INTERVAL '1 day',      'face',   'granted', 'Face recognized: 96% confidence'),
    (4, NOW() - INTERVAL '1 day',      'face',   'granted', 'Face recognized: 88% confidence'),
    (NULL, NOW() - INTERVAL '2 days',  'face',   'unknown', 'Low quality image'),
    (2, NOW() - INTERVAL '3 days',     'pin',    'granted', 'Correct PIN entered'),
    (1, NOW() - INTERVAL '5 days',     'remote', 'granted', 'Remote unlock via dashboard');

-- Sample system events
INSERT INTO system_events (type, payload_json, timestamp) VALUES
    ('system_online',    '{"version":"1.0.0","ip":"192.168.1.100"}',             NOW() - INTERVAL '6 hours'),
    ('motion_detected',  '{"confidence":0.85,"zone":"front_door"}',              NOW() - INTERVAL '3 hours'),
    ('face_recognized',  '{"resident_id":1,"name":"Nguyen Van A","score":0.94}', NOW() - INTERVAL '10 minutes'),
    ('face_unknown',     '{"score":0.45,"threshold":0.6}',                       NOW() - INTERVAL '1 hour'),
    ('alarm_triggered',  '{"reason":"unknown_face","duration_s":30}',            NOW() - INTERVAL '1 hour'),
    ('alarm_stopped',    '{"stopped_by":"dashboard","user":"admin"}',             NOW() - INTERVAL '55 minutes'),
    ('door_opened',      '{"method":"face","resident_id":3}',                    NOW() - INTERVAL '2 hours'),
    ('pin_wrong',        '{"attempts":2}',                                        NOW() - INTERVAL '3 hours');
