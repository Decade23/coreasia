-- Membuang indeks unik tanpa peka huruf. Email yang sudah dinormalkan (huruf
-- kecil, tanpa spasi tepi) TIDAK dikembalikan ke bentuk lamanya; UNIQUE(email)
-- dari 000001 tetap ada.
DROP INDEX IF EXISTS public.admin_users_email_lower_key;
