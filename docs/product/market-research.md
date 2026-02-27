# Riset Pasar LSP & Strategi Produk CoreAsia

> Terakhir diperbarui: 27 Februari 2026

---

## 1. KEBUTUHAN PRODUK LSP (Regulatory & Feature Requirements)

### 1.1 Dasar Hukum yang Mengatur LSP

| Regulasi | Konten |
|---|---|
| **UU No. 13/2003** tentang Ketenagakerjaan | Dasar hukum sertifikasi kompetensi kerja nasional |
| **PP No. 10/2018** | Penetapan BNSP sebagai lembaga independen sertifikasi kompetensi |
| **Permenaker No. 6/2022** | Mutu kompetensi tenaga kerja nasional |
| **Kepmenaker No. 115/2022** | Wajib sertifikasi bagi profesional SDM |
| **Peraturan BNSP No. 1/BNSP/III/2014** | Pedoman umum persyaratan LSP (conformity assessment) |
| **SE BNSP No. 1/BNSP/I/2024** | Wajib MUK versi 2023 di semua LSP per Januari 2024 |
| **SE BNSP No. SE.007/BNSP/V/2023** | Ketentuan Sertifikasi Jarak Jauh (SJJ) dan Nirkertas (Paperless) |
| **Peraturan BNSP No. 5/BNSP/VII/2014** (Pedoman 206) | Persyaratan umum TUK (Tempat Uji Kompetensi) |

### 1.2 Tipe LSP

| Tipe | Deskripsi | Target CoreAsia |
|---|---|---|
| **LSP P1** (Pihak Pertama) | Lembaga pendidikan/pelatihan (universitas, SMK, BLK) | PRIMARY — jumlah terbanyak, budget IT rendah |
| **LSP P2** (Pihak Kedua) | Industri/perusahaan, sertifikasi internal | Target menengah |
| **LSP P3** (Pihak Ketiga) | Asosiasi profesi, sertifikasi terbuka | 519 LSP di 2024, market terbesar |

### 1.3 Formulir Standar BNSP (Wajib di Platform)

Berdasarkan Buku Kerja BNSP 2020 dan MUK 2023:

**Formulir Pendaftaran:**
- **FR.APL.01** — Permohonan Sertifikasi Kompetensi
- **FR.APL.02** — Asesmen Mandiri (self-assessment + portofolio)

**Formulir Asesmen:**
- **FR.AK.01** — Persetujuan Asesmen
- **FR.AK.02** — Rekaman Asesmen Kompetensi
- **FR.AK.03** — Umpan Balik dan Catatan Asesmen
- **FR.AK.04** — Formulir Banding
- **FR.AK.05** — Formulir Laporan Asesmen
- **FR.AK.06** — Meninjau Proses Asesmen

**Formulir Instrumen Asesmen (MUK):**
- **FR.IA.01** — Ceklis Observasi Aktivitas
- **FR.IA.02** — Tugas Praktik Demonstrasi
- **FR.IA.03** — Pertanyaan Mendukung Observasi
- **FR.IA.05** — Pertanyaan Tertulis Pilihan Ganda
- **FR.IA.06** — Pertanyaan Tertulis Esai
- **FR.IA.06A** — Kunci Jawaban Esai
- **FR.IA.06B** — Lembar Jawaban Esai
- **FR.IA.07** — Pertanyaan Lisan
- **FR.IA.10** — Klarifikasi Bukti Pihak Ketiga
- **FR.IA.11** — Ceklis Meninjau

### 1.4 Modul Wajib untuk Platform LSP

1. Pendaftaran Asesi (FR.APL.01, FR.APL.02 online)
2. Manajemen Skema Sertifikasi (sesuai SKKNI, unit kompetensi)
3. Manajemen Asesor (lisensi, assignment, workload)
4. Manajemen TUK (TUK Sewaktu, TUK Mandiri, TUK Tempat Kerja)
5. Penjadwalan Ujian (termasuk SJJ)
6. Pelaksanaan Ujian CBT (PG, esai, observasi, wawancara, praktik)
7. Penilaian Asesor (semua form FR.AK + FR.IA digital)
8. Quality Assurance (Manajer Mutu review, audit trail)
9. Penerbitan Sertifikat (digital signature, QR code, masa berlaku 3 tahun)
10. Pelaporan BNSP (export ke format standar)
11. Verifikasi Publik (portal verifikasi sertifikat, integrasi Sertihub)
12. Notifikasi (WhatsApp + Email, early warning kadaluarsa)
13. Manajemen Dokumen (arsip digital, persuratan otomatis)

---

## 2. KOMPETITOR & BENCHMARK

### 2.1 Platform Pemerintah (Ekosistem, bukan kompetitor)

| Platform | Operator | Fungsi |
|---|---|---|
| **SIAPKerja** (account.kemnaker.go.id) | Kemnaker | Portal tenaga kerja |
| **Sertihub** (sertihub.bnsp.go.id) | BNSP | Verifikasi keaslian sertifikat |
| **SISFO BNSP** (sisfo.bnsp.go.id) | BNSP | Sistem informasi internal BNSP |
| **PSKK** (pskk.bnsp.go.id) | BNSP | Program Sertifikasi hibah APBN |
| **SKKNI Portal** (skkni.kemnaker.go.id) | Kemnaker | Database standar kompetensi nasional |

### 2.2 Kompetitor Langsung

#### a) SILSP v2.0 (aplikasilsp.web.id)
- **Model:** Web-based, per-instance (sejak 2018)
- **Fitur:** SJJ, Paperless, MUK 2023, WhatsApp Gateway, Virtual Account (BRIVA, BSI VA), auto-generate surat
- **Hak Cipta:** EC00201845979
- **Kelemahan:** UI legacy, bukan SaaS, tidak multi-tenant

#### b) eLSP (elsp.id)
- **Model:** Cloud SaaS, subdomain per LSP
- **Fitur:** Manajemen uji kompetensi, asesor, pelaporan BNSP otomatis
- **Client:** "Puluhan LSP" (klaim)
- **Kelemahan:** Market share belum terukur

#### c) NAS Online (nasonline.id)
- **Model:** Web + Mobile, per-LSP deployment (sejak 2018)
- **Fitur:** Digital signature, Question Bank, SJJ, arsip dokumen
- **Client:** LSP PIM, LSP K3IBL, LSP HCMI

#### d) RIFIL e-LSP
- **Model:** Custom development, terdaftar di e-Katalog LKPP
- **Target:** B2G via pengadaan pemerintah
- **Keunggulan:** Legal untuk pengadaan, training bundled

### 2.3 Competitive Matrix

| Fitur | SILSP | eLSP | NAS Online | RIFIL | **CoreAsia** |
|---|---|---|---|---|---|
| Cloud/SaaS | Partial | Ya | Partial | Tidak | **Ya** |
| Multi-tenant | Tidak | Ya (subdomain) | Tidak | Tidak | **Ya (schema isolation)** |
| MUK 2023 | Ya | Ya | Ya | Ya | **Perlu lengkapi** |
| SJJ (Remote) | Ya | Kemungkinan | Ya | Tidak jelas | **Planned** |
| CBT Online | Tidak jelas | Ya | Ya | Tidak jelas | **Ya** |
| WhatsApp | Ya | Tidak jelas | Tidak jelas | Tidak | **Planned** |
| Payment Gateway | Ya (VA) | Tidak jelas | Tidak jelas | Tidak | **Planned** |
| QR Verification | Ya | Ya | Ya | Tidak jelas | **Ya** |
| BNSP Export | Ya | Ya | Ya | Ya | **Planned** |
| e-Katalog LKPP | Tidak | Tidak | Tidak | **Ya** | **Belum** |

---

## 3. MARKET SIZE & TARGET

### 3.1 Data Pasar (2024)

| Metrik | Angka |
|---|---|
| Total LSP berlisensi | **~777 LSP** (129 P1 + 129 P2 + 519 P3) |
| Pertumbuhan LSP | +4,19% YoY |
| Asesi tersertifikasi 2024 | **1.374.174 orang** (+11,55%) |
| Program PSKK 2024 | 2.757 paket untuk 379 LSP |
| Total angkatan kerja | 146 juta+ |

### 3.2 Estimasi Market Size

- Target addressable: ~400-500 LSP yang belum punya sistem
- ARPA: Rp 2-3,5 juta/bulan
- **TAM:** ~Rp 18 miliar/tahun
- **SAM (20-30%):** Rp 3,6-5,4 miliar/tahun

### 3.3 Faktor Pertumbuhan

- Sertifikat berlaku 3 tahun (turun dari 5) = lebih banyak renewal
- Mandatory certification di semakin banyak sektor
- BNSP mendorong digitalisasi (MoU Digital Hub, SE SJJ/Paperless)

### 3.4 Segmentasi Pembeli

| Segmen | Jumlah Est. | Budget | Approach |
|---|---|---|---|
| LSP P1 Universitas/SMK | 300+ | Rendah (APBN) | B2G via LKPP, pilot gratis |
| LSP P3 Asosiasi Profesi | 519 | Menengah | B2B langsung, WhatsApp |
| LSP P2 Korporat | 129 | Tinggi | Enterprise sales |
| LPK/BLK | 100+ | Rendah-Menengah | Bundle training + SaaS |

---

## 4. GO-TO-MARKET STRATEGY

### 4.1 Pain Points LSP

1. Administrasi manual sangat berat (ratusan formulir FR per asesi)
2. Pelaporan BNSP makan waktu, rawan error
3. Surveillance BNSP stressful, dokumen harus lengkap
4. Sertifikat mudah dipalsukan tanpa verifikasi digital
5. Belum siap SJJ meski sudah diizinkan BNSP
6. Biaya IT mahal untuk LSP kecil
7. Koordinasi asesor masih manual
8. Tidak ada early warning kadaluarsa sertifikat

### 4.2 Channel Penjualan

1. **Direct B2B** — WhatsApp/LinkedIn ke ketua LSP P3, demo gratis, trial 1 bulan
2. **B2G via e-Katalog LKPP** — target LSP P1 universitas/SMK
3. **Partnership** — konsultan pendirian LSP sebagai referral (fee 10-15%)
4. **Content/SEO** — blog panduan MUK 2023, keyword "aplikasi LSP"
5. **Event** — hadir di acara BNSP, komunitas LSP

### 4.3 Pricing Strategy

| Tier | Harga/bulan | Target | Limit |
|---|---|---|---|
| **Starter** | Rp 750rb-1jt | LSP kecil/baru | Max 50 asesi, 1 admin |
| **Professional** | Rp 2,5-3,5jt | LSP P3 aktif | 500 asesi, multi-admin |
| **Enterprise** | Rp 7jt+ | LSP besar | White label, API, dedicated DB |

### 4.4 USP CoreAsia vs Kompetitor

1. True multi-tenant SaaS (schema-level data isolation)
2. Modern tech stack (responsive, fast)
3. Self-service onboarding (setup dalam hitungan jam)
4. Scalable pricing (pay as you grow)

---

## 5. MISSING FEATURES

### 5.1 CRITICAL (Blocker Go-Live)

| Fitur | Status | Alasan |
|---|---|---|
| Formulir MUK 2023 lengkap (FR.AK, FR.IA) | Partial | Wajib BNSP sejak Jan 2024 |
| BNSP Export format standar | Planned | Selling point #1 |
| Payment Gateway (Midtrans/Xendit VA) | Belum | LSP perlu collect biaya uji |
| WhatsApp Notification | Belum | Channel #1 di Indonesia |
| Early Warning kadaluarsa | Belum | Sertifikat 3 tahun, perlu reminder |

### 5.2 IMPORTANT (Differentiator)

| Fitur | Status | Value |
|---|---|---|
| SJJ (Sertifikasi Jarak Jauh) | Belum | Video + bukti rekaman |
| Manajemen TUK | Belum | CRUD + verifikasi status |
| Digital Signature | Belum | Paperless compliance |
| Question Bank + kerahasiaan | Partial | Access control per asesor |
| Modul Banding (FR.AK.04) | Belum | Wajib ada mekanisme formal |
| Dashboard Analytics real-time | Planned | Statistik kelulusan per skema |
| Auto-generate persuratan | Belum | Surat tugas asesor, SK, undangan |

### 5.3 NICE-TO-HAVE (Future Roadmap)

- Integrasi Sertihub BNSP
- e-Katalog LKPP listing
- Mobile app (PWA)
- SKKNI database integration
- Proctoring AI (face detection, screen recording)
- Bulk import dari Excel/sistem lama
- Multi-skema per asesi

---

## 6. RISIKO

1. Sales cycle panjang (terutama kampus/pemerintah)
2. Resistance to change dari LSP yang sudah "nyaman" dengan kertas
3. Budget LSP kecil terbatas
4. Regulasi BNSP bisa berubah sewaktu-waktu
5. BNSP bisa membangun platform gratis terpusat

---

## 7. AKSI PRIORITAS

1. Lengkapi semua formulir FR (MUK 2023) — blocker utama
2. Cari 3-5 LSP pilot gratis 3 bulan untuk validasi PMF
3. Daftar e-Katalog LKPP untuk channel B2G
4. Buat konten SEO (blog, panduan)
5. Partner dengan konsultan pendirian LSP
6. Implementasi payment gateway untuk self-service

---

## Sumber Referensi

- [BNSP Official - LSP](https://bnsp.go.id/lsp)
- [Laporan Kinerja BNSP 2024](https://bnsp.go.id/ppid_cms/storage/upload/attachement/content/14971858431758182157.pdf)
- [BNSP Download / Pedoman](https://bnsp.go.id/download)
- [BNSP Regulasi](https://bnsp.go.id/ppid/regulasi)
- [SILSP - Aplikasi LSP](https://www.aplikasilsp.web.id/)
- [eLSP](https://www.elsp.id)
- [NAS Online](https://www.nasonline.id/)
- [RIFIL e-LSP](https://rifil.co.id/2024/07/05/e-lsp-aplikasi-lembaga-sertifikasi-pelatihan/)
- [e-Katalog LKPP](https://e-katalog.lkpp.go.id/katalog/produk/detail/74492552)
- [SKKNI Portal](https://skkni.kemnaker.go.id/)
