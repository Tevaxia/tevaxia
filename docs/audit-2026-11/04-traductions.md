# Note 4 — Traductions (20 novembre 2026)

Deux contrôles : les fichiers `src/messages/{fr,en,de,pt,lb}.json` (17 497 clés, 146 000 mots en français), puis le texte réellement affiché sur les 188 pages du sitemap dans chaque langue. Le second prime : une partie des clés n'est plus affichée.

Limite : je lis couramment l'anglais, l'allemand et le portugais ; pour le luxembourgeois, mon jugement porte sur la cohérence et les germanismes évidents, pas sur le style. Une relecture par un locuteur natif reste nécessaire pour cette langue.

## Ce qui est en ordre

- Les cinq fichiers ont exactement les mêmes clés ; aucune chaîne vide ; une seule variable ICU divergente (`aiAnalysis.remaining`, pluriel réécrit, sans effet).
- Tous les titres, descriptions et H1 sont traduits : aucun n'est identique au français sur les 752 pages traduites.
- L'attribut `lang` est correct partout ; `hreflang` complet.
- Aucune phrase française résiduelle détectée dans le texte rendu des quatre langues.
- Les seuils légaux affichés par les outils (délai de spéculation, plafond Bëllegen Akt, taux) sont identiques d'une langue à l'autre.
- Sur les pages lues (accueil, frais d'acquisition, guide plus-value), l'anglais, l'allemand et le portugais sont naturels et précis.

## Défauts

**1. Traductions abrégées.** Le texte affiché représente 92 % du français en portugais, 88 % en anglais, 81 % en luxembourgeois et 77 % en allemand. 32 pages allemandes et 27 luxembourgeoises font moins des trois quarts de la version française.

| Page | EN | DE | PT | LB |
|---|---|---|---|---|
| `/pag-pap` | 54 % | 40 % | 46 % | 38 % |
| `/aml-kyc` | — | 62 % | — | 56 % |
| `/convertisseur-surfaces` | — | 65 % | 74 % | 57 % |
| `/vefa` | 73 % | 63 % | — | 64 % |
| `/propcalc` | 74 % | 62 % | — | 61 % |
| `/solutions/investisseur` | — | 60 % | — | 62 % |
| `/solutions/promoteur` | — | 61 % | — | 63 % |
| `/guide/bail-habitation-luxembourg` | — | 65 % | — | — |

Ce sont surtout les blocs d'explication sous les outils (`*.seo.*`) : un paragraphe français devient une phrase. Les chiffres et références de loi cités en français y disparaissent.

**2. Accents manquants.**

- Portugais : 169 occurrences sur 14 pages, dont les pages légales : `/pt/confidentialite` (53 : « navegacao », « execucao »), `/pt/mentions-legales` (25), `/pt/syndic` (21), `/pt/str/rentabilite` (16), `/pt/convertisseur-surfaces`, `/pt/str`, `/pt/pag-pap`. Dans les fichiers, 354 chaînes sont concernées.
- Allemand : 13 occurrences sur 6 pages (« fuer », « Haeufig », « pruefen ») : `/de/propcalc`, `/de/pag-pap`, `/de/syndic`, `/de/energy`.
- Français lui-même : 12 occurrences sur 4 pages : `/pag-pap` (« General », « activites », « evaluation »), `/energy` (« Questions frequentes sur la transition energetique immobiliere »), `/propcalc`, `/comparer`. 59 chaînes dans `fr.json`, surtout `energy` et `marche`.

**3. Terminologie.**

| Langue | Constat | Proposition |
|---|---|---|
| Allemand | « Syndikus » (32 occurrences) désigne un juriste d'entreprise, pas un syndic de copropriété ; « Hausverwalt… » est aussi employé (22) | « Hausverwalter » ou « Syndic », terme d'usage au Luxembourg |
| Allemand | Trois termes pour les droits d'enregistrement : « Registrierungsgebühr » (11), « Eintragungsgebühr » (19), « Registrierungsabgaben » | Un seul, par exemple « Einregistrierungsgebühren », usuel dans les textes luxembourgeois en allemand |
| Portugais | « síndico » (37) est brésilien ; « administrador » (30) coexiste | « administrador do condomínio », portugais européen |
| Luxembourgeois | « Matbesëtz » (35) pour copropriété, « Gebühren » (41) à côté de « Käschten » (616) et « Fraisen » (107) | « Kopropriétéit » et un seul mot pour les frais ; à valider par un locuteur |
| Anglais, allemand, portugais | « Bellegen Akt » sans tréma dans certaines chaînes | « Bëllegen Akt » partout |
| Français | `/syndic` tutoie (« Crée et pilote tes copropriétés ») ; le reste du site vouvoie | Vouvoiement |

**4. Texte en dur.** L'écran d'attente affiche « Chargement... » en français dans les cinq langues (`src/app/loading.tsx`).

**5. Millésimes non reportés.** « Indicative LU rates (Q1 2025) » en anglais, allemand, portugais et luxembourgeois quand le français dit « T1 2026 » ; « 2025 estimates » en anglais pour « estimations 2026 ».

**6. URL.** Les adresses restent en français dans toutes les langues (`/de/frais-acquisition`, `/en/calculateur-loyer`). Le site se classe malgré cela en allemand et en anglais ; les traduire serait un chantier de redirections, à ne pas ouvrir sans raison.

## Ordre de traitement proposé

1. Corrections mécaniques, vérifiables par script : accents portugais, allemands et français ; « Syndikus » ; « síndico » ; tréma de Bëllegen Akt ; millésimes ; « Chargement… ».
2. Retraduction complète des blocs abrégés sur les pages qui se classent en allemand et en anglais (`/vefa`, `/calculateur-loyer`, `/frais-acquisition`), puis les autres.
3. Relecture native du luxembourgeois sur les dix pages les plus vues.
4. Purge des clés mortes, pour que ce contrôle reste lisible.
