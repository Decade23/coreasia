# Perangkat tepercaya Console

Pengguna dapat memilih **Percayai perangkat ini** saat memasukkan TOTP, atau dari **Keamanan akun**. Login pertama tetap memakai sandi dan TOTP. Perangkat tanpa TOTP tidak dapat dipercaya.

Sesi berlaku 7 hari. Refresh yang sah memperpanjang catatan perangkat dan cookie refresh menjadi 7 hari dari saat itu. Perangkat yang sudah kedaluwarsa tidak dapat dihidupkan kembali lewat refresh. Tanpa pilihan ini, batas sesi TOTP tetap 12 jam.

Kesegaran TOTP tetap 12 jam, termasuk untuk izin data pribadi CashFlow. Refresh tidak mengubah `mfa_at`. Bila verifikasi sudah lama, pengguna mengisi kode di Console, lalu menyambungkan kembali sesi CashFlow. Pengguna tidak perlu keluar untuk melakukan verifikasi ini.

## Pencabutan

- **Keluar** mencabut sesi perangkat tepercaya yang sedang dipakai.
- **Cabut akses** di Keamanan akun mencabut perangkat milik pengguna itu saja. Catatan diperiksa di setiap permintaan gateway, termasuk baca.
- Pencabutan perangkat melalui Console juga mencabut sesi modul CashFlow milik admin. Perangkat lain yang masih sah dapat menyambungkan kembali CashFlow.
- Keluar dari semua perangkat, perubahan kredensial, penonaktifan akun, atau reset TOTP tetap menegakkan `token_version`.

Token gateway tetap memakai cookie HttpOnly. BFF menangani enrollment dan verifikasi dalam sesi, lalu hanya menjawab `{ok:true}` ke browser. Proxy umum menolak endpoint yang menerbitkan token. Id perangkat merupakan klaim JWT yang ditandatangani, bukan sidik jari browser atau rahasia autentikasi tersendiri.

## Urutan rilis

1. Jalankan `go vet` dan seluruh uji dengan Postgres serta Redis sekali pakai. Jalankan uji frontend dengan `CASHFLOW_MIGRASI` menunjuk repo CashFlow.
2. Buat cadangan gateway terenkripsi. Simpan kunci terpisah. Pulihkan di container tanpa jaringan dan cocokkan jumlah baris setiap tabel.
3. Uji migrasi `000019` naik, turun, lalu naik pada hasil pemulihan.
4. Rilis gateway lebih dahulu. Startup menerapkan `000019_admin_trusted_devices`. Pastikan versi migrasi 19, `dirty=false`, health baik, dan login lama tetap berfungsi.
5. Rilis frontend. Uji login TOTP, cookie 7 hari, refresh otomatis, verifikasi dalam sesi, dan pencabutan perangkat.

## Rollback

Jangan menjalankan image gateway lama dengan metadata migrasi 19. Hentikan gateway, gunakan transaksi untuk menjalankan `000019_admin_trusted_devices.down.sql` dan mengembalikan `gateway_schema_migrations` ke versi 18. Pastikan versi awal tepat 19 dan tidak dirty sebelum mengubahnya. Kemudian jalankan image sebelumnya. Rollback menghapus daftar perangkat tepercaya sehingga pengguna perlu login lagi. Tabel bisnis tidak berubah.

Frontend dapat dikembalikan ke deployment sebelum fitur perangkat tepercaya. Gateway baru tetap menerima alur login frontend lama.
