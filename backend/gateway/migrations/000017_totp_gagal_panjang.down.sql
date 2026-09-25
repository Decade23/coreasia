-- Membuang penghitung lapis panjang. Hitungan kegagalan faktor kedua 30 hari
-- ikut hilang (akun yang terkunci terbuka lagi); gateway lama memakai kunci
-- Redis yang mulai dari nol.
ALTER TABLE public.admin_users
    DROP COLUMN IF EXISTS totp_gagal_panjang_mulai,
    DROP COLUMN IF EXISTS totp_gagal_panjang;
