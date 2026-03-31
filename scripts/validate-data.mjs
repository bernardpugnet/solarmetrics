#!/usr/bin/env node
/**
 * validate-data.mjs — Contrôles d'intégrité des fichiers JSON source
 *
 * Usage :
 *   node scripts/validate-data.mjs          → validation des JSON
 *   node scripts/validate-data.mjs --stale  → détecte les données > 6 mois
 *
 * Exit code 0 = OK, 1 = erreurs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

let errors = 0;
let warnings = 0;

function error(msg) { console.log(`  ❌ ${msg}`); errors++; }
function warn(msg) { console.log(`  ⚠️  ${msg}`); warnings++; }
function ok(msg) { console.log(`  ✅ ${msg}`); }

// --- Load files ---
console.log('=== validate-data.mjs ===\n');

let volatile, reference;
try {
  volatile = JSON.parse(readFileSync(resolve(ROOT, 'data/volatile.json'), 'utf8'));
  ok('data/volatile.json : JSON valide');
} catch (e) {
  error(`data/volatile.json : JSON invalide — ${e.message}`);
  process.exit(1);
}

try {
  reference = JSON.parse(readFileSync(resolve(ROOT, 'data/reference.json'), 'utf8'));
  ok('data/reference.json : JSON valide');
} catch (e) {
  error(`data/reference.json : JSON invalide — ${e.message}`);
  process.exit(1);
}

// --- Schema validation ---
console.log('\n--- Validation du schéma ---');

function validateLeaf(obj, path) {
  if (obj === null || obj === undefined) {
    error(`${path} : valeur null/undefined`);
    return;
  }
  // Skip _meta, _type markers, and arrays
  if (path.endsWith('._meta') || path.endsWith('._type')) return;
  if (Array.isArray(obj)) return;

  // If it's a leaf with value/min/max, check schema
  if (typeof obj === 'object' && ('value' in obj || 'min' in obj)) {
    // Forme A (value) or Forme B (min/max)
    if ('value' in obj && 'min' in obj) {
      error(`${path} : contient à la fois 'value' et 'min' — choisir l'un ou l'autre`);
    }
    if ('min' in obj && !('max' in obj)) {
      error(`${path} : 'min' sans 'max'`);
    }
    if ('max' in obj && !('min' in obj)) {
      error(`${path} : 'max' sans 'min'`);
    }
    if (!('unit' in obj) && !path.includes('coefficients')) {
      warn(`${path} : pas de champ 'unit'`);
    }
    if (!('as_of' in obj) && !path.includes('system_defaults') && !path.includes('coefficients')) {
      warn(`${path} : pas de champ 'as_of'`);
    }
    // Validate as_of format
    if ('as_of' in obj) {
      const asOf = obj.as_of;
      const validFormats = [
        /^\d{4}$/,           // YYYY
        /^\d{4}-H[12]$/,    // YYYY-H1/H2
        /^\d{4}-Q[1-4]$/,   // YYYY-Q1..Q4
        /^\d{4}-\d{2}$/,    // YYYY-MM
        /^\d{4}-\d{2}-\d{2}$/ // YYYY-MM-DD
      ];
      if (!validFormats.some(f => f.test(asOf))) {
        error(`${path}.as_of : format invalide "${asOf}" — attendu YYYY, YYYY-H1, YYYY-Q1, YYYY-MM ou YYYY-MM-DD`);
      }
    }
    return;
  }

  // If it's an object with _type=coefficients, skip deep validation
  if (typeof obj === 'object' && obj._type === 'coefficients') return;

  // Recurse into sub-objects
  if (typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (key.startsWith('_')) continue;
      validateLeaf(obj[key], `${path}.${key}`);
    }
  }
}

for (const key of Object.keys(volatile)) {
  if (key === '_meta') continue;
  validateLeaf(volatile[key], `volatile.${key}`);
}

for (const key of Object.keys(reference)) {
  if (key === '_meta') continue;
  validateLeaf(reference[key], `reference.${key}`);
}

// --- Stale data check ---
if (process.argv.includes('--stale')) {
  console.log('\n--- Données potentiellement périmées (> 6 mois) ---');

  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  function parseAsOf(asOf) {
    if (!asOf) return null;
    // YYYY → end of year
    if (/^\d{4}$/.test(asOf)) return new Date(parseInt(asOf), 11, 31);
    // YYYY-H1 → June 30, YYYY-H2 → Dec 31
    const hMatch = asOf.match(/^(\d{4})-H([12])$/);
    if (hMatch) return new Date(parseInt(hMatch[1]), hMatch[2] === '1' ? 5 : 11, 30);
    // YYYY-Q1..Q4
    const qMatch = asOf.match(/^(\d{4})-Q([1-4])$/);
    if (qMatch) {
      const endMonth = parseInt(qMatch[2]) * 3 - 1;
      return new Date(parseInt(qMatch[1]), endMonth, 28);
    }
    // YYYY-MM
    const mMatch = asOf.match(/^(\d{4})-(\d{2})$/);
    if (mMatch) return new Date(parseInt(mMatch[1]), parseInt(mMatch[2]) - 1, 28);
    // YYYY-MM-DD
    const dMatch = asOf.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dMatch) return new Date(parseInt(dMatch[1]), parseInt(dMatch[2]) - 1, parseInt(dMatch[3]));
    return null;
  }

  function checkStale(obj, path) {
    if (obj === null || typeof obj !== 'object') return;
    if (Array.isArray(obj)) return;
    if ('as_of' in obj) {
      const d = parseAsOf(obj.as_of);
      if (d && d < sixMonthsAgo) {
        warn(`${path} : as_of="${obj.as_of}" — donnée de plus de 6 mois`);
      }
    }
    for (const key of Object.keys(obj)) {
      if (key.startsWith('_')) continue;
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        checkStale(obj[key], `${path}.${key}`);
      }
    }
  }

  checkStale(volatile, 'volatile');
  checkStale(reference, 'reference');
}

// --- Summary ---
console.log('\n--- Résumé ---');
if (errors === 0 && warnings === 0) {
  console.log('✅ Tout est OK');
} else {
  if (errors > 0) console.log(`❌ ${errors} erreur(s)`);
  if (warnings > 0) console.log(`⚠️  ${warnings} avertissement(s)`);
}

process.exit(errors > 0 ? 1 : 0);
