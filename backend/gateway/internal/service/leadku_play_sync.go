package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/coreasia/gateway/internal/model"
	"golang.org/x/oauth2/google"
	"io"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"sync"
	"time"
)

type leadkuPlaySyncStore interface {
	ImportPlay(context.Context, []model.LeadkuPlayDay) error
	PlaySyncStatus(context.Context) (model.LeadkuPlaySyncStatus, error)
	RecordPlaySync(context.Context, bool, string) error
}
type LeadkuPlaySync struct {
	store                  leadkuPlaySyncStore
	bucket, credentialFile string
	lock                   sync.Mutex
}

func NewLeadkuPlaySync(store leadkuPlaySyncStore) *LeadkuPlaySync {
	return &LeadkuPlaySync{store: store, bucket: os.Getenv("LEADKU_PLAY_REPORT_BUCKET"), credentialFile: os.Getenv("LEADKU_PLAY_SERVICE_ACCOUNT")}
}
func (s *LeadkuPlaySync) Configured() bool {
	return regexp.MustCompile(`^pubsite_prod(?:_rev)?_[0-9]{5,40}$`).MatchString(s.bucket) && s.credentialFile != ""
}
func (s *LeadkuPlaySync) Status(ctx context.Context) model.LeadkuPlaySyncStatus {
	v, err := s.store.PlaySyncStatus(ctx)
	if err != nil {
		v.Error = "Status sinkronisasi belum tersedia"
	}
	v.Configured = s.Configured()
	return v
}
func (s *LeadkuPlaySync) Start(parent context.Context) func() {
	ctx, cancel := context.WithCancel(parent)
	if !s.Configured() {
		return cancel
	}
	go func() {
		_, _ = s.Sync(ctx)
		ticker := time.NewTicker(6 * time.Hour)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				_, _ = s.Sync(ctx)
			}
		}
	}()
	return cancel
}
func (s *LeadkuPlaySync) Sync(parent context.Context) (int, error) {
	if !s.Configured() {
		return 0, errors.New("Sambungan laporan Google Play belum dikonfigurasi")
	}
	if !s.lock.TryLock() {
		return 0, errors.New("Sinkronisasi laporan masih berjalan")
	}
	defer s.lock.Unlock()
	ctx, cancel := context.WithTimeout(parent, 60*time.Second)
	defer cancel()
	count, err := s.pull(ctx)
	message := ""
	if err != nil {
		message = err.Error()
	}
	recordCtx, done := context.WithTimeout(context.WithoutCancel(parent), 3*time.Second)
	defer done()
	if e := s.store.RecordPlaySync(recordCtx, err == nil, message); e != nil && err == nil {
		return count, errors.New("Status sinkronisasi belum tersimpan")
	}
	return count, err
}
func (s *LeadkuPlaySync) pull(ctx context.Context) (int, error) {
	raw, err := os.ReadFile(s.credentialFile)
	if err != nil || len(raw) > 65536 {
		return 0, errors.New("Kredensial laporan belum tersedia")
	}
	var info struct {
		Type     string `json:"type"`
		TokenURI string `json:"token_uri"`
	}
	if json.Unmarshal(raw, &info) != nil || info.Type != "service_account" || info.TokenURI != "https://oauth2.googleapis.com/token" {
		return 0, errors.New("Kredensial laporan tidak valid")
	}
	cfg, err := google.JWTConfigFromJSON(raw, "https://www.googleapis.com/auth/devstorage.read_only")
	if err != nil {
		return 0, errors.New("Kredensial laporan tidak valid")
	}
	client := cfg.Client(ctx)
	client.Timeout = 20 * time.Second
	client.CheckRedirect = func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }
	return s.pullReports(ctx, client, time.Now().UTC())
}

func (s *LeadkuPlaySync) pullReports(ctx context.Context, client *http.Client, now time.Time) (int, error) {
	total := 0
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	for month := 0; month < 3; month++ {
		object := fmt.Sprintf("stats/installs/installs_id.coreasia.leadku_%s_country.csv", monthStart.AddDate(0, -month, 0).Format("200601"))
		endpoint := "https://storage.googleapis.com/storage/v1/b/" + s.bucket + "/o/" + url.PathEscape(object) + "?alt=media"
		req, _ := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
		res, err := client.Do(req)
		if err != nil {
			return total, errors.New("Sambungan Google Play belum berhasil")
		}
		if res.StatusCode == http.StatusNotFound {
			res.Body.Close()
			continue
		}
		if res.StatusCode != http.StatusOK {
			res.Body.Close()
			return total, fmt.Errorf("Akses laporan Google Play ditolak (%d)", res.StatusCode)
		}
		data, readErr := io.ReadAll(io.LimitReader(res.Body, 5*1024*1024+1))
		res.Body.Close()
		if readErr != nil || len(data) > 5*1024*1024 {
			return total, errors.New("Laporan Google Play belum dapat dibaca")
		}
		days, err := ParseLeadkuPlayReport(object[len("stats/installs/"):], data)
		if err != nil {
			return total, err
		}
		if err = s.store.ImportPlay(ctx, days); err != nil {
			return total, errors.New("Laporan Google Play belum tersimpan")
		}
		total += len(days)
	}
	if total == 0 {
		return 0, errors.New("Laporan instalasi Google Play belum tersedia")
	}
	return total, nil
}
