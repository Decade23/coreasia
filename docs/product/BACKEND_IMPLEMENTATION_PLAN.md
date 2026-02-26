# CoreAsia LMS — Backend Implementation Plan

> **Module:** `backend/lms`
> **Date:** 27 Februari 2026
> **Author:** Architecture Team
> **Status:** Planning

---

## 1. Executive Summary

Backend API service untuk CoreAsia LMS Platform — sistem sertifikasi profesi multi-tenant.
Frontend (Nuxt 4 + Vue 3 + TypeScript) sudah **99% selesai** dengan 40 mock API routes.
Backend ini menggantikan seluruh mock tersebut dengan production-grade Go service.

**Key Goals:**
- Kompatibel 100% dengan frontend DTO contracts (snake_case JSON)
- Multi-tenant schema-per-tenant (PostgreSQL)
- RBAC 5 roles (super_admin, admin, quality_manager, assessor, assessee)
- Clean Architecture + DDD principles
- Docker-ready, CI/CD compatible

---

## 2. Tech Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| **Language** | Go | 1.24+ | Performance, concurrency, strong typing |
| **HTTP Framework** | Fiber v3 | v3.x | Express-inspired, fastest Go framework, built on fasthttp |
| **PostgreSQL Driver** | pgx v5 | v5.x | Pure Go, high-performance, native pgx features |
| **SQL Codegen** | sqlc | v1.27+ | Type-safe SQL → Go code generation, zero runtime overhead |
| **Migrations** | golang-migrate | v4.x | Battle-tested, supports multi-schema |
| **JWT** | golang-jwt/jwt | v5 | Industry standard, Fiber contrib integration |
| **Validation** | go-playground/validator | v10 | Struct tag validation, custom rules |
| **Config** | cleanenv | v1.5+ | Clean env/yaml config binding to structs |
| **Logging** | slog (stdlib) | 1.21+ | Structured logging, stdlib — no external dep |
| **Testing** | testify + testcontainers | Latest | Assertions + real DB in tests |
| **Password Hash** | bcrypt (golang.org/x/crypto) | Latest | Industry standard password hashing |
| **UUID** | google/uuid | v1.6+ | UUID v7 (time-ordered) for primary keys |
| **File Storage** | MinIO SDK | Latest | S3-compatible object storage |
| **Docker** | Multi-stage | Latest | Minimal production image (~15MB) |
| **Database** | PostgreSQL | 16+ | Multi-schema, RLS, JSONB, full-text search |

---

## 3. Architecture

### 3.1 Clean Architecture Layers

```
┌──────────────────────────────────────────────────────┐
│                 Interfaces Layer                      │
│     (HTTP Handlers, Middleware, Request/Response)     │
├──────────────────────────────────────────────────────┤
│                Application Layer                      │
│        (Use Cases, DTOs, Command/Query)              │
├──────────────────────────────────────────────────────┤
│                  Domain Layer                         │
│   (Entities, Value Objects, Repository Interfaces,   │
│    Domain Services, Domain Events)                   │
├──────────────────────────────────────────────────────┤
│              Infrastructure Layer                     │
│   (PostgreSQL Repos, MinIO Storage, Email/WA,        │
│    JWT Provider, Tenant Resolver)                    │
└──────────────────────────────────────────────────────┘
```

**Dependency Rule:** Dependencies point INWARD only.
Domain Layer has ZERO external dependencies.

### 3.2 Multi-Tenant Architecture

```
PostgreSQL Server
│
├── database: coreasia_lms
│   │
│   ├── schema: public              # Platform-level (shared)
│   │   ├── tenants                 # Tenant registry
│   │   ├── tenant_configs          # Per-tenant settings
│   │   ├── subscription_plans      # Pricing tiers
│   │   └── schema_migrations       # Global migration tracking
│   │
│   ├── schema: _template           # Template (cloned for new tenants)
│   │   ├── users
│   │   ├── schemes
│   │   ├── unit_competencies
│   │   ├── competency_elements
│   │   ├── performance_criteria
│   │   ├── questions
│   │   ├── question_options
│   │   ├── schedules
│   │   ├── schedule_assessors
│   │   ├── assessor_profiles
│   │   ├── assessor_schemes
│   │   ├── registrations
│   │   ├── registration_documents
│   │   ├── verifications
│   │   ├── exams
│   │   ├── exam_answers
│   │   ├── assessments
│   │   ├── assessment_results
│   │   ├── quality_reviews
│   │   ├── certificates
│   │   ├── certificate_templates
│   │   ├── certificate_template_fields
│   │   ├── notifications
│   │   ├── audit_logs
│   │   └── tenant_settings
│   │
│   ├── schema: tenant_coreasia     # Tenant: CoreAsia (clone of _template)
│   ├── schema: tenant_lsp_info     # Tenant: LSP Informatika
│   └── schema: tenant_afra_trn     # Tenant: Afra Training
```

**Tenant Resolution Flow:**
```
Request → Extract tenant from subdomain/header
       → Middleware sets search_path via pgx BeforeAcquire
       → All queries automatically scoped to tenant schema
       → Response
```

### 3.3 Request Flow

```
HTTP Request
  │
  ├── [1] CORS Middleware
  ├── [2] Request ID Middleware (X-Request-Id)
  ├── [3] Logger Middleware (slog)
  ├── [4] Tenant Resolver Middleware (set search_path)
  ├── [5] JWT Auth Middleware (extract claims)
  ├── [6] RBAC Middleware (check role permissions)
  │
  ▼
Handler (Interfaces Layer)
  → Parse & validate request body
  → Call Use Case (Application Layer)
    → Execute domain logic (Domain Layer)
    → Persist via Repository (Infrastructure Layer)
  → Return DTO response
```

---

## 4. Project Structure

```
backend/lms/
├── cmd/
│   └── server/
│       └── main.go                  # Bootstrap, DI wiring, server start
│
├── internal/
│   ├── domain/                      # Domain Layer (ZERO external deps)
│   │   ├── entity/
│   │   │   ├── user.go
│   │   │   ├── scheme.go
│   │   │   ├── unit_competency.go
│   │   │   ├── question.go
│   │   │   ├── schedule.go
│   │   │   ├── assessor.go
│   │   │   ├── verification.go
│   │   │   ├── exam.go
│   │   │   ├── assessment.go
│   │   │   ├── quality_review.go
│   │   │   ├── certificate.go
│   │   │   ├── certificate_template.go
│   │   │   ├── notification.go
│   │   │   ├── audit_log.go
│   │   │   └── tenant.go
│   │   ├── valueobject/
│   │   │   ├── role.go              # Role enum: super_admin, admin, ...
│   │   │   ├── verification_status.go
│   │   │   ├── exam_status.go
│   │   │   ├── certificate_status.go
│   │   │   ├── question_type.go
│   │   │   ├── schedule_type.go
│   │   │   ├── email.go             # Email value object with validation
│   │   │   └── pagination.go        # Page, PerPage, Total
│   │   ├── repository/              # Interfaces ONLY
│   │   │   ├── user_repository.go
│   │   │   ├── scheme_repository.go
│   │   │   ├── question_repository.go
│   │   │   ├── schedule_repository.go
│   │   │   ├── assessor_repository.go
│   │   │   ├── verification_repository.go
│   │   │   ├── exam_repository.go
│   │   │   ├── assessment_repository.go
│   │   │   ├── quality_repository.go
│   │   │   ├── certificate_repository.go
│   │   │   ├── certificate_template_repository.go
│   │   │   ├── notification_repository.go
│   │   │   ├── audit_log_repository.go
│   │   │   └── tenant_repository.go
│   │   └── service/                 # Domain services (complex business rules)
│   │       ├── certification_flow.go
│   │       ├── exam_scoring.go
│   │       └── certificate_generator.go
│   │
│   ├── application/                 # Application Layer (Use Cases)
│   │   ├── dto/
│   │   │   ├── auth_dto.go          # LoginRequest, LoginResponse
│   │   │   ├── scheme_dto.go        # CreateSchemeRequest, SchemeResponse
│   │   │   ├── question_dto.go
│   │   │   ├── schedule_dto.go
│   │   │   ├── assessor_dto.go
│   │   │   ├── verification_dto.go
│   │   │   ├── exam_dto.go
│   │   │   ├── quality_dto.go
│   │   │   ├── certificate_dto.go
│   │   │   ├── report_dto.go
│   │   │   ├── tenant_dto.go
│   │   │   └── common.go            # PaginatedResponse, ErrorResponse
│   │   └── usecase/
│   │       ├── auth_usecase.go
│   │       ├── scheme_usecase.go
│   │       ├── question_usecase.go
│   │       ├── schedule_usecase.go
│   │       ├── assessor_usecase.go
│   │       ├── verification_usecase.go
│   │       ├── exam_usecase.go
│   │       ├── assessment_usecase.go
│   │       ├── quality_usecase.go
│   │       ├── certificate_usecase.go
│   │       ├── report_usecase.go
│   │       ├── notification_usecase.go
│   │       └── tenant_usecase.go
│   │
│   ├── infrastructure/              # Infrastructure Layer
│   │   ├── persistence/
│   │   │   ├── postgres/
│   │   │   │   ├── connection.go    # pgx pool + tenant schema switching
│   │   │   │   ├── migrator.go      # Multi-tenant migration runner
│   │   │   │   └── tenant_provisioner.go # Clone _template for new tenant
│   │   │   ├── sqlc/                # Generated by sqlc
│   │   │   │   ├── db.go
│   │   │   │   ├── models.go
│   │   │   │   ├── querier.go
│   │   │   │   └── *.sql.go         # Generated query implementations
│   │   │   └── repository/          # Repository implementations
│   │   │       ├── user_repo.go
│   │   │       ├── scheme_repo.go
│   │   │       ├── question_repo.go
│   │   │       ├── schedule_repo.go
│   │   │       ├── assessor_repo.go
│   │   │       ├── verification_repo.go
│   │   │       ├── exam_repo.go
│   │   │       ├── assessment_repo.go
│   │   │       ├── quality_repo.go
│   │   │       ├── certificate_repo.go
│   │   │       ├── certificate_template_repo.go
│   │   │       ├── notification_repo.go
│   │   │       ├── audit_log_repo.go
│   │   │       └── tenant_repo.go
│   │   ├── storage/
│   │   │   └── minio_storage.go     # File upload/download (S3-compatible)
│   │   ├── auth/
│   │   │   └── jwt_provider.go      # JWT generation, validation, refresh
│   │   └── external/
│   │       ├── email_sender.go      # Email via SMTP/API
│   │       └── whatsapp_sender.go   # WhatsApp notification
│   │
│   └── interfaces/                  # Presentation Layer
│       └── http/
│           ├── server.go            # Fiber app setup, route registration
│           ├── middleware/
│           │   ├── auth.go          # JWT extraction + validation
│           │   ├── rbac.go          # Role-based access control
│           │   ├── tenant.go        # Tenant resolution + search_path
│           │   ├── request_id.go    # X-Request-Id correlation
│           │   ├── logger.go        # Request/response logging
│           │   ├── cors.go          # CORS configuration
│           │   └── error_handler.go # Global error handler
│           ├── handler/
│           │   ├── auth_handler.go
│           │   ├── scheme_handler.go
│           │   ├── question_handler.go
│           │   ├── schedule_handler.go
│           │   ├── assessor_handler.go
│           │   ├── verification_handler.go
│           │   ├── exam_handler.go
│           │   ├── quality_handler.go
│           │   ├── certificate_handler.go
│           │   ├── report_handler.go
│           │   ├── tenant_handler.go
│           │   ├── upload_handler.go
│           │   └── health_handler.go
│           └── response/
│               └── response.go      # Standard JSON envelope
│
├── pkg/                             # Public/shared utilities
│   ├── apperr/                      # Application error types
│   │   └── errors.go
│   ├── validate/                    # Validation helpers
│   │   └── validator.go
│   └── convert/                     # Type conversion utils
│       └── convert.go
│
├── migrations/
│   ├── global/                      # Applied to public schema ONCE
│   │   ├── 000001_create_tenants_table.up.sql
│   │   ├── 000001_create_tenants_table.down.sql
│   │   ├── 000002_create_subscription_plans.up.sql
│   │   └── 000002_create_subscription_plans.down.sql
│   ├── tenant/                      # Applied to EACH tenant schema
│   │   ├── 000001_create_users_table.up.sql
│   │   ├── 000001_create_users_table.down.sql
│   │   ├── 000002_create_schemes_table.up.sql
│   │   ├── 000002_create_schemes_table.down.sql
│   │   ├── ... (per entity)
│   │   └── seed/
│   │       ├── 001_default_admin.sql
│   │       └── 002_sample_scheme.sql
│   └── _template/
│       └── 000001_init_template.up.sql
│
├── sqlc/
│   ├── sqlc.yaml                    # sqlc configuration
│   └── queries/                     # SQL query definitions
│       ├── users.sql
│       ├── schemes.sql
│       ├── questions.sql
│       ├── schedules.sql
│       ├── assessors.sql
│       ├── verifications.sql
│       ├── exams.sql
│       ├── assessments.sql
│       ├── quality.sql
│       ├── certificates.sql
│       ├── reports.sql
│       ├── tenants.sql
│       └── audit_logs.sql
│
├── configs/
│   ├── config.yaml                  # Default configuration
│   └── config.example.yaml          # Template for developers
│
├── deployments/
│   ├── Dockerfile                   # Multi-stage production build
│   ├── Dockerfile.dev               # Development with hot-reload
│   ├── docker-compose.yml           # Full stack: api + postgres + minio + redis
│   └── .env.example                 # Environment variables template
│
├── api/
│   └── openapi.yaml                 # OpenAPI 3.1 spec (auto-generated)
│
├── go.mod
├── go.sum
├── Makefile                         # Common commands
└── README.md
```

---

## 5. Database Schema Design

### 5.1 Public Schema (Platform-level)

```sql
-- public.tenants
CREATE TABLE tenants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(200) NOT NULL,
    slug        VARCHAR(50) NOT NULL UNIQUE,
    schema_name VARCHAR(63) NOT NULL UNIQUE,
    domain      VARCHAR(200),
    is_active   BOOLEAN NOT NULL DEFAULT true,
    plan_id     UUID REFERENCES subscription_plans(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- public.subscription_plans
CREATE TABLE subscription_plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    max_assessees   INT NOT NULL DEFAULT 100,
    max_schemes     INT NOT NULL DEFAULT 5,
    features        JSONB NOT NULL DEFAULT '{}',
    price_monthly   DECIMAL(12,2) NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 5.2 Tenant Schema (Per-tenant — from _template)

```sql
-- Users & Auth
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(200) NOT NULL,
    phone_number    VARCHAR(20),
    role            VARCHAR(20) NOT NULL CHECK (role IN (
                        'super_admin', 'admin', 'quality_manager', 'assessor', 'assessee'
                    )),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Competency Schemes
CREATE TABLE schemes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(50) NOT NULL UNIQUE,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    validity_years  INT NOT NULL DEFAULT 3,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE unit_competencies (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_id   UUID NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
    code        VARCHAR(50) NOT NULL,
    title       VARCHAR(300) NOT NULL,
    sort_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE competency_elements (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES unit_competencies(id) ON DELETE CASCADE,
    title   VARCHAR(500) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE performance_criteria (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    element_id  UUID NOT NULL REFERENCES competency_elements(id) ON DELETE CASCADE,
    text        TEXT NOT NULL,
    sort_order  INT NOT NULL DEFAULT 0
);

-- Question Bank
CREATE TABLE questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_id       UUID NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
    question_type   VARCHAR(20) NOT NULL CHECK (question_type IN (
                        'multiple_choice', 'essay', 'upload', 'observation'
                    )),
    question_text   TEXT NOT NULL,
    difficulty      VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    points          INT NOT NULL DEFAULT 1,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    rubric          TEXT,
    instructions    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE question_options (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    text        TEXT NOT NULL,
    is_correct  BOOLEAN NOT NULL DEFAULT false,
    sort_order  INT NOT NULL DEFAULT 0
);

-- Scheduling
CREATE TABLE schedules (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title               VARCHAR(200) NOT NULL,
    scheme_id           UUID NOT NULL REFERENCES schemes(id),
    schedule_type       VARCHAR(20) NOT NULL CHECK (schedule_type IN (
                            'cbt_online', 'lab_offline', 'hybrid'
                        )),
    status              VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN (
                            'draft', 'published', 'ongoing', 'completed', 'cancelled'
                        )),
    start_date          TIMESTAMPTZ NOT NULL,
    end_date            TIMESTAMPTZ NOT NULL,
    location            VARCHAR(300),
    max_participants    INT NOT NULL DEFAULT 30,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_date > start_date)
);

CREATE TABLE schedule_assessors (
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    assessor_id UUID NOT NULL REFERENCES users(id),
    PRIMARY KEY (schedule_id, assessor_id)
);

-- Assessor Profiles
CREATE TABLE assessor_profiles (
    user_id         UUID PRIMARY KEY REFERENCES users(id),
    specialization  VARCHAR(200),
    license_number  VARCHAR(100),
    license_issued_by VARCHAR(200),
    license_issued_at TIMESTAMPTZ,
    license_expiry_at TIMESTAMPTZ,
    license_status  VARCHAR(20) DEFAULT 'active' CHECK (license_status IN (
                        'active', 'expired', 'pending_renewal'
                    ))
);

CREATE TABLE assessor_schemes (
    assessor_id UUID NOT NULL REFERENCES users(id),
    scheme_id   UUID NOT NULL REFERENCES schemes(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (assessor_id, scheme_id)
);

-- Registration & Verification
CREATE TABLE verifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessee_id     UUID NOT NULL REFERENCES users(id),
    scheme_id       UUID NOT NULL REFERENCES schemes(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
                        'DRAFT', 'SUBMITTED', 'UNDER_REVIEW',
                        'REVISION_NEEDED', 'VERIFIED', 'REJECTED'
                    )),
    personal_data   JSONB NOT NULL DEFAULT '{}',
    review_notes    TEXT,
    reviewed_by     UUID REFERENCES users(id),
    submitted_at    TIMESTAMPTZ,
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE verification_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id UUID NOT NULL REFERENCES verifications(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    document_type   VARCHAR(50) NOT NULL,
    file_url        VARCHAR(500) NOT NULL,
    file_size       BIGINT NOT NULL DEFAULT 0,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Exams & CBT
CREATE TABLE exams (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessee_id     UUID NOT NULL REFERENCES users(id),
    schedule_id     UUID NOT NULL REFERENCES schedules(id),
    scheme_id       UUID NOT NULL REFERENCES schemes(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
                        'pending', 'in_progress', 'submitted', 'graded'
                    )),
    started_at      TIMESTAMPTZ,
    submitted_at    TIMESTAMPTZ,
    score           DECIMAL(5,2),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE exam_answers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id     UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id),
    answer_text TEXT,
    selected_option_id UUID REFERENCES question_options(id),
    file_url    VARCHAR(500),
    points_awarded DECIMAL(5,2),
    graded_by   UUID REFERENCES users(id),
    graded_at   TIMESTAMPTZ
);

-- Assessment (Assessor KUK Evaluation)
CREATE TABLE assessments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessee_id     UUID NOT NULL REFERENCES users(id),
    assessor_id     UUID NOT NULL REFERENCES users(id),
    scheme_id       UUID NOT NULL REFERENCES schemes(id),
    schedule_id     UUID REFERENCES schedules(id),
    recommendation  VARCHAR(20) CHECK (recommendation IN ('competent', 'not_competent')),
    assessor_notes  TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
                        'pending', 'in_progress', 'submitted'
                    )),
    submitted_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE assessment_results (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id   UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    criteria_id     UUID NOT NULL REFERENCES performance_criteria(id),
    status          VARCHAR(5) NOT NULL CHECK (status IN ('K', 'BK')),
    evidence_id     UUID
);

-- Quality Review
CREATE TABLE quality_reviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id   UUID NOT NULL REFERENCES assessments(id),
    assessee_id     UUID NOT NULL REFERENCES users(id),
    assessor_id     UUID NOT NULL REFERENCES users(id),
    scheme_id       UUID NOT NULL REFERENCES schemes(id),
    recommendation  VARCHAR(20) NOT NULL,
    assessor_notes  TEXT,
    manager_notes   TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending_review' CHECK (status IN (
                        'pending_review', 'approved', 'rejected', 'revision_needed'
                    )),
    reviewed_by     UUID REFERENCES users(id),
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at     TIMESTAMPTZ
);

-- Certificates
CREATE TABLE certificate_templates (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    scheme_id   UUID REFERENCES schemes(id),
    thumbnail_url VARCHAR(500),
    is_default  BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE certificate_template_fields (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES certificate_templates(id) ON DELETE CASCADE,
    field_key   VARCHAR(50) NOT NULL,
    label       VARCHAR(100) NOT NULL,
    field_type  VARCHAR(20) NOT NULL CHECK (field_type IN ('text', 'date', 'image', 'qr_code')),
    position_x  DECIMAL(6,2) NOT NULL DEFAULT 0,
    position_y  DECIMAL(6,2) NOT NULL DEFAULT 0,
    font_size   INT NOT NULL DEFAULT 12,
    sort_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE certificates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_number  VARCHAR(100) NOT NULL UNIQUE,
    assessee_id         UUID NOT NULL REFERENCES users(id),
    scheme_id           UUID NOT NULL REFERENCES schemes(id),
    template_id         UUID REFERENCES certificate_templates(id),
    assessor_id         UUID REFERENCES users(id),
    status              VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN (
                            'active', 'expired', 'revoked'
                        )),
    issued_date         DATE NOT NULL,
    expiry_date         DATE NOT NULL,
    download_url        VARCHAR(500),
    qr_code_data        VARCHAR(500),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tenant Settings
CREATE TABLE tenant_settings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key     VARCHAR(100) NOT NULL UNIQUE,
    setting_value   JSONB NOT NULL DEFAULT '{}',
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id),
    title       VARCHAR(200) NOT NULL,
    message     TEXT NOT NULL,
    type        VARCHAR(20) NOT NULL DEFAULT 'info',
    is_read     BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit Trail
CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id),
    user_name   VARCHAR(200),
    user_role   VARCHAR(20),
    action      VARCHAR(20) NOT NULL,
    resource    VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    description TEXT,
    ip_address  VARCHAR(45),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes (critical for performance)
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_schemes_code ON schemes(code);
CREATE INDEX idx_questions_scheme ON questions(scheme_id);
CREATE INDEX idx_questions_type ON questions(question_type);
CREATE INDEX idx_schedules_scheme ON schedules(scheme_id);
CREATE INDEX idx_schedules_status ON schedules(status);
CREATE INDEX idx_verifications_assessee ON verifications(assessee_id);
CREATE INDEX idx_verifications_status ON verifications(status);
CREATE INDEX idx_exams_assessee ON exams(assessee_id);
CREATE INDEX idx_certificates_assessee ON certificates(assessee_id);
CREATE INDEX idx_certificates_number ON certificates(certificate_number);
CREATE INDEX idx_quality_reviews_status ON quality_reviews(status);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
```

---

## 6. API Endpoints (Compatible with Frontend)

### 6.1 Authentication

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/api/auth/login` | Login, return JWT + user | No | - |
| POST | `/api/auth/register` | Register new assessee | No | - |
| GET | `/api/auth/me` | Current user from token | Yes | * |
| POST | `/api/auth/refresh` | Refresh JWT token | Yes | * |
| POST | `/api/auth/logout` | Invalidate token | Yes | * |
| POST | `/api/auth/forgot-password` | Send reset email | No | - |
| POST | `/api/auth/reset-password` | Reset with token | No | - |

### 6.2 Schemes (CRUD)

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/schemes` | List (paginated, search) | Yes | admin, super_admin |
| GET | `/api/schemes/:id` | Detail + units | Yes | admin, super_admin |
| POST | `/api/schemes` | Create scheme | Yes | admin, super_admin |
| PUT | `/api/schemes/:id` | Update scheme | Yes | admin, super_admin |
| DELETE | `/api/schemes/:id` | Soft-delete scheme | Yes | admin, super_admin |

### 6.3 Questions (CRUD)

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/questions` | List (paginated, filters) | Yes | admin, super_admin |
| POST | `/api/questions` | Create question + options | Yes | admin, super_admin |
| PUT | `/api/questions/:id` | Update question | Yes | admin, super_admin |
| DELETE | `/api/questions/:id` | Soft-delete | Yes | admin, super_admin |

### 6.4 Schedules (CRUD)

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/schedules` | List (paginated) | Yes | admin, super_admin |
| POST | `/api/schedules` | Create schedule | Yes | admin, super_admin |
| PUT | `/api/schedules/:id` | Update schedule | Yes | admin, super_admin |
| DELETE | `/api/schedules/:id` | Delete schedule | Yes | admin, super_admin |

### 6.5 Verifications

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/verifications` | List (paginated, status) | Yes | admin, quality_manager |
| GET | `/api/verifications/:id` | Detail + documents | Yes | admin, quality_manager |
| GET | `/api/verifications/summary` | Count by status | Yes | admin, quality_manager |
| PUT | `/api/verifications/:id` | Approve/reject/revise | Yes | admin, quality_manager |

### 6.6 Assessors (CRUD)

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/assessors` | List (paginated, search) | Yes | admin, super_admin |
| GET | `/api/assessors/:id` | Detail + schemes | Yes | admin, super_admin |
| POST | `/api/assessors` | Create assessor profile | Yes | admin, super_admin |
| PUT | `/api/assessors/:id` | Update assessor | Yes | admin, super_admin |

### 6.7 Certificates

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/certificates` | List (paginated) | Yes | admin, assessee |
| GET | `/api/certificates/:id` | Detail | Yes | admin, assessee |
| GET | `/api/verify/:number` | Public verification | No | - |

### 6.8 Certificate Templates (CRUD)

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/certificate-templates` | List | Yes | admin |
| GET | `/api/certificate-templates/:id` | Detail + fields | Yes | admin |
| POST | `/api/certificate-templates` | Create template | Yes | admin |
| PUT | `/api/certificate-templates/:id` | Update template | Yes | admin |
| DELETE | `/api/certificate-templates/:id` | Delete template | Yes | admin |

### 6.9 Quality Management

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/quality/stats` | Dashboard statistics | Yes | admin, quality_manager |
| GET | `/api/quality/reviews` | List reviews (paginated) | Yes | admin, quality_manager |
| PUT | `/api/quality/reviews/:id` | Approve/reject review | Yes | quality_manager |
| GET | `/api/quality/audit-trail` | Audit logs (paginated) | Yes | admin, quality_manager |

### 6.10 Exams & Assessment

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/exams/:id` | Get exam + questions | Yes | assessee |
| POST | `/api/exams/:id/submit` | Submit exam answers | Yes | assessee |
| POST | `/api/exams/:id/sync` | Auto-save progress | Yes | assessee |
| GET | `/api/assessment/units` | Competency units (KUK) | Yes | assessor |
| PUT | `/api/assessments/:id/submit` | Submit assessor review | Yes | assessor |

### 6.11 Reports

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/reports/summary` | Dashboard stats | Yes | admin |
| POST | `/api/reports/bnsp-export` | Generate BNSP export | Yes | admin |

### 6.12 Tenant & Settings

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/tenant/settings` | Get all settings | Yes | admin |
| PUT | `/api/tenant/settings` | Update settings | Yes | admin |
| GET | `/api/tenant/resolve` | Resolve by domain | No | - |

### 6.13 File Upload

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/api/uploads` | Upload file (multipart) | Yes | * |
| GET | `/api/uploads/:id` | Get file metadata | Yes | * |
| DELETE | `/api/uploads/:id` | Delete file | Yes | admin |

### 6.14 Notifications

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/notifications` | List user notifications | Yes | * |
| PUT | `/api/notifications/:id/read` | Mark as read | Yes | * |

### 6.15 Health & Info

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/healthz` | Liveness probe | No | - |
| GET | `/readyz` | Readiness probe (DB check) | No | - |

**Total: 52 endpoints** across 15 resource groups.

---

## 7. Standard Response Format

```json
// Success (single resource)
{
  "data": { ... },
  "meta": null,
  "errors": null
}

// Success (paginated list)
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "per_page": 10,
    "total": 128
  },
  "errors": null
}

// Error
{
  "data": null,
  "meta": null,
  "errors": {
    "code": "VALIDATION_FAILED",
    "message": "Email sudah terdaftar",
    "details": [
      { "field": "email", "message": "Email sudah digunakan" }
    ]
  }
}
```

**HTTP Status Codes:**
- `200 OK` — Success
- `201 Created` — Resource created
- `400 Bad Request` — Validation failed
- `401 Unauthorized` — Token missing/expired
- `403 Forbidden` — RBAC denied
- `404 Not Found` — Resource not found
- `409 Conflict` — Duplicate resource
- `500 Internal Server Error` — Server error

---

## 8. Implementation Sprints

### Sprint 1: Foundation & Core (Week 1-2)

**Goal:** Project scaffolding, DB setup, auth flow, multi-tenant infrastructure.

| # | Task | Priority | Est. |
|---|------|----------|------|
| 1.1 | Go module init, directory structure, Makefile | P0 | 2h |
| 1.2 | Config loading (cleanenv + YAML/env) | P0 | 2h |
| 1.3 | PostgreSQL connection + pgx pool setup | P0 | 3h |
| 1.4 | Multi-tenant middleware (search_path switching) | P0 | 4h |
| 1.5 | Tenant provisioner (clone _template schema) | P0 | 4h |
| 1.6 | Migration runner (global + per-tenant) | P0 | 4h |
| 1.7 | Global migrations: tenants, subscription_plans | P0 | 2h |
| 1.8 | Tenant migrations: users, tenant_settings, audit_logs | P0 | 3h |
| 1.9 | JWT provider (generate, validate, refresh) | P0 | 3h |
| 1.10 | Auth handler (login, register, me, refresh) | P0 | 4h |
| 1.11 | RBAC middleware | P0 | 3h |
| 1.12 | Standard error types + response envelope | P0 | 2h |
| 1.13 | Fiber server setup + middleware chain | P0 | 2h |
| 1.14 | Docker Compose (api + postgres + minio) | P0 | 3h |
| 1.15 | Health endpoints (/healthz, /readyz) | P1 | 1h |
| 1.16 | Request logging middleware (slog) | P1 | 2h |
| | **Sprint 1 Total** | | **~42h** |

**Deliverables:**
- Working auth flow (login → JWT → protected routes)
- Multi-tenant schema resolution
- Docker compose running locally
- Migration infrastructure

---

### Sprint 2: Admin CRUD Modules (Week 3-4)

**Goal:** All admin CRUD endpoints compatible with frontend.

| # | Task | Priority | Est. |
|---|------|----------|------|
| 2.1 | Tenant migrations: schemes, units, elements, criteria | P0 | 3h |
| 2.2 | Schemes CRUD (handler + usecase + repo + sqlc) | P0 | 6h |
| 2.3 | Tenant migrations: questions, question_options | P0 | 2h |
| 2.4 | Questions CRUD (handler + usecase + repo + sqlc) | P0 | 6h |
| 2.5 | Tenant migrations: schedules, schedule_assessors | P0 | 2h |
| 2.6 | Schedules CRUD (handler + usecase + repo + sqlc) | P0 | 5h |
| 2.7 | Tenant migrations: assessor_profiles, assessor_schemes | P0 | 2h |
| 2.8 | Assessors CRUD (handler + usecase + repo + sqlc) | P0 | 5h |
| 2.9 | Tenant settings (handler + usecase + repo) | P1 | 3h |
| 2.10 | Input validation (go-playground/validator) | P0 | 3h |
| 2.11 | Pagination helper (offset-based) | P0 | 2h |
| 2.12 | Audit log service (auto-log all mutations) | P1 | 3h |
| | **Sprint 2 Total** | | **~42h** |

**Deliverables:**
- Full CRUD for schemes, questions, schedules, assessors
- Admin can create/manage all certification resources
- Audit trail logging all mutations

---

### Sprint 3: Verification, Exams & Assessment (Week 5-6)

**Goal:** Complete assessment pipeline from registration to scoring.

| # | Task | Priority | Est. |
|---|------|----------|------|
| 3.1 | Tenant migrations: verifications, verification_documents | P0 | 2h |
| 3.2 | Verifications (list, detail, summary, approve/reject) | P0 | 6h |
| 3.3 | File upload service (MinIO S3) | P0 | 5h |
| 3.4 | Upload handler (multipart/form-data) | P0 | 3h |
| 3.5 | Tenant migrations: exams, exam_answers | P0 | 2h |
| 3.6 | Exam endpoints (get exam, submit, auto-save) | P0 | 8h |
| 3.7 | Tenant migrations: assessments, assessment_results | P0 | 2h |
| 3.8 | Assessment endpoints (KUK units, submit review) | P0 | 6h |
| 3.9 | Auto-scoring engine (MCQ questions) | P1 | 4h |
| 3.10 | Registration flow (POST /registrations + doc upload) | P0 | 5h |
| | **Sprint 3 Total** | | **~43h** |

**Deliverables:**
- Assessee can register, upload documents, take CBT exams
- Admin can verify documents
- Assessor can review and score assessments

---

### Sprint 4: Quality, Certificates & Reports (Week 7-8)

**Goal:** Complete quality management, certificate issuance, and reporting.

| # | Task | Priority | Est. |
|---|------|----------|------|
| 4.1 | Tenant migrations: quality_reviews | P0 | 2h |
| 4.2 | Quality stats endpoint | P0 | 3h |
| 4.3 | Quality reviews (list + approve/reject) | P0 | 5h |
| 4.4 | Audit trail endpoint (paginated) | P0 | 3h |
| 4.5 | Tenant migrations: certificates, templates, fields | P0 | 3h |
| 4.6 | Certificate templates CRUD | P0 | 5h |
| 4.7 | Certificate issuance (auto on quality approval) | P0 | 6h |
| 4.8 | Certificate listing + public verification | P0 | 4h |
| 4.9 | Reports summary endpoint | P1 | 3h |
| 4.10 | BNSP export (CSV/XLSX generation) | P1 | 5h |
| 4.11 | Notification system (create, list, mark-read) | P1 | 4h |
| | **Sprint 4 Total** | | **~43h** |

**Deliverables:**
- Quality manager can review assessor decisions
- Certificates auto-generated on approval
- Public QR verification working
- BNSP export functional

---

### Sprint 5: Integration, Polish & Deploy (Week 9-10)

**Goal:** Frontend integration testing, security hardening, production deployment.

| # | Task | Priority | Est. |
|---|------|----------|------|
| 5.1 | Frontend integration testing (replace mock APIs) | P0 | 8h |
| 5.2 | CORS configuration for production domains | P0 | 2h |
| 5.3 | Rate limiting middleware | P1 | 2h |
| 5.4 | Password reset flow (email token) | P1 | 4h |
| 5.5 | Production Dockerfile (multi-stage, ~15MB) | P0 | 3h |
| 5.6 | Production docker-compose (api + postgres + minio + redis) | P0 | 3h |
| 5.7 | Environment config for staging/production | P0 | 2h |
| 5.8 | Seed data for demo tenant | P1 | 3h |
| 5.9 | API documentation (OpenAPI 3.1) | P1 | 4h |
| 5.10 | Security audit (OWASP, SQL injection, XSS headers) | P0 | 4h |
| 5.11 | Performance testing (load test critical endpoints) | P1 | 4h |
| 5.12 | Graceful shutdown + signal handling | P0 | 1h |
| | **Sprint 5 Total** | | **~40h** |

**Deliverables:**
- Frontend fully connected to real backend
- Production-ready Docker deployment
- Security hardened
- Demo data seeded

---

## 9. Docker Setup

### 9.1 docker-compose.yml (Development)

```yaml
services:
  api:
    build:
      context: .
      dockerfile: deployments/Dockerfile.dev
    ports:
      - "8080:8080"
    volumes:
      - .:/app
    environment:
      - APP_ENV=development
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=coreasia_lms
      - DB_USER=coreasia
      - DB_PASSWORD=secret
      - MINIO_ENDPOINT=minio:9000
      - JWT_SECRET=dev-secret-key-change-in-production
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: coreasia_lms
      POSTGRES_USER: coreasia
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U coreasia -d coreasia_lms"]
      interval: 5s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - miniodata:/data

volumes:
  pgdata:
  miniodata:
```

### 9.2 Dockerfile (Production)

```dockerfile
# Stage 1: Build
FROM golang:1.24-alpine AS builder
RUN apk add --no-cache git ca-certificates
WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/server ./cmd/server

# Stage 2: Run
FROM alpine:3.21
RUN apk add --no-cache ca-certificates tzdata
COPY --from=builder /app/server /app/server
COPY --from=builder /build/migrations /app/migrations
COPY --from=builder /build/configs /app/configs
WORKDIR /app
EXPOSE 8080
CMD ["./server"]
```

---

## 10. Makefile Commands

```makefile
.PHONY: dev build test migrate seed docker-up docker-down sqlc lint

# Development
dev:
	go run ./cmd/server

# Build
build:
	CGO_ENABLED=0 go build -ldflags="-s -w" -o bin/server ./cmd/server

# Testing
test:
	go test -v -race -count=1 ./...

test-cover:
	go test -v -race -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

# Database
migrate-up:
	go run ./cmd/migrate up

migrate-down:
	go run ./cmd/migrate down

migrate-create:
	@read -p "Migration name: " name; \
	migrate create -ext sql -dir migrations/tenant -seq $$name

seed:
	go run ./cmd/seed

# Code Generation
sqlc:
	sqlc generate

# Docker
docker-up:
	docker compose -f deployments/docker-compose.yml up -d

docker-down:
	docker compose -f deployments/docker-compose.yml down

# Quality
lint:
	golangci-lint run ./...

fmt:
	gofumpt -w .
```

---

## 11. Configuration

```yaml
# configs/config.yaml
app:
  name: CoreAsia LMS API
  env: development      # development | staging | production
  port: 8080
  debug: true

db:
  host: localhost
  port: 5432
  name: coreasia_lms
  user: coreasia
  password: secret
  max_open_conns: 25
  max_idle_conns: 10
  conn_max_lifetime: 5m

jwt:
  secret: your-secret-key-min-32-chars
  access_ttl: 24h       # Access token TTL
  refresh_ttl: 168h     # Refresh token TTL (7 days)

storage:
  endpoint: localhost:9000
  access_key: minioadmin
  secret_key: minioadmin
  bucket: lms-uploads
  use_ssl: false

cors:
  allowed_origins:
    - http://localhost:3000
    - http://localhost:3001
    - http://localhost:3002
  allowed_methods:
    - GET
    - POST
    - PUT
    - PATCH
    - DELETE
  allowed_headers:
    - Authorization
    - Content-Type
    - X-Tenant-Id
```

---

## 12. Key Design Decisions

### D1: Why Fiber v3 over Gin/Echo?
- **Performance:** Built on fasthttp, 2-4x faster than net/http frameworks
- **DX:** Express-inspired API, very intuitive for team
- **Ecosystem:** JWT, CORS, rate-limit contrib packages ready
- **v3:** Latest with generics support, improved middleware

### D2: Why pgx + sqlc over GORM?
- **Performance:** No reflection, no runtime query building
- **Type Safety:** sqlc generates exact Go types from SQL
- **Multi-tenant:** pgx pool allows per-connection `SET search_path` via BeforeAcquire hook
- **Control:** Full SQL control, no ORM magic, easier debugging

### D3: Why Schema-per-Tenant over RLS?
- **Isolation:** Complete data isolation per tenant (easier compliance)
- **Backup:** Can backup/restore individual tenant schemas
- **Migration:** Schema changes applied per tenant (blue/green capable)
- **Scale:** Works well for <100 tenants (B2B SaaS target)
- **Trade-off:** More operational complexity than RLS, but stronger isolation

### D4: Why slog over zerolog/zap?
- **Stdlib:** Built into Go 1.21+, no external dependency
- **Structured:** JSON output, key-value pairs
- **Performance:** Comparable to zerolog for most workloads
- **Ecosystem:** Growing handler ecosystem (slog-fiber, slog-multi)

### D5: Why UUID v7 for Primary Keys?
- **Time-ordered:** Monotonically increasing, excellent B-tree performance
- **Distributed:** No central sequence needed (multi-tenant safe)
- **Compact:** 16 bytes (vs ULID 26 chars)

---

## 13. Frontend Compatibility Checklist

All API responses MUST match the frontend DTO contracts:

- [ ] JSON field names in **snake_case** (matching TypeScript DTOs)
- [ ] Pagination format: `{ data: [], total, page, per_page }`
- [ ] Error format: `{ statusCode, statusMessage, data: { message, errors } }`
- [ ] Date format: ISO 8601 (`2026-02-27T10:30:00Z`)
- [ ] UUID format: standard UUID v4/v7 string
- [ ] Auth token: JWT Bearer in `Authorization` header
- [ ] Cookie: `auth_token` with 7-day TTL
- [ ] CORS: Allow frontend origins (localhost:3000, 3001, 3002)
- [ ] Tenant resolution: subdomain or `X-Tenant-Id` header

---

## 14. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Schema-per-tenant migration complexity | Medium | High | Automated migration runner + template schema |
| pgx search_path race condition | Low | High | Per-connection (not per-query) search_path set |
| Frontend DTO mismatch | Medium | Medium | Shared OpenAPI spec + integration tests |
| File upload size limits | Low | Medium | MinIO with configurable limits + streaming |
| JWT token security | Low | High | Short TTL + refresh rotation + httpOnly cookie |
| Database connection exhaustion | Medium | High | pgx pool with max_conns limit + monitoring |

---

## 15. Success Metrics

| Metric | Target |
|--------|--------|
| API response time (p95) | < 200ms |
| Database query time (p95) | < 50ms |
| Test coverage | ≥ 80% |
| Build time | < 30s |
| Docker image size | < 20MB |
| Concurrent users per instance | ≥ 500 |
| Uptime SLA | ≥ 99.5% |

---

## 16. Next Steps

1. **Immediate:** Review plan, approve tech stack decisions
2. **Sprint 1 Start:** Initialize Go module, set up Docker Compose, implement auth
3. **Parallel:** Set up PostgreSQL 16 with multi-schema support
4. **Continuous:** Frontend integration testing as each sprint completes
