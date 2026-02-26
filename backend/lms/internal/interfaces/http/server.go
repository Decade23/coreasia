package http

import (
	"fmt"
	"log/slog"

	"github.com/coreasia/lms-api/internal/application/usecase"
	"github.com/coreasia/lms-api/internal/domain/valueobject"
	"github.com/coreasia/lms-api/internal/infrastructure"
	infraAuth "github.com/coreasia/lms-api/internal/infrastructure/auth"
	"github.com/coreasia/lms-api/internal/infrastructure/persistence/postgres"
	infraRepo "github.com/coreasia/lms-api/internal/infrastructure/persistence/repository"
	"github.com/coreasia/lms-api/internal/interfaces/http/handler"
	"github.com/coreasia/lms-api/internal/interfaces/http/middleware"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/recover"
)

type Server struct {
	app *fiber.App
	cfg *infrastructure.Config
	db  *postgres.TenantDB
}

func NewServer(cfg *infrastructure.Config, db *postgres.TenantDB) *Server {
	app := fiber.New(fiber.Config{
		AppName:      cfg.App.Name,
		ErrorHandler: middleware.GlobalErrorHandler,
	})

	s := &Server{app: app, cfg: cfg, db: db}
	s.setupMiddleware()
	s.setupRoutes()

	return s
}

func (s *Server) setupMiddleware() {
	s.app.Use(recover.New())
	s.app.Use(middleware.RequestID())
	s.app.Use(middleware.RequestLogger())

	s.app.Use(cors.New(cors.Config{
		AllowOrigins:     s.cfg.CORS.AllowedOrigins,
		AllowMethods:     s.cfg.CORS.AllowedMethods,
		AllowHeaders:     s.cfg.CORS.AllowedHeaders,
		AllowCredentials: true,
	}))
}

func (s *Server) setupRoutes() {
	// Providers
	jwtProvider := infraAuth.NewJWTProvider(s.cfg.JWT)

	// Repositories
	userRepo := infraRepo.NewUserRepo(s.db)
	schemeRepo := infraRepo.NewSchemeRepo(s.db)
	questionRepo := infraRepo.NewQuestionRepo(s.db)
	scheduleRepo := infraRepo.NewScheduleRepo(s.db)
	assessorRepo := infraRepo.NewAssessorRepo(s.db)
	verificationRepo := infraRepo.NewVerificationRepo(s.db)
	settingsRepo := infraRepo.NewTenantSettingsRepo(s.db)
	auditRepo := infraRepo.NewAuditLogRepo(s.db)
	notifRepo := infraRepo.NewNotificationRepo(s.db)

	// Use Cases
	authUC := usecase.NewAuthUseCase(userRepo, jwtProvider)
	schemeUC := usecase.NewSchemeUseCase(schemeRepo)
	questionUC := usecase.NewQuestionUseCase(questionRepo)
	scheduleUC := usecase.NewScheduleUseCase(scheduleRepo)
	assessorUC := usecase.NewAssessorUseCase(assessorRepo, userRepo)
	verificationUC := usecase.NewVerificationUseCase(verificationRepo)

	// Middleware
	authMw := middleware.AuthMiddleware(jwtProvider)
	tenantMw := middleware.TenantResolver(s.db, s.cfg.Tenant)

	// Health (no tenant required)
	healthHandler := handler.NewHealthHandler(s.db)
	healthHandler.RegisterRoutes(s.app)

	// API group (tenant required)
	api := s.app.Group("/api", tenantMw)

	// Auth routes (public + protected)
	authHandler := handler.NewAuthHandler(authUC)
	authHandler.RegisterRoutes(api, authMw)

	// Tenant settings, audit trail, notifications
	tenantHandler := handler.NewTenantHandler(settingsRepo, auditRepo, notifRepo)
	tenantHandler.RegisterRoutes(api, authMw)

	// Admin CRUD routes (admin + super_admin only)
	admin := api.Group("", authMw, middleware.RequireRoles(
		valueobject.RoleSuperAdmin,
		valueobject.RoleAdmin,
	))

	schemeHandler := handler.NewSchemeHandler(schemeUC)
	schemeHandler.RegisterRoutes(admin)

	questionHandler := handler.NewQuestionHandler(questionUC)
	questionHandler.RegisterRoutes(admin)

	scheduleHandler := handler.NewScheduleHandler(scheduleUC)
	scheduleHandler.RegisterRoutes(admin)

	assessorHandler := handler.NewAssessorHandler(assessorUC)
	assessorHandler.RegisterRoutes(admin)

	// Verification routes (admin + quality_manager)
	verificationGroup := api.Group("", authMw, middleware.RequireRoles(
		valueobject.RoleSuperAdmin,
		valueobject.RoleAdmin,
		valueobject.RoleQualityManager,
	))

	verificationHandler := handler.NewVerificationHandler(verificationUC)
	verificationHandler.RegisterRoutes(verificationGroup)
}

func (s *Server) Start() error {
	addr := fmt.Sprintf(":%d", s.cfg.App.Port)
	slog.Info("server dimulai", "port", s.cfg.App.Port, "env", s.cfg.App.Env)
	return s.app.Listen(addr)
}

func (s *Server) Shutdown() error {
	return s.app.Shutdown()
}

func (s *Server) App() *fiber.App {
	return s.app
}
