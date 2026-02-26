package handler

import (
	"github.com/coreasia/lms-api/internal/application/dto"
	"github.com/coreasia/lms-api/internal/application/usecase"
	"github.com/coreasia/lms-api/internal/interfaces/http/middleware"
	"github.com/coreasia/lms-api/internal/interfaces/http/response"
	"github.com/coreasia/lms-api/pkg/apperr"
	"github.com/coreasia/lms-api/pkg/validate"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type AuthHandler struct {
	authUC *usecase.AuthUseCase
}

func NewAuthHandler(authUC *usecase.AuthUseCase) *AuthHandler {
	return &AuthHandler{authUC: authUC}
}

func (h *AuthHandler) Login(c fiber.Ctx) error {
	var req dto.LoginRequest
	if err := c.Bind().JSON(&req); err != nil {
		return response.Error(c, apperr.NewBadRequest("Format request tidak valid"))
	}

	if appErr := validate.Struct(&req); appErr != nil {
		return response.Error(c, appErr)
	}

	tenantID := middleware.GetTenantID(c)
	result, err := h.authUC.Login(c.Context(), req, tenantID)
	if err != nil {
		if appErr, ok := err.(*apperr.AppError); ok {
			return response.Error(c, appErr)
		}
		return response.Error(c, apperr.NewInternal(err))
	}

	return response.OK(c, result)
}

func (h *AuthHandler) Register(c fiber.Ctx) error {
	var req dto.RegisterRequest
	if err := c.Bind().JSON(&req); err != nil {
		return response.Error(c, apperr.NewBadRequest("Format request tidak valid"))
	}

	if appErr := validate.Struct(&req); appErr != nil {
		return response.Error(c, appErr)
	}

	result, err := h.authUC.Register(c.Context(), req)
	if err != nil {
		if appErr, ok := err.(*apperr.AppError); ok {
			return response.Error(c, appErr)
		}
		return response.Error(c, apperr.NewInternal(err))
	}

	return response.Created(c, result)
}

func (h *AuthHandler) Me(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	if claims == nil {
		return response.Error(c, apperr.NewUnauthorized("Token tidak valid"))
	}

	result, err := h.authUC.GetCurrentUser(c.Context(), claims.UserID)
	if err != nil {
		if appErr, ok := err.(*apperr.AppError); ok {
			return response.Error(c, appErr)
		}
		return response.Error(c, apperr.NewInternal(err))
	}

	return response.OK(c, result)
}

func (h *AuthHandler) Refresh(c fiber.Ctx) error {
	var req dto.RefreshTokenRequest
	if err := c.Bind().JSON(&req); err != nil {
		return response.Error(c, apperr.NewBadRequest("Format request tidak valid"))
	}

	if appErr := validate.Struct(&req); appErr != nil {
		return response.Error(c, appErr)
	}

	tenantID := middleware.GetTenantID(c)
	result, err := h.authUC.RefreshToken(c.Context(), req.RefreshToken, tenantID)
	if err != nil {
		if appErr, ok := err.(*apperr.AppError); ok {
			return response.Error(c, appErr)
		}
		return response.Error(c, apperr.NewInternal(err))
	}

	return response.OK(c, result)
}

func (h *AuthHandler) Logout(c fiber.Ctx) error {
	return response.OK(c, dto.MessageResponse{Message: "Berhasil logout"})
}

func (h *AuthHandler) RegisterRoutes(router fiber.Router, authMw fiber.Handler) {
	auth := router.Group("/auth")
	auth.Post("/login", h.Login)
	auth.Post("/register", h.Register)
	auth.Post("/refresh", h.Refresh)

	authProtected := auth.Group("", authMw)
	authProtected.Get("/me", h.Me)
	authProtected.Post("/logout", h.Logout)
}

// parseUUID is a helper for handlers
func parseUUID(s string) (uuid.UUID, *apperr.AppError) {
	id, err := uuid.Parse(s)
	if err != nil {
		return uuid.Nil, apperr.NewBadRequest("ID tidak valid")
	}
	return id, nil
}
