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
	"github.com/coreasia/gateway/internal/model"
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

	// Start bot scheduler — reads schedules from DB dynamically
	{
		articleRepo := repository.NewArticleRepo(pool)
		auditRepo := repository.NewAuditLogRepo(pool)
		apiKeyRepo := repository.NewAPIKeyRepo(pool)
		botScheduleRepo := repository.NewBotScheduleRepo(pool)
		bot := service.NewArticleBot(cfg.AI, articleRepo, auditRepo, apiKeyRepo)
		go runBotScheduler(ctx, bot, botScheduleRepo)
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

// runBotScheduler polls DB every 60s for active bot schedules and runs them at the configured time.
func runBotScheduler(ctx context.Context, articleBot *service.ArticleBot, scheduleRepo *repository.BotScheduleRepo) {
	slog.Info("bot-scheduler: dimulai")
	ticker := time.NewTicker(60 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			slog.Info("bot-scheduler: shutdown")
			return
		case <-ticker.C:
			bots, err := scheduleRepo.FindAll(ctx)
			if err != nil {
				slog.Error("bot-scheduler: gagal baca schedule", "error", err)
				continue
			}
			for _, bot := range bots {
				if !bot.IsActive {
					continue
				}
				if shouldRun(bot) {
					slog.Info("bot-scheduler: menjalankan bot", "name", bot.Name, "type", bot.BotType)
					var runErr error
					switch bot.BotType {
					case "article_generator":
						runErr = articleBot.Run(ctx)
					default:
						slog.Warn("bot-scheduler: tipe bot tidak dikenal", "type", bot.BotType)
						continue
					}
					status := "success"
					var errMsg *string
					if runErr != nil {
						status = "error"
						msg := runErr.Error()
						errMsg = &msg
						slog.Error("bot-scheduler: gagal jalankan bot", "name", bot.Name, "error", runErr)
					}
					scheduleRepo.UpdateRunStatus(ctx, bot.ID, status, errMsg)
				}
			}
		}
	}
}

// shouldRun checks if a bot should run now based on schedule (HH:MM) and timezone.
func shouldRun(bot model.BotSchedule) bool {
	loc, err := time.LoadLocation(bot.Timezone)
	if err != nil {
		loc = time.FixedZone("WIB", 7*60*60)
	}
	now := time.Now().In(loc)
	hour, min := now.Hour(), now.Minute()
	schedHour, schedMin := 8, 0
	fmt.Sscanf(bot.Schedule, "%d:%d", &schedHour, &schedMin)

	// Run if within the same minute as scheduled
	if hour != schedHour || min != schedMin {
		return false
	}

	// Don't run if already ran today
	if bot.LastRunAt != nil {
		lastRun := bot.LastRunAt.In(loc)
		if lastRun.Year() == now.Year() && lastRun.YearDay() == now.YearDay() {
			return false
		}
	}
	return true
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
