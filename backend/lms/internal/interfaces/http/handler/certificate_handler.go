package handler

import (
	"strconv"

	"github.com/coreasia/lms-api/internal/application/dto"
	"github.com/coreasia/lms-api/internal/application/usecase"
	"github.com/coreasia/lms-api/internal/interfaces/http/response"
	"github.com/coreasia/lms-api/pkg/apperr"
	"github.com/coreasia/lms-api/pkg/validate"
	"github.com/gofiber/fiber/v3"
)

type CertificateHandler struct {
	uc *usecase.CertificateUseCase
}

func NewCertificateHandler(uc *usecase.CertificateUseCase) *CertificateHandler {
	return &CertificateHandler{uc: uc}
}

func (h *CertificateHandler) List(c fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "10"))

	certs, total, err := h.uc.List(c.Context(), page, perPage, nil)
	if err != nil {
		return handleError(c, err)
	}

	return response.Paginated(c, certs, page, perPage, total)
}

func (h *CertificateHandler) GetByID(c fiber.Ctx) error {
	id, appErr := parseUUID(c.Params("id"))
	if appErr != nil {
		return response.Error(c, appErr)
	}

	cert, err := h.uc.GetByID(c.Context(), id)
	if err != nil {
		return handleError(c, err)
	}

	return response.OK(c, cert)
}

func (h *CertificateHandler) Verify(c fiber.Ctx) error {
	number := c.Params("number")
	if number == "" {
		return response.Error(c, apperr.NewBadRequest("Nomor sertifikat wajib diisi"))
	}

	result, err := h.uc.Verify(c.Context(), number)
	if err != nil {
		return handleError(c, err)
	}

	return response.OK(c, result)
}

// Template CRUD

func (h *CertificateHandler) ListTemplates(c fiber.Ctx) error {
	templates, err := h.uc.ListTemplates(c.Context())
	if err != nil {
		return handleError(c, err)
	}

	return response.OK(c, templates)
}

func (h *CertificateHandler) GetTemplate(c fiber.Ctx) error {
	id, appErr := parseUUID(c.Params("id"))
	if appErr != nil {
		return response.Error(c, appErr)
	}

	tmpl, err := h.uc.GetTemplate(c.Context(), id)
	if err != nil {
		return handleError(c, err)
	}

	return response.OK(c, tmpl)
}

func (h *CertificateHandler) CreateTemplate(c fiber.Ctx) error {
	var req dto.CreateTemplateRequest
	if err := c.Bind().JSON(&req); err != nil {
		return response.Error(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	if appErr := validate.Struct(&req); appErr != nil {
		return response.Error(c, appErr)
	}

	tmpl, err := h.uc.CreateTemplate(c.Context(), req)
	if err != nil {
		return handleError(c, err)
	}

	return response.Created(c, tmpl)
}

func (h *CertificateHandler) UpdateTemplate(c fiber.Ctx) error {
	id, appErr := parseUUID(c.Params("id"))
	if appErr != nil {
		return response.Error(c, appErr)
	}

	var req dto.CreateTemplateRequest
	if err := c.Bind().JSON(&req); err != nil {
		return response.Error(c, apperr.NewBadRequest("Format request tidak valid"))
	}

	tmpl, err := h.uc.UpdateTemplate(c.Context(), id, req)
	if err != nil {
		return handleError(c, err)
	}

	return response.OK(c, tmpl)
}

func (h *CertificateHandler) DeleteTemplate(c fiber.Ctx) error {
	id, appErr := parseUUID(c.Params("id"))
	if appErr != nil {
		return response.Error(c, appErr)
	}

	if err := h.uc.DeleteTemplate(c.Context(), id); err != nil {
		return handleError(c, err)
	}

	return response.NoContent(c)
}

func (h *CertificateHandler) RegisterCertRoutes(router fiber.Router) {
	certs := router.Group("/certificates")
	certs.Get("/", h.List)
	certs.Get("/:id", h.GetByID)
}

func (h *CertificateHandler) RegisterVerifyRoute(app fiber.Router) {
	app.Get("/verify/:number", h.Verify)
}

func (h *CertificateHandler) RegisterTemplateRoutes(router fiber.Router) {
	templates := router.Group("/certificate-templates")
	templates.Get("/", h.ListTemplates)
	templates.Get("/:id", h.GetTemplate)
	templates.Post("/", h.CreateTemplate)
	templates.Put("/:id", h.UpdateTemplate)
	templates.Delete("/:id", h.DeleteTemplate)
}
