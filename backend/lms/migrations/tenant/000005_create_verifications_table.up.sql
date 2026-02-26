CREATE TABLE IF NOT EXISTS verifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessee_id     UUID NOT NULL REFERENCES users(id),
    scheme_id       UUID NOT NULL REFERENCES schemes(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
                        'DRAFT', 'SUBMITTED', 'UNDER_REVIEW',
                        'REVISION_NEEDED', 'VERIFIED', 'REJECTED'
                    )),
    personal_data   JSONB NOT NULL DEFAULT '{}',
    review_notes    TEXT,
    reviewed_by     UUID REFERENCES users(id),
    submitted_at    TIMESTAMPTZ,
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verifications_assessee ON verifications(assessee_id);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON verifications(status);

CREATE TABLE IF NOT EXISTS verification_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id UUID NOT NULL REFERENCES verifications(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    document_type   VARCHAR(50) NOT NULL,
    file_url        VARCHAR(500) NOT NULL,
    file_size       BIGINT NOT NULL DEFAULT 0,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
