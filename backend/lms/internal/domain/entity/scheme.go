package entity

import (
	"time"

	"github.com/google/uuid"
)

type Scheme struct {
	ID            uuid.UUID         `json:"id"`
	Code          string            `json:"code"`
	Name          string            `json:"name"`
	Description   *string           `json:"description"`
	IsActive      bool              `json:"is_active"`
	ValidityYears int               `json:"validity_years"`
	CreatedAt     time.Time         `json:"created_at"`
	UpdatedAt     time.Time         `json:"updated_at"`
	Units         []UnitCompetency  `json:"units,omitempty"`
}

type UnitCompetency struct {
	ID        uuid.UUID           `json:"id"`
	SchemeID  uuid.UUID           `json:"scheme_id"`
	Code      string              `json:"code"`
	Title     string              `json:"title"`
	SortOrder int                 `json:"sort_order"`
	Elements  []CompetencyElement `json:"elements,omitempty"`
}

type CompetencyElement struct {
	ID        uuid.UUID              `json:"id"`
	UnitID    uuid.UUID              `json:"unit_id"`
	Title     string                 `json:"title"`
	SortOrder int                    `json:"sort_order"`
	Criteria  []PerformanceCriteria  `json:"criteria,omitempty"`
}

type PerformanceCriteria struct {
	ID        uuid.UUID `json:"id"`
	ElementID uuid.UUID `json:"element_id"`
	Text      string    `json:"text"`
	SortOrder int       `json:"sort_order"`
}
