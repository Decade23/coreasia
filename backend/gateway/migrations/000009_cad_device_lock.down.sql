-- Reverse CAD device-locked online activation (v2).

ALTER TABLE public.cad_licenses ALTER COLUMN device_limit SET DEFAULT 2;
ALTER TABLE public.cad_licenses DROP COLUMN IF EXISTS last_transfer_at;
ALTER TABLE public.cad_licenses DROP COLUMN IF EXISTS platform;
