DROP INDEX IF EXISTS idx_cad_licenses_product;
ALTER TABLE public.cad_licenses DROP COLUMN IF EXISTS product;
