-- Rollback dual-platform → kembali ke kebijakan 1-perangkat platform-terkunci.
--
-- CATATAN: lisensi yang sudah dipakai di DUA platform tak bisa dipulihkan utuh —
-- baris instalasi Windows akan dicabut (revoked) agar batas 1-perangkat lama
-- konsisten. Data tidak dihapus, hanya ditandai revoked.

DROP INDEX IF EXISTS idx_cad_install_active_platform;

-- Sisakan satu instalasi aktif per lisensi (yang paling lama dipakai menang).
UPDATE public.cad_installations i
   SET revoked = true
 WHERE i.revoked = false
   AND i.id <> (
        SELECT j.id FROM public.cad_installations j
         WHERE j.license_id = i.license_id AND j.revoked = false
         ORDER BY j.first_seen ASC
         LIMIT 1);

-- Kembalikan platform lisensi dari 'universal' → platform instalasi aktifnya
-- (fallback 'macos' bila tak ada instalasi).
UPDATE public.cad_licenses l
   SET platform = COALESCE(
        (SELECT i.platform FROM public.cad_installations i
          WHERE i.license_id = l.id AND i.revoked = false LIMIT 1),
        'macos'),
       device_limit = 1
 WHERE l.platform = 'universal';

ALTER TABLE public.cad_licenses ALTER COLUMN device_limit SET DEFAULT 1;
ALTER TABLE public.cad_licenses DROP COLUMN IF EXISTS holder_name;
ALTER TABLE public.cad_installations DROP COLUMN IF EXISTS platform;
