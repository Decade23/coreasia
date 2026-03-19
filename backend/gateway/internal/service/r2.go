package service

import (
	"context"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"time"

	"github.com/coreasia/gateway/internal/config"
	"github.com/google/uuid"

	awsConfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type R2Service struct {
	client    *s3.Client
	bucket    string
	publicURL string
}

func NewR2Service(cfg config.R2Config) (*R2Service, error) {
	if cfg.AccountID == "" || cfg.AccessKeyID == "" || cfg.SecretAccessKey == "" {
		// Return a no-op service if R2 is not configured
		return &R2Service{}, nil
	}

	endpoint := fmt.Sprintf("https://%s.r2.cloudflarestorage.com", cfg.AccountID)

	awsCfg, err := awsConfig.LoadDefaultConfig(context.Background(),
		awsConfig.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(cfg.AccessKeyID, cfg.SecretAccessKey, ""),
		),
		awsConfig.WithRegion("auto"),
	)
	if err != nil {
		return nil, fmt.Errorf("creating AWS config: %w", err)
	}

	client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.BaseEndpoint = &endpoint
	})

	return &R2Service{
		client:    client,
		bucket:    cfg.BucketName,
		publicURL: cfg.PublicURL,
	}, nil
}

func (s *R2Service) Upload(ctx context.Context, reader io.Reader, filename, contentType string) (string, error) {
	if s.client == nil {
		return "", fmt.Errorf("R2 storage tidak dikonfigurasi")
	}

	ext := filepath.Ext(filename)
	key := fmt.Sprintf("articles/%s/%s%s",
		time.Now().Format("2006/01"),
		uuid.New().String(),
		strings.ToLower(ext),
	)

	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      &s.bucket,
		Key:         &key,
		Body:        reader,
		ContentType: &contentType,
	})
	if err != nil {
		return "", fmt.Errorf("uploading to R2: %w", err)
	}

	url := fmt.Sprintf("%s/%s", strings.TrimSuffix(s.publicURL, "/"), key)
	return url, nil
}
