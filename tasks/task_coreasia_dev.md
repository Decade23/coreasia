# Pantau — Development

## Rules

### MUST IMPLEMENT
- Ikuti semua instruksi di dalam folder `E:\DEV\works\iat\skills`
- Project menggunakan Docker. Selalu ikuti standard prosedur, termasuk di local development
- Setelah pekerjaan selesai, pastikan build success. Jika diperlukan force recreate dan rebuild ulang
- Jangan ubah port development
- Selalu gunakan form field custom yang sudah ada (search select, date picker, dll). Hindari form field standard HTML
- Error handling: jangan expose hal sensitif ke user. Simpan di logs backend. Pastikan mudah di-trace
- Jangan gunakan alert. Selalu gunakan modal
- Jika ada action baru, selalu integrasikan dengan audit log. Pastikan audit log readable oleh user
- Screenshot yang di-attach harus dihapus dari project setelah selesai
- jika setelah selesai rebuild dan ada cache atau sisa dari build lama HAPUS DAN BERSIHKAN

### Design
- Pastikan semua UI mendukung 2 tema: **light mode** dan **dark mode**
- Pastikan semua text tersedia dalam 2 bahasa: **Indonesia** dan **English**
<!-- - Default bahasa Indonesia. Jangan tampilkan language switcher -->

### Git & Commit
- Author: `Dedi Fardiyanto <dedif15@gmail.com>`
- Commit message: format standard, jelaskan perubahan dengan jelas, hindari kata-kata berbau AI
- Selalu commit setelah pekerjaan selesai, **jangan push sampai diperintah**
- Screenshot yang di-attach harus dihapus dari project setelah selesai

### Exclude dari Git (bukan .gitignore)
- folder `coreasia\tasks`

---

## Task

### Format Penulisan

**Backlog / In Progress** — tulis task sebagai checklist:
```
- [ ] deskripsi task
```

**Done** — kelompokkan per kategori dalam tabel:
```
#### Nama Kategori
| Task | Commit | Keterangan |
|------|--------|------------|
| Judul singkat | `hash` atau `-` | jelaskkan apa yang kamu kerjakan, jelaskan dengan bahasa yang mudah dimengerti dan apa impact yang dirasakan user |
```

Untuk konsultasi/keputusan (tanpa code change):
```
#### Nama Kategori (Konsultasi)
| Keputusan | Detail |
|-----------|--------|
| Judul | jelaskkan apa yang kamu kerjakan, jelaskan dengan bahasa yang mudah dimengerti dan apa impact yang dirasakan user |
```

**Aturan:**
- Task selesai → pindahkan dari Backlog/In Progress ke Done (tabel per kategori)
- Jangan tulis catatan panjang — cukup 1 baris per row
- Screenshot yang di-attach harus dihapus setelah selesai
- Commit hash wajib diisi jika ada perubahan code, `-` jika konsultasi saja
- cara menjawab pertanyaan/task/backlog jelaskkan apa yang kamu kerjakan, jelaskan dengan bahasa yang mudah dimengerti dan apa impact yang dirasakan user


### Backlog

### In Progress


### Done

#### Landing Mobile Hero & Page Optimization
| Task | Commit | Keterangan |
|------|--------|------------|
| Neural network mobile | `-` | Animasi hero CoreAsia sekarang tetap tampil di mobile dengan jumlah partikel lebih ringan, jadi first impression tetap premium tanpa terlalu membebani HP user |
| Audit optimasi halaman landing | `-` | Halaman publik dicek untuk SEO, schema, cache/redirect, gambar, dan beban JS; redirect legacy yang pasti dipindah ke server-level agar akses lebih cepat dan lebih bersih untuk SEO |

#### CoreAsia Skill & LMS UX Guardrails
| Task | Commit | Keterangan |
|------|--------|------------|
| Skill Codex CoreAsia Operator | `-` | Codex sekarang punya panduan khusus CoreAsia agar kerja landing, gateway, dan LMS lebih konsisten, tidak salah port, dan laporan tetap mudah dipahami client |
| Modal dan toast LMS | `-` | APL-02 dan review asesor tidak lagi memakai popup bawaan browser, sehingga pengalaman user terasa lebih rapi dan premium |
| Date picker custom LMS | `-` | Tanggal lahir dan jadwal ujian sekarang memakai date picker CoreAsia, jadi tampilan form lebih konsisten di desktop dan mobile |

#### Security, Navigation & Performance Hardening
| Task | Commit | Keterangan |
|------|--------|------------|
| Sanitasi HTML artikel | `87c8465` | Artikel publik sekarang dibersihkan sebelum `v-html`, sehingga payload HTML berbahaya tidak ikut dirender ke user |
| Parent route layanan dan solusi | `87c8465` | Tambah route `/layanan` dan `/solutions` sebagai redirect ke halaman tujuan, jadi breadcrumb tidak lagi membawa user ke 404 |
| Artikel static-first + refresh API | `87c8465` | Detail artikel pakai data lokal lebih dulu saat tersedia lalu refresh dari API, sehingga TTFB tidak ikut menunggu timeout panjang |
| Split locale content EN | `87c8465` | Konten English dipisah ke chunk terpisah dan diload saat dibutuhkan, sehingga bundle dasar publik lebih ringan |
| SSR plan register + timeout gateway | `87c8465` | Halaman `/register` sudah SSR untuk ringkasan plan dan tetap punya fallback cepat saat gateway tidak responsif |
| Build dan link checker verifikasi | `87c8465` | Build Nuxt selesai, route checker bersih `0` error dan `0` warning untuk internal link publik |


#### Locale SSR, Redirect & Preview Validation
| Task | Commit | Keterangan |
|------|--------|------------|
| Redirect server-level untuk /solutions dan /layanan | `b6d8dd7` | Parent route sekarang mengembalikan 301 di preview/server response, jadi redirect tidak lagi berhenti sebagai render 200 biasa |
| Halaman publik ganti dari prerender ke SWR | `b6d8dd7` | Route marketing tetap cepat lewat cache server 1 jam, tapi sekarang query locale `?lang=en` bisa dirender benar di SSR |
| Sinkronisasi locale SSR ke content state | `b6d8dd7` | Konten English tidak lagi bergantung ke hydration untuk route SSR, sehingga title dan body publik sudah sesuai locale sejak response pertama |
| Noise SSR gateway ditekan | `b6d8dd7` | Log error fetch plan saat prerender/preview tidak lagi memenuhi stderr production ketika gateway sedang offline |
| Smoke test preview final | `b6d8dd7` | Verifikasi 301 untuk `/solutions` dan `/layanan`, SSR `/register`, list + detail `/artikel`, serta locale English untuk `/about` dan `/register` lulus semua |

#### Performance, Analytics & CTA Optimization
| Task | Commit | Keterangan |
|------|--------|------------|
| Audit performa + pricing SSR resilience | `a084a44` | Halaman `/pricing` sekarang render plan sejak SSR, mencoba refresh lagi di client saat gateway sempat gagal, dan menampilkan fallback CTA konsultasi supaya section paket tidak kosong |
| Audit Google Analytics / GTM / GSC | `a084a44` | Tracking sekarang punya initial + SPA page view, auto-track CTA tombol komersial, `noscript` GTM siap dirender server-side, CSP mengizinkan iframe GTM, dan meta `google-site-verification` bisa diaktifkan lewat env public |
| Audit CTA / user interaction / lead capture | `a084a44` | CTA ke pricing, contact, register, WhatsApp, dan email sekarang lebih terukur lintas halaman; CTA pricing diarahkan ke `/contact?subject=pricing`; form contact dan register juga mulai merekam `form_start` untuk analisa funnel lead |

#### Konsultasi
| Keputusan | Detail |
|-----------|--------|
| Sudah semua? | Ya, semua fase SEO code sudah selesai (Fase 1-3). Yang tersisa: operasional (connect ke Pantau + tulis blog articles) |
| Halaman /register | Halaman registrasi untuk LMS CoreAsia - user bisa daftar akun organisasi baru. Link dari pricing page `/register?plan=starter` |
| Pricing plan tidak sama | Sudah di-fix di commit `27ed1a4` (Pro 250k, Business 600k, Enterprise 1.5jt + Self-Hosted). Screenshot menunjukkan cache lama. Sudah clean rebuild (.output + cache dihapus) |
#### SEO, Keyword & Sitelinks Optimization (Fase 1)
| Task | Commit | Keterangan |
|------|--------|------------|
| Fix harga Pantau | `27ed1a4` | Sync 4 tier pricing ke data aktual Pantau (Pro 250k, Business 600k, Enterprise 1.5jt). Tambah Self-Hosted tier. ID + EN |
| Section IDs untuk sitelinks | `27ed1a4` | Tambah id attributes di 7 halaman: layanan, paket, faq, fitur, harga, visi, tim, proses, paket-harga. Google bisa deep-link ke section |
| Optimasi title tags + meta desc | `27ed1a4` | 10+ halaman dioptimasi dengan keyword spesifik, lokasi (Jakarta/Indonesia), dan harga. ID + EN |
| Tambah Layanan ke navigasi utama | `27ed1a4` | Nav item "Layanan" ditambahkan ke header — service pages sekarang mudah ditemukan dari semua halaman |
| Enable OG image generation | `27ed1a4` | Auto-generate OG image per halaman saat di-share ke social media |
| Enhance homepage schema | `27ed1a4` | ProfessionalService: telephone, 10 kota besar, knowsAbout. Tambah WebSite + SiteNavigationElement schema |
| Update robots.txt | `27ed1a4` | Block /register, /maintenance, /404, /500. Allow /artikel, /layanan, /products |
| Enhance sitemap config | `27ed1a4` | Exclude non-public pages, set changefreq weekly, priority 0.7 |
| Pantau schema pricing | `27ed1a4` | SoftwareApplication: lowPrice 0, highPrice 1.500.000, offerCount 5 |

#### Image, Cross-Linking & Footer SEO (Fase 2)
| Task | Commit | Keterangan |
|------|--------|------------|
| NuxtImg di artikel pages | `048a459` | Replace `<img>` dengan `<NuxtImg>` — lazy loading + webp format otomatis |
| Cross-linking produk & layanan | `048a459` | Pantau → layanan monitoring, pricing, build. Build → jasa website, web app, pantau. Meningkatkan internal linking |
| Breadcrumb labels layanan | `048a459` | Tambah labels: Layanan, Jasa Pembuatan Website, Jasa Pembuatan Aplikasi Web, Web Monitoring Dashboard |
| Prerender halaman tambahan | `048a459` | privacy-policy, terms, solutions/leadku, solutions/lms di-prerender untuk load cepat |
| Image optimization config | `048a459` | quality 80, format webp + avif. Gambar lebih kecil tanpa kehilangan kualitas |
| Footer geographic keywords | `048a459` | Link SEO: "Jasa Pembuatan Website Jakarta", "Web Development Surabaya", "Jasa Web App Bandung" dll |

#### Content & New Pages (Fase 3)
| Task | Commit | Keterangan |
|------|--------|------------|
| Halaman /faq | `06b6531` | FAQ lengkap 5 kategori (Umum, Website, Web App, Monitoring, Harga) dengan 20+ pertanyaan. FAQPage schema untuk rich snippets. Filter per kategori |
| Halaman /portfolio | `06b6531` | Showcase 3 proyek: Pantau (SaaS), CoreAsia CMS (Company Website), LMS Sertifikasi (Custom Web App). Tech stack + highlights per proyek |
| Schema LeadKu & LMS | `06b6531` | Tambah SoftwareApplication schema: LeadKu (BusinessApplication), LMS (EducationalApplication). Membantu Google memahami produk |
| Content i18n FAQ + Portfolio | `06b6531` | Semua konten tersedia dalam Bahasa Indonesia dan English |
| Prerender + breadcrumb | `06b6531` | /faq dan /portfolio di-prerender untuk load instan. Breadcrumb labels ditambahkan |

#### Bug Fixes
| Task | Commit | Keterangan |
|------|--------|------------|
| Fix z-index dropdown SearchSelect | `264a8b9` | Dropdown "Tipe Organisasi" di /register tertutupi section Akun Administrator di bawahnya. Fix: container z-50 saat dropdown open |

#### Fase 4 (Operasional — Non-Code)
| Keputusan | Detail |
|-----------|--------|
| Connect ke Pantau | Daftarkan coreasia.id di pantau.coreasia.id, connect GA4 + GSC. Track 15 priority keywords (jasa pembuatan website, digital agency Indonesia, dll). Jalankan SEO audit bulanan |
| Blog content calendar | Target 2-4 artikel/bulan: biaya buat website, cara monitoring website, jasa website Jakarta, tutorial GA4, tips SEO Indonesia, landing page vs company profile, web app vs website |

### Blocker
