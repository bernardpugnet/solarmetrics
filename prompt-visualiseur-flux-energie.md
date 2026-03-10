# Prompt pour GPT — Conception d'un visualiseur interactif de flux d'énergie solaire

## Contexte du projet

Je développe **SolarMetrics** (https://solarmetrics.netlify.app), un site web statique bilingue FR/EN hébergé sur Netlify, dédié à l'énergie solaire résidentielle. Le site contient déjà :

- Un **simulateur d'autoconsommation** complet (appel API PVGIS heure par heure sur 8 760 h/an, profils de consommation, batterie, calculs financiers sur 25 ans)
- Des **schémas interactifs SVG** d'installations (plug & play et grande installation) avec animations de flux DC/AC
- Des données financières par pays (12 pays EU + US + Canada) dans un fichier `js/solar-data.js`
- Stack technique : **HTML/CSS/JS pur** (pas de framework), **Tailwind CSS via CDN**, **Leaflet.js** pour la carte, **Chart.js** disponible

## L'idée

Je voudrais créer une **visualisation pédagogique interactive** qui montre à un novice complet **comment l'électricité circule dans une maison équipée de panneaux solaires, heure par heure, tout au long d'une journée**.

L'objectif est de rendre **intuitif et visuel** ce qui se passe concrètement :
- Le matin : le soleil se lève, les panneaux commencent à produire, mais la production est inférieure à la consommation → on tire du réseau
- En milieu de journée : la production dépasse la consommation → le surplus charge la batterie ou est injecté dans le réseau
- Le soir : le soleil se couche, la batterie se décharge pour alimenter la maison
- La nuit : tout vient du réseau (ou de la batterie si elle a encore de la charge)

## Ce que j'aimerais que tu m'aides à définir

### 1. Format et emplacement
- Faut-il en faire une **page dédiée** du site, un **onglet dans le simulateur existant**, ou les deux ?
- Comment l'articuler avec le simulateur existant (qui fait déjà un calcul horaire complet mais n'affiche que des résultats agrégés) ?

### 2. Éléments visuels
- Quel type de représentation serait le plus parlant pour un novice ?
  - Schéma animé type "maison avec panneaux + batterie + réseau" avec des flèches/particules qui bougent ?
  - Graphique temporel (courbes production vs consommation sur 24h) avec curseur ?
  - Les deux combinés et synchronisés ?
  - Autre approche (sankey diagram, gauge, etc.) ?
- Comment représenter visuellement les flux simultanés (production → maison, production → batterie, production → réseau, réseau → maison, batterie → maison) ?

### 3. Paramètres utilisateur
Quels paramètres l'utilisateur devrait-il pouvoir ajuster pour que ce soit pédagogique sans être trop complexe ?
- Minimum : puissance PV, consommation journalière, batterie oui/non
- Possible : orientation (sud/est/ouest), saison (été/hiver/mi-saison), profil de consommation (famille, télétravail, retraité), heures creuses/pleines
- Avancé : véhicule électrique, ballon d'eau chaude, pompe à chaleur

### 4. Données et réalisme
- Faut-il utiliser des **données réelles PVGIS** (comme dans le simulateur) ou des **courbes type simplifiées** basées sur la latitude/saison ?
- La courbe de production simplifiée pourrait être une gaussienne centrée sur midi, modulée par la saison et l'orientation
- La courbe de consommation pourrait suivre un profil type (pics matin/soir, creux nuit/après-midi)

### 5. Fonctionnalités d'animation
- Lecture automatique 24h (type time-lapse) avec play/pause ?
- Curseur manuel pour aller à n'importe quelle heure ?
- Vitesse ajustable ?
- Affichage en temps réel des kW instantanés et des kWh cumulés ?
- Compteur de coût/économie en temps réel ?

### 6. Aspects pédagogiques
- Faut-il ajouter des **bulles explicatives** à certaines heures clés (ex: "10h : vos panneaux produisent maintenant plus que vous ne consommez !") ?
- Des **indicateurs visuels** de l'état (autoconsommation, injection, soutirage) avec code couleur ?
- Un **résumé de fin de journée** montrant les % d'autoconsommation, autoproduction, etc. ?

## Contraintes techniques
- HTML/CSS/JS pur (pas de React/Vue/Angular)
- Doit fonctionner sur mobile (responsive)
- Design cohérent avec le reste du site (thème sombre, couleurs ambre/slate)
- Performance : animations fluides même sur mobile
- Accessibilité : les informations clés doivent être lisibles même sans animation

## Ce que j'attends de toi
1. Une **proposition de concept** avec wireframe/mockup textuel
2. Une **architecture technique** (quels composants, comment les données circulent)
3. Une **liste ordonnée des fonctionnalités** par priorité (MVP → version enrichie)
4. Des **références/inspirations** de visualisations similaires bien faites
5. Ton avis sur les **choix les plus impactants** pour rendre ça vraiment pédagogique
