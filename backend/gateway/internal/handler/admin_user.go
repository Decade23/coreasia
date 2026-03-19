package handler

import (
	"log/slog"
	"strconv"

	"github.com/coreasia/gateway/internal/middleware"
	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/internal/repository"
	"github.com/coreasia/gateway/pkg/apperr"
	"github.com/coreasia/gateway/pkg/validate"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AdminUserHandler struct {
	userRepo *repository.AdminUserRepo
	auditLog *repository.AuditLogRepo
}

func NewAdminUserHandler(userRepo *repository.AdminUserRepo, auditLog *repository.AuditLogRepo) *AdminUserHandler {
	return &AdminUserHandler{userRepo: userRepo, auditLog: auditLog}
}

func (h *AdminUserHandler) List(c fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "10"))

	users, total, err := h.userRepo.FindAll(c.Context(), page, perPage)
	if err != nil {
		return errResponse(c, apperr.NewInternal(err))
	}

	responses := make([]model.AdminUserResponse, len(users))
	for i, u := range users {
		responses[i] = u.ToResponse()
	}

	return paginated(c, responses, total, page, perPage)
}

func (h *AdminUserHandler) Create(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	if claims.Role != "super_admin" {
		return errResponse(c, apperr.NewForbidden("Hanya super admin yang dapat menambah user"))
	}

	var req model.CreateAdminRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	if appErr := validate.Struct(&req); appErr != nil {
		return errResponse(c, appErr)
	}

	existing, _ := h.userRepo.FindByEmail(c.Context(), req.Email)
	if existing != nil {
		return errResponse(c, apperr.NewConflict("Email sudah terdaftar"))
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return errResponse(c, apperr.NewInternal(err))
	}

	user := &model.AdminUser{
		Email:        req.Email,
		PasswordHash: string(hash),
		FullName:     req.FullName,
		Role:         req.Role,
		IsActive:     true,
	}

	if err := h.userRepo.Create(c.Context(), user); err != nil {
		slog.Error("gagal buat admin user", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	resID := user.ID.String()
	desc := "Membuat admin user: " + user.Email
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "create", "admin_users", &resID, &desc, c.IP())

	return created(c, user.ToResponse())
}

func (h *AdminUserHandler) Update(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	if claims.Role != "super_admin" {
		return errResponse(c, apperr.NewForbidden("Hanya super admin yang dapat mengubah user"))
	}

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("ID tidak valid"))
	}

	user, err := h.userRepo.FindByID(c.Context(), id)
	if err != nil || user == nil {
		return errResponse(c, apperr.NewNotFound("Admin user"))
	}

	var req model.UpdateAdminRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}

	if req.Email != nil {
		user.Email = *req.Email
	}
	if req.FullName != nil {
		user.FullName = *req.FullName
	}
	if req.Role != nil {
		user.Role = *req.Role
	}
	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}
	if req.Password != nil {
		hash, err := bcrypt.GenerateFromPassword([]byte(*req.Password), bcrypt.DefaultCost)
		if err != nil {
			return errResponse(c, apperr.NewInternal(err))
		}
		user.PasswordHash = string(hash)
	}

	if err := h.userRepo.Update(c.Context(), user); err != nil {
		slog.Error("gagal update admin user", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	resID := user.ID.String()
	desc := "Mengupdate admin user: " + user.Email
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "update", "admin_users", &resID, &desc, c.IP())

	return ok(c, user.ToResponse())
}

func (h *AdminUserHandler) Delete(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	if claims.Role != "super_admin" {
		return errResponse(c, apperr.NewForbidden("Hanya super admin yang dapat menghapus user"))
	}

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("ID tidak valid"))
	}

	if id == claims.UserID {
		return errResponse(c, apperr.NewBadRequest("Tidak dapat menghapus akun sendiri"))
	}

	user, err := h.userRepo.FindByID(c.Context(), id)
	if err != nil || user == nil {
		return errResponse(c, apperr.NewNotFound("Admin user"))
	}

	if err := h.userRepo.Delete(c.Context(), id); err != nil {
		slog.Error("gagal hapus admin user", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	resID := id.String()
	desc := "Menghapus admin user: " + user.Email
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "delete", "admin_users", &resID, &desc, c.IP())

	return c.Status(fiber.StatusNoContent).Send(nil)
}
