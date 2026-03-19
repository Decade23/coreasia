package main

import (
	"context"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"time"

	"github.com/coreasia/gateway/internal/config"
	"github.com/coreasia/gateway/internal/handler"
	"github.com/coreasia/gateway/internal/repository"
	"github.com/coreasia/gateway/internal/service"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	configPath := flag.String("config", "configs/config.yaml", "path to config file")
	runMigrate := flag.Bool("migrate", false, "run database migrations")
	runSeed := flag.Bool("seed", false, "seed initial admin user")
	flag.Parse()

	setupLogger()

	cfg, err := config.Load(*configPath)
	if err != nil {
		slog.Error("gagal memuat konfigurasi", "error", err)
		os.Exit(1)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Connect to PostgreSQL
	pool, err := connectDB(ctx, cfg.Database)
	if err != nil {
		slog.Error("gagal terhubung ke database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	if *runMigrate || *runSeed {
		if *runMigrate {
			runMigrations(cfg.Database.DSN())
		}
		if *runSeed {
			seedAdminUser(ctx, pool, cfg)
		}
		return
	}

	// Create and start HTTP server
	server := handler.NewServer(cfg, pool)

	// Start article bot scheduler (generates 1 article/day at 08:00 WIB)
	// Bot checks DB for API key dynamically, so start even without env key
	{
		articleRepo := repository.NewArticleRepo(pool)
		auditRepo := repository.NewAuditLogRepo(pool)
		apiKeyRepo := repository.NewAPIKeyRepo(pool)
		bot := service.NewArticleBot(cfg.AI, articleRepo, auditRepo, apiKeyRepo)
		go runArticleBot(ctx, bot)
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		if err := server.Start(); err != nil {
			slog.Error("server error", "error", err)
			quit <- syscall.SIGTERM
		}
	}()

	<-quit
	slog.Info("menerima sinyal shutdown...")

	if err := server.Shutdown(); err != nil {
		slog.Error("gagal shutdown server", "error", err)
	}

	slog.Info("gateway server berhenti")
}

// runArticleBot runs the article bot on a daily schedule (08:00 WIB).
func runArticleBot(ctx context.Context, bot *service.ArticleBot) {
	wib := time.FixedZone("WIB", 7*60*60)

	for {
		now := time.Now().In(wib)
		next := time.Date(now.Year(), now.Month(), now.Day(), 8, 0, 0, 0, wib)
		if now.After(next) {
			next = next.Add(24 * time.Hour)
		}
		wait := time.Until(next)
		slog.Info("article-bot: jadwal generate berikutnya", "waktu", next.Format("2006-01-02 15:04 WIB"), "tunggu", wait.Round(time.Minute))

		select {
		case <-ctx.Done():
			slog.Info("article-bot: shutdown")
			return
		case <-time.After(wait):
			if err := bot.Run(ctx); err != nil {
				slog.Error("article-bot: gagal generate", "error", err)
			}
		}
	}
}

func setupLogger() {
	h := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})
	slog.SetDefault(slog.New(h))
}

func connectDB(ctx context.Context, cfg config.DatabaseConfig) (*pgxpool.Pool, error) {
	poolConfig, err := pgxpool.ParseConfig(cfg.DSN())
	if err != nil {
		return nil, err
	}

	poolConfig.MaxConns = cfg.MaxConns
	poolConfig.MinConns = cfg.MinConns

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return nil, err
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}

	slog.Info("database terhubung",
		"host", cfg.Host,
		"port", cfg.Port,
		"database", cfg.Name,
	)

	return pool, nil
}

func runMigrations(dsn string) {
	slog.Info("menjalankan migrasi database...")

	// Use separate migration table to avoid conflict with LMS migrations
	dsnWithTable := dsn
	if !strings.Contains(dsnWithTable, "x-migrations-table") {
		sep := "?"
		if strings.Contains(dsnWithTable, "?") {
			sep = "&"
		}
		dsnWithTable += sep + "x-migrations-table=gateway_schema_migrations"
	}

	m, err := migrate.New("file://migrations", dsnWithTable)
	if err != nil {
		slog.Error("gagal membuat migrator", "error", err)
		os.Exit(1)
	}
	defer m.Close()

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		slog.Error("gagal menjalankan migrasi", "error", err)
		os.Exit(1)
	}

	version, dirty, _ := m.Version()
	slog.Info("migrasi selesai", "version", version, "dirty", dirty)
}

func seedAdminUser(ctx context.Context, pool *pgxpool.Pool, cfg *config.Config) {
	email := os.Getenv("ADMIN_EMAIL")
	password := os.Getenv("ADMIN_PASSWORD")
	fullName := os.Getenv("ADMIN_NAME")

	if email == "" || password == "" {
		slog.Error("ADMIN_EMAIL dan ADMIN_PASSWORD harus di-set untuk seed")
		os.Exit(1)
	}
	if fullName == "" {
		fullName = "Administrator"
	}

	// Check if admin already exists
	var exists bool
	err := pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM public.admin_users WHERE email = $1)", email).Scan(&exists)
	if err != nil {
		slog.Error("gagal cek admin user", "error", err)
		os.Exit(1)
	}
	if exists {
		slog.Info("admin user sudah ada, skip seed", "email", email)
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		slog.Error("gagal hash password", "error", err)
		os.Exit(1)
	}

	_, err = pool.Exec(ctx,
		`INSERT INTO public.admin_users (email, password_hash, full_name, role)
		 VALUES ($1, $2, $3, 'super_admin')`,
		email, string(hash), fullName,
	)
	if err != nil {
		slog.Error("gagal seed admin user", "error", err)
		os.Exit(1)
	}

	slog.Info("admin user berhasil dibuat", "email", email)
	fmt.Printf("Admin user created: %s\n", email)
}
