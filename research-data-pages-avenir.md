# Recherche de données — Pages "À venir" (OPEX, WACC, PR & Loss Stack)

_Compilé le 10 mars 2026 — Sources open-access uniquement_

---

## 1. OPEX Europe (O&M — Operations & Maintenance)

### Données trouvées

| Source | Donnée clé | Lien |
|--------|-----------|------|
| **ETIP-PV (factsheet LCOE 2023)** | Utility-scale OPEX : **€12,5/kW/an** (fin 2023), projection **€9/kW/an** d'ici 2050 | [pv-magazine](https://www.pv-magazine.com/2023/12/14/solar-lcoe-may-decrease-by-up-to-20-in-europe-by-2030/) |
| **JRC CETO 2024 (JRC139297)** | Rapport complet PV Europe — contient données O&M p.27+ | [PDF JRC139297](https://publications.jrc.ec.europa.eu/repository/bitstream/JRC139297/JRC139297_01.pdf) |
| **IRENA RPG Costs 2024** | LCOE solaire global = $0,043/kWh (2024). TIC = $691/kW. O&M détaillé dans le rapport complet | [PDF IRENA 2024](https://www.irena.org/-/media/Files/IRENA/Agency/Publication/2025/Jul/IRENA_TEC_RPGC_in_2024_2025.pdf) |
| **IRENA RPG Costs 2023** | O&M utility-scale : baisse continue, chiffres détaillés dans rapport complet | [PDF IRENA 2023](https://www.irena.org/-/media/Files/IRENA/Agency/Publication/2024/Sep/IRENA_Renewable_power_generation_costs_in_2023.pdf) |
| **Fraunhofer ISE LCOE 2024** | LCOE Allemagne : 4,1–7,2 ct€/kWh (utility), contient hypothèses O&M | [Fraunhofer ISE](https://www.ise.fraunhofer.de/en/publications/studies/cost-of-electricity.html) |
| **NREL ATB 2024** | O&M utility-scale US : ~$17/kW-DC/yr (tendance baisse) | [NREL ATB 2024](https://atb.nrel.gov/electricity/2024/utility-scale_pv) |

### Données manquantes (à chercher)
- **Ventilation OPEX par composante** : assurance, maintenance préventive/corrective, nettoyage, monitoring, terrain/loyer, frais de gestion
- **OPEX par pays européen** (FR, DE, ES, IT, NL, PL, GR…)
- **Évolution historique** OPEX 2015-2024 en Europe
- **OPEX résidentiel vs commercial vs utility** en Europe

---

## 2. WACC Europe (Weighted Average Cost of Capital)

### Données trouvées

| Source | Donnée clé | Lien |
|--------|-----------|------|
| **IRENA 2024** | WACC solaire : **3,8% Europe**, 12% Afrique | Rapport IRENA RPG Costs 2024 |
| **IEA Cost of Capital Observatory** | Data explorer interactif, WACC utility-scale par pays 2015-2024. **Attention : focus pays émergents**, Europe peu couverte | [IEA Data Explorer](https://www.iea.org/data-and-statistics/data-tools/cost-of-capital-observatory-data-explorer) |
| **IEA Chart** | WACC utility-scale PV, pays sélectionnés 2015-2024 | [IEA Chart](https://www.iea.org/data-and-statistics/charts/weighted-average-cost-of-capital-for-solar-pv-in-utility-scale-solar-pv-in-selected-countries-2015-2024) |
| **Nature (2025)** | Dataset global du coût du capital pour projets EnR, par pays | [Nature Scientific Data](https://www.nature.com/articles/s41597-025-05912-x) |
| **OECD/IEA Working Paper** | "Bridging the clean energy investment gap: Cost of capital" | [OECD PDF](https://one.oecd.org/document/ENV/WKP(2024)15/REV1/en/pdf) |
| **Ordre de grandeur** | Europe/Amérique du Nord utility : **4,7%–6,4%** (nominal) | Multiples sources |

### Données manquantes (à chercher)
- **WACC par pays européen** (FR, DE, ES, IT, PT, GR, PL, RO…) avec distinction réel/nominal
- **Évolution 2018-2024** du WACC en Europe
- **WACC résidentiel** (souvent plus élevé que utility)
- **Composantes** : coût dette, coût equity, ratio D/E, prime de risque pays
- **Impact du WACC sur le LCOE** (sensibilité)

---

## 3. PR & Loss Stack (Performance Ratio & pertes)

### Données trouvées

| Source | Donnée clé | Lien |
|--------|-----------|------|
| **NREL/TP-5K00-88769 (2024)** | Rapport complet sur 8,5 GW US : availability, soiling, degradation, Performance Index | [PDF NREL](https://docs.nrel.gov/docs/fy24osti/88769.pdf) |
| **PVWatts (NREL)** | Pertes par défaut : soiling 2%, câblage 2%, connecteurs 0,5%, LID 1,5%, nameplate 1%, disponibilité 3% | [PVWatts](https://pvwatts.nrel.gov/) |
| **NREL** | Disponibilité système : P50 = 0,99 ; P90 = 0,95 | NREL/TP-5K00-88769 |
| **NREL** | Taux de dégradation médian : **0,75%/an** | NREL/TP-5K00-88769 |
| **NREL** | Dégradation selon climat : 0,5%/an (tempéré) → 0,88%/an (chaud) | NREL/TP-5K00-88769 |
| **NREL** | Soiling : 2–25% selon site, typiquement 4–5% en Californie | NREL soiling studies |
| **NREL Weather-corrected PR** | Méthodologie PR corrigé température | [PDF NREL 57991](https://docs.nrel.gov/docs/fy13osti/57991.pdf) |
| **NREL PLR perspective (2023)** | "Performance Loss Rate in Photovoltaic Systems" | [PDF NREL 85463](https://docs.nrel.gov/docs/fy23osti/85463.pdf) |

### Stack de pertes typique (utility-scale)

```
Irradiation GHI/POA         100%
├── Transposition (GHI→POA)   -2 à -5%
├── Ombrage (horizon, inter-rangées) -1 à -3%
├── Soiling (salissure)       -2 à -5%
├── Réflexion (IAM)           -2 à -4%
├── Température               -3 à -10%  (selon climat)
├── LID (Light-Induced Deg.)  -1,5%
├── Mismatch modules          -1 à -2%
├── Câblage DC                -1 à -2%
├── Onduleur (rendement)      -2 à -4%
├── Câblage AC                -0,5 à -1%
├── Transformateur             -0,5 à -1%
├── Disponibilité (downtime)  -1 à -5%
├── Curtailment               -0 à -5%
├── Dégradation annuelle      -0,5 à -0,88%/an
└── Neige / givre             -0 à -5% (selon localisation)
    ─────────────────────────
    PR typique ≈ 75–85%
```

### Données manquantes (à chercher)
- **PR par pays/climat européen** (Méditerranée vs Scandinavie vs Europe centrale)
- **PR bifacial** (gains arrière face, albédo)
- **PR trackers vs fixe**
- **Données européennes** (IEC 61724, TÜV Rheinland, 3E, Solargis)
- **Évolution du PR** au fil du temps (amélioration technologique)

---

## Résumé des lacunes prioritaires

| Page | Ce qui manque le plus |
|------|----------------------|
| OPEX | Ventilation par composante, données par pays EU, historique |
| WACC | WACC par pays EU (réel + nominal), composantes, résidentiel |
| PR   | Données EU spécifiques, bifacial, trackers, PR par climat EU |

---

# PROMPT GPT — Recherche parallèle de données

Copie-colle ce prompt dans GPT pour qu'il cherche les données complémentaires :

---

```
RÈGLES
- Sources open-access uniquement.
- Pour chaque chiffre : valeur + unité + année + géographie + lien + page/figure/table si PDF.
- Toujours préciser : Observed data / Model default / SolarMetrics assumption.
- Signaler toute ambiguïté d'unité (ex : €/W/an vs €/kW/an) au lieu de conclure.

PRIORITÉ DE SOURCES (ordre strict)
1) JRC/CETO Photovoltaics in the EU (JRC139297) + citations exactes
2) IRENA RPGC 2024/2023 (PDF) + citations exactes
3) NREL reports (88769, 57991, 85463) + citations exactes
4) IEA charts/datasets si extraction possible sans paywall
5) Publications académiques open (ex : Nature Scientific Data / PMC)

TÂCHE A — OPEX (Europe)
- Extraire du JRC/CETO :
  (1) plage O&M UE utility-scale (€/kWp/an) + conditions (fixed vs tracking) + pays cités
  (2) moyenne Europe O&M (USD/kW/an) + variation régionale
- Produire un tableau "Observed data" avec références page/table.
- Bonus : trouver toute ventilation OPEX (assurance/terrain/monitoring/etc.) en open access.

TÂCHE B — WACC (Europe)
- Extraire IRENA : WACC assumptions Europe (valeur + page).
- Chercher un dataset open par pays EU (nominal after-tax WACC si possible) et lister 5–10 pays max, avec années.
- Si pas de pays EU fiables : dire explicitement "pas assez de data pays open".

TÂCHE C — PR & Loss stack
- Extraire NREL 88769 : disponibilité/availability, pertes, définitions, éléments quantifiés.
- Extraire NREL 57991 : méthode PR corrigé météo.
- Extraire NREL 85463 : définition PLR.
- Extraire PVWatts manual : pertes par défaut (en tant que model defaults, pas observed).

FORMAT DE SORTIE
3 sections (OPEX / WACC / PR)
Pour chaque section : un tableau "Sources → chiffres → pages → notes (Observed vs default vs assumption)".
```

---

_Fin du document de recherche_
