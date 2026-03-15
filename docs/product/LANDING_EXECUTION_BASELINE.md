# Landing Execution Baseline
### CoreAsia Landing Transformation
**Status:** Active  
**Date:** 15 Maret 2026  
**Module:** `frontend/landing`  
**Primary Source of Truth:** `task_coreasia.md`

---

## Decision

Dokumen ini membakukan bahwa `task_coreasia.md` adalah acceptance baseline utama untuk seluruh pekerjaan landing yang berjalan saat ini.

Dokumen ini tidak menggantikan `task_coreasia.md`. Fungsinya hanya:
- menerjemahkan task menjadi urutan eksekusi yang operasional
- mengunci scope aktif agar pekerjaan tidak melebar tanpa kontrol
- menjadi checklist done criteria sebelum build, docker validation, dan commit

---

## Active Scope

Scope aktif saat ini dibatasi ke `frontend/landing` dengan fokus:
- repositioning homepage dari LMS-centric menjadi parent brand CoreAsia
- pemisahan `Produk Kami` dan `Model Kerjasama`
- foundation untuk dual theme `light/dark`
- foundation untuk bilingual `id/en` tanpa language switcher
- alignment CTA, nav, footer, dan route taxonomy

Scope backend tidak diubah pada fase ini kecuali ada action baru yang benar-benar membutuhkan persistence, logging, atau integrasi audit log.

---

## Non-Negotiables

Semua pekerjaan landing harus lolos aturan berikut:

1. Jangan ubah port development.
2. Design harus support `light` dan `dark`.
3. Text harus tersedia untuk `Bahasa Indonesia` dan `English`.
4. Jangan tampilkan language switcher. Default locale tetap `id`.
5. Gunakan custom form field yang sudah menjadi pola existing. Hindari field standar.
6. Jangan gunakan `alert`. Gunakan modal atau UI state yang konsisten.
7. Error handling tidak boleh mengekspos data sensitif ke user-facing UI.
8. Jika ada action baru yang persisted atau operasional, integrasikan dengan audit log yang readable.
9. Setelah pekerjaan selesai, validasi build dan jalankan prosedur docker sesuai standar project.
10. Jika ada screenshot sementara, hapus kembali dari project sebelum finalisasi.

---

## Current Gap Audit

Kondisi repo saat baseline ini dibuat:

### 1. Theme Foundation
- Landing masih dark-first dan belum memiliki semantic token lengkap untuk light mode.
- Metadata app masih mengarah ke `color-scheme: dark`.

### 2. Localization Foundation
- Default locale sudah `id`.
- Language switcher di header sudah disembunyikan.
- Content layer landing belum memiliki branch `en` yang lengkap.

### 3. Information Architecture
- Homepage masih menempatkan hero dan messaging utama pada LMS/certification.
- Nav, homepage cards, dan footer masih memakai taxonomy `solutions`.
- Produk dan model kerjasama masih tercampur dalam satu grouping.

### 4. Form Consistency
- Contact form sudah memakai custom `BaseInput`, `BaseTextarea`, dan `SearchSelect`.
- Consent control masih native checkbox dan perlu diselaraskan dengan rule custom field bila form tersebut disentuh lagi.

### 5. SEO / Routing
- Route static dan prerender masih fokus pada `/solutions/*`.
- Bila taxonomy baru diperkenalkan, legacy route perlu dipertahankan melalui redirect atau mapping yang aman.

---

## Execution Order

Urutan kerja yang disetujui untuk landing:

### Phase 1 - Foundation Hardening
- refactor semantic color tokens agar siap untuk light/dark
- siapkan content structure `id/en` tanpa menampilkan switcher
- tetapkan taxonomy data untuk `products`, `partnerships`, dan CTA

### Phase 2 - Brand / IA Refactor
- ubah hero homepage menjadi parent-brand messaging
- pecah section utama menjadi `Produk Kami` dan `Model Kerjasama`
- update navigation dan footer agar mengikuti taxonomy baru

### Phase 3 - Product Rollout
- siapkan product family entry untuk `LMS`, `Pantau`, dan `LeadKu`
- sinkronkan CTA homepage dengan contact subject atau waitlist/demo flow
- siapkan strategy untuk route baru dan route legacy

### Phase 4 - Verification
- lint / build
- docker validation sesuai prosedur project
- cek responsive desktop dan mobile
- cek dark dan light mode
- cek locale `id` dan `en`
- pastikan tidak ada screenshot sementara yang tertinggal

---

## Done Checklist

Checklist ini harus dipakai sebelum pekerjaan landing dianggap selesai:

- [ ] Homepage tidak lagi LMS-centric
- [ ] `Produk Kami` dan `Model Kerjasama` sudah terpisah jelas
- [ ] Nav dan footer sudah mengikuti taxonomy baru
- [ ] Theme `light` dan `dark` sama-sama usable
- [ ] Locale `id` dan `en` tersedia tanpa switcher
- [ ] Default locale tetap `id`
- [ ] Form yang disentuh hanya memakai komponen custom existing
- [ ] Tidak ada `alert` baru
- [ ] Error state aman dan tidak mengekspos data sensitif
- [ ] Route baru dan route legacy memiliki strategi yang jelas
- [ ] Build berhasil
- [ ] Docker validation berhasil
- [ ] Screenshot sementara sudah dibersihkan
- [ ] Commit hanya berisi perubahan yang relevan

---

## Guardrails

- Jangan edit `task_coreasia.md` untuk memindahkan acceptance criteria ke file lain.
- Jangan campurkan perubahan landing dengan perubahan backend atau LMS yang tidak relevan.
- Jangan memaksakan audit log pada perubahan visual murni yang tidak membuat action persisted baru.
- Jangan mengubah port local dev.

---

## Immediate Outcome

Mulai titik ini, setiap pekerjaan landing berikutnya harus dievaluasi terhadap dokumen ini dan `task_coreasia.md`.

Jika ada konflik:
1. `task_coreasia.md`
2. `LANDING_EXECUTION_BASELINE.md`
3. diskusi turunan / chat task
