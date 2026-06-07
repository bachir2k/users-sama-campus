-- ============================================================
-- SamaCampus — Schéma PostgreSQL
-- Gestion des étudiants, cartes campus, transactions, accès,
-- présences et détection de fraude par IA.
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. UTILISATEURS & AUTHENTIFICATION
-- ============================================================

CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'staff')),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. ÉTUDIANTS
-- ============================================================

CREATE TABLE students (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_code  TEXT NOT NULL UNIQUE,              -- ex: ETU-5821
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  promo         TEXT NOT NULL,                     -- ex: Master 1 · 2026
  class         TEXT NOT NULL,                     -- ex: Master 1, Licence 3
  promo_year    SMALLINT NOT NULL,
  avatar_url    TEXT,
  phone         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_students_student_code ON students(student_code);
CREATE INDEX idx_students_user_id ON students(user_id);

-- ============================================================
-- 3. CARTES CAMPUS (NFC / QR)
-- ============================================================

CREATE TABLE cards (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  card_number     TEXT NOT NULL UNIQUE,            -- ex: 5821 04XX 7799 01
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'blocked', 'pending', 'lost')),
  balance_fcfa    INTEGER NOT NULL DEFAULT 0,      -- en FCFA (centimes non utilisés)
  daily_limit     INTEGER NOT NULL DEFAULT 25000,  -- plafond journalier en FCFA
  nfc_enabled     BOOLEAN NOT NULL DEFAULT true,
  qr_secret       TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  qr_refreshed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '4 years'),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cards_student_id ON cards(student_id);
CREATE INDEX idx_cards_status ON cards(status);

-- ============================================================
-- 4. CATÉGORIES DE TRANSACTIONS
-- ============================================================

CREATE TABLE transaction_categories (
  id    SMALLSERIAL PRIMARY KEY,
  code  TEXT NOT NULL UNIQUE,   -- cafeteria, transport, library, reload, other
  label TEXT NOT NULL,          -- Cafétéria, Transport, Bibliothèque, Rechargement
  icon  TEXT NOT NULL           -- fork, bus, book, plus, bolt
);

INSERT INTO transaction_categories (code, label, icon) VALUES
  ('cafeteria',  'Cafétéria',     'fork'),
  ('transport',  'Transport',     'bus'),
  ('library',    'Bibliothèque',  'book'),
  ('reload',     'Rechargement',  'plus'),
  ('access',     'Accès',         'qr'),
  ('other',      'Autre',         'bolt');

-- ============================================================
-- 5. TRANSACTIONS
-- ============================================================

CREATE TABLE transactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id       UUID NOT NULL REFERENCES cards(id) ON DELETE RESTRICT,
  student_id    UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  category_id   SMALLINT NOT NULL REFERENCES transaction_categories(id),
  label         TEXT NOT NULL,             -- ex: Déjeuner — Menu campus
  amount_fcfa   INTEGER NOT NULL,          -- négatif = débit, positif = crédit
  balance_after INTEGER NOT NULL,          -- solde après transaction
  status        TEXT NOT NULL DEFAULT 'completed'
                  CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  terminal_id   TEXT,                      -- identifiant du terminal de paiement
  location      TEXT,                      -- lieu (ex: Cafétéria du campus)
  ref_ext       TEXT,                      -- référence Orange Money / Wave
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_card_id    ON transactions(card_id);
CREATE INDEX idx_transactions_student_id ON transactions(student_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_status     ON transactions(status);

-- ============================================================
-- 6. RECHARGEMENTS
-- ============================================================

CREATE TABLE reloads (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
  provider       TEXT NOT NULL CHECK (provider IN ('orange_money', 'wave', 'free_money', 'cash')),
  external_ref   TEXT,                    -- référence opérateur mobile money
  amount_fcfa    INTEGER NOT NULL,
  fee_fcfa       INTEGER NOT NULL DEFAULT 0,
  confirmed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 7. ZONES DU CAMPUS
-- ============================================================

CREATE TABLE zones (
  id          SMALLSERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,       -- ex: Bâtiment B, Bibliothèque
  capacity    SMALLINT NOT NULL,
  access_mode TEXT NOT NULL DEFAULT 'qr_nfc'
                CHECK (access_mode IN ('free', 'qr_nfc', 'nfc_only', 'admin_only')),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO zones (name, capacity, access_mode) VALUES
  ('Bâtiment B',       200, 'qr_nfc'),
  ('Bibliothèque',     120, 'qr_nfc'),
  ('Cafétéria',        250, 'free'),
  ('Labo 3 — Réseaux', 40,  'nfc_only');

-- ============================================================
-- 8. JOURNAUX D'ACCÈS
-- ============================================================

CREATE TABLE access_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id    UUID NOT NULL REFERENCES cards(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  zone_id    SMALLINT NOT NULL REFERENCES zones(id),
  granted    BOOLEAN NOT NULL,
  method     TEXT NOT NULL CHECK (method IN ('qr', 'nfc', 'manual')),
  reason     TEXT,                        -- raison du refus si granted=false
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_access_logs_student_id ON access_logs(student_id);
CREATE INDEX idx_access_logs_zone_id    ON access_logs(zone_id);
CREATE INDEX idx_access_logs_created_at ON access_logs(created_at DESC);

-- ============================================================
-- 9. OCCUPANCY TEMPS RÉEL (mis à jour par triggers)
-- ============================================================

CREATE TABLE zone_occupancy (
  zone_id    SMALLINT PRIMARY KEY REFERENCES zones(id),
  current    SMALLINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO zone_occupancy (zone_id, current)
  SELECT id, 0 FROM zones;

-- ============================================================
-- 10. COURS & MATIÈRES
-- ============================================================

CREATE TABLE courses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        TEXT NOT NULL UNIQUE,       -- ex: INFO-501
  title       TEXT NOT NULL,              -- ex: Algorithmique avancée
  credits     SMALLINT NOT NULL DEFAULT 3,
  department  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 11. SESSIONS DE COURS (emploi du temps)
-- ============================================================

CREATE TABLE course_sessions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  zone_id    SMALLINT REFERENCES zones(id),
  room       TEXT NOT NULL,               -- ex: Amphi A, Salle 204
  starts_at  TIMESTAMPTZ NOT NULL,
  ends_at    TIMESTAMPTZ NOT NULL,
  promo      TEXT NOT NULL,               -- ex: Master 1 2026
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_course_sessions_course_id  ON course_sessions(course_id);
CREATE INDEX idx_course_sessions_starts_at  ON course_sessions(starts_at);

-- ============================================================
-- 12. PRÉSENCES (pointage par badge)
-- ============================================================

CREATE TABLE attendances (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id        UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_session_id UUID NOT NULL REFERENCES course_sessions(id) ON DELETE CASCADE,
  scanned_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  method            TEXT NOT NULL DEFAULT 'badge' CHECK (method IN ('badge', 'manual')),
  UNIQUE (student_id, course_session_id)
);

CREATE INDEX idx_attendances_student_id ON attendances(student_id);
CREATE INDEX idx_attendances_session_id ON attendances(course_session_id);

-- ============================================================
-- 13. ALERTES FRAUDE (détection IA)
-- ============================================================

CREATE TABLE fraud_alerts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id   UUID REFERENCES students(id) ON DELETE SET NULL,
  card_id      UUID REFERENCES cards(id) ON DELETE SET NULL,
  severity     TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  type         TEXT NOT NULL,             -- ex: card_clone, simultaneous_access
  description  TEXT NOT NULL,
  location     TEXT,
  ai_model     TEXT NOT NULL DEFAULT 'TF-Lite',
  ai_score     NUMERIC(4,3),             -- score de confiance 0.000–1.000
  status       TEXT NOT NULL DEFAULT 'open'
                 CHECK (status IN ('open', 'resolved', 'ignored', 'escalated')),
  resolved_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fraud_alerts_student_id ON fraud_alerts(student_id);
CREATE INDEX idx_fraud_alerts_severity   ON fraud_alerts(severity);
CREATE INDEX idx_fraud_alerts_status     ON fraud_alerts(status);
CREATE INDEX idx_fraud_alerts_created_at ON fraud_alerts(created_at DESC);

-- ============================================================
-- 14. NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,              -- payment, access_denied, reload, fraud_alert
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id    ON notifications(user_id);
CREATE INDEX idx_notifications_read       ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================
-- 15. SESSIONS ADMIN (audit)
-- ============================================================

CREATE TABLE admin_sessions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at   TIMESTAMPTZ
);

-- ============================================================
-- FONCTIONS & TRIGGERS
-- ============================================================

-- Mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Mise à jour du solde de la carte lors d'une transaction
CREATE OR REPLACE FUNCTION update_card_balance()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE cards
  SET balance_fcfa = balance_fcfa + NEW.amount_fcfa,
      updated_at   = NOW()
  WHERE id = NEW.card_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_transaction_balance
  AFTER INSERT ON transactions
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_card_balance();

-- Mise à jour de l'occupancy des zones
CREATE OR REPLACE FUNCTION update_zone_occupancy()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.granted THEN
    UPDATE zone_occupancy
    SET current    = GREATEST(0, current + 1),
        updated_at = NOW()
    WHERE zone_id = NEW.zone_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_access_occupancy
  AFTER INSERT ON access_logs
  FOR EACH ROW EXECUTE FUNCTION update_zone_occupancy();

-- Régénération automatique du secret QR toutes les 60 secondes (appelé par cron)
CREATE OR REPLACE FUNCTION refresh_qr_secrets()
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE cards
  SET qr_secret       = encode(gen_random_bytes(32), 'hex'),
      qr_refreshed_at = NOW()
  WHERE status = 'active'
    AND qr_refreshed_at < NOW() - INTERVAL '60 seconds';
END;
$$;

-- ============================================================
-- VUES PRATIQUES
-- ============================================================

CREATE VIEW v_student_cards AS
  SELECT
    s.student_code,
    s.first_name || ' ' || s.last_name AS full_name,
    s.class,
    s.promo_year,
    c.card_number,
    c.status        AS card_status,
    c.balance_fcfa,
    c.daily_limit,
    c.nfc_enabled,
    c.issued_at,
    c.expires_at
  FROM students s
  JOIN cards c ON c.student_id = s.id;

CREATE VIEW v_daily_stats AS
  SELECT
    DATE_TRUNC('day', created_at) AS day,
    COUNT(*) FILTER (WHERE amount_fcfa < 0) AS debit_count,
    COUNT(*) FILTER (WHERE amount_fcfa > 0) AS reload_count,
    SUM(amount_fcfa) FILTER (WHERE amount_fcfa < 0) AS total_debits,
    SUM(amount_fcfa) FILTER (WHERE amount_fcfa > 0) AS total_reloads,
    COUNT(*) AS total_transactions
  FROM transactions
  WHERE status = 'completed'
  GROUP BY DATE_TRUNC('day', created_at)
  ORDER BY day DESC;

CREATE VIEW v_fraud_open AS
  SELECT
    fa.id,
    fa.severity,
    fa.type,
    fa.description,
    fa.location,
    fa.ai_score,
    fa.created_at,
    s.first_name || ' ' || s.last_name AS student_name,
    s.student_code
  FROM fraud_alerts fa
  LEFT JOIN students s ON s.id = fa.student_id
  WHERE fa.status = 'open'
  ORDER BY
    CASE fa.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
    fa.created_at DESC;

CREATE VIEW v_attendance_rate AS
  SELECT
    s.student_code,
    s.first_name || ' ' || s.last_name AS full_name,
    s.class,
    COUNT(DISTINCT cs.id)  AS total_sessions,
    COUNT(DISTINCT a.course_session_id) AS attended,
    ROUND(
      COUNT(DISTINCT a.course_session_id)::NUMERIC /
      NULLIF(COUNT(DISTINCT cs.id), 0) * 100, 1
    ) AS attendance_rate
  FROM students s
  JOIN course_sessions cs ON cs.promo = s.class
  LEFT JOIN attendances a ON a.student_id = s.id AND a.course_session_id = cs.id
  GROUP BY s.id, s.student_code, s.first_name, s.last_name, s.class;

-- ============================================================
-- DONNÉES DE TEST (développement uniquement)
-- ============================================================

-- Utilisateur admin
INSERT INTO users (email, password_hash, role) VALUES
  ('admin@samacampus.sn', crypt('admin2024!', gen_salt('bf')), 'admin');

-- Étudiants fictifs
WITH u AS (
  INSERT INTO users (email, password_hash, role) VALUES
    ('awa.ndiaye@samacampus.sn',     crypt('pass1234', gen_salt('bf')), 'student'),
    ('moussa.sow@samacampus.sn',     crypt('pass1234', gen_salt('bf')), 'student'),
    ('fatou.ba@samacampus.sn',       crypt('pass1234', gen_salt('bf')), 'student'),
    ('ibrahima.diop@samacampus.sn',  crypt('pass1234', gen_salt('bf')), 'student'),
    ('aicha.fall@samacampus.sn',     crypt('pass1234', gen_salt('bf')), 'student'),
    ('cheikh.diallo@samacampus.sn',  crypt('pass1234', gen_salt('bf')), 'student')
  RETURNING id, email
)
INSERT INTO students (user_id, student_code, first_name, last_name, promo, class, promo_year)
SELECT u.id,
  CASE u.email
    WHEN 'awa.ndiaye@samacampus.sn'    THEN 'ETU-5821'
    WHEN 'moussa.sow@samacampus.sn'    THEN 'ETU-4471'
    WHEN 'fatou.ba@samacampus.sn'      THEN 'ETU-2208'
    WHEN 'ibrahima.diop@samacampus.sn' THEN 'ETU-3390'
    WHEN 'aicha.fall@samacampus.sn'    THEN 'ETU-6012'
    WHEN 'cheikh.diallo@samacampus.sn' THEN 'ETU-1187'
  END,
  SPLIT_PART(SPLIT_PART(u.email, '@', 1), '.', 1),
  INITCAP(SPLIT_PART(SPLIT_PART(u.email, '@', 1), '.', 2)),
  CASE u.email
    WHEN 'awa.ndiaye@samacampus.sn'    THEN 'Master 1 · 2026'
    WHEN 'moussa.sow@samacampus.sn'    THEN 'Licence 3 · 2025'
    WHEN 'fatou.ba@samacampus.sn'      THEN 'Master 2 · 2025'
    WHEN 'ibrahima.diop@samacampus.sn' THEN 'Licence 2 · 2026'
    WHEN 'aicha.fall@samacampus.sn'    THEN 'Master 1 · 2026'
    WHEN 'cheikh.diallo@samacampus.sn' THEN 'Licence 1 · 2027'
  END,
  CASE u.email
    WHEN 'awa.ndiaye@samacampus.sn'    THEN 'Master 1'
    WHEN 'moussa.sow@samacampus.sn'    THEN 'Licence 3'
    WHEN 'fatou.ba@samacampus.sn'      THEN 'Master 2'
    WHEN 'ibrahima.diop@samacampus.sn' THEN 'Licence 2'
    WHEN 'aicha.fall@samacampus.sn'    THEN 'Master 1'
    WHEN 'cheikh.diallo@samacampus.sn' THEN 'Licence 1'
  END,
  CASE u.email
    WHEN 'moussa.sow@samacampus.sn'   THEN 2025
    WHEN 'fatou.ba@samacampus.sn'     THEN 2025
    WHEN 'cheikh.diallo@samacampus.sn'THEN 2027
    ELSE 2026
  END
FROM u;

-- Cartes
INSERT INTO cards (student_id, card_number, status, balance_fcfa)
SELECT s.id,
  CASE s.student_code
    WHEN 'ETU-5821' THEN '5821 04XX 7799 01'
    WHEN 'ETU-4471' THEN '4471 08XX 3312 04'
    WHEN 'ETU-2208' THEN '2208 11XX 6643 09'
    WHEN 'ETU-3390' THEN '3390 07XX 1124 02'
    WHEN 'ETU-6012' THEN '6012 02XX 9981 07'
    WHEN 'ETU-1187' THEN '1187 05XX 4420 03'
  END,
  CASE s.student_code
    WHEN 'ETU-4471' THEN 'blocked'
    WHEN 'ETU-1187' THEN 'pending'
    ELSE 'active'
  END,
  CASE s.student_code
    WHEN 'ETU-5821' THEN 24500
    WHEN 'ETU-4471' THEN 1200
    WHEN 'ETU-2208' THEN 8750
    WHEN 'ETU-3390' THEN 540
    WHEN 'ETU-6012' THEN 33100
    WHEN 'ETU-1187' THEN 0
  END
FROM students s;
