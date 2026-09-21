-- Fase 0c: login console yang lebih keras.
--
-- token_version: dinaikkan untuk mencabut SEMUA token admin itu sekaligus
--   (logout-all, revoke-sessions oleh super admin, is_active=false, ganti
--   sandi, aktif/nonaktif TOTP). Token membawa klaim tv; /me dan /refresh
--   menolak token yang tv-nya tidak sama dengan kolom ini.
-- totp_*: TOTP opsional (RFC 6238). Rahasia disimpan terenkripsi AES-256-GCM
--   (kunci turunan HKDF dari JWT_SECRET), tidak pernah dalam bentuk polos.
--   totp_pending_enc = rahasia yang baru dibuat /totp/setup dan belum
--   dikonfirmasi; totp_last_step = langkah waktu (unix/30) terakhir yang
--   diterima, penolak pemutaran ulang kode yang sama.
--
-- ADD-only, IF NOT EXISTS, dan default 0 untuk token_version: aman dijalankan
-- ulang dan tidak mengubah perilaku kode lama yang memilih kolom secara
-- eksplisit.
ALTER TABLE public.admin_users
    ADD COLUMN IF NOT EXISTS token_version    INTEGER     NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS totp_secret_enc  TEXT,
    ADD COLUMN IF NOT EXISTS totp_pending_enc TEXT,
    ADD COLUMN IF NOT EXISTS totp_enabled_at  TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS totp_last_step   BIGINT;
