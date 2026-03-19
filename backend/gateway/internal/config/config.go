package config

import (
	"fmt"

	"github.com/ilyakaznacheev/cleanenv"
)

type Config struct {
	App      AppConfig      `yaml:"app"`
	Database DatabaseConfig `yaml:"database"`
	CORS     CORSConfig     `yaml:"cors"`
	JWT      JWTConfig      `yaml:"jwt"`
	AI       AIConfig       `yaml:"ai"`
	R2       R2Config       `yaml:"r2"`
	Xendit   XenditConfig   `yaml:"xendit"`
	Midtrans MidtransConfig `yaml:"midtrans"`
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

type CORSConfig struct {
	AllowedOrigins []string `yaml:"allowed_origins" env:"CORS_ORIGINS"`
}

type JWTConfig struct {
	Secret     string `yaml:"secret" env:"JWT_SECRET"`
	AccessTTL  string `yaml:"access_ttl" env:"JWT_ACCESS_TTL" env-default:"60m"`
	RefreshTTL string `yaml:"refresh_ttl" env:"JWT_REFRESH_TTL" env-default:"720h"`
	Issuer     string `yaml:"issuer" env:"JWT_ISSUER" env-default:"coreasia-gateway"`
}

type AIConfig struct {
	APIKey   string `yaml:"api_key" env:"AI_API_KEY"`
	Provider string `yaml:"provider" env:"AI_PROVIDER" env-default:"claude"`
	Model    string `yaml:"model" env:"AI_MODEL" env-default:"claude-sonnet-4-20250514"`
}

type R2Config struct {
	AccountID      string `yaml:"account_id" env:"R2_ACCOUNT_ID"`
	AccessKeyID    string `yaml:"access_key_id" env:"R2_ACCESS_KEY_ID"`
	SecretAccessKey string `yaml:"secret_access_key" env:"R2_SECRET_ACCESS_KEY"`
	BucketName     string `yaml:"bucket_name" env:"R2_BUCKET_NAME" env-default:"coreasia-articles"`
	PublicURL      string `yaml:"public_url" env:"R2_PUBLIC_URL"`
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
