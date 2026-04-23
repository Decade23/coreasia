package service

import (
	"context"
	"strings"
	"testing"

	"github.com/coreasia/gateway/internal/config"
)

func TestBuildUnsplashQueries(t *testing.T) {
	queries := buildUnsplashQueries(
		[]string{" seo ", "seo", "ga4", "analytics", ""},
		"Panduan SEO untuk Bisnis Digital Modern",
		"marketing",
	)

	if len(queries) < 3 {
		t.Fatalf("expected several fallback queries, got %v", queries)
	}
	if queries[0] != "seo ga4 analytics" {
		t.Fatalf("unexpected primary query: %q", queries[0])
	}
	if queries[1] != "marketing" {
		t.Fatalf("unexpected category query: %q", queries[1])
	}
	if queries[2] != "Panduan SEO untuk Bisnis Digital" {
		t.Fatalf("unexpected topic query: %q", queries[2])
	}
}

func TestFindUnsplashFeaturedImageWithoutKey(t *testing.T) {
	bot := NewArticleBot(config.AIConfig{}, nil, nil, nil, nil, nil)

	imageURL, warning := bot.findUnsplashFeaturedImage(context.Background(), []string{"seo"}, "Topik SEO", "marketing")

	if imageURL != "" {
		t.Fatalf("expected no image url, got %q", imageURL)
	}
	if !strings.Contains(warning, "Unsplash Access Key") {
		t.Fatalf("expected missing key warning, got %q", warning)
	}
}
