CREATE TABLE IF NOT EXISTS quality_reviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id   UUID NOT NULL REFERENCES assessments(id),
    assessee_id     UUID NOT NULL REFERENCES users(id),
    assessor_id     UUID NOT NULL REFERENCES users(id),
    scheme_id       UUID NOT NULL REFERENCES schemes(id),
    recommendation  VARCHAR(20) NOT NULL,
    assessor_notes  TEXT,
    manager_notes   TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending_review' CHECK (status IN (
                        'pending_review', 'approved', 'rejected', 'revision_needed'
                    )),
    reviewed_by     UUID REFERENCES users(id),
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_quality_reviews_status ON quality_reviews(status);
