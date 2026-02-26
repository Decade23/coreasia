package entity

import (
	"time"

	"github.com/google/uuid"
)

type Schedule struct {
	ID              uuid.UUID `json:"id"`
	Title           string    `json:"title"`
	SchemeID        uuid.UUID `json:"scheme_id"`
	ScheduleType    string    `json:"schedule_type"`
	Status          string    `json:"status"`
	StartDate       time.Time `json:"start_date"`
	EndDate         time.Time `json:"end_date"`
	Location        *string   `json:"location"`
	MaxParticipants int       `json:"max_participants"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	Assessors       []User    `json:"assessors,omitempty"`
}
