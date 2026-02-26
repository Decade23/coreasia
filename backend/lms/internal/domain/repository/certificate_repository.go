package repository

import (
	"context"

	"github.com/coreasia/lms-api/internal/domain/entity"
	"github.com/google/uuid"
)

type CertificateRepository interface {
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Certificate, error)
	FindByNumber(ctx context.Context, number string) (*entity.Certificate, error)
	FindAll(ctx context.Context, page, perPage int, assesseeID *uuid.UUID) ([]entity.Certificate, int, error)
	Create(ctx context.Context, cert *entity.Certificate) error
	Update(ctx context.Context, cert *entity.Certificate) error
}
