package usecase

import (
	"context"
	"fmt"
	"time"

	"github.com/coreasia/lms-api/internal/application/dto"
	"github.com/coreasia/lms-api/internal/infrastructure/persistence/postgres"
	"github.com/jackc/pgx/v5"
)

type ReportUseCase struct {
	db *postgres.TenantDB
}

func NewReportUseCase(db *postgres.TenantDB) *ReportUseCase {
	return &ReportUseCase{db: db}
}

func (uc *ReportUseCase) Summary(ctx context.Context) (*dto.ReportSummaryResponse, error) {
	schema := reportSchemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	resp := &dto.ReportSummaryResponse{
		PeriodStart: time.Now().AddDate(-1, 0, 0).Format("2006-01-02"),
		PeriodEnd:   time.Now().Format("2006-01-02"),
	}

	_ = uc.db.Pool.QueryRow(ctx,
		fmt.Sprintf("SELECT COUNT(*) FROM %s.certificates", prefix),
	).Scan(&resp.TotalCertificatesIssued)

	_ = uc.db.Pool.QueryRow(ctx,
		fmt.Sprintf("SELECT COUNT(*) FROM %s.assessments", prefix),
	).Scan(&resp.TotalAssessments)

	_ = uc.db.Pool.QueryRow(ctx,
		fmt.Sprintf("SELECT COUNT(*) FROM %s.users WHERE role = 'assessee'", prefix),
	).Scan(&resp.TotalAssessees)

	_ = uc.db.Pool.QueryRow(ctx,
		fmt.Sprintf("SELECT COUNT(*) FROM %s.schemes WHERE is_active = true", prefix),
	).Scan(&resp.TotalSchemes)

	return resp, nil
}

func (uc *ReportUseCase) BnspExport(ctx context.Context, req dto.BnspExportRequest) (*dto.BnspExportResponse, error) {
	schema := reportSchemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	where := " WHERE c.issued_date >= $1 AND c.issued_date <= $2"
	args := []interface{}{req.PeriodStart, req.PeriodEnd}
	if req.SchemeID != nil {
		where += " AND c.scheme_id = $3"
		args = append(args, *req.SchemeID)
	}

	var recordCount int
	_ = uc.db.Pool.QueryRow(ctx,
		fmt.Sprintf("SELECT COUNT(*) FROM %s.certificates c%s", prefix, where), args...,
	).Scan(&recordCount)

	schemeLabel := "ALL"
	if req.SchemeID != nil {
		schemeLabel = *req.SchemeID
	}

	fileName := fmt.Sprintf("BNSP_Export_%s_%s_%s.%s", schemeLabel, req.PeriodStart, req.PeriodEnd, req.Format)

	return &dto.BnspExportResponse{
		DownloadURL: fmt.Sprintf("/api/reports/download/%s", fileName),
		FileName:    fileName,
		RecordCount: recordCount,
		GeneratedAt: time.Now(),
	}, nil
}

type reportSchemaKey string

const reportContextKey reportSchemaKey = "tenant_schema"

func reportSchemaFromCtx(ctx context.Context) string {
	if schema, ok := ctx.Value(reportContextKey).(string); ok && schema != "" {
		return schema
	}
	return "_template"
}
