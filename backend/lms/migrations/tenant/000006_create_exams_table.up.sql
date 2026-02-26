CREATE TABLE IF NOT EXISTS exams (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessee_id     UUID NOT NULL REFERENCES users(id),
    schedule_id     UUID NOT NULL REFERENCES schedules(id),
    scheme_id       UUID NOT NULL REFERENCES schemes(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
                        'pending', 'in_progress', 'submitted', 'graded'
                    )),
    started_at      TIMESTAMPTZ,
    submitted_at    TIMESTAMPTZ,
    score           DECIMAL(5,2),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exams_assessee ON exams(assessee_id);

CREATE TABLE IF NOT EXISTS exam_answers (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id            UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_id        UUID NOT NULL REFERENCES questions(id),
    answer_text        TEXT,
    selected_option_id UUID REFERENCES question_options(id),
    file_url           VARCHAR(500),
    points_awarded     DECIMAL(5,2),
    graded_by          UUID REFERENCES users(id),
    graded_at          TIMESTAMPTZ
);
