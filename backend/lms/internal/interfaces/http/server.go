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
		AllowOrigins: s.cfg.CORS.AllowedOrigins,
		AllowMethods: s.cfg.CORS.AllowedMethods,
		AllowHeaders: s.cfg.CORS.AllowedHeaders,
		AllowCredentials: true,
	}))
}

func (s *Server) setupRoutes() {
	jwtProvider := infraAuth.NewJWTProvider(s.cfg.JWT)

	userRepo := infraRepo.NewUserRepo(s.db)
	authUC := usecase.NewAuthUseCase(userRepo, jwtProvider)

	authMw := middleware.AuthMiddleware(jwtProvider)
	tenantMw := middleware.TenantResolver(s.db, s.cfg.Tenant)

	healthHandler := handler.NewHealthHandler(s.db)
	healthHandler.RegisterRoutes(s.app)

	api := s.app.Group("/api", tenantMw)

	authHandler := handler.NewAuthHandler(authUC)
	authHandler.RegisterRoutes(api, authMw)

	_ = authMw
	_ = api

	// Admin routes (Sprint 2+)
	admin := api.Group("", authMw, middleware.RequireRoles(
		valueobject.RoleSuperAdmin,
		valueobject.RoleAdmin,
	))
	_ = admin

	// Quality Manager routes (Sprint 4)
	quality := api.Group("/quality", authMw, middleware.RequireRoles(
		valueobject.RoleSuperAdmin,
		valueobject.RoleAdmin,
		valueobject.RoleQualityManager,
	))
	_ = quality
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
