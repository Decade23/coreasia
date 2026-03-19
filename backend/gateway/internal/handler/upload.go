package handler

import (
	"log/slog"

	"github.com/coreasia/gateway/internal/middleware"
	"github.com/coreasia/gateway/internal/repository"
	"github.com/coreasia/gateway/internal/service"
	"github.com/coreasia/gateway/pkg/apperr"
	"github.com/gofiber/fiber/v3"
)

type UploadHandler struct {
	r2       *service.R2Service
	auditLog *repository.AuditLogRepo
}

func NewUploadHandler(r2 *service.R2Service, auditLog *repository.AuditLogRepo) *UploadHandler {
	return &UploadHandler{r2: r2, auditLog: auditLog}
}

func (h *UploadHandler) Upload(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)

	file, err := c.FormFile("file")
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("File tidak ditemukan"))
	}

	// Validate size (max 5MB)
	if file.Size > 5*1024*1024 {
		return errResponse(c, apperr.NewBadRequest("Ukuran file maksimal 5MB"))
	}

	// Validate content type
	contentType := file.Header.Get("Content-Type")
	allowed := map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/webp": true,
	}
	if !allowed[contentType] {
		return errResponse(c, apperr.NewBadRequest("Format file harus JPEG, PNG, atau WebP"))
	}

	src, err := file.Open()
	if err != nil {
		return errResponse(c, apperr.NewInternal(err))
	}
	defer src.Close()

	url, err := h.r2.Upload(c.Context(), src, file.Filename, contentType)
	if err != nil {
		slog.Error("gagal upload ke R2", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	desc := "Upload gambar: " + file.Filename
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "upload", "files", nil, &desc, c.IP())

	return ok(c, fiber.Map{"url": url})
}
