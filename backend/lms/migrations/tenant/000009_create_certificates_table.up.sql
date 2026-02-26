CREATE TABLE IF NOT EXISTS certificate_templates (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(200) NOT NULL,
    description   TEXT,
    scheme_id     UUID REFERENCES schemes(id),
    thumbnail_url VARCHAR(500),
    is_default    BOOLEAN NOT NULL DEFAULT false,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS certificate_template_fields (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES certificate_templates(id) ON DELETE CASCADE,
    field_key   VARCHAR(50) NOT NULL,
    label       VARCHAR(100) NOT NULL,
    field_type  VARCHAR(20) NOT NULL CHECK (field_type IN ('text', 'date', 'image', 'qr_code')),
    position_x  DECIMAL(6,2) NOT NULL DEFAULT 0,
    position_y  DECIMAL(6,2) NOT NULL DEFAULT 0,
    font_size   INT NOT NULL DEFAULT 12,
    sort_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS certificates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_number  VARCHAR(100) NOT NULL UNIQUE,
    assessee_id         UUID NOT NULL REFERENCES users(id),
    scheme_id           UUID NOT NULL REFERENCES schemes(id),
    template_id         UUID REFERENCES certificate_templates(id),
    assessor_id         UUID REFERENCES users(id),
    status              VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN (
                            'active', 'expired', 'revoked'
                        )),
    issued_date         DATE NOT NULL,
    expiry_date         DATE NOT NULL,
    download_url        VARCHAR(500),
    qr_code_data        VARCHAR(500),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certificates_assessee ON certificates(assessee_id);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON certificates(certificate_number);
