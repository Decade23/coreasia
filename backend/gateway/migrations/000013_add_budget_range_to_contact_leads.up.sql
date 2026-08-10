-- Rentang anggaran yang dinyatakan sendiri oleh pengirim formulir.
--
-- Sengaja NULLABLE dan TANPA CHECK constraint. Dua alasannya:
--
-- 1. Formulir dan gateway di-deploy terpisah (Vercel dan VPS). Bila daftar
--    pilihan di formulir bertambah lebih dulu, CHECK di database akan menolak
--    lead yang sah dan pengunjung kehilangan kesempatan menghubungi. Validasi
--    daftar nilai ditegakkan di Go lewat tag oneof, yang ikut ter-deploy
--    bersama kodenya sehingga tidak pernah tertinggal versi.
--
-- 2. Field ini opsional di formulir. Lead tanpa anggaran tetap lead; lead yang
--    hilang karena kolom wajib bukan apa-apa.
ALTER TABLE public.contact_leads
    ADD COLUMN IF NOT EXISTS budget_range VARCHAR(32);

COMMENT ON COLUMN public.contact_leads.budget_range IS
    'Rentang anggaran pilihan pengirim. Kunci stabil, label ditampilkan frontend. NULL berarti tidak diisi.';
