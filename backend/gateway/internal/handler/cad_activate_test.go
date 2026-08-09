package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/coreasia/gateway/internal/auth"
	mw "github.com/coreasia/gateway/internal/middleware"
	"github.com/coreasia/gateway/internal/model"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

// ───────────────────────── in-memory cadStore stub ─────────────────────────

// fakeCADStore implements cadStore with in-memory state for the activate /
// deactivate / admin-override flows. Only the methods those flows touch carry
// real behaviour; the rest satisfy the interface as no-ops.
type fakeCADStore struct {
	licenses  map[string]*model.CADLicense // by license_key
	installs  []*model.CADInstallation     // all installations
	revokedBy map[uuid.UUID]bool           // revoked-by-id audit (not used directly)
}

func newFakeCADStore() *fakeCADStore {
	return &fakeCADStore{
		licenses:  map[string]*model.CADLicense{},
		revokedBy: map[uuid.UUID]bool{},
	}
}

func (f *fakeCADStore) addLicense(l *model.CADLicense) {
	if l.ID == uuid.Nil {
		l.ID = uuid.New()
	}
	f.licenses[l.LicenseKey] = l
}

func (f *fakeCADStore) addInstall(i *model.CADInstallation) {
	if i.ID == uuid.Nil {
		i.ID = uuid.New()
	}
	if i.Platform == "" {
		i.Platform = "macos"
	}
	f.installs = append(f.installs, i)
}

func (f *fakeCADStore) FindByKey(_ context.Context, key string) (*model.CADLicense, error) {
	return f.licenses[key], nil
}

func (f *fakeCADStore) FindByID(_ context.Context, id uuid.UUID) (*model.CADLicense, error) {
	for _, l := range f.licenses {
		if l.ID == id {
			return l, nil
		}
	}
	return nil, nil
}

func (f *fakeCADStore) FindInstallation(_ context.Context, licenseID uuid.UUID, deviceHash string) (*model.CADInstallation, error) {
	for _, i := range f.installs {
		if i.LicenseID != nil && *i.LicenseID == licenseID && i.DeviceHash == deviceHash {
			return i, nil
		}
	}
	return nil, nil
}

func (f *fakeCADStore) FindActiveInstallationOther(_ context.Context, licenseID uuid.UUID, deviceHash, platform string) (*model.CADInstallation, error) {
	for _, i := range f.installs {
		if i.LicenseID != nil && *i.LicenseID == licenseID && i.DeviceHash != deviceHash && i.Platform == platform && !i.Revoked {
			return i, nil
		}
	}
	return nil, nil
}

func (f *fakeCADStore) RevokeInstallation(_ context.Context, licenseID uuid.UUID, deviceHash string) (int, error) {
	n := 0
	for _, i := range f.installs {
		if i.LicenseID != nil && *i.LicenseID == licenseID && i.DeviceHash == deviceHash && !i.Revoked {
			i.Revoked = true
			n++
		}
	}
	return n, nil
}

func (f *fakeCADStore) RevokeInstallationByID(_ context.Context, id uuid.UUID) (int, error) {
	for _, i := range f.installs {
		if i.ID == id && !i.Revoked {
			i.Revoked = true
			f.revokedBy[id] = true
			return 1, nil
		}
	}
	return 0, nil
}

func (f *fakeCADStore) SetLastTransfer(_ context.Context, licenseID uuid.UUID) error {
	for _, l := range f.licenses {
		if l.ID == licenseID {
			now := time.Now()
			l.LastTransferAt = &now
		}
	}
	return nil
}

func (f *fakeCADStore) SetHolderName(_ context.Context, licenseID uuid.UUID, holderName string) error {
	for _, l := range f.licenses {
		if l.ID == licenseID {
			l.HolderName = &holderName
		}
	}
	return nil
}

func (f *fakeCADStore) CreateInstallation(_ context.Context, i *model.CADInstallation) error {
	i.ID = uuid.New()
	i.FirstSeen = time.Now()
	i.LastSeen = time.Now()
	f.installs = append(f.installs, i)
	return nil
}

func (f *fakeCADStore) TouchInstallation(_ context.Context, id uuid.UUID, _, _ *string) error {
	for _, i := range f.installs {
		if i.ID == id {
			i.LastSeen = time.Now()
			i.Revoked = false
		}
	}
	return nil
}

// ── unused-by-these-tests methods (satisfy interface) ──

func (f *fakeCADStore) FindAll(context.Context) ([]model.CADLicense, error) { return nil, nil }
func (f *fakeCADStore) FindByOrderRef(context.Context, string) (*model.CADLicense, error) {
	return nil, nil
}
func (f *fakeCADStore) Create(context.Context, *model.CADLicense) error { return nil }
func (f *fakeCADStore) Update(context.Context, *model.CADLicense) error { return nil }
func (f *fakeCADStore) Delete(context.Context, uuid.UUID) error         { return nil }
func (f *fakeCADStore) ImportBatch(context.Context, []string, string, *uuid.UUID) (int, error) {
	return 0, nil
}
func (f *fakeCADStore) AssignNextUnsoldLicense(context.Context, string, string) (*model.CADLicense, bool, error) {
	return nil, false, nil
}
func (f *fakeCADStore) ListInstallations(context.Context, *uuid.UUID, int) ([]model.CADInstallation, error) {
	return nil, nil
}
func (f *fakeCADStore) InsertEvent(context.Context, *model.CADTelemetryRequest, *string) error {
	return nil
}
func (f *fakeCADStore) Summary(context.Context) (*model.CADAnalyticsSummary, error) {
	return &model.CADAnalyticsSummary{}, nil
}

// noopAudit is an auditLogger that records nothing (no DB needed).
type noopAudit struct{ calls int }

func (n *noopAudit) LogAction(context.Context, *uuid.UUID, *string, string, string, *string, *string, string) {
	n.calls++
}

// ───────────────────────── test app wiring ─────────────────────────

func newCADTestApp(store *fakeCADStore, audit *noopAudit) *fiber.App {
	h := &CADHandler{repo: store, auditLog: audit}
	app := fiber.New(fiber.Config{ErrorHandler: globalErrorHandler})
	app.Post("/api/cad/activate", h.Activate)
	app.Post("/api/cad/deactivate", h.Deactivate)
	// Admin route: inject claims into context (bypass real auth middleware).
	app.Post("/api/admin/cad/devices/:id/deactivate", func(c fiber.Ctx) error {
		c.Locals(mw.ClaimsKey, &auth.Claims{UserID: uuid.New(), FullName: "Tester", Role: "admin"})
		return h.DeviceDeactivate(c)
	})
	return app
}

func doJSON(t *testing.T, app *fiber.App, path string, body any) (*http.Response, map[string]any) {
	t.Helper()
	b, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, path, bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req, fiber.TestConfig{Timeout: 5 * time.Second})
	if err != nil {
		t.Fatalf("app.Test error: %v", err)
	}
	var parsed map[string]any
	_ = json.NewDecoder(resp.Body).Decode(&parsed)
	return resp, parsed
}

func errCode(parsed map[string]any) string {
	if e, ok := parsed["errors"].(map[string]any); ok {
		if code, ok := e["code"].(string); ok {
			return code
		}
	}
	return ""
}

func dataField(parsed map[string]any, key string) any {
	if d, ok := parsed["data"].(map[string]any); ok {
		return d[key]
	}
	return nil
}

// ───────────────────────── Activate ─────────────────────────

func TestActivate_PlatformMismatch(t *testing.T) {
	store := newFakeCADStore()
	store.addLicense(&model.CADLicense{LicenseKey: "KEY-MAC", Status: "active", Tier: "lifetime", Platform: "macos", DeviceLimit: 1})
	app := newCADTestApp(store, &noopAudit{})

	resp, parsed := doJSON(t, app, "/api/cad/activate", model.CADActivateRequest{
		LicenseKey: "KEY-MAC", DeviceHash: "dev-win", Platform: "windows",
	})
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", resp.StatusCode)
	}
	if errCode(parsed) != "BAD_REQUEST" {
		t.Fatalf("error code = %q, want BAD_REQUEST", errCode(parsed))
	}
}

func TestActivate_FirstDeviceBinds(t *testing.T) {
	store := newFakeCADStore()
	store.addLicense(&model.CADLicense{LicenseKey: "KEY-1", Status: "active", Tier: "lifetime", Platform: "macos", DeviceLimit: 1})
	app := newCADTestApp(store, &noopAudit{})

	resp, parsed := doJSON(t, app, "/api/cad/activate", model.CADActivateRequest{
		LicenseKey: "KEY-1", DeviceHash: "dev-A", Platform: "macos",
	})
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
	if dataField(parsed, "status") != "active" {
		t.Fatalf("status field = %v, want active", dataField(parsed, "status"))
	}
	if dataField(parsed, "platform") != "macos" {
		t.Fatalf("platform = %v, want macos", dataField(parsed, "platform"))
	}
	if dataField(parsed, "install_id") == nil {
		t.Fatal("install_id missing in response")
	}
}

func TestActivate_PlatformDefaultsMacos(t *testing.T) {
	store := newFakeCADStore()
	store.addLicense(&model.CADLicense{LicenseKey: "KEY-D", Status: "active", Tier: "lifetime", Platform: "macos", DeviceLimit: 1})
	app := newCADTestApp(store, &noopAudit{})

	// Platform omitted → defaults to macos → matches the macos license.
	resp, _ := doJSON(t, app, "/api/cad/activate", map[string]string{
		"license_key": "KEY-D", "device_hash": "dev-A",
	})
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200 (platform should default to macos)", resp.StatusCode)
	}
}

func TestActivate_SameDeviceIdempotent(t *testing.T) {
	store := newFakeCADStore()
	lic := &model.CADLicense{LicenseKey: "KEY-2", Status: "active", Tier: "lifetime", Platform: "macos", DeviceLimit: 1}
	store.addLicense(lic)
	store.addInstall(&model.CADInstallation{LicenseID: &lic.ID, DeviceHash: "dev-A", Revoked: false})
	app := newCADTestApp(store, &noopAudit{})

	resp, parsed := doJSON(t, app, "/api/cad/activate", model.CADActivateRequest{
		LicenseKey: "KEY-2", DeviceHash: "dev-A", Platform: "macos",
	})
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200 (idempotent)", resp.StatusCode)
	}
	if dataField(parsed, "status") != "active" {
		t.Fatalf("status = %v, want active", dataField(parsed, "status"))
	}
}

func TestActivate_AlreadyActiveElsewhere409(t *testing.T) {
	store := newFakeCADStore()
	lic := &model.CADLicense{LicenseKey: "KEY-3", Status: "active", Tier: "lifetime", Platform: "macos", DeviceLimit: 1}
	store.addLicense(lic)
	store.addInstall(&model.CADInstallation{LicenseID: &lic.ID, DeviceHash: "dev-OLD", Revoked: false})
	app := newCADTestApp(store, &noopAudit{})

	resp, parsed := doJSON(t, app, "/api/cad/activate", model.CADActivateRequest{
		LicenseKey: "KEY-3", DeviceHash: "dev-NEW", Platform: "macos",
	})
	if resp.StatusCode != http.StatusConflict {
		t.Fatalf("status = %d, want 409", resp.StatusCode)
	}
	if errCode(parsed) != "CONFLICT" {
		t.Fatalf("error code = %q, want CONFLICT", errCode(parsed))
	}
}

func TestActivate_InvalidLicense(t *testing.T) {
	store := newFakeCADStore()
	app := newCADTestApp(store, &noopAudit{})

	resp, _ := doJSON(t, app, "/api/cad/activate", model.CADActivateRequest{
		LicenseKey: "NOPE", DeviceHash: "dev-A", Platform: "macos",
	})
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", resp.StatusCode)
	}
}

// ───────────────────────── Deactivate ─────────────────────────

func TestDeactivate_Success(t *testing.T) {
	store := newFakeCADStore()
	lic := &model.CADLicense{LicenseKey: "KEY-4", Status: "active", Tier: "lifetime", Platform: "macos", DeviceLimit: 1}
	store.addLicense(lic)
	inst := &model.CADInstallation{LicenseID: &lic.ID, DeviceHash: "dev-A", Revoked: false}
	store.addInstall(inst)
	app := newCADTestApp(store, &noopAudit{})

	resp, parsed := doJSON(t, app, "/api/cad/deactivate", model.CADDeactivateRequest{
		LicenseKey: "KEY-4", DeviceHash: "dev-A",
	})
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
	if dataField(parsed, "ok") != true {
		t.Fatalf("ok = %v, want true", dataField(parsed, "ok"))
	}
	if !inst.Revoked {
		t.Fatal("installation should be revoked after deactivate")
	}
	if lic.LastTransferAt == nil {
		t.Fatal("last_transfer_at should be set after deactivate")
	}
}

func TestDeactivate_DeviceNotFound(t *testing.T) {
	store := newFakeCADStore()
	store.addLicense(&model.CADLicense{LicenseKey: "KEY-5", Status: "active", Platform: "macos", DeviceLimit: 1})
	app := newCADTestApp(store, &noopAudit{})

	resp, _ := doJSON(t, app, "/api/cad/deactivate", model.CADDeactivateRequest{
		LicenseKey: "KEY-5", DeviceHash: "ghost",
	})
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", resp.StatusCode)
	}
}

func TestDeactivate_RateLimit429(t *testing.T) {
	store := newFakeCADStore()
	recent := time.Now().Add(-5 * 24 * time.Hour) // 5 days ago, inside 30-day window
	lic := &model.CADLicense{LicenseKey: "KEY-6", Status: "active", Platform: "macos", DeviceLimit: 1, LastTransferAt: &recent}
	store.addLicense(lic)
	store.addInstall(&model.CADInstallation{LicenseID: &lic.ID, DeviceHash: "dev-A", Revoked: false})
	app := newCADTestApp(store, &noopAudit{})

	resp, parsed := doJSON(t, app, "/api/cad/deactivate", model.CADDeactivateRequest{
		LicenseKey: "KEY-6", DeviceHash: "dev-A",
	})
	if resp.StatusCode != http.StatusTooManyRequests {
		t.Fatalf("status = %d, want 429", resp.StatusCode)
	}
	if errCode(parsed) != "TOO_MANY_REQUESTS" {
		t.Fatalf("error code = %q, want TOO_MANY_REQUESTS", errCode(parsed))
	}
}

func TestDeactivate_RateLimitExpired_Allows(t *testing.T) {
	store := newFakeCADStore()
	old := time.Now().Add(-40 * 24 * time.Hour) // 40 days ago, outside 30-day window
	lic := &model.CADLicense{LicenseKey: "KEY-7", Status: "active", Platform: "macos", DeviceLimit: 1, LastTransferAt: &old}
	store.addLicense(lic)
	store.addInstall(&model.CADInstallation{LicenseID: &lic.ID, DeviceHash: "dev-A", Revoked: false})
	app := newCADTestApp(store, &noopAudit{})

	resp, _ := doJSON(t, app, "/api/cad/deactivate", model.CADDeactivateRequest{
		LicenseKey: "KEY-7", DeviceHash: "dev-A",
	})
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200 (transfer window expired)", resp.StatusCode)
	}
}

// ───────────────────────── Admin override ─────────────────────────

func TestDeviceDeactivate_AdminOverride(t *testing.T) {
	store := newFakeCADStore()
	lic := &model.CADLicense{LicenseKey: "KEY-8", Status: "active", Platform: "macos", DeviceLimit: 1}
	store.addLicense(lic)
	recent := time.Now()
	lic.LastTransferAt = &recent // even with a recent transfer, admin override must work
	inst := &model.CADInstallation{LicenseID: &lic.ID, DeviceHash: "dev-A", Revoked: false}
	store.addInstall(inst)
	audit := &noopAudit{}
	app := newCADTestApp(store, audit)

	resp, parsed := doJSON(t, app, "/api/admin/cad/devices/"+inst.ID.String()+"/deactivate", nil)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
	if dataField(parsed, "ok") != true {
		t.Fatalf("ok = %v, want true", dataField(parsed, "ok"))
	}
	if !inst.Revoked {
		t.Fatal("installation should be revoked by admin override")
	}
	// Admin override must NOT change last_transfer_at.
	if lic.LastTransferAt == nil || !lic.LastTransferAt.Equal(recent) {
		t.Fatal("admin override must not touch last_transfer_at")
	}
	if audit.calls != 1 {
		t.Fatalf("audit calls = %d, want 1", audit.calls)
	}
}

func TestDeviceDeactivate_NotFound(t *testing.T) {
	store := newFakeCADStore()
	app := newCADTestApp(store, &noopAudit{})

	resp, _ := doJSON(t, app, "/api/admin/cad/devices/"+uuid.New().String()+"/deactivate", nil)
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", resp.StatusCode)
	}
}

func TestDeviceDeactivate_InvalidID(t *testing.T) {
	store := newFakeCADStore()
	app := newCADTestApp(store, &noopAudit{})

	resp, _ := doJSON(t, app, "/api/admin/cad/devices/not-a-uuid/deactivate", nil)
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", resp.StatusCode)
	}
}
