# Arsitektur Self-Service: Register → Payment → Onboarding Otomatis

> Target: Customer bisa mulai pakai platform tanpa interaksi manual dari tim CoreAsia

---

## 1. FLOW OVERVIEW

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CUSTOMER JOURNEY                              │
│                                                                      │
│  ┌─────────┐    ┌─────────┐    ┌──────────┐    ┌─────────────────┐  │
│  │ Landing  │───►│Register │───►│ Payment  │───►│ Auto-Onboarding │  │
│  │ Page     │    │ Form    │    │ Checkout │    │ (Tenant Ready)  │  │
│  └─────────┘    └─────────┘    └──────────┘    └─────────────────┘  │
│                                                                      │
│  Step 1:         Step 2:        Step 3:         Step 4:              │
│  Pilih Plan      Isi Data       Bayar via       Schema dibuat,       │
│  di Pricing      Organisasi     Xendit          admin user aktif,    │
│  Page            + Admin        (VA/QRIS/CC)    redirect ke LMS      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. DETAIL TIAP STEP

### Step 1: Pricing Page (Landing)

Tambahkan halaman `/pricing` di `frontend/landing/` dengan 3 tier:

```
┌────────────────────┬────────────────────┬────────────────────┐
│     STARTER        │   PROFESSIONAL     │    ENTERPRISE      │
│    Rp 750rb/bln    │   Rp 2,5jt/bln    │    Rp 7jt/bln     │
│                    │                    │                    │
│  ✓ 50 asesi/bln   │  ✓ 500 asesi/bln  │  ✓ Unlimited      │
│  ✓ 3 skema        │  ✓ 20 skema       │  ✓ Unlimited      │
│  ✓ 1 admin        │  ✓ 5 admin        │  ✓ Unlimited      │
│  ✓ CBT Online     │  ✓ CBT Online     │  ✓ CBT Online     │
│  ✗ WhatsApp       │  ✓ WhatsApp       │  ✓ WhatsApp       │
│  ✗ API Access     │  ✓ API Access     │  ✓ API Access     │
│  ✗ Custom Domain  │  ✗ Custom Domain  │  ✓ Custom Domain  │
│                    │                    │                    │
│  [Mulai Gratis]   │  [Pilih Plan]     │  [Hubungi Kami]   │
│  14 hari trial    │                    │                    │
└────────────────────┴────────────────────┴────────────────────┘
```

**Starter** punya free trial 14 hari tanpa kartu kredit untuk akuisisi cepat.

### Step 2: Registration Form

Route: `/register?plan=starter|professional|enterprise`

```
┌──────────────────────────────────────┐
│ DAFTARKAN ORGANISASI ANDA            │
│                                      │
│ ── Data Organisasi ──                │
│ Nama Organisasi: [________________]  │
│ Slug/URL:        [____].coreasia.io  │
│ Tipe:            [LSP ▾]            │
│                  (LSP/LPK/Korporat/  │
│                   Asosiasi/Lainnya)  │
│                                      │
│ ── Akun Administrator ──            │
│ Nama Lengkap:    [________________]  │
│ Email:           [________________]  │
│ No. HP:          [________________]  │
│ Password:        [________________]  │
│                                      │
│ Plan: Professional (Rp 2.500.000/bln)│
│                                      │
│ [□] Saya setuju dengan Syarat &      │
│     Ketentuan serta Kebijakan Privasi│
│                                      │
│ [        LANJUT KE PEMBAYARAN      ] │
└──────────────────────────────────────┘
```

### Step 3: Payment (Xendit)

Setelah submit form registrasi:
1. Backend buat record `tenants` dengan `is_active = false` (pending payment)
2. Backend buat Xendit Invoice via API
3. Redirect user ke Xendit Checkout page
4. User bayar via VA / QRIS / CC / e-wallet

### Step 4: Auto-Onboarding (Webhook)

Setelah Xendit kirim webhook `invoice.paid`:
1. Backend update `tenants.is_active = true`
2. `TenantProvisioner.Provision()` buat schema + jalankan migrasi
3. Buat admin user di tenant schema baru
4. Seed data awal (subscription_plans link, tenant_settings default)
5. Kirim email welcome + link login
6. Kirim WhatsApp konfirmasi (opsional)

**User langsung bisa login ke `{slug}.coreasia.io` atau `app.coreasia.io` dengan header X-Tenant-ID = slug**

---

## 3. ARSITEKTUR BACKEND

### 3.1 Database Changes

**Migration baru: `000003_create_tenant_registrations.up.sql`**

```sql
-- Tenant registration lifecycle tracking
CREATE TABLE IF NOT EXISTS tenant_registrations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID REFERENCES tenants(id),

    -- Organization info
    org_name        VARCHAR(200) NOT NULL,
    org_type        VARCHAR(50) NOT NULL,  -- lsp, lpk, corporate, association, other

    -- Admin user (pre-provisioning)
    admin_email     VARCHAR(200) NOT NULL,
    admin_name      VARCHAR(200) NOT NULL,
    admin_phone     VARCHAR(20),
    password_hash   VARCHAR(200) NOT NULL,

    -- Plan & Payment
    plan_id         UUID REFERENCES subscription_plans(id),
    xendit_invoice_id VARCHAR(100),
    payment_status  VARCHAR(20) NOT NULL DEFAULT 'pending',
        -- pending, paid, expired, failed
    payment_method  VARCHAR(50),
    paid_at         TIMESTAMPTZ,
    amount          DECIMAL(12,2) NOT NULL,

    -- Provisioning
    provision_status VARCHAR(20) NOT NULL DEFAULT 'pending',
        -- pending, provisioning, ready, failed
    provisioned_at  TIMESTAMPTZ,

    -- Trial
    is_trial        BOOLEAN NOT NULL DEFAULT false,
    trial_ends_at   TIMESTAMPTZ,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_registrations_xendit ON tenant_registrations(xendit_invoice_id);
CREATE INDEX idx_registrations_payment ON tenant_registrations(payment_status);

-- Subscription tracking (recurring)
CREATE TABLE IF NOT EXISTS subscriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    plan_id         UUID NOT NULL REFERENCES subscription_plans(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'active',
        -- active, past_due, cancelled, expired
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end   TIMESTAMPTZ NOT NULL,
    xendit_recurring_id  VARCHAR(100),
    cancelled_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

### 3.2 Endpoint Baru

```
── Tanpa tenant middleware (global routes) ──────────────

POST   /api/onboarding/register     → Daftar organisasi + buat invoice
GET    /api/onboarding/plans        → List subscription plans
GET    /api/onboarding/check-slug   → Cek ketersediaan slug
POST   /api/onboarding/webhook      → Xendit webhook callback

── Dengan tenant middleware (per-tenant) ────────────────

GET    /api/billing/subscription    → Status subscription tenant saat ini
POST   /api/billing/upgrade         → Upgrade plan
POST   /api/billing/cancel          → Cancel subscription
GET    /api/billing/invoices        → Riwayat pembayaran
```

### 3.3 Registration Handler

```go
// POST /api/onboarding/register
type RegisterTenantRequest struct {
    // Organization
    OrgName  string `json:"org_name" validate:"required,min=3"`
    Slug     string `json:"slug" validate:"required,min=3,max=30,alphanum"`
    OrgType  string `json:"org_type" validate:"required,oneof=lsp lpk corporate association other"`

    // Admin User
    AdminName  string `json:"admin_name" validate:"required,min=2"`
    AdminEmail string `json:"admin_email" validate:"required,email"`
    AdminPhone string `json:"admin_phone"`
    Password   string `json:"password" validate:"required,min=8"`

    // Plan
    PlanID string `json:"plan_id" validate:"required,uuid"`
}

// Response
type RegisterTenantResponse struct {
    RegistrationID string `json:"registration_id"`
    InvoiceURL     string `json:"invoice_url"`    // Xendit checkout URL
    ExpiresAt      string `json:"expires_at"`     // Invoice expiry
}
```

**Flow internal:**
```
1. Validasi input + cek slug unik
2. Hash password (bcrypt)
3. INSERT INTO tenants (slug, schema_name, is_active=false, plan_id)
4. INSERT INTO tenant_registrations (semua data + password_hash)
5. Panggil Xendit Create Invoice API:
   - amount = plan.price_monthly
   - payer_email = admin_email
   - success_redirect_url = https://app.coreasia.io/welcome
   - failure_redirect_url = https://coreasia.io/register?failed=1
6. Update registration.xendit_invoice_id
7. Return { registration_id, invoice_url }
```

### 3.4 Webhook Handler

```go
// POST /api/onboarding/webhook (Xendit callback)
// Header: x-callback-token (verify with Xendit callback token)

func (h *OnboardingHandler) HandleWebhook(c fiber.Ctx) error {
    // 1. Verify callback token
    token := c.Get("x-callback-token")
    if token != h.cfg.Xendit.CallbackToken {
        return c.Status(403).JSON(...)
    }

    // 2. Parse webhook payload
    var payload XenditInvoiceCallback
    c.Bind().JSON(&payload)

    // 3. Find registration by invoice ID
    reg := h.repo.FindByXenditInvoiceID(payload.ExternalID)

    if payload.Status == "PAID" {
        // 4. Update payment status
        reg.PaymentStatus = "paid"
        reg.PaidAt = payload.PaidAt
        reg.PaymentMethod = payload.PaymentMethod

        // 5. Provision tenant (CRITICAL)
        err := h.provisioner.Provision(ctx, reg.Tenant.SchemaName)

        // 6. Create admin user in new tenant schema
        ctx = context.WithValue(ctx, SchemaContextKey, reg.Tenant.SchemaName)
        h.userRepo.Create(ctx, &entity.User{
            Email:        reg.AdminEmail,
            PasswordHash: reg.PasswordHash,  // Already hashed from registration
            FullName:     reg.AdminName,
            PhoneNumber:  reg.AdminPhone,
            Role:         "admin",
            IsActive:     true,
        })

        // 7. Activate tenant
        h.tenantRepo.Activate(ctx, reg.TenantID)

        // 8. Create subscription record
        h.subscriptionRepo.Create(ctx, &Subscription{
            TenantID:           reg.TenantID,
            PlanID:             reg.PlanID,
            Status:             "active",
            CurrentPeriodStart: time.Now(),
            CurrentPeriodEnd:   time.Now().AddDate(0, 1, 0),
        })

        // 9. Send welcome email
        h.emailService.SendWelcome(reg.AdminEmail, reg.OrgName, reg.Tenant.Slug)

        // 10. Update provision status
        reg.ProvisionStatus = "ready"
    }

    return c.SendStatus(200)
}
```

### 3.5 Trial Flow (Starter Plan — Tanpa Bayar)

```
POST /api/onboarding/register (dengan plan = Starter)
  → SKIP Xendit invoice
  → Langsung provision schema
  → Buat admin user
  → Set trial_ends_at = NOW() + 14 days
  → Tenant aktif, tapi limited features
  → Cron job check trial_ends_at setiap hari
  → H-3 kirim reminder upgrade
  → Setelah expired: is_active = false (data tetap ada)
```

---

## 4. ARSITEKTUR FRONTEND

### 4.1 Landing Page (frontend/landing)

Halaman baru yang perlu dibuat:

```
/pricing          → Tabel pricing 3 tier
/register         → Form registrasi organisasi
/register/payment → Redirect ke Xendit (atau embed)
/register/success → Konfirmasi + link ke LMS
```

### 4.2 LMS Dashboard (frontend/lms)

Tambahan untuk billing management:

```
/admin/billing              → Status subscription, usage meter
/admin/billing/upgrade      → Upgrade plan
/admin/billing/invoices     → Riwayat pembayaran
```

### 4.3 Component Flow

```vue
<!-- /pricing — di landing page -->
PricingPage
  ├─ PricingCard (x3)
  │   └─ [Pilih Plan] → navigateTo('/register?plan=professional')
  │
  └─ FAQ Section

<!-- /register — di landing page -->
RegisterPage
  ├─ PlanSummaryCard (sidebar, dari query param)
  ├─ OrgInfoForm
  │   ├─ org_name, slug (live check availability), org_type
  │   └─ SlugChecker (debounced GET /api/onboarding/check-slug)
  ├─ AdminForm
  │   └─ name, email, phone, password
  ├─ TermsCheckbox
  └─ [Lanjut ke Pembayaran]
      → POST /api/onboarding/register
      → Response: { invoice_url }
      → window.location.href = invoice_url (Xendit)

<!-- After Xendit payment success, redirect to: -->
/register/success?registration_id=xxx
  ├─ SuccessAnimation (confetti!)
  ├─ "Organisasi Anda sedang disiapkan..."
  ├─ (Poll GET /api/onboarding/status/:id until provision_status=ready)
  └─ [Masuk ke Dashboard] → redirect ke LMS
```

---

## 5. XENDIT INTEGRATION

### 5.1 Required Xendit APIs

| API | Tujuan |
|-----|--------|
| **Create Invoice** | Buat tagihan saat registrasi |
| **Get Invoice** | Cek status pembayaran |
| **Create Recurring Plan** | Auto-charge bulanan |
| **Callback/Webhook** | Notifikasi pembayaran berhasil |

### 5.2 Go Package

```go
// internal/infrastructure/payment/xendit.go

type XenditClient struct {
    apiKey      string
    callbackURL string
    httpClient  *http.Client
}

type CreateInvoiceRequest struct {
    ExternalID      string   `json:"external_id"`
    Amount          float64  `json:"amount"`
    PayerEmail      string   `json:"payer_email"`
    Description     string   `json:"description"`
    Currency        string   `json:"currency"`           // "IDR"
    InvoiceDuration int      `json:"invoice_duration"`    // seconds
    SuccessRedirect string   `json:"success_redirect_url"`
    FailureRedirect string   `json:"failure_redirect_url"`
    PaymentMethods  []string `json:"payment_methods"`
    // ["BCA", "BNI", "MANDIRI", "QRIS", "CREDIT_CARD", "OVO", "DANA", "GOPAY"]
}

type InvoiceResponse struct {
    ID         string `json:"id"`
    InvoiceURL string `json:"invoice_url"` // Xendit checkout page
    ExpiryDate string `json:"expiry_date"`
    Status     string `json:"status"`
}
```

### 5.3 Environment Variables

```env
XENDIT_API_KEY=xnd_production_xxx
XENDIT_CALLBACK_TOKEN=xxx
XENDIT_WEBHOOK_URL=https://api.coreasia.io/api/onboarding/webhook
XENDIT_SUCCESS_REDIRECT=https://app.coreasia.io/register/success
XENDIT_FAILURE_REDIRECT=https://coreasia.io/register?status=failed
```

---

## 6. REVENUE FLOW DIAGRAM

```
Customer         Landing          Backend          Xendit           Database
   │                │                │                │                │
   │─ Pilih Plan ──►│                │                │                │
   │                │─ Register ────►│                │                │
   │                │                │── Create ─────►│                │
   │                │                │   Invoice      │                │
   │                │                │◄─ invoice_url ─│                │
   │                │◄─ Redirect ────│                │                │
   │◄─ Xendit Pay ──│                │                │                │
   │─ Bayar ───────────────────────────────────────►│                │
   │                │                │◄─ Webhook ────│                │
   │                │                │   (PAID)       │                │
   │                │                │── Provision ──────────────────►│
   │                │                │   schema       │    CREATE      │
   │                │                │── Create ─────────────────────►│
   │                │                │   admin user   │    INSERT      │
   │                │                │── Activate ───────────────────►│
   │                │                │   tenant       │    UPDATE      │
   │                │                │── Email ──────►│                │
   │◄─ Welcome ─────│                │   welcome      │                │
   │                │                │                │                │
   │─ Login ───────────────────────►│                │                │
   │◄─ JWT Token ───│                │                │                │
   │─ Use Platform ─►               │                │                │
```

---

## 7. SUBSCRIPTION LIFECYCLE

```
┌──────────┐    Payment     ┌──────────┐   Auto-Renew   ┌──────────┐
│ PENDING  │───────────────►│ ACTIVE   │◄──────────────►│ ACTIVE   │
│ (trial/  │    Success     │          │   Xendit       │ (renewed)│
│  unpaid) │                │          │   Recurring    │          │
└──────────┘                └────┬─────┘                └──────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │ PAST_DUE │ │CANCELLED │ │ EXPIRED  │
              │ (3 hari  │ │ (by user)│ │ (trial   │
              │  grace)  │ │          │ │  ended)  │
              └────┬─────┘ └──────────┘ └──────────┘
                   │
                   ▼
              ┌──────────┐
              │SUSPENDED │  is_active = false
              │(readonly)│  Data tetap ada, bisa reaktivasi
              └──────────┘
```

**Grace period:** 3 hari setelah gagal bayar, tenant masih bisa akses (readonly).
**Suspended:** Setelah grace period, tenant di-suspend. Data tetap ada. Bayar = reaktivasi.

---

## 8. IMPLEMENTASI BERTAHAP

### Phase 1: MVP Self-Service (2-3 minggu)
- [ ] Migration: `tenant_registrations`, `subscriptions` table
- [ ] Xendit integration (Create Invoice + Webhook)
- [ ] `POST /api/onboarding/register` endpoint
- [ ] `POST /api/onboarding/webhook` endpoint
- [ ] `GET /api/onboarding/check-slug` endpoint
- [ ] Landing: `/pricing` page
- [ ] Landing: `/register` form
- [ ] Landing: `/register/success` page
- [ ] Free trial flow (Starter, 14 hari)

### Phase 2: Billing Dashboard (1-2 minggu)
- [ ] `GET /api/billing/subscription` endpoint
- [ ] `GET /api/billing/invoices` endpoint
- [ ] LMS: `/admin/billing` page
- [ ] Xendit Recurring integration (auto-charge)
- [ ] Cron: trial expiry checker
- [ ] Cron: subscription renewal reminder (H-7, H-3, H-1)

### Phase 3: Growth Features (1-2 minggu)
- [ ] Plan upgrade/downgrade flow
- [ ] Usage metering (enforce limits: max_assessees, max_schemes)
- [ ] Referral code system
- [ ] Promo/coupon code support
- [ ] WhatsApp welcome + renewal reminder

---

## 9. SECURITY CONSIDERATIONS

1. **Xendit Webhook:** Verify `x-callback-token` header pada setiap webhook
2. **Slug validation:** Sanitize slug (alphanumeric + dash only), prevent reserved words (admin, api, www, app)
3. **Race condition:** Use database lock saat provisioning schema untuk prevent duplicate
4. **Password:** Hash sebelum simpan di `tenant_registrations`, jangan log
5. **Idempotency:** Webhook bisa dipanggil multiple times, handle duplicate payment gracefully
6. **Rate limiting:** Register endpoint harus rate-limited (prevent spam registration)
7. **Email verification:** Kirim email verifikasi sebelum create invoice (optional, bisa di Phase 2)
