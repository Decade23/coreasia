-- Membuang kolom Fase 0c. PERHATIAN: semua pendaftaran TOTP ikut hilang;
-- admin yang memakai TOTP harus mendaftar ulang setelah migrasi naik lagi.
ALTER TABLE public.admin_users
    DROP COLUMN IF EXISTS totp_last_step,
    DROP COLUMN IF EXISTS totp_enabled_at,
    DROP COLUMN IF EXISTS totp_pending_enc,
    DROP COLUMN IF EXISTS totp_secret_enc,
    DROP COLUMN IF EXISTS token_version;
