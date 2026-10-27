// Local acceptance harness. Never starts article bots, sends real email, or
// connects to any configured production database/CRM.
package main

import (
	"context"
	"github.com/coreasia/gateway/internal/config"
	"github.com/coreasia/gateway/internal/handler"
	"github.com/coreasia/gateway/internal/repository"
	"github.com/coreasia/gateway/internal/service"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/jackc/pgx/v5/pgxpool"
	"log"
	"os"
)

func main() {
	if os.Getenv("ALLOW_LOCAL_BRIEF_UAT") != "1" {
		log.Fatal("set ALLOW_LOCAL_BRIEF_UAT=1 for the disposable local harness")
	}
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, "postgres://postgres@127.0.0.1:55483/brief_test?sslmode=disable")
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()
	repo := repository.NewContactLeadRepo(pool)
	crm := service.NewCRMService(config.CRMConfig{LeadKuLeadURL: "http://127.0.0.1:13091/api/v1/public/website-lead", LeadKuIngestToken: "local-brief-acceptance-only"})
	go service.NewLeadDispatcher(repo, service.NewEmailService(config.EmailConfig{}), crm).Run(ctx)
	app := fiber.New()
	app.Use(cors.New(cors.Config{AllowOrigins: []string{"http://localhost:3009", "http://127.0.0.1:3009"}}))
	app.Post("/api/public/leads", handler.NewContactLeadHandler(repo).Create)
	log.Fatal(app.Listen("127.0.0.1:8084"))
}
