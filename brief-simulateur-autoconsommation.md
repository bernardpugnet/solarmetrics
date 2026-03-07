# Brief Technique : Simulateur Avancé d'Autoconsommation PV
## Projet SolarMetrics — Mars 2026

---

## 1. Contexte

**SolarMetrics** (https://solarmetrics.netlify.app) est un site bilingue FR/EN sur la finance du solaire photovoltaïque. Site statique hébergé sur Netlify, sans framework ni build step (HTML + Tailwind CDN + JavaScript vanilla).

### Outils existants
- **Simulateur résidentiel** (`outils-residentiel.html`) : calcul de rentabilité basique (production annuelle PVGIS × tarif Eurostat − coût installation = ROI). Kits de 600 Wc à 9 kWc.
- **Calculateur LCOE/TRI** (`outils-industriel.html`) : pour installations industrielles (100 kWc à 10+ MWc).
- **Fonction Netlify** `pvgis.js` : proxy vers l'API PVGIS v5.3, endpoint `PVcalc`, retourne des données **mensuelles** et annuelles.

### Ce qui manque
Aucun outil gratuit en ligne ne propose un simulateur d'autoconsommation complet avec :
- Production **horaire** réelle (pas juste un total annuel)
- Croisement avec des profils de consommation réalistes
- Simulation de batterie avec paramètres physiques réels
- Projections financières détaillées sur 25 ans

C'est le créneau entre PVGIS (données brutes gratuites) et PVsyst/Aurora Solar (1 000-15 000 €/an).

---

## 2. Architecture technique

### Stack (inchangée)
- **Frontend** : HTML + Tailwind CSS (CDN) + JavaScript vanilla
- **Graphiques** : Chart.js (déjà utilisé via CDN)
- **API solaire** : PVGIS v5.3 via Netlify Function (proxy CORS)
- **Hébergement** : Netlify (site statique, fonctions serverless)
- **Pas de** : React, Node.js, Python, base de données, build step

### Modification nécessaire de la fonction Netlify

La fonction `pvgis.js` actuelle utilise l'endpoint `PVcalc` qui retourne uniquement des totaux mensuels/annuels.

Pour les données horaires, il faut utiliser l'endpoint **`seriescalc`** :
```
https://re.jrc.ec.europa.eu/api/v5_3/seriescalc
  ?lat=48.8&lon=2.35
  &peakpower=3
  &loss=14
  &angle=30
  &aspect=0
  &outputformat=json
  &pvcalculation=1
  &startyear=2020&endyear=2020
```

**Réponse** : tableau de 8760 objets horaires :
```json
{
  "time": "20200615:1210",
  "P": 2345.67,        // Puissance en Watts
  "G(i)": 876.5,       // Irradiance plan incliné (W/m²)
  "H_sun": 65.3,       // Hauteur solaire (°)
  "T2m": 24.1,         // Température air (°C)
  "WS10m": 3.2,        // Vent (m/s)
  "Int": 0.0
}
```

Le champ clé est **`P`** (puissance W) qu'on divise par 1000 pour obtenir des kWh par heure.

**Attention** : cette requête retourne ~500 Ko de JSON (8760 lignes). Il faut :
- Un timeout plus long (15-20s au lieu de 8s)
- Éventuellement un cache Netlify plus agressif (les données TMY sont stables)
- Compression gzip (Netlify le fait automatiquement)

---

## 3. Modules à développer

### Module 1 — Simulateur d'autoconsommation (priorité haute)

**Inputs utilisateur :**
| Paramètre | Type | Valeur par défaut | Notes |
|-----------|------|-------------------|-------|
| Localisation | Lat/Lon via carte Leaflet | Paris 48.8/2.35 | Carte interactive déjà en place |
| Puissance PV | kWc (0.5 à 36) | 3 | Slider + input |
| Inclinaison | Degrés (0-90) | 30 | |
| Orientation | Azimut PVGIS (-180 à 180) | 0 (Sud) | Convention PVGIS : Sud=0, Est=-90, Ouest=90 |
| Conso annuelle | kWh/an | 4500 | Avec profils types sélectionnables |
| Profil de conso | Select | "Famille 4 pers." | Voir section profils |
| Batterie | kWh (0 à 20) | 0 | 0 = pas de batterie |
| Prix électricité | €/kWh | Auto (Eurostat) | Modifiable manuellement |

**Profils de consommation résidentiels (France) :**

Les profils doivent être **normalisés** (la somme des 8760 valeurs = exactement la conso annuelle saisie).

Structure : coefficient horaire × coefficient saisonnier, puis normalisation.

| Profil | Description | Caractéristiques |
|--------|-------------|------------------|
| Famille 4 pers. | Standard | Pics 7-9h et 18-22h, creux 0-6h, week-end décalé |
| Couple retraités | Présence journée | Conso étalée 8-20h, pas de pic matin marqué |
| Télétravail | Bureau à domicile | Pic continu 9-18h (PC, écrans, chauffage bureau) |
| Tout-électrique | Chauffage + ECS PAC | Forte conso hiver (×2-3), pics ECS 6-7h et 22-23h |

**Algorithme de normalisation :**
```
1. Générer profil brut : hourly[h] = baseFactor[hourOfDay] × seasonFactor[month]
2. Calculer somme brute = Σ hourly[h]
3. Normaliser : hourly[h] = hourly[h] × (consoAnnuelle / sommeBrute)
4. Vérification : Σ hourly[h] === consoAnnuelle (à l'arrondi près)
```

**Simulation batterie LFP :**

| Paramètre | Valeur | Source |
|-----------|--------|--------|
| Rendement charge | 95% | Données constructeur LFP typique |
| Rendement décharge | 95% | Idem |
| DoD max (profondeur décharge) | 90% | Spec LFP standard |
| Puissance max charge | Capacité × 0.5 (C/2) | Ex: batterie 10 kWh → 5 kW max |
| Puissance max décharge | Capacité × 0.5 (C/2) | Idem |
| Dégradation | 2%/an (pour module financier) | Garantie constructeur typique |
| SoC initial | 50% | Hypothèse de départ |

**Algorithme horaire (pour chaque heure h de 0 à 8759) :**
```
production[h] = pvgisData[h].P / 1000          // kW → kWh (sur 1 heure)
consommation[h] = profilNormalisé[h]

// 1. Autoconsommation directe
autoDirecte = min(production[h], consommation[h])

// 2. Excédent et déficit
excédent = production[h] - autoDirecte
déficit = consommation[h] - autoDirecte

// 3. Charge batterie (excédent → batterie)
chargeMax = min(excédent, puissanceMaxCharge, (capacité - SoC) / rendementCharge)
SoC += chargeMax × rendementCharge
surplusRéseau = excédent - chargeMax

// 4. Décharge batterie (déficit → batterie)
déchargeableMax = SoC - (capacité × (1 - DoD))    // énergie disponible au-dessus du seuil DoD
décharge = min(déficit / rendementDécharge, puissanceMaxDécharge, déchargeableMax)
SoC -= décharge
autoBatterie = décharge × rendementDécharge

// 5. Soutirage réseau
soutirageRéseau = déficit - autoBatterie

// 6. Totaux
autoTotal[h] = autoDirecte + autoBatterie
injectionRéseau[h] = surplusRéseau
```

**Indicateurs de sortie :**
- **Taux d'autoconsommation** = Σ autoTotal / Σ consommation × 100
- **Taux d'autoproduction** = Σ autoTotal / Σ production × 100
- **Production annuelle** = Σ production (kWh)
- **Injection réseau** = Σ injectionRéseau (kWh)
- **Soutirage réseau** = Σ soutirageRéseau (kWh)
- **Économie annuelle** = (Σ autoTotal × prixÉlec) + (Σ injectionRéseau × prixRevente)

**Graphiques (Chart.js) :**
1. **Mensuel** : barres empilées (autoconso directe + autoconso batterie + injection + soutirage) vs production totale
2. **Journée type été** (moyenne juin-juillet) : courbes production / conso / SoC batterie sur 24h
3. **Journée type hiver** (moyenne décembre-janvier) : idem
4. **Répartition annuelle** : donut (autoconso directe / autoconso batterie / injection / soutirage)

---

### Module 2 — Projections financières (priorité moyenne)

S'ajoute sous le module 1 sur la même page.

**Inputs supplémentaires :**
| Paramètre | Défaut | Notes |
|-----------|--------|-------|
| Coût installation PV | €/Wc → automatique selon kWc | Barème : 1.5-2.5 €/Wc résidentiel |
| Coût batterie | €/kWh | ~500-700 €/kWh installé (2026) |
| Hausse prix élec/an | 3% | Historique moyen Europe |
| Dégradation panneaux | 0.5%/an | Standard constructeurs |
| Dégradation batterie | 2%/an | LFP typique |
| Durée analyse | 25 ans | Standard garantie panneaux |
| Tarif revente surplus | €/kWh | Variable selon pays (ex: 0.13 €/kWh France OA) |
| Subventions | € | Prime autoconsommation France, etc. |
| Taux actualisation | 3% | Pour calcul VAN |

**Sorties :**
- **Cash-flow annuel** sur 25 ans (graphique barres)
- **Cumul cash-flow** (courbe, croise zéro = payback)
- **TRI** (Taux de Rentabilité Interne) via méthode Newton-Raphson
- **VAN** (Valeur Actuelle Nette) au taux d'actualisation
- **Payback simple** et **payback actualisé**
- **LCOE** (€/kWh produit sur la durée de vie)
- **Analyse de sensibilité** : 3 curseurs (prix élec, coût install, hausse annuelle) avec recalcul live

---

### Module 3 — Comparateur de scénarios (priorité basse)

Permet de configurer 2-3 scénarios côte à côte :
- Ex: "3 kWc sans batterie" vs "6 kWc + 10 kWh batterie" vs "9 kWc + 5 kWh batterie"
- Tableau comparatif : autoconso %, TRI, payback, VAN, investissement
- Graphiques superposés

---

## 4. Contraintes et points d'attention

### Performance client-side
- 8760 itérations en JS = instantané (<50ms sur mobile)
- Le goulot d'étranglement est l'appel API PVGIS (~3-8 secondes)
- Prévoir un loader/spinner pendant l'appel API
- Mettre en cache les résultats PVGIS dans `sessionStorage` (même lat/lon/params → pas de re-requête)

### Couverture géographique
- PVGIS couvre **Europe + Afrique + Asie occidentale** (lat 25-72°N, lon -25 à 45°E)
- Pour une couverture mondiale future : fallback vers **NREL PVWatts API** (USA) ou **NASA POWER** (monde entier)
- Pour le MVP : Europe uniquement (cohérent avec le site actuel)

### Profils de consommation
- Les profils types sont des approximations basées sur des données RTE/Enedis
- Idéalement : permettre à l'utilisateur d'uploader un CSV de sa conso réelle (compteur Linky)
- Pour le MVP : profils types uniquement

### Validation des résultats
- Comparer les résultats avec des cas connus (ex: 3 kWc Paris sans batterie → ~30-35% autoconsommation avec profil famille standard)
- Croiser avec les données de https://www.photovoltaique.info/ (Hespul)

### Design
- Thème sombre SolarMetrics (slate-900, amber-500 accents)
- Responsive (mobile-first)
- Intégration dans la navbar existante (dropdown "Outils" → nouveau lien)
- Bilingue FR/EN (2 fichiers HTML séparés)

---

## 5. Planning proposé

| Étape | Contenu | Estimation |
|-------|---------|------------|
| 1 | Modifier `pvgis.js` pour endpoint `seriescalc` (données horaires) | 1 session |
| 2 | Module autoconsommation (profils + batterie + graphiques) | 2-3 sessions |
| 3 | Module financier (cash-flow, TRI, sensibilité) | 1-2 sessions |
| 4 | Comparateur de scénarios | 1 session |
| 5 | Version EN + tests + intégration navbar | 1 session |

---

## 6. Questions ouvertes pour discussion

1. **Profils conso** : Faut-il intégrer des profils spécifiques par pays (Allemagne, Espagne, Italie) ou rester sur un profil France adaptable ?
2. **Tarifs revente** : Intégrer les barèmes OA (Obligation d'Achat) France automatiquement, ou laisser l'utilisateur saisir manuellement ?
3. **Import Linky** : Permettre l'upload d'un fichier CSV de consommation réelle — utile mais complexe (parsing, formats variables) ?
4. **Optimisation IA** : Algorithme simple qui suggère le dimensionnement optimal (kWc + batterie) pour maximiser le TRI — faisable en brute-force sur quelques combinaisons ?
5. **Périmètre MVP** : Commencer par un Module 1 complet et solide, ou intégrer directement le Module 2 (financier) dans la première version ?

---

*Document généré le 7 mars 2026 — Projet SolarMetrics*
*À soumettre pour revue à GPT-4 / Grok / autres IA pour feedback sur l'architecture et les algorithmes.*
