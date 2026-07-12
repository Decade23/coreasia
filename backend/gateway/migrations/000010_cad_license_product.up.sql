-- Multi-produk pada tabel lisensi: gateway kini menerbitkan key untuk lebih dari
-- satu produk (cad = CoreAsia Download Manager, mounter = CoreAsia Mounter).
-- Baris lama semuanya CAD → default 'cad' aman untuk data eksisting.
ALTER TABLE public.cad_licenses
    ADD COLUMN IF NOT EXISTS product varchar(32) NOT NULL DEFAULT 'cad';

CREATE INDEX IF NOT EXISTS idx_cad_licenses_product ON public.cad_licenses (product);
