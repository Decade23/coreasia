# Brief dua langkah dan penerusan LeadKu

Perubahan ini disiapkan dari rilis publik `f3d92bb` pada checkout terpisah.
Desain halaman lain, navigasi, dan animasi tetap dipakai. Status produksi
dicatat terpisah dalam bukti rilis.

## Kriteria penerimaan

| ID | Perilaku | Bukti uji |
| --- | --- | --- |
| B1 | Pilih website, aplikasi, atau perbaikan sistem; tulis kebutuhan sebelum kontak | CDP desktop dan 390 px |
| B2 | Pilih WhatsApp atau email; hanya kontak pilihan yang wajib/dikirim | Unit frontend, handler, CDP |
| B3 | Anggaran, waktu mulai, perusahaan/website opsional; tautan produk/bantuan lama tetap berlaku | Unit, CDP deep link dan bahasa Inggris |
| B4 | Persetujuan wajib; label dan pesan kesalahan terhubung dengan input | CDP keyboard dan validasi |
| B5 | Referensi muncul sesudah penyimpanan dan ikut ke pesan WhatsApp bersama konteks | Database dan CDP |
| B6 | Respons hilang lalu retry tidak membuat lead, pekerjaan pengiriman, atau deal ganda | PostgreSQL concurrency dan CDP kehilangan respons |
| L1 | LeadKu menerima WhatsApp tanpa email buatan dan menyimpan konteks brief | Uji database LeadKu dan koneksi lokal antarlayanan |
| L2 | Lead, pemilik, deal, catatan dan tugas follow-up tersimpan dalam transaksi | Uji database, termasuk kegagalan penyimpanan tugas |
| L3 | Pengiriman email/CRM bertahan setelah restart, memakai lease dan retry; konfigurasi kosong tidak dianggap terkirim | Uji dispatcher dan database |
| C1 | SDK chat hanya dimuat setelah pengunjung membuka chat | CDP, Chatwoot CE lokal |
| C2 | Pesan pengunjung masuk inbox; balasan dari browser operator muncul di widget | CDP dua halaman, Chatwoot CE sungguhan |
| C3 | Widget mobile tidak melebar; kegagalan chat tetap menyediakan WhatsApp | CDP 390 px dan abort SDK |
| C4 | WhatsApp Business app dan API tetap bekerja bersama | Belum diuji pada nomor Business utama. PoC nomor tes: pesan masuk lulus; balasan ditolak Meta 131031 |
| C5 | Balas pesan widget dari aplikasi WhatsApp | Belum dibuat/diuji: bridge tambahan, nomor API terpisah, template dan pemetaan konteks |
| C6 | Alternatif WhatsApp Web terpisah: kirim, terima dan balas ke nomor pribadi penguji | Lulus CDP background; pesan awal dibaca, balasan masuk dari penguji, balasan penutup dari web disampaikan |

## Hasil PoC Meta, 27 Oktober 2026

Aplikasi Meta khusus UAT dibuat dan tetap Unpublished. Akses hanya diberikan ke
akun WhatsApp tes. Nomor pribadi pemilik dipakai sebagai penerima uji, bukan
nomor Business utama. Pesan dari aplikasi WhatsApp masuk ke Chatwoot melalui
webhook dengan tanda tangan valid. Balasan dikirim lewat browser operator
sungguhan. Meta menerima permintaan, lalu menandainya gagal dengan kode 131031,
`Business Account locked`. Pesan template awal juga gagal dengan kode yang sama.
Uji pengiriman dua arah belum lulus.

API akun melaporkan ACTIVE, APPROVED dan business verification verified, tetapi
health check memblokir pengiriman dengan kode 141006 terkait metode pembayaran.
Security Centre untuk WhatsApp meminta informasi tambahan, sedangkan WhatsApp
Manager meminta verifikasi bisnis. Tidak ada metode pembayaran ditambahkan.
Jangan menganggap perubahan kode dapat menghilangkan pembatasan penyedia ini.

Setelah bukti disimpan, langganan webhook aplikasi UAT dilepas tanpa mengubah
dua aplikasi lain yang sudah terhubung. Tunnel sementara dihentikan dan akses
keluar container Chatwoot dikembalikan ke jaringan internal. Chat website lokal
tetap tersedia. Alternatif sementara memakai chat website dan WhatsApp Business
app/Web sebagai kanal terpisah; penautan WhatsApp Web membutuhkan autentikasi
pemilik dari aplikasi Business. Alternatif ini tidak meneruskan pesan widget ke
WhatsApp secara otomatis dan tidak membuktikan Coexistence.

## Hasil alternatif WhatsApp Web, 27 Oktober 2026

Pemilik menyelesaikan penautan dari aplikasi WhatsApp. Pengujian pada percakapan
pribadi pemilik berakhiran 0123 memakai kode `BIS-2710-94DB`: pesan dari WhatsApp
Web pukul 20.23 WIB berstatus dibaca, balasan penguji pukul 20.30 WIB terbaca
sebagai pesan masuk, lalu balasan penutup dari web pukul 20.39 WIB berstatus
disampaikan. Pemilik juga mengonfirmasi pesan diterima dan sudah dibalas.
Browser CDP tetap tersembunyi, tidak aktif dan diminimalkan.

Hasil ini membuktikan percakapan manual dua arah pada sesi WhatsApp Web yang
ditautkan. Nomor pengirim belum dibaca secara independen dari profil akun.
Chat website masih kanal terpisah; C4 dan C5 belum lulus. Pembatasan Meta API
pada PoC di atas tetap berlaku. Bukti hanya memuat percakapan uji pemilik,
bukan riwayat pelanggan.

## Kontrak dan keandalan

`POST /api/public/leads` menerima payload lama serta field tambahan:
`request_id` (UUID v4), `preferred_contact` (`whatsapp`/`email`), `timeline`,
`organization`, dan `selected_plan`. Email boleh kosong bila WhatsApp valid.
Nomor Indonesia dinormalisasi ke +62. Respons berisi `lead_id`, `reference`,
`status`, `replayed`. Pengiriman baru berstatus HTTP 201; replay identik HTTP 200.
ID yang dipakai untuk isi berbeda ditolak HTTP 409. Frontend mempertahankan ID
saat gagal jaringan dan menggantinya ketika isi brief berubah.

Brief dan dua pekerjaan delivery commit bersama. Worker polling tiap lima detik,
lease 60 detik, timeout kirim 15 detik, maksimal delapan percobaan dengan jeda
bertambah. Konfigurasi kosong berstatus `blocked` dan dicek lagi satu jam kemudian.
Respons/badan error penyedia tidak disalin ke tabel atau log worker.

Status email `sent` berarti penyedia menerima permintaan, bukan bukti email tiba di inbox. Kontak terstruktur tidak disalin lagi ke URL WhatsApp.

Resend memakai `Idempotency-Key` berdasarkan ID lead. Karena retensi kunci
penyedia 24 jam, percobaan email ambigu yang berumur 23 jam ditahan untuk tinjauan,
bukan dikirim ulang otomatis. Kegagalan/lease tidak menjamin exactly-once jaringan;
penerima CRM memakai receipt permanen untuk deduplikasi.

`source_lead_id` dikirim ke LeadKu. Receipt `(tenant_id, source_lead_id)` dan hash
payload dibuat dalam transaksi yang sama dengan contact, deal, note dan task.
Penanggung jawab memakai aturan distribusi yang sudah ada; saat penerbit event
tidak tersedia, aturan lama mengembalikan lead ke Owner. Tugas review dijadwalkan
pada jam kerja WIB dan melewati akhir pekan. Tanggal itu tugas internal, bukan
reservasi pertemuan atau janji waktu balasan kepada calon pelanggan.

## Pengaktifan chat website

Default chat **nonaktif**. Isi env berikut saat build dan runtime:

- `NUXT_PUBLIC_CHATWOOT_BASE_URL`: origin HTTPS saja, misalnya domain chat sendiri.
- `NUXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN`: token widget publik dari inbox website.
- `NUXT_PUBLIC_CHATWOOT_ALLOW_LOCAL=true`: khusus uji loopback HTTP; kosongkan di produksi.

CSP dibentuk saat build dan hanya menambahkan origin yang dikonfigurasi untuk
script, frame dan koneksi WebSocket. Perubahan env memerlukan build baru.
Jangan memperlebar CSP dengan wildcard. API token operator, Meta app secret dan
token WhatsApp tidak boleh masuk runtime config publik atau kode frontend.

Chatwoot diuji lokal dengan image resmi `chatwoot/chatwoot:v4.19.1-ce`. Database,
Redis dan aplikasi berada pada jaringan internal terpisah; proxy hanya menerbitkan
127.0.0.1:13090. Tidak memakai data pelanggan atau kredensial produksi. Konfigurasi
dan token uji disimpan di direktori artifact privat, bukan git.

## Urutan penerapan setelah UAT disetujui

1. Terapkan migration receipt dan tenant-service LeadKu lebih dulu. Versi lama
   menolak kontak tanpa email dan belum melakukan deduplikasi.
   Pastikan `SALES_INBOX_TENANT_SLUG` menunjuk workspace milik CoreAsia dengan
   pemilik aktif, pipeline dan tahap tersedia. Nilai bawaan tidak membuat
   workspace otomatis.
2. Terapkan gateway beserta migration 18 dan worker; periksa penyimpanan serta
   status delivery dengan data uji yang disetujui.
3. Terapkan frontend brief. Jangan mendahulukan frontend terhadap gateway baru.
4. Aktivasi chat dipisahkan dari rilis brief. Tentukan hosting, backup, retensi,
   operator, jam kerja dan domain HTTPS. Jalankan ulang pengujian dua arah.
5. Untuk WA Business, gunakan onboarding Coexistence yang resmi setelah akses
   Meta tersedia. Jangan menghapus akun app atau memigrasikan nomor sebagai jalan
   pintas. Uji dampak perangkat tertaut sebelum nomor utama dihubungkan.

Rollback aplikasi mempertahankan tabel receipt dan outbox. Migration down sengaja
menahan data; migration up dapat dijalankan ulang. Pada rollback gateway, pause
pekerjaan yang belum selesai dan tinjau sebelum mengaktifkan worker lagi.
Jangan mengantre ulang email lama tanpa memeriksa status pada penyedia. CRM dapat
dicoba ulang menggunakan source ID asli agar receipt tetap melindungi duplikasi.

Kueri pemeriksaan tanpa membaca isi pelanggan:

```sql
SELECT channel, status, count(*)
FROM public.contact_lead_deliveries
GROUP BY channel, status ORDER BY channel, status;

SELECT id, lead_id, channel, attempts, last_error, next_attempt_at
FROM public.contact_lead_deliveries
WHERE status IN ('failed', 'blocked') ORDER BY id;
```

## Pengujian lokal yang dapat diulang

Pakai database disposable loopback 127.0.0.1:55483 bernama `brief_test`. Jalankan
migration contact_leads 12, 13, 18, migration public tenant 1–10 serta receipt 18 LeadKu. Skrip artifact `_prepare-db.py brief_verify` menyiapkan fixture baru ini dan mencatat checksum migration; itu bukan migrator produksi. Fixture baru tidak boleh memakai DSN produksi.

Gateway: `go test ./...`; uji DB memakai `GATEWAY_TEST_DATABASE_URL` dan
`GATEWAY_TEST_DATABASE_DISPOSABLE=1`, lalu
`go test ./internal/repository -run TestContactBriefPersistenceAndReplay -count=1`.

LeadKu: unit usecase dan HTTP; uji DB memakai `DATABASE_URL` loopback, lalu
`go test ./services/tenant-service/internal/application/usecase -run TestWebsiteBrief -count=1`.

Harness lokal kedua repository ada di `cmd/brief-uat`, dibatasi flag
`ALLOW_LOCAL_BRIEF_UAT=1`, port loopback dan database uji tetap. Tidak menjalankan
bot artikel, SMTP, NATS, atau koneksi CRM produksi. Frontend diuji memakai
Playwright yang tersambung ke Chrome CDP tersembunyi; skrip dan hasilnya berada di
`/Users/dante/Codex/artifact/coreasia/brief-implementation-2026-10-27/`.
