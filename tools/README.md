# Mise à jour des données — Mode d'emploi

## Usage

1. Modifie `data/volatile.json` avec les nouvelles valeurs
2. Double-clique sur `tools/update-data.command`
3. Vérifie le diff dans GitHub Desktop
4. Commit + Push

## Fichiers

| Fichier | Rôle |
|---------|------|
| `data/volatile.json` | Source unique — données trimestrielles (prix, tarifs, CAPEX, batteries) |
| `data/reference.json` | Source unique — données stables (CO₂, specs, coefficients, config API) |
| `scripts/build-data.mjs` | Génère `js/solar-data.js` depuis les JSON |
| `scripts/validate-data.mjs` | Contrôle le format et la cohérence des JSON |
| `tools/update-data.command` | Bouton Mac — lance validation + build + diff |

## Vérification manuelle

```bash
# Valider les JSON
node scripts/validate-data.mjs

# Détecter les données > 6 mois
node scripts/validate-data.mjs --stale

# Générer sans écrire (dry-run)
node scripts/build-data.mjs --dry-run

# Appliquer
node scripts/build-data.mjs
```
