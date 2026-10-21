-- Repair migration: ensure every seeded role/module/action grant exists.
-- Uses ON CONFLICT DO NOTHING so it's idempotent across deploys.
--
-- Motivation: some deployed databases lost their RolePermission rows
-- (e.g. TEMPLE_ADMIN.MEMBERS:CREATE), causing legitimate admins to see
-- "Missing permission MEMBERS:CREATE" when trying to register members.
-- This migration re-establishes the default matrix without touching any
-- custom UserPermissionOverride the Super Admin may have layered on top.
--
-- Table name is snake_case (role_permissions) per @@map. Unique constraint
-- is (roleId, module, action).

-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Shared permissions for all org-admin roles.
INSERT INTO "role_permissions" ("id", "roleId", "module", "action", "allowed", "createdAt")
SELECT
  'rp_' || replace(gen_random_uuid()::text, '-', ''),
  r."id",
  perms.module,
  perms.action::"PermissionAction",
  true,
  NOW()
FROM "roles" r
CROSS JOIN (VALUES
  ('MEMBERS', 'VIEW'), ('MEMBERS', 'CREATE'),
  ('FAMILY', 'VIEW'),
  ('MONKS', 'VIEW'), ('MONKS', 'CREATE'), ('MONKS', 'EDIT'),
  ('STAFF', 'VIEW'), ('STAFF', 'CREATE'), ('STAFF', 'EDIT'),
  ('VISITORS', 'VIEW'), ('VISITORS', 'CREATE'), ('VISITORS', 'EDIT'),
  ('BOOKINGS', 'VIEW'), ('BOOKINGS', 'CREATE'), ('BOOKINGS', 'EDIT'), ('BOOKINGS', 'APPROVE'), ('BOOKINGS', 'REJECT'),
  ('DONATIONS', 'VIEW'), ('DONATIONS', 'APPROVE'), ('DONATIONS', 'REJECT'),
  ('EVENTS', 'VIEW'), ('EVENTS', 'CREATE'), ('EVENTS', 'EDIT'),
  ('TICKETS', 'VIEW'),
  ('SEATING', 'VIEW'), ('SEATING', 'CREATE'), ('SEATING', 'EDIT'),
  ('TOURS', 'VIEW'), ('TOURS', 'CREATE'), ('TOURS', 'EDIT'),
  ('FEED', 'VIEW'), ('FEED', 'CREATE'), ('FEED', 'EDIT'),
  ('OFFERS', 'VIEW'),
  ('NEWS', 'VIEW'), ('NEWS', 'CREATE'), ('NEWS', 'EDIT'),
  ('POLLS', 'VIEW'), ('POLLS', 'CREATE'),
  ('CALENDAR', 'VIEW'),
  ('COUNTERS', 'VIEW'),
  ('TRACKING', 'VIEW'), ('TRACKING', 'CREATE'), ('TRACKING', 'EDIT'),
  ('DEVICES', 'VIEW'), ('DEVICES', 'CREATE'), ('DEVICES', 'EDIT'),
  ('ALERTS', 'VIEW'),
  ('COMMUNICATION', 'VIEW'), ('COMMUNICATION', 'CREATE'),
  ('ANNOUNCEMENTS', 'VIEW'), ('ANNOUNCEMENTS', 'CREATE'),
  ('GALLERY', 'VIEW'), ('GALLERY', 'CREATE'), ('GALLERY', 'EDIT'),
  ('VOLUNTEERS', 'VIEW'), ('VOLUNTEERS', 'CREATE'), ('VOLUNTEERS', 'EDIT'), ('VOLUNTEERS', 'APPROVE'), ('VOLUNTEERS', 'REJECT'),
  ('SUPPORT_TICKETS', 'VIEW'), ('SUPPORT_TICKETS', 'CREATE'),
  ('NOTIFICATIONS', 'VIEW'),
  ('REPORTS', 'VIEW'),
  ('AUDIT_LOGS', 'VIEW'),
  ('DASHBOARD', 'VIEW')
) AS perms(module, action)
WHERE r."key" IN ('TEMPLE_ADMIN', 'JAIN_CENTER_ADMIN', 'DHARAMSHALA_ADMIN')
ON CONFLICT ("roleId", "module", "action") DO NOTHING;

-- TEMPLE_ADMIN & JAIN_CENTER_ADMIN also manage TEMPLES and JAIN_CENTERS
INSERT INTO "role_permissions" ("id", "roleId", "module", "action", "allowed", "createdAt")
SELECT
  'rp_' || replace(gen_random_uuid()::text, '-', ''),
  r."id",
  'TEMPLES',
  a::"PermissionAction",
  true,
  NOW()
FROM "roles" r, unnest(ARRAY['VIEW','EDIT']) AS a
WHERE r."key" IN ('TEMPLE_ADMIN', 'JAIN_CENTER_ADMIN')
ON CONFLICT ("roleId", "module", "action") DO NOTHING;

INSERT INTO "role_permissions" ("id", "roleId", "module", "action", "allowed", "createdAt")
SELECT
  'rp_' || replace(gen_random_uuid()::text, '-', ''),
  r."id",
  'JAIN_CENTERS',
  a::"PermissionAction",
  true,
  NOW()
FROM "roles" r, unnest(ARRAY['VIEW','EDIT']) AS a
WHERE r."key" IN ('TEMPLE_ADMIN', 'JAIN_CENTER_ADMIN')
ON CONFLICT ("roleId", "module", "action") DO NOTHING;

-- DHARAMSHALA_ADMIN manages DHARAMSHALAS
INSERT INTO "role_permissions" ("id", "roleId", "module", "action", "allowed", "createdAt")
SELECT
  'rp_' || replace(gen_random_uuid()::text, '-', ''),
  r."id",
  'DHARAMSHALAS',
  a::"PermissionAction",
  true,
  NOW()
FROM "roles" r, unnest(ARRAY['VIEW','EDIT']) AS a
WHERE r."key" = 'DHARAMSHALA_ADMIN'
ON CONFLICT ("roleId", "module", "action") DO NOTHING;
