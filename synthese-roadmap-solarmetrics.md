# Synthèse croisée — Roadmap SolarMetrics

**Claude + GPT (contenu) + GPT (design) — 7 mars 2026**

---

## Les 3 analyses convergent sur quoi ?

### Points d'accord unanimes (Claude + GPT)

1. **Les prix des composants manquent** — Claude et GPT demandent tous les deux des tableaux actualisés et datés (modules, onduleurs, batteries, BOS). GPT va plus loin : il veut une décomposition "cost stack" (modules / onduleurs / structures / BOS / raccordement / soft costs) et pas juste un CAPEX monolithique.

2. **Les données doivent être sourcées, datées et téléchargeables** — les deux insistent sur "date + source + méthode + download CSV". GPT propose le concept de "Assumptions Ledger" versionné, Claude propose le concept "Our World in Data du solaire".

3. **Le simulateur doit être enrichi** — les deux demandent : tarifs HP/HC, export PDF/CSV, comparaison multi-scénarios, intégration VE/PAC dans les profils.

4. **Une section risques manque** — Claude mentionne les aspects environnementaux, GPT détaille les risques techniques (LID, PID, LeTID) et marché (cannibalisation, prix négatifs, capture rate).

### Ce que GPT apporte en plus

- **Vision "pro/bankability"** : WACC par pays, DSCR, term-sheets PPA/VPPA/CfD, bankability checklist — c'est le regard d'un analyste financier
- **"Assumptions Ledger" versionné** : chaque chiffre a un snapshot daté, un changelog, et un bouton "Reproduce" — c'est l'idée la plus originale
- **"Risk Radar" ENTSO-E** : dashboard par pays avec prix négatifs, curtailment, capture risk — très différenciant
- **Profils EV + PAC + ECS** : cases à cocher dans le simulateur pour modifier le profil conso
- **Comparateur PPA vs merchant vs hybrid** : 3 scénarios types

### Ce que Claude apporte en plus

- **Scrollytelling "Mon Solaire en 60s"** : expérience narrative personnalisée au scroll — GPT n'en parle pas
- **Personnalisation géolocalisée** : le site s'adapte automatiquement au pays du visiteur
- **Widgets embarquables** : mini-outils que d'autres sites intègrent (backlinks + visibilité)
- **Technologies émergentes détaillées** : pérovskite tandem (34.85%), solaire flottant, agrivoltaïsme, V2G, VPP — avec chiffres et sources 2025-2026
- **Guide pratique résidentiel** : étapes concrètes de l'installation, checklist
- **PWA** : site installable, résultats sauvegardés hors-ligne
- **Micro-animations** : compteurs animés, feedback couleur, confetti payback rapide

---

## Roadmap unifiée — 4 phases

### Phase 1 : Quick wins (1-2 semaines)

**Objectif : rendre le site vivant et le simulateur complet**

| # | Tâche | Source idée |
|---|-------|------------|
| 1.1 | Ajouter les 3 paramètres manquants au simulateur (pertes système, hausse prix élec, type montage) | Claude |
| 1.2 | Ajouter les profils EV + PAC + ECS comme cases à cocher modifiant le profil conso | GPT |
| 1.3 | Recommandation batterie 3 tailles (5/10/15 kWh) avec explication du compromis | GPT |
| 1.4 | Texte explicatif résultats en langage simple (déjà fait FR, faire EN) | Claude |
| 1.5 | Version EN du simulateur (`tools-selfconsumption.html`) | Claude |
| 1.6 | Micro-animations : compteurs animés, couleurs dynamiques résultats | Claude |
| 1.7 | Personnalisation géolocalisée homepage (prix local, potentiel solaire) | Claude |
| 1.8 | Sitemap update (FR+EN autoconsommation) | Claude |

### Phase 2 : Données de référence (2-4 semaines)

**Objectif : devenir "citable" et crédible**

| # | Tâche | Source idée |
|---|-------|------------|
| 2.1 | Page "Prix du solaire / Solar Pricing" — tableaux composants actualisés avec cost stack | Claude + GPT |
| 2.2 | Créer `/data/snapshots/2026-03/` — fichiers JSON/CSV avec toutes les hypothèses | GPT |
| 2.3 | Page "Assumptions Deck" — onglets CAPEX/OPEX/WACC/Yield/Prices/CO₂ avec download | GPT |
| 2.4 | Changelog public "Data updates" (chaque MAJ = un post LinkedIn) | GPT |
| 2.5 | Ajouter "Dataset version + source + date" sur les pages existantes (LCOE, PPA, Technologies) | GPT |
| 2.6 | LCOE benchmarks actualisés + comparaison solaire vs gaz vs nucléaire | Claude |
| 2.7 | Bouton "Reproduce" sur le calculateur LCOE (URL avec paramètres) | GPT |
| 2.8 | Export PDF + CSV des résultats du simulateur autoconsommation | GPT + Claude |

### Phase 3 : Contenu expert (1-2 mois)

**Objectif : couvrir les trous et attirer du trafic**

| # | Tâche | Source idée |
|---|-------|------------|
| 3.1 | Guide installation résidentiel (étapes, démarches, erreurs, checklist) | Claude |
| 3.2 | Page technologies émergentes (pérovskite, bifacial, flottant, agrivoltaïsme) | Claude |
| 3.3 | Section "Risques & Bankability" — matrice risque/KPI/mitigation | GPT |
| 3.4 | Bankability checklist 1 page (DSCR, sensibilité, remplacement onduleurs) | GPT |
| 3.5 | 3 templates term-sheet : PPA physique, VPPA, CfD | GPT |
| 3.6 | Glossaire contractuel enrichi (floor, cap, collar, GO, profilage) | GPT |
| 3.7 | Table comparative par pays (irradiation, facteur charge, délai raccordement, fiscalité, PPA) | GPT |
| 3.8 | Recyclage / fin de vie (directive WEEE, Soren, technologies) | Claude |
| 3.9 | Comparateur interactif technologies (PERC vs TOPCon vs HJT slider) | Claude |
| 3.10 | Comparateur PPA vs merchant vs hybrid (3 scénarios) | GPT |

### Phase 4 : Expériences différenciantes (2-3 mois)

**Objectif : se démarquer radicalement**

| # | Tâche | Source idée |
|---|-------|------------|
| 4.1 | Scrollytelling "Mon Solaire en 60 secondes" | Claude |
| 4.2 | Risk Radar ENTSO-E (prix négatifs, curtailment, capture risk par pays) | GPT |
| 4.3 | Widgets embarquables (potentiel solaire, prix kWh, comparateur CO₂) | Claude |
| 4.4 | Dashboard temps réel homepage (prix kWh live, capacité mondiale, LCOE dynamique) | Claude |
| 4.5 | PWA (manifest.json + service worker, résultats offline) | Claude |
| 4.6 | Page narrative "L'histoire du solaire" (scrollytelling éducatif) | Claude |
| 4.7 | Intégration EV + V2G (page dédiée) | Claude |
| 4.8 | VPP centrales virtuelles (page dédiée) | Claude |

---

## Résumé : le positionnement cible

**Aujourd'hui** : SolarMetrics = site technique bilingue avec de bons outils interactifs

**Demain** : SolarMetrics = la **plateforme de référence indépendante sur le solaire en Europe**, avec :
- Des **données versionnées et reproductibles** (l'idée la plus forte de GPT)
- Des **outils interactifs personnalisés** (la force actuelle + géolocalisation)
- Des **expériences narratives** engageantes (scrollytelling, la force de Claude)
- Un contenu **finance + technique + risques** que personne ne combine en un seul endroit gratuit

**Le slogan** : *"L'Our World in Data du solaire — interactif, sourcé, reproductible."*

---

*Ce document fusionne les analyses de Claude (audit site + prix + tendances + design) et GPT (contenu expert + Assumptions Ledger + Risk Radar). Les idées sont attribuées à leur source pour traçabilité.*
