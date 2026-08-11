# Aktivasi kampanye Google Ads: langkah demi langkah

Panduan urut untuk membuka kampanye `CoreAsia Search Jasa Website Jakarta`.
Ditulis 10 Agustus 2026, setelah pemeriksaan langsung ke akun
`586-398-5692 PT INTI ASIA TEKNOLOGI`.

Kerjakan berurutan. Tahap 1 sengaja didahulukan sebelum uang masuk, karena kalau
dibalik, klik pertama sudah terbeli sementara belum ada yang mencatat hasilnya.

---

## Keadaan saat pemeriksaan

| Hal | Keadaan | Sumber |
| --- | --- | --- |
| Status kampanye | Dijeda | Kampanye, kolom Status |
| Anggaran harian | Rp54.000 | Kampanye, kolom Anggaran |
| Strategi bid | Maksimalkan klik | Kampanye |
| Dana tersedia | **Rp0**, belum pernah ada pembayaran | Penagihan, Ringkasan |
| Tindakan konversi | **Tidak ada** | Sasaran, Konversi, Ringkasan |
| Konversi yang disempurnakan | Belum dikonfigurasikan | Sasaran, Konversi, Setelan |

Situs sudah menembakkan `AW-18379615354/3qtKCPCF094cEPrYirxE` setiap kali sebuah
lead tersimpan, tetapi tidak ada tindakan konversi di akun ini yang menampungnya.
Kemungkinannya dua: ID itu milik akun Google Ads lain, atau pembuatannya dulu
tidak pernah selesai. Keduanya berakhir sama, yaitu kolom Konversi tetap nol.

Yang perlu diluruskan supaya harapannya pas: **iklan tetap tayang dan tetap
menghasilkan klik tanpa tindakan konversi**, sebab strategi bid Maksimalkan klik
tidak memerlukan data konversi. Lead pun tetap masuk ke basis data dan ke
pipeline LeadKu lengkap dengan GCLID. Yang hilang hanya kemampuan Google memberi
tahu kata kunci mana yang menghasilkan lead. Pada anggaran Rp600.000 dengan
perkiraan 62 sampai 76 klik, itu selisih antara tahu dan menebak.

---

## Tahap 1: buat tindakan konversi

Buka **Sasaran** di menu kiri, lalu **Konversi**, lalu **Ringkasan**.

1. Klik **+ Tindakan konversi baru** (di layar sempit, tombolnya bisa berada di
   dalam menu tiga titik).
2. Pilih sumber **Situs**.
3. Masukkan domain `coreasia.id` lalu **Pindai**. Google akan menawarkan
   penyiapan otomatis. **Jangan pakai yang otomatis.** Pilih
   **Tambahkan tindakan konversi secara manual** di bagian bawah hasil pindai.
4. Isi seperti ini:

| Kolom | Isi | Alasan |
| --- | --- | --- |
| Kategori sasaran | **Kirim formulir prospek** | Ini memang formulir brief, bukan pembelian |
| Nama tindakan konversi | `Lead Formulir Kontak` | Muncul di laporan, buat jelas |
| Nilai | **Jangan gunakan nilai** | Nilai lead belum diketahui saat submit. Angka karangan akan merusak laporan nanti |
| Hitungan | **Satu** | Satu orang mengirim brief dua kali tetap satu prospek |
| Periode konversi klik | 30 hari | Siklus keputusan jasa website memang panjang |
| Sertakan di "Konversi" | **Ya** | Wajib, supaya terhitung sebagai konversi utama |
| Model atribusi | Berbasis data, atau Klik terakhir bila belum tersedia | Berbasis data butuh volume; kalau ditolak, klik terakhir sudah cukup |

5. Klik **Selesai**, lalu **Simpan dan lanjutkan**.

Di halaman berikutnya Google menawarkan cara memasang tag. Pilih
**Pasang tag sendiri** atau **Gunakan Tag Google yang sudah ada**. Situs sudah
memuat gtag, jadi tidak ada yang perlu ditempel lagi.

**Yang wajib Anda catat di layar ini:**

```
ID konversi   : AW-__________          (contoh bentuk: AW-18379615354)
Label konversi: ______________         (contoh bentuk: 3qtKCPCF094cEPrYirxE)
```

Kalau layarnya sudah terlanjur tertutup, keduanya bisa dilihat lagi lewat
Sasaran, Konversi, klik nama tindakannya, lalu **Siapkan tag**, dan pilih
**Pasang tag sendiri**. Cuplikan yang muncul memuat `send_to: 'AW-xxx/label'`.

---

## Tahap 2: cocokkan ID dan label di situs

Bandingkan hasil Tahap 1 dengan yang sekarang dipakai situs:

```
AW-18379615354 / 3qtKCPCF094cEPrYirxE
```

**Kalau sama persis,** berarti tindakan konversinya memang sudah ada sejak dulu
dan hanya belum tampil karena sesuatu. Lewati tahap ini, langsung ke Tahap 3.

**Kalau berbeda,** ada dua jalan. Pilih salah satu.

### Jalan A, lewat kode (disarankan, saya yang kerjakan)

Kirim ID dan label barunya ke saya. Nilainya ada sebagai bawaan di
`frontend/landing/nuxt.config.ts` sekitar baris 239 sampai 247. Saya ubah, uji,
push, dan Vercel akan menayangkannya sekitar dua menit. Tidak perlu Anda buka
dasbor mana pun.

### Jalan B, lewat Vercel

Buka proyek landing di Vercel, **Settings**, **Environment Variables**, lalu isi
untuk environment Production:

```
NUXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID          = AW-__________
NUXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION_LABEL  = ______________
```

Setelah disimpan, jalankan **Redeploy**. Variabel `NUXT_PUBLIC_*` dipanggang saat
build, jadi menyimpan saja tidak cukup, harus ada build baru.

---

## Tahap 3: pastikan konversinya benar-benar tercatat

Jangan lewati bagian ini. Inilah satu-satunya cara membedakan "tag terpasang"
dari "konversi tercatat".

1. Buka `https://coreasia.id/contact?subject=website` di peramban biasa, bukan
   mode penyamaran, dan **matikan pemblokir iklan** untuk domain ini.
2. Isi formulir dengan nama seperti `UJI KONVERSI - abaikan` dan email yang bisa
   Anda kenali, lalu kirim sampai muncul panel "Brief Anda terkirim".
3. Tunggu. **Google Ads menampilkan konversi dengan jeda 3 sampai 24 jam.**
   Jangan menyimpulkan gagal di menit pertama.
4. Besoknya, buka Sasaran, Konversi, Ringkasan. Tindakan `Lead Formulir Kontak`
   harus berstatus **Aktif** dan angkanya minimal 1.

Kalau setelah 24 jam masih nol, kabari saya. Yang saya periksa berikutnya adalah
apakah label yang dikirim situs sudah sama dengan label di akun, dan apakah
permintaan ke `googleadservices.com` benar-benar lolos CSP.

Baris uji itu boleh dihapus kapan saja dari basis data. Bilang saja, saya
bersihkan sekalian dengan yang di LeadKu.

---

## Tahap 4: isi dana

Buka **Penagihan**, **Ringkasan**, klik **Tambah dana**.

- Nominal: **Rp600.000**, pas, jangan lebih.
- Akun ini prabayar. Iklan berhenti sendiri saat dana habis, dan itu memang rem
  yang kita inginkan untuk percobaan pertama.
- Kalau Google menawarkan pembayaran otomatis dengan kartu, **jangan diaktifkan**
  dulu. Prabayar membuat batas belanja bersifat fisik, bukan sekadar setelan.

---

## Tahap 5: pasang tanggal berakhir kampanye

Ini pengaman kedua, dan sering dilupakan.

Buka **Kampanye**, klik nama kampanye, lalu **Setelan**, buka
**Setelan tambahan**, lalu **Tanggal mulai dan berakhir**.

Isi tanggal berakhir **11 hari setelah tanggal mulai**. Dasarnya: Rp600.000
dibagi Rp54.000 per hari sama dengan 11,1 hari.

Perlu diketahui, Google boleh membelanjakan sampai dua kali anggaran harian pada
hari tertentu, asal rata-rata sebulan tetap terjaga. Jadi dana bisa habis lebih
cepat dari 11 hari. Tanggal berakhir ini menjaga dari sisi waktu, dana prabayar
menjaga dari sisi uang. Dua-duanya dipasang.

---

## Tahap 6: aktifkan

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

## Ringkasan centang

- [ ] Tindakan konversi `Lead Formulir Kontak` dibuat, kategori Kirim formulir prospek, hitungan Satu, disertakan di Konversi
- [ ] ID dan label dicatat
- [ ] ID dan label cocok dengan yang dikirim situs, lewat kode atau lewat Vercel
- [ ] Lead uji dikirim, konversinya muncul dalam 24 jam
- [ ] Dana Rp600.000 masuk
- [ ] Tanggal berakhir dipasang, 11 hari setelah tanggal mulai
- [ ] Kampanye dan grup iklan diaktifkan
- [ ] Jeda manual dijadwalkan untuk 15 sampai 17 Agustus
