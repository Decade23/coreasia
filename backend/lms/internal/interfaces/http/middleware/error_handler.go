package middleware

import (
	"errors"
	"log/slog"

	"github.com/coreasia/lms-api/internal/interfaces/http/response"
	"github.com/coreasia/lms-api/pkg/apperr"
	"github.com/gofiber/fiber/v3"
)

func GlobalErrorHandler(c fiber.Ctx, err error) error {
	var appErr *apperr.AppError
	if errors.As(err, &appErr) {
		if appErr.HTTPStatus >= 500 {
			slog.Error("internal error", "error", appErr.Err, "code", appErr.Code)
		}
		return response.Error(c, appErr)
	}

	var fiberErr *fiber.Error
	if errors.As(err, &fiberErr) {
		return c.Status(fiberErr.Code).JSON(response.Response{
			Errors: &response.ErrorBody{
				Code:    "HTTP_ERROR",
				Message: fiberErr.Message,
			},
		})
	}

	slog.Error("unhandled error", "error", err)
	return response.Error(c, apperr.NewInternal(err))
}
