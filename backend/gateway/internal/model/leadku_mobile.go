package model

import "time"

type LeadkuMobilePolicy struct {
	Channel       string    `json:"channel"`
	LatestCode    int       `json:"latest_code"`
	LatestVersion string    `json:"latest_version"`
	MinimumCode   int       `json:"minimum_code"`
	Available     bool      `json:"available"`
	Notes         string    `json:"notes"`
	UpdatedAt     time.Time `json:"updated_at"`
}
type LeadkuMobileEvent struct {
	ID         string `json:"id"`
	Kind       string `json:"kind"`
	Screen     string `json:"screen"`
	TargetCode *int   `json:"target_code,omitempty"`
}
type LeadkuMobilePulse struct {
	UsageConsent   bool                `json:"usage_consent"`
	InstallationID string              `json:"installation_id"`
	Package        string              `json:"package"`
	AppVersion     string              `json:"app_version"`
	VersionCode    int                 `json:"version_code"`
	OSVersion      string              `json:"os_version"`
	Events         []LeadkuMobileEvent `json:"events"`
}
type LeadkuMobileCounts struct {
	Installations int64 `json:"installations"`
	Active24h     int64 `json:"active_24h"`
	Active7d      int64 `json:"active_7d"`
	Active30d     int64 `json:"active_30d"`
	New7d         int64 `json:"new_7d"`
}
type LeadkuMobileVersion struct {
	Version       string `json:"version"`
	Code          int    `json:"code"`
	Installations int64  `json:"installations"`
	Active7d      int64  `json:"active_7d"`
}
type LeadkuMobileUsage struct {
	Kind          string `json:"kind"`
	Screen        string `json:"screen"`
	Events        int64  `json:"events"`
	Installations int64  `json:"installations"`
}
type LeadkuMobileDay struct {
	Day              string `json:"day"`
	NewInstallations int64  `json:"new_installations"`
}
type LeadkuPlaySyncStatus struct {
	Configured  bool       `json:"configured"`
	LastAttempt *time.Time `json:"last_attempt"`
	LastSuccess *time.Time `json:"last_success"`
	Error       string     `json:"error"`
}

type LeadkuPlayDay struct {
	CurrentInstalls *int64    `json:"current_installs"`
	Day             string    `json:"day"`
	Installs        int64     `json:"installs"`
	Uninstalls      int64     `json:"uninstalls"`
	ActiveInstalls  *int64    `json:"active_installs"`
	Source          string    `json:"source"`
	ImportedAt      time.Time `json:"imported_at"`
}
type LeadkuMobileSummary struct {
	PlaySync LeadkuPlaySyncStatus  `json:"play_sync"`
	Channel  string                `json:"channel"`
	Counts   LeadkuMobileCounts    `json:"counts"`
	Versions []LeadkuMobileVersion `json:"versions"`
	Usage    []LeadkuMobileUsage   `json:"usage"`
	Daily    []LeadkuMobileDay     `json:"daily"`
	Play     []LeadkuPlayDay       `json:"play"`
	Policy   LeadkuMobilePolicy    `json:"policy"`
}
