-- Base plan catalog (data migration). Plans are product configuration, so
-- they ship with the schema; the demo seed only adds demo users/servers.

INSERT OR REPLACE INTO plans (code, name, price_cents, interval, max_devices, features) VALUES
  ('free', 'Free', 0, 'month', 2,
   '["2 devices","All server regions","Kill switch","Unlimited data"]'),
  ('premium', 'Premium', 700, 'month', 10,
   '["10 devices","Priority routing","Dedicated IPv6","Kill switch","Unlimited data"]');
