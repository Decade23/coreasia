-- Fase 0c: IP peramban admin yang DILAPORKAN BFF console landing.
--
-- Aksi console yang lewat proxy BFF (Vercel) tiba di gateway dari IP keluar
-- Vercel, jadi ip_address hanya memuat IP Vercel. BFF meneruskan IP peramban
-- di header X-Konsol-Klien-IP; nilainya dicatat di sini, TERPISAH dari
-- ip_address, karena tidak diverifikasi gateway (bisa dikarang pemanggil
-- langsung). Tidak dipakai untuk pembatas atau keputusan keamanan.
--
-- ADD-only, nullable, IF NOT EXISTS: aman dijalankan ulang; kode lama memilih
-- kolomnya secara eksplisit sehingga tidak terpengaruh.
ALTER TABLE public.gateway_audit_logs
    ADD COLUMN IF NOT EXISTS reported_client_ip VARCHAR(45);
