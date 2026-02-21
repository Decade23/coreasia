# SertifikasiPro — Platform Sertifikasi & Kompetensi Online
### Product Plan v1.0 — CoreAsia Teknologi

---

## 1. Ringkasan Produk

**SertifikasiPro** adalah platform SaaS multi-tenant yang membantu Lembaga Sertifikasi Profesi (LSP), Pusat Pelatihan, dan Korporat mendigitalisasi seluruh siklus sertifikasi — mulai dari pendaftaran peserta, pelaksanaan ujian online, hingga penerbitan sertifikat digital yang terverifikasi.

### Masalah yang Diselesaikan

| Masalah | Dampak |
|---|---|
| Proses pendaftaran & ujian masih manual (kertas) | Lambat, rawan human error, sulit diaudit |
| Pengelolaan data asesi tersebar di spreadsheet | Tidak terpusat, sulit dilacak |
| Pelaporan ke BNSP memakan waktu | Berisiko telat dan tidak akurat |
| Sertifikat fisik mahal & mudah dipalsukan | Biaya cetak tinggi, tidak ada mekanisme validasi |
| LSP kecil tidak mampu biaya IT infrastruktur sendiri | Barrier to entry tinggi untuk digitalisasi |

### Value Proposition
> *"Digitalisasi penuh proses sertifikasi dalam 7 hari kerja, tanpa investasi infrastruktur IT."*

---

## 2. Target Pengguna & Persona

### 2.1 Tenant (Organisasi)

| Tipe | Deskripsi | Contoh |
|---|---|---|
| **LSP (Lembaga Sertifikasi Profesi)** | Lembaga yang mendapat lisensi BNSP untuk melakukan sertifikasi kompetensi | LSP Informatika, LSP Telematika |
| **Pusat Pelatihan / LPK** | Lembaga pelatihan yang juga mengelola ujian kompetensi | AfraTraining, BDI Kemenperin |
| **Korporat** | Perusahaan yang menjalankan sertifikasi internal | Telkom, PLN, Pertamina |

### 2.2 User Roles (Dalam Setiap Tenant)

```
┌─────────────────────────────────────────────────────┐
│                  SUPER ADMIN (CoreAsia)              │
│         Mengelola seluruh tenant & billing           │
└────────────────────┬────────────────────────────────┘
                     │
       ┌─────────────┼──────────────┐
       ▼             ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Tenant A │  │ Tenant B │  │ Tenant C │
└────┬─────┘  └──────────┘  └──────────┘
     │
     ├── Admin LSP        → Kelola seluruh operasional tenant
     ├── Manajer Mutu     → Monitoring kualitas, laporan, audit
     ├── Asesor           → Menilai ujian, input rekomendasi
     └── Asesi (Peserta)  → Daftar, ujian, terima sertifikat
```

---

## 3. Arsitektur Platform

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Portal Asesi │  │ Dashboard    │  │ Portal Publik         │  │
│  │  (Peserta)    │  │ Admin/Asesor │  │ (Verifikasi Sertif.)  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬────────────┘  │
└─────────┼─────────────────┼──────────────────────┼──────────────┘
          │                 │                      │
┌─────────▼─────────────────▼──────────────────────▼──────────────┐
│                        API GATEWAY                              │
│              (Auth, Rate Limit, Tenant Resolver)                │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                      BACKEND SERVICES                           │
│  ┌───────────┐ ┌───────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ Auth &    │ │ Exam      │ │ Cert     │ │ Notification     │  │
│  │ Tenant    │ │ Engine    │ │ Engine   │ │ Service          │  │
│  │ Service   │ │           │ │          │ │ (Email/WA/Push)  │  │
│  └───────────┘ └───────────┘ └──────────┘ └──────────────────┘  │
│  ┌───────────┐ ┌───────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ Reporting │ │ Storage   │ │ Billing  │ │ Integration      │  │
│  │ (BNSP)   │ │ Service   │ │ Service  │ │ Service (API)    │  │
│  └───────────┘ └───────────┘ └──────────┘ └──────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                      DATA LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ PostgreSQL   │  │ Redis        │  │ Object Storage (S3)    │ │
│  │ (Multi-      │  │ (Cache,      │  │ (Dokumen, Foto,        │ │
│  │  Tenant DB)  │  │  Session)    │  │  Sertifikat)           │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Multi-Tenancy Strategy

Menggunakan **Shared Database, Separate Schema** approach:
- Setiap tenant mendapat schema PostgreSQL terpisah
- Data terisolasi secara logis (aman, mudah backup per-tenant)
- Paket Enterprise bisa upgrade ke **Dedicated Database** (fully isolated)

---

## 4. Alur Bisnis (Core Workflows)

### 4.1 Alur Pendaftaran & Sertifikasi

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  DAFTAR  │───▶│ VERIFI-  │───▶│   UJIAN  │───▶│ PENILAI- │───▶│ SERTIFI- │
│  ONLINE  │    │  KASI    │    │  ONLINE  │    │   AN     │    │   KAT    │
│          │    │ BERKAS   │    │  (CBT)   │    │ ASESOR   │    │ DIGITAL  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
   Asesi         Admin LSP      Asesi + Sys     Asesor          Sistem
   mengisi       memverif.      ujian secara    menilai &       generate
   APL-01 &      kelengkapan    online &        memberi         e-certificate
   APL-02        dokumen        ter-proctor     rekomendasi     + QR Code
```

### 4.2 Detail Setiap Tahapan

#### Tahap 1: Pendaftaran Online
- Asesi registrasi akun → pilih skema sertifikasi
- Isi formulir **APL-01** (Permohonan Sertifikasi) secara online
- Upload bukti kompetensi **APL-02** (Asesmen Mandiri): ijazah, sertifikat pelatihan, portofolio
- Sistem melakukan **pre-validation** otomatis (format file, kelengkapan field)
- Status: `DRAFT` → `SUBMITTED`

#### Tahap 2: Verifikasi Berkas
- Admin LSP menerima notifikasi pendaftaran baru
- Review kelengkapan dokumen APL-01 & APL-02
- Bisa minta revisi (`REVISION_REQUIRED`) atau setujui (`VERIFIED`)
- Jika disetujui → Asesi di-assign ke **jadwal ujian** dan **asesor**

#### Tahap 3: Ujian Online (CBT)
- **Tipe soal:** Pilihan Ganda (auto-scoring), Essay (manual scoring), Upload Bukti (foto/video), Wawancara/Observasi
- **Fitur ujian:** Timer, randomisasi soal & jawaban, anti-cheat (fullscreen lock, tab detection), auto-save tiap 30 detik
- Status: `EXAM_IN_PROGRESS` → `EXAM_COMPLETED`

#### Tahap 4: Penilaian Asesor
- Asesor scoring essay/uraian, review bukti upload
- Input rekomendasi: **Kompeten** atau **Belum Kompeten**
- Manajer Mutu bisa review keputusan asesor (quality control)

#### Tahap 5: Penerbitan Sertifikat
- Jika Kompeten → auto-generate **sertifikat digital** (PDF + QR Code)
- Publik bisa scan QR → halaman verifikasi keaslian
- Notifikasi via Email & WhatsApp

---

## 5. Modul & Fitur Detail

### 5.1 Portal Asesi (Peserta)

| Fitur | Deskripsi |
|---|---|
| Registrasi & Login | Email/password, OTP via WhatsApp |
| Dashboard Peserta | Status pendaftaran, jadwal ujian, histori sertifikat |
| Form APL-01 | Form dinamis sesuai skema sertifikasi |
| Upload APL-02 | Multi-file upload (drag & drop) dengan preview |
| Ruang Ujian Online | Interface CBT dengan timer, navigasi soal, auto-save |
| Sertifikat Digital | Download PDF, share link, QR code verifikasi |
| Riwayat Sertifikasi | Daftar semua sertifikat (aktif, expired, dalam proses) |

### 5.2 Dashboard Admin LSP

| Fitur | Deskripsi |
|---|---|
| Manajemen Skema | CRUD skema sertifikasi (kode, unit kompetensi, persyaratan) |
| Manajemen Pendaftar | List asesi, filter status, bulk action |
| Verifikasi Berkas | Review APL-01 & APL-02, approve/reject/revisi |
| Penjadwalan | Buat jadwal ujian, assign asesor |
| Bank Soal | CRUD soal per skema, kategori, tingkat kesulitan |
| Manajemen Asesor | Daftar asesor, lisensi, assign ke skema |
| Template Sertifikat | Custom template (logo, tanda tangan, layout) |
| Pengaturan Tenant | Branding (logo, warna, domain), konfigurasi umum |

### 5.3 Portal Asesor

| Fitur | Deskripsi |
|---|---|
| Dashboard Asesor | Daftar tugas penilaian yang di-assign |
| Penilaian Asesi | Scoring jawaban, tinjauan bukti, rekomendasi |
| Catatan Asesor | Input observasi, catatan wawancara |

### 5.4 Modul Manajer Mutu

| Fitur | Deskripsi |
|---|---|
| Audit Trail | Log seluruh aktivitas di platform |
| Review Keputusan | Validasi rekomendasi asesor sebelum sertifikat terbit |
| Laporan Mutu | Statistik kelulusan per skema, per periode |
| Export BNSP | Export data sesuai format BNSP |

### 5.5 Portal Publik (Verifikasi)

| Fitur | Deskripsi |
|---|---|
| Verifikasi QR Code | Scan QR → tampilkan data sertifikat |
| Search by Nomor | Cari sertifikat berdasarkan nomor registrasi |

---

## 6. Status Flow (State Machine)

```
┌───────┐    ┌───────────┐    ┌──────────┐    ┌────────────────┐
│ DRAFT │───▶│ SUBMITTED │───▶│ VERIFIED │───▶│ EXAM_SCHEDULED │
└───────┘    └─────┬─────┘    └──────────┘    └───────┬────────┘
                   │                                  │
                   ▼ (revisi)                         ▼
           ┌───────────────┐               ┌─────────────────┐
           │REVISION_NEEDED│               │ EXAM_IN_PROGRESS│
           └───────────────┘               └────────┬────────┘
                                                    │
                                                    ▼
                                           ┌─────────────────┐
                                           │ EXAM_COMPLETED  │
                                           └────────┬────────┘
                                                    │
                                       ┌────────────┴────────────┐
                                       ▼                         ▼
                               ┌───────────────┐    ┌──────────────────┐
                               │   COMPETENT   │    │ NOT_YET_COMPETENT│
                               └───────┬───────┘    └──────────────────┘
                                       │                 (bisa re-test)
                                       ▼
                               ┌───────────────┐
                               │   CERTIFIED   │──▶ EXPIRED (renewal)
                               └───────────────┘
```

---

## 7. Database Design (Core Tables)

```
tenants
├── id, name, slug, domain, logo_url
├── package_tier (essential/professional/enterprise)
├── settings (JSON: branding, configs)
└── billing_info

users
├── id, tenant_id, email, phone, name
├── role (super_admin/admin/quality_manager/assessor/assessee)
└── is_active, last_login_at

certification_schemes
├── id, tenant_id, code, name, description
├── requirements (JSON), units_of_competency (JSON)
└── is_active, validity_period_months

applications (APL-01)
├── id, tenant_id, assessee_id, scheme_id
├── status, apl01_data (JSON)
└── assigned_assessor_id, exam_schedule_id

application_documents (APL-02)
├── id, application_id, document_type
├── file_url, file_name
└── verification_status, notes

exam_schedules
├── id, tenant_id, scheme_id
├── title, start_datetime, end_datetime
├── location_type (online/offline/hybrid)
└── max_participants, assigned_assessors[]

question_banks
├── id, tenant_id, scheme_id
├── question_type (multiple_choice/essay/upload/observation)
├── question_text, options (JSON), correct_answer
└── difficulty_level, points

exams
├── id, application_id, schedule_id
├── started_at, finished_at, total_score
└── status, anti_cheat_log (JSON)

exam_answers
├── id, exam_id, question_id
├── answer_text, selected_option, uploaded_file_url
└── score, assessor_notes

assessments
├── id, application_id, assessor_id
├── recommendation (competent/not_yet_competent)
└── quality_reviewed_by, quality_review_status

certificates
├── id, application_id, tenant_id
├── certificate_number (unique), qr_code_url, pdf_url
├── issued_at, valid_until
└── status (active/expired/revoked), template_id

certificate_templates
├── id, tenant_id, name
├── layout (JSON), logo_url, signature_url
└── is_default
```

---

## 8. Tech Stack (Rekomendasi)

| Layer | Teknologi | Alasan |
|---|---|---|
| **Frontend** | Nuxt 4 + Tailwind CSS | Konsisten dengan landing, SSR capable |
| **Backend API** | Node.js (Hono / Fastify) | Ringan, cepat, TypeScript end-to-end |
| **Database** | PostgreSQL 16 | JSONB, schema-level multi-tenancy |
| **Cache** | Redis | Session, rate limiting, real-time |
| **Object Storage** | MinIO / S3 | Dokumen, foto, sertifikat PDF |
| **PDF Generation** | Puppeteer / @react-pdf | Generate sertifikat dari template |
| **Email** | Resend / Nodemailer | Notifikasi transaksional |
| **WhatsApp** | Fonnte / WA Business API | Notifikasi pendaftaran & sertifikat |
| **Auth** | JWT + Refresh Token | Stateless, multi-tenant aware |
| **Deployment** | Docker + Docker Compose | Konsisten dev ↔ prod |

---

## 9. Roadmap

### Phase 1 — Foundation (MVP) — *8-10 minggu*
> 1 tenant pilot (AfraTraining / SertifikasiPro)

- [ ] Setup monorepo (backend + frontend)
- [ ] Auth (register, login, JWT, role-based)
- [ ] Multi-tenant foundation
- [ ] Admin: Manajemen Skema Sertifikasi
- [ ] Admin: Bank Soal (PG & essay)
- [ ] Asesi: Pendaftaran (APL-01 + APL-02)
- [ ] Admin: Verifikasi berkas
- [ ] Admin: Penjadwalan ujian

### Phase 2 — Exam Engine — *4-6 minggu*

- [ ] CBT Interface (PG + essay)
- [ ] Timer, auto-save, navigasi soal
- [ ] Anti-cheat (fullscreen, tab detection)
- [ ] Asesor: Scoring & rekomendasi
- [ ] QC: Review keputusan asesor

### Phase 3 — Certificate Engine — *3-4 minggu*

- [ ] Template sertifikat customizable
- [ ] Auto-generate PDF + QR Code
- [ ] Portal publik verifikasi sertifikat
- [ ] Notifikasi email & WhatsApp
- [ ] Manajemen masa berlaku

### Phase 4 — Reporting & Integration — *3-4 minggu*

- [ ] Dashboard analytics
- [ ] Export laporan format BNSP
- [ ] Audit trail
- [ ] API publik + webhook

### Phase 5 — Scale & Polish — *Ongoing*

- [ ] Billing & subscription
- [ ] Custom domain per tenant
- [ ] White label
- [ ] Mobile optimization

---

## 10. Keamanan

| Aspek | Implementasi |
|---|---|
| Data Isolation | Schema-per-tenant, row-level security |
| Authentication | Bcrypt + JWT + refresh token rotation |
| Authorization | RBAC per tenant |
| Encryption | TLS in transit, AES-256 at rest |
| Anti-Cheat | Fullscreen enforcement, tab-switch logging |
| Audit Trail | Log semua operasi CRUD |
| Backup | Daily automated, retention 30 hari |

---

## 11. Pricing Tiers

| Fitur | Essential | Professional | Enterprise |
|---|---|---|---|
| **Harga/bulan** | Rp 1.500.000 | Rp 3.500.000 | Custom (≥ Rp 7.000.000) |
| Kuota asesi/bulan | 100 | 500 | Unlimited |
| Tipe soal | PG + Essay | + Upload bukti | + Custom |
| Admin account | 1 | Multi-role | Multi-role + SSO |
| Sertifikat | QR standar | + Custom template | White label |
| Domain | Subdomain | Custom domain | Custom domain |
| Laporan BNSP | — | ✓ | ✓ |
| API access | — | — | ✓ |
| Support | Email (1x24 jam) | WA (jam kerja) | Dedicated |
| Setup fee | Rp 2.500.000 | Rp 5.000.000 | Custom |
