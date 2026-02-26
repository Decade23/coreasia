package handler

import (
	"fmt"
	"strconv"

	"github.com/coreasia/lms-api/internal/application/dto"
	"github.com/coreasia/lms-api/internal/domain/entity"
	"github.com/coreasia/lms-api/internal/domain/repository"
	"github.com/coreasia/lms-api/internal/interfaces/http/response"
	"github.com/coreasia/lms-api/pkg/apperr"
	"github.com/coreasia/lms-api/pkg/validate"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type UserHandler struct {
	userRepo repository.UserRepository
}

func NewUserHandler(userRepo repository.UserRepository) *UserHandler {
	return &UserHandler{userRepo: userRepo}
}

func (h *UserHandler) List(c fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "10"))
	search := c.Query("search")

	users, total, err := h.userRepo.FindAll(c.Context(), page, perPage, search)
	if err != nil {
		return handleError(c, err)
	}

	result := make([]dto.UserResponse, 0, len(users))
	for i := range users {
		result = append(result, mapUserResponse(&users[i]))
	}

	return response.Paginated(c, result, page, perPage, total)
}

func (h *UserHandler) Create(c fiber.Ctx) error {
	var req dto.CreateUserRequest
	if err := c.Bind().JSON(&req); err != nil {
		return response.Error(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	if appErr := validate.Struct(&req); appErr != nil {
		return response.Error(c, appErr)
	}

	// Check email uniqueness
	existing, _ := h.userRepo.FindByEmail(c.Context(), req.Email)
	if existing != nil {
		return response.Error(c, apperr.NewConflict("Email sudah terdaftar"))
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return handleError(c, apperr.NewInternal(fmt.Errorf("gagal hash password: %w", err)))
	}

	user := &entity.User{
		ID:           uuid.New(),
		Email:        req.Email,
		PasswordHash: string(hash),
		FullName:     req.FullName,
		Role:         req.Role,
		IsActive:     true,
	}

	if req.PhoneNumber != "" {
		user.PhoneNumber = &req.PhoneNumber
	}

	if err := h.userRepo.Create(c.Context(), user); err != nil {
		return handleError(c, apperr.NewInternal(fmt.Errorf("gagal membuat user: %w", err)))
	}

	return response.Created(c, mapUserResponse(user))
}

func (h *UserHandler) Update(c fiber.Ctx) error {
	id, appErr := parseUUID(c.Params("id"))
	if appErr != nil {
		return response.Error(c, appErr)
	}

	var req dto.UpdateUserRequest
	if err := c.Bind().JSON(&req); err != nil {
		return response.Error(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	if appErr := validate.Struct(&req); appErr != nil {
		return response.Error(c, appErr)
	}

	user, err := h.userRepo.FindByID(c.Context(), id)
	if err != nil {
		return handleError(c, apperr.NewNotFound("User"))
	}

	// Check email uniqueness if changed
	if req.Email != user.Email {
		existing, _ := h.userRepo.FindByEmail(c.Context(), req.Email)
		if existing != nil {
			return response.Error(c, apperr.NewConflict("Email sudah digunakan pengguna lain"))
		}
	}

	user.Email = req.Email
	user.FullName = req.FullName
	user.Role = req.Role
	user.IsActive = req.IsActive

	if req.PhoneNumber != "" {
		user.PhoneNumber = &req.PhoneNumber
	} else {
		user.PhoneNumber = nil
	}

	if err := h.userRepo.Update(c.Context(), user); err != nil {
		return handleError(c, apperr.NewInternal(fmt.Errorf("gagal memperbarui user: %w", err)))
	}

	return response.OK(c, mapUserResponse(user))
}

func (h *UserHandler) Delete(c fiber.Ctx) error {
	id, appErr := parseUUID(c.Params("id"))
	if appErr != nil {
		return response.Error(c, appErr)
	}

	// Verify user exists
	if _, err := h.userRepo.FindByID(c.Context(), id); err != nil {
		return handleError(c, apperr.NewNotFound("User"))
	}

	if err := h.userRepo.Delete(c.Context(), id); err != nil {
		return handleError(c, apperr.NewInternal(fmt.Errorf("gagal menghapus user: %w", err)))
	}

	return response.NoContent(c)
}

func (h *UserHandler) RegisterRoutes(router fiber.Router) {
	users := router.Group("/users")
	users.Get("/", h.List)
	users.Post("/", h.Create)
	users.Put("/:id", h.Update)
	users.Delete("/:id", h.Delete)
}

// mapUserResponse converts an entity.User to a dto.UserResponse.
func mapUserResponse(u *entity.User) dto.UserResponse {
	return dto.UserResponse{
		ID:          u.ID.String(),
		Email:       u.Email,
		FullName:    u.FullName,
		PhoneNumber: u.PhoneNumber,
		Role:        u.Role,
		IsActive:    u.IsActive,
		LastLoginAt: u.LastLoginAt,
		CreatedAt:   u.CreatedAt,
		UpdatedAt:   u.UpdatedAt,
	}
}
