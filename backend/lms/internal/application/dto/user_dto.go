package dto

type CreateUserRequest struct {
	Email       string `json:"email" validate:"required,email"`
	Password    string `json:"password" validate:"required,min=6"`
	FullName    string `json:"full_name" validate:"required,min=2"`
	PhoneNumber string `json:"phone_number,omitempty"`
	Role        string `json:"role" validate:"required,oneof=admin quality_manager assessor assessee"`
}

type UpdateUserRequest struct {
	Email       string `json:"email" validate:"required,email"`
	FullName    string `json:"full_name" validate:"required,min=2"`
	PhoneNumber string `json:"phone_number,omitempty"`
	Role        string `json:"role" validate:"required,oneof=admin quality_manager assessor assessee"`
	IsActive    bool   `json:"is_active"`
}
