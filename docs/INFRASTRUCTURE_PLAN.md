# CoreAsia Infrastructure Plan & Server Specification

> Dokumen ini berisi analisa teknis, spesifikasi server, dan perbandingan biaya untuk deployment produk CoreAsia.

---

## 1. Produk yang Harus Di-Host

CoreAsia saat ini memiliki **3 produk** yang berjalan bersamaan:

| # | Produk | Stack | Fungsi |
|---|--------|-------|--------|
| 1 | **Landing Page** (`coreasia.id`) | Nuxt 3 SSR | Marketing site, SEO |
| 2 | **LMS** (`lms.coreasia.id`) | Nuxt 4 + Go API + PostgreSQL + MinIO | Platform sertifikasi profesi |
| 3 | **Pantau** (`pantau.coreasia.id`) | Nuxt 3 + Go API + Python Report + PostgreSQL + Redis + Nginx | Analytics dashboard, SEO monitoring |

### Pantau — Detail Arsitektur (Observasi Langsung)

```
┌─────────────────────────────────────────────────────────┐
│                    Nginx (Reverse Proxy)                 │
│                      Port 80 → 8888                     │
├──────────────────────┬──────────────────────────────────┤
│    Frontend (Nuxt 3) │         Backend (Go + Fiber)     │
│    Port 3000 → 4000  │         Port 8080 → 4080        │
│    SSR + Vue 3       │         Clean Architecture       │
│    Pinia + Chart.js  │         JWT + Google OAuth        │
│    Tailwind CSS      │         GSC + GA4 API Integration │
├──────────────────────┼──────────────────────────────────┤
│                      │    Report Service (Python)        │
│                      │    FastAPI + ReportLab             │
│                      │    Port 8000 → 4300                │
├──────────────────────┴──────────────────────────────────┤
│    PostgreSQL 16          │        Redis 7               │
│    Port 5432 → 5434       │        Port 6379 → 6381     │
└───────────────────────────┴──────────────────────────────┘
```

**Fitur Pantau:**
- Dashboard multi-website (GSC + GA4)
- 14 pengguna, 10 website terdaftar, MRR Rp 1.998.000
- 25 migrasi database (users, websites, tokens, analytics, reports, leads, subscriptions, notifications, AI, pagespeed, payments, competitors)
- Sistem billing manual (transfer bank) + paket langganan
- AI Assistant (Groq/OpenAI/Anthropic/Gemini)
- PDF report generation (Python microservice)
- Leads management + webhook
- Admin panel lengkap (users, billing, API usage, broadcast, audit log, team)

---

## 2. Resource Usage Analysis (Data Aktual dari Docker)

### Memory Usage (Kondisi Dev, Idle)

| Container | Memory | CPU | Catatan |
|-----------|--------|-----|---------|
| **Pantau Frontend** | 52 MB | 0.00% | Nuxt 3 SSR (production build) |
| **Pantau Backend** | 10.5 MB | 0.12% | Go binary sangat efisien |
| **Pantau Report Service** | 67 MB | 0.12% | Python + FastAPI |
| **Pantau Nginx** | 2.8 MB | 0.00% | Reverse proxy |
| **Pantau PostgreSQL** | 38 MB | 0.89% | 25 migrasi, ~14 users |
| **Pantau Redis** | 3.8 MB | 0.28% | Cache + session |
| **Subtotal Pantau** | **~175 MB** | **~1.4%** | |
| | | | |
| **LMS Frontend** | 555 MB | 2.24% | Dev mode (HMR aktif) |
| **LMS API** | 29 MB | 0.00% | Go binary |
| **LMS PostgreSQL** | 31 MB | 0.00% | Shared instance |
| **LMS MinIO** | 73 MB | 0.06% | Object storage |
| **Subtotal LMS** | **~688 MB** | **~2.3%** | Dev mode, production ~200 MB |
| | | | |
| **Landing** | 741 MB - 1.1 GB | 3-6% | Dev mode, production ~80 MB |

### Docker Image Size

| Image | Size | Catatan |
|-------|------|---------|
| Pantau Backend (Go) | 147 MB | Multi-stage build, bagus |
| Pantau Frontend (Nuxt) | 266 MB | Production build |
| Pantau Report Service | 289 MB | Python + dependencies |
| LMS API (Go) | 1.59 GB | **Perlu optimasi** (dev build) |
| LMS Frontend | 861 MB | **Perlu optimasi** (dev build) |
| PostgreSQL 17 Alpine | 399 MB | Standard |
| Redis 7 Alpine | 61 MB | Standard |
| MinIO | 241 MB | Standard |
| Nginx Alpine | 93 MB | Standard |

---

## 3. Estimasi Kebutuhan Resource (Production)

### Skenario: Semua Produk dalam 1 VPS

| Komponen | RAM (Min) | RAM (Optimal) | Storage |
|----------|-----------|---------------|---------|
| **Pantau Frontend** | 60 MB | 128 MB | 300 MB |
| **Pantau Backend** | 15 MB | 64 MB | 150 MB |
| **Pantau Report** | 80 MB | 128 MB | 300 MB |
| **Pantau Nginx** | 5 MB | 16 MB | 100 MB |
| **LMS Frontend** | 80 MB | 128 MB | 300 MB |
| **LMS Backend** | 15 MB | 64 MB | 150 MB |
| **Landing** | 60 MB | 128 MB | 300 MB |
| **PostgreSQL** (shared) | 128 MB | 512 MB | 5 GB+ |
| **Redis** | 10 MB | 64 MB | 50 MB |
| **MinIO** | 80 MB | 256 MB | 10 GB+ |
| **OS + Docker** | 200 MB | 300 MB | 3 GB |
| **Buffer (30%)** | — | 500 MB | — |
| **TOTAL** | **~733 MB** | **~2.3 GB** | **~20 GB** |

### Proyeksi Berdasarkan Jumlah User

| Metrik | 10 Users | 50 Users | 200 Users | 500 Users | 1000 Users |
|--------|----------|----------|-----------|-----------|------------|
| **RAM** | 2 GB | 2 GB | 4 GB | 4-8 GB | 8-16 GB |
| **vCPU** | 1 | 2 | 2-4 | 4 | 4-8 |
| **Storage** | 20 GB | 40 GB | 60 GB | 100 GB | 200 GB |
| **Bandwidth** | 50 GB | 200 GB | 500 GB | 1 TB | 2 TB |
| **DB Size** | ~100 MB | ~500 MB | ~2 GB | ~5 GB | ~10 GB |
| **Concurrent** | 1-3 | 5-15 | 20-60 | 50-150 | 100-300 |

> **Catatan:** Pantau menyimpan analytics snapshots, report PDFs, dan leads — data tumbuh linear dengan jumlah website × hari retensi. Retensi 365 hari (Enterprise) berarti ~365 rows per website per metrik.

---

## 4. Perbandingan Harga Hosting

### A. IDCloudHost (Indonesia 🇮🇩)

> *Harga aktual per Maret 2026 dari [idcloudhost.com/pricing](https://idcloudhost.com/pricing/)*

**Tipe: AMD eXtreme (6x Faster, NVMe)**

| vCPU | RAM | Storage | Harga/bulan | Harga/jam |
|------|-----|---------|-------------|-----------|
| 2 | 2 GB | 20 GB NVMe | Rp 149.000 | Rp 204 |
| 2 | 2 GB | 40 GB NVMe | Rp 193.000 | Rp 264 |
| 2 | 4 GB | 60 GB NVMe | Rp 356.000 | Rp 488 |
| **2** | **4 GB** | **40 GB NVMe** | **Rp 312.000** | **Rp 428** |

> *Baris terakhir = konfigurasi custom via slider (rekomendasi untuk Phase 1)*
> *Basic Standard (1 CPU/1 GB) saat ini "Currently Not Available"*
> *Bandwidth: Unlimited*

**Keunggulan IDCloudHost:**
- ✅ Server di Indonesia (latency rendah untuk user lokal)
- ✅ Bandwidth unlimited (tanpa biaya tambahan)
- ✅ Support 24/7 Bahasa Indonesia
- ✅ IP Indonesia (SEO lokal lebih baik)
- ✅ Harga Rupiah (tidak terpengaruh kurs)
- ✅ Cocok untuk compliance data di Indonesia (UU PDP)

### B. DigitalOcean (Singapore 🇸🇬)

| Plan | vCPU | RAM | Storage | Bandwidth | Harga/bulan |
|------|------|-----|---------|-----------|-------------|
| Basic | 1 | 1 GB | 25 GB SSD | 1 TB | $6 (~Rp 96.000) |
| Basic | 1 | 2 GB | 50 GB SSD | 2 TB | $12 (~Rp 192.000) |
| Basic | 2 | 2 GB | 60 GB SSD | 3 TB | $18 (~Rp 288.000) |
| **Basic** | **2** | **4 GB** | **80 GB SSD** | **4 TB** | **$24 (~Rp 384.000)** |
| Premium | 2 | 4 GB | 80 GB NVMe | 4 TB | $32 (~Rp 512.000) |
| Basic | 4 | 8 GB | 160 GB SSD | 5 TB | $48 (~Rp 768.000) |

> *Kurs: $1 = Rp 16.000 (estimasi)*

### C. Vercel (Free Tier — Saat ini untuk Landing)

| Fitur | Hobby (Free) | Pro ($20/user/bln) |
|-------|-------------|-------------------|
| Bandwidth | 100 GB/bln | 1 TB/bln |
| Serverless Functions | 150K invocations | 1M invocations |
| Build Minutes | 6.000/bln | 24.000/bln |
| Projects | Unlimited | Unlimited |
| SSL | ✅ | ✅ |
| Preview Deploy | ✅ | ✅ |
| Custom Domain | ✅ | ✅ |

### D. Railway / Render (Alternatif)

| Provider | Free Tier | Starter | Catatan |
|----------|-----------|---------|---------|
| Railway | $5 credit/bln | $5/bln + usage | Container-based, no cold start |
| Render | Free (spin down) | $7/bln | Cold start 30-60s pada free tier |
| Fly.io | 3 shared VMs | $5/bln | Edge computing, global |

---

## 5. Rekomendasi Deployment Strategy

### Option A: All-in-One VPS IDCloudHost (⭐ REKOMENDASI)

**Untuk fase saat ini (< 50 users)**

```
IDCloudHost AMD eXtreme — 2 vCPU, 4 GB RAM, 40 GB NVMe
Harga: Rp 312.000 / bulan
```

| Domain | Service | Setup |
|--------|---------|-------|
| `coreasia.id` | Landing (Nuxt SSR) | Docker + Nginx |
| `pantau.coreasia.id` | Pantau (Full Stack) | Docker Compose |
| `lms.coreasia.id` | LMS (Full Stack) | Docker Compose |
| `api.coreasia.id` | LMS API | Nginx reverse proxy |

**Setup:**
- 1 VPS dengan Docker Compose untuk semua service
- Nginx sebagai reverse proxy utama (routing domain)
- Let's Encrypt SSL via Certbot
- Cloudflare sebagai DNS + CDN (free tier)

**Estimasi Biaya Bulanan:**

| Item | Biaya |
|------|-------|
| VPS IDCloudHost 2vCPU/4GB | Rp 312.000 |
| Domain `.id` (Rp 275.000/thn) | Rp 23.000 |
| Cloudflare CDN | Rp 0 (free) |
| SSL (Let's Encrypt) | Rp 0 |
| **TOTAL** | **Rp 335.000/bulan** |

### Option B: Hybrid (Vercel + VPS)

**Landing tetap di Vercel, Backend di VPS**

```
Vercel Free → Landing (coreasia.id)
IDCloudHost VPS eXtreme — 2 vCPU, 2 GB RAM, 20 GB NVMe
Estimasi: Rp 149.000 / bulan
```

| Domain | Service | Platform |
|--------|---------|----------|
| `coreasia.id` | Landing | Vercel (free) |
| `pantau.coreasia.id` | Pantau | VPS IDCloudHost |
| `lms.coreasia.id` | LMS | VPS IDCloudHost |

**Estimasi Biaya Bulanan:**

| Item | Biaya |
|------|-------|
| VPS IDCloudHost 2vCPU/2GB | Rp 149.000 |
| Vercel Hobby | Rp 0 |
| Domain `.id` | Rp 23.000 |
| Cloudflare CDN | Rp 0 |
| **TOTAL** | **Rp 172.000/bulan** |

**⚠️ Risiko:** 2 GB RAM agak ketat untuk 3 backend services (Pantau Go + Python + LMS Go) + 2 PostgreSQL + Redis + MinIO. Perlu tuning memory limits.

### Option C: Free Tier Stack (Budget Minimum)

```
Vercel Free → Landing + LMS Frontend + Pantau Frontend
Railway Free → Pantau Backend + LMS Backend
Neon Free → PostgreSQL (0.5 GB)
Upstash Free → Redis
Cloudflare R2 Free → Object Storage
```

**Biaya: Rp 0/bulan**

**⚠️ Batasan:**
- Railway: $5 credit habis cepat (Go + Python running 24/7)
- Neon: 0.5 GB storage, auto-sleep (cold start)
- Render: 30-60s cold start (user experience buruk)
- Tidak cocok untuk production bisnis serius

---

## 6. Scaling Roadmap — Kapan Harus Upgrade?

### IDCloudHost Path (Rekomendasi)

| Phase | Trigger | Spec | Harga/bln |
|-------|---------|------|-----------|
| **Phase 1** (Sekarang) | MVP, < 50 users | 2 vCPU, 4 GB, 40 GB NVMe | Rp 312.000 |
| **Phase 2** | 50-200 users, DB > 5 GB | 4 vCPU, 8 GB, 80 GB NVMe | Rp 600.000* |
| **Phase 3** | 200-500 users | 8 vCPU, 16 GB, 160 GB NVMe | Rp 1.200.000* |
| **Phase 4** | 500+ users | 2 VPS (split app/db) | Rp 1.500.000+ |
| **Phase 5** | 1000+ users | 3 VPS + managed DB | Rp 3.000.000+ |

### Indikator Kapan Harus Scale

| Sinyal | Aksi |
|--------|------|
| RAM > 80% sustained | Upgrade RAM |
| CPU > 70% sustained | Upgrade vCPU |
| DB response > 100ms avg | Optimasi query / upgrade storage |
| Storage > 75% | Tambah storage / pindah file ke R2 |
| Users > 200 concurrent | Pisahkan DB ke VPS terpisah |
| Users > 500 concurrent | Load balancer + multiple app servers |

---

## 7. Analisa Bisnis — Break Even

### Pantau (Data Aktual dari Admin Panel)

| Metrik | Nilai |
|--------|-------|
| Total Pengguna | 14 |
| Website Terdaftar | 10 |
| Langganan Aktif | 2 |
| MRR (Monthly Recurring Revenue) | Rp 1.998.000 |
| Churn Rate | 0.0% |

### Proyeksi P&L (dengan IDCloudHost VPS)

| | Sekarang | 50 Users | 200 Users | 500 Users |
|---|----------|----------|-----------|-----------|
| **MRR** | Rp 2.000.000 | Rp 10.000.000 | Rp 40.000.000 | Rp 100.000.000 |
| Server | Rp 312.000 | Rp 312.000 | Rp 600.000 | Rp 1.500.000 |
| Domain | Rp 23.000 | Rp 23.000 | Rp 23.000 | Rp 23.000 |
| Google API* | Rp 0 | Rp 0 | Rp 0 | Rp 0 |
| AI (Groq)* | Rp 0-50.000 | Rp 100.000 | Rp 500.000 | Rp 1.000.000 |
| Email (SMTP) | Rp 0 | Rp 50.000 | Rp 100.000 | Rp 200.000 |
| **Total Cost** | **Rp 385.000** | **Rp 485.000** | **Rp 1.223.000** | **Rp 2.723.000** |
| **Profit** | **Rp 1.615.000** | **Rp 9.515.000** | **Rp 38.777.000** | **Rp 97.277.000** |
| **Margin** | **81%** | **95%** | **97%** | **97%** |

> *Google Search Console & GA4 API gratis. Groq AI free tier cukup untuk awal.*

### IDCloudHost vs DigitalOcean — Total Cost Comparison

| Fase | IDCloudHost | DigitalOcean SGP | Selisih |
|------|-------------|------------------|---------|
| Phase 1 (4 GB RAM) | Rp 312.000 | Rp 384.000 | -Rp 72.000 (19% lebih murah) |
| Phase 2 (8 GB RAM) | Rp 600.000 | Rp 768.000 | -Rp 168.000 (22% lebih murah) |
| Phase 3 (16 GB RAM) | Rp 1.200.000 | Rp 1.536.000 | -Rp 336.000 (22% lebih murah) |
| **Total 1 Tahun (Phase 1)** | **Rp 3.744.000** | **Rp 4.608.000** | **-Rp 864.000** |

**IDCloudHost menang di:**
- Bandwidth unlimited (DO ada cap, overage $0.01/GB)
- Harga Rupiah stabil (DO tergantung kurs USD)
- Server Indonesia (latency ~5-15ms vs ~30-50ms SGP)
- Support Bahasa Indonesia

**DigitalOcean menang di:**
- Managed Database ($15/mo extra)
- Better uptime track record
- Lebih mudah scale horizontal
- Global CDN (Spaces CDN)

---

## 8. Rekomendasi Final

### ⭐ Pilihan Terbaik: IDCloudHost AMD eXtreme 2vCPU/4GB/40GB NVMe

**Alasan:**
1. **Hemat 22-35%** dibanding DigitalOcean
2. **Bandwidth unlimited** — penting untuk analytics dashboard yang pull data terus
3. **Cukup untuk semua 3 produk** (Landing + LMS + Pantau) dalam 1 VPS
4. **Margin bisnis > 80%** bahkan dari hari pertama
5. **Server Indonesia** — latency rendah, compliance UU PDP
6. **Scale mudah** — tinggal upgrade spec VPS saat user bertambah

### Langkah Implementasi

1. **Order VPS** — IDCloudHost AMD eXtreme 2vCPU/4GB/40GB NVMe (Rp 312.000/bln)
2. **Setup DNS** — Pindahkan nameserver ke Cloudflare
3. **Install Docker** — Docker Engine + Docker Compose
4. **Deploy** — docker-compose up untuk semua services
5. **SSL** — Certbot + Nginx reverse proxy
6. **Monitoring** — Setup health checks + uptime monitoring
7. **Backup** — Daily PostgreSQL dump + automated backup

---

## 9. Analisa Pricing Pantau vs Biaya Server

### Pricing Pantau Saat Ini

| Plan | Nama Display | Harga/bulan | Website | Retensi | Tim | AI/hari |
|------|-------------|-------------|---------|---------|-----|---------|
| Free | Starter | Rp 0 | 1 | 7 hari | 0 | 10 query |
| Pro | Professional | Rp 199.000 | 10 | 90 hari | 3 | 50 query |
| Business | Business | Rp 499.000 | 25 | 180 hari | 10 | 100 query |
| Enterprise | Enterprise | Rp 999.000 | 50 | 365 hari | 25 | 500 query |

### Biaya Per-User untuk Server (IDCloudHost)

| Jumlah Paid Users | Server/bulan | Biaya/user | MRR (min Pro) | Margin |
|-------------------|-------------|------------|---------------|--------|
| 2 (saat ini) | Rp 312.000 | Rp 156.000 | Rp 398.000 | 22% |
| 5 | Rp 312.000 | Rp 62.400 | Rp 995.000 | 69% |
| 10 | Rp 312.000 | Rp 31.200 | Rp 1.990.000 | 84% |
| 20 | Rp 312.000 | Rp 15.600 | Rp 3.980.000 | 92% |
| 50 | Rp 600.000 | Rp 12.000 | Rp 9.950.000 | 94% |

### Cost per Feature (Estimasi Resource)

| Feature | Resource Impact | Biaya Marginal/user |
|---------|----------------|---------------------|
| GSC API Fetch | Minimal (Google free tier) | ~Rp 0 |
| GA4 API Fetch | Minimal (Google free tier) | ~Rp 0 |
| PDF Report | CPU spike 2-5s, ~50MB RAM | ~Rp 500/report |
| AI Chat (Groq) | External API | Rp 100-500/query |
| PageSpeed Check | External API (Google) | ~Rp 0 |
| Data Storage | ~1MB/website/bulan | ~Rp 10/website/bulan |

### Rekomendasi Penyesuaian Pricing

**Pricing saat ini sudah sehat.** Dengan biaya server Rp 300.000/bulan, hanya butuh **2 user Pro** untuk break even. Beberapa catatan:

1. **Starter (Free)** — Biarkan tetap gratis. Biaya marginal per free user sangat kecil (~Rp 5.000/bulan). Fungsinya sebagai funnel konversi ke paid.

2. **Professional (Rp 199.000)** — Harga sweet spot. Lebih murah dari 1x ngopi/minggu. Ini plan yang harusnya paling banyak user.

3. **Business (Rp 499.000)** — Good untuk agency kecil. White-label jadi differentiator utama.

4. **Enterprise (Rp 999.000)** — Masih sangat kompetitif. Dengan 50 website × 365 hari retensi, ini murah dibanding tools sejenis (Semrush $129/mo, Ahrefs $99/mo).

### Unit Economics Summary

```
Break Even Point:  2 paid users (Pro plan)
Profitable:        3+ paid users
Target MRR:        Rp 5.000.000 (25 Pro users atau mix)
Server Cost @ target: Rp 312.000 (masih Phase 1)
Margin @ target:   94%
```

---

*Dokumen ini dibuat berdasarkan analisa langsung terhadap produk Pantau di localhost:8888, codebase CoreAsia, dan resource usage Docker containers pada 17 Maret 2026.*
