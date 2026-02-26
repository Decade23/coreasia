package validate

import (
	"github.com/coreasia/lms-api/pkg/apperr"
	"github.com/go-playground/validator/v10"
)

var validate *validator.Validate

func init() {
	validate = validator.New(validator.WithRequiredStructEnabled())
}

func Struct(s interface{}) *apperr.AppError {
	if err := validate.Struct(s); err != nil {
		if validationErrors, ok := err.(validator.ValidationErrors); ok {
			details := make([]apperr.ValidationError, 0, len(validationErrors))
			for _, fe := range validationErrors {
				details = append(details, apperr.ValidationError{
					Field:   fe.Field(),
					Message: msgForTag(fe),
				})
			}
			return apperr.NewValidationError(details)
		}
		return apperr.NewBadRequest("Validasi gagal")
	}
	return nil
}

func msgForTag(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return fe.Field() + " wajib diisi"
	case "email":
		return "Format email tidak valid"
	case "min":
		return fe.Field() + " minimal " + fe.Param() + " karakter"
	case "max":
		return fe.Field() + " maksimal " + fe.Param() + " karakter"
	case "oneof":
		return fe.Field() + " harus salah satu dari: " + fe.Param()
	case "uuid":
		return fe.Field() + " harus format UUID valid"
	default:
		return fe.Field() + " tidak valid"
	}
}

func Instance() *validator.Validate {
	return validate
}
