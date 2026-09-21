package handler

import (
	"fmt"
	"log/slog"
	"os"
	"time"

	"github.com/coreasia/gateway/internal/auth"
	"github.com/coreasia/gateway/internal/config"
	mw "github.com/coreasia/gateway/internal/middleware"
	"github.com/coreasia/gateway/internal/rbac"
	"github.com/coreasia/gateway/internal/repository"
	"github.com/coreasia/gateway/internal/service"
	"github.com/coreasia/gateway/pkg/apperr"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/recover"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

type Server struct {
	app  *fiber.App
	cfg  *config.Config
	pool *pgxpool.Pool
	rdb  *redis.Client
}

func NewServer(cfg *config.Config, pool *pgxpool.Pool, rdb *redis.Client) *Server {
	appConfig := fiber.Config{
		AppName:      cfg.App.Name,
		ErrorHandler: globalErrorHandler,
		BodyLimit:    10 * 1024 * 1024, // 10MB for file uploads
	}
	// Di produksi lalu lintas masuk lewat Cloudflare lalu nginx-proxy Pantau
	// (deploy/pantau). PERHATIAN: dengan konfigurasi ini c.IP() memulangkan
	// entri X-Forwarded-For paling KIRI, yang bisa dikarang klien. Auth admin
	// (pembatas /login dan /totp/verify, log, audit) memakai mw.ClientIP, yang
	// membaca XFF dari kanan. Rute lain belum.
	if cfg.App.Env == "production" {
		appConfig.ProxyHeader = fiber.HeaderXForwardedFor
		appConfig.TrustProxy = true
		appConfig.EnableIPValidation = true
		appConfig.TrustProxyConfig = fiber.TrustProxyConfig{Private: true, Loopback: true}
	}

	app := fiber.New(appConfig)

	s := &Server{app: app, cfg: cfg, pool: pool, rdb: rdb}
	s.setupMiddleware()
	s.setupRoutes()

	return s
}

func (s *Server) setupMiddleware() {
	s.app.Use(recover.New())

	origins := s.cfg.CORS.AllowedOrigins
	if len(origins) == 0 {
		origins = []string{"http://localhost:3000", "http://localhost:3001", "https://coreasia.id"}
	}

	s.app.Use(cors.New(cors.Config{
		AllowOrigins:     origins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
		// Halaman /console/login memanggil /admin/auth/login dan /totp/verify
		// langsung dari peramban: tanpa ini Retry-After 429 tidak terbaca JS.
		ExposeHeaders: []string{"Retry-After"},
	}))
}

func (s *Server) setupRoutes() {
	// Repositories
	tenantRepo := repository.NewTenantRepo(s.pool)
	planRepo := repository.NewPlanRepo(s.pool)
	adminUserRepo := repository.NewAdminUserRepo(s.pool)
	articleRepo := repository.NewArticleRepo(s.pool)
	auditLogRepo := repository.NewAuditLogRepo(s.pool)
	contactLeadRepo := repository.NewContactLeadRepo(s.pool)

	// Services
	provisioner := service.NewProvisioner(
		s.pool,
		tenantRepo,
		s.cfg.Database.DSN(),
		"../lms/migrations/tenant",
	)
	midtransService := service.NewMidtransService(s.cfg.Midtrans)
	emailService := service.NewEmailService(s.cfg.Email)

	r2Service, err := service.NewR2Service(s.cfg.R2)
	if err != nil {
		slog.Warn("R2 service tidak tersedia", "error", err)
		r2Service = &service.R2Service{}
	}

	// JWT provider
	accessTTL, _ := time.ParseDuration(s.cfg.JWT.AccessTTL)
	if accessTTL == 0 {
		accessTTL = 60 * time.Minute
	}
	refreshTTL, _ := time.ParseDuration(s.cfg.JWT.RefreshTTL)
	if refreshTTL == 0 {
		refreshTTL = 720 * time.Hour
	}
	// Auth admin hanya longgar bila APP_ENV=development di-set EKSPLISIT lewat
	// environment. Nilai "development" dari configs/config.yaml (ikut di image)
	// atau dari env-default tidak dihitung: .env produksi yang kehilangan
	// APP_ENV tidak boleh diam-diam melonggarkan penjaga JWT_SECRET dan
	// pembatas login.
	explicitEnv, _ := os.LookupEnv("APP_ENV")
	adminAuthDev := explicitEnv == "development"
	jwtSecret, adminAuthReady := guardJWTSecret(s.cfg.JWT.Secret, s.cfg.App.Env, explicitEnv)
	jwtProvider := auth.NewJWTProvider(jwtSecret, accessTTL, refreshTTL, s.cfg.JWT.Issuer)

	// Rate limiters
	aiRateLimiter := mw.NewRateLimiter(10, 1*time.Hour)
	// Pembatas per IP auth admin dikunci mw.ClientIPKey (XFF dari kanan, IPv6
	// per /64), bukan c.IP() yang bisa dikarang klien lewat X-Forwarded-For.
	loginRateLimiter := mw.NewIPRateLimiter(5, 15*time.Minute, adminAuthDev)
	// Lapis kedua di depan batas per admin (5 per 15 menit, Redis): membatasi
	// banjir /totp/verify dari satu IP, termasuk ke banyak admin sekaligus.
	totpVerifyRateLimiter := mw.NewIPRateLimiter(10, 15*time.Minute, adminAuthDev)
	contactLeadRateLimiter := mw.NewIPRateLimiter(10, 1*time.Hour, s.cfg.App.Env == "development")

	// Handlers
	healthHandler := NewHealthHandler(s.pool)
	plansHandler := NewPlansHandler(planRepo)
	onboardingHandler := NewOnboardingHandler(tenantRepo, planRepo, provisioner, midtransService)
	// TOTP admin: rahasia dienkripsi dengan kunci turunan JWT secret; kode salah
	// dibatasi per admin di Redis. Tanpa salah satunya, endpoint TOTP menjawab 503
	// (gagal tertutup) dan login admin tanpa TOTP berjalan seperti biasa.
	var totpCipher *auth.TOTPCipher
	if adminAuthReady {
		totpCipher, err = auth.NewTOTPCipher(jwtSecret)
		if err != nil {
			slog.Warn("TOTP admin dinonaktifkan", "error", err)
			totpCipher = nil
		}
	}
	var totpAttempts totpAttemptLimiter
	var loginAttempts loginAttemptLimiter
	if s.rdb != nil {
		totpAttempts = auth.NewRedisTOTPLimiter(s.rdb, totpMaxFailures, totpFailureWindow, totpMaxFailuresLong, totpFailureWindowLong)
		loginAttempts = auth.NewRedisLoginLimiter(s.rdb, loginMaxFailures, loginFailureWindow, loginOriginTTL)
	}
	authHandler := NewAuthHandler(adminUserRepo, auditLogRepo, jwtProvider, totpCipher, totpAttempts, loginAttempts)
	articleHandler := NewArticleHandler(articleRepo, auditLogRepo)
	crmService := service.NewCRMService(s.cfg.CRM)
	contactLeadHandler := NewContactLeadHandler(contactLeadRepo, emailService, crmService)
	adminUserHandler := NewAdminUserHandler(adminUserRepo, auditLogRepo, totpAttempts)
	uploadHandler := NewUploadHandler(r2Service, auditLogRepo)
	apiKeyRepo := repository.NewAPIKeyRepo(s.pool)
	appSettingsRepo := repository.NewAppSettingsRepo(s.pool)
	keywordRepo := repository.NewKeywordRepo(s.pool)
	keywordHandler := NewKeywordHandler(keywordRepo, auditLogRepo, apiKeyRepo, appSettingsRepo)
	articleBot := service.NewArticleBot(s.cfg.AI, articleRepo, auditLogRepo, apiKeyRepo, appSettingsRepo, keywordRepo)
	aiHandler := NewAIHandler(articleBot, auditLogRepo, apiKeyRepo, appSettingsRepo, s.rdb)
	auditHandler := NewAuditHandler(auditLogRepo)
	apiKeyHandler := NewAPIKeyHandler(apiKeyRepo, auditLogRepo, s.rdb)
	botScheduleRepo := repository.NewBotScheduleRepo(s.pool)
	botScheduleHandler := NewBotScheduleHandler(botScheduleRepo, auditLogRepo, articleBot)
	cadRepo := repository.NewCADRepo(s.pool)
	mayarClient := service.NewMayarClient(s.cfg.Payments)
	cadSigner, err := service.NewCADKeySigner(s.cfg.CAD.SigningKey)
	if err != nil {
		slog.Warn("CAD key signer dinonaktifkan (generate tidak tersedia)", "error", err)
		cadSigner = nil
	}
	mounterSigner, err := service.NewCADKeySigner(s.cfg.Mounter.SigningKey)
	if err != nil {
		slog.Warn("Mounter key signer dinonaktifkan (penerbitan key Mounter tidak tersedia)", "error", err)
		mounterSigner = nil
	}
	cadHandler := NewCADHandler(cadRepo, auditLogRepo, emailService, cadSigner, mounterSigner, s.cfg.Payments, mayarClient)

	// Auth middleware
	authMiddleware := mw.AuthMiddleware(jwtProvider)

	// Routes
	healthHandler.RegisterRoutes(s.app)

	api := s.app.Group("/api")
	public := api.Group("/public")

	// Public lead capture. A successful response is only returned after the
	// submission has been persisted by PostgreSQL.
	public.Post("/leads", contactLeadRateLimiter.Middleware(), contactLeadHandler.Create)

	// Existing routes
	plansHandler.RegisterRoutes(api)
	onboardingHandler.RegisterRoutes(api)

	// Public article routes
	api.Get("/articles", articleHandler.ListPublished)
	api.Get("/articles/:slug", articleHandler.GetBySlug)

	// JWT_SECRET ditolak (lihat guardJWTSecret): seluruh /api/admin/** menjawab
	// 503, sedangkan rute publik (lisensi CAD, webhook pembayaran, lead) tetap
	// berjalan. Harus terdaftar sebelum rute admin mana pun.
	if !adminAuthReady {
		api.Use("/admin", adminAuthDisabled)
	}

	// Auth admin (publik + terlindung). Rute terlindung memakai grup /admin
	// yang dikembalikan, dengan AuthMiddleware.
	admin := registerAdminAuthRoutes(api, adminRoutes{
		auth:        authHandler,
		requireAuth: authMiddleware,
		loginLimit:  loginRateLimiter.MiddlewareBy(mw.ClientIPKey),
		verifyLimit: totpVerifyRateLimiter.MiddlewareBy(mw.ClientIPKey),
	})

	// Sesi hidup (is_active + token_version + peran dari DB) untuk rute bernilai
	// tinggi yang jarang dipanggil: manajemen admin dan API key. Satu kueri per
	// permintaan, hanya di rute ini.
	liveSession := mw.RequireLiveSession(adminUserRepo)

	// Article management
	admin.Get("/articles", mw.RequirePermission(rbac.ArticlesList), articleHandler.ListAll)
	admin.Get("/articles/stats", mw.RequirePermission(rbac.ArticlesStats), articleHandler.Stats)
	admin.Get("/articles/:id", mw.RequirePermission(rbac.ArticlesView), articleHandler.GetByID)
	admin.Post("/articles", mw.RequirePermission(rbac.ArticlesCreate), articleHandler.Create)
	admin.Put("/articles/:id", mw.RequirePermission(rbac.ArticlesUpdate), articleHandler.Update)
	admin.Delete("/articles/:id", mw.RequirePermission(rbac.ArticlesDelete), articleHandler.Delete)
	admin.Post("/articles/:id/publish", mw.RequirePermission(rbac.ArticlesPublish), articleHandler.Publish)
	admin.Post("/articles/:id/unpublish", mw.RequirePermission(rbac.ArticlesPublish), articleHandler.Unpublish)

	// File upload
	admin.Post("/upload", mw.RequirePermission(rbac.UploadCreate), uploadHandler.Upload)

	// AI generation (permission check before rate limiter) & model listing
	admin.Post("/ai/generate", mw.RequirePermission(rbac.AIGenerate), aiRateLimiter.Middleware(), aiHandler.Generate)
	admin.Get("/ai/models/:provider", mw.RequirePermission(rbac.AIModels), aiHandler.ListModels)
	admin.Get("/ai/active-key/:provider", mw.RequirePermission(rbac.AIModels), aiHandler.GetActiveKey)
	admin.Get("/ai/settings", mw.RequirePermission(rbac.AISettingsView), aiHandler.GetSettings)
	admin.Put("/ai/settings", mw.RequirePermission(rbac.AISettingsUpdate), aiHandler.UpdateSettings)

	// Admin user management
	registerAdminUserRoutes(admin, adminUserHandler, liveSession)

	// API key management (menyalin kunci provider = rahasia; membuat kunci =
	// akses yang bertahan): wajib sesi hidup.
	admin.Get("/api-keys", liveSession, mw.RequirePermission(rbac.APIKeysList), apiKeyHandler.List)
	admin.Get("/api-keys/:id", liveSession, mw.RequirePermission(rbac.APIKeysView), apiKeyHandler.GetByID)
	admin.Get("/api-keys/:id/copy", liveSession, mw.RequirePermission(rbac.APIKeysCopy), apiKeyHandler.CopyKey)
	admin.Post("/api-keys", liveSession, mw.RequirePermission(rbac.APIKeysCreate), apiKeyHandler.Create)
	admin.Put("/api-keys/:id", liveSession, mw.RequirePermission(rbac.APIKeysUpdate), apiKeyHandler.Update)
	admin.Delete("/api-keys/:id", liveSession, mw.RequirePermission(rbac.APIKeysDelete), apiKeyHandler.Delete)

	// Keywords
	admin.Get("/keywords", mw.RequirePermission(rbac.KeywordsList), keywordHandler.List)
	admin.Get("/keywords/stats", mw.RequirePermission(rbac.KeywordsList), keywordHandler.Stats)
	admin.Get("/keywords/:id", mw.RequirePermission(rbac.KeywordsView), keywordHandler.GetByID)
	admin.Post("/keywords", mw.RequirePermission(rbac.KeywordsCreate), keywordHandler.Create)
	admin.Post("/keywords/batch", mw.RequirePermission(rbac.KeywordsCreate), keywordHandler.CreateBatch)
	admin.Put("/keywords/:id", mw.RequirePermission(rbac.KeywordsUpdate), keywordHandler.Update)
	admin.Delete("/keywords/:id", mw.RequirePermission(rbac.KeywordsDelete), keywordHandler.Delete)
	admin.Post("/keywords/ai-suggest", mw.RequirePermission(rbac.KeywordsAISuggest), keywordHandler.AISuggest)

	// Bot schedules
	admin.Get("/bots", mw.RequirePermission(rbac.BotsList), botScheduleHandler.List)
	admin.Get("/bots/:id", mw.RequirePermission(rbac.BotsView), botScheduleHandler.GetByID)
	admin.Post("/bots", mw.RequirePermission(rbac.BotsCreate), botScheduleHandler.Create)
	admin.Put("/bots/:id", mw.RequirePermission(rbac.BotsUpdate), botScheduleHandler.Update)
	admin.Delete("/bots/:id", mw.RequirePermission(rbac.BotsDelete), botScheduleHandler.Delete)
	admin.Post("/bots/:id/trigger", mw.RequirePermission(rbac.BotsTrigger), botScheduleHandler.Trigger)

	// Audit logs
	admin.Get("/audit-logs", mw.RequirePermission(rbac.AuditList), auditHandler.List)

	// CAD (CoreAsia Download Manager) — admin console
	admin.Get("/cad/licenses", mw.RequirePermission(rbac.CADLicensesList), cadHandler.List)
	admin.Get("/cad/licenses/:id", mw.RequirePermission(rbac.CADLicensesView), cadHandler.GetByID)
	admin.Get("/cad/licenses/:id/copy", mw.RequirePermission(rbac.CADLicensesCopy), cadHandler.CopyKey)
	admin.Post("/cad/licenses", mw.RequirePermission(rbac.CADLicensesCreate), cadHandler.Create)
	admin.Post("/cad/licenses/generate", mw.RequirePermission(rbac.CADLicensesCreate), cadHandler.Generate)
	admin.Post("/cad/licenses/import", mw.RequirePermission(rbac.CADLicensesImport), cadHandler.Import)
	admin.Put("/cad/licenses/:id", mw.RequirePermission(rbac.CADLicensesUpdate), cadHandler.Update)
	admin.Delete("/cad/licenses/:id", mw.RequirePermission(rbac.CADLicensesDelete), cadHandler.Delete)
	admin.Get("/cad/devices", mw.RequirePermission(rbac.CADDevicesList), cadHandler.ListDevices)
	admin.Post("/cad/devices/:id/deactivate", mw.RequirePermission(rbac.CADDevicesManage), cadHandler.DeviceDeactivate)
	admin.Get("/cad/analytics", mw.RequirePermission(rbac.CADAnalyticsView), cadHandler.Analytics)

	// CAD public (app-facing) — the desktop app calls these; no admin auth
	api.Post("/cad/activate", cadHandler.Activate)
	api.Post("/cad/deactivate", cadHandler.Deactivate)
	api.Post("/cad/telemetry", cadHandler.Telemetry)

	// CAD purchase webhooks — public, secured by shared-secret token
	api.Post("/cad/purchase/mayar", cadHandler.PurchaseWebhookMayar)
	api.Post("/cad/purchase/gumroad", cadHandler.PurchaseWebhookGumroad)
}

// adminRoutes adalah dependensi rute auth admin. Dirakit server.go dan uji
// handler lewat registerAdminAuthRoutes/registerAdminUserRoutes, supaya uji
// memakai susunan rute dan middleware yang sama persis dengan produksi.
type adminRoutes struct {
	auth        *AuthHandler
	requireAuth fiber.Handler // mw.AuthMiddleware
	loginLimit  fiber.Handler // pembatas IP /login
	verifyLimit fiber.Handler // pembatas IP /totp/verify
}

// registerAdminAuthRoutes mendaftarkan /api/admin/auth/** dan mengembalikan
// grup /api/admin yang dilindungi AuthMiddleware.
func registerAdminAuthRoutes(api fiber.Router, d adminRoutes) fiber.Router {
	// IP peramban yang DILAPORKAN BFF console (X-Konsol-Klien-IP) → context,
	// hanya untuk kolom audit reported_client_ip. Tidak tepercaya: pembatas,
	// kunci percobaan, dan ip_address tetap dari mw.ClientIP / c.IP().
	api.Use("/admin", mw.ReportedClientIP)

	// Tanpa access token: login (dibatasi per IP), refresh, dan langkah kedua
	// login ber-TOTP (tantangan typ=mfa + kode → token). /totp/verify dibatasi
	// per IP di sini dan 5 percobaan per admin per 15 menit di handler (Redis,
	// dipesan sebelum kode dievaluasi).
	adminAuth := api.Group("/admin/auth")
	adminAuth.Post("/login", d.loginLimit, d.auth.Login)
	adminAuth.Post("/refresh", d.auth.Refresh)
	adminAuth.Post("/totp/verify", d.verifyLimit, d.auth.TOTPVerify)

	// Protected admin routes
	admin := api.Group("/admin", d.requireAuth)

	// Auth (self-service, no permission check)
	admin.Get("/auth/me", d.auth.Me)
	admin.Post("/auth/logout", d.auth.Logout)
	admin.Get("/auth/permissions", d.auth.Permissions)
	admin.Post("/auth/logout-all", d.auth.LogoutAll)
	admin.Post("/auth/totp/setup", d.auth.TOTPSetup)
	admin.Post("/auth/totp/enable", d.auth.TOTPEnable)
	admin.Post("/auth/totp/disable", d.auth.TOTPDisable)
	return admin
}

// registerAdminUserRoutes: manajemen admin, semuanya di belakang sesi hidup
// (live = mw.RequireLiveSession) lalu izin dari peran terkini di DB.
func registerAdminUserRoutes(admin fiber.Router, users *AdminUserHandler, live fiber.Handler) {
	admin.Get("/users", live, mw.RequirePermission(rbac.UsersList), users.List)
	admin.Post("/users", live, mw.RequirePermission(rbac.UsersCreate), users.Create)
	admin.Put("/users/:id", live, mw.RequirePermission(rbac.UsersUpdate), users.Update)
	admin.Delete("/users/:id", live, mw.RequirePermission(rbac.UsersDelete), users.Delete)
	admin.Post("/users/:id/revoke-sessions", live, mw.RequirePermission(rbac.UsersUpdate), users.RevokeSessions)
	admin.Post("/users/:id/totp/reset", live, mw.RequirePermission(rbac.UsersUpdate), users.ResetTOTP)
}

// guardJWTSecret menolak JWT_SECRET yang kosong, pendek, atau sama dengan
// nilai yang ter-commit di repo (configs/config.yaml ikut dikapalkan di image,
// jadi tanpa JWT_SECRET di .env nilai repo itu dipakai diam-diam). Secret yang
// sama juga menjadi kunci HKDF enkripsi rahasia TOTP.
//
// explicitEnv = APP_ENV dari environment proses ("" bila tidak di-set); env =
// hasil akhir config (termasuk default YAML), hanya untuk log.
//
// APP_ENV=development yang di-set eksplisit: secret lemah dibiarkan (dengan
// peringatan), kecuali kosong. Default "development" dari config.yaml TIDAK
// dihitung, karena itulah keadaan .env produksi yang kehilangan APP_ENV dan
// JWT_SECRET sekaligus.
//
// Selain itu: proses TIDAK dimatikan, karena gateway ini juga melayani produk
// berbayar (aktivasi lisensi, webhook pembayaran). Yang dimatikan hanya auth
// admin: provider memakai secret acak di memori (token rakitan dari nilai
// repo tidak sah) dan /api/admin/** menjawab 503 sampai JWT_SECRET diganti.
func guardJWTSecret(secret, env, explicitEnv string) (string, bool) {
	err := auth.CheckJWTSecret(secret)
	if err == nil {
		return secret, true
	}
	if explicitEnv == "development" && secret != "" {
		slog.Warn("JWT_SECRET lemah; dibiarkan karena APP_ENV=development di-set eksplisit", "alasan", err)
		return secret, true
	}
	slog.Error("JWT_SECRET ditolak: auth admin console DIMATIKAN (503) sampai JWT_SECRET di .env diganti; rute publik tetap berjalan. Lokal: jalankan dengan APP_ENV=development",
		"alasan", err, "env", env, "app_env_eksplisit", explicitEnv, "sidik", auth.JWTSecretFingerprint(secret))
	return auth.RandomJWTSecret(), false
}

// adminAuthDisabled menjawab semua /api/admin/** saat JWT_SECRET ditolak.
func adminAuthDisabled(c fiber.Ctx) error {
	return errResponse(c, apperr.NewServiceUnavailable(
		"Login console dimatikan: JWT_SECRET server tidak aman. Operator harus mengganti JWT_SECRET di .env lalu memulai ulang gateway (lokal: jalankan dengan APP_ENV=development)."))
}

func (s *Server) Start() error {
	addr := fmt.Sprintf(":%d", s.cfg.App.Port)
	slog.Info("gateway server dimulai", "port", s.cfg.App.Port, "env", s.cfg.App.Env)
	return s.app.Listen(addr)
}

func (s *Server) Shutdown() error {
	return s.app.Shutdown()
}

func (s *Server) App() *fiber.App {
	return s.app
}

// globalErrorHandler is the Fiber error handler for unhandled errors.
func globalErrorHandler(c fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError

	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}

	slog.Error("unhandled error", "status", code, "error", err, "path", c.Path())

	return c.Status(code).JSON(response{
		Data: nil,
		Errors: &errorBody{
			Code:    "INTERNAL_ERROR",
			Message: "Terjadi kesalahan internal",
		},
	})
}
