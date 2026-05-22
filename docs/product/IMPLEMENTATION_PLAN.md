# Implementation Plan — Frontend LMS
### CoreAsia Platform Sertifikasi & Kompetensi
**Module:** `frontend/lms` | **Focus:** Frontend-first development
**Referensi:** `docs/product/lms.md`, `draft_product.md`

---

## Status Saat Ini

### Inventaris Yang Sudah Ada

**14 Pages:**
| Page | Path | Status |
|------|------|--------|
| Welcome/Index | `/` | UI done, role redirect |
| Login | `/login` | UI + mock auth |
| Asesi Dashboard | `/assessee` | UI + mock data |
| Registration APL-01 | `/registration` | UI + multi-step form |
| Self-Assessment APL-02 | `/assessment/apl-02` | UI + composable |
| CBT Exam | `/cbt/[id]` | UI + partial engine |
| Admin Index | `/admin` | Redirect stub |
| Admin Schemes | `/admin/schemes` | UI + mock listing |
| Admin Questions | `/admin/questions` | UI + mock listing |
| Admin Schedules | `/admin/schedules` | UI + mock listing |
| Admin Verifications | `/admin/verifications` | UI + mock listing |
| Assessor Queue | `/assessor` | UI + mock queue |
| Assessor Review | `/assessor/review/[id]` | UI + review form |
| Sandbox Forms | `/sandbox/forms` | Dev playground |

**26 Components:** 7 atoms, 6 molecules, 11 organisms, 1 template, 1 layout

**5 Composables:** useAuth, useCbtEngine, useAntiCheat, useAssessment, useTenantResolver

**6 Adapters:** Auth, Exam, Assessment, Tenant, User, Registration

**6 Type definitions:** auth, exam, assessment, assessor, registration, tenant

**3 Mock API routes:** `/api/auth/me`, `/api/assessment/units`, `/api/user`

**1 API service:** CoreApiService (singleton, belum terintegrasi)

### Estimasi Penyelesaian: ~45%

---

## Implementation Roadmap

### Sprint 1 — Foundation & Integration (Minggu 1-2)
> Perkuat fondasi: validasi, error handling, state management, dan integrasi komponen yang sudah ada

#### 1.1 Form Validation System
**Priority:** Critical | **Effort:** M

Buat composable `useFormValidation` yang reusable:

- [ ] `app/composables/useFormValidation.ts` — rule-based validator
  - Required, email, minLength, maxLength, pattern (NIK 16 digit, phone)
  - Reactive error state per-field
  - `validate()`, `validateField()`, `resetErrors()`
- [ ] Integrasikan ke `login.vue` — email + password validation
- [ ] Integrasikan ke `RegistrationPersonalTab.vue` — NIK, nama, DOB, dll
- [ ] Integrasikan ke `RegistrationUploadTab.vue` — file type & size validation
- [ ] Atom: `FormErrorMessage.vue` — inline error display component

**File yang perlu diubah:**
```
app/composables/useFormValidation.ts        (baru)
app/components/atoms/FormErrorMessage.vue   (baru)
app/pages/login.vue                         (edit)
app/components/organisms/RegistrationPersonalTab.vue  (edit)
app/components/organisms/RegistrationUploadTab.vue    (edit)
```

#### 1.2 Global Error & Loading States
**Priority:** Critical | **Effort:** M

- [ ] Atom: `LoadingSkeleton.vue` — shimmer placeholder
- [ ] Atom: `LoadingSpinner.vue` — inline/overlay spinner
- [ ] Atom: `EmptyState.vue` — ilustrasi + pesan + CTA
- [ ] Atom: `ErrorAlert.vue` — dismissable error banner
- [ ] Organism: `ErrorBoundary.vue` — Vue error boundary wrapper
- [ ] Page: `app/pages/error.vue` — Nuxt error page (403/404/500)
- [ ] Composable: `useAsyncState.ts` — wrapper data fetching (loading, error, data)

**File yang perlu dibuat:**
```
app/components/atoms/LoadingSkeleton.vue    (baru)
app/components/atoms/LoadingSpinner.vue     (baru)
app/components/atoms/EmptyState.vue         (baru)
app/components/atoms/ErrorAlert.vue         (baru)
app/components/organisms/ErrorBoundary.vue  (baru)
app/composables/useAsyncState.ts            (baru)
app/pages/error.vue                         (baru)
```

#### 1.3 CBT Engine Integration
**Priority:** Critical | **Effort:** L

Hubungkan `useCbtEngine` + `useAntiCheat` ke halaman CBT:

- [ ] Refactor `cbt/[id].vue` — gunakan `useCbtEngine` composable (bukan inline logic)
- [ ] Mount `useAntiCheat` di `cbt/[id].vue` dengan lifecycle hooks
- [ ] Tambah question types: `upload` dan `observation` di `CbtQuestionCard.vue`
- [ ] Integrasikan `ExamAdapter` untuk transformasi data soal
- [ ] Tambah confirmation dialog sebelum submit ujian
- [ ] Tambah warning UI saat anti-cheat violation (toast/modal)
- [ ] Mock API: `server/api/exams/[id].get.ts` — return exam data
- [ ] Mock API: `server/api/exams/submit.post.ts` — accept submission
- [ ] Mock API: `server/api/exams/sync.post.ts` — auto-save endpoint

**File yang perlu diubah/dibuat:**
```
app/pages/cbt/[id].vue                     (refactor)
app/components/organisms/CbtQuestionCard.vue (edit - tambah upload/observation)
app/composables/useCbtEngine.ts            (edit - integrasi API)
app/composables/useAntiCheat.ts            (edit - mount hooks)
app/components/molecules/AntiCheatWarning.vue (baru)
app/components/molecules/ConfirmDialog.vue    (baru)
server/api/exams/[id].get.ts               (baru)
server/api/exams/submit.post.ts            (baru)
server/api/exams/sync.post.ts              (baru)
```

#### 1.4 CoreApiService Integration
**Priority:** High | **Effort:** S

- [ ] Wire `CoreApiService` ke semua composable yang fetch data
- [ ] `useAuth` → gunakan `coreApi.post('/auth/login')` dan `coreApi.get('/auth/me')`
- [ ] `useAssessment` → gunakan `coreApi.get('/assessment/units')`
- [ ] `useCbtEngine` → gunakan `coreApi` untuk exam fetch, sync, submit

**File yang perlu diubah:**
```
app/composables/useAuth.ts                 (edit)
app/composables/useAssessment.ts           (edit)
app/composables/useCbtEngine.ts            (edit)
```

---

### Sprint 2 — Admin CRUD & Data Management (Minggu 3-4)
> Ubah halaman admin dari mock listing ke CRUD fungsional

#### 2.1 Admin Schemes — Full CRUD
**Priority:** Critical | **Effort:** L

- [ ] Organism: `SchemeFormModal.vue` — create/edit form (code, nama, deskripsi, unit kompetensi, validity)
- [ ] Organism: `SchemeDetailPanel.vue` — slide-over detail view
- [ ] Update `admin/schemes/index.vue` — table view + search + filter + pagination
- [ ] Page: `admin/schemes/[id].vue` — detail page with unit kompetensi tree
- [ ] Composable: `useSchemes.ts` — CRUD operations
- [ ] Adapter: `SchemeAdapter.ts` — DTO ↔ Domain
- [ ] Types: `scheme.ts` — SchemeDTO, SchemeDomain, UnitCompetencyDomain
- [ ] Mock API: `server/api/schemes/index.get.ts`, `[id].get.ts`, `index.post.ts`, `[id].put.ts`, `[id].delete.ts`

**File baru:**
```
app/components/organisms/SchemeFormModal.vue
app/components/organisms/SchemeDetailPanel.vue
app/pages/admin/schemes/[id].vue
app/composables/useSchemes.ts
app/adapters/SchemeAdapter.ts
app/types/scheme.ts
server/api/schemes/index.get.ts
server/api/schemes/[id].get.ts
server/api/schemes/index.post.ts
server/api/schemes/[id].put.ts
server/api/schemes/[id].delete.ts
```

#### 2.2 Admin Question Bank — Full CRUD
**Priority:** Critical | **Effort:** L

- [ ] Organism: `QuestionFormModal.vue` — form per question type (PG options editor, essay rubric, upload instruction, observation checklist)
- [ ] Organism: `QuestionPreview.vue` — preview soal sebelum simpan
- [ ] Update `admin/questions/index.vue` — table + multi-filter + bulk actions
- [ ] Composable: `useQuestionBank.ts` — CRUD + import/export
- [ ] Adapter: `QuestionAdapter.ts` — DTO ↔ Domain
- [ ] Types: `question.ts` — QuestionDTO, QuestionDomain (extends exam types)
- [ ] Mock API endpoints

**File baru:**
```
app/components/organisms/QuestionFormModal.vue
app/components/organisms/QuestionPreview.vue
app/composables/useQuestionBank.ts
app/adapters/QuestionAdapter.ts
app/types/question.ts
server/api/questions/index.get.ts
server/api/questions/index.post.ts
server/api/questions/[id].put.ts
server/api/questions/[id].delete.ts
```

#### 2.3 Admin Schedules — Full CRUD
**Priority:** High | **Effort:** M

- [ ] Organism: `ScheduleFormModal.vue` — jadwal baru (tanggal, waktu, lokasi, max peserta, assign asesor)
- [ ] Update `admin/schedules/index.vue` — calendar view + list view toggle
- [ ] Molecule: `ScheduleCard.vue` — improved card with participant progress
- [ ] Composable: `useSchedules.ts` — CRUD + asesor assignment
- [ ] Adapter: `ScheduleAdapter.ts`
- [ ] Types: `schedule.ts`
- [ ] Mock API endpoints

#### 2.4 Admin Verifications — Workflow Engine
**Priority:** Critical | **Effort:** L

- [ ] Page: `admin/verifications/[id].vue` — detail review page (APL-01 data, APL-02 documents viewer, approve/reject/revise actions)
- [ ] Organism: `DocumentViewer.vue` — preview uploaded files (PDF, images)
- [ ] Organism: `VerificationActionBar.vue` — approve/reject/request revision dengan catatan
- [ ] Composable: `useVerifications.ts` — status transitions + notes
- [ ] Adapter: `VerificationAdapter.ts`
- [ ] Types: `verification.ts` — ApplicationStatus state machine
- [ ] Mock API: CRUD + status transition endpoints

**File baru:**
```
app/pages/admin/verifications/[id].vue
app/components/organisms/DocumentViewer.vue
app/components/organisms/VerificationActionBar.vue
app/composables/useVerifications.ts
app/adapters/VerificationAdapter.ts
app/types/verification.ts
```

---

### Sprint 3 — Missing Modules (Minggu 5-6)
> Bangun modul yang belum ada: Assessor Management, Tenant Settings, Manajer Mutu

#### 3.1 Admin — Assessor Management
**Priority:** High | **Effort:** M

- [ ] Page: `admin/assessors/index.vue` — daftar asesor dengan status lisensi
- [ ] Page: `admin/assessors/[id].vue` — profil asesor, assign skema, riwayat penilaian
- [ ] Organism: `AssessorFormModal.vue` — tambah/edit asesor
- [ ] Composable: `useAssessors.ts`
- [ ] Types: `assessor.ts` — extend dengan AssessorProfile, License info

#### 3.2 Admin — Tenant Settings
**Priority:** Medium | **Effort:** M

- [ ] Page: `admin/settings/index.vue` — tab-based settings
  - Tab General: nama LSP, alamat, kontak
  - Tab Branding: logo upload, warna primer, domain custom
  - Tab Users: daftar admin/staff dengan role management
- [ ] Composable: `useTenantSettings.ts`
- [ ] Update `useTenantResolver.ts` — real tenant data fetch

#### 3.3 Admin — Certificate Templates
**Priority:** Medium | **Effort:** L

- [ ] Page: `admin/templates/index.vue` — template listing
- [ ] Page: `admin/templates/[id].vue` — template editor
- [ ] Organism: `CertificatePreview.vue` — live preview template
- [ ] Composable: `useCertificateTemplates.ts`
- [ ] Types: `certificate.ts` — CertificateTemplate, CertificateDomain

#### 3.4 Manajer Mutu Module
**Priority:** Medium | **Effort:** L

- [ ] Page: `admin/quality/index.vue` — dashboard mutu (statistik kelulusan, breakdown per skema)
- [ ] Page: `admin/quality/reviews.vue` — antrian review keputusan asesor
- [ ] Page: `admin/quality/audit-trail.vue` — log aktivitas dengan filter tanggal/user/aksi
- [ ] Organism: `QualityReviewCard.vue` — card keputusan asesor yang perlu di-review
- [ ] Organism: `AuditLogTable.vue` — table audit trail dengan pagination
- [ ] Composable: `useQualityManager.ts`
- [ ] Types: `quality.ts` — AuditLog, QualityReview

**Tambahan middleware:**
- [ ] Update `auth.global.ts` — tambah route `/admin/quality/*` hanya untuk role `quality_manager` dan `admin`

---

### Sprint 4 — Portal Publik & Certificate Flow (Minggu 7-8)
> Penerbitan sertifikat dan verifikasi publik

#### 4.1 Asesi — Certificate View & Download
**Priority:** High | **Effort:** M

- [ ] Update `assessee/index.vue` — tampilkan sertifikat dengan status (aktif/expired/proses)
- [ ] Page: `assessee/certificates/[id].vue` — detail sertifikat + QR code + download PDF + share link
- [ ] Organism: `CertificateCard.vue` — card sertifikat dengan badge status
- [ ] Composable: `useCertificates.ts`
- [ ] Adapter: `CertificateAdapter.ts`

#### 4.2 Portal Publik — Verifikasi Sertifikat
**Priority:** Medium | **Effort:** M

- [ ] Page: `verify/index.vue` — landing verifikasi (search by nomor sertifikat)
- [ ] Page: `verify/[certificate_number].vue` — hasil verifikasi (data sertifikat, foto pemegang, QR, status)
- [ ] Layout: `PublicLayout.vue` — layout tanpa sidebar (public-facing)
- [ ] Composable: `usePublicVerification.ts`
- [ ] Update middleware — `/verify/*` sebagai public route

#### 4.3 BNSP Export
**Priority:** Low | **Effort:** M

- [ ] Page: `admin/reports/index.vue` — dashboard laporan
- [ ] Page: `admin/reports/bnsp-export.vue` — export per periode + skema
- [ ] Composable: `useReports.ts` — generate + download
- [ ] Util: `bnspFormatter.ts` — format data sesuai template BNSP

---

### Sprint 5 — Polish & Enhancement (Minggu 9-10)
> Internationalization, state management, dan UX refinement

#### 5.1 Internationalization (i18n)
**Priority:** Medium | **Effort:** M

- [ ] Setup `i18n/locales/id.json` — Bahasa Indonesia (default)
- [ ] Setup `i18n/locales/en.json` — English
- [ ] Replace semua hardcoded string di pages dan components
- [ ] Composable: `useLocale.ts` — language switcher helper
- [ ] Component: `LocaleSwitcher.vue` — dropdown ganti bahasa

#### 5.2 State Management (Pinia)
**Priority:** Medium | **Effort:** M

- [ ] Install & configure Pinia
- [ ] Store: `useAuthStore` — global auth state (replace useState scattered)
- [ ] Store: `useTenantStore` — global tenant context
- [ ] Store: `useNotificationStore` — toast/notification queue
- [ ] Molecule: `ToastNotification.vue` — toast component

#### 5.3 UX Enhancement
**Priority:** Medium | **Effort:** M

- [ ] Organism: `DataTable.vue` — reusable table with sort, filter, pagination
- [ ] Organism: `SlideOverPanel.vue` — reusable slide-over for detail views
- [ ] Organism: `Modal.vue` — reusable modal wrapper
- [ ] Molecule: `Breadcrumb.vue` — page breadcrumb navigation
- [ ] Molecule: `PageHeader.vue` — consistent page header (title + actions)
- [ ] Update `TheSidebar.vue` — collapsible, active state, nested menu
- [ ] Responsive polish — mobile nav, touch-friendly table

#### 5.4 Notification System UI
**Priority:** Low | **Effort:** S

- [ ] Organism: `NotificationPanel.vue` — dropdown notification list
- [ ] Molecule: `NotificationItem.vue` — individual notification
- [ ] Composable: `useNotifications.ts` — fetch + mark read
- [ ] Update `DashboardLayout.vue` — notification bell icon di header

---

## Dependency Graph

```
Sprint 1 (Foundation)
├── 1.1 Form Validation ──────────┐
├── 1.2 Error & Loading States ───┤
├── 1.3 CBT Integration ──────────┤── Semua sprint berikutnya butuh ini
└── 1.4 API Service Integration ──┘
         │
Sprint 2 (Admin CRUD) ◄──────────┘
├── 2.1 Schemes CRUD
├── 2.2 Question Bank CRUD
├── 2.3 Schedules CRUD
└── 2.4 Verifications Workflow
         │
Sprint 3 (Missing Modules) ◄─────┘
├── 3.1 Assessor Management
├── 3.2 Tenant Settings
├── 3.3 Certificate Templates
└── 3.4 Quality Manager
         │
Sprint 4 (Public & Certs) ◄──────┘
├── 4.1 Certificate View
├── 4.2 Public Verification
└── 4.3 BNSP Export
         │
Sprint 5 (Polish) ◄──────────────┘
├── 5.1 i18n
├── 5.2 State Management
├── 5.3 UX Enhancement
└── 5.4 Notifications
```

---

## Struktur Folder Target (Setelah Selesai)

```
frontend/lms/app/
├── adapters/
│   ├── AssessmentAdapter.ts       ✅ ada
│   ├── AuthAdapter.ts             ✅ ada
│   ├── CertificateAdapter.ts      🔲 sprint 4
│   ├── ExamAdapter.ts             ✅ ada
│   ├── QuestionAdapter.ts         🔲 sprint 2
│   ├── RegistrationAdapter.ts     ✅ ada
│   ├── ScheduleAdapter.ts         🔲 sprint 2
│   ├── SchemeAdapter.ts           🔲 sprint 2
│   ├── TenantAdapter.ts           ✅ ada
│   ├── UserAdapter.ts             ✅ ada
│   └── VerificationAdapter.ts     🔲 sprint 2
│
├── components/
│   ├── atoms/
│   │   ├── BaseBadge.vue          ✅
│   │   ├── BaseInput.vue          ✅
│   │   ├── BaseTextarea.vue       ✅
│   │   ├── CaButton.vue           ✅
│   │   ├── CaCheckbox.vue         ✅
│   │   ├── CaRadio.vue            ✅
│   │   ├── CaToggle.vue           ✅
│   │   ├── EmptyState.vue         🔲 sprint 1
│   │   ├── ErrorAlert.vue         🔲 sprint 1
│   │   ├── FormErrorMessage.vue   🔲 sprint 1
│   │   ├── LoadingSkeleton.vue    🔲 sprint 1
│   │   └── LoadingSpinner.vue     🔲 sprint 1
│   │
│   ├── molecules/
│   │   ├── AntiCheatWarning.vue   🔲 sprint 1
│   │   ├── AssessmentCriteriaItem.vue ✅
│   │   ├── Breadcrumb.vue         🔲 sprint 5
│   │   ├── CaInputSearch.vue      ✅
│   │   ├── CaSelect.vue           ✅
│   │   ├── CbtTimer.vue           ✅
│   │   ├── CompetencyToggle.vue   ✅
│   │   ├── ConfirmDialog.vue      🔲 sprint 1
│   │   ├── DecisionToggle.vue     ✅
│   │   ├── FormStepIndicator.vue  ✅
│   │   ├── NotificationItem.vue   🔲 sprint 5
│   │   ├── PageHeader.vue         🔲 sprint 5
│   │   └── ToastNotification.vue  🔲 sprint 5
│   │
│   ├── organisms/
│   │   ├── ApplicantQueueCard.vue ✅
│   │   ├── AssessmentUnitCard.vue ✅
│   │   ├── AuditLogTable.vue      🔲 sprint 3
│   │   ├── CaAsyncSelect.vue      ✅
│   │   ├── CaDatePicker.vue       ✅
│   │   ├── CbtQuestionCard.vue    ✅ (perlu extend)
│   │   ├── CertificateCard.vue    🔲 sprint 4
│   │   ├── CertificatePreview.vue 🔲 sprint 3
│   │   ├── DataTable.vue          🔲 sprint 5
│   │   ├── DocumentViewer.vue     🔲 sprint 2
│   │   ├── ErrorBoundary.vue      🔲 sprint 1
│   │   ├── Modal.vue              🔲 sprint 5
│   │   ├── NotificationPanel.vue  🔲 sprint 5
│   │   ├── QualityReviewCard.vue  🔲 sprint 3
│   │   ├── QuestionFormModal.vue  🔲 sprint 2
│   │   ├── QuestionPreview.vue    🔲 sprint 2
│   │   ├── RegistrationCompetencyTab.vue ✅
│   │   ├── RegistrationPersonalTab.vue   ✅
│   │   ├── RegistrationUploadTab.vue     ✅
│   │   ├── ReviewSection.vue      ✅
│   │   ├── ScheduleFormModal.vue  🔲 sprint 2
│   │   ├── SchemeCard.vue         ✅
│   │   ├── SchemeDetailPanel.vue  🔲 sprint 2
│   │   ├── SchemeFormModal.vue    🔲 sprint 2
│   │   ├── SlideOverPanel.vue     🔲 sprint 5
│   │   ├── TheSidebar.vue         ✅ (perlu update)
│   │   └── VerificationActionBar.vue 🔲 sprint 2
│   │
│   └── templates/
│       ├── DashboardLayout.vue    ✅
│       └── PublicLayout.vue       🔲 sprint 4
│
├── composables/
│   ├── useAntiCheat.ts            ✅ (perlu mount)
│   ├── useAssessment.ts           ✅
│   ├── useAssessors.ts            🔲 sprint 3
│   ├── useAsyncState.ts           🔲 sprint 1
│   ├── useAuth.ts                 ✅ (perlu wire API)
│   ├── useCbtEngine.ts            ✅ (perlu integrasi)
│   ├── useCertificates.ts         🔲 sprint 4
│   ├── useCertificateTemplates.ts 🔲 sprint 3
│   ├── useFormValidation.ts       🔲 sprint 1
│   ├── useLocale.ts               🔲 sprint 5
│   ├── useNotifications.ts        🔲 sprint 5
│   ├── usePublicVerification.ts   🔲 sprint 4
│   ├── useQualityManager.ts       🔲 sprint 3
│   ├── useQuestionBank.ts         🔲 sprint 2
│   ├── useReports.ts              🔲 sprint 4
│   ├── useSchedules.ts            🔲 sprint 2
│   ├── useSchemes.ts              🔲 sprint 2
│   ├── useTenantResolver.ts       ✅ (perlu perkuat)
│   ├── useTenantSettings.ts       🔲 sprint 3
│   └── useVerifications.ts        🔲 sprint 2
│
├── pages/
│   ├── index.vue                  ✅
│   ├── login.vue                  ✅ (perlu validasi)
│   ├── error.vue                  🔲 sprint 1
│   ├── admin/
│   │   ├── index.vue              ✅
│   │   ├── assessors/
│   │   │   ├── index.vue          🔲 sprint 3
│   │   │   └── [id].vue           🔲 sprint 3
│   │   ├── quality/
│   │   │   ├── index.vue          🔲 sprint 3
│   │   │   ├── reviews.vue        🔲 sprint 3
│   │   │   └── audit-trail.vue    🔲 sprint 3
│   │   ├── questions/
│   │   │   └── index.vue          ✅ (perlu CRUD)
│   │   ├── reports/
│   │   │   ├── index.vue          🔲 sprint 4
│   │   │   └── bnsp-export.vue    🔲 sprint 4
│   │   ├── schedules/
│   │   │   └── index.vue          ✅ (perlu CRUD)
│   │   ├── schemes/
│   │   │   ├── index.vue          ✅ (perlu CRUD)
│   │   │   └── [id].vue           🔲 sprint 2
│   │   ├── settings/
│   │   │   └── index.vue          🔲 sprint 3
│   │   ├── templates/
│   │   │   ├── index.vue          🔲 sprint 3
│   │   │   └── [id].vue           🔲 sprint 3
│   │   └── verifications/
│   │       ├── index.vue          ✅ (perlu workflow)
│   │       └── [id].vue           🔲 sprint 2
│   ├── assessee/
│   │   ├── index.vue              ✅
│   │   └── certificates/
│   │       └── [id].vue           🔲 sprint 4
│   ├── assessment/
│   │   └── apl-02.vue             ✅
│   ├── assessor/
│   │   ├── index.vue              ✅
│   │   └── review/
│   │       └── [id].vue           ✅
│   ├── cbt/
│   │   └── [id].vue               ✅ (perlu integrasi)
│   ├── registration/
│   │   └── index.vue              ✅
│   ├── sandbox/
│   │   └── forms.vue              ✅
│   └── verify/
│       ├── index.vue              🔲 sprint 4
│       └── [certificate_number].vue 🔲 sprint 4
│
├── services/
│   └── api/
│       └── CoreApiService.ts      ✅ (perlu integrasi)
│
├── types/
│   ├── assessment.ts              ✅
│   ├── assessor.ts                ✅ (perlu extend)
│   ├── auth.ts                    ✅
│   ├── certificate.ts             🔲 sprint 3
│   ├── exam.ts                    ✅ (perlu extend)
│   ├── quality.ts                 🔲 sprint 3
│   ├── question.ts                🔲 sprint 2
│   ├── registration.ts            ✅
│   ├── schedule.ts                🔲 sprint 2
│   ├── scheme.ts                  🔲 sprint 2
│   ├── tenant.ts                  ✅
│   └── verification.ts            🔲 sprint 2
│
└── utils/
    └── bnspFormatter.ts           🔲 sprint 4
```

---

## Ringkasan Per Sprint

| Sprint | Fokus | Pages Baru | Components Baru | Composables Baru |
|--------|-------|-----------|-----------------|-----------------|
| **1** | Foundation | 1 | 8 | 2 |
| **2** | Admin CRUD | 2 | 8 | 4 |
| **3** | Missing Modules | 7 | 5 | 5 |
| **4** | Public & Certs | 5 | 2 | 4 |
| **5** | Polish | 0 | 8 | 3 |
| **Total** | | **15** | **31** | **18** |

**Total after completion:**
- Pages: 14 existing + 15 new = **29 pages**
- Components: 26 existing + 31 new = **57 components**
- Composables: 5 existing + 18 new = **23 composables**
- Adapters: 6 existing + 5 new = **11 adapters**
- Types: 6 existing + 6 new = **12 type files**

---

## Catatan Teknis

### Pattern yang WAJIB diikuti (sesuai expert-frontend rules):
1. **Atomic Design** — semua komponen masuk atoms/molecules/organisms/templates
2. **Adapter Pattern** — JANGAN panggil API langsung di component. Gunakan: Service → Adapter → Composable → Component
3. **Type Safety** — definisikan DTO (dari API, snake_case) dan Domain (untuk UI, camelCase) terpisah
4. **Composable-first** — business logic di composable, bukan di component

### Convention:
- File naming: PascalCase untuk .vue, camelCase untuk .ts
- Component prefix: `Ca` untuk atom/molecule generic, nama deskriptif untuk organism
- Composable prefix: `use`
- Adapter suffix: `Adapter`
- API mock routes di `server/api/` mengikuti RESTful convention

### Database reminder:
- PostgreSQL dengan multi-schema (schema per tenant)
- Saat ini fokus frontend — semua data mock via Nuxt server routes
- Ketika backend ready, cukup ganti `baseURL` di `CoreApiService` dan hapus `server/api/` mock routes
