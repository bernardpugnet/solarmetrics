# Idées novatrices — Design & Différenciation SolarMetrics

**Date : 7 mars 2026**

---

## Le constat : ce que font les meilleurs

Après analyse des sites de référence (IRENA, Our World in Data, Ember Climate, Aurora Solar, EnergySage, Electricity Maps, IEA), voici ce qui les distingue :

- **Our World in Data** : design minimal, mais chaque graphique est interactif, téléchargeable, et accompagné d'un texte narratif. Les données SONT le produit.
- **Ember Climate** : tableau de bord en temps réel sur le mix électrique de 215 pays. Design circulaire innovant inspiré du tapis du Conseil européen (chaque pays a le même poids visuel).
- **Electricity Maps** : une seule idée, exécutée parfaitement — une carte temps réel de l'intensité carbone de l'électricité. Le minimalisme radical est leur force.
- **Aurora Solar** : transition 2D → 3D interactive pour la conception solaire. La preuve par les chiffres ("70% de réduction du temps de design").

**Point commun** : ils ne décorent pas, ils racontent une histoire avec les données.

---

## Idée n°1 — "Mon Solaire en 60 secondes" (scrollytelling personnalisé)

**Concept** : Une page d'entrée unique où le visiteur entre juste sa ville (ou autorise la géolocalisation) et sa consommation annuelle. En scrollant, il découvre une histoire personnalisée :

1. **Scroll 1** — Une carte apparaît avec son emplacement et l'irradiation solaire locale (données PVGIS en fond, dégradé de couleurs chaud)
2. **Scroll 2** — "Chez vous, le soleil fournit X kWh/m²/an" avec une animation du soleil qui se lève et des chiffres qui s'incrémentent
3. **Scroll 3** — "Avec 3 kWc de panneaux, vous produisez X kWh" — apparition progressive de panneaux sur un toit stylisé
4. **Scroll 4** — Un graphique animé montre la production vs consommation heure par heure sur une journée type, avec la zone d'autoconsommation qui se colore progressivement
5. **Scroll 5** — "Vous économisez X €/an, soit X €/mois" — animation d'une facture qui diminue
6. **Scroll 6** — "En 25 ans, c'est X tonnes de CO₂ évitées" — équivalent en voitures ou arbres, avec animation
7. **Scroll final** — Call-to-action : "Allez plus loin avec le simulateur avancé" + "Comparez les technologies" + "Guide d'installation"

**Pourquoi c'est différent** : Aucun site solaire français ne fait de scrollytelling. C'est la technique la plus engageante du web en 2025-2026 (utilisée par le NYT, The Pudding, National Geographic). Le visiteur ne "lit" pas, il **vit** l'histoire de son projet solaire.

**Techniquement** : Réalisable en vanilla JS + CSS (Intersection Observer API pour déclencher les animations au scroll). Pas besoin de librairie lourde. Compatible avec le stack actuel (Tailwind + Chart.js).

---

## Idée n°2 — Personnalisation géolocalisée automatique

**Concept** : Le site s'adapte automatiquement au visiteur sans qu'il fasse quoi que ce soit.

- **Détection pays** via l'API gratuite ipapi.co (côté client, pas de backend)
- La page d'accueil affiche automatiquement :
  - Le prix de l'électricité du pays du visiteur (données Eurostat déjà en place)
  - Les subventions locales en vigueur
  - Le potentiel solaire moyen de la région
  - Le LCOE local
- Les outils pré-remplissent les champs avec les valeurs du pays

**Exemple** : Un visiteur allemand voit "En Allemagne, le kWh coûte 0.39 € — le solaire résidentiel est rentable en 7 ans" directement sur la homepage. Un visiteur espagnol voit d'autres chiffres.

**Pourquoi c'est différent** : Les sites solaires sont génériques ou mono-pays. SolarMetrics couvre déjà 10 pays européens — autant exploiter ça en rendant l'expérience personnelle dès la première seconde.

**Techniquement** : 10 lignes de JS au chargement de la page. Un objet JSON avec les données par pays (déjà dans le code des calculateurs).

---

## Idée n°3 — Widgets embarquables

**Concept** : Proposer des mini-outils que d'autres sites (blogs, forums, médias, installateurs) peuvent intégrer chez eux avec un simple `<iframe>`.

- **Widget "Potentiel solaire"** : l'utilisateur entre son adresse, obtient la production estimée (mini version du calculateur PVGIS)
- **Widget "Prix du solaire"** : affiche le prix actuel du kWh par pays avec un indicateur visuel de rentabilité
- **Widget "Comparateur CO₂"** : combien de CO₂ évité par an pour X kWc

Chaque widget affiche discrètement "Propulsé par SolarMetrics" avec un lien.

**Pourquoi c'est différent** : C'est exactement ce que fait l'EIA américaine (Energy Information Administration) — ils laissent d'autres sites embarquer leurs graphiques. Ça crée des backlinks naturels, du trafic, et de la crédibilité. Aucun site solaire européen ne fait ça.

**Techniquement** : Des pages HTML légères dédiées (par ex. /widgets/potentiel.html) conçues pour être embarquées en iframe. Effort modéré.

---

## Idée n°4 — Dashboard temps réel sur la homepage

**Concept** : Remplacer la section hero statique par un dashboard vivant :

- **Prix du kWh en temps réel** pour 3-5 pays (Eurostat API, déjà disponible)
- **Capacité solaire mondiale** avec un compteur animé (2.2 TW et ça augmente)
- **Irradiation du jour** pour la localisation du visiteur
- **"Aujourd'hui, le solaire est X fois moins cher que le gaz"** — calcul dynamique basé sur les derniers LCOE

**Pourquoi c'est différent** : Electricity Maps fait ça pour le mix électrique. Personne ne le fait pour les fondamentaux du solaire (prix, capacité, LCOE). Le visiteur voit que le site est VIVANT, pas une brochure figée de 2024.

**Techniquement** : Les APIs sont déjà intégrées (Eurostat, PVGIS). Il faut juste les appeler au chargement de la homepage et les afficher joliment.

---

## Idée n°5 — Mode "Comparateur" interactif

**Concept** : Une page dédiée aux comparaisons visuelles côte à côte :

- **Technologies** : PERC vs TOPCon vs HJT — slider interactif montrant rendement, prix, durée de vie, garantie
- **Avec vs Sans batterie** : les mêmes graphiques d'autoconsommation affichés côte à côte, les différences surlignées
- **Solaire vs Autres** : LCOE solaire vs éolien vs gaz vs nucléaire, avec un graphique animé qui montre l'évolution 2010-2026
- **Par pays** : France vs Allemagne vs Espagne — prix install, rendement, subventions, payback

**Format** : Cartes à glisser (swipe cards sur mobile) ou layout split-screen sur desktop.

**Pourquoi c'est différent** : Les comparaisons sont le contenu le plus recherché sur Google ("panneau solaire quel type choisir", "solaire vs éolien", "autoconsommation avec ou sans batterie"). Aucun site ne les présente visuellement de façon interactive.

---

## Idée n°6 — Micro-animations sur les outils existants

**Concept** : Ajouter des animations subtiles (200-500ms) aux calculateurs pour les rendre plus vivants :

- Les chiffres s'incrémentent progressivement au lieu d'apparaître d'un coup (effect "compteur")
- Les graphiques Chart.js ont des animations d'entrée fluides (déjà supporté nativement)
- Le bouton "Lancer la simulation" pulse légèrement quand le formulaire est complet
- Les indicateurs de résultat (taux autoconsommation, payback) changent de couleur avec une transition douce selon le niveau (vert = bon, orange = moyen, rouge = attention)
- Un confetti discret quand le payback est inférieur à 10 ans

**Pourquoi c'est important** : Les micro-interactions augmentent les conversions de 20-25% (source : A/B tests documentés). 82% des utilisateurs préfèrent le dark mode — SolarMetrics l'a déjà, il faut l'enrichir de micro-animations.

**Techniquement** : CSS transitions + requestAnimationFrame pour les compteurs. Très léger (0 dépendance).

---

## Idée n°7 — PWA (Progressive Web App)

**Concept** : Transformer SolarMetrics en application installable.

- L'utilisateur peut "installer" le site sur son téléphone depuis le navigateur
- Les résultats de simulation sont sauvegardés localement (localStorage)
- Mode hors-ligne partiel : les pages informatives restent accessibles sans connexion
- Push notifications pour les mises à jour de prix ou de subventions (futur)

**Pourquoi c'est différent** : Alibaba a vu +76% de conversions avec sa PWA. Le marché des PWA passe de 2 milliards $ à 21 milliards $ d'ici 2033. Pour un site solaire, pouvoir consulter ses résultats de simulation hors-ligne (sur le toit avec l'installateur !) est un vrai plus.

**Techniquement** : Un fichier manifest.json + un service worker basique. Compatible Netlify. 2-3 heures de travail.

---

## Idée n°8 — "L'histoire du solaire" (page narrative)

**Concept** : Une page à part, à mi-chemin entre article et expérience visuelle, qui raconte l'histoire du solaire en scrollant :

- 1839 : Becquerel découvre l'effet photovoltaïque
- 1954 : Bell Labs crée la première cellule (6% rendement)
- 1973 : Choc pétrolier, premiers programmes de R&D
- 2000s : L'Allemagne lance le feed-in tariff, le marché explose
- 2015 : Le solaire passe sous le coût du charbon dans certaines régions
- 2024 : 2 TW installés dans le monde, le coût a baissé de 99% depuis 1976
- 2026 : Pérovskite tandem à 34.85%, le solaire = énergie la moins chère de l'histoire
- 2030 : Prévisions...

Chaque époque a son mini-graphique interactif (courbe de prix, capacité installée, rendement record).

**Pourquoi c'est différent** : Le storytelling éducatif est le format le plus partagé sur les réseaux. Ça positionne SolarMetrics comme un site de référence, pas juste un calculateur.

---

## Priorisation par effort / impact

| # | Idée | Effort | Impact | Faisabilité |
|---|------|--------|--------|-------------|
| 6 | Micro-animations outils | Faible | Moyen | Immédiat |
| 2 | Personnalisation géolocalisée | Faible | Fort | Immédiat |
| 4 | Dashboard temps réel homepage | Moyen | Fort | Court terme |
| 7 | PWA | Faible | Moyen | Court terme |
| 5 | Comparateur interactif | Moyen | Fort | Moyen terme |
| 3 | Widgets embarquables | Moyen | Très fort (SEO) | Moyen terme |
| 1 | "Mon Solaire en 60s" scrollytelling | Élevé | Très fort | Moyen terme |
| 8 | Histoire du solaire | Moyen | Moyen | Moyen terme |

---

## Ce qui différencie SolarMetrics durablement

Les installateurs font des sites commerciaux (vendre des devis). Les institutions font des rapports PDF. Les médias font des articles.

**SolarMetrics occupe un espace unique** : des outils interactifs gratuits + des données européennes sourcées + une approche technique mais accessible + un design moderne.

Pour creuser l'écart :

1. **Être le site qu'on cite** — données toujours sourcées, datées, téléchargeables
2. **Être le site qu'on intègre** — widgets embarquables, données réutilisables
3. **Être le site qui surprend** — scrollytelling, personnalisation, animations, pas une brochure statique
4. **Être le site qui vit** — dashboard temps réel, pas un contenu figé daté de 2024

Le positionnement : **"L'Our World in Data du solaire, version interactive et personnalisée."**

---

*Sources : recherches web BNEF, Our World in Data, Ember Climate, Aurora Solar, IEA, EnergySage, Electricity Maps, Figma Design Trends 2026, Lazard LCOE+ 2025.*
