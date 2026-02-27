package handler

import (
	"fmt"
	"log/slog"

	"github.com/coreasia/gateway/internal/config"
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
		origins = []string{"http://localhost:3000", "https://coreasia.id"}
	}

	s.app.Use(cors.New(cors.Config{
		AllowOrigins:     origins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Accept"},
		AllowCredentials: false,
	}))
}

func (s *Server) setupRoutes() {
	// Repositories
	tenantRepo := repository.NewTenantRepo(s.pool)
	planRepo := repository.NewPlanRepo(s.pool)

	// Services
	provisioner := service.NewProvisioner(
		s.pool,
		tenantRepo,
		s.cfg.Database.DSN(),
		"../lms/migrations/tenant",
	)

	// Handlers
	healthHandler := NewHealthHandler(s.pool)
	plansHandler := NewPlansHandler(planRepo)
	onboardingHandler := NewOnboardingHandler(tenantRepo, planRepo, provisioner)

	// Routes
	healthHandler.RegisterRoutes(s.app)

	api := s.app.Group("/api")
	plansHandler.RegisterRoutes(api)
	onboardingHandler.RegisterRoutes(api)
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
