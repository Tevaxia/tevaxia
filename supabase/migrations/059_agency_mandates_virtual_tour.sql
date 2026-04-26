-- ============================================================
-- AGENCY MANDATES — Champs media: tour virtuel + vidéo
-- ============================================================
-- Standard 2025+ pour les annonces premium. Compatible avec
-- Matterport, Klapty, EyeSpy360, Kuula, YouTube/Vimeo, etc.
-- L'URL est intégrée :
--   - en iframe sur la fiche bien interne (page mandat)
--   - en lien dans le PDF co-brandé
--   - dans le champ <virtuelle_tour> de l'export OpenImmo 1.2.8
-- ============================================================

alter table agency_mandates
  add column if not exists virtual_tour_url text,
  add column if not exists video_url text,
  add column if not exists virtual_tour_provider text;
  -- 'matterport' | 'klapty' | 'eyespy360' | 'kuula' | 'youtube' | 'vimeo' | 'autre'

-- Validation soft : URL doit être HTTPS
alter table agency_mandates
  drop constraint if exists agency_mandates_virtual_tour_https;
alter table agency_mandates
  add constraint agency_mandates_virtual_tour_https
  check (
    virtual_tour_url is null
    or virtual_tour_url like 'https://%'
  );

alter table agency_mandates
  drop constraint if exists agency_mandates_video_https;
alter table agency_mandates
  add constraint agency_mandates_video_https
  check (
    video_url is null
    or video_url like 'https://%'
  );

create index if not exists agency_mandates_with_tour_idx
  on agency_mandates(user_id)
  where virtual_tour_url is not null;
