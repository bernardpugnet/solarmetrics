# Plan d'exécution — Pages OPEX + PR/Loss Stack

## Commit 7 — `/fr/data-opex-europe.html`

### Fichiers touchés
- `fr/data-opex-europe.html` (NEW)
- `fr/data-benchmarks.html` (carte OPEX : "À venir" → "Disponible" + lien)
- `sitemap.xml` (ajout URL si maintenu)

### Structure HTML (copie du pattern CAPEX)
- `<html lang="fr">`, `<meta name="robots" content="index, follow">`
- `<link rel="canonical" href="https://solarmetrics.netlify.app/fr/data-opex-europe">`
- Pas de hreflang (pas de page EN correspondante)
- Nav identique aux autres pages Data FR (avec toggle EN, search, Data dropdown)
- Breadcrumb : `Data / Benchmarks Europe / OPEX`
- Hero : badge "🔧 Data · Benchmarks", H1 "OPEX solaire — Europe", sous-titre descriptif
- Footer identique (lien English, LinkedIn, mentions légales)
- `search.js` + `nav-active.js` chargés

### Table A — "Observed data — O&M utility-scale (UE)"
Tag : `Observed data`
Colonnes : Segment | Périmètre | Fourchette basse | Fourchette haute | Unité | Année | Source

Données (JRC/CETO 2024, p. 26) :

| Segment | Périmètre | Low | High | Unité | Année | Source |
|---------|-----------|-----|------|-------|-------|--------|
| Utility-scale (fixe) | UE | 6,8 | — | EUR/kWp/an | 2022 | JRC CETO 2024, p. 26 |
| Utility-scale (2 axes) | UE | — | 14,8 | EUR/kWp/an | 2022 | JRC CETO 2024, p. 26 |
| Utility-scale (fixe) | Bulgarie | 5,2 | — | EUR/kWp/an | 2022 | JRC CETO 2024, p. 26 |
| Utility-scale (2 axes) | Bulgarie | — | 11,2 | EUR/kWp/an | 2022 | JRC CETO 2024, p. 26 |
| Utility-scale (fixe) | Allemagne | 8,7 | — | EUR/kWp/an | 2022 | JRC CETO 2024, p. 26 |
| Utility-scale (2 axes) | Allemagne | — | 18,9 | EUR/kWp/an | 2022 | JRC CETO 2024, p. 26 |

Note sous tableau : "O&M costs as % of initial investment I₀ : fixe = 1%, 2 axes = 1,5% (JRC/CETO p. 26)"

### Table B — "Context — repères globaux / régionaux"
Tag : `Observed data`
Colonnes : Périmètre | Valeur | Unité | Année | Source

| Périmètre | Valeur | Unité | Année | Source |
|-----------|--------|-------|-------|--------|
| Europe (moyenne) | 7,9 | USD/kW/an | 2023 | IRENA via JRC CETO 2024, p. 26 |
| Chine (low) | 3,6 | USD/kW/an | 2023 | IRENA via JRC CETO 2024, p. 26 |
| Japon (high) | 13,9 | USD/kW/an | 2023 | IRENA via JRC CETO 2024, p. 26 |

### Table C — "SolarMetrics assumptions — modèle OPEX par segment + ventilation"
Tag : `SolarMetrics assumption`
Snapshot : mars 2026

Ventilation type utility-scale (EUR/kWp/an) :

| Poste | Utility-scale | C&I | Résidentiel | Notes |
|-------|---------------|-----|-------------|-------|
| Maintenance préventive | 3,0–4,0 | 4,0–6,0 | 5,0–8,0 | Inspections, nettoyage, thermographie |
| Maintenance corrective | 1,0–2,0 | 1,5–3,0 | 2,0–4,0 | Réparations non planifiées |
| Assurance | 1,0–1,5 | 1,0–2,0 | 1,0–2,0 | Tous risques chantier + RC |
| Monitoring / SCADA | 0,5–1,0 | 0,5–1,0 | 0,3–0,5 | Supervision en temps réel |
| Loyer terrain | 0,5–2,0 | — | — | Utility-scale uniquement |
| Remplacement onduleur (provision) | 0,5–1,5 | 0,5–1,5 | 0,5–1,0 | Provision annualisée sur 10–15 ans |
| Frais de gestion / admin | 0,5–1,0 | 0,5–1,0 | 0,2–0,5 | Reporting, comptabilité, fiscalité |
| **TOTAL** | **7–13** | **8–15** | **9–16** | EUR/kWp/an |

### Encadré "Définitions & périmètre"
- OPEX = dépenses d'exploitation annuelles récurrentes, hors remboursement dette
- O&M = Operations & Maintenance (sous-ensemble de l'OPEX)
- Périmètre OPEX inclut : O&M + assurance + terrain + monitoring + provisions
- Périmètre OPEX exclut : dette, impôts, dépréciation comptable
- kWp = puissance crête DC (conditions STC)
- Acronymes en `<abbr>` à la 1ère occurrence : OPEX, O&M, SCADA, JRC, CETO, IRENA, kWp, UE, C&I

### Tests manuels
- `/fr/data-opex-europe` retourne 200
- Le breadcrumb affiche "Data / Benchmarks Europe / OPEX"
- Les 3 tables s'affichent avec les bons tags (Observed / Observed / Assumption)
- Chaque chiffre a un lien source cliquable
- Le hub `/fr/data-benchmarks` montre OPEX comme "Disponible" avec lien

---

## Commit 8 — `/fr/data-pr-loss-stack.html`

### Fichiers touchés
- `fr/data-pr-loss-stack.html` (NEW)
- `fr/data-benchmarks.html` (carte PR : "À venir" → "Disponible" + lien)
- `sitemap.xml` (ajout URL si maintenu)

### Structure HTML (même pattern que OPEX/CAPEX)
- `<html lang="fr">`, `<meta name="robots" content="index, follow">`
- `<link rel="canonical" href="https://solarmetrics.netlify.app/fr/data-pr-loss-stack">`
- Pas de hreflang
- Nav, breadcrumb (`Data / Benchmarks Europe / PR & Loss Stack`), footer identiques
- Hero : badge "⚙️ Data · Benchmarks", H1 "Performance Ratio & Loss Stack", sous-titre

### Table A — "Fleet observed — indicateurs de performance (NREL)"
Tag : `Observed data`
Note visible : "Données US uniquement (pas de dataset européen open équivalent)"

Colonnes : Indicateur | Valeur | Unité | Périmètre | Source

| Indicateur | Valeur | Unité | Périmètre | Source |
|------------|--------|-------|-----------|--------|
| Taille du fleet analysé | ~8,5 | GW | US | NREL 88769, p. 5 |
| Canaux onduleur analysés | 24 000 | — | US | NREL 88769, p. 5 |
| Disponibilité (availability) P50 | 0,99 | ratio | US (hors 6 premiers mois) | NREL 88769, p. 5-6 |
| Disponibilité (availability) P90 | 0,95 | ratio | US (hors 6 premiers mois) | NREL 88769, p. 5-6 |
| Performance Index (PI) médian | 0,95 | ratio | US (sur durée de vie) | NREL 88769, p. 5-6 |
| Taux de dégradation médian | −0,75 | %/an | US | NREL 88769, p. 5-6 |
| Taux de dégradation (hors soiling) | −0,5 | %/an | US | NREL 88769, p. 5-6 |

### Table B — "Model defaults — pertes par défaut (PVWatts)"
Tag : `Model default`
Note visible : "Valeurs par défaut du modèle PVWatts (NREL). Ce sont des hypothèses de calcul, pas des mesures terrain."

Colonnes : Facteur de perte | Valeur par défaut | Unité | Source

| Facteur de perte | Valeur | Unité | Source |
|------------------|--------|-------|--------|
| Soiling (salissure) | 2 | % | PVWatts Manual 62641, Table 6, p. 12 |
| Shading (ombrage) | 3 | % | PVWatts Manual 62641, Table 6, p. 12 |
| Snow (neige) | 0 | % | PVWatts Manual 62641, Table 6, p. 12 |
| Mismatch (désappariement) | 2 | % | PVWatts Manual 62641, Table 6, p. 12 |
| Wiring (câblage DC) | 2 | % | PVWatts Manual 62641, Table 6, p. 12 |
| Connections (connecteurs) | 0,5 | % | PVWatts Manual 62641, Table 6, p. 12 |
| LID (Light-Induced Degradation) | 1,5 | % | PVWatts Manual 62641, Table 6, p. 12 |
| Nameplate rating | 1 | % | PVWatts Manual 62641, Table 6, p. 12 |
| Age (vieillissement) | 0 | % | PVWatts Manual 62641, Table 6, p. 12 |
| Availability (disponibilité) | 3 | % | PVWatts Manual 62641, Table 6, p. 12 |
| **Total system losses** | **14** | **%** | PVWatts Manual 62641, Table 6, p. 12 |

### Table C — "SolarMetrics assumptions — loss stack typique (utility-scale)"
Tag : `SolarMetrics assumption`
Snapshot : mars 2026

Stack de pertes GHI → énergie nette injectée (utility-scale, UE, structure fixe) :

| Étape | Perte typique | Plage | Tag |
|-------|---------------|-------|-----|
| Transposition GHI → POA | −2 à −5 % | Selon inclinaison/orientation | Assumption |
| Ombrage (horizon + inter-rangées) | −1 à −3 % | Selon design | Assumption |
| Soiling (salissure) | −2 à −5 % | Sec: −5%, humide: −2% | Assumption |
| Réflexion (IAM) | −2 à −4 % | Selon angle d'incidence | Assumption |
| Température | −3 à −10 % | Méditerranée: −8-10%, Nord: −3-5% | Assumption |
| LID (1ère année) | −1,5 % | Mono-PERC; HJT/TOPCon ≈ −0,5% | Assumption |
| Mismatch modules | −1 à −2 % | Dépend du tri et du stringing | Assumption |
| Câblage DC | −1 à −2 % | Longueur des strings | Assumption |
| Onduleur (rendement) | −2 à −4 % | Euroefficiency 96-98% | Assumption |
| Câblage AC + transfo | −1 à −2 % | HT/BT | Assumption |
| Disponibilité (downtime) | −1 à −5 % | P50=1%, P90=5% | Observed (NREL) |
| Curtailment | 0 à −5 % | Selon pays/contrat | Assumption |
| Dégradation annuelle | −0,5 à −0,88 %/an | Tempéré→chaud | Observed (NREL) |
| **PR typique résultant** | **75–85 %** | | |

### Encadré "Définitions"
- PR (Performance Ratio) = énergie produite réelle / énergie théorique (STC). Ratio sans unité, typiquement 0,75–0,85
- Availability = temps de fonctionnement / temps total (hors maintenance programmée selon convention)
- PLR (Performance Loss Rate) = taux de dégradation annuel mesuré sur le fleet (≠ garantie fabricant)
- Rd = taux de dégradation (notation IEC 61724-3)
- Observed = mesuré sur un fleet réel (source + page)
- Model default = valeur par défaut d'un modèle de simulation (pas une mesure)
- SolarMetrics assumption = estimation SolarMetrics basée sur la littérature
- Acronymes en `<abbr>` : PR, PLR, Rd, LID, GHI, POA, IAM, STC, DC, AC, SCADA, kWp, NREL, PVWatts

### Tests manuels
- `/fr/data-pr-loss-stack` retourne 200
- Breadcrumb : "Data / Benchmarks Europe / PR & Loss Stack"
- 3 tables avec tags corrects (Observed / Default / Assumption)
- Chaque chiffre NREL/PVWatts a un lien source
- Le hub `/fr/data-benchmarks` montre PR comme "Disponible" avec lien

---

## Commit 9 — Mise à jour hub + sitemap

### Fichiers touchés
- `fr/data-benchmarks.html` (2 cartes OPEX + PR passent de "À venir" à "Disponible")
- `sitemap.xml` (2 nouvelles URLs ajoutées)

### Détail cartes hub
- Carte OPEX : `<div>` → `<a href="/fr/data-opex-europe.html">`, tag "Disponible" (vert), suppression "Prévu : prochainement"
- Carte PR : `<div>` → `<a href="/fr/data-pr-loss-stack.html">`, tag "Disponible" (vert), suppression "Prévu : prochainement"

### Sitemap
```xml
<url><loc>https://solarmetrics.netlify.app/fr/data-opex-europe</loc></url>
<url><loc>https://solarmetrics.netlify.app/fr/data-pr-loss-stack</loc></url>
```

### Tests manuels
- `/fr/data-benchmarks` : cartes OPEX et PR sont cliquables avec badge "Disponible"
- Les liens mènent vers les bonnes pages (200)
- `/sitemap.xml` contient les 2 nouvelles URLs

---

## Résumé

| Commit | Fichiers | Description |
|--------|----------|-------------|
| 7 | `fr/data-opex-europe.html` (NEW) | Page OPEX : 3 tables + définitions |
| 8 | `fr/data-pr-loss-stack.html` (NEW) | Page PR : 3 tables + définitions |
| 9 | `fr/data-benchmarks.html`, `sitemap.xml` | Hub mis à jour + sitemap |

Total : 4 fichiers touchés, 2 pages nouvelles.
