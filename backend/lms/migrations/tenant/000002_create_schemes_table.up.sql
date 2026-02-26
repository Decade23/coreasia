CREATE TABLE IF NOT EXISTS schemes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(50) NOT NULL UNIQUE,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    validity_years  INT NOT NULL DEFAULT 3,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schemes_code ON schemes(code);

CREATE TABLE IF NOT EXISTS unit_competencies (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_id   UUID NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
    code        VARCHAR(50) NOT NULL,
    title       VARCHAR(300) NOT NULL,
    sort_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS competency_elements (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id     UUID NOT NULL REFERENCES unit_competencies(id) ON DELETE CASCADE,
    title       VARCHAR(500) NOT NULL,
    sort_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS performance_criteria (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    element_id  UUID NOT NULL REFERENCES competency_elements(id) ON DELETE CASCADE,
    text        TEXT NOT NULL,
    sort_order  INT NOT NULL DEFAULT 0
);
