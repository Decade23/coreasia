package service

import (
	"context"
	"github.com/coreasia/gateway/internal/model"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"
)

type playSyncFakeStore struct{ days []model.LeadkuPlayDay }

func (s *playSyncFakeStore) ImportPlay(_ context.Context, days []model.LeadkuPlayDay) error {
	s.days = append(s.days, days...)
	return nil
}
func (s *playSyncFakeStore) PlaySyncStatus(context.Context) (model.LeadkuPlaySyncStatus, error) {
	return model.LeadkuPlaySyncStatus{}, nil
}
func (s *playSyncFakeStore) RecordPlaySync(context.Context, bool, string) error { return nil }

type playReportTransport func(*http.Request) (*http.Response, error)

func (f playReportTransport) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }
func TestLeadkuPlaySyncMonthBoundaryAndScope(t *testing.T) {
	store := &playSyncFakeStore{}
	s := &LeadkuPlaySync{store: store, bucket: "pubsite_prod_rev_12345"}
	var objects []string
	client := &http.Client{Transport: playReportTransport(func(r *http.Request) (*http.Response, error) {
		if r.URL.Host != "storage.googleapis.com" || !strings.Contains(r.URL.Path, "installs_id.coreasia.leadku_") {
			t.Fatalf("wrong scope %s", r.URL)
		}
		objects = append(objects, r.URL.Path)
		body := ""
		status := 404
		if strings.Contains(r.URL.Path, "202603_country") {
			status = 200
			body = "Date,Package Name,Country,Daily Device Installs,Daily Device Uninstalls,Current Device Installs,Installs on active devices\n2026-03-30,id.coreasia.leadku,ID,3,1,10,8\n"
		}
		return &http.Response{StatusCode: status, Body: io.NopCloser(strings.NewReader(body)), Header: make(http.Header)}, nil
	})}
	n, err := s.pullReports(context.Background(), client, time.Date(2026, 3, 31, 0, 0, 0, 0, time.UTC))
	if err != nil || n != 1 || len(objects) != 3 || !strings.Contains(objects[1], "202602_country") || !strings.Contains(objects[2], "202601_country") {
		t.Fatalf("months %v count%d err%v", objects, n, err)
	}
	if *store.days[0].CurrentInstalls != 10 || *store.days[0].ActiveInstalls != 8 {
		t.Fatal("official device counts lost")
	}
}
func TestLeadkuPlaySyncUnavailableAndDenied(t *testing.T) {
	for _, status := range []int{404, 403} {
		s := &LeadkuPlaySync{store: &playSyncFakeStore{}, bucket: "pubsite_prod_12345"}
		client := &http.Client{Transport: playReportTransport(func(*http.Request) (*http.Response, error) {
			return &http.Response{StatusCode: status, Body: io.NopCloser(strings.NewReader(""))}, nil
		})}
		if _, err := s.pullReports(context.Background(), client, time.Now()); err == nil {
			t.Fatalf("status%d advertised success", status)
		}
	}
}
