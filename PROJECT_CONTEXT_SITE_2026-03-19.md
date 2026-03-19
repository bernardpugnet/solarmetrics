# PROJECT CONTEXT — Solar Data Atlas

> **Priorité immédiate : pousser et merger le commit `4fe244b` dans `main`, sinon le nettoyage de marque n'est pas complètement acté.**

---

## 1. Contexte du projet

- **Type** : site statique bilingue FR/EN, sans framework ni build step (HTML + Tailwind CDN + JS vanilla)
- **Domaine** : [www.solardataatlas.com](https://www.solardataatlas.com)
- **Repo GitHub** : `bernardpugnet/solarmetrics`
- **Branche principale** : `main`
- **Hébergement** : Netlify (déploiement automatique sur push `main`)
- **Ancien nom** : SolarMetrics (migration de marque en cours)
- **Ancien domaine** : `solarmetrics.netlify.app` (redirigé 301 vers `solardataatlas.com`)

---

## 2. Travaux réalisés le 19 mars 2026

### 2.1 Diagnostic SEO en production

- `/` redirige correctement en 301 vers `/fr/` (via `netlify.toml`)
- Constat d'une **non-parité FR/EN** : la home FR manquait deux sections présentes sur la home EN (Actualités & Veille Marché, Chiffres Clés du Solaire)
- Google Search Console vérifiée : sitemap soumis et lu (88 pages découvertes), **1 seule page indexée** (`/fr/`), 86 pages en statut "Détectée, actuellement non indexée"
- Aucun blocage technique identifié (robots.txt OK, sitemap OK, canonicals OK)

### 2.2 Rétablissement de la parité FR/EN

- Ajout dans `/fr/index.html` de deux sections traduites depuis `/en/index.html` :
  - **Actualités & Veille Marché** — 3 articles (PPE3, LCOE, capacité UE)
  - **Chiffres Clés du Solaire** — 4 cartes (France 31 GW, Monde 2,2 TW, 45 000 emplois, LCOE 45 €/MWh)
- Insertion entre le Dashboard et le Data Hub

### 2.3 Nettoyage de marque SolarMetrics → Solar Data Atlas

- Audit complet du repo : toutes les occurrences de "SolarMetrics" / "solarmetrics" identifiées
- 7 fichiers publics corrigés, 21 remplacements au total
- Seule occurrence conservée volontairement : redirection 301 dans `netlify.toml` (nécessaire)

---

## 3. Corrections déjà faites

### Commit `4eeab8b` — Parité FR/EN ✅ mergé dans `main` (PR #17)

- `fr/index.html` : +86 lignes (sections Actualités + Chiffres Clés)

### Commit `4fe244b` — Nettoyage de marque ⚠️ à merger dans `main`

| Fichier | Occurrences corrigées |
|---------|-----------------------|
| `schema-plug-and-play.svg` (racine) | 1 — copyright footer |
| `images/schema-plug-and-play.svg` | 1 — copyright footer |
| `mockup-menu.html` | 7 — titre, logos, footer |
| `mockup-corporate.html` | 3 — titre, logo, footer |
| `mockup-energy.html` | 3 — titre, logo, footer |
| `mockup-techdata.html` | 3 — titre, logo, footer |
| `icons/generate.html` | 3 — titre, h1, texte |

---

## 4. État actuel vérifié

| Point de vérification | Résultat |
|----------------------|----------|
| `/` | Redirige 301 vers `/fr/` ✅ |
| `/fr/` → title | `Solar Data Atlas \| Données & Benchmarks du Solaire Européen` ✅ |
| `/en/` → title | `Solar Data & Benchmarks Europe \| Solar Data Atlas` ✅ |
| og:site_name | `Solar Data Atlas` (FR et EN) ✅ |
| og:title | Cohérent FR et EN ✅ |
| meta description | Correcte, sans mention SolarMetrics ✅ |
| manifest.json | `name: Solar Data Atlas`, `short_name: Solar Data Atlas` ✅ |
| sw.js | Cache nommé `solardataatlas-v2026-03f` ✅ |
| sitemap.xml | 88 URLs, toutes en `solardataatlas.com` ✅ |
| Canonicals | `solardataatlas.com` partout ✅ |
| Hreflang | FR/EN/x-default corrects ✅ |
| JSON-LD | `"name": "Solar Data Atlas"` ✅ |
| Fichiers publics | **0 occurrence de "SolarMetrics"** ✅ |

---

## 5. Limites actuelles

- **Indexation Google très faible** : 1 page indexée sur 91 connues
- **86 pages** en statut "Détectée, actuellement non indexée" — Google les connaît (via sitemap) mais ne les a pas encore crawlées
- **2 pages** en "Explorée, actuellement non indexée" — crawlées mais pas jugées suffisamment pertinentes pour l'instant
- **2 pages** en "Page avec redirection" — comportement normal (`/` → `/fr/`, ancien domaine Netlify)
- **Cause** : site trop récent (première indexation 12 mars 2026), absence quasi totale de backlinks externes
- **Aucun blocage technique** : robots.txt, sitemap, HTTPS, meta tags tous conformes

---

## 6. Ce qu'il reste à faire

### Immédiat

- [ ] Pusher et merger `4fe244b` (nettoyage de marque) dans `main`

### Court terme

- [ ] Attendre le recrawl progressif de Google (pas d'action technique possible)
- [ ] Obtenir des backlinks : profil LinkedIn, posts LinkedIn, mentions sur des sites du secteur solaire

### Optionnel / plus tard

- [ ] Nettoyer les fichiers `.md` internes qui mentionnent encore "SolarMetrics" (README, briefs, roadmap, etc.) — aucun impact SEO ni visiteur
- [ ] Incrémenter la version du cache Service Worker (`v2026-03f` → `v2026-03g`) après un déploiement majeur — pas urgent tant que le trafic est faible

---

## 7. Prochaine étape projet

1. **Corriger la promesse de la home** avec un minimum de changements (alignement du message principal)
2. **Travailler les posts LinkedIn** pour générer du trafic qualifié et des backlinks naturels
3. **Suivre l'indexation** dans Google Search Console (objectif : passer de 1 à 10+ pages indexées)

---

## Résumé exécutif

Le site www.solardataatlas.com est fonctionnel, bien structuré techniquement et cohérent côté SEO. La parité de contenu FR/EN a été rétablie (sections Actualités et Chiffres Clés ajoutées en FR). L'ancien branding "SolarMetrics" a été éliminé de tous les fichiers publics. Le principal frein actuel est l'indexation Google : sur 88 pages connues, seule `/fr/` est indexée, les 86 autres sont en file d'attente de crawl. Il n'y a pas de blocage technique — c'est un problème de notoriété et de fraîcheur du site. Les prochaines actions prioritaires sont : merger le dernier commit de nettoyage, puis concentrer les efforts sur la génération de backlinks via LinkedIn.
