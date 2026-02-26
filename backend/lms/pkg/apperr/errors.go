package apperr

import (
	"fmt"
	"net/http"
)

type AppError struct {
	Code       string            `json:"code"`
	Message    string            `json:"message"`
	HTTPStatus int               `json:"-"`
	Details    []ValidationError `json:"details,omitempty"`
	Err        error             `json:"-"`
}

type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Err)
	}
	return e.Message
}

func (e *AppError) Unwrap() error {
	return e.Err
}

func NewBadRequest(message string) *AppError {
	return &AppError{
		Code:       "BAD_REQUEST",
		Message:    message,
		HTTPStatus: http.StatusBadRequest,
	}
}

func NewValidationError(details []ValidationError) *AppError {
	return &AppError{
		Code:       "VALIDATION_FAILED",
		Message:    "Data tidak valid",
		HTTPStatus: http.StatusBadRequest,
		Details:    details,
	}
}

func NewUnauthorized(message string) *AppError {
	return &AppError{
		Code:       "UNAUTHORIZED",
		Message:    message,
		HTTPStatus: http.StatusUnauthorized,
	}
}

func NewForbidden(message string) *AppError {
	return &AppError{
		Code:       "FORBIDDEN",
		Message:    message,
		HTTPStatus: http.StatusForbidden,
	}
}

func NewNotFound(resource string) *AppError {
	return &AppError{
		Code:       "NOT_FOUND",
		Message:    fmt.Sprintf("%s tidak ditemukan", resource),
		HTTPStatus: http.StatusNotFound,
	}
}

func NewConflict(message string) *AppError {
	return &AppError{
		Code:       "CONFLICT",
		Message:    message,
		HTTPStatus: http.StatusConflict,
	}
}

func NewInternal(err error) *AppError {
	return &AppError{
		Code:       "INTERNAL_ERROR",
		Message:    "Terjadi kesalahan internal",
		HTTPStatus: http.StatusInternalServerError,
		Err:        err,
	}
}
