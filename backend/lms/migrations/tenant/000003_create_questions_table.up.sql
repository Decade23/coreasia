CREATE TABLE IF NOT EXISTS questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_id       UUID NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
    question_type   VARCHAR(20) NOT NULL CHECK (question_type IN (
                        'multiple_choice', 'essay', 'upload', 'observation'
                    )),
    question_text   TEXT NOT NULL,
    difficulty      VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    points          INT NOT NULL DEFAULT 1,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    rubric          TEXT,
    instructions    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_scheme ON questions(scheme_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type);

CREATE TABLE IF NOT EXISTS question_options (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    text        TEXT NOT NULL,
    is_correct  BOOLEAN NOT NULL DEFAULT false,
    sort_order  INT NOT NULL DEFAULT 0
);
