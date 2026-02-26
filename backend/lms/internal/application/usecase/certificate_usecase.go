package usecase

import (
	"context"
	"fmt"

	"github.com/coreasia/lms-api/internal/application/dto"
	"github.com/coreasia/lms-api/internal/domain/entity"
	"github.com/coreasia/lms-api/internal/domain/repository"
	"github.com/coreasia/lms-api/pkg/apperr"
	"github.com/google/uuid"
)

type CertificateUseCase struct {
	certRepo   repository.CertificateRepository
	tmplRepo   repository.CertificateTemplateRepository
	userRepo   repository.UserRepository
	schemeRepo repository.SchemeRepository
}

func NewCertificateUseCase(
	certRepo repository.CertificateRepository,
	tmplRepo repository.CertificateTemplateRepository,
	userRepo repository.UserRepository,
	schemeRepo repository.SchemeRepository,
) *CertificateUseCase {
	return &CertificateUseCase{certRepo: certRepo, tmplRepo: tmplRepo, userRepo: userRepo, schemeRepo: schemeRepo}
}

func (uc *CertificateUseCase) List(ctx context.Context, page, perPage int, assesseeID *uuid.UUID) ([]dto.CertificateResponse, int, error) {
	certs, total, err := uc.certRepo.FindAll(ctx, page, perPage, assesseeID)
	if err != nil {
		return nil, 0, apperr.NewInternal(err)
	}

	resp := make([]dto.CertificateResponse, len(certs))
	for i, c := range certs {
		resp[i] = uc.toCertificateResponse(ctx, &c)
	}

	return resp, total, nil
}

func (uc *CertificateUseCase) GetByID(ctx context.Context, id uuid.UUID) (*dto.CertificateResponse, error) {
	cert, err := uc.certRepo.FindByID(ctx, id)
	if err != nil {
		return nil, apperr.NewNotFound("Sertifikat")
	}

	resp := uc.toCertificateResponse(ctx, cert)
	return &resp, nil
}

func (uc *CertificateUseCase) Verify(ctx context.Context, number string) (*dto.CertificateVerifyResponse, error) {
	cert, err := uc.certRepo.FindByNumber(ctx, number)
	if err != nil {
		return nil, apperr.NewNotFound("Sertifikat")
	}

	resp := &dto.CertificateVerifyResponse{
		Valid:             true,
		CertificateNumber: cert.CertificateNumber,
		Status:            cert.Status,
		IssuedDate:        cert.IssuedDate.Format("2006-01-02"),
		ExpiryDate:        cert.ExpiryDate.Format("2006-01-02"),
	}

	if holder, err := uc.userRepo.FindByID(ctx, cert.AssesseeID); err == nil {
		resp.HolderName = holder.FullName
	}
	if scheme, err := uc.schemeRepo.FindByID(ctx, cert.SchemeID); err == nil {
		resp.SchemeName = scheme.Name
	}

	return resp, nil
}

// Template CRUD

func (uc *CertificateUseCase) ListTemplates(ctx context.Context) ([]dto.TemplateResponse, error) {
	templates, err := uc.tmplRepo.FindAll(ctx)
	if err != nil {
		return nil, apperr.NewInternal(err)
	}

	resp := make([]dto.TemplateResponse, len(templates))
	for i, t := range templates {
		resp[i] = toTemplateResponse(&t)
	}

	return resp, nil
}

func (uc *CertificateUseCase) GetTemplate(ctx context.Context, id uuid.UUID) (*dto.TemplateResponse, error) {
	tmpl, err := uc.tmplRepo.FindByID(ctx, id)
	if err != nil {
		return nil, apperr.NewNotFound("Template")
	}

	resp := toTemplateResponse(tmpl)
	return &resp, nil
}

func (uc *CertificateUseCase) CreateTemplate(ctx context.Context, req dto.CreateTemplateRequest) (*dto.TemplateResponse, error) {
	tmpl := &entity.CertificateTemplate{
		ID:        uuid.New(),
		Name:      req.Name,
		Description: req.Description,
		IsDefault: req.IsDefault,
	}

	if req.SchemeID != nil {
		schemeID, err := uuid.Parse(*req.SchemeID)
		if err == nil {
			tmpl.SchemeID = &schemeID
		}
	}

	for _, f := range req.Fields {
		tmpl.Fields = append(tmpl.Fields, entity.CertificateTemplateField{
			ID:        uuid.New(),
			TemplateID: tmpl.ID,
			FieldKey:  f.FieldKey,
			Label:     f.Label,
			FieldType: f.FieldType,
			PositionX: f.PositionX,
			PositionY: f.PositionY,
			FontSize:  f.FontSize,
			SortOrder: f.SortOrder,
		})
	}

	if err := uc.tmplRepo.Create(ctx, tmpl); err != nil {
		return nil, apperr.NewInternal(err)
	}

	resp := toTemplateResponse(tmpl)
	return &resp, nil
}

func (uc *CertificateUseCase) UpdateTemplate(ctx context.Context, id uuid.UUID, req dto.CreateTemplateRequest) (*dto.TemplateResponse, error) {
	tmpl, err := uc.tmplRepo.FindByID(ctx, id)
	if err != nil {
		return nil, apperr.NewNotFound("Template")
	}

	tmpl.Name = req.Name
	tmpl.Description = req.Description
	tmpl.IsDefault = req.IsDefault

	if req.SchemeID != nil {
		schemeID, err := uuid.Parse(*req.SchemeID)
		if err == nil {
			tmpl.SchemeID = &schemeID
		}
	} else {
		tmpl.SchemeID = nil
	}

	tmpl.Fields = nil
	for _, f := range req.Fields {
		tmpl.Fields = append(tmpl.Fields, entity.CertificateTemplateField{
			ID:        uuid.New(),
			TemplateID: tmpl.ID,
			FieldKey:  f.FieldKey,
			Label:     f.Label,
			FieldType: f.FieldType,
			PositionX: f.PositionX,
			PositionY: f.PositionY,
			FontSize:  f.FontSize,
			SortOrder: f.SortOrder,
		})
	}

	if err := uc.tmplRepo.Update(ctx, tmpl); err != nil {
		return nil, apperr.NewInternal(err)
	}

	resp := toTemplateResponse(tmpl)
	return &resp, nil
}

func (uc *CertificateUseCase) DeleteTemplate(ctx context.Context, id uuid.UUID) error {
	if _, err := uc.tmplRepo.FindByID(ctx, id); err != nil {
		return apperr.NewNotFound("Template")
	}

	if err := uc.tmplRepo.Delete(ctx, id); err != nil {
		return apperr.NewInternal(err)
	}
	return nil
}

func (uc *CertificateUseCase) toCertificateResponse(ctx context.Context, c *entity.Certificate) dto.CertificateResponse {
	resp := dto.CertificateResponse{
		ID:                c.ID.String(),
		CertificateNumber: c.CertificateNumber,
		Status:            c.Status,
		IssuedDate:        c.IssuedDate.Format("2006-01-02"),
		ExpiryDate:        c.ExpiryDate.Format("2006-01-02"),
		DownloadURL:       c.DownloadURL,
		QRCodeData:        c.QRCodeData,
		VerificationURL:   fmt.Sprintf("/verify/%s", c.CertificateNumber),
	}

	if holder, err := uc.userRepo.FindByID(ctx, c.AssesseeID); err == nil {
		resp.HolderName = holder.FullName
	}
	if scheme, err := uc.schemeRepo.FindByID(ctx, c.SchemeID); err == nil {
		resp.SchemeName = scheme.Name
		resp.SchemeCode = scheme.Code
	}
	if c.AssessorID != nil {
		if assessor, err := uc.userRepo.FindByID(ctx, *c.AssessorID); err == nil {
			resp.AssessorName = assessor.FullName
		}
	}

	return resp
}

func toTemplateResponse(t *entity.CertificateTemplate) dto.TemplateResponse {
	resp := dto.TemplateResponse{
		ID:           t.ID.String(),
		Name:         t.Name,
		Description:  t.Description,
		ThumbnailURL: t.ThumbnailURL,
		IsDefault:    t.IsDefault,
		CreatedAt:    t.CreatedAt,
		UpdatedAt:    t.UpdatedAt,
	}

	if t.SchemeID != nil {
		s := t.SchemeID.String()
		resp.SchemeID = &s
	}

	for _, f := range t.Fields {
		resp.Fields = append(resp.Fields, dto.TemplateFieldResponse{
			ID:        f.ID.String(),
			FieldKey:  f.FieldKey,
			Label:     f.Label,
			FieldType: f.FieldType,
			PositionX: f.PositionX,
			PositionY: f.PositionY,
			FontSize:  f.FontSize,
			SortOrder: f.SortOrder,
		})
	}

	return resp
}
