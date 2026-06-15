-- CAD device-locked online activation (v2): platform lock + 1-active-device + controlled transfer.

-- Platform the license is bound to (license must match the activating app's platform).
ALTER TABLE public.cad_licenses ADD COLUMN IF NOT EXISTS platform VARCHAR(16) NOT NULL DEFAULT 'macos';

-- Last self-service device transfer (rate-limit: once / 30 days). NULL = never transferred.
ALTER TABLE public.cad_licenses ADD COLUMN IF NOT EXISTS last_transfer_at TIMESTAMPTZ;

-- v2 policy is 1 active device per license. Default the column to 1 going forward
-- and collapse all existing rows to 1 (was DEFAULT 2 in 000008).
ALTER TABLE public.cad_licenses ALTER COLUMN device_limit SET DEFAULT 1;
UPDATE public.cad_licenses SET device_limit = 1;
