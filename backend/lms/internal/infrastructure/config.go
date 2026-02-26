package infrastructure

import (
	"fmt"
	"time"

	"github.com/ilyakaznacheev/cleanenv"
)

type Config struct {
	App      AppConfig      `yaml:"app"`
	Database DatabaseConfig `yaml:"database"`
	JWT      JWTConfig      `yaml:"jwt"`
	Storage  StorageConfig  `yaml:"storage"`
	CORS     CORSConfig     `yaml:"cors"`
	Tenant   TenantConfig   `yaml:"tenant"`
}

type AppConfig struct {
	Name  string `yaml:"name" env:"APP_NAME" env-default:"coreasia-lms-api"`
	Env   string `yaml:"env" env:"APP_ENV" env-default:"development"`
	Port  int    `yaml:"port" env:"APP_PORT" env-default:"8080"`
	Debug bool   `yaml:"debug" env:"APP_DEBUG" env-default:"true"`
}

type DatabaseConfig struct {
	Host     string `yaml:"host" env:"DB_HOST" env-default:"localhost"`
	Port     int    `yaml:"port" env:"DB_PORT" env-default:"5432"`
	User     string `yaml:"user" env:"DB_USER" env-default:"coreasia"`
	Password string `yaml:"password" env:"DB_PASSWORD" env-default:"coreasia_secret"`
	Name     string `yaml:"name" env:"DB_NAME" env-default:"coreasia_lms"`
	SSLMode  string `yaml:"ssl_mode" env:"DB_SSL_MODE" env-default:"disable"`
	MaxConns int32  `yaml:"max_conns" env:"DB_MAX_CONNS" env-default:"25"`
	MinConns int32  `yaml:"min_conns" env:"DB_MIN_CONNS" env-default:"5"`
}

type JWTConfig struct {
	Secret     string        `yaml:"secret" env:"JWT_SECRET" env-default:"change-me-in-production-min-32-chars!"`
	AccessTTL  time.Duration `yaml:"access_ttl" env:"JWT_ACCESS_TTL" env-default:"15m"`
	RefreshTTL time.Duration `yaml:"refresh_ttl" env:"JWT_REFRESH_TTL" env-default:"168h"`
	Issuer     string        `yaml:"issuer" env:"JWT_ISSUER" env-default:"coreasia-lms"`
}

type StorageConfig struct {
	Endpoint  string `yaml:"endpoint" env:"STORAGE_ENDPOINT" env-default:"localhost:9000"`
	AccessKey string `yaml:"access_key" env:"STORAGE_ACCESS_KEY" env-default:"minioadmin"`
	SecretKey string `yaml:"secret_key" env:"STORAGE_SECRET_KEY" env-default:"minioadmin"`
	Bucket    string `yaml:"bucket" env:"STORAGE_BUCKET" env-default:"lms-uploads"`
	UseSSL    bool   `yaml:"use_ssl" env:"STORAGE_USE_SSL" env-default:"false"`
}

type CORSConfig struct {
	AllowedOrigins []string `yaml:"allowed_origins" env:"CORS_ORIGINS"`
	AllowedMethods []string `yaml:"allowed_methods"`
	AllowedHeaders []string `yaml:"allowed_headers"`
}

type TenantConfig struct {
	DefaultSchema string `yaml:"default_schema" env:"TENANT_DEFAULT_SCHEMA" env-default:"_template"`
	HeaderKey     string `yaml:"header_key" env:"TENANT_HEADER_KEY" env-default:"X-Tenant-ID"`
	ResolveBy     string `yaml:"resolve_by" env:"TENANT_RESOLVE_BY" env-default:"header"`
}

func (d DatabaseConfig) DSN() string {
	return fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=%s",
		d.User, d.Password, d.Host, d.Port, d.Name, d.SSLMode)
}

func (a AppConfig) IsProduction() bool {
	return a.Env == "production"
}

func LoadConfig(path string) (*Config, error) {
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
