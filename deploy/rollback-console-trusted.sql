-- Hanya untuk rollback gateway versi 19 ke image sebelum perangkat tepercaya.
-- Hentikan gateway lebih dahulu. Perangkat tepercaya dihapus; data bisnis tetap.
BEGIN;
SET LOCAL lock_timeout = '5s';
LOCK TABLE public.gateway_schema_migrations IN EXCLUSIVE MODE;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.gateway_schema_migrations WHERE version=19 AND NOT dirty)
     OR (SELECT count(*) FROM public.gateway_schema_migrations) <> 1 THEN
    RAISE EXCEPTION 'Rollback ditolak: versi gateway harus tepat 19 dan tidak dirty';
  END IF;
END $$;
DROP TABLE public.admin_trusted_devices;
UPDATE public.gateway_schema_migrations SET version=18, dirty=false;
COMMIT;
