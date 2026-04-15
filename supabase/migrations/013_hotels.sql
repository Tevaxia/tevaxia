-- ============================================================
-- HOTELS — Persistance d'un hôtel rattaché à une organisation
-- ============================================================
-- Permet à un groupe hôtelier de modéliser ses établissements et
-- de lier les simulations (valorisation, DSCR, exploitation,
-- rénovation, RevPAR, E-2) à un hôtel précis pour historique
-- multi-trimestres.
--
-- Dépend de : 003_create_organizations.sql, 010_org_verticals.sql

CREATE TABLE IF NOT EXISTS hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Identité
  name TEXT NOT NULL,
  slug TEXT,
  address TEXT,
  commune TEXT,
  country TEXT NOT NULL DEFAULT 'LU',
  website TEXT,
  star_rating INT CHECK (star_rating BETWEEN 1 AND 5),
  category TEXT NOT NULL DEFAULT 'midscale'
    CHECK (category IN ('budget','midscale','upscale','luxury')),

  -- Physique
  nb_chambres INT NOT NULL DEFAULT 0,
  nb_salles_mice INT NOT NULL DEFAULT 0,
  has_fb BOOLEAN NOT NULL DEFAULT FALSE,
  has_spa BOOLEAN NOT NULL DEFAULT FALSE,
  has_parking BOOLEAN NOT NULL DEFAULT TRUE,
  year_built INT,
  surface_m2 NUMERIC,

  -- Exploitation
  operator_type TEXT NOT NULL DEFAULT 'independent'
    CHECK (operator_type IN ('independent','franchise','management','owner_operated')),
  franchise_brand TEXT,

  -- Énergétique
  classe_energie TEXT DEFAULT 'NC',

  -- Acquisition / valorisation de référence
  prix_acquisition NUMERIC,
  annee_acquisition INT,

  -- Meta
  vertical_config JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (org_id, slug)
);

CREATE INDEX IF NOT EXISTS hotels_org_idx ON hotels(org_id);
CREATE INDEX IF NOT EXISTS hotels_category_idx ON hotels(category);

-- ============================================================
-- HOTEL_PERIODS — Historique trimestre par trimestre
-- ============================================================
-- Stocke les KPIs de performance d'un hôtel sur une période donnée.
-- Permet de comparer N trimestres, générer des tendances RevPAR/GOP,
-- alimenter un owner report mensuel/trimestriel.

CREATE TABLE IF NOT EXISTS hotel_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,

  -- Période
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_label TEXT, -- ex. "Q1 2026", "Avril 2026"
  CHECK (period_end >= period_start),

  -- KPI commerciaux
  occupancy NUMERIC,        -- 0-1
  adr NUMERIC,              -- €/nuit
  revpar NUMERIC,           -- calculé ou saisi

  -- Revenus par département (USALI)
  revenue_rooms NUMERIC,
  revenue_fb NUMERIC,
  revenue_mice NUMERIC,
  revenue_other NUMERIC,
  revenue_total NUMERIC,

  -- Charges
  staff_cost NUMERIC,
  energy_cost NUMERIC,
  other_opex NUMERIC,
  ffe_reserve NUMERIC,

  -- Profitabilité
  gop NUMERIC,
  gop_margin NUMERIC,
  ebitda NUMERIC,
  ebitda_margin NUMERIC,

  -- Compset benchmark (optionnel)
  compset_revpar NUMERIC,
  mpi NUMERIC,
  ari NUMERIC,
  rgi NUMERIC,

  notes TEXT,

  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (hotel_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS hotel_periods_hotel_idx ON hotel_periods(hotel_id);
CREATE INDEX IF NOT EXISTS hotel_periods_dates_idx ON hotel_periods(period_start DESC);

-- ============================================================
-- RLS — accès par appartenance à l'organisation
-- ============================================================

ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hotels_select_members" ON hotels;
DROP POLICY IF EXISTS "hotels_insert_members" ON hotels;
DROP POLICY IF EXISTS "hotels_update_members" ON hotels;
DROP POLICY IF EXISTS "hotels_delete_admins" ON hotels;

CREATE POLICY "hotels_select_members" ON hotels FOR SELECT
  USING (is_org_member(org_id));
CREATE POLICY "hotels_insert_members" ON hotels FOR INSERT
  WITH CHECK (is_org_member(org_id));
CREATE POLICY "hotels_update_members" ON hotels FOR UPDATE
  USING (is_org_member(org_id)) WITH CHECK (is_org_member(org_id));
CREATE POLICY "hotels_delete_admins" ON hotels FOR DELETE
  USING (is_org_admin(org_id));

ALTER TABLE hotel_periods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "periods_select_hotel_members" ON hotel_periods;
DROP POLICY IF EXISTS "periods_insert_hotel_members" ON hotel_periods;
DROP POLICY IF EXISTS "periods_update_hotel_members" ON hotel_periods;
DROP POLICY IF EXISTS "periods_delete_hotel_members" ON hotel_periods;

CREATE POLICY "periods_select_hotel_members" ON hotel_periods FOR SELECT
  USING (EXISTS (SELECT 1 FROM hotels h WHERE h.id = hotel_periods.hotel_id AND is_org_member(h.org_id)));
CREATE POLICY "periods_insert_hotel_members" ON hotel_periods FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM hotels h WHERE h.id = hotel_periods.hotel_id AND is_org_member(h.org_id)));
CREATE POLICY "periods_update_hotel_members" ON hotel_periods FOR UPDATE
  USING (EXISTS (SELECT 1 FROM hotels h WHERE h.id = hotel_periods.hotel_id AND is_org_member(h.org_id)));
CREATE POLICY "periods_delete_hotel_members" ON hotel_periods FOR DELETE
  USING (EXISTS (SELECT 1 FROM hotels h WHERE h.id = hotel_periods.hotel_id AND is_org_member(h.org_id)));

-- Triggers touch updated_at
CREATE OR REPLACE FUNCTION hotels_touch()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hotels_touch_trigger ON hotels;
CREATE TRIGGER hotels_touch_trigger BEFORE UPDATE ON hotels
  FOR EACH ROW EXECUTE FUNCTION hotels_touch();

DROP TRIGGER IF EXISTS hotel_periods_touch_trigger ON hotel_periods;
CREATE TRIGGER hotel_periods_touch_trigger BEFORE UPDATE ON hotel_periods
  FOR EACH ROW EXECUTE FUNCTION hotels_touch();
