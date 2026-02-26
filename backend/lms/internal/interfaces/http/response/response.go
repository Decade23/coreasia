package response

import (
	"github.com/coreasia/lms-api/pkg/apperr"
	"github.com/gofiber/fiber/v3"
)

type Response struct {
	Data   interface{} `json:"data"`
	Meta   *Meta       `json:"meta,omitempty"`
	Errors *ErrorBody  `json:"errors,omitempty"`
}

type Meta struct {
	Page    int `json:"page"`
	PerPage int `json:"per_page"`
	Total   int `json:"total"`
}

type ErrorBody struct {
	Code    string                   `json:"code"`
	Message string                   `json:"message"`
	Details []apperr.ValidationError `json:"details,omitempty"`
}

func OK(c fiber.Ctx, data interface{}) error {
	return c.Status(fiber.StatusOK).JSON(Response{
		Data: data,
	})
}

func Created(c fiber.Ctx, data interface{}) error {
	return c.Status(fiber.StatusCreated).JSON(Response{
		Data: data,
	})
}

func Paginated(c fiber.Ctx, data interface{}, page, perPage, total int) error {
	return c.Status(fiber.StatusOK).JSON(Response{
		Data: data,
		Meta: &Meta{
			Page:    page,
			PerPage: perPage,
			Total:   total,
		},
	})
}

func Error(c fiber.Ctx, err *apperr.AppError) error {
	return c.Status(err.HTTPStatus).JSON(Response{
		Data: nil,
		Errors: &ErrorBody{
			Code:    err.Code,
			Message: err.Message,
			Details: err.Details,
		},
	})
}

func NoContent(c fiber.Ctx) error {
	return c.SendStatus(fiber.StatusNoContent)
}
