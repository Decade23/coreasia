-- CAD: satu lisensi = 1 Mac + 1 Windows (slot PER-PLATFORM), + nama pemilik.
--
-- Sebelum ini: lisensi terkunci ke SATU platform (cad_licenses.platform) dan
-- hanya boleh 1 perangkat aktif total — pembeli yang punya Mac dan PC harus beli
-- dua kali. Sekarang: platform disimpan PER-INSTALASI, dan slot dihitung per
-- platform (1 aktif untuk macos + 1 aktif untuk windows).

-- 1) Platform per instalasi (sebelumnya hanya ada di level lisensi).
ALTER TABLE public.cad_installations
    ADD COLUMN IF NOT EXISTS platform VARCHAR(20);

-- Backfill: instalasi lama berasal dari era platform-lock → ikut platform lisensinya
-- (praktis semuanya 'macos'). Fallback 'macos' bila lisensi sudah terhapus.
UPDATE public.cad_installations i
   SET platform = COALESCE(
        (SELECT l.platform FROM public.cad_licenses l WHERE l.id = i.license_id),
        'macos')
 WHERE i.platform IS NULL;

ALTER TABLE public.cad_installations
    ALTER COLUMN platform SET DEFAULT 'macos';
ALTER TABLE public.cad_installations
    ALTER COLUMN platform SET NOT NULL;

-- Satu perangkat AKTIF per (lisensi, platform). Partial index: baris revoked
-- tidak ikut dihitung, sehingga deaktivasi membebaskan slot & perangkat lama
-- boleh diaktifkan ulang nanti.
CREATE UNIQUE INDEX IF NOT EXISTS idx_cad_install_active_platform
    ON public.cad_installations(license_id, platform)
    WHERE revoked = false;

-- 2) Nama pemilik (opsional, diisi user saat aktivasi — hanya catatan).
ALTER TABLE public.cad_licenses
    ADD COLUMN IF NOT EXISTS holder_name VARCHAR(120);

-- 3) Lisensi CAD tak lagi terikat satu platform. 'universal' = boleh dipakai di
--    macOS DAN Windows (masing-masing 1 slot). Nilai lama dipertahankan untuk
--    produk lain yang memang platform-spesifik.
UPDATE public.cad_licenses
   SET platform = 'universal', device_limit = 2
 WHERE product = 'cad' AND platform IN ('macos', 'windows');

ALTER TABLE public.cad_licenses
    ALTER COLUMN device_limit SET DEFAULT 2;
