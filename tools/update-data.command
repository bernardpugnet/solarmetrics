#!/bin/bash
# =============================================================
# Solar Data Atlas — Mise à jour des données
# Double-cliquer sur ce fichier pour lancer la mise à jour
# =============================================================

cd "$(dirname "$0")/.."

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   SOLAR DATA ATLAS — Mise à jour données    ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Dossier : $(pwd)"
echo "Date    : $(date '+%Y-%m-%d %H:%M')"
echo ""

# Vérifier que Node.js est disponible
if ! command -v node &> /dev/null; then
  echo "❌ Node.js n'est pas installé ou pas dans le PATH."
  echo "   Installe Node.js depuis https://nodejs.org/"
  echo ""
  read -p "Appuie sur Entrée pour fermer."
  exit 1
fi

echo "Node.js : $(node --version)"
echo ""

# ── Étape 1 : Validation des JSON source ──
echo "① Validation des JSON source..."
echo ""
node scripts/validate-data.mjs
VALIDATE_EXIT=$?
echo ""

if [ $VALIDATE_EXIT -ne 0 ]; then
  echo "❌ Des erreurs ont été détectées dans les fichiers JSON."
  echo "   Corrige les erreurs ci-dessus avant de relancer."
  echo ""
  read -p "Appuie sur Entrée pour fermer."
  exit 1
fi

# ── Étape 2 : Génération de solar-data.js ──
echo "② Génération de solar-data.js depuis les JSON..."
echo ""
node scripts/build-data.mjs --dry-run
BUILD_EXIT=$?
echo ""

if [ $BUILD_EXIT -ne 0 ]; then
  echo "❌ Erreur lors de la génération."
  echo ""
  read -p "Appuie sur Entrée pour fermer."
  exit 1
fi

# ── Étape 3 : Demander confirmation avant d'écrire ──
echo "─────────────────────────────────────────────"
echo ""
read -p "Appliquer les modifications à solar-data.js ? (o/n) " confirm
echo ""

if [ "$confirm" = "o" ] || [ "$confirm" = "O" ] || [ "$confirm" = "oui" ]; then
  node scripts/build-data.mjs
  echo ""
  echo "③ Diff des fichiers modifiés :"
  echo ""
  git diff --stat
  echo ""
  git diff js/solar-data.js
  echo ""
  echo "✅ Terminé."
  echo ""
  echo "Prochaines étapes :"
  echo "  1. Ouvre GitHub Desktop"
  echo "  2. Vérifie le diff"
  echo "  3. Commit si tout est correct"
  echo "  4. Push → Netlify déploie automatiquement"
else
  echo "❎ Annulé. Aucun fichier modifié."
  # Nettoyer le fichier temporaire si présent
  rm -f js/solar-data.generated.tmp.js
fi

echo ""
read -p "Appuie sur Entrée pour fermer."
