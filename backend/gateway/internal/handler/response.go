package handler

import (
	"github.com/coreasia/gateway/pkg/apperr"
	"github.com/gofiber/fiber/v3"
)

type response struct {
	Data   interface{} `json:"data"`
	Meta   *meta       `json:"meta,omitempty"`
	Errors *errorBody  `json:"errors,omitempty"`
}

type meta struct {
	Total   int `json:"total"`
	Page    int `json:"page"`
	PerPage int `json:"per_page"`
}

type errorBody struct {
	Code    string                   `json:"code"`
	Message string                   `json:"message"`
	Details []apperr.ValidationError `json:"details,omitempty"`
}

func ok(c fiber.Ctx, data interface{}) error {
	return c.Status(fiber.StatusOK).JSON(response{Data: data})
}

func created(c fiber.Ctx, data interface{}) error {
	return c.Status(fiber.StatusCreated).JSON(response{Data: data})
}

func paginated(c fiber.Ctx, data interface{}, total, page, perPage int) error {
	return c.Status(fiber.StatusOK).JSON(response{
		Data: data,
		Meta: &meta{Total: total, Page: page, PerPage: perPage},
	})
}

func errResponse(c fiber.Ctx, appErr *apperr.AppError) error {
	return c.Status(appErr.HTTPStatus).JSON(response{
		Data: nil,
		Errors: &errorBody{
			Code:    appErr.Code,
			Message: appErr.Message,
			Details: appErr.Details,
		},
	})
}
