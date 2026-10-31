# Jaga Layanan

Pemantau uptime CoreAsia yang berjalan di Cloudflare Workers, di luar semua VPS.
Tiap 5 menit memeriksa daftar di `src/target.js`, dan tiap jam juga memeriksa umur
cadangan DB di bucket R2 `coreasia-backup`. Email lewat Resend ke `EMAIL_KE`
saat status berubah: mati setelah 2 putaran gagal beruntun, pulih setelah 2
putaran sehat beruntun (cadangan cukup sekali karena diperiksa per jam). Selama
masih mati ada pengingat tiap 6 jam.

Dibuat setelah 2-3 Okt 2026: deposit IDCloudHost habis, empat VPS mati sampai
25 jam (iat-obs hampir 11 hari) dan tidak ada yang memberi tahu, karena semua
pemantau lama ikut berjalan di server yang mati.

Beberapa hal yang sengaja dibuat begitu:

- Paling banyak 5 pemeriksaan berjalan bersamaan, batas waktu 8 detik dihitung
  setelah giliran didapat. Workers mengantre koneksi ke-7 dengan jam batas
  waktu yang sudah berjalan, jadi tanpa ini situs sehat ikut "mati" saat VPS
  IDCloudHost menggantung.
- Target yang naik-turun 4 kali dalam 2 jam dikirimi satu kabar "naik-turun
  berulang", lalu kabarnya ditahan sampai 2 jam tanpa perubahan, baru status
  terakhirnya dikirim sekali.
- Laporan harian tiap pagi (putaran pertama setelah 07.00 WIB) sekaligus tanda
  hidup. Laporan pertama, berjudul `[Jaga] Aktif: ...`, datang di putaran
  pertama setelah deploy, jadi sekalian membuktikan jalur email. Kalau suatu
  pagi tidak ada email dari Jaga, berarti Jaga sendiri yang bermasalah.
- Bila keadaan di KV tidak terbaca, Jaga tidak menulis apa pun dan langsung
  mengabarkan yang gagal. Galat internal (Resend, KV, R2) membuat putaran
  ditandai gagal di Cron Events.
- `HC_PING_URL` (opsional, belum dipasang): URL ping healthchecks.io atau
  sejenisnya. Tiap akhir putaran Jaga melakukan ping ke URL itu, atau
  `URL/fail` bila ada galat internal. Pasang lewat
  `npx wrangler secret put HC_PING_URL` supaya tidak terhapus saat deploy.

Perawatan:

- Tambah/ubah target: edit `src/target.js`, `pnpm test`, lalu `./siapkan.sh`.
- Seri cadangan baru: tambahkan ke `CADANGAN` dengan `mulai` = hari pertama
  cadangan diharapkan ada, supaya tidak langsung berbunyi.
- Keadaan tersimpan di satu kunci KV `keadaan`, ditulis hanya saat berubah
  (batas tulis KV paket gratis 1.000/hari). Target yang dihapus dari daftar
  ikut dibuang dari keadaan pada putaran berikutnya.
- `src/index.js` adalah titik masuk Worker. Jangan mengekspor konstanta dari
  sana, karena workerd menolak ekspor bernama yang bukan fungsi.
- Uji email: `wrangler dev --test-scheduled` dengan `.dev.vars` berisi
  `RESEND_API_KEY=...` dan `UJI_EMAIL=1`, lalu buka `/__scheduled`.
