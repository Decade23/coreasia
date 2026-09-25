-- Lapis panjang jatah percobaan faktor kedua (20 kegagalan per 30 hari per
-- admin) pindah dari Redis ke sini.
--
-- Di Redis, kuncinya (gateway:admin_totp_gagal_panjang:<id>) bisa dibuang
-- eviction allkeys-lru, dan tekanan memori itu bisa dibuat pihak tanpa akses
-- lewat /login dengan email acak; hitungan 30 hari lalu mulai dari nol.
--
-- totp_gagal_panjang: percobaan yang dipesan dan belum dikembalikan (= gagal)
--   di jendela saat ini.
-- totp_gagal_panjang_mulai: awal jendela (kegagalan pertama); NULL = belum
--   ada jendela. Jendela yang sudah lewat dibaca nol oleh gateway.
--
-- ADD-only, IF NOT EXISTS, default konstan (tanpa menulis ulang tabel): aman
-- dijalankan ulang, dan kode lama memilih kolomnya secara eksplisit sehingga
-- tidak terpengaruh.
ALTER TABLE public.admin_users
    ADD COLUMN IF NOT EXISTS totp_gagal_panjang       INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS totp_gagal_panjang_mulai TIMESTAMPTZ;
