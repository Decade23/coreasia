package usecase

import (
	"context"

	"github.com/coreasia/lms-api/internal/application/dto"
	"github.com/coreasia/lms-api/internal/domain/entity"
	"github.com/coreasia/lms-api/internal/domain/repository"
	"github.com/coreasia/lms-api/pkg/apperr"
	"github.com/google/uuid"
)

type SchemeUseCase struct {
	repo repository.SchemeRepository
}

func NewSchemeUseCase(repo repository.SchemeRepository) *SchemeUseCase {
	return &SchemeUseCase{repo: repo}
}

func (uc *SchemeUseCase) List(ctx context.Context, page, perPage int, search string) ([]dto.SchemeResponse, int, error) {
	schemes, total, err := uc.repo.FindAll(ctx, page, perPage, search)
	if err != nil {
		return nil, 0, apperr.NewInternal(err)
	}

	resp := make([]dto.SchemeResponse, len(schemes))
	for i, s := range schemes {
		resp[i] = toSchemeResponse(&s)
	}
	return resp, total, nil
}

func (uc *SchemeUseCase) GetByID(ctx context.Context, id uuid.UUID) (*dto.SchemeResponse, error) {
	scheme, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return nil, apperr.NewNotFound("Skema")
	}
	resp := toSchemeResponse(scheme)
	return &resp, nil
}

func (uc *SchemeUseCase) Create(ctx context.Context, req dto.CreateSchemeRequest) (*dto.SchemeResponse, error) {
	scheme := &entity.Scheme{
		ID:            uuid.New(),
		Code:          req.Code,
		Name:          req.Name,
		Description:   req.Description,
		IsActive:      true,
		ValidityYears: req.ValidityYears,
	}

	for i, u := range req.Units {
		unit := entity.UnitCompetency{
			ID:        uuid.New(),
			Code:      u.Code,
			Title:     u.Title,
			SortOrder: i,
		}
		if u.SortOrder > 0 {
			unit.SortOrder = u.SortOrder
		}

		for j, e := range u.Elements {
			elem := entity.CompetencyElement{
				ID:        uuid.New(),
				Title:     e.Title,
				SortOrder: j,
			}
			if e.SortOrder > 0 {
				elem.SortOrder = e.SortOrder
			}

			for k, c := range e.Criteria {
				crit := entity.PerformanceCriteria{
					ID:        uuid.New(),
					Text:      c.Text,
					SortOrder: k,
				}
				if c.SortOrder > 0 {
					crit.SortOrder = c.SortOrder
				}
				elem.Criteria = append(elem.Criteria, crit)
			}
			unit.Elements = append(unit.Elements, elem)
		}
		scheme.Units = append(scheme.Units, unit)
	}

	if err := uc.repo.Create(ctx, scheme); err != nil {
		return nil, apperr.NewInternal(err)
	}

	resp := toSchemeResponse(scheme)
	return &resp, nil
}

func (uc *SchemeUseCase) Update(ctx context.Context, id uuid.UUID, req dto.UpdateSchemeRequest) (*dto.SchemeResponse, error) {
	scheme, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return nil, apperr.NewNotFound("Skema")
	}

	if req.Code != nil {
		scheme.Code = *req.Code
	}
	if req.Name != nil {
		scheme.Name = *req.Name
	}
	if req.Description != nil {
		scheme.Description = req.Description
	}
	if req.IsActive != nil {
		scheme.IsActive = *req.IsActive
	}
	if req.ValidityYears != nil {
		scheme.ValidityYears = *req.ValidityYears
	}

	if err := uc.repo.Update(ctx, scheme); err != nil {
		return nil, apperr.NewInternal(err)
	}

	resp := toSchemeResponse(scheme)
	return &resp, nil
}

func (uc *SchemeUseCase) Delete(ctx context.Context, id uuid.UUID) error {
	if _, err := uc.repo.FindByID(ctx, id); err != nil {
		return apperr.NewNotFound("Skema")
	}
	if err := uc.repo.Delete(ctx, id); err != nil {
		return apperr.NewInternal(err)
	}
	return nil
}

func toSchemeResponse(s *entity.Scheme) dto.SchemeResponse {
	resp := dto.SchemeResponse{
		ID:            s.ID.String(),
		Code:          s.Code,
		Name:          s.Name,
		Description:   s.Description,
		IsActive:      s.IsActive,
		ValidityYears: s.ValidityYears,
		CreatedAt:     s.CreatedAt,
		UpdatedAt:     s.UpdatedAt,
	}

	for _, u := range s.Units {
		unitResp := dto.UnitResponse{
			ID:        u.ID.String(),
			SchemeID:  u.SchemeID.String(),
			Code:      u.Code,
			Title:     u.Title,
			SortOrder: u.SortOrder,
		}
		for _, e := range u.Elements {
			elemResp := dto.ElementResponse{
				ID:        e.ID.String(),
				UnitID:    e.UnitID.String(),
				Title:     e.Title,
				SortOrder: e.SortOrder,
			}
			for _, c := range e.Criteria {
				elemResp.Criteria = append(elemResp.Criteria, dto.CriteriaResponse{
					ID:        c.ID.String(),
					ElementID: c.ElementID.String(),
					Text:      c.Text,
					SortOrder: c.SortOrder,
				})
			}
			unitResp.Elements = append(unitResp.Elements, elemResp)
		}
		resp.Units = append(resp.Units, unitResp)
	}

	return resp
}
