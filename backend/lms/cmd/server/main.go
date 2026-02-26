package main

import (
	"context"
	"flag"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/coreasia/lms-api/internal/infrastructure"
	"github.com/coreasia/lms-api/internal/infrastructure/persistence/postgres"
	httpserver "github.com/coreasia/lms-api/internal/interfaces/http"
)

func main() {
	configPath := flag.String("config", "configs/config.yaml", "path to config file")
	migrate := flag.Bool("migrate", false, "run database migrations")
	flag.Parse()

	setupLogger()

	cfg, err := infrastructure.LoadConfig(*configPath)
	if err != nil {
		slog.Error("gagal memuat konfigurasi", "error", err)
		os.Exit(1)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	db, err := postgres.NewConnection(ctx, cfg.Database)
	if err != nil {
		slog.Error("gagal terhubung ke database", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	if *migrate {
		runMigrations(cfg, db, ctx)
		return
	}

	server := httpserver.NewServer(cfg, db)

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

	slog.Info("server berhenti")
}

func setupLogger() {
	handler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})
	slog.SetDefault(slog.New(handler))
}

func runMigrations(cfg *infrastructure.Config, db *postgres.TenantDB, ctx context.Context) {
	slog.Info("menjalankan migrasi database...")

	migrator := postgres.NewMigrator(cfg.Database.DSN(), "migrations/global", "migrations/tenant")

	if err := migrator.RunGlobal(); err != nil {
		slog.Error("gagal migrasi global", "error", err)
		os.Exit(1)
	}

	provisioner := postgres.NewTenantProvisioner(db, migrator)
	schemas, err := provisioner.ListTenantSchemas(ctx)
	if err != nil {
		slog.Warn("tidak dapat list tenant schemas", "error", err)
		return
	}

	if err := migrator.RunAllTenants(schemas); err != nil {
		slog.Error("gagal migrasi tenant", "error", err)
		os.Exit(1)
	}

	slog.Info("migrasi selesai", "tenant_count", len(schemas))
}
