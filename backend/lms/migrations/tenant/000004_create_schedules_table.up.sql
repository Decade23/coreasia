CREATE TABLE IF NOT EXISTS schedules (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title               VARCHAR(200) NOT NULL,
    scheme_id           UUID NOT NULL REFERENCES schemes(id),
    schedule_type       VARCHAR(20) NOT NULL CHECK (schedule_type IN (
                            'cbt_online', 'lab_offline', 'hybrid'
                        )),
    status              VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN (
                            'draft', 'published', 'ongoing', 'completed', 'cancelled'
                        )),
    start_date          TIMESTAMPTZ NOT NULL,
    end_date            TIMESTAMPTZ NOT NULL,
    location            VARCHAR(300),
    max_participants    INT NOT NULL DEFAULT 30,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_date > start_date)
);

CREATE INDEX IF NOT EXISTS idx_schedules_scheme ON schedules(scheme_id);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);

CREATE TABLE IF NOT EXISTS schedule_assessors (
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    assessor_id UUID NOT NULL REFERENCES users(id),
    PRIMARY KEY (schedule_id, assessor_id)
);

CREATE TABLE IF NOT EXISTS assessor_profiles (
    user_id           UUID PRIMARY KEY REFERENCES users(id),
    specialization    VARCHAR(200),
    license_number    VARCHAR(100),
    license_issued_by VARCHAR(200),
    license_issued_at TIMESTAMPTZ,
    license_expiry_at TIMESTAMPTZ,
    license_status    VARCHAR(20) DEFAULT 'active' CHECK (license_status IN (
                          'active', 'expired', 'pending_renewal'
                      ))
);

CREATE TABLE IF NOT EXISTS assessor_schemes (
    assessor_id UUID NOT NULL REFERENCES users(id),
    scheme_id   UUID NOT NULL REFERENCES schemes(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (assessor_id, scheme_id)
);
