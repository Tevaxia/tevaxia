-- ============================================================
-- COOWNERSHIP FINANCE — Budget, appels de fonds, paiements
-- ============================================================
-- Extension du vertical syndic pour gérer les appels de fonds
-- trimestriels ou mensuels et le suivi des paiements par lot.
--
-- Dépend de : 014_coownerships.sql

-- ============================================================
-- 1. Budgets annuels
-- ============================================================

CREATE TABLE IF NOT EXISTS coownership_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coownership_id UUID NOT NULL REFERENCES coownerships(id) ON DELETE CASCADE,

  year INT NOT NULL,
  total_budget NUMERIC NOT NULL DEFAULT 0,
  approved_at_ag DATE,  -- date de l'AG qui a voté le budget

  -- Ventilation par poste (JSONB pour flexibilité)
  -- ex. { "charges_generales": 18000, "entretien": 4200, "energie": 9500,
  --       "assurances": 2800, "syndic_honoraires": 3600, "reserves": 1900 }
  categories JSONB NOT NULL DEFAULT '{}',

  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (coownership_id, year)
);

CREATE INDEX IF NOT EXISTS budgets_coown_idx ON coownership_budgets(coownership_id);

-- ============================================================
-- 2. Appels de fonds (par période)
-- ============================================================

CREATE TABLE IF NOT EXISTS coownership_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coownership_id UUID NOT NULL REFERENCES coownerships(id) ON DELETE CASCADE,

  label TEXT NOT NULL,           -- ex. "T1 2026 — Appel provisionnel"
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  due_date DATE NOT NULL,

  -- Montant total appelé sur la copropriété
  total_amount NUMERIC NOT NULL DEFAULT 0,
  -- Part du budget annuel que cet appel représente (ex. 25% pour T1)
  budget_share_pct NUMERIC,

  -- Référence bancaire pour le virement
  bank_iban TEXT,
  bank_bic TEXT,
  bank_account_holder TEXT,
  payment_reference_template TEXT DEFAULT 'COPRO-{lot}-{period}',

  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','issued','partially_paid','paid','overdue','cancelled')),

  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK (period_end >= period_start)
);

CREATE INDEX IF NOT EXISTS calls_coown_idx ON coownership_calls(coownership_id);
CREATE INDEX IF NOT EXISTS calls_status_idx ON coownership_calls(status);
CREATE INDEX IF NOT EXISTS calls_due_idx ON coownership_calls(due_date);

-- ============================================================
-- 3. Charges par lot (découpage d'un appel selon tantièmes)
-- ============================================================

CREATE TABLE IF NOT EXISTS coownership_unit_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES coownership_calls(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES coownership_units(id) ON DELETE CASCADE,

  -- Montant dû calculé = total_call × tantiemes_lot / total_tantiemes
  amount_due NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC NOT NULL DEFAULT 0,

  payment_reference TEXT,         -- ex. COPRO-LOT3-2026Q1
  paid_at TIMESTAMPTZ,
  payment_method TEXT,            -- 'virement','cheque','prelevement','espece'

  -- Relances
  reminder_count INT NOT NULL DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,

  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (call_id, unit_id)
);

CREATE INDEX IF NOT EXISTS charges_call_idx ON coownership_unit_charges(call_id);
CREATE INDEX IF NOT EXISTS charges_unit_idx ON coownership_unit_charges(unit_id);
CREATE INDEX IF NOT EXISTS charges_unpaid_idx ON coownership_unit_charges(paid_at)
  WHERE paid_at IS NULL;

-- ============================================================
-- 4. RLS — accès via l'organisation syndic
-- ============================================================

ALTER TABLE coownership_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE coownership_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE coownership_unit_charges ENABLE ROW LEVEL SECURITY;

-- Helper policy : membre de l'org qui possède la copropriété
DO $$
BEGIN
  -- budgets
  EXECUTE 'DROP POLICY IF EXISTS "budgets_all_members" ON coownership_budgets';
  EXECUTE $P$
    CREATE POLICY "budgets_all_members" ON coownership_budgets FOR ALL
    USING (EXISTS (SELECT 1 FROM coownerships c WHERE c.id = coownership_budgets.coownership_id AND is_org_member(c.org_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM coownerships c WHERE c.id = coownership_budgets.coownership_id AND is_org_member(c.org_id)))
  $P$;

  -- calls
  EXECUTE 'DROP POLICY IF EXISTS "calls_all_members" ON coownership_calls';
  EXECUTE $P$
    CREATE POLICY "calls_all_members" ON coownership_calls FOR ALL
    USING (EXISTS (SELECT 1 FROM coownerships c WHERE c.id = coownership_calls.coownership_id AND is_org_member(c.org_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM coownerships c WHERE c.id = coownership_calls.coownership_id AND is_org_member(c.org_id)))
  $P$;

  -- charges
  EXECUTE 'DROP POLICY IF EXISTS "charges_all_members" ON coownership_unit_charges';
  EXECUTE $P$
    CREATE POLICY "charges_all_members" ON coownership_unit_charges FOR ALL
    USING (EXISTS (SELECT 1 FROM coownership_calls c JOIN coownerships o ON o.id = c.coownership_id WHERE c.id = coownership_unit_charges.call_id AND is_org_member(o.org_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM coownership_calls c JOIN coownerships o ON o.id = c.coownership_id WHERE c.id = coownership_unit_charges.call_id AND is_org_member(o.org_id)))
  $P$;
END$$;

-- ============================================================
-- 5. Triggers touch + status calcul auto
-- ============================================================

CREATE OR REPLACE FUNCTION coown_finance_touch()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS budgets_touch_trigger ON coownership_budgets;
CREATE TRIGGER budgets_touch_trigger BEFORE UPDATE ON coownership_budgets
  FOR EACH ROW EXECUTE FUNCTION coown_finance_touch();

DROP TRIGGER IF EXISTS calls_touch_trigger ON coownership_calls;
CREATE TRIGGER calls_touch_trigger BEFORE UPDATE ON coownership_calls
  FOR EACH ROW EXECUTE FUNCTION coown_finance_touch();

DROP TRIGGER IF EXISTS charges_touch_trigger ON coownership_unit_charges;
CREATE TRIGGER charges_touch_trigger BEFORE UPDATE ON coownership_unit_charges
  FOR EACH ROW EXECUTE FUNCTION coown_finance_touch();

-- Recalcule automatiquement le status d'un appel selon ses charges
CREATE OR REPLACE FUNCTION recalc_call_status(p_call_id UUID)
RETURNS VOID AS $$
DECLARE
  total_due NUMERIC;
  total_paid NUMERIC;
  call_due_date DATE;
  current_status TEXT;
BEGIN
  SELECT COALESCE(SUM(amount_due), 0), COALESCE(SUM(amount_paid), 0)
    INTO total_due, total_paid
    FROM coownership_unit_charges
    WHERE call_id = p_call_id;

  SELECT due_date, status INTO call_due_date, current_status
    FROM coownership_calls
    WHERE id = p_call_id;

  IF current_status = 'draft' OR current_status = 'cancelled' THEN
    RETURN;
  END IF;

  IF total_paid >= total_due AND total_due > 0 THEN
    UPDATE coownership_calls SET status = 'paid' WHERE id = p_call_id;
  ELSIF total_paid > 0 THEN
    UPDATE coownership_calls SET status = 'partially_paid' WHERE id = p_call_id;
  ELSIF call_due_date < CURRENT_DATE THEN
    UPDATE coownership_calls SET status = 'overdue' WHERE id = p_call_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION charges_after_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM recalc_call_status(COALESCE(NEW.call_id, OLD.call_id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS charges_recalc_status ON coownership_unit_charges;
CREATE TRIGGER charges_recalc_status
  AFTER INSERT OR UPDATE OR DELETE ON coownership_unit_charges
  FOR EACH ROW EXECUTE FUNCTION charges_after_change();
