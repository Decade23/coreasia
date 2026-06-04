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
	examRepo := infraRepo.NewExamRepo(s.db)
	assessmentRepo := infraRepo.NewAssessmentRepo(s.db)
	qualityRepo := infraRepo.NewQualityRepo(s.db)
	certRepo := infraRepo.NewCertificateRepo(s.db)
	certTemplateRepo := infraRepo.NewCertificateTemplateRepo(s.db)

	// Use Cases
	authUC := usecase.NewAuthUseCase(userRepo, jwtProvider)
	schemeUC := usecase.NewSchemeUseCase(schemeRepo)
	questionUC := usecase.NewQuestionUseCase(questionRepo)
	scheduleUC := usecase.NewScheduleUseCase(scheduleRepo)
	assessorUC := usecase.NewAssessorUseCase(assessorRepo, userRepo)
	verificationUC := usecase.NewVerificationUseCase(verificationRepo)
	registrationUC := usecase.NewRegistrationUseCase(userRepo, schemeRepo, verificationRepo, auditRepo)
	examUC := usecase.NewExamUseCase(examRepo, questionRepo, schemeRepo)
	assessmentUC := usecase.NewAssessmentUseCase(assessmentRepo, schemeRepo)
	qualityUC := usecase.NewQualityUseCase(qualityRepo, userRepo, schemeRepo)
	certUC := usecase.NewCertificateUseCase(certRepo, certTemplateRepo, userRepo, schemeRepo)
	reportUC := usecase.NewReportUseCase(s.db)

	// Middleware
	authMw := middleware.AuthMiddleware(jwtProvider)
	tenantMw := middleware.TenantResolver(s.db, s.cfg.Tenant)

	// Health (no tenant required)
	healthHandler := handler.NewHealthHandler(s.db)
	healthHandler.RegisterRoutes(s.app)

	// API group (tenant required)
	api := s.app.Group("/api", tenantMw)

	// Public certificate verification (no auth, but tenant required)
	certHandler := handler.NewCertificateHandler(certUC)
	certHandler.RegisterVerifyRoute(api)

	// Auth routes (public + protected)
	authHandler := handler.NewAuthHandler(authUC)
	authHandler.RegisterRoutes(api, authMw)

	registrationHandler := handler.NewRegistrationHandler(registrationUC)
	registrationHandler.RegisterRoutes(api)

	// Tenant settings, audit trail, notifications
	tenantHandler := handler.NewTenantHandler(settingsRepo, auditRepo, notifRepo)
	tenantHandler.RegisterRoutes(api, authMw)

	adminRoles := middleware.RequireRoles(
		valueobject.RoleSuperAdmin,
		valueobject.RoleAdmin,
	)
	qualityRoles := middleware.RequireRoles(
		valueobject.RoleSuperAdmin,
		valueobject.RoleAdmin,
		valueobject.RoleQualityManager,
	)
	adminAudit := middleware.AuditMutations(auditRepo)

	// Admin CRUD routes (admin + super_admin only)
	api.Use("/schemes", authMw, adminRoles, adminAudit)
	api.Use("/questions", authMw, adminRoles, adminAudit)
	api.Use("/schedules", authMw, adminRoles, adminAudit)
	api.Use("/assessors", authMw, adminRoles, adminAudit)
	api.Use("/users", authMw, adminRoles, adminAudit)
	api.Use("/certificate-templates", authMw, adminRoles, adminAudit)
	api.Use("/reports", authMw, adminRoles, adminAudit)

	schemeHandler := handler.NewSchemeHandler(schemeUC)
	schemeHandler.RegisterRoutes(api)

	questionHandler := handler.NewQuestionHandler(questionUC)
	questionHandler.RegisterRoutes(api)

	scheduleHandler := handler.NewScheduleHandler(scheduleUC)
	scheduleHandler.RegisterRoutes(api)

	assessorHandler := handler.NewAssessorHandler(assessorUC)
	assessorHandler.RegisterRoutes(api)

	// User management (admin only)
	userHandler := handler.NewUserHandler(userRepo)
	userHandler.RegisterRoutes(api)

	// Certificate templates (admin only)
	certHandler.RegisterTemplateRoutes(api)

	// Reports (admin only)
	reportHandler := handler.NewReportHandler(reportUC, auditRepo)
	reportHandler.RegisterRoutes(api)

	// Verification routes (admin + quality_manager)
	api.Use("/verifications", authMw, qualityRoles, adminAudit)
	api.Use("/quality", authMw, qualityRoles, adminAudit)

	verificationHandler := handler.NewVerificationHandler(verificationUC)
	verificationHandler.RegisterRoutes(api)

	// Quality management (admin + quality_manager)
	qualityHandler := handler.NewQualityHandler(qualityUC)
	qualityHandler.RegisterRoutes(api)

	// Certificate list (admin + assessee)
	api.Use("/certificates", authMw, middleware.RequireRoles(
		valueobject.RoleSuperAdmin,
		valueobject.RoleAdmin,
		valueobject.RoleAssessee,
	))
	certHandler.RegisterCertRoutes(api)

	// Exam routes (assessee only)
	api.Use("/exams", authMw, middleware.RequireRoles(
		valueobject.RoleAssessee,
	))

	examHandler := handler.NewExamHandler(examUC)
	examHandler.RegisterRoutes(api)

	// Assessment routes (assessor only)
	api.Use("/assessment", authMw, middleware.RequireRoles(
		valueobject.RoleAssessor,
	))
	api.Use("/assessments", authMw, middleware.RequireRoles(
		valueobject.RoleAssessor,
	))

	assessmentHandler := handler.NewAssessmentHandler(assessmentUC)
	assessmentHandler.RegisterRoutes(api)
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
