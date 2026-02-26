CREATE TABLE IF NOT EXISTS assessments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessee_id     UUID NOT NULL REFERENCES users(id),
    assessor_id     UUID NOT NULL REFERENCES users(id),
    scheme_id       UUID NOT NULL REFERENCES schemes(id),
    schedule_id     UUID REFERENCES schedules(id),
    recommendation  VARCHAR(20) CHECK (recommendation IN ('competent', 'not_competent')),
    assessor_notes  TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
                        'pending', 'in_progress', 'submitted'
                    )),
    submitted_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessment_results (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id   UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    criteria_id     UUID NOT NULL REFERENCES performance_criteria(id),
    status          VARCHAR(5) NOT NULL CHECK (status IN ('K', 'BK')),
    evidence_id     UUID,
    notes           TEXT
);
