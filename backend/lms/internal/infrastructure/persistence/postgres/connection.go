package postgres

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/coreasia/lms-api/internal/infrastructure"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TenantDB struct {
	Pool *pgxpool.Pool
}

func NewConnection(ctx context.Context, cfg infrastructure.DatabaseConfig) (*TenantDB, error) {
	poolConfig, err := pgxpool.ParseConfig(cfg.DSN())
	if err != nil {
		return nil, fmt.Errorf("parsing dsn: %w", err)
	}

	poolConfig.MaxConns = cfg.MaxConns
	poolConfig.MinConns = cfg.MinConns

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return nil, fmt.Errorf("membuat connection pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping database: %w", err)
	}

	slog.Info("database terhubung",
		"host", cfg.Host,
		"port", cfg.Port,
		"database", cfg.Name,
	)

	return &TenantDB{Pool: pool}, nil
}

func (db *TenantDB) Close() {
	db.Pool.Close()
}

func (db *TenantDB) WithSchema(ctx context.Context, schema string) (pgx.Tx, error) {
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("memulai transaksi: %w", err)
	}

	_, err = tx.Exec(ctx, fmt.Sprintf("SET search_path TO %s, public", pgx.Identifier{schema}.Sanitize()))
	if err != nil {
		tx.Rollback(ctx)
		return nil, fmt.Errorf("set search_path ke %s: %w", schema, err)
	}

	return tx, nil
}

func (db *TenantDB) ExecInSchema(ctx context.Context, schema string, fn func(tx pgx.Tx) error) error {
	tx, err := db.WithSchema(ctx, schema)
	if err != nil {
		return err
	}

	if err := fn(tx); err != nil {
		tx.Rollback(ctx)
		return err
	}

	return tx.Commit(ctx)
}

func (db *TenantDB) QueryInSchema(ctx context.Context, schema, query string, args ...interface{}) (pgx.Rows, error) {
	conn, err := db.Pool.Acquire(ctx)
	if err != nil {
		return nil, fmt.Errorf("acquiring connection: %w", err)
	}

	_, err = conn.Exec(ctx, fmt.Sprintf("SET search_path TO %s, public", pgx.Identifier{schema}.Sanitize()))
	if err != nil {
		conn.Release()
		return nil, fmt.Errorf("set search_path: %w", err)
	}

	rows, err := conn.Query(ctx, query, args...)
	if err != nil {
		conn.Release()
		return nil, err
	}

	return rows, nil
}
