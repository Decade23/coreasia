package handler

import (
	"fmt"
	"log/slog"
	"time"

	"github.com/coreasia/gateway/internal/auth"
	"github.com/coreasia/gateway/internal/config"
	mw "github.com/coreasia/gateway/internal/middleware"
	"github.com/coreasia/gateway/internal/rbac"
	"github.com/coreasia/gateway/internal/repository"
	"github.com/coreasia/gateway/internal/service"
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
	app := fiber.New(fiber.Config{
		AppName:      cfg.App.Name,
		ErrorHandler: globalErrorHandler,
		BodyLimit:    10 * 1024 * 1024, // 10MB for file uploads
	})

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
	}))
}

func (s *Server) setupRoutes() {
	// Repositories
	tenantRepo := repository.NewTenantRepo(s.pool)
	planRepo := repository.NewPlanRepo(s.pool)
	adminUserRepo := repository.NewAdminUserRepo(s.pool)
	articleRepo := repository.NewArticleRepo(s.pool)
	auditLogRepo := repository.NewAuditLogRepo(s.pool)

	// Services
	provisioner := service.NewProvisioner(
		s.pool,
		tenantRepo,
		s.cfg.Database.DSN(),
		"../lms/migrations/tenant",
	)
	midtransService := service.NewMidtransService(s.cfg.Midtrans)

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
	jwtProvider := auth.NewJWTProvider(s.cfg.JWT.Secret, accessTTL, refreshTTL, s.cfg.JWT.Issuer)

	// Rate limiters
	aiRateLimiter := mw.NewRateLimiter(10, 1*time.Hour)
	loginRateLimiter := mw.NewIPRateLimiter(5, 15*time.Minute, s.cfg.App.Env == "development")

	// Handlers
	healthHandler := NewHealthHandler(s.pool)
	plansHandler := NewPlansHandler(planRepo)
	onboardingHandler := NewOnboardingHandler(tenantRepo, planRepo, provisioner, midtransService)
	authHandler := NewAuthHandler(adminUserRepo, auditLogRepo, jwtProvider)
	articleHandler := NewArticleHandler(articleRepo, auditLogRepo)
	adminUserHandler := NewAdminUserHandler(adminUserRepo, auditLogRepo)
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

	// Auth middleware
	authMiddleware := mw.AuthMiddleware(jwtProvider)

	// Routes
	healthHandler.RegisterRoutes(s.app)

	api := s.app.Group("/api")

	// Existing routes
	plansHandler.RegisterRoutes(api)
	onboardingHandler.RegisterRoutes(api)

	// Public article routes
	api.Get("/articles", articleHandler.ListPublished)
	api.Get("/articles/:slug", articleHandler.GetBySlug)

	// Admin auth routes (no auth required, login rate limited)
	adminAuth := api.Group("/admin/auth")
	adminAuth.Post("/login", loginRateLimiter.Middleware(), authHandler.Login)
	adminAuth.Post("/refresh", authHandler.Refresh)

	// Protected admin routes
	admin := api.Group("/admin", authMiddleware)

	// Auth (self-service, no permission check)
	admin.Get("/auth/me", authHandler.Me)
	admin.Post("/auth/logout", authHandler.Logout)
	admin.Get("/auth/permissions", authHandler.Permissions)

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
	admin.Get("/users", mw.RequirePermission(rbac.UsersList), adminUserHandler.List)
	admin.Post("/users", mw.RequirePermission(rbac.UsersCreate), adminUserHandler.Create)
	admin.Put("/users/:id", mw.RequirePermission(rbac.UsersUpdate), adminUserHandler.Update)
	admin.Delete("/users/:id", mw.RequirePermission(rbac.UsersDelete), adminUserHandler.Delete)

	// API key management
	admin.Get("/api-keys", mw.RequirePermission(rbac.APIKeysList), apiKeyHandler.List)
	admin.Get("/api-keys/:id", mw.RequirePermission(rbac.APIKeysView), apiKeyHandler.GetByID)
	admin.Get("/api-keys/:id/copy", mw.RequirePermission(rbac.APIKeysCopy), apiKeyHandler.CopyKey)
	admin.Post("/api-keys", mw.RequirePermission(rbac.APIKeysCreate), apiKeyHandler.Create)
	admin.Put("/api-keys/:id", mw.RequirePermission(rbac.APIKeysUpdate), apiKeyHandler.Update)
	admin.Delete("/api-keys/:id", mw.RequirePermission(rbac.APIKeysDelete), apiKeyHandler.Delete)

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
