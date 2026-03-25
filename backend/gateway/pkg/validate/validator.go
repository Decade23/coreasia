package validate

import (
	"unicode"

	"github.com/coreasia/gateway/pkg/apperr"
	"github.com/go-playground/validator/v10"
)

var validate *validator.Validate

func init() {
	validate = validator.New(validator.WithRequiredStructEnabled())
	validate.RegisterValidation("password_strength", passwordStrengthValidator)
}

func passwordStrengthValidator(fl validator.FieldLevel) bool {
	pwd := fl.Field().String()
	if len(pwd) < 8 {
		return false
	}
	var hasUpper, hasLower, hasDigit bool
	for _, ch := range pwd {
		if unicode.IsUpper(ch) {
			hasUpper = true
		}
		if unicode.IsLower(ch) {
			hasLower = true
		}
		if unicode.IsDigit(ch) {
			hasDigit = true
		}
	}
	return hasUpper && hasLower && hasDigit
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
	case "alphanum":
		return fe.Field() + " hanya boleh huruf dan angka"
	case "password_strength":
		return "Password harus minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka"
	default:
		return fe.Field() + " tidak valid"
	}
}
