# Situs publik CoreAsia, 27 Oktober 2026

Cabang lokal `feat/public-seo-light-20261027`, berdasarkan `2ac18ae`. Belum di-push atau dipasang ke produksi. Perubahan CashFlow dan mail pada checkout semula tetap terpisah.

## Perilaku yang berubah

- Light theme publik memakai latar putih dan kartu putih sesuai proposal. Header A tanpa garis bawah dan tombol burger tanpa border. Hero serta animasi komponen yang sudah ada tetap digunakan. Navigasi memakai komponen Vue, disclosure keyboard dan dialog ponsel, tanpa menyisipkan DOM setelah render.
- Beranda mengutamakan jasa website/aplikasi. `/layanan` menjadi halaman pengantar yang benar-benar dirender, bukan redirect. Dua studi kasus produk milik CoreAsia dan tiga panduan jasa menghubungkan kebutuhan, contoh dan konsultasi.
- Harga memakai katalog publik yang telah tersedia. Empat estimasi jasa dan lima katalog produk dirender di server. LMS ditandai sedang disiapkan, tanpa harga nol atau janji ketersediaan palsu.
- `/api/public/articles`, detail artikel dan sitemap memakai katalog publik yang sama. Artikel yang ditulis di repo tetap tersedia saat gateway gagal. Artikel CMS terbit dapat menambah atau menimpa data; draft, artikel privat, tanggal masa depan dan slug invalid disaring. Daftar CMS yang tidak membawa isi tidak menghapus isi artikel repo. Untuk menarik artikel yang ditulis di repo, hapus dari sumber repo juga.
- Sebelas artikel mendapat ilustrasi lokal dalam 480/800/1200 px. Untuk OG/X/schema tersedia JPG 1200×630 sebagai format berbagi lintas platform. Gambar editor yang aman tetap diutamakan. Ilustrasi diberi keterangan dan tidak dipakai sebagai bukti screenshot produk. Prompt dan asal tercatat di `ilustrasi-artikel.json`.
- Canonical menghapus parameter kampanye. OG/X memakai gambar halaman/artikel yang sama. Schema artikel/breadcrumb memakai JSON-LD aman dan tanggal sebenarnya. Artikel/studi kasus yang belum diterjemahkan hanya menawarkan bahasa Indonesia. Navigasi bahasa memperbarui judul dan metadata, tanpa mengirim salinan seluruh kamus melalui payload HTML.
- `/downloader` dan `/downloader/` dialihkan 301 ke produk yang tersedia. URL pemulihan lisensi tidak masuk sitemap dan memakai noindex. URL yang tidak ada tetap 404.
- Analytics/iklan menunggu pilihan privasi. Pengunjung dapat mengizinkan analytics dan iklan secara terpisah, lalu menarik izin. Pencatatan aplikasi mencegah page view ganda dan menjaga URL konsol dari analytics.
- Animasi jaringan berhenti saat tab tidak terlihat, komponen di luar viewport, atau pengunjung meminta kurangi gerak. Listener, timer dan scene dibersihkan saat komponen dilepas.

## Baseline Search Console yang dibaca langsung

Properti Domain `coreasia.id` mencakup subdomain. Laporan indeks diperbarui 23 Oktober 2026. Seluruh properti: 62 terindeks dan 74 tidak diindeks. Filter sitemap `https://coreasia.id/sitemap.xml`: **25 terindeks, 12 tidak diindeks**. Jadi 74 bukan jumlah kegagalan situs utama.

Enam URL sitemap utama ditemukan tetapi belum di-crawl: dua artikel unduhan, tiga halaman sistem operasional (klinik/transaksi/K3), serta Beres. Lima sudah di-crawl tetapi belum dipilih untuk indeks: portofolio, artikel pengantar download manager, syarat downloader, kerja sama dan syarat umum. Satu catatan noindex adalah privacy-policy yang terakhir di-crawl 30 Juni. Saat diperiksa sekarang, produksi sudah mengirim meta index untuk halaman tersebut; jangan membuka blokir atau mengubah kebijakan hanya berdasarkan data lama.

Performa seluruh properti 25 Juli–24 Oktober: 19 klik, sekitar 2,57 ribu tayangan, CTR 0,7%, posisi rata-rata 36. Kueri jasa website Jakarta (160 tayangan) dan jasa aplikasi web (72) belum menghasilkan klik pada laporan yang dibaca. Kueri/halaman hanya sampel teratas; metrik mencakup subdomain dan query tersembunyi Google.

Sitemap root berstatus Sukses, 37 URL ditemukan, dibaca 17 Oktober. Sitemap Pantau juga Sukses, 21 URL, dibaca 21 Oktober. Tidak ada pengiriman sitemap, permintaan indeks, penghapusan URL atau validasi perbaikan selama pekerjaan lokal ini.

## Verifikasi dan batasnya

Bukti lengkap disimpan di `/Users/dante/Codex/artifact/coreasia/seo-2026-10-27/`. Perintah pengujian menggunakan Node karena Bun tidak tersedia pada shell sesi ini.

- Build produksi lokal, seluruh Vitest, ESLint berkas yang berubah, dan diff whitespace.
- HTTP seluruh 42 URL sitemap lokal, canonical/status/metadata, 11 artikel, schema/gambar, 404 dan utilitas noindex.
- Chrome native CDP tersembunyi: 39 pemeriksaan interaksi termasuk keyboard, sentuhan, 320–1440 px, light/dark, bahasa, consent dan pencatatan ganda. Permintaan tracker disimulasikan; tidak ada kiriman analytics nyata dari QA.
- Preview kanvas memuat 12 artboard dari aplikasi hasil build melalui proxy loopback yang hanya menerima GET/HEAD, menahan tracker dan membuka iframe khusus canvas.local. Pengecualian iframe itu tidak menjadi konfigurasi keamanan aplikasi.
- Pemeriksaan viewport merupakan emulasi. Tidak ada klaim uji perangkat fisik atau penilaian visual dari screenshot Chrome yang disembunyikan. Ukuran transfer lokal bukan skor LCP/INP atau data lapangan. Search Console belum mempunyai data Core Web Vitals yang cukup.

## Setelah izin publikasi

1. Periksa diff dan pratinjau. Push/deploy hanya setelah instruksi eksplisit Master.
2. Build untuk target Vercel, bukan menyalin `.output` darwin-arm64 lokal. Runtime config produksi memakai konfigurasi produksi, bukan ID tracker tiruan QA.
3. Uji publik melalui Cloudflare dan origin: status/canonical, robots, sitemap, gambar OG, URL baru dan redirect lama. Periksa injeksi Cloudflare RUM serta konfigurasi tag GTM supaya tidak mengirim pelacak sebelum izin atau page view ganda.
4. Setelah konten benar-benar terbit, kirim ulang sitemap utama dan inspeksi URL prioritas yang baru/berubah. Jangan meminta indeks halaman admin/akun atau mencoba mengindeks semua URL yang dikecualikan.
5. Bandingkan jendela 28 hari yang setara untuk klik/tayangan nonmerek, halaman jasa/produk, CTR dan konsultasi. Pantau lagi indeks setelah Google melakukan crawl. Sitelinks dan peringkat ditentukan Google; markup maupun sitemap tidak menjamin posisi pertama.

Endpoint gateway lama `/api/plans` masih gagal karena tabel LMS `subscription_plans` tidak tersedia. Halaman harga publik yang diperbaiki tidak lagi memakainya. Membuat tabel/paket LMS tanpa produk yang siap tidak termasuk perbaikan ini.

Acuan resmi: [sitelinks](https://developers.google.com/search/docs/appearance/sitelinks), [laporan indeks](https://support.google.com/webmasters/answer/7440203), [permintaan crawl](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl), [pengalaman halaman](https://developers.google.com/search/docs/appearance/page-experience).
