# Réflexion stratégique — SolarMetrics

**Date : 7 mars 2026**
**Objectif : Identifier tout ce qu'un expert du solaire et du web attendrait de ce site**

---

## 1. Ce que le site fait déjà bien

Le site couvre 3 piliers solides :

- **Économie & Finance** : LCOE, PPA, structures de financement, subventions 10 pays — c'est le point fort, peu de sites gratuits vont aussi loin
- **Technologies** : PERC, TOPCon, HJT, pérovskites, onduleurs, batteries — bonne largeur
- **Outils interactifs** : Calculateur résidentiel avec PVGIS, calculateur industriel LCOE/TRI, schémas interactifs SVG, et maintenant le simulateur d'autoconsommation horaire

Ce qui manque, c'est de la **profondeur pratique**, des **données chiffrées actualisées**, et des **sujets que personne n'aborde en français**.

---

## 2. Ce qui manque — classé par impact

### A. PRIX DES COMPOSANTS (priorité haute)

Aucun site français ne propose un tableau clair et actualisé des prix. C'est pourtant la première question de tout le monde.

**Page suggérée : "Prix du solaire" / "Solar Pricing"**

Contenu à inclure :

- **Modules PV** : prix au Wc par technologie
  - TOPCon : ~0.08 $/Wc FOB Chine, ~0.10-0.13 €/Wc Europe (Q1 2026)
  - PERC : en voie d'obsolescence, ~0.25 $/Wc US (tarifs douaniers)
  - HJT : ~0.39 $/Wc, stable, segment premium
  - Full black / haut rendement Europe : ~0.130 €/Wc
- **Onduleurs** :
  - String : 500-2 500 € selon puissance
  - Micro-onduleurs : 195-230 € par unité (Enphase ~0.87-0.97 €/Wc système)
  - Centraux (utility) : 3 000-100 000+ €
- **Batteries résidentielles LFP** :
  - Tesla Powerwall 3 (13.5 kWh) : 10 000-15 000 € installée (~700-780 €/kWh)
  - BYD Battery-Box HVE : modulaire, compétitif
  - Huawei Luna : modulaire, intégration onduleur
  - Utility-scale : ~334 $/kWh (NREL 2025), meilleurs projets : 125 $/kWh
- **Coût installation complet** :
  - France résidentiel (<9 kWc) : ~1.5-2.0 €/Wc installé (TVA 5.5% depuis oct 2025)
  - Espagne résidentiel : ~1.06 €/Wc
  - Allemagne résidentiel : ~1.2-1.5 €/Wc
  - USA : 2.80-3.80 $/Wc (tarifs douaniers élevés)
- **Balance of System (BOS)** : marché de 12.5 milliards $, pression haussière métaux + CBAM

**Format** : Tableaux comparatifs avec date de dernière mise à jour visible. Source principale : BNEF, IRENA, Fraunhofer ISE.

---

### B. LCOE ACTUALISÉ + COMPARAISON ÉNERGIES (priorité haute)

Le site a la formule LCOE mais pas les benchmarks actuels.

**Données à intégrer** :

- Solaire PV utility : 39 $/MWh (BNEF 2025), en hausse de 6% (anomalie temporaire)
- Prévision BNEF : -30% d'ici 2035
- Gaz CCGT : 102 $/MWh — solaire = moins de la moitié
- Nucléaire conventionnel : 258 $/MWh — solaire = un cinquième
- Lazard 2025 : solaire utility 38-78 $/MWh (fourchette resserrée)
- IRENA global 2024 : 0.043 $/kWh (+0.6%)

**Format** : Graphique interactif ou tableau de comparaison solaire vs éolien vs gaz vs nucléaire.

---

### C. TECHNOLOGIES ÉMERGENTES — CE QUI ARRIVE (priorité moyenne-haute)

La page Technologies est bonne mais statique. Il manque les tendances 2025-2030 concrètes.

**Pérovskite tandem** :
- Record LONGi : 34.85% rendement certifié (2025)
- Oxford PV : premiers modules commerciaux livrés (24.5-26.9%, sept 2024)
- Hanwha Q Cells : production masse prévue H1 2027
- Oxford PV + Trinasolar : licence exclusive pour la Chine (avril 2025)
- Impact : les modules tandem pourraient devenir mainstream d'ici 2028-2030

**Bifacial** :
- Marché : 29.88 milliards $ (2025) → 65.69 milliards $ (2034), CAGR 8.27%
- Gain de production : +10-25% selon l'albédo du sol
- 59.82% part de marché en Asie-Pacifique

**Agrivoltaïsme** :
- Marché : 5.26 milliards $ (2026) → 18.4 milliards $ (2035), CAGR 12%
- 21 000 hectares couverts en 2024, 18.4 GW de capacité
- Commission européenne : objectif 10 000 ha dual-use d'ici 2026
- Italie : programme incitatif 1.04 GW d'ici 2026

**Solaire flottant** :
- 5.9 GW installés en 2023, CAGR 34.2% jusqu'en 2030
- Plus grande installation : Dongying (Chine) 1 GW en mer, 2.3 millions de panneaux
- LCOE Brésil : 65 $/MWh (vs 60 $/MWh terrestre) — quasi-parité
- LCOE eaux européennes côtières : encore cher (320-500 €/MWh)

---

### D. GUIDE PRATIQUE RÉSIDENTIEL (priorité haute)

C'est le plus gros manque pour attirer du trafic grand public. Le site a les outils mais pas le guide.

**Page suggérée : "Guide installation solaire" / "Solar Installation Guide"**

- Étapes d'un projet résidentiel (de l'idée au raccordement)
  1. Étude de faisabilité (orientation, ombrage, toiture)
  2. Dimensionnement (ratio production/consommation)
  3. Choix installateur (certifications QualiPV, RGE)
  4. Démarches administratives (déclaration préalable, Enedis, CONSUEL)
  5. Installation (durée, étapes)
  6. Raccordement et mise en service
  7. Contrat OA (obligation d'achat) ou autoconsommation
  8. Suivi et maintenance
- Délais typiques par étape
- Erreurs courantes à éviter
- Checklist téléchargeable

---

### E. RECYCLAGE ET FIN DE VIE (priorité moyenne)

Sujet de plus en plus demandé, quasiment absent du web français.

- Directive WEEE (EU) 2024/884 : transposition nationale avant 9 octobre 2025
- REP (Responsabilité Élargie du Producteur) : le fabricant paie le recyclage
- Objectif : 75-80% de récupération en poids
- Technologies : recyclage mécanique (36% du marché), chimique (croissance 19.2%/an), laser (9.8%/an)
- Taux de récupération actuel : 95% (silicium), 98% (couches minces)
- Percée 2025 : Université de Linköping — recyclage pérovskite à l'eau
- Marché : 384 millions $ (2025) → 548 millions $ (2030)
- En France : Soren (ex-PV Cycle) collecte et recycle les panneaux

---

### F. INTÉGRATION EV + SOLAIRE + V2G (priorité moyenne)

Sujet chaud qui intéresse les propriétaires de VE avec panneaux solaires.

- V2G (Vehicle-to-Grid) : le véhicule renvoie l'électricité au réseau
- Projet We Drive Solar (Utrecht) : 500 Renault 5 V2G, 60 bornes bidirectionnelles
  - 65 MWh injectés en 5 mois, pic de 300 kW en soirée
- Hyundai IONIQ 5 V2G : 25 véhicules à Utrecht alimentent des maisons
- CSIRO Australie : démonstration V2G avec prise standard Type 2
- 2025 = passage des pilotes aux opérations commerciales
- Lien avec autoconsommation : charger le VE en journée avec le surplus solaire

---

### G. CENTRALES VIRTUELLES (VPP) (priorité moyenne)

Comment les batteries résidentielles deviennent des actifs de réseau.

- Marché : 6.28 milliards $ (2025) → 39.31 milliards $ (2034), CAGR 22.6%
- Californie : 100 000 batteries résidentielles agrégées (535 MW)
- Modèle économique : le propriétaire est rémunéré pour mettre sa batterie à disposition du réseau pendant les pics
- NRG : programme VPP de 20 MW élargi à 150 MW (forte demande)
- GMP Vermont : 3 millions $ d'économies pour les abonnés (été 2025)
- Pertinent pour SolarMetrics : lier avec le simulateur autoconsommation (gain potentiel VPP en plus des économies)

---

### H. IA DANS LE SOLAIRE — CAS CONCRETS (priorité moyenne)

La page AI & Data est conceptuelle. Il faut des cas réels.

- **SmartHelio** : 7 GW sous gestion, 5 milliards de points de données analysés, détection d'anomalies IA
- **enSights** : O&M cloud-natif, +5-10% disponibilité, +2-3% facteur de capacité
- **Open Climate Fix** : prévision production avec imagerie satellite, -27.28% d'erreur RMSE vs météo classique
- **Enphase Enlighten** : maintenance prédictive IA, diagnostics à distance, batteries 4e gén avec 30% plus de densité
- **Drones + IA** : inspection thermique automatisée, détection de hotspots et micro-fissures
- Marché IA solaire : 5.96 milliards $ (2024), CAGR 20.8%

---

### I. ASPECTS ENVIRONNEMENTAUX (priorité basse-moyenne)

- Temps de retour carbone d'un panneau : 1-3 ans selon la technologie et le lieu
- Analyse du cycle de vie (ACV/LCA) : fabrication → transport → installation → exploitation → recyclage
- Empreinte eau : quasi-nulle en exploitation (vs nucléaire ou charbon)
- Biodiversité : enjeux pour les grandes fermes, solutions agrivoltaïques
- Bilan CO₂ complet : ~20-50 gCO₂/kWh sur cycle de vie (vs gaz 400-500, charbon 800-1000)

---

## 3. Améliorations des outils existants

### Simulateur d'autoconsommation

Paramètres manquants (discutés avant) :
- **Pertes système** (actuellement hardcodé 14%) : range 8-20%
- **Hausse prix électricité** (hardcodé 3%/an) : très sensible pour le payback
- **Type de montage** (surimposé vs intégré bâti) : 3-5% d'impact en été

Fonctionnalités possibles pour V2 :
- Export PDF du résultat (avec graphiques)
- Comparaison avec/sans batterie côte à côte
- Estimation des aides (prime autoconsommation)
- Lien VPP : estimation du revenu potentiel si batterie participe à un agrégateur

### Calculateur résidentiel

- Ajouter le coût batterie dans le calcul ROI
- Intégrer la prime autoconsommation française
- Comparaison multi-scénarios (3 kWc vs 6 kWc vs 9 kWc)

### Calculateur industriel

- Ajouter les PPA corporate (prix fixe vs indexé)
- Intégrer le coût BESS dans l'analyse NPV
- Modèle merchant (revente sur le marché spot)

---

## 4. Améliorations techniques du site

- **Recherche interne** : les utilisateurs ne trouvent pas facilement l'information
- **Dates de mise à jour** : afficher "Dernière MAJ : mars 2026" sur chaque page de données
- **Sources cliquables** : chaque chiffre devrait avoir sa source (IRENA, BNEF, Eurostat)
- **Glossaire enrichi** : la page Ressources a un glossaire mais il manque des termes (VPP, V2G, agrivoltaïsme, LCOE+storage, etc.)
- **SEO** : articles de fond sur des requêtes longue traîne ("prix panneau solaire 2026", "autoconsommation rentable ?", "recyclage panneau solaire France")

---

## 5. Priorisation suggérée

| Priorité | Contenu | Effort | Impact trafic |
|----------|---------|--------|---------------|
| 1 | Prix des composants (tableaux actualisés) | Moyen | Très fort |
| 2 | Guide installation résidentiel | Moyen | Très fort |
| 3 | 3 paramètres manquants simulateur + texte résumé EN | Faible | Moyen |
| 4 | LCOE benchmarks + comparaison énergies | Faible | Fort |
| 5 | Technologies émergentes (pérovskite, bifacial, flottant) | Moyen | Fort |
| 6 | Recyclage / fin de vie | Moyen | Moyen |
| 7 | Intégration EV + V2G | Moyen | Moyen |
| 8 | VPP (centrales virtuelles) | Faible | Faible |
| 9 | IA cas concrets | Faible | Moyen |
| 10 | Impact environnemental / ACV | Faible | Moyen |

---

## 6. Positionnement unique

Ce qui peut différencier SolarMetrics des autres sites :

1. **Les outils interactifs** — aucun site français gratuit n'offre un simulateur autoconsommation horaire avec batterie LFP réaliste
2. **Le croisement finance + technique** — la plupart des sites sont soit techniques (installateurs) soit financiers (comparateurs), jamais les deux
3. **Les données européennes** — 10 pays, API Eurostat en temps réel, pas juste la France
4. **La transparence des sources** — chaque chiffre sourcé et daté, contrairement aux sites commerciaux qui citent des chiffres vagues

Le site ne devrait pas essayer de rivaliser avec les comparateurs d'installateurs (Otovo, EDF ENR, etc.) mais plutôt se positionner comme **la référence d'information indépendante et technique sur le solaire en Europe**.

---

*Ce document est une base de réflexion. Les données chiffrées proviennent de BNEF, IRENA, Lazard, Fraunhofer ISE, NREL, Eurostat et PV Tech (2025-2026).*
