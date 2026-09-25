-- Email admin tanpa peka huruf.
--
-- Email admin dipakai di luar gateway sebagai identitas (pelaku sesi console
-- CashFlow, pencabutan sesi per email), dan di sana dibandingkan dengan
-- lower(btrim(...)). UNIQUE(email) dari 000001 peka huruf, jadi 'y@x.id',
-- 'Y@X.ID', dan 'y@x.id ' bisa menjadi tiga akun. Gateway kini menyimpan dan
-- mencari email dalam bentuk lower(btrim(email)) (model.NormalizeEmail).
--
-- TIDAK BOLEH GAGAL pada data apa pun: gateway menjalankan migrasi saat start
-- dan berhenti (os.Exit) bila migrasi gagal, dan itu mematikan api.coreasia.id
-- (lisensi CAD, webhook pembayaran). Karena itu:
--   1. hanya email yang bentuk bakunya tidak bertabrakan dengan admin lain yang
--      dinormalkan;
--   2. indeks unik lower(btrim(email)) hanya dipasang bila tidak ada kembaran;
--      bila ada (atau muncul di tengah jalan), migrasi tetap selesai tanpa
--      indeks, dan gateway mencatat "email admin kembar" di log setiap start
--      (README, "Migrasi 000016"). Gateway tetap menolak kembaran baru lewat
--      pemeriksaan di Create/Update.

UPDATE public.admin_users u
   SET email = lower(btrim(u.email))
 WHERE u.email <> lower(btrim(u.email))
   AND char_length(lower(btrim(u.email))) BETWEEN 1 AND 255
   AND NOT EXISTS (
       SELECT 1 FROM public.admin_users o
        WHERE o.id <> u.id AND lower(btrim(o.email)) = lower(btrim(u.email)));

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.admin_users
                GROUP BY lower(btrim(email)) HAVING count(*) > 1) THEN
        RAISE WARNING 'admin_users: ada email kembar tanpa peka huruf; indeks admin_users_email_lower_key TIDAK dipasang';
        RETURN;
    END IF;
    BEGIN
        CREATE UNIQUE INDEX IF NOT EXISTS admin_users_email_lower_key
            ON public.admin_users (lower(btrim(email)));
    EXCEPTION WHEN unique_violation THEN
        -- Kembaran yang muncul di antara pemeriksaan dan pembuatan indeks.
        RAISE WARNING 'admin_users: email kembar saat membuat indeks; admin_users_email_lower_key TIDAK dipasang';
    END;
END
$$;
