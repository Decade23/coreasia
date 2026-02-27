package repository

import (
	"context"
	"fmt"

	"github.com/coreasia/gateway/internal/model"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PlanRepo struct {
	pool *pgxpool.Pool
}

func NewPlanRepo(pool *pgxpool.Pool) *PlanRepo {
	return &PlanRepo{pool: pool}
}

// ListActive returns all active subscription plans from the public schema.
func (r *PlanRepo) ListActive(ctx context.Context) ([]model.SubscriptionPlan, error) {
	query := `
		SELECT id, name, max_assessees, max_schemes, features, price_monthly, is_active, created_at
		FROM public.subscription_plans
		WHERE is_active = true
		ORDER BY price_monthly ASC
	`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("querying active plans: %w", err)
	}
	defer rows.Close()

	var plans []model.SubscriptionPlan
	for rows.Next() {
		var p model.SubscriptionPlan
		if err := rows.Scan(
			&p.ID, &p.Name, &p.MaxAssessees, &p.MaxSchemes,
			&p.Features, &p.PriceMonthly, &p.IsActive, &p.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scanning plan row: %w", err)
		}
		plans = append(plans, p)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating plan rows: %w", err)
	}

	return plans, nil
}

// FindByID returns a single subscription plan by ID.
func (r *PlanRepo) FindByID(ctx context.Context, id uuid.UUID) (*model.SubscriptionPlan, error) {
	query := `
		SELECT id, name, max_assessees, max_schemes, features, price_monthly, is_active, created_at
		FROM public.subscription_plans
		WHERE id = $1
	`

	var p model.SubscriptionPlan
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&p.ID, &p.Name, &p.MaxAssessees, &p.MaxSchemes,
		&p.Features, &p.PriceMonthly, &p.IsActive, &p.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("finding plan by id: %w", err)
	}

	return &p, nil
}
