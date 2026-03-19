package handler

import (
	"fmt"
	"log/slog"
	"time"

	"github.com/coreasia/gateway/internal/auth"
	"github.com/coreasia/gateway/internal/config"
	mw "github.com/coreasia/gateway/internal/middleware"
	"github.com/coreasia/gateway/internal/repository"
	"github.com/coreasia/gateway/internal/service"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/recover"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Server struct {
	app  *fiber.App
	cfg  *config.Config
	pool *pgxpool.Pool
}

func NewServer(cfg *config.Config, pool *pgxpool.Pool) *Server {
	app := fiber.New(fiber.Config{
		AppName:      cfg.App.Name,
		ErrorHandler: globalErrorHandler,
		BodyLimit:    10 * 1024 * 1024, // 10MB for file uploads
	})

	s := &Server{app: app, cfg: cfg, pool: pool}
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
	aiHandler := NewAIHandler(s.cfg.AI, auditLogRepo, apiKeyRepo)
	auditHandler := NewAuditHandler(auditLogRepo)
	apiKeyHandler := NewAPIKeyHandler(apiKeyRepo, auditLogRepo)

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
	admin.Get("/auth/me", authHandler.Me)
	admin.Post("/auth/logout", authHandler.Logout)

	// Article management
	admin.Get("/articles", articleHandler.ListAll)
	admin.Get("/articles/stats", articleHandler.Stats)
	admin.Get("/articles/:id", articleHandler.GetByID)
	admin.Post("/articles", articleHandler.Create)
	admin.Put("/articles/:id", articleHandler.Update)
	admin.Delete("/articles/:id", articleHandler.Delete)
	admin.Post("/articles/:id/publish", articleHandler.Publish)
	admin.Post("/articles/:id/unpublish", articleHandler.Unpublish)

	// File upload
	admin.Post("/upload", uploadHandler.Upload)

	// AI generation (rate limited)
	admin.Post("/ai/generate", aiRateLimiter.Middleware(), aiHandler.Generate)

	// Admin user management
	admin.Get("/users", adminUserHandler.List)
	admin.Post("/users", adminUserHandler.Create)
	admin.Put("/users/:id", adminUserHandler.Update)
	admin.Delete("/users/:id", adminUserHandler.Delete)

	// API key management
	admin.Get("/api-keys", apiKeyHandler.List)
	admin.Get("/api-keys/:id", apiKeyHandler.GetByID)
	admin.Get("/api-keys/:id/copy", apiKeyHandler.CopyKey)
	admin.Post("/api-keys", apiKeyHandler.Create)
	admin.Put("/api-keys/:id", apiKeyHandler.Update)
	admin.Delete("/api-keys/:id", apiKeyHandler.Delete)

	// Audit logs
	admin.Get("/audit-logs", auditHandler.List)
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
