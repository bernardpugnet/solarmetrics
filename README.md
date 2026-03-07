# SolarMetrics

**Finance & technique du solaire** — Site statique bilingue FR/EN sur l'énergie solaire photovoltaïque en Europe.

🔗 **Site live** : [solarmetrics.netlify.app](https://solarmetrics.netlify.app/fr/)

## Présentation

SolarMetrics est un site de veille et d'analyse sur le secteur solaire photovoltaïque européen. Il couvre la finance, la technique, les réglementations et les outils de simulation pour les installations résidentielles et industrielles (fermes solaires utility-scale).

Le site s'adresse aux professionnels du solaire, investisseurs, et particuliers souhaitant comprendre la rentabilité d'une installation PV.

## Stack technique

- **HTML/CSS/JS statique** — pas de framework, pas de build step
- **Tailwind CSS** via CDN
- **Chart.js** pour les graphiques interactifs
- **Leaflet.js** pour la carte d'ensoleillement
- **Netlify** : hébergement, headers de sécurité, serverless functions
- **PVGIS API** (Commission européenne) : données d'irradiation solaire
- **Eurostat API** : tarifs d'électricité actualisés pour 10 pays EU

## Structure du projet

```
solarmetrics/
├── fr/                          # Pages françaises
│   ├── index.html               # Accueil FR
│   ├── outils-residentiel.html  # Simulateur résidentiel + schéma plug & play
│   ├── outils-industriel.html   # Calculateur LCOE/TRI + schéma grande installation
│   ├── schema-plug-and-play.html       # Schéma interactif installation résidentielle
│   ├── schema-grande-installation.html # Schéma interactif ferme solaire (100 kWc–10+ MWc)
│   ├── economie.html            # Analyse économique du solaire
│   ├── marches.html             # Marchés européens
│   ├── technologies.html        # Technologies PV
│   ├── ia-data.html             # IA & données dans le solaire
│   ├── etude-de-cas.html        # Études de cas
│   ├── ressources.html          # Ressources et liens utiles
│   ├── recrutez-moi.html        # Page portfolio / collaborer
│   ├── contact.html             # Contact
│   └── analyses/                # Articles d'analyse approfondie
│       ├── lcoe-solaire-europe.html
│       └── prix-ppa-solaire-europe.html
├── en/                          # Pages anglaises (structure miroir)
│   ├── tools-residential.html
│   ├── tools-industrial.html
│   ├── schema-plug-and-play.html
│   ├── schema-large-installation.html
│   └── insights/
├── js/
│   └── solar-data.js            # Données pays (tarifs, aides, coordonnées, coefficients)
├── netlify/functions/
│   └── pvgis.js                 # Proxy PVGIS avec cache 24h et validation géographique
├── images/                      # Visuels et previews PNG des schémas SVG
├── netlify.toml                 # Config déploiement + redirections
├── _headers                     # Headers de sécurité (CSP, X-Frame-Options)
├── sitemap.xml                  # Sitemap XML avec hreflang bilingue
├── robots.txt
└── README.md
```

## Outils interactifs

### Simulateur résidentiel
Calculateur de rentabilité pour installations PV résidentielles (< 9 kWc) couvrant 10 pays européens : France, Allemagne, Espagne, Italie, Pays-Bas, Belgique, Portugal, Pologne, Autriche, Grèce. Utilise les données PVGIS pour l'irradiation et Eurostat pour les tarifs d'électricité.

### Calculateur LCOE & TRI
Simulateur professionnel pour projets de grande envergure : LCOE (Levelized Cost of Energy), TRI (Taux de Rentabilité Interne), VAN (Valeur Actuelle Nette), flux de trésorerie sur 25-40 ans.

### Schémas interactifs
Deux schémas SVG inline cliquables avec tooltips techniques détaillés et sélecteur de réglementations par pays :

- **Plug & Play** (600 Wc – 3 kWc) : 6 composants, aides par pays, revente surplus
- **Ferme solaire** (100 kWc – 10+ MWc) : 8 composants (champ PV, onduleur central, transformateur HTA, BESS, SCADA/EMS, poste de livraison), glossaire technique, flèches animées

## Données couvertes

- 10 pays européens avec réglementations spécifiques
- Coûts d'installation 2025-2026 (résidentiel et utility-scale)
- Tarifs d'électricité actualisables via Eurostat
- Aides et subventions par pays (avec liens officiels)
- LCOE, PPA, compléments de rémunération

## Déploiement

Le site se déploie automatiquement sur Netlify à chaque push sur `main`. Aucun build step requis — le contenu est servi tel quel.

```bash
# Rien à installer, rien à build
# Push sur main = déploiement automatique via Netlify
git push origin main
```

## SEO & Performance

- Sitemap XML avec balises hreflang pour le bilingue
- Headers de sécurité (X-Frame-Options, CSP, Referrer-Policy)
- Google Search Console configurée
- Pas de cookies, pas de tracking — conforme RGPD
- Tailwind via CDN uniquement, pas de dépendances npm

## Auteur

**Bernard Pugnet** — Analyste énergie solaire & data

- 🔗 [LinkedIn](https://www.linkedin.com/in/bernard-pugnet/)
- 🌐 [SolarMetrics](https://solarmetrics.netlify.app/fr/)

## Licence

© 2026 Bernard Pugnet — Tous droits réservés.
