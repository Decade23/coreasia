package model

import (
	"time"

	"github.com/google/uuid"
)

type Article struct {
	ID                uuid.UUID  `json:"id"`
	Slug              string     `json:"slug"`
	Title             string     `json:"title"`
	Description       string     `json:"description"`
	Content           string     `json:"content"`
	Category          string     `json:"category"`
	Tags              []string   `json:"tags"`
	Author            string     `json:"author"`
	ReadTime          int        `json:"read_time"`
	Status            string     `json:"status"`
	FeaturedImage     *string    `json:"featured_image"`
	SEOTitle          *string    `json:"seo_title"`
	SEODescription    *string    `json:"seo_description"`
	PublishedAt       *time.Time `json:"published_at"`
	CreatedBy         *uuid.UUID `json:"created_by"`
	CreatedByName     *string    `json:"created_by_name,omitempty"`
	UpdatedBy         *uuid.UUID `json:"updated_by"`
	UpdatedByName     *string    `json:"updated_by_name,omitempty"`
	PublishedByName   *string    `json:"published_by_name,omitempty"`
	UnpublishedAt     *time.Time `json:"unpublished_at,omitempty"`
	UnpublishedByName *string    `json:"unpublished_by_name,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

type CreateArticleRequest struct {
	Title          string   `json:"title" validate:"required,min=5,max=500"`
	Slug           string   `json:"slug" validate:"required,min=5,max=300"`
	Description    string   `json:"description" validate:"required"`
	Content        string   `json:"content" validate:"required"`
	Category       string   `json:"category" validate:"required"`
	Tags           []string `json:"tags"`
	Author         string   `json:"author"`
	ReadTime       int      `json:"read_time" validate:"min=1"`
	Status         string   `json:"status" validate:"omitempty,oneof=draft published"`
	FeaturedImage  *string  `json:"featured_image"`
	SEOTitle       *string  `json:"seo_title"`
	SEODescription *string  `json:"seo_description"`
}

type UpdateArticleRequest struct {
	Title          *string  `json:"title" validate:"omitempty,min=5,max=500"`
	Slug           *string  `json:"slug" validate:"omitempty,min=5,max=300"`
	Description    *string  `json:"description"`
	Content        *string  `json:"content"`
	Category       *string  `json:"category"`
	Tags           []string `json:"tags"`
	Author         *string  `json:"author"`
	ReadTime       *int     `json:"read_time" validate:"omitempty,min=1"`
	FeaturedImage  *string  `json:"featured_image"`
	SEOTitle       *string  `json:"seo_title"`
	SEODescription *string  `json:"seo_description"`
}

type ArticleListFilter struct {
	Page     int    `json:"page"`
	PerPage  int    `json:"per_page"`
	Status   string `json:"status"`
	Category string `json:"category"`
	Search   string `json:"search"`
}
