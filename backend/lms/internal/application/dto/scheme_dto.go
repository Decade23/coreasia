package dto

import "time"

type CreateSchemeRequest struct {
	Code          string               `json:"code" validate:"required,min=2,max=50"`
	Name          string               `json:"name" validate:"required,min=2,max=200"`
	Description   *string              `json:"description,omitempty"`
	ValidityYears int                  `json:"validity_years" validate:"required,min=1,max=10"`
	Units         []CreateUnitRequest  `json:"units,omitempty"`
}

type UpdateSchemeRequest struct {
	Code          *string `json:"code,omitempty" validate:"omitempty,min=2,max=50"`
	Name          *string `json:"name,omitempty" validate:"omitempty,min=2,max=200"`
	Description   *string `json:"description,omitempty"`
	IsActive      *bool   `json:"is_active,omitempty"`
	ValidityYears *int    `json:"validity_years,omitempty" validate:"omitempty,min=1,max=10"`
}

type CreateUnitRequest struct {
	Code      string                  `json:"code" validate:"required"`
	Title     string                  `json:"title" validate:"required"`
	SortOrder int                     `json:"sort_order"`
	Elements  []CreateElementRequest  `json:"elements,omitempty"`
}

type CreateElementRequest struct {
	Title     string                   `json:"title" validate:"required"`
	SortOrder int                      `json:"sort_order"`
	Criteria  []CreateCriteriaRequest  `json:"criteria,omitempty"`
}

type CreateCriteriaRequest struct {
	Text      string `json:"text" validate:"required"`
	SortOrder int    `json:"sort_order"`
}

type SchemeResponse struct {
	ID            string              `json:"id"`
	Code          string              `json:"code"`
	Name          string              `json:"name"`
	Description   *string             `json:"description"`
	IsActive      bool                `json:"is_active"`
	ValidityYears int                 `json:"validity_years"`
	CreatedAt     time.Time           `json:"created_at"`
	UpdatedAt     time.Time           `json:"updated_at"`
	Units         []UnitResponse      `json:"units,omitempty"`
}

type UnitResponse struct {
	ID        string            `json:"id"`
	SchemeID  string            `json:"scheme_id"`
	Code      string            `json:"code"`
	Title     string            `json:"title"`
	SortOrder int               `json:"sort_order"`
	Elements  []ElementResponse `json:"elements,omitempty"`
}

type ElementResponse struct {
	ID        string             `json:"id"`
	UnitID    string             `json:"unit_id"`
	Title     string             `json:"title"`
	SortOrder int                `json:"sort_order"`
	Criteria  []CriteriaResponse `json:"criteria,omitempty"`
}

type CriteriaResponse struct {
	ID        string `json:"id"`
	ElementID string `json:"element_id"`
	Text      string `json:"text"`
	SortOrder int    `json:"sort_order"`
}
