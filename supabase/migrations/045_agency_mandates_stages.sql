-- ============================================================
-- AGENCY MANDATES — stages pipeline étendus
-- ============================================================
-- Postgres ALTER TYPE ADD VALUE doit être dans une migration dédiée,
-- car il ne peut coexister avec les CREATE TABLE qui référencent
-- ces nouvelles valeurs dans la même transaction.
--
-- Pipeline étendu :
--   prospect → mandat_signe → diffuse → en_visite → offre_recue
--            → sous_compromis → vendu
--            ↘ abandonne / expire (à n'importe quel stade)

alter type mandate_status add value if not exists 'diffuse' before 'sous_compromis';
alter type mandate_status add value if not exists 'en_visite' before 'sous_compromis';
alter type mandate_status add value if not exists 'offre_recue' before 'sous_compromis';
