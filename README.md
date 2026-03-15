# CoreAsia Teknologi

Mitra Teknologi Strategis dan Platform SaaS untuk Lembaga Pelatihan & Sertifikasi.

## Struktur Project

```
coreasia/
├── backend/
│   └── lms/               # Backend API (Go + Fiber)
├── frontend/
│   ├── lms/               # LMS Dashboard (Nuxt 4 + Tailwind CSS)
│   └── landing/           # Landing Page (Nuxt 4 + Tailwind CSS)
├── docs/
│   └── product/
│       └── lms.md         # Product plan platform LMS
├── docker-compose.dev.yml # Docker Compose untuk development
└── README.md
```

## Produk

### Landing Page
Website company profile CoreAsia Teknologi.

- **Tech:** Nuxt 4, Tailwind CSS, Three.js, Bun
- **URL:** [coreasia.id](https://coreasia.id)

### LMS (Learning Management System)
Platform SaaS sertifikasi & kompetensi online untuk LSP dan Pusat Pelatihan.

- **Backend:** Go 1.24+, Fiber v3, PostgreSQL 17, MinIO
- **Frontend:** Nuxt 4, Vue 3, Tailwind CSS v4, Bun

Lihat [Product Plan](docs/product/lms.md) untuk detail lengkap.

---

## Development

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Bun](https://bun.sh/) (opsional, untuk development tanpa Docker)
- [Go 1.24+](https://go.dev/) (opsional, untuk backend tanpa Docker)

### Jalankan Semua Services (Docker)

Dari root project:

```bash
# Build & jalankan semua services
docker compose -f docker-compose.dev.yml up --build -d

# Lihat status container
docker compose -f docker-compose.dev.yml ps

# Lihat logs real-time
docker compose -f docker-compose.dev.yml logs -f

# Stop semua
docker compose -f docker-compose.dev.yml down
```

### Akses URL

| Service | URL | Keterangan |
|---------|-----|------------|
| Frontend LMS | http://localhost:3002 | Dashboard LMS (Nuxt dev server) |
| Backend API | http://localhost:8083/api | REST API (Go Fiber) |
| MinIO Console | http://localhost:9003 | Object storage admin panel |
| PostgreSQL | `localhost:5433` | Database (via psql/pgAdmin) |

### Credentials

| Service | Username | Password |
|---------|----------|----------|
| MinIO Console | `minioadmin` | `minioadmin` |
| PostgreSQL | `coreasia` | `coreasia_secret` |

> **Database:** `coreasia_lms`

### Port Mapping

| Service | Internal Port | Host Port |
|---------|--------------|-----------|
| Backend API | 8080 | 8083 |
| Frontend LMS | 3000 | 3002 |
| Frontend HMR | 24678 | 24678 |
| PostgreSQL | 5432 | 5433 |
| MinIO API | 9000 | 9002 |
| MinIO Console | 9001 | 9003 |

### Docker Commands

| Command | Deskripsi |
|---------|-----------|
| `docker compose -f docker-compose.dev.yml up --build -d` | Build & jalankan semua |
| `docker compose -f docker-compose.dev.yml logs -f api` | Log backend saja |
| `docker compose -f docker-compose.dev.yml logs -f frontend` | Log frontend saja |
| `docker compose -f docker-compose.dev.yml down` | Stop & hapus semua container |
| `docker compose -f docker-compose.dev.yml restart api` | Restart backend saja |

### Landing Page (Terpisah)

```bash
cd frontend/landing

# Docker
docker compose up --build -d

# Tanpa Docker
bun install
bun run dev
```

Akses di **http://localhost:3001** (Docker) atau **http://localhost:3000** (lokal).

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Nuxt 4, Vue 3, Tailwind CSS v4 |
| Backend | Go 1.24+, Fiber v3 |
| Database | PostgreSQL 17 |
| Object Storage | MinIO |
| Runtime | Bun 1.3, Air (Go hot-reload) |
| Container | Docker, Docker Compose |

## Kontribusi

1. Buat branch baru dari `master`
2. Commit perubahan
3. Push dan buat Pull Request

## Lisensi

Proprietary — CoreAsia Teknologi © 2026
