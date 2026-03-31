#!/usr/bin/env node
/**
 * build-data.mjs — Génère js/solar-data.js depuis data/volatile.json + data/reference.json
 *
 * Lot 0 : le script lit solar-data.js existant, remplace les valeurs numériques
 * depuis les JSON, et écrit le résultat. Si les JSON contiennent les mêmes valeurs
 * que le fichier actuel, la sortie est identique (test de non-régression).
 *
 * Usage : node scripts/build-data.mjs [--dry-run]
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// --- Load sources ---
const volatile = JSON.parse(readFileSync(resolve(ROOT, 'data/volatile.json'), 'utf8'));
const reference = JSON.parse(readFileSync(resolve(ROOT, 'data/reference.json'), 'utf8'));
const solarDataPath = resolve(ROOT, 'js/solar-data.js');
const original = readFileSync(solarDataPath, 'utf8');

let output = original;
let changes = 0;
let unchanged = 0;
let errors = [];

// --- Helper: extract a value from a nested JSON object given a dot path ---
function getJsonValue(obj, path) {
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return cur;
}

// --- Helper: get the display value from a JSON entry ---
function numericValue(entry) {
  if (entry == null) return undefined;
  if (typeof entry === 'number') return entry;
  if (typeof entry === 'object' && 'value' in entry) return entry.value;
  return undefined;
}

function rangeValue(entry, field) {
  if (entry == null || typeof entry !== 'object') return undefined;
  return entry[field];
}

// --- Mapping: JS property → JSON source ---
// Each mapping defines how to find and replace a value in solar-data.js
// format: { country, jsField, jsonSource, jsonPath, [field] }

const COUNTRIES = ['FR','DE','ES','IT','NL','BE','PT','PL','AT','GR','US','CA','GB'];

const mappings = [];

for (const cc of COUNTRIES) {
  // electricityPrice
  mappings.push({
    pattern: new RegExp(`(${cc}:[\\s\\S]*?electricityPrice:\\s*)([\\d.]+)`),
    jsonPath: `electricity.retail.${cc}`,
    source: volatile,
    extract: numericValue
  });

  // feedInTariff
  const fitKey = cc === 'FR' ? 'surplus_9kwc' :
                 cc === 'DE' ? 'eeg_10kwp' :
                 cc === 'ES' ? 'simplified_compensation' :
                 cc === 'IT' ? 'ritiro_dedicato' :
                 cc === 'NL' ? 'saldering_estimate' :
                 cc === 'BE' ? 'flanders_wholesale' :
                 cc === 'PT' ? 'upac' :
                 cc === 'PL' ? 'net_billing' :
                 cc === 'AT' ? 'oemag_10kwp' :
                 cc === 'GR' ? 'net_billing' :
                 cc === 'US' ? 'federal' :
                 cc === 'CA' ? 'federal' :
                 cc === 'GB' ? 'seg_avg' : null;

  if (fitKey) {
    mappings.push({
      pattern: new RegExp(`(${cc}:[\\s\\S]*?feedInTariff:\\s*)([\\d.]+)`),
      jsonPath: `feedin.${cc}.${fitKey}`,
      source: volatile,
      extract: numericValue
    });
  }

  // co2Factor
  mappings.push({
    pattern: new RegExp(`(${cc}:[\\s\\S]*?co2Factor:\\s*)([\\d.]+)`),
    jsonPath: `co2_factor.${cc}`,
    source: reference,
    extract: numericValue
  });

  // batteryCostPerKwh
  mappings.push({
    pattern: new RegExp(`(${cc}:[\\s\\S]*?batteryCostPerKwh:\\s*)([\\d.]+)`),
    jsonPath: `battery_cost.residential_installed.${cc}`,
    source: volatile,
    extract: numericValue
  });

  // installCostPerKwc — min, max, avg
  for (const field of ['min', 'max']) {
    mappings.push({
      pattern: new RegExp(`(${cc}:[\\s\\S]*?installCostPerKwc:\\s*\\{[^}]*?${field}:\\s*)([\\d.]+)`),
      jsonPath: `capex.residential.${cc}`,
      source: volatile,
      extract: (entry) => rangeValue(entry, field)
    });
  }
  // avg — read explicitly from JSON (not calculated)
  mappings.push({
    pattern: new RegExp(`(${cc}:[\\s\\S]*?installCostPerKwc:\\s*\\{[^}]*?avg:\\s*)([\\d.]+)`),
    jsonPath: `capex.residential.${cc}`,
    source: volatile,
    extract: (entry) => rangeValue(entry, 'avg')
  });
}

// --- Panel specs ---
mappings.push({
  pattern: /(standard:\s*\{\s*efficiency:\s*)([0-9.]+)/,
  jsonPath: 'panel_specs.standard.efficiency',
  source: reference,
  extract: numericValue
});
mappings.push({
  pattern: /(standard:\s*\{[^}]*?m2PerKwc:\s*)([0-9.]+)/,
  jsonPath: 'panel_specs.standard.m2_per_kwc',
  source: reference,
  extract: numericValue
});
mappings.push({
  pattern: /(premium:\s*\{\s*efficiency:\s*)([0-9.]+)/,
  jsonPath: 'panel_specs.premium.efficiency',
  source: reference,
  extract: numericValue
});
mappings.push({
  pattern: /(premium:\s*\{[^}]*?m2PerKwc:\s*)([0-9.]+)/,
  jsonPath: 'panel_specs.premium.m2_per_kwc',
  source: reference,
  extract: numericValue
});

// --- Defaults ---
const defaultMappings = [
  ['coverageFactor', 'system_defaults.coverage_factor'],
  ['selfConsumptionDefault', 'system_defaults.self_consumption_default'],
  ['selfConsumptionWithBattery', 'system_defaults.self_consumption_with_battery'],
  ['batteryBoost', 'system_defaults.battery_boost'],
  ['pvDegradation', 'system_defaults.pv_degradation'],
  ['electricityPriceIncrease', 'system_defaults.electricity_price_increase'],
  ['discountRate', 'system_defaults.discount_rate'],
  ['systemLifetime', 'system_defaults.system_lifetime']
];

for (const [jsKey, jsonKey] of defaultMappings) {
  mappings.push({
    pattern: new RegExp(`(${jsKey}:\\s*)([\\d.]+)`),
    jsonPath: jsonKey,
    source: reference,
    extract: numericValue
  });
}

// --- Apply all mappings ---
const dryRun = process.argv.includes('--dry-run');
const report = [];

for (const m of mappings) {
  const entry = getJsonValue(m.source, m.jsonPath);
  const newVal = m.extract(entry);

  if (newVal === undefined) {
    errors.push(`MISSING: ${m.jsonPath} not found in JSON`);
    continue;
  }

  const match = output.match(m.pattern);
  if (!match) {
    // Pattern not found in JS — may be a country without this field (e.g. no avg)
    continue;
  }

  const oldVal = parseFloat(match[2]);
  if (oldVal === newVal) {
    unchanged++;
  } else {
    report.push(`CHANGED: ${m.jsonPath}: ${oldVal} → ${newVal}`);
    output = output.replace(m.pattern, `$1${newVal}`);
    changes++;
  }
}

// --- Report ---
console.log('=== build-data.mjs ===');
console.log(`Mappings traités : ${mappings.length}`);
console.log(`Valeurs identiques : ${unchanged}`);
console.log(`Valeurs modifiées : ${changes}`);
if (errors.length) {
  console.log(`\nERREURS (${errors.length}) :`);
  errors.forEach(e => console.log(`  ❌ ${e}`));
}
if (report.length) {
  console.log(`\nMODIFICATIONS :`);
  report.forEach(r => console.log(`  📝 ${r}`));
}

// --- Compare ---
if (output === original) {
  console.log('\n✅ solar-data.js identique à l\'actuel (non-régression OK)');
} else if (changes === 0 && errors.length === 0) {
  console.log('\n✅ Aucune modification nécessaire');
} else {
  console.log(`\n⚠️  ${changes} valeur(s) modifiée(s) dans solar-data.js`);
}

// --- Write ---
if (!dryRun && output !== original) {
  writeFileSync(solarDataPath, output, 'utf8');
  console.log('💾 solar-data.js mis à jour');
} else if (dryRun && output !== original) {
  console.log('🔍 Mode dry-run : aucune écriture');
  // Write to temp for diff
  const tmpPath = resolve(ROOT, 'js/solar-data.generated.tmp.js');
  writeFileSync(tmpPath, output, 'utf8');
  console.log(`   Fichier temporaire : ${tmpPath}`);
  console.log('   Pour comparer : diff js/solar-data.js js/solar-data.generated.tmp.js');
}

// Exit code
if (errors.length > 0) process.exit(1);
process.exit(0);
