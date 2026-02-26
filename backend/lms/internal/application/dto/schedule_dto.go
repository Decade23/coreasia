package dto

import "time"

type CreateScheduleRequest struct {
	Title           string   `json:"title" validate:"required,min=2,max=200"`
	SchemeID        string   `json:"scheme_id" validate:"required,uuid"`
	ScheduleType    string   `json:"schedule_type" validate:"required,oneof=cbt_online lab_offline hybrid"`
	StartDate       string   `json:"start_date" validate:"required"`
	EndDate         string   `json:"end_date" validate:"required"`
	Location        *string  `json:"location,omitempty"`
	MaxParticipants int      `json:"max_participants" validate:"required,min=1"`
	AssessorIDs     []string `json:"assessor_ids,omitempty"`
}

type UpdateScheduleRequest struct {
	Title           *string  `json:"title,omitempty" validate:"omitempty,min=2,max=200"`
	ScheduleType    *string  `json:"schedule_type,omitempty" validate:"omitempty,oneof=cbt_online lab_offline hybrid"`
	Status          *string  `json:"status,omitempty" validate:"omitempty,oneof=draft published ongoing completed cancelled"`
	StartDate       *string  `json:"start_date,omitempty"`
	EndDate         *string  `json:"end_date,omitempty"`
	Location        *string  `json:"location,omitempty"`
	MaxParticipants *int     `json:"max_participants,omitempty" validate:"omitempty,min=1"`
	AssessorIDs     []string `json:"assessor_ids,omitempty"`
}

type ScheduleResponse struct {
	ID              string         `json:"id"`
	Title           string         `json:"title"`
	SchemeID        string         `json:"scheme_id"`
	ScheduleType    string         `json:"schedule_type"`
	Status          string         `json:"status"`
	StartDate       time.Time      `json:"start_date"`
	EndDate         time.Time      `json:"end_date"`
	Location        *string        `json:"location"`
	MaxParticipants int            `json:"max_participants"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	Assessors       []UserResponse `json:"assessors,omitempty"`
}
