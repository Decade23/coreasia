# Aktivasi kampanye Google Ads: langkah demi langkah

Panduan urut untuk membuka kampanye `CoreAsia Search Jasa Website Jakarta`.
Ditulis 10 Agustus 2026, **direvisi besar 11 Agustus 2026** setelah pemeriksaan
ulang ke akun `586-398-5692 PT INTI ASIA TEKNOLOGI`.

> **Revisi 11 Agustus 2026.** Versi pertama panduan ini menyimpulkan bahwa
> tindakan konversi belum ada, lalu menyusun dua tahap untuk membuatnya dan
> mencocokkan ID. **Kesimpulan itu salah.** Tindakan konversinya sudah ada sejak
> 9 Agustus 2026 dan ID serta labelnya sudah cocok persis dengan yang dikirim
> situs. Pemeriksaan pertama membaca kartu ringkasan yang tabelnya belum selesai
> dirender, jadi barisnya terbaca kosong. Dua tahap itu dihapus dari panduan ini.

---

## Keadaan kampanye

| Hal | Keadaan |
| --- | --- |
| Status kampanye | Dijeda |
| Anggaran harian | Rp54.000 |
| Strategi bid | Maksimalkan klik |
| Jaringan | Jaringan Penelusuran Google saja |
| Tanggal mulai | 9 Agustus 2026 |
| Tanggal akhir | Belum ditetapkan (ditunda atas keputusan Dedi, 11 Agustus 2026) |
| Dana tersedia | **Rp0**, belum pernah ada pembayaran |

### Penargetan

| Dimensi | Isi |
| --- | --- |
| Lokasi | Daerah Khusus Ibukota Jakarta, satu lokasi saja |
| Opsi lokasi | **Kehadiran**, bukan kehadiran atau minat |
| Pengecualian lokasi | Kosong |
| Bahasa | Indonesia |
| Usia | 18-24 sampai 65+ dan Tidak diketahui, semua aktif |
| Gender | Perempuan, Laki-laki, Tidak diketahui, semua aktif |
| Pendapatan rumah tangga | 10% teratas sampai Di bawah 50% dan Tidak diketahui, semua aktif |
| Segmen audiens | Belum ada, dan tidak ada pengecualian segmen |
| Perangkat | Semua |
| Jadwal iklan | Sepanjang hari |

Penyempitannya hanya dua, yaitu kata kunci dan wilayah Jakarta. Demografi
sengaja dibiarkan terbuka. Pada perkiraan 62 sampai 76 klik, mengecualikan
kelompok usia atau pendapatan akan memotong volume sebelum ada data yang cukup
untuk membuktikan kelompok mana yang memang buruk. Ditambah lagi, porsi
"Tidak diketahui" di kampanye Penelusuran biasanya besar, sehingga pengecualian
apa pun berisiko ikut membuang trafik yang sah.

Opsi **Kehadiran** adalah setelan yang menahan kebocoran terbesar. Bawaan Google
adalah "Kehadiran atau minat", yang ikut menayangkan iklan kepada orang di luar
Jakarta yang kebetulan mengetik "jasa website Jakarta". Jangan diubah.

---

## Pengukuran: sudah beres, tidak ada yang perlu dikerjakan

Diverifikasi langsung di akun pada 11 Agustus 2026.

| Hal | Keadaan |
| --- | --- |
| Nama tindakan konversi | `CoreAsia - Lead Form Saved` |
| Tanggal dibuat | 9 Agustus 2026 |
| Sumber | Situs |
| Pengoptimalan tindakan | Mengirim formulir lead, **Tindakan utama** |
| Disertakan dalam sasaran tingkat akun | Ya |
| Hitung | Satu konversi |
| Periode konversi klik | 90 hari |
| Nilai | Rp1 |
| Atribusi | Berbasis data, saluran berbayar Google |
| Konversi yang Disempurnakan | Tidak dikonfigurasi |
| Status pelacakan | Tidak ada konversi terbaru |

**Pencocokan ID dan label sudah dilakukan dan hasilnya sama persis.** Cuplikan
tag yang Google hasilkan sendiri untuk tindakan konversi ini berbunyi:

```js
gtag('event', 'conversion', {
  'send_to': 'AW-18379615354/3qtKCPCF094cEPrYirxE',
  'event_callback': callback
});
```

Nilai itu identik dengan yang dipanggang di `frontend/landing/nuxt.config.ts`.
Selain itu, `AW-18379615354` terbukti merupakan Tag Google milik akun
`586-398-5692` ini, bukan akun lain. Pada halaman produksi `coreasia.id/contact`
yang dimuat tanpa pemblokir iklan, `gtag` terpasang dan `dataLayer` memuat
`["config","AW-18379615354"]`, jadi tidak ada yang tertahan CSP.

Dua catatan kecil, keduanya boleh dibiarkan:

- **Nilai Rp1.** Strategi bid Maksimalkan klik tidak memakai nilai konversi, jadi
  angka ini tidak mempengaruhi lelang. Efeknya hanya kolom "Nilai konv." di
  laporan akan berisi kelipatan Rp1, yang bisa membingungkan bila dibaca sebagai
  rupiah sungguhan. Boleh diganti ke "Jangan gunakan nilai" kapan saja.
- **Konversi yang Disempurnakan belum dikonfigurasi.** Ini menaikkan akurasi
  pencocokan dengan mengirim email pengirim formulir dalam bentuk ter-hash.
  Bermanfaat, tetapi bukan prasyarat, dan menambah kewajiban persetujuan data.

**Yang belum terbukti hanyalah satu hal**, yaitu apakah sebuah pengiriman brief
sungguhan benar-benar mendaratkan konversi di akun. Tag Google akun ini masih
berlabel "Tidak ada data" dan tab Halaman pada tindakan konversi masih kosong.
Itu wajar: bug `requestAnimationFrame` yang menggantung di tab latar (diperbaiki
pada commit 84a3d99) sempat membuat pemanggilan pelacakan terlewat, sehingga
lead uji sebelum perbaikan itu memang tidak pernah menembakkan konversi.
Karena itu Tahap 1 di bawah tidak boleh dilewati.

---

## Tahap 1: pastikan konversinya benar-benar tercatat

Inilah satu-satunya cara membedakan "tag terpasang" dari "konversi tercatat".

1. Buka `https://coreasia.id/contact?subject=website` di peramban biasa, bukan
   mode penyamaran, dan **matikan pemblokir iklan** untuk domain ini.
2. Isi formulir dengan nama seperti `UJI KONVERSI - abaikan` dan email yang bisa
   Anda kenali, lalu kirim sampai muncul panel "Brief Anda terkirim".
3. Tunggu. **Google Ads menampilkan konversi dengan jeda 3 sampai 24 jam.**
   Jangan menyimpulkan gagal di menit pertama.
4. Besoknya, buka Sasaran, Konversi, Ringkasan, lalu klik
   **Lihat semua tindakan konversi**. Baris `CoreAsia - Lead Form Saved` harus
   menunjukkan angka minimal 1, dan Status pelacakan berubah dari
   "Tidak ada konversi terbaru".

Kalau setelah 24 jam masih nol, kabari saya. Yang saya periksa berikutnya adalah
apakah permintaan ke `googleadservices.com` benar-benar keluar saat submit, dan
apakah `trackLeadConversion` terpanggil sebelum alur sukses menyelesaikan
animasinya.

Baris uji itu boleh dihapus kapan saja dari basis data. Bilang saja, saya
bersihkan sekalian dengan yang di LeadKu.

---

## Tahap 2: isi dana, dua tahap

Diputuskan pada 11 Agustus 2026: dana diisi **Rp300.000 dulu**, lalu ditambah
lagi saat menipis, dengan total sasaran tetap Rp600.000.

Buka **Penagihan**, **Ringkasan**, klik **Tambah dana**.

- Isi pertama: **Rp300.000**.
- Kalau Google menawarkan pembayaran otomatis dengan kartu, **jangan diaktifkan**
  dulu. Prabayar membuat batas belanja bersifat fisik, bukan sekadar setelan.

### Aturan isi ulang: jangan tunggu saldo nol

Akun ini memakai **Pembayaran manual**, dan sampai 11 Agustus 2026 belum pernah
ada pembayaran sama sekali (Penagihan, Setelan). Dua akibatnya:

1. Pencairan tidak selalu seketika, apalagi lewat transfer bank.
2. Pembayaran pertama pada akun yang belum pernah bayar kadang masih lewat
   verifikasi.

Karena itu, **isi ulang saat saldo tersisa sekitar Rp100.000**. Menunggu nol
berarti iklan mati dan jedanya bisa berhari-hari, bukan berjam-jam. Email
peringatan saldo menipis dari Google boleh dipakai, tetapi jangan bergantung
hanya pada itu, periksa sendiri di Penagihan, Ringkasan.

### Durasi

| Nominal | Durasi di Rp54.000 per hari | Perkiraan klik |
| --- | --- | --- |
| Rp300.000 | 5,5 hari | 31 sampai 38 |
| Rp600.000 | 11,1 hari | 62 sampai 76 |

Google boleh membelanjakan sampai dua kali anggaran harian pada hari tertentu,
asal rata-rata sebulan tetap terjaga, jadi 5,5 hari bisa menjadi 4 hari nyata.

**Jangan menurunkan anggaran harian ke Rp27.000 supaya Rp300.000 bertahan lebih
lama.** Angka Rp54.000 diturunkan dari perkiraan CPC agar kampanye menang lelang
cukup sering. Dipotong setengah, kampanye akan terus berstatus "Dibatasi oleh
anggaran" dan hanya menang di irisan paling murah, yang justru bukan cerminan
pasar sebenarnya. Lebih baik durasinya pendek tetapi datanya jujur.

### Perkiraan kalender

Mulai 12 Agustus, jatah terbakar 12 sampai 14 Agustus, lalu jeda manual 15 sampai
17 Agustus (saldo tidak terpakai selama dijeda), lanjut 18 Agustus, dan habis
sekitar 20 Agustus. Jeda Kemerdekaan itu justru memberi ruang aman untuk mengisi
ulang tanpa kehilangan tayangan.

**Tanggal akhir kampanye sengaja tidak dipasang** atas keputusan Dedi pada
11 Agustus 2026. Konsekuensinya, satu-satunya rem yang aktif adalah dana
prabayar. Itu memadai selama pembayaran otomatis tidak diaktifkan. Kalau suatu
saat kartu dipasang untuk pembayaran otomatis, tanggal akhir wajib dipasang di
hari yang sama, karena tanpa keduanya belanja jadi tidak berujung.

---

## Tahap 3: aktifkan

Buka **Kampanye**, klik titik status di sebelah kiri nama kampanye, pilih
**Aktifkan**. Periksa juga grup iklannya ikut aktif, karena kampanye aktif dengan
grup iklan dijeda tetap tidak menayangkan apa pun.

Iklan biasanya mulai tayang dalam hitungan menit sampai beberapa jam setelah
tinjauan kebijakan selesai. Semua aset sudah berstatus Valid pada pemeriksaan
terakhir, jadi tidak ada penolakan yang tertunda.

**Waktu memulai.** Riset sebelumnya menyimpulkan tidak perlu jadwal iklan
per-jam, sebab sejak perubahan pacing Juni 2026 pembatasan jam tidak lagi
menghemat, dan volume 62 sampai 76 klik terlalu kecil untuk memvalidasi pola jam
mana pun. Mulai saja di hari kerja berikutnya. Satu-satunya catatan kalender:
**jeda manual 15 sampai 17 Agustus**, akhir pekan panjang Kemerdekaan.

---

## Tiga hari pertama, yang perlu dilihat

Jangan mengutak-atik apa pun di 72 jam pertama. Data sekecil ini akan menyesatkan
kalau ditanggapi terburu-buru.

Yang lebih penting lagi: **tranche Rp300.000 pertama adalah uji mesin, bukan uji
hasil.** Dengan 31 sampai 38 klik, hasilnya kemungkinan nol sampai dua lead, dan
angka sekecil itu tidak bisa membedakan "kanalnya jelek" dari "kebetulan sepi".
Yang dinilai di tahap ini hanya empat baris di tabel bawah. Penilaian apakah
kanal ini layak dilanjutkan ditunda sampai belanja total menembus Rp600.000.

| Yang dilihat | Sehat bila | Bertindak bila |
| --- | --- | --- |
| Tayangan | Mulai muncul dalam 24 jam | Nol setelah 24 jam, berarti bid atau anggaran terlalu rendah |
| CPC rata-rata | Di bawah Rp10.000 | Mentok di batas Rp10.000 terus, berarti persaingan lebih mahal dari dugaan |
| Istilah penelusuran | Relevan dengan jasa website | Muncul kata yang melenceng, tambahkan ke kata kunci negatif |
| Konversi | Mulai terisi setelah ada lead | Ada lead di basis data tapi Konversi nol, kabari saya |

Laporan istilah penelusuran ada di Audiens, kata kunci, dan konten, lalu
**Istilah penelusuran**. Di minggu pertama, itulah halaman paling berharga di
seluruh dasbor.

---

## Catatan cara membaca dasbor ini

Dua jebakan yang sudah memakan waktu dan sebaiknya tidak terulang.

1. **Tabel Google Ads dirender belakangan.** Kartu ringkasan bisa tampak kosong
   sementara penghitung barisnya sudah menulis "1 - 1 dari 1". Selalu percayai
   penghitung baris, bukan badan tabel, dan beri waktu sampai selesai memuat.
2. **Dialog "Turn off ad blockers" selalu ada di DOM.** Google menyimpannya
   sebagai elemen tersembunyi di setiap halaman, jadi menemukannya lewat
   pembacaan DOM bukan bukti bahwa ada pemblokir yang aktif.

---

## Ringkasan centang

- [x] Tindakan konversi `CoreAsia - Lead Form Saved` ada, Tindakan utama, hitungan Satu, disertakan di sasaran akun
- [x] ID dan label cocok dengan yang dikirim situs (`AW-18379615354/3qtKCPCF094cEPrYirxE`)
- [x] Tag Google terbukti milik akun `586-398-5692`, dan termuat di produksi tanpa terhalang CSP
- [x] Lead uji dikirim 11 Agustus 2026 pukul 14.16 WIB, beacon `pagead/conversion/18379615354` terbukti berangkat, contact dan deal masuk ke workspace `coreasia`
- [ ] Konversinya muncul di Google Ads dalam 24 jam
- [ ] Dana tahap pertama Rp300.000 masuk
- [ ] Isi ulang saat saldo tersisa sekitar Rp100.000, jangan tunggu nol
- [ ] Kampanye dan grup iklan diaktifkan
- [ ] Jeda manual dijadwalkan untuk 15 sampai 17 Agustus
- [ ] (ditunda) Tanggal akhir kampanye, hanya wajib bila pembayaran otomatis diaktifkan
