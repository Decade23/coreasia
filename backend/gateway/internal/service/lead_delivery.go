package service

import (
	"context"
	"errors"
	"log/slog"
	"strings"
	"time"

	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/internal/repository"
)

var ErrLeadDeliveryUnconfigured = errors.New("lead delivery is not configured")

type leadDeliveryStore interface {
	ClaimDelivery(context.Context) (*repository.LeadDelivery, error)
	LoadLead(context.Context, string) (*model.ContactLead, error)
	CompleteDelivery(context.Context, *repository.LeadDelivery, string, time.Duration) error
}

// LeadDispatcher resumes durable jobs after restarts. A lease prevents two
// gateway replicas from dispatching the same job concurrently.
type LeadDispatcher struct {
	store leadDeliveryStore
	email func(context.Context, *model.ContactLead) error
	crm   func(context.Context, *model.ContactLead) error
}

func NewLeadDispatcher(store *repository.ContactLeadRepo, email *EmailService, crm *CRMService) *LeadDispatcher {
	return &LeadDispatcher{store: store,
		email: func(ctx context.Context, l *model.ContactLead) error {
			if !email.IsConfigured() || strings.TrimSpace(email.cfg.LeadNotificationEmail) == "" {
				return ErrLeadDeliveryUnconfigured
			}
			return email.SendContactLeadNotification(ctx, l)
		},
		crm: func(ctx context.Context, l *model.ContactLead) error {
			if !crm.IsConfigured() {
				return ErrLeadDeliveryUnconfigured
			}
			return crm.PushContactLead(ctx, l)
		},
	}
}

func (d *LeadDispatcher) Run(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()
	for {
		for i := 0; i < 20; i++ {
			found, err := d.DispatchOne(ctx)
			if err != nil {
				slog.Error("antrean lead belum dapat diproses")
				break
			}
			if !found {
				break
			}
		}
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}

func (d *LeadDispatcher) DispatchOne(ctx context.Context) (bool, error) {
	job, err := d.store.ClaimDelivery(ctx)
	if err != nil || job == nil {
		return false, err
	}
	opctx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()
	lead, err := d.store.LoadLead(opctx, job.LeadID)
	if err == nil {
		switch job.Channel {
		case "email":
			err = d.email(opctx, lead)
		case "crm":
			err = d.crm(opctx, lead)
		default:
			err = errors.New("unknown channel")
		}
	}
	status, delay := "sent", time.Duration(0)
	if errors.Is(err, ErrLeadDeliveryUnconfigured) {
		status, delay = "blocked", time.Hour
	} else if err != nil {
		status = "retry"
		delay = 30 * time.Second * time.Duration(1<<min(job.Attempts-1, 7))
		if job.Attempts >= 8 {
			status = "failed"
		}
	}
	if status == "failed" {
		slog.Warn("pengiriman lead memerlukan tinjauan", "lead_id", job.LeadID, "channel", job.Channel, "attempts", job.Attempts)
	}
	// Never persist provider response bodies, email addresses or tokens in errors.
	finishCtx, finishCancel := context.WithTimeout(context.WithoutCancel(ctx), 5*time.Second)
	defer finishCancel()
	return true, d.store.CompleteDelivery(finishCtx, job, status, delay)
}
