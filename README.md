# CoreAsia Teknologi

Mitra Teknologi Strategis dan Platform SaaS untuk Lembaga Pelatihan & Sertifikasi.

## Struktur Project

```
coreasia/
├── frontend/
│   └── landing/          # Landing page (Nuxt 4 + Tailwind CSS)
├── docs/
│   └── product/
│       └── lms.md        # Product plan platform SertifikasiPro
├── docker.sh             # Docker helper script (Linux/Mac)
├── docker.ps1            # Docker helper script (Windows)
└── README.md
```

## Produk

### Landing Page
Website company profile CoreAsia Teknologi.

- **Tech:** Nuxt 4, Tailwind CSS, Three.js, Bun
- **URL:** [coreasia.id](https://coreasia.id)

### SertifikasiPro *(Coming Soon)*
Platform SaaS sertifikasi & kompetensi online untuk LSP dan Pusat Pelatihan.

Lihat [Product Plan](docs/product/lms.md) untuk detail lengkap.

---

## Development

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Bun](https://bun.sh/) (opsional, untuk development tanpa Docker)

### Landing Page

```bash
cd frontend/landing

# Docker (recommended)
docker compose up --build -d        # Build & start
docker compose watch                # Start dengan auto-sync (hot-reload)

# Tanpa Docker
bun install
bun run dev
```

Akses di **http://localhost:3001** (Docker) atau **http://localhost:3000** (lokal).

### Docker Commands

| Command | Deskripsi |
|---|---|
| `docker compose up --build -d` | Build & jalankan container |
| `docker compose watch` | Jalankan dengan file auto-sync |
| `docker compose down` | Stop & hapus container |
| `docker compose logs -f` | Lihat log real-time |

### Production Build

```bash
cd frontend/landing
docker compose -f docker-compose.prod.yml up --build -d
```

Akses di **http://localhost:3000**.

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Nuxt 4, Vue 3, Tailwind CSS |
| Runtime | Bun 1.3.9 |
| Container | Docker, Docker Compose |
| Deployment | Docker multi-stage build |

## Kontribusi

1. Buat branch baru dari `master`
2. Commit perubahan
3. Push dan buat Pull Request

## Lisensi

Proprietary — CoreAsia Teknologi © 2026
