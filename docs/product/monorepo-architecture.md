# CoreAsia Monorepo Microservices Architecture

> Design v1.0 — 27 Februari 2026

---

## 1. OVERVIEW

```
                    ┌──────────────────────────────────┐
                    │          LOAD BALANCER            │
                    │   (Nginx / Cloudflare / Traefik)  │
                    └────────┬──────────┬───────────────┘
                             │          │
              ┌──────────────┴──┐  ┌────┴──────────────┐
              │  coreasia.id    │  │  app.coreasia.id   │
              │  (Landing)      │  │  (LMS SaaS)        │
              │  Nuxt SSR       │  │  Nuxt SSR          │
              │  Port 3000      │  │  Port 3001         │
              └────────┬────────┘  └────────┬───────────┘
                       │                    │
              ┌────────┴────────┐  ┌────────┴───────────┐
              │  Gateway API    │  │  LMS API            │
              │  (Onboarding,   │  │  (Tenant-scoped,    │
              │   Payment,      │  │   semua fitur LMS)  │
              │   Public)       │  │                     │
              │  Port 8081      │  │  Port 8080          │
              └────────┬────────┘  └────────┬───────────┘
                       │                    │
                       └────────┬───────────┘
                                │
                    ┌───────────┴───────────┐
                    │     PostgreSQL        │
                    │  ┌─────────────────┐  │
                    │  │ public schema   │  │
                    │  │ (tenants, plans,│  │
                    │  │  registrations) │  │
                    │  ├─────────────────┤  │
                    │  │ tenant_xxx      │  │
                    │  │ (users, exams,  │  │
                    │  │  certificates)  │  │
                    │  └─────────────────┘  │
                    └───────────────────────┘
```

---

## 2. MONOREPO STRUCTURE

```
coreasia/
│
├── frontend/
│   ├── landing/                 # Marketing site + onboarding UI
│   │   ├── app/
│   │   │   ├── pages/
│   │   │   │   ├── index.vue         # Homepage
│   │   │   │   ├── about.vue
│   │   │   │   ├── contact.vue
│   │   │   │   ├── pricing.vue       # ← NEW: Plan comparison
│   │   │   │   ├── register.vue      # ← NEW: Org registration
│   │   │   │   └── solutions/
│   │   │   ├── components/
│   │   │   └── composables/
│   │   ├── nuxt.config.ts            # apiBase → gateway:8081
│   │   └── package.json
│   │
│   └── lms/                    # SaaS LMS application
│       ├── app/
│       │   ├── pages/
│       │   ├── components/
│       │   ├── composables/
│       │   ├── adapters/
│       │   ├── services/
│       │   └── stores/
│       ├── nuxt.config.ts            # apiBase → lms-api:8080
│       └── package.json
│
├── backend/
│   ├── gateway/                # ← NEW: Public-facing API
│   │   ├── cmd/
│   │   │   └── server/
│   │   │       └── main.go
│   │   ├── internal/
│   │   │   ├── handler/             # HTTP handlers
│   │   │   │   ├── onboarding.go    # Register, webhook, slug check
│   │   │   │   ├── plans.go         # List subscription plans
│   │   │   │   └── health.go
│   │   │   ├── service/             # Business logic
│   │   │   │   ├── registration.go  # Orchestrates provisioning
│   │   │   │   └── payment.go       # Xendit integration
│   │   │   └── config/
│   │   │       └── config.go
│   │   ├── configs/
│   │   │   └── config.yaml
│   │   ├── deployments/
│   │   │   ├── Dockerfile
│   │   │   └── Dockerfile.dev
│   │   ├── go.mod
│   │   └── Makefile
│   │
│   └── lms/                    # Existing tenant-scoped API
│       ├── cmd/
│       ├── internal/
│       ├── migrations/
│       ├── configs/
│       ├── deployments/
│       ├── go.mod
│       └── Makefile
│
├── libs/                       # ← NEW: Shared Go packages
│   ├── database/               # PostgreSQL connection + migrations
│   │   ├── postgres.go
│   │   ├── migrator.go
│   │   └── provisioner.go
│   ├── auth/                   # JWT provider + middleware
│   │   ├── jwt.go
│   │   └── middleware.go
│   ├── httputil/               # Response envelope, error handler
│   │   ├── response.go
│   │   └── errors.go
│   ├── config/                 # YAML config loader
│   │   └── loader.go
│   └── go.mod                  # Shared module
│
├── migrations/                 # ← MOVED: Centralized migrations
│   ├── global/                 # public schema (tenants, plans, registrations)
│   │   ├── 000001_create_tenants_table.up.sql
│   │   ├── 000002_create_subscription_plans.up.sql
│   │   └── 000003_create_tenant_registrations.up.sql  ← NEW
│   └── tenant/                 # per-tenant schema
│       ├── 000001_create_users_table.up.sql
│       ├── 000002_create_schemes_table.up.sql
│       └── ...
│
├── deployments/                # ← NEW: Root-level orchestration
│   ├── docker-compose.yml      # Full stack (gateway + lms + pg + minio)
│   ├── docker-compose.dev.yml  # Dev overrides
│   └── nginx/
│       └── nginx.conf          # Subdomain routing
│
├── docs/
│   └── product/
│
├── .agent/
│   └── rules/
│
├── .gitignore
└── README.md
```

---

## 3. SERVICE BOUNDARIES

### Gateway Service (`backend/gateway/` — Port 8081)

**Responsibility:** Everything yang TIDAK butuh tenant context.

| Endpoint | Method | Auth | Deskripsi |
|----------|--------|------|-----------|
| `/health` | GET | - | Health check |
| `/api/plans` | GET | - | List subscription plans |
| `/api/onboarding/check-slug` | GET | - | Cek ketersediaan slug |
| `/api/onboarding/register` | POST | - | Daftar organisasi baru |
| `/api/onboarding/status/:id` | GET | - | Cek status provisioning |
| `/api/onboarding/webhook` | POST | Xendit token | Payment callback |
| `/api/verify/:certNumber` | GET | - | Public certificate verification |

**Database access:** `public` schema only (tenants, subscription_plans, tenant_registrations).
**External:** Xendit API, email service (SMTP/Resend).

### LMS Service (`backend/lms/` — Port 8080)

**Responsibility:** Semua operasi DALAM tenant (butuh X-Tenant-ID).

Tidak berubah dari yang sudah ada. Semua endpoint existing tetap di sini.

### Komunikasi Antar Service

```
Gateway → PostgreSQL (public schema)
  ├─ Read: plans, tenants
  ├─ Write: tenants, registrations
  └─ Provision: CREATE SCHEMA + run tenant migrations

LMS API → PostgreSQL (tenant schema)
  ├─ Read/Write: users, schemes, exams, certificates, etc.
  └─ Context: X-Tenant-ID header → schema resolution

Gateway ──webhook──→ Provision tenant schema
                     └──→ LMS API can now serve that tenant
```

Tidak perlu message queue untuk sekarang. Gateway langsung provision schema via shared database. Nanti bisa evolve ke event-driven kalau sudah ratusan tenant.

---

## 4. SHARED LIBRARIES (`libs/`)

### Phase 1 (Sekarang) — Minimal Extraction

Gateway dan LMS share database connection. Daripada copy-paste, extract ke `libs/`:

```go
// libs/database/postgres.go
package database

type DB struct {
    Pool *pgxpool.Pool
}

func Connect(cfg DatabaseConfig) (*DB, error) { ... }

// libs/database/provisioner.go
func (p *Provisioner) Provision(ctx context.Context, schemaName string) error { ... }
func (p *Provisioner) ListTenantSchemas(ctx context.Context) ([]string, error) { ... }
```

### Phase 2 (Nanti) — Full Extraction

```
libs/
├── database/     ✓ Phase 1
├── auth/         ✓ Phase 2 (JWT shared between gateway & lms)
├── httputil/     ✓ Phase 2 (response envelope)
└── config/       ✓ Phase 2 (YAML loader)
```

**Go workspace** (`go.work`) untuk link semua modules:

```
// go.work (root)
go 1.25

use (
    ./backend/gateway
    ./backend/lms
    ./libs
)
```

---

## 5. SUBDOMAIN ROUTING

```
┌─────────────────────────────────────────────────┐
│                   Nginx / Traefik                │
├─────────────────────────────────────────────────┤
│                                                  │
│  coreasia.id          →  landing:3000            │
│  www.coreasia.id      →  landing:3000            │
│                                                  │
│  app.coreasia.id      →  lms:3001               │
│  {slug}.coreasia.id   →  lms:3001               │
│    (auto-set X-Tenant-ID header from subdomain)  │
│                                                  │
│  api.coreasia.id      →  gateway:8081            │
│    /api/plans, /api/onboarding/*, /api/verify/*  │
│                                                  │
│  api.coreasia.id/v1   →  lms-api:8080            │
│    /api/* (tenant-scoped, requires X-Tenant-ID)  │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Atau lebih sederhana (tanpa nginx, path-based):**
- Landing calls `https://api.coreasia.id/gateway/*` → gateway:8081
- LMS calls `https://api.coreasia.id/v1/*` → lms:8080

---

## 6. DOCKER COMPOSE (Full Stack)

```yaml
# deployments/docker-compose.yml
services:
  # --- Frontends ---
  landing:
    build: ../../frontend/landing
    ports: ["3000:3000"]
    environment:
      NUXT_PUBLIC_GATEWAY_URL: http://gateway:8081/api

  lms:
    build: ../../frontend/lms
    ports: ["3001:3001"]
    environment:
      NUXT_PUBLIC_API_BASE: http://lms-api:8080/api

  # --- Backends ---
  gateway:
    build: ../../backend/gateway
    ports: ["8081:8081"]
    environment:
      DB_HOST: postgres
      XENDIT_API_KEY: ${XENDIT_API_KEY}
    depends_on:
      postgres: { condition: service_healthy }

  lms-api:
    build: ../../backend/lms
    ports: ["8080:8080"]
    environment:
      DB_HOST: postgres
    depends_on:
      postgres: { condition: service_healthy }

  # --- Infrastructure ---
  postgres:
    image: postgres:17-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: coreasia_lms
      POSTGRES_USER: coreasia
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U coreasia"]
      interval: 5s

  minio:
    image: minio/minio:latest
    ports: ["9000:9000", "9001:9001"]
    command: server /data --console-address :9001
    volumes:
      - miniodata:/data

volumes:
  pgdata:
  miniodata:
```

---

## 7. EVOLUTION PATH

```
Phase 0 (Current):   Monolith
   backend/lms/ handles everything
   ↓
Phase 1 (Now):       2 Services
   backend/gateway/  — onboarding, payment, public
   backend/lms/      — tenant-scoped LMS
   ↓
Phase 2 (50+ tenants): 3-4 Services
   + notification-service (WhatsApp, email)
   + report-service (async export, BNSP)
   ↓
Phase 3 (200+ tenants): Full Microservices
   + auth-service (centralized SSO)
   + certificate-service
   + event bus (NATS/Kafka)
   + CQRS for reporting
```

Sekarang kita di Phase 1 — cukup 2 backend services.
