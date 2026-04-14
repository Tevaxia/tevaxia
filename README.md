# Tevaxia — Outils immobiliers Luxembourg

**[tevaxia.lu](https://tevaxia.lu)** — Plateforme open source de valorisation, simulation et analyse immobilière pour le Luxembourg.

## 18+ outils immobiliers

| Outil | Description |
|-------|-------------|
| [Estimation instantanée](https://tevaxia.lu/estimation) | Prix/m² par commune, modèle hédonique Observatoire de l'Habitat |
| [Carte des prix](https://tevaxia.lu/carte) | Carte interactive des prix immobiliers par commune |
| [Frais d'acquisition](https://tevaxia.lu/frais-acquisition) | Droits d'enregistrement, Bëllegen Akt, TVA VEFA, émoluments notaire |
| [Capital investi & Loyer](https://tevaxia.lu/calculateur-loyer) | Plafonnement des loyers (loi 21/09/2006), coefficients Art. 102 LIR |
| [Plus-values](https://tevaxia.lu/plus-values) | Fiscalité des plus-values, spéculation, cession, exonérations |
| [Simulateur d'aides](https://tevaxia.lu/simulateur-aides) | Bëllegen Akt, primes, Klimabonus, Klimaprêt, garantie de l'État |
| [Acheter ou louer](https://tevaxia.lu/achat-vs-location) | Comparaison TCO acquisition vs location sur 10-30 ans |
| [Valorisation EVS 2025](https://tevaxia.lu/valorisation) | Comparaison, capitalisation, DCF, MLV, terme/réversion — conforme TEGOVA |
| [Valorisation hédonique](https://tevaxia.lu/hedonique) | Modèle multi-critères (surface, étage, état, énergie, parking) |
| [DCF multi-locataires](https://tevaxia.lu/dcf-multi) | Analyse bail par bail, IRR, sensibilité |
| [Outils bancaires](https://tevaxia.lu/outils-bancaires) | LTV, capacité d'emprunt, amortissement, DSCR, impact CPE |
| [Bilan promoteur](https://tevaxia.lu/bilan-promoteur) | Faisabilité opération immobilière, compte à rebours |
| [Tableau de bord syndic](https://tevaxia.lu/syndic) | Multi-lots, répartition charges, CPE par lot, planning rénovation |
| [Simulateur VEFA](https://tevaxia.lu/vefa) | Échéancier, TVA 3%/17%, intérêts intercalaires |
| [PAG / PAP](https://tevaxia.lu/pag-pap) | Urbanisme, zones constructibles, servitudes — intégration Geoportail.lu |
| [Indice tevaxia](https://tevaxia.lu/indices) | Prix par commune, tendances, top hausses/baisses |
| [Portfolio](https://tevaxia.lu/portfolio) | Agrégation multi-biens, suivi performance, export PDF |
| [PropCalc](https://tevaxia.lu/propcalc) | Widget WordPress multi-pays, API REST, npm, extension Chrome |

## 8 simulateurs énergie

**[tevaxia.lu/energy](https://tevaxia.lu/energy)** — Performance énergétique et transition de l'immobilier au Luxembourg.

| Simulateur | Description |
|------------|-------------|
| [Impact CPE](https://tevaxia.lu/energy/impact) | Green premium / brown discount par classe (A-I), données par commune |
| [ROI Rénovation](https://tevaxia.lu/energy/renovation) | Coûts, Klimabonus (25-62,5%), payback, VAN, TRI |
| [Communauté d'énergie](https://tevaxia.lu/energy/communaute) | Autoconsommation, bilan par lot, conformité ILR, données PVGIS |
| [EPBD 2050](https://tevaxia.lu/energy/epbd) | Échéances directive européenne, risque de stranding |
| [Estimateur CPE](https://tevaxia.lu/energy/estimateur-cpe) | Estimation classe énergétique en 6 questions |
| [LENOZ](https://tevaxia.lu/energy/lenoz) | Scoring durabilité simplifié (Bronze à Platine) |
| [HVAC](https://tevaxia.lu/energy/hvac) | Dimensionnement EN 12831, catalogue PAC/VMC, bordereau Klimabonus |
| [Portfolio énergie](https://tevaxia.lu/energy/portfolio) | Analyse multi-biens, score CPE pondéré |

## Stack technique

- **Frontend** : Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **API énergie** : Spring Boot 3.4 (Java 17), Swagger UI
- **Base de données** : PostgreSQL (Supabase) — RLS, Auth, Storage
- **Données live** : API ECB (taux BCE), data.public.lu (Observatoire), PVGIS (solaire)
- **i18n** : 5 langues (FR, EN, DE, PT, LB) via next-intl
- **Tests** : 126 tests unitaires (Vitest)
- **PWA** : Installable, service worker, mode offline

## Sources de données

- [Observatoire de l'Habitat](https://logement.public.lu/fr/observatoire-habitat.html) — Prix de vente et annonces par commune
- [STATEC](https://statistiques.public.lu/) — Indices des prix résidentiels, démographie
- [Geoportail.lu](https://www.geoportail.lu/) — Cadastre, PAG, orthophoto (WMS)
- [ECB SDW](https://data.ecb.europa.eu/) — Taux directeurs, Euribor 3M
- [PVGIS](https://re.jrc.ec.europa.eu/) — Production solaire par localisation (Commission européenne)
- [data.public.lu](https://data.public.lu/) — Open data Luxembourg

## Cadre réglementaire

- Loi du 21 septembre 2006 (bail à loyer)
- Art. 102 LIR (coefficients de réévaluation)
- Loi du 22 octobre 2008 (Bëllegen Akt)
- Décret 2020-179 (tarif notarial — NotariaPrime)
- Directive EPBD 2024/1275
- Règlement grand-ducal du 23 juillet 2016 (passeport énergétique)
- Loi du 21 mai 2021 (communautés d'énergie)
- TEGOVA European Valuation Standards 2025

## Licence

MIT

## Contact

- Site : [tevaxia.lu](https://tevaxia.lu)
- Email : contact@tevaxia.lu
- Réutilisation data.public.lu : [voir la fiche](https://data.public.lu/fr/reuses/tevaxia-outils-immobiliers-luxembourg-estimation-prix-valorisation-energie/)
