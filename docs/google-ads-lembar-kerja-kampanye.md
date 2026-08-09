# Lembar kerja kampanye Google Ads: dua halaman layanan

Dokumen ini adalah lembar kerja operasional. Isinya siap diketikkan ke Google Ads.
Untuk latar belakang dan gerbang peluncuran, lihat [google-ads-coreasia-600k.md](google-ads-coreasia-600k.md).

Seluruh angka di sini sudah melewati pemeriksaan lawan. Angka anggaran versi
sebelumnya, Rp58.000 per hari, terbukti tidak aman dan sudah dikoreksi. Alasannya
dijelaskan di bagian anggaran.

## Struktur

Satu kampanye Search, dua ad group. Bukan dua kampanye, karena plafon Rp600.000
tidak cukup membiayai dua kampanye tanpa membuat keduanya kelaparan anggaran.

| Ad group | Halaman tujuan | Status saat peluncuran |
| --- | --- | --- |
| AG1 Website Bisnis dan Company Profile | `/layanan/jasa-pembuatan-website` | Aktif, menerima 100 persen anggaran |
| AG2 Aplikasi Web Custom dan Sistem Internal | `/layanan/jasa-pembuatan-aplikasi-web` | Dijeda, menerima Rp0 |

AG2 dijeda bukan karena kata kuncinya lemah, melainkan karena halamannya belum siap
dibiayai: 371 kata berbanding 806 di halaman A, tanpa satu pun angka harga, tanpa
bagian proses kerja, dan tanpa cakupan kota. Kata kunci bermaksud harga di halaman
seperti itu mendapat Quality Score rendah, yang berarti biaya per klik naik dan
plafon habis lebih cepat. AG2 baru layak dinyalakan setelah halaman B punya bagian
estimasi biaya dan proses kerja.

## Anggaran

| Item | Nilai |
| --- | --- |
| Anggaran harian | Rp54.000 |
| Durasi | 9 hari |
| Belanja media | Rp486.000 |
| Pajak yang dipungut Google atas belanja iklan, 11 persen | Rp53.460 |
| Total pada belanja normal | Rp539.460 |
| Total pada skenario terburuk | Rp599.400 |

Google boleh membelanjakan sampai dua kali anggaran harian pada hari tertentu, dan
hanya menjamin rata-rata pada tingkat bulanan. Kampanye ini hanya sembilan hari,
jadi jaminan rata-rata bulanan tidak melindungi apa pun. Skenario terburuk di atas
dihitung dari satu hari over-delivery penuh, yaitu media Rp540.000, dan hasilnya
masih di bawah plafon.

Angka Rp58.000 per hari yang sempat dirancang tidak lolos pemeriksaan. Sisa
Rp20.580 yang dianggap bantalan ternyata sisa bruto; ruang belanja media
sebenarnya hanya Rp18.541, yaitu sepertiga hari. Satu hari over-delivery penuh
membawa total ke Rp643.800, atau 7,3 persen di atas plafon.

**Penegak plafon harus mekanis, bukan niat.** Kampanye Search tidak punya setelan
total budget, jadi tidak ada satu pun kendali di dalam produk yang bisa menegakkan
Rp600.000. Jalankan akun dalam mode pembayaran manual atau prabayar, isi saldo
persis Rp600.000, dan jangan pasang kartu. Dengan begitu platform secara fisik
tidak bisa membelanjakan lebih.

### Strategi bid

Maximize Clicks dengan batas maksimum CPC Rp10.000.

Akun ini belum punya satu pun konversi historis, jadi seluruh strategi berbasis
konversi dilarang: jangan pakai Maximize Conversions, Target CPA, Target ROAS,
maupun Enhanced CPC. Semuanya belajar dari data yang belum ada.

Perlu disadari bahwa Maximize Clicks secara desain berusaha menghabiskan anggaran
harian penuh setiap hari, sehingga menaikkan peluang hari over-delivery. Bila
prioritas utamanya adalah tidak menembus plafon dan bukan kecepatan mengumpulkan
klik, Manual CPC lebih pasif dan lebih aman.

**Gerbang pemeriksaan hari kedua.** Bila belanja kumulatif di bawah 40 persen dari
target dua hari, itu bukan tanda untuk bersabar melainkan tanda batas CPC terlalu
rendah dibanding harga pasar. Dalam kasus itu batas boleh dinaikkan ke Rp12.000,
khusus pada dua kata kunci exact paling spesifik, bukan pada semuanya.

## Kata kunci AG1

Hanya exact dan phrase. Broad match dilarang.

| Kata kunci | Pencocokan | Perkiraan CPC |
| --- | --- | --- |
| jasa pembuatan website | exact | Rp12.000 |
| jasa pembuatan website jakarta | exact | Rp10.000 |
| jasa pembuatan website perusahaan | exact | Rp8.500 |
| jasa pembuatan website company profile | exact | Rp7.500 |
| biaya pembuatan website | exact | Rp6.500 |
| jasa pembuatan toko online | exact | Rp8.000 |
| jasa pembuatan landing page | exact | Rp6.000 |
| "jasa pembuatan website" | phrase | Rp9.500 |
| "jasa buat website perusahaan" | phrase | Rp7.000 |
| "harga jasa pembuatan website" | phrase | Rp6.500 |

Dua perubahan dari rancangan awal. Kata kunci `[jasa pembuatan company profile]`
dibuang karena maksudnya ambigu: di Indonesia frasa itu sangat sering berarti
company profile cetak, katalog, atau video, dan halaman A tidak menjawab tafsiran
itu sama sekali. Karena bentuknya exact, tidak ada kata negatif yang bisa memisahkan
pencari video dari pencari website. Penggantinya adalah bentuk yang tidak ambigu.

Phrase `"jasa pembuatan website company profile"` juga dibuang karena setiap kueri
yang cocok dengannya pasti juga cocok dengan phrase `"jasa pembuatan website"` yang
sudah ada di ad group yang sama. Kehadirannya hanya memecah klik ke lebih banyak
baris laporan.

## Kata kunci AG2, dijeda

| Kata kunci | Pencocokan | Perkiraan CPC |
| --- | --- | --- |
| jasa pembuatan aplikasi web | exact | Rp9.000 |
| jasa pembuatan aplikasi web custom | exact | Rp9.000 |
| jasa pembuatan aplikasi crm | exact | Rp11.000 |
| jasa pembuatan aplikasi lms | exact | Rp8.000 |
| jasa pembuatan aplikasi erp | exact | Rp13.000 |
| jasa pembuatan dashboard perusahaan | exact | Rp7.000 |
| "aplikasi web custom" | phrase | Rp8.000 |

Phrase `"jasa pembuatan sistem internal"` ditunda. Frasa "sistem internal" hanya ada
di meta deskripsi halaman B, tidak di satu pun teks yang dilihat pengunjung, jadi
relevansi halaman tujuannya tidak terbukti.

Sebelum AG2 dinyalakan, tambahkan `"aplikasi web"` sebagai negatif frasa di AG1
supaya pemisahan kedua ad group simetris.

## Kata kunci negatif

Kata negatif `murah` dipasang sebagai **kata tunggal di tingkat kampanye**, bukan
frasa dan bukan di AG2. Rancangan awal menaruhnya di AG2 yang dijeda dan menerima
Rp0, sementara AG1 yang menerima seluruh anggaran justru terbuka terhadap kueri
seperti "jasa pembuatan website murah". Segmen itu mengharapkan Rp500 ribu sampai
Rp1 juta, sedangkan lantai harga CoreAsia Rp3 juta.

**Tingkat kampanye.** gratis, free, murah, termurah, tutorial, belajar, kursus,
pelatihan, bootcamp, sekolah, kuliah, materi, modul, ebook, pdf, ppt, lowongan,
loker, karir, karier, magang, gaji, rekrutmen, dicari, template, templat, tema,
theme, plugin, source code, sourcecode, github, gitlab, download, unduh, crack,
nulled, apk, mod, skripsi, tugas, makalah, jurnal, proposal, cara membuat website,
cara bikin website, buat website sendiri, bikin website sendiri, website gratis,
web builder, website builder, ai website builder, wordpress, wix, weebly, blogspot,
blogger, squarespace, webflow, shopify, joomla, laravel, codeigniter, hosting, vps,
niagahoster, domainesia, cpanel, 100 ribu, 200 ribu, 300 ribu, 500 ribu, freelance,
fiverr, sribu, upwork, borongan, framer, bubble, elementor, canva, google sites,
video, brosur, katalog, cetak, percetakan, jasa seo, jasa iklan, digital marketing,
jasa logo, desain logo, desain grafis, banner, jasa penulis artikel, aplikasi
android, aplikasi mobile, aplikasi ios, game, jasa perbaikan website, website error,
hack, hacker, login, admin, judi, slot, gacor, togel, casino, situs judi, singapore,
singapura, malaysia, dubai, luar negeri, adalah, artinya, pengertian, contoh,
review, perbandingan

**AG1.** crm, erp, lms, dashboard, aplikasi web custom, sistem internal,
sistem informasi

**AG2.** company profile, toko online, landing page, android, ios, mobile,
aplikasi kasir

## Sitelink

Setiap sitelink harus menuju halaman yang berbeda dari URL akhir iklannya. Sitelink
yang hanya berbeda pada penanda jangkar tetap dianggap halaman yang sama.

**AG1.**

| Teks | Tujuan |
| --- | --- |
| Rincian Estimasi Biaya | `/faq` |
| Portofolio Proyek | `/portfolio` |
| Konsultasi Gratis | `/contact?subject=website` |
| Proses Pengerjaan | `/layanan/jasa-pembuatan-website#proses` |

**AG2.**

| Teks | Tujuan |
| --- | --- |
| Yang Bisa Kami Bangun | `/faq` |
| Portofolio Proyek | `/portfolio` |
| Konsultasi Gratis | `/contact?subject=webapp` |
| Jasa Pembuatan Website | `/layanan/jasa-pembuatan-website` |

Dua koreksi penting. Sitelink konsultasi wajib membawa parameter subjek, karena
subjek adalah kolom wajib di formulir dan pengunjung yang mendarat tanpa parameter
menghadapi kolom kosong. Nilai `website` dan `webapp` sudah tersedia di daftar
subjek dan sudah diverifikasi bekerja di produksi.

Sitelink AG1 tidak boleh menuju halaman B. AG2 dijeda justru supaya klik berbayar
tidak mendarat di halaman yang belum siap, dan klik sitelink dibebankan persis sama
dengan klik judul iklan dari kantong anggaran yang sama.

## Yang realistis diharapkan

| Ukuran | Angka |
| --- | --- |
| Klik, batas atas pada CPC Rp8.000 | sekitar 60 |
| Klik, rentang realistis bila tayangan tipis | 30 sampai 45 |
| Total kontak masuk | 1 sampai 3 |
| Lead yang tercatat di Google Ads | 0 sampai 2 |

Dua angka terakhir sengaja dipisah. Selisihnya adalah kontak yang masuk lewat
WhatsApp, yang tidak tercatat sebagai konversi Google Ads karena kontainer GTM
tidak memuat satu pun tag konversi Ads. Tanpa pemisahan ini, angka nol di dasbor
akan terbaca sebagai kampanye gagal padahal percakapannya nyata.

Risiko yang lebih mungkin terjadi bukan boros, melainkan kampanye tidak
menghabiskan uangnya. Batas CPC Rp10.000 berada di bawah perkiraan CPC pasar kata
kunci kepala, dan tiga kata kunci diperkirakan di atas atau mendekati batas itu.
Karena itu ada gerbang pemeriksaan hari kedua di bagian strategi bid.

**Yang bisa dipanen dari uang ini** adalah bukti bahwa rantai dari klik iklan
sampai baris di `public.contact_leads` benar-benar utuh, angka CPC nyata per kata
kunci sebagai dasar anggaran berikutnya, dan sinyal kasar kata kunci mana yang
punya tayangan di Jakarta.

**Yang tidak bisa dipanen** adalah perbaikan daftar negatif dari laporan search
terms. Delapan dari sepuluh kata kunci AG1 berbentuk exact, yang praktis
mengembalikan kata kuncinya sendiri, dan dengan sekitar 60 klik tersebar ke sepuluh
kata kunci, mayoritas istilah jatuh di bawah ambang pelaporan Google.

## Setelan yang wajib diperiksa ulang

Google sering menyalakan ini diam-diam setelah kampanye dibuat.

- Search Partners nonaktif
- Display Network nonaktif
- AI Max dan final URL expansion nonaktif
- Broad match tidak dipakai
- Auto-tagging aktif, supaya `gclid` ditempelkan Google
- Conversion action: Count disetel ke One, bukan Every
- Lokasi: DKI Jakarta, dengan setelan Presence, bukan Presence or interest

## Perlakuan angka

Perlakukan tabel `public.contact_leads` ditambah kotak masuk WhatsApp sebagai
catatan resmi jumlah lead, dan dasbor Google Ads sebagai angka yang selalu lebih
rendah. Konversi bergantung pada satu jalur di sisi peramban tanpa cadangan, dan
gagal tanpa jejak bila pemblokir iklan aktif.

Pesan WhatsApp di kedua halaman kini menyebut nama halaman asalnya, sehingga
percakapan dari iklan bisa dikenali langsung dari dalam WhatsApp tanpa bergantung
pada tag apa pun.

Catatan penting soal pajak: 11 persen yang muncul di tagihan adalah pajak yang
dipungut Google atas belanja iklan, bukan pajak yang dipungut CoreAsia. CoreAsia
belum PKP. Bila dokumen ini pernah ditunjukkan ke klien, tulis labelnya secara
jelas agar tidak terbaca sebagai PPN dari CoreAsia.
