package handler

import (
	"github.com/coreasia/gateway/internal/model"
	"github.com/google/uuid"
	"testing"
)

func TestLeadkuTelemetryRejectsUnknownAppsAndPrivateResourceIdentifiers(t *testing.T) {
	p := model.LeadkuMobilePulse{UsageConsent: true, InstallationID: uuid.NewString(), Package: "id.coreasia.leadku", AppVersion: "1.6.3", VersionCode: 13, OSVersion: "17", Events: []model.LeadkuMobileEvent{{ID: uuid.NewString(), Kind: "screen_view", Screen: "contacts"}}}
	if !validLeadkuPulse(p) {
		t.Fatal("valid pulse rejected")
	}
	p.Package = "another.app"
	if validLeadkuPulse(p) {
		t.Fatal("unknown application accepted")
	}
	p.Package = "id.coreasia.leadku.qa.prod"
	p.Events[0].Screen = "contacts/private-record-id"
	if validLeadkuPulse(p) {
		t.Fatal("resource path accepted")
	}
	p.Events[0].Screen = "contacts"
	p.VersionCode = -1
	if validLeadkuPulse(p) {
		t.Fatal("invalid version accepted")
	}
}
func TestLeadkuPolicyCannotForceUnavailableOrInvalidVersion(t *testing.T) {
	p := model.LeadkuMobilePolicy{Channel: "production", LatestCode: 13, LatestVersion: "1.6.3", MinimumCode: 0, Available: false}
	if !validLeadkuPolicy(p) {
		t.Fatal("draft release rejected")
	}
	p.MinimumCode = 13
	if validLeadkuPolicy(p) {
		t.Fatal("unavailable forced release accepted")
	}
	p.Available = true
	if !validLeadkuPolicy(p) {
		t.Fatal("available forced release rejected")
	}
	p.MinimumCode = 14
	if validLeadkuPolicy(p) {
		t.Fatal("minimum above latest accepted")
	}
}

func TestLeadkuAutomaticReportingAndLegacyOptIn(t *testing.T) {
	p := model.LeadkuMobilePulse{CollectionMode: "automatic", InstallationID: uuid.NewString(), Package: "id.coreasia.leadku.qa.prod", AppVersion: "1.6.3", VersionCode: 14, OSVersion: "17", Events: []model.LeadkuMobileEvent{{ID: uuid.NewString(), Kind: "session_start"}}}
	if !validLeadkuPulse(p) {
		t.Fatal("automatic reporting rejected")
	}
	p.CollectionMode = "unknown"
	p.UsageConsent = true
	if validLeadkuPulse(p) {
		t.Fatal("unknown collection mode accepted")
	}
	p.CollectionMode = ""
	if !validLeadkuPulse(p) {
		t.Fatal("legacy opt-in rejected")
	}
	p.UsageConsent = false
	if validLeadkuPulse(p) {
		t.Fatal("unidentified reporting mode accepted")
	}
}
