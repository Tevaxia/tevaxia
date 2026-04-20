# Tevaxia

**Luxembourg real estate platform** — valuation, e-invoicing, PMS, syndic, ESG.
[**tevaxia.lu**](https://tevaxia.lu) · 5 languages · 40+ tools · built on open standards.

---

## What we build

Tevaxia is a SaaS for the Luxembourg real estate market, built around European technical standards rather than proprietary data formats. Every module maps to a specific regulatory framework (EN 16931, TEGOVA EVS 2025, CRREM, PSD2, EPBD) so that outputs are interoperable with the rest of the EU financial and real estate ecosystem.

The platform serves independent real estate experts, property managers (syndic), hoteliers, agencies, investors, and bank analysts — with 40+ tools accessible without an account, and professional modules for logged-in users.

## Modules

| Module | What it does |
|--------|--------------|
| [Valuation (EVS 2025)](https://tevaxia.lu/valorisation) | 8 methods, 9 asset types, 11-section TEGOVA-compliant PDF report |
| [E-invoicing (Factur-X)](https://tevaxia.lu/facturation) | EN 16931 CII XML embedded in PDF/A-3, hooks for syndic and PMS |
| [Syndic / Co-ownership](https://tevaxia.lu/syndic) | Units, AGMs with weighted voting, fund calls, LU accounting, PSD2 reconciliation |
| [Hotel PMS](https://tevaxia.lu/pms) | Rooms, reservations, folios with auto-posting, USALI reporting, iCal OTA channels |
| [Agency CRM](https://tevaxia.lu/pro-agences) | Mandates pipeline, contact matching, Kanban, visit slips, commissions |
| [STR / Airbnb](https://tevaxia.lu/str) | Profitability, pricing, forecast, LU 90-night compliance, EU Regulation 2024/1028 |
| [ESG](https://tevaxia.lu/esg) | CRREM stranding year (SFDR), EU Taxonomy 7.7 screening (CRR) |
| [Energy](https://tevaxia.lu/energy) | EPC impact, renovation ROI, energy community, LENOZ, HVAC simulator |

## Standards implemented

- **EN 16931-1:2017** — invoice semantic model + Factur-X CII D22B syntax
- **TEGOVA EVS 2025** (10th ed.) + Charte de l'expertise 5th ed. — valuation reports
- **CRREM Pathways v2.03** — building-level stranding year calculation
- **EU Taxonomy Article 7.7** — screening criteria for buildings (SFDR)
- **PSD2 AIS** — bank account aggregation via Enable Banking (BCEE, BIL, Raiffeisen, Post Finance)
- **EPBD 2024** — energy performance timelines and ZEB trajectory
- **USALI 11th ed.** — uniform hotel accounting (19 categories, revenue + expense)
- **Peppol BIS 3.0** — cross-border invoice transport

## Stack

Next.js 16 · TypeScript strict · Tailwind CSS · Supabase (Postgres + RLS + auth) · pdf-lib · fflate · @react-pdf/renderer · Vercel · next-intl (5 languages)

## Public API

REST + OpenAPI 3.1 — estimation, valuation, batch (1000 properties), PMS webhooks, Factur-X generation.
Docs: [tevaxia.lu/api-docs](https://tevaxia.lu/api-docs) · sandbox with free tier.

## Writing

Technical deep-dives on Factur-X, CRREM, USALI, PSD2 and Luxembourg real estate engineering.
Blog: [tevaxia.lu/guide](https://tevaxia.lu/guide) · Dev.to: coming soon.

## Data sources

Observatoire de l'Habitat (data.public.lu), STATEC, Geoportail.lu, European Central Bank Statistical Data Warehouse, PVGIS (European Commission), ILNAS. All integrations are documented and attributed.

## Founder

Erwan Bargain — REV TEGOVA (Recognised European Valuer) · [LinkedIn](https://www.linkedin.com/in/erwanbargain) · [bargain-expertise.fr](https://bargain-expertise.fr)

## Contact

General: **contact@tevaxia.lu**
Issues or technical questions: use the Issues tab on [Tevaxia/tevaxia](https://github.com/Tevaxia/tevaxia).
