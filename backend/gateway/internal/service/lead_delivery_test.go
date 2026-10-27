package service

import (
	"context"
	"errors"
	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/internal/repository"
	"testing"
	"time"
)

type deliveryFixture struct {
	job    *repository.LeadDelivery
	status string
	delay  time.Duration
}

func (f *deliveryFixture) ClaimDelivery(context.Context) (*repository.LeadDelivery, error) {
	return f.job, nil
}
func (f *deliveryFixture) LoadLead(context.Context, string) (*model.ContactLead, error) {
	return &model.ContactLead{}, nil
}
func (f *deliveryFixture) CompleteDelivery(_ context.Context, _ *repository.LeadDelivery, s string, d time.Duration) error {
	f.status = s
	f.delay = d
	return nil
}
func TestLeadDeliveryRetryAndConfiguration(t *testing.T) {
	for _, tc := range []struct {
		name     string
		attempts int
		err      error
		status   string
	}{
		{"success", 1, nil, "sent"}, {"provider outage", 1, errors.New("outage"), "retry"}, {"retry exhausted", 8, errors.New("outage"), "failed"}, {"missing configuration", 8, ErrLeadDeliveryUnconfigured, "blocked"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			f := &deliveryFixture{job: &repository.LeadDelivery{Channel: "crm", Attempts: tc.attempts}}
			d := LeadDispatcher{store: f, crm: func(context.Context, *model.ContactLead) error { return tc.err }}
			found, err := d.DispatchOne(context.Background())
			if !found || err != nil || f.status != tc.status {
				t.Fatalf("found=%v err=%v status=%s", found, err, f.status)
			}
			if tc.status == "retry" && f.delay != 30*time.Second {
				t.Fatalf("delay=%v", f.delay)
			}
		})
	}
}
