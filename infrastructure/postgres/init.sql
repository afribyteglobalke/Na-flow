CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Prisma creates tables during migrations; these hypertable calls are repeated safely after migration.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'telemetry_snapshots') THEN
    PERFORM create_hypertable('telemetry_snapshots', 'timestamp', if_not_exists => TRUE);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gps_points') THEN
    PERFORM create_hypertable('gps_points', 'timestamp', if_not_exists => TRUE);
  END IF;
END $$;
