package repository

import (
	"context"

	"github.com/coreasia/lms-api/internal/domain/entity"
	"github.com/google/uuid"
)

type CertificateTemplateRepository interface {
	FindByID(ctx context.Context, id uuid.UUID) (*entity.CertificateTemplate, error)
	FindAll(ctx context.Context) ([]entity.CertificateTemplate, error)
	Create(ctx context.Context, tmpl *entity.CertificateTemplate) error
	Update(ctx context.Context, tmpl *entity.CertificateTemplate) error
	Delete(ctx context.Context, id uuid.UUID) error
}
