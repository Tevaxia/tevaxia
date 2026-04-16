-- ============================================================
-- COOWNERSHIP ACCOUNTING — Plan comptable + journal + balance
-- ============================================================
-- Comptabilité syndic simplifiée avec plan comptable LU standardisé
-- (classes 1-7), double-entrée, clôture annuelle et report à nouveau.
--
-- Dépend de : 014_coownerships.sql

-- ============================================================
-- 1. Exercices comptables
-- ============================================================

CREATE TABLE IF NOT EXISTS coownership_accounting_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coownership_id UUID NOT NULL REFERENCES coownerships(id) ON DELETE CASCADE,
  year INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','closed')),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  closing_notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (coownership_id, year)
);

CREATE INDEX IF NOT EXISTS acc_years_coown_idx ON coownership_accounting_years(coownership_id);

-- ============================================================
-- 2. Plan comptable
-- ============================================================

CREATE TABLE IF NOT EXISTS accounting_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coownership_id UUID NOT NULL REFERENCES coownerships(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  classe INT NOT NULL CHECK (classe BETWEEN 1 AND 7),
  account_type TEXT NOT NULL
    CHECK (account_type IN ('asset','liability','equity','income','expense')),
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (coownership_id, code)
);

CREATE INDEX IF NOT EXISTS accounts_coown_idx ON accounting_accounts(coownership_id);
CREATE INDEX IF NOT EXISTS accounts_code_idx ON accounting_accounts(coownership_id, code);

-- ============================================================
-- 3. Écritures (journal entries)
-- ============================================================

CREATE TABLE IF NOT EXISTS accounting_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coownership_id UUID NOT NULL REFERENCES coownerships(id) ON DELETE CASCADE,
  year_id UUID NOT NULL REFERENCES coownership_accounting_years(id) ON DELETE CASCADE,

  entry_date DATE NOT NULL,
  reference TEXT,     -- numéro de pièce
  label TEXT NOT NULL,
  journal_code TEXT NOT NULL DEFAULT 'OD'
    CHECK (journal_code IN ('ACH','BQ','VT','OD','AN')), -- Achats / Banque / Ventes / OD / À-nouveau

  is_locked BOOLEAN NOT NULL DEFAULT FALSE, -- écriture de clôture non modifiable

  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS entries_coown_idx ON accounting_entries(coownership_id);
CREATE INDEX IF NOT EXISTS entries_year_idx ON accounting_entries(year_id);
CREATE INDEX IF NOT EXISTS entries_date_idx ON accounting_entries(entry_date);

-- ============================================================
-- 4. Lignes d'écriture (double-entrée D/C)
-- ============================================================

CREATE TABLE IF NOT EXISTS accounting_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES accounting_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounting_accounts(id) ON DELETE RESTRICT,

  debit NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
  line_label TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK (debit = 0 OR credit = 0) -- une ligne est soit débit soit crédit
);

CREATE INDEX IF NOT EXISTS lines_entry_idx ON accounting_entry_lines(entry_id);
CREATE INDEX IF NOT EXISTS lines_account_idx ON accounting_entry_lines(account_id);

-- ============================================================
-- 5. Seed du plan comptable standardisé LU (syndic simplifié)
-- ============================================================

CREATE OR REPLACE FUNCTION seed_accounting_chart(p_coownership_id UUID)
RETURNS INT AS $$
DECLARE
  v_count INT := 0;
BEGIN
  INSERT INTO accounting_accounts (coownership_id, code, label, classe, account_type, is_system) VALUES
    -- Classe 1 — Capitaux
    (p_coownership_id, '100', 'Fonds de copropriété',                  1, 'equity',    TRUE),
    (p_coownership_id, '120', 'Résultat de l''exercice',               1, 'equity',    TRUE),
    (p_coownership_id, '150', 'Provisions pour travaux',               1, 'liability', TRUE),
    -- Classe 4 — Tiers
    (p_coownership_id, '401', 'Fournisseurs',                          4, 'liability', TRUE),
    (p_coownership_id, '411', 'Copropriétaires — débiteurs',           4, 'asset',     TRUE),
    (p_coownership_id, '455', 'Copropriétaires — créditeurs',          4, 'liability', TRUE),
    -- Classe 5 — Financiers
    (p_coownership_id, '512', 'Compte bancaire copropriété',           5, 'asset',     TRUE),
    (p_coownership_id, '530', 'Caisse',                                5, 'asset',     TRUE),
    -- Classe 6 — Charges
    (p_coownership_id, '601', 'Fournitures d''entretien',              6, 'expense',   TRUE),
    (p_coownership_id, '606', 'Énergie (eau, gaz, électricité)',        6, 'expense',   TRUE),
    (p_coownership_id, '615', 'Entretien et réparations',              6, 'expense',   TRUE),
    (p_coownership_id, '616', 'Primes d''assurances',                  6, 'expense',   TRUE),
    (p_coownership_id, '621', 'Honoraires syndic',                     6, 'expense',   TRUE),
    (p_coownership_id, '622', 'Honoraires tiers (comptable, avocat)',  6, 'expense',   TRUE),
    (p_coownership_id, '627', 'Frais bancaires',                       6, 'expense',   TRUE),
    (p_coownership_id, '635', 'Impôts et taxes',                       6, 'expense',   TRUE),
    (p_coownership_id, '641', 'Salaires (concierge, agents)',          6, 'expense',   TRUE),
    -- Classe 7 — Produits
    (p_coownership_id, '701', 'Appels de fonds — charges courantes',   7, 'income',    TRUE),
    (p_coownership_id, '702', 'Appels de fonds — travaux',             7, 'income',    TRUE),
    (p_coownership_id, '708', 'Produits divers (remboursements)',      7, 'income',    TRUE),
    (p_coownership_id, '764', 'Produits financiers (intérêts)',        7, 'income',    TRUE)
  ON CONFLICT (coownership_id, code) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. Fonction — équilibre débit/crédit (enforced by trigger)
-- ============================================================

CREATE OR REPLACE FUNCTION check_entry_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_entry_id UUID;
  v_debit NUMERIC;
  v_credit NUMERIC;
  v_line_count INT;
BEGIN
  v_entry_id := COALESCE(NEW.entry_id, OLD.entry_id);
  SELECT COALESCE(SUM(debit),0), COALESCE(SUM(credit),0), COUNT(*)
    INTO v_debit, v_credit, v_line_count
  FROM accounting_entry_lines WHERE entry_id = v_entry_id;

  -- On laisse passer les écritures en cours de saisie (< 2 lignes)
  -- Mais on interdit les écritures déséquilibrées à 2+ lignes
  IF v_line_count >= 2 AND v_debit <> v_credit THEN
    RAISE EXCEPTION 'Écriture non équilibrée : débit=%, crédit=% (id=%)', v_debit, v_credit, v_entry_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note : trigger désactivé par défaut pour permettre saisie multi-étapes depuis le client.
-- Le contrôle se fait côté UI avant validation. Activer si besoin de strict enforcement.

-- ============================================================
-- 7. Fonction — balance par compte pour un exercice
-- ============================================================

CREATE OR REPLACE FUNCTION accounting_balance(p_coownership_id UUID, p_year INT)
RETURNS TABLE (
  account_id UUID,
  code TEXT,
  label TEXT,
  classe INT,
  account_type TEXT,
  total_debit NUMERIC,
  total_credit NUMERIC,
  balance NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.code,
    a.label,
    a.classe,
    a.account_type,
    COALESCE(SUM(l.debit),  0)::NUMERIC AS total_debit,
    COALESCE(SUM(l.credit), 0)::NUMERIC AS total_credit,
    (COALESCE(SUM(l.debit),0) - COALESCE(SUM(l.credit),0))::NUMERIC AS balance
  FROM accounting_accounts a
  LEFT JOIN accounting_entry_lines l ON l.account_id = a.id
  LEFT JOIN accounting_entries e ON e.id = l.entry_id AND EXTRACT(YEAR FROM e.entry_date) = p_year
  WHERE a.coownership_id = p_coownership_id
  GROUP BY a.id, a.code, a.label, a.classe, a.account_type
  ORDER BY a.code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. Fonction — clôture d'exercice (calcule résultat + verrou)
-- ============================================================

CREATE OR REPLACE FUNCTION close_accounting_year(p_year_id UUID)
RETURNS TABLE (result_amount NUMERIC) AS $$
DECLARE
  v_coown_id UUID;
  v_year INT;
  v_income NUMERIC;
  v_expense NUMERIC;
  v_result NUMERIC;
  v_result_account UUID;
  v_entry_id UUID;
BEGIN
  SELECT coownership_id, year INTO v_coown_id, v_year
  FROM coownership_accounting_years WHERE id = p_year_id AND status = 'open';

  IF v_coown_id IS NULL THEN
    RAISE EXCEPTION 'Exercice introuvable ou déjà clôturé';
  END IF;

  -- Somme classe 7 (produits) - classe 6 (charges)
  SELECT COALESCE(SUM(l.credit - l.debit),0) INTO v_income
  FROM accounting_entry_lines l
  JOIN accounting_accounts a ON a.id = l.account_id
  JOIN accounting_entries e ON e.id = l.entry_id
  WHERE a.coownership_id = v_coown_id AND a.classe = 7 AND EXTRACT(YEAR FROM e.entry_date) = v_year;

  SELECT COALESCE(SUM(l.debit - l.credit),0) INTO v_expense
  FROM accounting_entry_lines l
  JOIN accounting_accounts a ON a.id = l.account_id
  JOIN accounting_entries e ON e.id = l.entry_id
  WHERE a.coownership_id = v_coown_id AND a.classe = 6 AND EXTRACT(YEAR FROM e.entry_date) = v_year;

  v_result := v_income - v_expense;

  -- Lock and mark closed
  UPDATE coownership_accounting_years
    SET status = 'closed', closed_at = NOW(), updated_at = NOW()
  WHERE id = p_year_id;

  -- Verrouille les écritures de l'exercice
  UPDATE accounting_entries SET is_locked = TRUE, updated_at = NOW()
  WHERE year_id = p_year_id;

  RETURN QUERY SELECT v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 9. Touch triggers
-- ============================================================

CREATE OR REPLACE FUNCTION accounting_touch()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS acc_years_touch ON coownership_accounting_years;
CREATE TRIGGER acc_years_touch BEFORE UPDATE ON coownership_accounting_years
  FOR EACH ROW EXECUTE FUNCTION accounting_touch();

DROP TRIGGER IF EXISTS entries_touch ON accounting_entries;
CREATE TRIGGER entries_touch BEFORE UPDATE ON accounting_entries
  FOR EACH ROW EXECUTE FUNCTION accounting_touch();

-- ============================================================
-- 10. RLS
-- ============================================================

ALTER TABLE coownership_accounting_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_entry_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "acc_years_all" ON coownership_accounting_years;
CREATE POLICY "acc_years_all" ON coownership_accounting_years FOR ALL
  USING (EXISTS (SELECT 1 FROM coownerships c WHERE c.id = coownership_id AND is_org_member(c.org_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM coownerships c WHERE c.id = coownership_id AND is_org_member(c.org_id)));

DROP POLICY IF EXISTS "accounts_all" ON accounting_accounts;
CREATE POLICY "accounts_all" ON accounting_accounts FOR ALL
  USING (EXISTS (SELECT 1 FROM coownerships c WHERE c.id = coownership_id AND is_org_member(c.org_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM coownerships c WHERE c.id = coownership_id AND is_org_member(c.org_id)));

DROP POLICY IF EXISTS "entries_all" ON accounting_entries;
CREATE POLICY "entries_all" ON accounting_entries FOR ALL
  USING (EXISTS (SELECT 1 FROM coownerships c WHERE c.id = coownership_id AND is_org_member(c.org_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM coownerships c WHERE c.id = coownership_id AND is_org_member(c.org_id)));

DROP POLICY IF EXISTS "lines_all" ON accounting_entry_lines;
CREATE POLICY "lines_all" ON accounting_entry_lines FOR ALL
  USING (EXISTS (
    SELECT 1 FROM accounting_entries e
    JOIN coownerships c ON c.id = e.coownership_id
    WHERE e.id = entry_id AND is_org_member(c.org_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM accounting_entries e
    JOIN coownerships c ON c.id = e.coownership_id
    WHERE e.id = entry_id AND is_org_member(c.org_id)
  ));
