# Contexte : Simulateur Solaire pour Particuliers — Solar Data Atlas

## Ce que tu dois savoir

Tu travailles sur le simulateur d'autoconsommation solaire résidentiel du site **Solar Data Atlas** (https://www.solardataatlas.com). C'est un outil gratuit, en ligne, destiné aux particuliers qui envisagent une installation photovoltaïque.

## Stack technique

- Site statique bilingue FR/EN, hébergé sur Netlify
- Pas de framework, pas de build step : HTML + Tailwind CSS (CDN) + JavaScript vanilla
- Graphiques : Chart.js (CDN)
- Carte interactive : Leaflet.js
- Données solaires : API PVGIS v5.3 (EU JRC), endpoint `seriescalc` (données horaires), via une Netlify Function proxy (`pvgis.js`)
- Couverture géographique : Europe + pourtour méditerranéen (limites PVGIS)

## Page du simulateur

- FR : `/fr/outils-simulation.html`
- EN : `/en/tools-simulation.html`
- JS principal : `/js/autoconsommation.js`
- JS données : `/js/solar-data.js`

## Ce que fait le simulateur

### Inputs utilisateur
- **Localisation** : sélection sur carte Leaflet (lat/lon) ou saisie manuelle
- **Puissance PV** : de 0.5 à 36 kWc (slider + input)
- **Inclinaison** : 0-90° (défaut 30°)
- **Orientation** : azimut PVGIS, Sud=0, Est=-90, Ouest=90
- **Consommation annuelle** : en kWh/an (défaut 4500)
- **Profil de consommation** : 4 profils réalistes sélectionnables
- **Batterie** : capacité 0-20 kWh (0 = pas de batterie)
- **Prix électricité** : €/kWh (auto ou manuel)
- **Tarif revente surplus** : €/kWh

### 4 profils de consommation résidentiels
Basés sur des courbes RTE/Enedis, chacun défini par 24 coefficients horaires + 12 coefficients saisonniers, normalisés pour que la somme = conso annuelle saisie :
1. **Famille 4 personnes** : pics 7-9h et 18-22h, creux nocturne
2. **Couple retraités** : consommation étalée en journée (présents au domicile)
3. **Télétravail** : pic continu 9-18h (PC, écrans)
4. **Tout-électrique** : forte conso hiver (PAC), pics ECS 6-7h et 22-23h

### Algorithme de simulation
- **8760 itérations** (1 par heure de l'année), côté client (<50ms)
- Pour chaque heure : calcul de l'autoconsommation directe, charge/décharge batterie (modèle LFP : rendement 95%, DoD 90%, puissance max C/2), surplus injecté, soutirage réseau

### Paramètres batterie LFP
- Rendement charge/décharge : 95%
- Profondeur de décharge max : 90%
- Puissance max : capacité × 0.5 (C/2)
- Dégradation : 2%/an (pour projections financières)

### KPI de sortie
- Production annuelle (kWh) et production par kWc (kWh/kWc)
- Taux d'autoconsommation (%) et taux d'autoproduction (%)
- Autoconsommation directe / via batterie / injection réseau / soutirage réseau (kWh)
- Économies annuelles (€) : autoconsommation + revente surplus
- CO₂ évité (tonnes)
- Projections financières sur 25 ans : coût net, payback, VAN, TRI
- Dégradation panneaux intégrée (0.5%/an)

### Graphiques (Chart.js)
1. **Profil mensuel** : barres empilées (auto-directe / auto-batterie / injection / soutirage)
2. **Répartition énergétique** : donut annuel
3. **Jour type été** (juin-juillet) : courbes production / conso / SoC batterie sur 24h
4. **Jour type hiver** (déc-jan) : idem
5. **Payback** : courbe cumulative des économies sur 25 ans
6. **Comparaison avec/sans batterie**

### Export
- Rapport PDF généré côté client (jsPDF)
- Impression optimisée (CSS print)

## Ce qui n'est PAS dans le simulateur
- Pas de base de données, pas de comptes utilisateurs
- Pas de backend Python/Node (tout est client-side + une seule Netlify Function pour proxyer PVGIS)
- Pas d'import de données Linky (prévu mais non implémenté)
- Pas de couverture hors Europe (limites PVGIS)

## Auteur
Bernard Pugnet — professionnel senior finance, risque et performance, focalisé sur l'analyse des actifs solaires. Site personnel à vocation informative, données compilées à partir de sources institutionnelles publiques.
