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
	"github.com/coreasia/lms-api/internal/seeder"
)

func main() {
	configPath := flag.String("config", "configs/config.yaml", "path to config file")
	migrate := flag.Bool("migrate", false, "run database migrations")
	seed := flag.Bool("seed", false, "run system seeds after migrations")
	seedDev := flag.Bool("seed-dev", false, "run system + dev seeds after migrations")
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

	if *migrate || *seed || *seedDev {
		runBootstrap(cfg, db, ctx, *seed || *seedDev, *seedDev)
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

func runBootstrap(cfg *infrastructure.Config, db *postgres.TenantDB, ctx context.Context, includeSeeds bool, includeDev bool) {
	slog.Info("menjalankan bootstrap database", "include_seeds", includeSeeds, "include_dev", includeDev)

	migrator := postgres.NewMigrator(cfg.Database.DSN(), "migrations/global", "migrations/tenant")
	s := seeder.NewSeeder(db.Pool)

	if err := migrator.RunGlobal(); err != nil {
		slog.Error("gagal migrasi global", "error", err)
		os.Exit(1)
	}

	if includeSeeds {
		if err := s.RunGlobalSystem(ctx); err != nil {
			slog.Error("gagal seed global system", "error", err)
			os.Exit(1)
		}

		if includeDev {
			if err := s.RunGlobalDev(ctx); err != nil {
				slog.Error("gagal seed global dev", "error", err)
				os.Exit(1)
			}
		}
	}

	provisioner := postgres.NewTenantProvisioner(db, migrator)
	if includeSeeds {
		provisioner.SetSeeder(s)
	}

	schemas, err := provisioner.ListTenantSchemas(ctx)
	if err != nil {
		slog.Error("tidak dapat list tenant schemas", "error", err)
		os.Exit(1)
	}

	for _, schema := range schemas {
		if err := provisioner.Provision(ctx, schema); err != nil {
			slog.Error("gagal provision tenant", "schema", schema, "error", err)
			os.Exit(1)
		}
		if includeSeeds && includeDev {
			if err := s.RunTenantDev(ctx, schema); err != nil {
				slog.Error("gagal seed tenant dev", "schema", schema, "error", err)
				os.Exit(1)
			}
		}
	}

	slog.Info("bootstrap database selesai", "tenant_count", len(schemas), "include_seeds", includeSeeds, "include_dev", includeDev)
}
