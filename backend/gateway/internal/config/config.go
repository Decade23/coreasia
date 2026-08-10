package config

import (
	"fmt"

	"github.com/ilyakaznacheev/cleanenv"
)

type Config struct {
	App      AppConfig      `yaml:"app"`
	Database DatabaseConfig `yaml:"database"`
	Redis    RedisConfig    `yaml:"redis"`
	CORS     CORSConfig     `yaml:"cors"`
	JWT      JWTConfig      `yaml:"jwt"`
	AI       AIConfig       `yaml:"ai"`
	R2       R2Config       `yaml:"r2"`
	Xendit   XenditConfig   `yaml:"xendit"`
	Midtrans MidtransConfig `yaml:"midtrans"`
	Email    EmailConfig    `yaml:"email"`
	Payments PaymentsConfig `yaml:"payments"`
	CRM      CRMConfig      `yaml:"crm"`
	CAD      CADConfig      `yaml:"cad"`
	Mounter  MounterConfig  `yaml:"mounter"`
}

// CADConfig — penerbitan license key CoreAsia Download Manager.
type CADConfig struct {
	// SigningKey = seed Ed25519 (base64url, 32 byte) untuk MENANDATANGANI license key
	// server-side (admin "Generate"). HARUS berpasangan dgn LICENSE_PUBKEY di app.
	// Kosong = fitur generate nonaktif (import tetap jalan). RAHASIA — jangan commit.
	SigningKey string `yaml:"signing_key" env:"CAD_LICENSE_SIGNING_KEY"`
}

// MounterConfig — penerbitan license key CoreAsia Mounter (format & alur identik
// dengan CAD, tetapi WAJIB keypair terpisah: pubkey pasangannya di-embed di app
// Mounter (LicenseVerifier.licensePublicKey), bukan pubkey CAD).
type MounterConfig struct {
	// SigningKey = seed Ed25519 (base64url, 32 byte) khusus Mounter. Kosong =
	// penerbitan key Mounter nonaktif (webhook tetap ack, log error). RAHASIA.
	SigningKey string `yaml:"signing_key" env:"MOUNTER_LICENSE_SIGNING_KEY"`
}

type AppConfig struct {
	Name  string `yaml:"name" env:"APP_NAME" env-default:"coreasia-gateway"`
	Env   string `yaml:"env" env:"APP_ENV" env-default:"development"`
	Port  int    `yaml:"port" env:"APP_PORT" env-default:"8081"`
	Debug bool   `yaml:"debug" env:"APP_DEBUG" env-default:"true"`
}

type DatabaseConfig struct {
	Host     string `yaml:"host" env:"DB_HOST" env-default:"localhost"`
	Port     int    `yaml:"port" env:"DB_PORT" env-default:"5432"`
	User     string `yaml:"user" env:"DB_USER" env-default:"coreasia"`
	Password string `yaml:"password" env:"DB_PASSWORD" env-default:"coreasia_secret"`
	Name     string `yaml:"name" env:"DB_NAME" env-default:"coreasia_lms"`
	SSLMode  string `yaml:"ssl_mode" env:"DB_SSL_MODE" env-default:"disable"`
	MaxConns int32  `yaml:"max_conns" env:"DB_MAX_CONNS" env-default:"10"`
	MinConns int32  `yaml:"min_conns" env:"DB_MIN_CONNS" env-default:"2"`
}

type XenditConfig struct {
	APIKey        string `yaml:"api_key" env:"XENDIT_API_KEY"`
	CallbackToken string `yaml:"callback_token" env:"XENDIT_CALLBACK_TOKEN"`
	SuccessURL    string `yaml:"success_url" env:"XENDIT_SUCCESS_URL" env-default:"https://coreasia.id/register/success"`
	FailureURL    string `yaml:"failure_url" env:"XENDIT_FAILURE_URL" env-default:"https://coreasia.id/register?status=failed"`
}

type MidtransConfig struct {
	ServerKey       string `yaml:"server_key" env:"MIDTRANS_SERVER_KEY"`
	ClientKey       string `yaml:"client_key" env:"MIDTRANS_CLIENT_KEY"`
	MerchantID      string `yaml:"merchant_id" env:"MIDTRANS_MERCHANT_ID"`
	IsProduction    bool   `yaml:"is_production" env:"MIDTRANS_IS_PRODUCTION" env-default:"false"`
	NotificationURL string `yaml:"notification_url" env:"MIDTRANS_NOTIFICATION_URL"`
	FinishURL       string `yaml:"finish_url" env:"MIDTRANS_FINISH_URL" env-default:"https://coreasia.id/register"`
	UnfinishURL     string `yaml:"unfinish_url" env:"MIDTRANS_UNFINISH_URL" env-default:"https://coreasia.id/register"`
	ErrorURL        string `yaml:"error_url" env:"MIDTRANS_ERROR_URL" env-default:"https://coreasia.id/register"`
	MerchantName    string `yaml:"merchant_name" env:"MIDTRANS_MERCHANT_NAME" env-default:"CoreAsia"`
}

// EmailConfig drives transactional email (license delivery and lead alerts).
type EmailConfig struct {
	Provider              string `yaml:"provider" env:"EMAIL_PROVIDER" env-default:"resend"`
	APIKey                string `yaml:"api_key" env:"RESEND_API_KEY"`
	From                  string `yaml:"from" env:"EMAIL_FROM" env-default:"CoreAsia <noreply@coreasia.id>"`
	LeadNotificationEmail string `yaml:"lead_notification_email" env:"LEAD_NOTIFICATION_EMAIL" env-default:"hello@coreasia.id"`
}

// CRMConfig menyambungkan lead formulir kontak ke pipeline LeadKu di workspace
// CoreAsia. Kosongkan URL atau token untuk mematikan penerusan sepenuhnya; lead
// tetap tersimpan dan email tetap terkirim, hanya tidak masuk CRM.
type CRMConfig struct {
	LeadKuLeadURL     string `yaml:"leadku_lead_url" env:"LEADKU_LEAD_URL"`
	LeadKuIngestToken string `yaml:"leadku_ingest_token" env:"LEADKU_INGEST_TOKEN"`
}

// PaymentsConfig holds shared secrets for inbound payment webhooks (Mayar, dst)
// plus the credentials used for OUTBOUND callback-verification against Mayar's API.
type PaymentsConfig struct {
	MayarWebhookToken string `yaml:"mayar_webhook_token" env:"MAYAR_WEBHOOK_TOKEN"`
	// MayarAPIKey is the Bearer API key for OUTBOUND calls to Mayar (callback verify).
	MayarAPIKey string `yaml:"mayar_api_key" env:"MAYAR_API_KEY"`
	// MayarAPIBase is the Mayar REST API base URL (no trailing slash). Prod default.
	MayarAPIBase string `yaml:"mayar_api_base" env:"MAYAR_API_BASE" env-default:"https://api.mayar.id/hl/v1"`
	// MayarVerify, when true, independently confirms a webhook is genuinely PAID via
	// Mayar's API before a license key is minted. Default false → behaviour unchanged.
	MayarVerify bool `yaml:"mayar_verify" env:"MAYAR_VERIFY" env-default:"false"`
	// GumroadPingToken — shared secret yang diselipkan di URL Gumroad Ping
	// (?token=...) untuk mengautentikasi webhook (Gumroad ping tak punya HMAC).
	// Kosong = webhook Gumroad ditolak (fail closed).
	GumroadPingToken string `yaml:"gumroad_ping_token" env:"GUMROAD_PING_TOKEN"`
	// GumroadSellerID (opsional) — bila diisi, field seller_id ping harus cocok.
	GumroadSellerID string `yaml:"gumroad_seller_id" env:"GUMROAD_SELLER_ID"`
}

type CORSConfig struct {
	AllowedOrigins []string `yaml:"allowed_origins" env:"CORS_ORIGINS"`
}

type JWTConfig struct {
	Secret     string `yaml:"secret" env:"JWT_SECRET"`
	AccessTTL  string `yaml:"access_ttl" env:"JWT_ACCESS_TTL" env-default:"60m"`
	RefreshTTL string `yaml:"refresh_ttl" env:"JWT_REFRESH_TTL" env-default:"720h"`
	Issuer     string `yaml:"issuer" env:"JWT_ISSUER" env-default:"coreasia-gateway"`
}

type RedisConfig struct {
	Host     string `yaml:"host" env:"REDIS_HOST" env-default:"localhost"`
	Port     int    `yaml:"port" env:"REDIS_PORT" env-default:"6379"`
	Password string `yaml:"password" env:"REDIS_PASSWORD"`
	DB       int    `yaml:"db" env:"REDIS_DB" env-default:"0"`
}

func (r RedisConfig) Addr() string {
	return fmt.Sprintf("%s:%d", r.Host, r.Port)
}

type AIConfig struct {
	APIKey            string `yaml:"api_key" env:"AI_API_KEY"`
	Provider          string `yaml:"provider" env:"AI_PROVIDER" env-default:"claude"`
	Model             string `yaml:"model" env:"AI_MODEL" env-default:"claude-sonnet-4-20250514"`
	UnsplashAccessKey string `yaml:"unsplash_access_key" env:"UNSPLASH_ACCESS_KEY"`
}

type R2Config struct {
	AccountID       string `yaml:"account_id" env:"R2_ACCOUNT_ID"`
	AccessKeyID     string `yaml:"access_key_id" env:"R2_ACCESS_KEY_ID"`
	SecretAccessKey string `yaml:"secret_access_key" env:"R2_SECRET_ACCESS_KEY"`
	BucketName      string `yaml:"bucket_name" env:"R2_BUCKET_NAME" env-default:"coreasia-articles"`
	PublicURL       string `yaml:"public_url" env:"R2_PUBLIC_URL"`
}

func (d DatabaseConfig) DSN() string {
	return fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=%s",
		d.User, d.Password, d.Host, d.Port, d.Name, d.SSLMode)
}

func (a AppConfig) IsProduction() bool {
	return a.Env == "production"
}

func (m MidtransConfig) SnapBaseURL() string {
	if m.IsProduction {
		return "https://app.midtrans.com/snap/v1"
	}

	return "https://app.sandbox.midtrans.com/snap/v1"
}

func (m MidtransConfig) CoreBaseURL() string {
	if m.IsProduction {
		return "https://api.midtrans.com/v2"
	}

	return "https://api.sandbox.midtrans.com/v2"
}

func Load(path string) (*Config, error) {
	var cfg Config

	if path != "" {
		if err := cleanenv.ReadConfig(path, &cfg); err != nil {
			return nil, fmt.Errorf("membaca config: %w", err)
		}
	} else {
		if err := cleanenv.ReadEnv(&cfg); err != nil {
			return nil, fmt.Errorf("membaca env: %w", err)
		}
	}

	return &cfg, nil
}
