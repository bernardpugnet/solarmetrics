/**
 * autoconsommation.js — Solar Data Atlas Advanced Self-Consumption Simulator
 *
 * This module contains:
 *   1. Consumption profiles (4 realistic residential profiles, normalized)
 *   2. Battery simulation (LFP with efficiency, DoD, max power)
 *   3. Self-consumption algorithm (hourly, 8760 iterations)
 *   4. Result aggregation (monthly, daily averages, annual totals)
 *
 * All calculations run client-side in the browser.
 * PVGIS hourly data is fetched via Netlify Function (pvgis.js?mode=hourly).
 *
 * References
 *   - Consumption profiles: based on RTE/Enedis typical residential curves (France)
 *   - Battery specs: LFP typical (BYD, Tesla Powerwall, Huawei Luna)
 *   - PVGIS: EU JRC, seriescalc endpoint, local time, 2023 TMY
 */

// ═══════════════════════════════════════════════════
// 1. CONSUMPTION PROFILES
// ═══════════════════════════════════════════════════

/**
 * Hourly shape factors for each profile (24 values, one per hour of day).
 * These represent RELATIVE consumption — not absolute kWh.
 * Higher value = more consumption at that hour.
 *
 * Sources: RTE "Bilan électrique" curves, Enedis "Profil type résidentiel",
 *          ADEME studies on residential consumption patterns.
 */
const PROFILES = {
  // ─── Famille 4 personnes (standard) ───
  // Peaks: morning 7-9h (breakfast, getting ready), evening 18-22h (cooking, TV, lights)
  // Low: night 0-6h (standby only)
  family: {
    label: { fr: "Faible présence en journée", en: "Low daytime presence" },
    hourly: [
      0.25, 0.20, 0.18, 0.18, 0.20, 0.30,  // 00-05: night (fridge, standby)
      0.55, 1.40, 1.50, 0.80, 0.65, 0.60,  // 06-11: morning peak then drop
      0.70, 0.65, 0.55, 0.55, 0.70, 1.10,  // 12-17: afternoon, ramp-up
      1.60, 1.90, 1.85, 1.60, 1.10, 0.55   // 18-23: evening peak
    ],
    // Monthly seasonal factors (Jan=index 0, Dec=index 11)
    // Winter: higher (heating auxiliaries, lighting, shorter days)
    // Summer: lower (less lighting, no heating)
    seasonal: [1.35, 1.25, 1.10, 0.95, 0.80, 0.70, 0.65, 0.70, 0.85, 1.00, 1.20, 1.35]
  },

  // ─── Couple retraités (présence journée) ───
  // More spread out consumption during the day (home all day)
  // Smaller peaks, more continuous baseline
  retired: {
    label: { fr: "Présence moyenne en journée", en: "Moderate daytime presence" },
    hourly: [
      0.25, 0.20, 0.18, 0.18, 0.20, 0.25,  // 00-05: night
      0.45, 0.90, 1.10, 1.00, 0.90, 0.85,  // 06-11: gradual morning
      0.95, 0.80, 0.70, 0.65, 0.70, 0.90,  // 12-17: lunch peak, afternoon
      1.20, 1.40, 1.35, 1.20, 0.80, 0.40   // 18-23: moderate evening
    ],
    seasonal: [1.30, 1.20, 1.10, 0.95, 0.80, 0.72, 0.68, 0.72, 0.85, 1.00, 1.18, 1.30]
  },

  // ─── Télétravail (bureau à domicile) ───
  // Sustained consumption 9-18h (PC, screens, heating/AC office room)
  // Morning peak earlier (start work), evening still high
  telecommute: {
    label: { fr: "Forte présence en journée", en: "High daytime presence" },
    hourly: [
      0.25, 0.20, 0.18, 0.18, 0.20, 0.30,  // 00-05: night
      0.55, 1.20, 1.40, 1.30, 1.25, 1.15,  // 06-11: start work + office load
      1.10, 1.15, 1.20, 1.15, 1.10, 1.20,  // 12-17: sustained work + lunch
      1.55, 1.70, 1.60, 1.40, 1.00, 0.50   // 18-23: evening (work done + leisure)
    ],
    seasonal: [1.30, 1.22, 1.08, 0.92, 0.78, 0.70, 0.68, 0.72, 0.85, 1.02, 1.20, 1.32]
  },

  // ─── Tout-électrique (chauffage PAC + ECS) ───
  // Much higher winter consumption (×2-3 vs summer)
  // Hot water peaks: 6-7h and 22-23h (programmable water heater)
  // Heating adds continuous winter load
  allElectric: {
    label: { fr: "Tout-électrique / pompe à chaleur", en: "All-electric / heat pump" },
    hourly: [
      0.35, 0.30, 0.28, 0.28, 0.30, 0.45,  // 00-05: night + heating baseload
      1.00, 1.45, 1.40, 0.85, 0.70, 0.65,  // 06-11: ECS morning + heating
      0.75, 0.70, 0.60, 0.60, 0.75, 1.15,  // 12-17: afternoon
      1.65, 1.85, 1.80, 1.55, 1.30, 0.65   // 18-23: evening peak + ECS night
    ],
    // Much stronger seasonal variation (heat pump in winter)
    seasonal: [1.80, 1.65, 1.35, 0.90, 0.60, 0.45, 0.40, 0.45, 0.65, 1.00, 1.50, 1.80]
  }
};

/**
 * Additional consumption profiles for specific equipment.
 * These add EXTRA kWh/year on top of the base profile.
 * Hourly shapes represent WHEN the equipment typically consumes.
 * Annual consumption is fixed per equipment type.
 *
 * Sources:
 *   - EV: RTE "Enjeux du développement de l'électromobilité" 2024,
 *     ~2,500 kWh/year for 15,000 km (0.167 kWh/km), charging mostly evening/night
 *   - PAC (heat pump): ADEME, ~4,000 kWh/year for a well-insulated house,
 *     seasonal (mostly winter), runs during day when outdoor temp is higher
 *   - ECS (hot water): ADEME, ~1,500 kWh/year thermodynamic water heater,
 *     programmable → can be shifted to solar hours (midday)
 */
const ADDITIONAL_PROFILES = {
  ev: {
    label: { fr: "Véhicule électrique", en: "Electric vehicle" },
    annualKwh: 2500, // ~15 000 km/an, 0.167 kWh/km
    // Charging mostly 18h-06h (evening/night, home charger)
    // Smart charging variant could shift to 11h-15h (solar)
    hourly: [
      0.80, 0.80, 0.70, 0.60, 0.50, 0.40,  // 00-05: overnight charge taper
      0.20, 0.10, 0.05, 0.05, 0.05, 0.10,  // 06-11: car at work/out
      0.10, 0.10, 0.10, 0.15, 0.20, 0.40,  // 12-17: returning home
      1.00, 1.50, 1.60, 1.50, 1.30, 1.00   // 18-23: evening charge peak
    ],
    // Seasonal: slight increase in winter (heating, range loss ~15%)
    seasonal: [1.15, 1.10, 1.05, 0.95, 0.90, 0.85, 0.85, 0.85, 0.90, 1.00, 1.10, 1.15]
  },
  pac: {
    label: { fr: "Pompe à chaleur", en: "Heat pump" },
    annualKwh: 4000, // well-insulated house, COP ~3
    // Runs mostly during day (better COP with higher outdoor temp)
    // Peak in morning (warm-up) and evening (comfort)
    hourly: [
      0.30, 0.25, 0.20, 0.20, 0.25, 0.40,  // 00-05: night setback
      0.80, 1.20, 1.10, 0.90, 0.80, 0.70,  // 06-11: morning warm-up peak
      0.60, 0.55, 0.55, 0.60, 0.70, 0.90,  // 12-17: midday maintenance
      1.10, 1.20, 1.10, 0.90, 0.60, 0.40   // 18-23: evening comfort
    ],
    // Very seasonal: almost nothing in summer, heavy in winter
    seasonal: [2.00, 1.80, 1.40, 0.70, 0.20, 0.05, 0.00, 0.00, 0.15, 0.60, 1.30, 1.90]
  },
  ecs: {
    label: { fr: "Chauffe-eau thermodynamique", en: "Heat pump water heater" },
    annualKwh: 1500, // ADEME typical
    // Programmable — default: midday (solar-optimized) + evening top-up
    hourly: [
      0.10, 0.10, 0.10, 0.10, 0.10, 0.15,  // 00-05: standby
      0.30, 0.50, 0.40, 0.30, 0.60, 1.20,  // 06-11: morning use + solar ramp
      1.60, 1.50, 1.30, 1.00, 0.60, 0.50,  // 12-17: solar hours heating (programmé)
      0.80, 1.00, 0.90, 0.60, 0.30, 0.15   // 18-23: evening top-up
    ],
    // Mild seasonality (hot water usage year-round, slightly more in winter)
    seasonal: [1.15, 1.10, 1.05, 0.95, 0.90, 0.85, 0.85, 0.85, 0.90, 1.00, 1.10, 1.15]
  }
};

/**
 * Weekend hourly shape modifiers per profile.
 * Applied on Saturday and Sunday to shift consumption patterns:
 *   - Morning peak later (sleep in), more midday consumption (home activities)
 *   - Less sharp morning peak, slightly higher daytime baseline
 *
 * GPT review suggestion: even without full Enedis dataset, a simple weekend
 * factor improves credibility and changes autoconsommation by 2-4 points.
 */
const WEEKEND_MODIFIERS = {
  // Family: later wake-up, more cooking midday, kids at home
  family: [
    0.25, 0.20, 0.18, 0.18, 0.20, 0.25,  // 00-05: same night
    0.30, 0.70, 1.00, 1.20, 1.10, 1.00,   // 06-11: delayed & softer morning
    1.10, 0.95, 0.80, 0.75, 0.85, 1.15,   // 12-17: more midday activity
    1.55, 1.80, 1.75, 1.55, 1.10, 0.55    // 18-23: similar evening
  ],
  // Retired: barely changes (always home)
  retired: null,  // null = use weekday profile (minimal difference for retirees)
  // Telecommute: no work on weekend, more leisure pattern
  telecommute: [
    0.25, 0.20, 0.18, 0.18, 0.20, 0.25,  // 00-05: same night
    0.35, 0.75, 1.05, 1.15, 1.05, 0.90,   // 06-11: later start, no work
    0.95, 0.85, 0.75, 0.70, 0.80, 1.10,   // 12-17: leisure activities
    1.50, 1.75, 1.70, 1.50, 1.05, 0.50    // 18-23: similar evening
  ],
  // All-electric: similar but slightly more hot water & cooking midday
  allElectric: [
    0.35, 0.30, 0.28, 0.28, 0.30, 0.40,  // 00-05: same night
    0.60, 0.95, 1.15, 1.10, 0.95, 0.85,   // 06-11: delayed morning, ECS later
    1.00, 0.90, 0.75, 0.70, 0.80, 1.15,   // 12-17: more midday cooking
    1.60, 1.80, 1.75, 1.50, 1.25, 0.60    // 18-23: similar evening
  ]
};

/**
 * Generate a normalized 8760-hour consumption profile.
 *
 * CRITICAL: The sum of all 8760 values === annualKwh (exact).
 * This is achieved by:
 *   1. Computing raw hourly values = hourlyFactor[h] × seasonalFactor[month]
 *      with weekend modifier applied on Sat/Sun
 *   2. Summing all raw values
 *   3. Multiplying each by (annualKwh / rawSum) to normalize
 *
 * 2023 starts on a Sunday (Jan 1 = day 0 = Sunday).
 * Day of week: (dayOfYear) % 7 → 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
 *
 * @param {string} profileKey - One of: 'family', 'retired', 'telecommute', 'allElectric'
 * @param {number} annualKwh - Total annual consumption in kWh (e.g., 4500)
 * @param {Array<string>} [addons=[]] - Additional equipment keys: 'ev', 'pac', 'ecs'
 * @returns {Float64Array} - 8760 values in kWh (energy per hour)
 */
function generateConsumptionProfile(profileKey, annualKwh, addons) {
  const profile = PROFILES[profileKey];
  if (!profile) throw new Error(`Unknown profile: ${profileKey}`);

  const weekendProfile = WEEKEND_MODIFIERS[profileKey];
  const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // 2023, non-leap
  const hourly = new Float64Array(8760);

  // 2023-01-01 is a Sunday → dayOfYear 0 = Sunday
  // dayOfWeek: 0=Sun, 6=Sat → weekend if dayOfWeek === 0 || dayOfWeek === 6
  let idx = 0;
  let dayOfYear = 0;
  for (let m = 0; m < 12; m++) {
    const seasonFactor = profile.seasonal[m];
    for (let d = 0; d < daysPerMonth[m]; d++) {
      const dayOfWeek = dayOfYear % 7;  // 0=Sun, 1=Mon, ..., 6=Sat
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
      const hourlyShape = (isWeekend && weekendProfile) ? weekendProfile : profile.hourly;

      for (let h = 0; h < 24; h++) {
        hourly[idx] = hourlyShape[h] * seasonFactor;
        idx++;
      }
      dayOfYear++;
    }
  }

  // Step 2: Normalize base profile so sum === annualKwh
  let rawSum = 0;
  for (let i = 0; i < 8760; i++) rawSum += hourly[i];

  const normFactor = annualKwh / rawSum;
  for (let i = 0; i < 8760; i++) hourly[i] *= normFactor;

  // Step 3: Add equipment profiles (EV, PAC, ECS)
  if (addons && addons.length > 0) {
    for (const addonKey of addons) {
      const addon = ADDITIONAL_PROFILES[addonKey];
      if (!addon) continue;

      // Generate the addon's 8760 profile, normalized to addon.annualKwh
      const addonHourly = new Float64Array(8760);
      let addonIdx = 0;
      let addonDay = 0;
      let addonRawSum = 0;
      for (let m = 0; m < 12; m++) {
        const sFactor = addon.seasonal[m];
        for (let d = 0; d < daysPerMonth[m]; d++) {
          for (let h = 0; h < 24; h++) {
            addonHourly[addonIdx] = addon.hourly[h] * sFactor;
            addonRawSum += addonHourly[addonIdx];
            addonIdx++;
          }
          addonDay++;
        }
      }
      // Normalize addon to its annual kWh
      const addonNorm = addon.annualKwh / addonRawSum;
      for (let i = 0; i < 8760; i++) {
        hourly[i] += addonHourly[i] * addonNorm;
      }
    }
  }

  return hourly;
}


// ═══════════════════════════════════════════════════
// 2. BATTERY SIMULATION PARAMETERS
// ═══════════════════════════════════════════════════

/**
 * LFP battery default parameters.
 * Based on typical residential storage (Tesla Powerwall, BYD HVS, Huawei Luna).
 */
const BATTERY_DEFAULTS = {
  efficiencyCharge: 0.95,      // 95% round-trip charge efficiency
  efficiencyDischarge: 0.95,   // 95% round-trip discharge efficiency
  dodMax: 0.90,                // 90% depth of discharge (LFP standard)
  cRate: 0.5,                  // C/2 max charge/discharge rate
  selfDischargePerMonth: 0.001, // 0.1%/month self-discharge (Grok suggestion)
  initialSocPercent: 0.50      // Start at 50% SoC
};


// ═══════════════════════════════════════════════════
// 3. SELF-CONSUMPTION ALGORITHM
// ═══════════════════════════════════════════════════

/**
 * Run the hourly self-consumption simulation.
 *
 * @param {Array} pvHourly - Array of 8760 objects from PVGIS: { time, P, Gi, T }
 *                           P is in WATTS, we convert to kWh (÷1000 for 1h interval)
 * @param {Float64Array} consoHourly - 8760 consumption values in kWh
 * @param {object} batteryConfig - { capacityKwh, effCharge, effDischarge, dodMax, cRate, selfDischargePerMonth, initialSocPercent }
 * @param {number} shadingLoss - Shading loss factor 0-1 (e.g., 0.05 = 5% loss) — Grok suggestion
 * @returns {object} Detailed simulation results
 */
function simulateAutoconsommation(pvHourly, consoHourly, batteryConfig, shadingLoss = 0) {
  const n = pvHourly.length;
  if (n !== consoHourly.length) {
    throw new Error(`Array length mismatch: PV=${n}, Conso=${consoHourly.length}`);
  }

  const {
    capacityKwh = 0,
    effCharge = BATTERY_DEFAULTS.efficiencyCharge,
    effDischarge = BATTERY_DEFAULTS.efficiencyDischarge,
    dodMax = BATTERY_DEFAULTS.dodMax,
    cRate = BATTERY_DEFAULTS.cRate,
    selfDischargePerMonth = BATTERY_DEFAULTS.selfDischargePerMonth,
    initialSocPercent = BATTERY_DEFAULTS.initialSocPercent
  } = batteryConfig || {};

  const hasBattery = capacityKwh > 0;
  const socMin = capacityKwh * (1 - dodMax);        // Minimum SoC (DoD limit)
  const socMax = capacityKwh;                         // Maximum SoC
  const maxPower = capacityKwh * cRate;               // Max charge/discharge power (kW)
  // Self-discharge per hour: (1 - monthly_rate)^(1/730) ≈ 1 - rate/730
  const selfDischargePerHour = selfDischargePerMonth / 730;

  let soc = hasBattery ? capacityKwh * initialSocPercent : 0;

  // ─── Result accumulators ───
  let totalProduction = 0;
  let totalConsumption = 0;
  let totalAutoDirect = 0;       // Direct self-consumption (PV → load)
  let totalAutoBattery = 0;      // Battery-assisted self-consumption
  let totalInjection = 0;        // Surplus sent to grid
  let totalSoutirage = 0;        // Drawn from grid

  // Monthly aggregation (12 months)
  const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const monthlyProd = new Float64Array(12);
  const monthlyConso = new Float64Array(12);
  const monthlyAutoDirect = new Float64Array(12);
  const monthlyAutoBattery = new Float64Array(12);
  const monthlyInjection = new Float64Array(12);
  const monehlySoutirage = new Float64Array(12);

  // Hourly detail arrays (for daily charts)
  const hourlyProd = new Float64Array(n);
  const hourlySoc = new Float64Array(n);
  const hourlyAutoTotal = new Float64Array(n);

  // ─── Main simulation loop ───
  let hourIdx = 0;
  for (let m = 0; m < 12; m++) {
    for (let d = 0; d < daysPerMonth[m]; d++) {
      for (let h = 0; h < 24; h++) {
        // Production: P is in watts, ÷1000 = kWh for 1 hour, minus shading
        const prod = (pvHourly[hourIdx].P / 1000) * (1 - shadingLoss);
        const conso = consoHourly[hourIdx];

        // Step 1: Direct self-consumption
        const autoDirect = Math.min(prod, conso);

        // Step 2: Excess and deficit
        let excess = prod - autoDirect;
        let deficit = conso - autoDirect;

        let autoBattery = 0;
        let injection = excess;    // Default: all excess goes to grid
        let soutirage = deficit;   // Default: all deficit from grid

        if (hasBattery) {
          // Apply self-discharge
          soc *= (1 - selfDischargePerHour);

          // Step 3: Charge battery with excess
          if (excess > 0 && soc < socMax) {
            const chargeRoom = (socMax - soc) / effCharge;  // How much input needed to fill
            const charge = Math.min(excess, maxPower, chargeRoom);
            soc += charge * effCharge;
            injection = excess - charge;  // Remaining excess to grid
          }

          // Step 4: Discharge battery for deficit
          if (deficit > 0 && soc > socMin) {
            const available = soc - socMin;  // Energy available above DoD limit
            const discharge = Math.min(deficit / effDischarge, maxPower, available);
            soc -= discharge;
            autoBattery = discharge * effDischarge;
            soutirage = deficit - autoBattery;  // Remaining deficit from grid
          }

          // Strict SoC clamp (GPT safety fix)
          soc = Math.max(socMin, Math.min(socMax, soc));
        }

        // Step 5: Accumulate results
        totalProduction += prod;
        totalConsumption += conso;
        totalAutoDirect += autoDirect;
        totalAutoBattery += autoBattery;
        totalInjection += injection;
        totalSoutirage += soutirage;

        monthlyProd[m] += prod;
        monthlyConso[m] += conso;
        monthlyAutoDirect[m] += autoDirect;
        monthlyAutoBattery[m] += autoBattery;
        monthlyInjection[m] += injection;
        monehlySoutirage[m] += soutirage;

        hourlyProd[hourIdx] = prod;
        hourlySoc[hourIdx] = soc;
        hourlyAutoTotal[hourIdx] = autoDirect + autoBattery;

        hourIdx++;
      }
    }
  }

  // ─── Compute indicators ───
  // Taux d'autoconsommation = part de la PRODUCTION consommée sur place (auto / production)
  const tauxAutoconsommation = totalProduction > 0
    ? (totalAutoDirect + totalAutoBattery) / totalProduction * 100 : 0;
  // Taux de couverture solaire = part de la CONSOMMATION couverte par le solaire (auto / consommation)
  const tauxAutoproduction = totalConsumption > 0
    ? (totalAutoDirect + totalAutoBattery) / totalConsumption * 100 : 0;

  return {
    // Annual totals (kWh)
    annual: {
      production: Math.round(totalProduction),
      consumption: Math.round(totalConsumption),
      autoDirect: Math.round(totalAutoDirect),
      autoBattery: Math.round(totalAutoBattery),
      autoTotal: Math.round(totalAutoDirect + totalAutoBattery),
      injection: Math.round(totalInjection),
      soutirage: Math.round(totalSoutirage),
      tauxAutoconsommation: Math.round(tauxAutoconsommation * 10) / 10,  // 1 decimal
      tauxAutoproduction: Math.round(tauxAutoproduction * 10) / 10
    },

    // Monthly breakdown (12 values each, in kWh)
    monthly: {
      production: Array.from(monthlyProd).map(v => Math.round(v)),
      consumption: Array.from(monthlyConso).map(v => Math.round(v)),
      autoDirect: Array.from(monthlyAutoDirect).map(v => Math.round(v)),
      autoBattery: Array.from(monthlyAutoBattery).map(v => Math.round(v)),
      injection: Array.from(monthlyInjection).map(v => Math.round(v)),
      soutirage: Array.from(monehlySoutirage).map(v => Math.round(v))
    },

    // Hourly data (for daily type charts — we'll extract slices)
    hourly: {
      production: hourlyProd,
      soc: hourlySoc,
      autoTotal: hourlyAutoTotal,
      consumption: consoHourly
    }
  };
}


// ═══════════════════════════════════════════════════
// 4. DAILY AVERAGE HELPERS (for charts)
// ═══════════════════════════════════════════════════

/**
 * Compute average daily profile (24 values) from a slice of hourly data.
 * Used to generate "typical summer day" and "typical winter day" charts.
 *
 * @param {Float64Array|Array} hourlyData - Full 8760 array
 * @param {number} startDay - Day of year to start (0-indexed)
 * @param {number} numDays - Number of days to average
 * @returns {Array} 24 values (average kWh per hour)
 */
function averageDailyProfile(hourlyData, startDay, numDays) {
  const daily = new Float64Array(24);
  const startHour = startDay * 24;
  const endHour = Math.min(startHour + numDays * 24, hourlyData.length);
  const actualDays = (endHour - startHour) / 24;

  for (let h = startHour; h < endHour; h++) {
    daily[h % 24] += hourlyData[h];
  }

  return Array.from(daily).map(v => Math.round(v / actualDays * 100) / 100);
}

/**
 * Get typical day profiles for summer (June-July) and winter (Dec-Jan).
 */
function getTypicalDays(hourlyData) {
  // Summer: June 1 = day 151, July 31 = day 211 → 61 days
  const summer = averageDailyProfile(hourlyData, 151, 61);
  // Winter: Dec 1 = day 334, + Jan 1-31 = day 0-30
  // Since our data is Jan-Dec, we average Dec (day 334-364) and Jan (day 0-30)
  const decAvg = averageDailyProfile(hourlyData, 334, 31);
  const janAvg = averageDailyProfile(hourlyData, 0, 31);
  const winter = decAvg.map((v, i) => Math.round((v + janAvg[i]) / 2 * 100) / 100);
  return { summer, winter };
}


// ═══════════════════════════════════════════════════
// 5. MINI FINANCIAL MODULE (simple payback)
// ═══════════════════════════════════════════════════

/**
 * Simple financial calculation: annual savings + payback period.
 * Full VAN/TRI module will come in v1.1.
 *
 * NOTE (GPT review): This model calculates savings on the VARIABLE part of the
 * electricity bill only. The fixed subscription cost (abonnement/part fixe,
 * typically 100-200 €/year in France) is NOT reduced by self-consumption.
 * Users should be informed of this via a disclaimer in the UI.
 * An optional fixedCostPerYear parameter is included for transparency.
 *
 * @param {object} annual - Annual results from simulateAutoconsommation
 * @param {object} financialParams - { priceElecKwh, priceReventeKwh, costPv, costBattery, ... }
 * @returns {object} Financial summary
 */
function calculateFinancials(annual, financialParams) {
  const {
    priceElecKwh = 0.2516,        // €/kWh default (France S2 2025, Eurostat)
    priceReventeKwh = 0.04,       // €/kWh surplus resale (OA France ≤9 kWc, T1 2026)
    costPv = 0,                   // Total PV installation cost (€)
    costBattery = 0,              // Total battery cost (€)
    subsidies = 0,                // Subsidies deducted from investment (€)
    priceIncreasePerYear = 0.03,  // 3% annual electricity price increase
    degradationPv = 0.005,        // 0.5%/year panel degradation
    degradationBattery = 0.02,    // 2%/year battery degradation
    fixedCostPerYear = 0,         // Fixed electricity subscription cost (€/year, not reducible by PV)
    years = 25                    // Analysis period
  } = financialParams || {};

  const totalInvestment = costPv + costBattery - subsidies;

  // Year 1 savings (variable part only — fixed subscription is NOT affected)
  const savingsAutoYear1 = annual.autoTotal * priceElecKwh;
  const revenueInjectionYear1 = annual.injection * priceReventeKwh;
  const savingsYear1 = savingsAutoYear1 + revenueInjectionYear1;

  // Cash flow over N years
  const cashFlow = [];
  let cumulative = -totalInvestment;
  let paybackYear = null;

  for (let y = 1; y <= years; y++) {
    const pvFactor = Math.pow(1 - degradationPv, y - 1);
    const batteryFactor = annual.autoBattery > 0 ? Math.pow(1 - degradationBattery, y - 1) : 1;
    const priceFactor = Math.pow(1 + priceIncreasePerYear, y - 1);

    const autoDirectY = annual.autoDirect * pvFactor;
    const autoBatteryY = annual.autoBattery * pvFactor * batteryFactor;
    const injectionY = annual.injection * pvFactor;

    const savingsY =
      (autoDirectY + autoBatteryY) * priceElecKwh * priceFactor +
      injectionY * priceReventeKwh;

    cumulative += savingsY;

    cashFlow.push({
      year: y,
      savings: Math.round(savingsY),
      cumulative: Math.round(cumulative)
    });

    if (paybackYear === null && cumulative >= 0) {
      const prevCumulative = cumulative - savingsY;
      if (prevCumulative < 0 && savingsY > 0) {
        paybackYear = Math.round(((y - 1) + Math.abs(prevCumulative) / savingsY) * 10) / 10;
      } else {
        paybackYear = y;
      }
    }
  }

  return {
    totalInvestment: Math.round(totalInvestment),
    savingsYear1: Math.round(savingsYear1),
    paybackYear: paybackYear,
    totalSavings25y: cashFlow.length > 0 ? cashFlow[cashFlow.length - 1].cumulative : 0,
    cashFlow: cashFlow
  };
}


// ═══════════════════════════════════════════════════
// 6. PVGIS API HELPER
// ═══════════════════════════════════════════════════

/**
 * Fetch hourly PV data from PVGIS via Netlify Function.
 * Includes sessionStorage caching to avoid duplicate API calls.
 *
 * @param {object} params - { lat, lon, peakpower, loss, angle, aspect }
 * @returns {Promise<object>} PVGIS response with hourly array
 */
async function fetchPvgisHourly(params) {
  const { lat, lon, peakpower = 1, loss = 14, angle = 30, aspect = 0, mountingplace = 'free' } = params;

  // Cache key based on all parameters
  const cacheKey = `pvgis_hourly_${lat}_${lon}_${peakpower}_${loss}_${angle}_${aspect}_${mountingplace}`;

  // Check sessionStorage cache first
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.success && parsed.hourly) {
        console.log("PVGIS: using cached data");
        return parsed;
      }
    }
  } catch (e) {
    // sessionStorage not available or parse error — continue to fetch
  }

  // Build URL
  const url = `/.netlify/functions/pvgis?lat=${lat}&lon=${lon}`
    + `&peakpower=${peakpower}&loss=${loss}&angle=${angle}&aspect=${aspect}`
    + `&mountingplace=${mountingplace}&mode=hourly`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Network error" }));
    throw new Error(errorData.error || `PVGIS error: HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data.success || !data.hourly || data.hourly.length === 0) {
    throw new Error("PVGIS returned no hourly data");
  }

  // Validate array length (should be 8760 for non-leap year)
  if (data.hourly.length !== 8760) {
    console.warn(`PVGIS returned ${data.hourly.length} hours (expected 8760)`);
  }

  // Cache in sessionStorage (try, may fail if storage full)
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (e) {
    console.warn("Could not cache PVGIS data in sessionStorage");
  }

  return data;
}


// ═══════════════════════════════════════════════════
// EXPORTS (global scope for vanilla JS)
// ═══════════════════════════════════════════════════

window.AutoconsommationSimulator = {
  PROFILES,
  ADDITIONAL_PROFILES,
  BATTERY_DEFAULTS,
  generateConsumptionProfile,
  simulateAutoconsommation,
  calculateFinancials,
  fetchPvgisHourly,
  averageDailyProfile,
  getTypicalDays
};
