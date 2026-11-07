# Console LeadKu

Halaman `/console/leadku` memakai layout, ubin statistik dan token warna Console
yang sama dengan CashFlow. Peran `admin` dapat membaca. Hanya `super_admin`
dengan izin `leadku:settings` dapat menyimpan versi dan mengimpor laporan.
Gateway tetap menegakkan izin; menyembunyikan tombol bukan pengaman utama.

## Data dan versi

Kanal Produksi dan UAT dibaca terpisah dari `/admin/leadku/analytics`.
Pada kanal Produksi, **Instalasi Google Play** menampilkan jumlah pemasangan
perangkat baru untuk tanggal yang tercakup dalam laporan resmi. Metrik basis
instalasi memakai tanggal laporan terbaru. **Telemetri aplikasi** menghitung
ID instalasi yang melapor, termasuk aktivitas sebelum rilis publik.

Jika laporan tersedia, unduh CSV instalasi bulanan LeadKu dari **Play Console
→ Kelola akun → Laporan aplikasi Play → Statistik**. Admin dengan izin
`leadku:settings` dapat mengunggah file asli lewat **Impor laporan**. Kartu
Google Play menampilkan status belum ada laporan hingga CSV diimpor atau
sinkronisasi berhasil. [Panduan Google Play](https://support.google.com/googleplay/android-developer/answer/6135870?hl=id)

Pengaturan versi menggunakan `expected_updated_at`. Editor yang membaca data
lama ditolak 409 agar tidak menimpa perubahan admin lain. Minimum 0 berarti
opsional. Rilis yang belum tersedia tidak diiklankan melalui endpoint publik.
Produksi yang aktif saat pemulihan adalah 1.6.3 kode 14, minimum 0, tersedia.

## Pemulihan 5 November 2026

Rilis web `69a84df` tidak membawa modul LeadKu dari checkout terpisah sehingga
URL memberi 404. Perbaikan menggabungkan modul ke sumber rilis terbaru tersebut,
bukan mempromosikan ulang snapshot web yang lebih tua. Berkas fitur CashFlow
tetap sama. Perubahan bersama terbatas pada satu entri navigasi LeadKu, izin
LeadKu tambahan, dan bundle ikon lokal untuk CSP Console.

Source backend identik dengan layanan LeadKu Console yang sudah aktif.
Pemulihan web tidak memerlukan deploy backend atau migrasi database. Pengujian
memakai gateway, PostgreSQL, identitas dan CSV sintetis pada stack loopback
terpisah; data klien dan laporan produksi tidak ditulis.

Validasi lokal: 1.066 unit lulus, 133 uji SQL lintas repo dilewati; 223 tag
komponen CashFlow terdaftar. Uji browser LeadKu 18 lulus pada Nuxt/BFF/gateway/
PostgreSQL nyata: route/login, statistik per kanal, simpan versi, stale editor,
impor CSV, lebar 390px, peran baca-saja dan penolakan anonim. Regresi CashFlow
tabel 27 dan lightbox 37 lulus menggunakan data sintetis. Lint berkas LeadKu
lulus; layout Console memiliki dua temuan baseline yang tidak diubah dalam
lingkup ini. Tidak mengklaim lint seluruh repo bersih.

Runner `scripts/uji-console-leadku-headless.mjs` menolak target non-loopback.
Jalankan dengan `LEADKU_QA_BASE`, `LEADKU_QA_GATEWAY`, `LEADKU_QA_IDENTITY`,
`LEADKU_QA_ARTIFACTS` dan `PLAYWRIGHT_CORE_PATH` setelah stack QA dibuat.
Jangan arahkan fixture ke layanan production.

Sebelum rilis, sumber harus masuk ke cabang produksi agar deployment berikutnya
tidak menghilangkan modul lagi. Push menunggu izin eksplisit Master sesuai
AGENTS global. Kandidat harus memakai basis produksi yang masih aktif; bila
basis berubah, gabungkan ulang sebelum promosi. Bukti dan cadangan deployment
sebelumnya disimpan di `/Users/dante/Codex/artifact/leadku/_console-restore-20261105/`.
