/**
 * pdf-generator.js — Solar Data Atlas
 * Modular PDF generator (client & study modes)
 *
 * Dependencies: jsPDF 2.5.1 (UMD, loaded via CDN in HTML)
 * Data source:  window.lastSimulationData (built by calculateDetailed / generateVerdict / updateSensitivity)
 *
 * Public API:
 *   window.generateSimulationPdf(data, { mode, lang })
 *     mode: 'client' | 'study'
 *     lang: 'fr' | 'en'  (takes precedence over data.meta.lang)
 *
 * Architecture:
 *   1. Constants (palette, dimensions, margins)
 *   2. LABELS object (FR/EN bilingual strings)
 *   3. clean() — unicode sanitizer
 *   4. fmtNum() — locale-aware number formatting
 *   5. normalizeSimulationData(rawData) — adds displayFlags layer
 *   6. Low-level draw helpers (header, footer, section, table, kpi, verdict, pageBreak)
 *   7. Page composers — client mode pages 1–4, study mode pages 1–4 (Step 3+)
 *   8. Entry point — generateSimulationPdf()
 *
 * @version 2.0.0
 * @author  Bernard Pugnet / Solar Data Atlas
 */

(function () {
    'use strict';

    // =================================================================
    //  1. CONSTANTS
    // =================================================================

    /** A4 dimensions in mm */
    var PAGE_W = 210;
    var PAGE_H = 297;

    /** Margins */
    var M = 16;                         // left/right margin
    var HEADER_H = 32;                  // header band height
    var FOOTER_Y = PAGE_H - 14;         // footer top (line separator)
    var CONTENT_START_Y = 38;           // first content Y after header
    var PAGE_BOTTOM = PAGE_H - 20;      // safe bottom before footer

    /** Centered block (for compact label-value rows) */
    var BLOCK_W = 110;
    var BLOCK_X = (PAGE_W - BLOCK_W) / 2;

    /** Color palette — RGB arrays, identical to legacy */
    var C = {
        dark:    [15, 23, 42],
        slate:   [71, 85, 105],
        light:   [203, 213, 225],
        amber:   [245, 158, 11],
        green:   [34, 197, 94],
        red:     [239, 68, 68],
        white:   [255, 255, 255],
        muted:   [148, 163, 184],
        bg:      [241, 245, 249],
        bgCard:  [248, 250, 252],
        // Verdict-specific backgrounds
        bgGreen: [240, 253, 244],
        bgAmber: [255, 251, 235],
        bgRed:   [254, 242, 242],
    };


    // =================================================================
    //  2. LABELS (bilingual FR / EN)
    // =================================================================

    var LABELS = {
        fr: {
            // Header
            brandName:        'Solar Data Atlas',
            reportSubtitle:   'Rapport de simulation solaire',
            reportSubStudy:   'Etude technico-economique',
            websiteUrl:       'www.solardataatlas.com',

            // Section titles
            sectionConfig:       'Configuration',
            sectionProduction:   'Production solaire',
            sectionAutoconso:    'Autoconsommation detaillee',
            sectionFinancial:    'Bilan financier',
            sectionBattery:      'Impact de la batterie',
            sectionSensitivity:  'Analyse de sensibilite',
            sectionNarrative:    'Analyse narrative',
            sectionGlossary:     'Glossaire',
            sectionQuickRead:    'A RETENIR',

            // Config labels
            lblLocation:       'Localisation',
            lblPower:          'Puissance installee',
            lblSurface:        'Surface',
            lblTiltOrient:     'Inclinaison / Orientation',
            lblBattery:        'Batterie',
            lblConsoInput:     'Consommation saisie',
            lblConsoSimulated: 'Consommation totale (avec equipements)',
            lblElecPrice:      'Prix electricite',
            lblFeedinTariff:   'Tarif revente',
            lblProfile:        'Profil de consommation',

            // Production labels
            lblAnnualProd:      'Production annuelle',
            lblProdPerKwc:      'Productible par kWc',
            lblSavingsAuto:     'Economies autoconsommation',
            lblSavingsFeedin:   'Revenus revente surplus',
            lblSavingsTotal:    'Economies annuelles totales',

            // Autoconso labels
            lblAutoRate:        'Taux autoconsommation',
            lblProdRate:        'Couverture solaire',
            lblAutoDirect:      'Autoconsommation directe',
            lblAutoBattery:     'Via batterie',
            lblInjection:       'Injection reseau',
            lblSoutirage:       'Soutirage reseau',

            // Financial labels
            lblInstallCost:     'Cout installation brut',
            lblNetCost:         'Cout net apres aides',
            lblPayback:         'Temps de retour',
            lblTotalGains:      'Gains nets (25 ans)',
            lblIrr:             'TRI',
            lblCo2:             'CO2 evite',

            // KPI cards
            kpiSavings:   'Economies annuelles',
            kpiPayback:   'Temps de retour',
            kpiAutoconso: 'Autoconsommation',
            kpiIrr:       'TRI',

            // Battery comparison
            lblWithBattery:    'Avec batterie',
            lblWithoutBattery: 'Sans batterie',
            lblAutoconsoShort: 'Autoconso',
            lblSavingsShort:   'Economies',
            lblPaybackShort:   'Retour',

            // Sensitivity scenarios
            scenarioPessimist: 'Pessimiste',
            scenarioBase:      'Base',
            scenarioOptimist:  'Optimiste',

            // Units
            unitKwh:    'kWh',
            unitKwhAn:  'kWh/an',
            unitKwhKwc: 'kWh/kWc',
            unitKwc:    'kWc',
            unitEur:    'EUR',
            unitEurAn:  'EUR/an',
            unitEurKwh: 'EUR/kWh',
            unitPercent: '%',
            unitYears:  'ans',
            unitM2:     'm2',
            unitKgAn:   'kg/an',

            // Orientation labels
            orientSouth:     'Sud',
            orientSouthEast: 'Sud-Est',
            orientSouthWest: 'Sud-Ouest',
            orientEast:      'Est',
            orientWest:      'Ouest',

            // Profile labels
            profileFamily:      'Famille',
            profileRetired:     'Retraites',
            profileTelecommute: 'Teletravail',
            profileAllElectric: 'Tout electrique',

            // Page 3 — Decision analysis
            p3Title:              'Analyse decisionnelle',
            p3WhyVerdict:         'Pourquoi ce verdict',
            p3Strengths:          'Ce qui soutient la rentabilite',
            p3Weaknesses:         'Ce qui limite la performance',
            p3BatteryReading:     'Lecture de la batterie',
            p3CheckBefore:        'Ce qu\'il faut verifier avant decision',
            p3Recommendations:    'Recommandations',
            p3NoBattery:          'Aucune batterie configuree dans cette simulation.',
            p3DefaultCheck:       'Verifier les conditions locales d\'ombrage, l\'etat de la toiture et les devis d\'installateurs certifies avant tout engagement.',
            p3DefaultCheckEn:     '',

            // Page 4 — Hypotheses / method / limits
            p4Assumptions:        'Hypotheses principales',
            p4Method:             'Methode de calcul',
            p4Limits:             'Limites du modele',
            p4MethodText:         'Simulation horaire sur 8 760 heures (annee meteorologique type PVGIS/TMY). Autoconsommation calculee heure par heure en croisant production PV, profil de consommation et etat de charge batterie. Bilan financier sur 25 ans avec degradation annuelle des panneaux et de la batterie.',
            p4LimitsText:         'Le modele ne prend pas en compte l\'ombrage reel, les pertes de cables, les variations interannuelles de meteo ni les eventuelles pannes. Les prix de l\'electricite et du rachat sont fixes a la date de simulation. Les resultats sont indicatifs et ne remplacent pas une etude sur site par un installateur qualifie.',
            lblAssumedElecPrice:  'Prix electricite retenu',
            lblAssumedFeedin:     'Tarif revente retenu',
            lblAssumedIncrease:   'Hausse annuelle retenue',
            lblDegradationPv:     'Degradation PV annuelle',
            lblDegradationBat:    'Degradation batterie annuelle',
            lblHorizon:           'Horizon d\'analyse',
            lblDiscountRate:      'Taux d\'actualisation',

            // Study mode labels
            studyTitle:           'Etude technico-economique',
            studySummary:         'Synthese de faisabilite',
            studyStrengths:       'Points favorables',
            studyWeaknesses:      'Points de vigilance',
            studyTechnical:       'Donnees techniques et economiques',
            studyScenarios:       'Scenarios de sensibilite',
            studyRisks:           'Risques et points de vigilance',
            studyFinancingNote:   'Donnees de financement non disponibles dans cette version.',
            studySensitivityIntro: 'Variation de +/-15% sur trois axes : prix electricite, cout d\'installation, production solaire.',
            studyRisksText:       'Risque de production : l\'irradiation reelle peut varier de +/-10% par rapport a l\'annee meteorologique type. Risque tarifaire : les prix de l\'electricite et du rachat peuvent evoluer differemment des hypotheses retenues. Risque technique : la degradation reelle des panneaux et de la batterie peut differer des taux theoriques. Risque reglementaire : les conditions de rachat et les aides peuvent etre modifiees.',
            lblScenario:          'Scenario',
            lblElecPriceShort:    'Prix elec.',
            lblInstallCostShort:  'Cout install.',
            lblProdShort:         'Production',
            lblGains25y:          'Gains 25 ans',

            // Misc
            no:           'Non',
            notReached:   'Non atteint',
            disclaimer:   'Ce rapport est une estimation indicative basee sur les donnees PVGIS (Commission europeenne) et les parametres moyens du pays. Les resultats reels peuvent varier selon l\'ombrage, la qualite de l\'installation, la meteo et l\'evolution des tarifs.',
            footer:       'Solar Data Atlas (c) 2024-2026 Bernard Pugnet - Donnees PVGIS - Simulation indicative, non contractuelle.',
            footerLine1:  'Solar Data Atlas \u2014 rapport realise par Bernard Pugnet',
            footerLine2:  'Pour plus d\'informations : +33 6 02 19 94 81',

            // Glossary (reduced to 5 essential terms for page 4)
            glossary: [
                ['kWc', 'Kilowatt-crete : puissance maximale d\'un panneau en conditions standard (1 000 W/m2, 25 C).'],
                ['kWh', 'Kilowattheure : unite d\'energie. 1 kWh = 1 000 watts pendant 1 heure.'],
                ['TRI', 'Taux de Rentabilite Interne : rendement annuel equivalent. A comparer a un placement bancaire (~3 %).'],
                ['Autoconso.', 'Part de la production solaire utilisee sur place plutot qu\'injectee au reseau.'],
                ['PVGIS', 'Base de donnees europeenne d\'irradiation solaire (Commission europeenne).'],
            ],
        },

        en: {
            // Header
            brandName:        'Solar Data Atlas',
            reportSubtitle:   'Solar simulation report',
            reportSubStudy:   'Techno-economic feasibility study',
            websiteUrl:       'www.solardataatlas.com',

            // Section titles
            sectionConfig:       'Configuration',
            sectionProduction:   'Solar production',
            sectionAutoconso:    'Self-consumption details',
            sectionFinancial:    'Financial summary',
            sectionBattery:      'Battery impact',
            sectionSensitivity:  'Sensitivity analysis',
            sectionNarrative:    'Narrative analysis',
            sectionGlossary:     'Glossary',
            sectionQuickRead:    'KEY TAKEAWAYS',

            // Config labels
            lblLocation:       'Location',
            lblPower:          'Installed capacity',
            lblSurface:        'Surface area',
            lblTiltOrient:     'Tilt / Orientation',
            lblBattery:        'Battery',
            lblConsoInput:     'Input consumption',
            lblConsoSimulated: 'Total consumption (with equipment)',
            lblElecPrice:      'Electricity price',
            lblFeedinTariff:   'Feed-in tariff',
            lblProfile:        'Consumption profile',

            // Production labels
            lblAnnualProd:      'Annual production',
            lblProdPerKwc:      'Yield per kWp',
            lblSavingsAuto:     'Self-consumption savings',
            lblSavingsFeedin:   'Feed-in revenue',
            lblSavingsTotal:    'Total annual savings',

            // Autoconso labels
            lblAutoRate:        'Self-consumption rate',
            lblProdRate:        'Solar coverage',
            lblAutoDirect:      'Direct self-consumption',
            lblAutoBattery:     'Via battery',
            lblInjection:       'Grid injection',
            lblSoutirage:       'Grid withdrawal',

            // Financial labels
            lblInstallCost:     'Gross installation cost',
            lblNetCost:         'Net cost after subsidies',
            lblPayback:         'Payback period',
            lblTotalGains:      'Net gains (25 years)',
            lblIrr:             'IRR',
            lblCo2:             'CO2 avoided',

            // KPI cards
            kpiSavings:   'Annual savings',
            kpiPayback:   'Payback period',
            kpiAutoconso: 'Self-consumption',
            kpiIrr:       'IRR',

            // Battery comparison
            lblWithBattery:    'With battery',
            lblWithoutBattery: 'Without battery',
            lblAutoconsoShort: 'Self-cons.',
            lblSavingsShort:   'Savings',
            lblPaybackShort:   'Payback',

            // Sensitivity scenarios
            scenarioPessimist: 'Pessimistic',
            scenarioBase:      'Baseline',
            scenarioOptimist:  'Optimistic',

            // Units
            unitKwh:    'kWh',
            unitKwhAn:  'kWh/yr',
            unitKwhKwc: 'kWh/kWp',
            unitKwc:    'kWp',
            unitEur:    'EUR',
            unitEurAn:  'EUR/yr',
            unitEurKwh: 'EUR/kWh',
            unitPercent: '%',
            unitYears:  'years',
            unitM2:     'm2',
            unitKgAn:   'kg/yr',

            // Orientation labels
            orientSouth:     'South',
            orientSouthEast: 'South-East',
            orientSouthWest: 'South-West',
            orientEast:      'East',
            orientWest:      'West',

            // Profile labels
            profileFamily:      'Family',
            profileRetired:     'Retired',
            profileTelecommute: 'Remote work',
            profileAllElectric: 'All-electric',

            // Page 3 — Decision analysis
            p3Title:              'Decision analysis',
            p3WhyVerdict:         'Why this verdict',
            p3Strengths:          'What supports profitability',
            p3Weaknesses:         'What limits performance',
            p3BatteryReading:     'Battery assessment',
            p3CheckBefore:        'What to check before deciding',
            p3Recommendations:    'Recommendations',
            p3NoBattery:          'No battery configured in this simulation.',
            p3DefaultCheck:       'Check local shading conditions, roof condition and quotes from certified installers before committing.',
            p3DefaultCheckEn:     '',

            // Page 4 — Assumptions / method / limits
            p4Assumptions:        'Key assumptions',
            p4Method:             'Calculation method',
            p4Limits:             'Model limitations',
            p4MethodText:         'Hourly simulation over 8,760 hours (PVGIS/TMY typical meteorological year). Self-consumption calculated hour by hour, crossing PV production, consumption profile and battery state of charge. Financial analysis over 25 years with annual degradation of panels and battery.',
            p4LimitsText:         'The model does not account for actual shading, cable losses, year-to-year weather variations or potential equipment failures. Electricity and feed-in prices are fixed at simulation date. Results are indicative and do not replace an on-site assessment by a qualified installer.',
            lblAssumedElecPrice:  'Assumed electricity price',
            lblAssumedFeedin:     'Assumed feed-in tariff',
            lblAssumedIncrease:   'Assumed annual increase',
            lblDegradationPv:     'Annual PV degradation',
            lblDegradationBat:    'Annual battery degradation',
            lblHorizon:           'Analysis horizon',
            lblDiscountRate:      'Discount rate',

            // Study mode labels
            studyTitle:           'Techno-economic feasibility study',
            studySummary:         'Feasibility summary',
            studyStrengths:       'Favorable factors',
            studyWeaknesses:      'Points of caution',
            studyTechnical:       'Technical and economic data',
            studyScenarios:       'Sensitivity scenarios',
            studyRisks:           'Risks and cautions',
            studyFinancingNote:   'Financing data not available in this version.',
            studySensitivityIntro: 'Variation of +/-15% on three axes: electricity price, installation cost, solar production.',
            studyRisksText:       'Production risk: actual irradiation may vary by +/-10% from the typical meteorological year. Tariff risk: electricity and feed-in prices may evolve differently from assumptions. Technical risk: actual degradation of panels and battery may differ from theoretical rates. Regulatory risk: feed-in conditions and subsidies may be modified.',
            lblScenario:          'Scenario',
            lblElecPriceShort:    'Elec. price',
            lblInstallCostShort:  'Install cost',
            lblProdShort:         'Production',
            lblGains25y:          '25y gains',

            // Misc
            no:           'No',
            notReached:   'Not reached',
            disclaimer:   'This report is an indicative estimate based on PVGIS data (European Commission) and country-average parameters. Actual results may vary depending on shading, installation quality, weather and tariff evolution.',
            footer:       'Solar Data Atlas (c) 2024-2026 Bernard Pugnet - PVGIS data - Indicative simulation, non-contractual.',
            footerLine1:  'Solar Data Atlas \u2014 report by Bernard Pugnet',
            footerLine2:  'For more information: +33 6 02 19 94 81',

            // Glossary (reduced to 5 essential terms for page 4)
            glossary: [
                ['kWp', 'Kilowatt-peak: maximum panel power under standard conditions (1,000 W/m2, 25 C).'],
                ['kWh', 'Kilowatt-hour: unit of energy. 1 kWh = 1,000 watts for 1 hour.'],
                ['IRR', 'Internal Rate of Return: equivalent annual return. Compare with bank deposits (~3%).'],
                ['Self-cons.', 'Share of solar production used on-site rather than injected to the grid.'],
                ['PVGIS', 'European solar irradiation database (European Commission).'],
            ],
        },
    };


    // =================================================================
    //  3. UNICODE SANITIZER
    // =================================================================

    /**
     * Cleans a string for safe jsPDF rendering:
     * - non-breaking spaces → normal space
     * - emojis → removed
     * - subscript digits (CO₂) → normal digits
     * - known symbol chars → removed
     * - collapsed whitespace
     */
    function clean(s) {
        return String(s)
            .replace(/[\u00A0\u202F]/g, ' ')
            .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, '')
            .replace(/[\u2080-\u209F]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0x2050); })
            .replace(/[☀⚡🔋💰⚙📍🏠💶🔄🌍📄✓✗]/g, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }


    // =================================================================
    //  4. NUMBER FORMATTING
    // =================================================================

    /**
     * Locale-aware number formatting.
     * @param {number} n        - value
     * @param {number} [dec=0]  - decimal places
     * @param {string} [lang]   - 'fr' or 'en'
     * @returns {string}
     */
    function fmtNum(n, dec, lang) {
        if (n === null || n === undefined || isNaN(n)) return '—';
        var d = (dec !== undefined) ? dec : 0;
        var fixed = Number(n).toFixed(d);
        if (lang === 'en') {
            // 1,234.5
            var parts = fixed.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return parts.join('.');
        }
        // fr: 1 234,5
        var frParts = fixed.split('.');
        frParts[0] = frParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return frParts.join(',');
    }


    // =================================================================
    //  5. DATA NORMALIZATION
    // =================================================================

    /**
     * Normalizes raw simulation data and computes display flags.
     * Does NOT mutate the input object.
     *
     * @param {Object} rawData - window.lastSimulationData
     * @returns {Object} normalized copy with added `displayFlags` block
     */
    function normalizeSimulationData(rawData) {
        if (!rawData) return null;

        // Shallow copy top-level blocks (we don't mutate nested objects)
        var d = {
            config:          rawData.config,
            battery:         rawData.battery,
            financialParams: rawData.financialParams,
            production:      rawData.production,
            financial:       rawData.financial,
            meta:            rawData.meta,
            verdict:         rawData.verdict,
            batteryComparison: rawData.batteryComparison,
            sensitivity:     rawData.sensitivity,
            financing:       rawData.financing,
        };

        // --- Compute display flags ---
        var cfg = d.config || {};
        var bat = d.battery || {};
        var fin = d.financial || {};
        var prod = d.production || {};
        var fp = d.financialParams || {};

        d.displayFlags = {
            /** Battery is active and has capacity */
            hasBattery: bat.enabled === true && bat.capacityKwh > 0,

            /** Addons changed consumption vs. user input */
            hasAddons: Array.isArray(cfg.addons) && cfg.addons.length > 0,

            /** Simulated consumption differs from user input (addons effect) */
            consoModified: prod.totalConsumption !== cfg.consumption,

            /** Verdict block was populated */
            hasVerdict: d.verdict !== null && d.verdict !== undefined,

            /** Battery comparison data available */
            hasBatteryComparison: d.batteryComparison !== null && d.batteryComparison !== undefined,

            /** Sensitivity analysis was run */
            hasSensitivity: d.sensitivity !== null && d.sensitivity !== undefined,

            /** Payback was reached within analysis horizon */
            paybackReached: fin.payback !== null && fin.payback !== undefined,

            /** IRR was computed */
            irrAvailable: fin.irr !== null && fin.irr !== undefined,

            /** Financing data available (V2 — always false for now) */
            hasFinancing: d.financing !== null && d.financing !== undefined,
        };

        return d;
    }


    // =================================================================
    //  6. LOW-LEVEL DRAW HELPERS
    // =================================================================
    //
    // All helpers receive (doc, ctx) where ctx is a mutable drawing context:
    //   ctx.y     — current Y position (mutated by helpers)
    //   ctx.lang  — 'fr' | 'en'
    //   ctx.mode  — 'client' | 'study'
    //   ctx.L     — resolved LABELS[lang] object
    //
    // This avoids closures over a shared `y` variable and makes
    // helpers independently testable.
    // =================================================================

    /**
     * Draws the dark header band at the top of a page.
     * Sets ctx.y to CONTENT_START_Y.
     */
    function drawHeader(doc, ctx) {
        var L = ctx.L;
        doc.setFillColor.apply(doc, C.dark);
        doc.rect(0, 0, PAGE_W, HEADER_H, 'F');

        // Brand
        doc.setFontSize(18);
        doc.setTextColor.apply(doc, C.amber);
        doc.text(L.brandName, M, 14);

        // Subtitle (depends on mode)
        doc.setFontSize(10);
        doc.setTextColor.apply(doc, C.light);
        var subtitle = ctx.mode === 'study' ? L.reportSubStudy : L.reportSubtitle;
        doc.text(subtitle, M, 21);

        // Right side: URL + date
        doc.setFontSize(7.5);
        doc.setTextColor.apply(doc, C.muted);
        doc.text(L.websiteUrl, PAGE_W - M, 14, { align: 'right' });
        var dateStr = new Date().toLocaleDateString(ctx.lang === 'fr' ? 'fr-FR' : 'en-GB');
        doc.text(dateStr, PAGE_W - M, 20, { align: 'right' });

        ctx.y = CONTENT_START_Y;
    }

    /**
     * Draws the 3-zone footer on a given page.
     * Left:   "Solar Data Atlas" brand text (amber)
     * Center: 2-line contact info
     * Right:  page number (e.g. "2/6")
     * Does NOT mutate ctx.y.
     */
    function drawFooter(doc, ctx, pageNum, totalPages) {
        var L = ctx.L;
        var centerX = PAGE_W / 2;

        // --- Separator line ---
        doc.setDrawColor.apply(doc, C.light);
        doc.setLineWidth(0.3);
        doc.line(M, FOOTER_Y, PAGE_W - M, FOOTER_Y);

        // --- Left: brand text ---
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor.apply(doc, C.amber);
        doc.text('Solar Data Atlas', M, FOOTER_Y + 5);
        doc.setFont('helvetica', 'normal');

        // --- Center: 2-line contact ---
        doc.setFontSize(6.5);
        doc.setTextColor.apply(doc, C.slate);
        doc.text(clean(L.footerLine1), centerX, FOOTER_Y + 4, { align: 'center' });
        doc.setFontSize(6);
        doc.setTextColor.apply(doc, C.muted);
        doc.text(clean(L.footerLine2), centerX, FOOTER_Y + 8, { align: 'center' });

        // --- Right: pagination ---
        doc.setFontSize(7);
        doc.setTextColor.apply(doc, C.slate);
        doc.text(pageNum + '/' + totalPages, PAGE_W - M, FOOTER_Y + 5, { align: 'right' });
    }

    /**
     * Draws a section title with amber underline.
     * Advances ctx.y by ~8mm.
     */
    function drawSectionTitle(doc, ctx, text) {
        doc.setFontSize(11);
        doc.setTextColor.apply(doc, C.dark);
        doc.setFont('helvetica', 'bold');
        doc.text(clean(text), M, ctx.y);
        ctx.y += 2;
        doc.setDrawColor.apply(doc, C.amber);
        doc.setLineWidth(0.6);
        doc.line(M, ctx.y, M + 36, ctx.y);
        doc.setFont('helvetica', 'normal');
        ctx.y += 6;
    }

    /**
     * Draws a compact two-column table (label | right-aligned value).
     * Centered within BLOCK_W.
     *
     * @param {Array} rows - [[label, value], ...]
     */
    function drawCompactTable(doc, ctx, rows) {
        rows.forEach(function (row) {
            doc.setFontSize(9);
            doc.setTextColor.apply(doc, C.slate);
            doc.text(clean(row[0]), BLOCK_X, ctx.y);
            doc.setTextColor.apply(doc, C.dark);
            doc.setFont('helvetica', 'bold');
            doc.text(clean(row[1]), BLOCK_X + BLOCK_W, ctx.y, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            // Thin separator
            ctx.y += 1.5;
            doc.setDrawColor(230, 230, 235);
            doc.setLineWidth(0.15);
            doc.line(BLOCK_X, ctx.y, BLOCK_X + BLOCK_W, ctx.y);
            ctx.y += 4;
        });
    }

    /**
     * Draws a row of KPI cards (up to 4).
     * Each card: colored top border, label, value, optional unit.
     *
     * @param {Array} cards - [{ label, value, unit, accent }, ...]
     *   accent is an optional RGB array (defaults to C.amber)
     */
    function drawKpiCards(doc, ctx, cards) {
        var count = cards.length;
        if (count === 0) return;
        var gap = 3;
        var cardW = (PAGE_W - 2 * M - (count - 1) * gap) / count;
        var cardH = 22;
        var savedY = ctx.y;

        cards.forEach(function (card, i) {
            var x = M + i * (cardW + gap);
            var accent = card.accent || C.amber;

            // Card background
            doc.setFillColor.apply(doc, C.bgCard);
            doc.setDrawColor.apply(doc, C.light);
            doc.setLineWidth(0.3);
            doc.roundedRect(x, savedY, cardW, cardH, 2, 2, 'FD');

            // Top accent line
            doc.setDrawColor.apply(doc, accent);
            doc.setLineWidth(1);
            doc.line(x + 2, savedY, x + cardW - 2, savedY);

            // Label
            doc.setFontSize(7);
            doc.setTextColor.apply(doc, C.slate);
            doc.text(clean(card.label), x + cardW / 2, savedY + 7, { align: 'center' });

            // Value
            doc.setFontSize(14);
            doc.setTextColor.apply(doc, C.dark);
            doc.setFont('helvetica', 'bold');
            doc.text(clean(String(card.value)), x + cardW / 2, savedY + 15, { align: 'center' });
            doc.setFont('helvetica', 'normal');

            // Unit
            if (card.unit) {
                doc.setFontSize(7);
                doc.setTextColor.apply(doc, C.muted);
                doc.text(clean(card.unit), x + cardW / 2, savedY + 20, { align: 'center' });
            }
        });

        ctx.y = savedY + cardH + 6;
    }

    /**
     * Draws a dynamic verdict block with icon, title, and narrative.
     * Color depends on verdict level (good/medium/poor).
     *
     * @param {Object} verdict - { level, title, subtitle, narrative, recommendations }
     */
    function drawVerdictBlock(doc, ctx, verdict) {
        if (!verdict) return;

        // Determine colors based on level
        var borderColor = C.amber;
        var bgColor = C.bgAmber;
        var iconText = '?';

        if (verdict.level === 'good') {
            borderColor = C.green;
            bgColor = C.bgGreen;
            iconText = 'OK';
        } else if (verdict.level === 'poor') {
            borderColor = C.red;
            bgColor = C.bgRed;
            iconText = '!';
        }

        // Compute dynamic height from narrative length
        doc.setFontSize(8);
        var narText = clean(verdict.narrative || '');
        var narLines = doc.splitTextToSize(narText, PAGE_W - 2 * M - 22);
        var boxH = Math.max(24, 14 + narLines.length * 3.5 + 4);

        // Box
        doc.setFillColor.apply(doc, bgColor);
        doc.setDrawColor.apply(doc, borderColor);
        doc.setLineWidth(0.5);
        doc.roundedRect(M, ctx.y, PAGE_W - 2 * M, boxH, 3, 3, 'FD');

        // Icon circle
        doc.setFillColor.apply(doc, borderColor);
        doc.circle(M + 8, ctx.y + 12, 4, 'F');
        doc.setFontSize(8);
        doc.setTextColor.apply(doc, C.white);
        doc.setFont('helvetica', 'bold');
        doc.text(iconText, M + 8, ctx.y + 13.5, { align: 'center' });
        doc.setFont('helvetica', 'normal');

        // Title
        doc.setFontSize(11);
        doc.setTextColor.apply(doc, C.dark);
        doc.setFont('helvetica', 'bold');
        doc.text(clean(verdict.title || ''), M + 16, ctx.y + 9);
        doc.setFont('helvetica', 'normal');

        // Narrative
        doc.setFontSize(8);
        doc.setTextColor.apply(doc, C.slate);
        doc.text(narLines, M + 16, ctx.y + 15);

        ctx.y += boxH + 6;
    }

    /**
     * Checks if enough vertical space remains; if not, adds a page
     * and draws a header on the new page.
     *
     * @param {number} neededHeight - mm needed below current ctx.y
     * @returns {boolean} true if a new page was added
     */
    function checkPageBreak(doc, ctx, neededHeight) {
        if (ctx.y + neededHeight > PAGE_BOTTOM) {
            doc.addPage();
            drawHeader(doc, ctx);
            return true;
        }
        return false;
    }


    // =================================================================
    //  7. PAGE COMPOSERS (placeholders — Steps 3–6)
    // =================================================================

    // --- Client mode ---

    /**
     * Resolves an orientation value (degrees) to a human-readable label.
     * @param {number} deg - orientation in degrees (0=South, -45=SE, etc.)
     * @param {Object} L   - LABELS[lang]
     * @returns {string}
     */
    function orientLabel(deg, L) {
        var map = {
            '0':   L.orientSouth,
            '-45': L.orientSouthEast,
            '45':  L.orientSouthWest,
            '-90': L.orientEast,
            '90':  L.orientWest,
        };
        return map[String(deg)] || (deg + '\u00b0');
    }

    /**
     * Resolves a profile key to a human-readable label.
     * @param {string} key - 'family' | 'retired' | 'telecommute' | 'allElectric'
     * @param {Object} L   - LABELS[lang]
     * @returns {string}
     */
    function profileLabel(key, L) {
        var map = {
            'family':       L.profileFamily,
            'retired':      L.profileRetired,
            'telecommute':  L.profileTelecommute,
            'allElectric':  L.profileAllElectric,
        };
        return map[key] || key;
    }

    /**
     * Draws the "A RETENIR" / "KEY TAKEAWAYS" summary box.
     */
    function drawQuickReadBox(doc, ctx, data) {
        var L = ctx.L;
        var lang = ctx.lang;
        var prod = data.production;
        var fin = data.financial;
        var fp = data.financialParams;

        var paybackStr = fin.payback !== null ? fmtNum(fin.payback, 1, lang) : L.notReached;

        var line = L.lblAnnualProd + ' : ' + fmtNum(prod.annual, 0, lang) + ' ' + L.unitKwhAn + '  |  '
            + L.kpiSavings + ' : ' + fmtNum(fin.annualSavings, 0, lang) + ' ' + L.unitEurAn + '  |  '
            + L.kpiPayback + ' : ' + paybackStr + ' ' + L.unitYears + '  |  '
            + L.lblTotalGains + ' : ' + fmtNum(fin.totalSavings25y, 0, lang) + ' ' + L.unitEur;

        doc.setFillColor.apply(doc, C.bg);
        doc.roundedRect(M, ctx.y - 2, PAGE_W - 2 * M, 16, 2, 2, 'F');
        doc.setFontSize(8);
        doc.setTextColor.apply(doc, C.dark);
        doc.setFont('helvetica', 'bold');
        doc.text(L.sectionQuickRead, M + 4, ctx.y + 4);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor.apply(doc, C.slate);
        var qrLines = doc.splitTextToSize(clean(line), PAGE_W - 2 * M - 8);
        doc.text(qrLines, M + 4, ctx.y + 9);
        ctx.y += 20;
    }

    // -----------------------------------------------------------------
    //  Client page 1: Synthese decisionnelle
    //  - Verdict block
    //  - 4 KPI cards
    //  - Configuration table
    //  - Quick-read summary box
    // -----------------------------------------------------------------

    /** Client page 1: Decision summary (verdict + KPIs + config + quick read) */
    function renderClientPage1(doc, ctx, data) {
        var L = ctx.L;
        var lang = ctx.lang;
        var cfg = data.config;
        var bat = data.battery;
        var fp = data.financialParams;
        var fin = data.financial;
        var prod = data.production;
        var flags = data.displayFlags;

        // --- Verdict block ---
        if (flags.hasVerdict) {
            drawVerdictBlock(doc, ctx, data.verdict);
        }

        // --- 4 KPI cards ---
        var paybackVal = fin.payback !== null
            ? fmtNum(fin.payback, 1, lang)
            : L.notReached;
        var irrVal = flags.irrAvailable
            ? fmtNum(fin.irr * 100, 1, lang)
            : '—';

        drawKpiCards(doc, ctx, [
            { label: L.kpiSavings,   value: fmtNum(fin.annualSavings, 0, lang), unit: L.unitEurAn, accent: C.green },
            { label: L.kpiPayback,   value: paybackVal,                          unit: L.unitYears, accent: C.amber },
            { label: L.kpiAutoconso, value: fmtNum(prod.autoconsoRate, 1, lang), unit: L.unitPercent, accent: C.amber },
            { label: L.kpiIrr,       value: irrVal,                              unit: L.unitPercent, accent: C.green },
        ]);

        // --- Configuration table ---
        ctx.y += 4;
        drawSectionTitle(doc, ctx, L.sectionConfig);

        var batteryText = flags.hasBattery
            ? fmtNum(bat.capacityKwh, 1, lang) + ' ' + L.unitKwh
            : L.no;

        var configRows = [
            [L.lblLocation,   cfg.countryName + ' (' + fmtNum(cfg.lat, 2, lang) + '\u00b0N, ' + fmtNum(cfg.lon, 2, lang) + '\u00b0E)'],
            [L.lblPower,      fmtNum(cfg.kwc, 1, lang) + ' ' + L.unitKwc],
            [L.lblSurface,    fmtNum(cfg.surface, 0, lang) + ' ' + L.unitM2],
            [L.lblTiltOrient, fmtNum(cfg.tilt, 0, lang) + '\u00b0 / ' + orientLabel(cfg.orientation, L)],
            [L.lblProfile,    profileLabel(cfg.profile, L)],
            [L.lblBattery,    batteryText],
            [L.lblConsoInput, fmtNum(cfg.consumption, 0, lang) + ' ' + L.unitKwh],
        ];

        // Show simulated consumption only if addons modified it
        if (flags.consoModified) {
            configRows.push([L.lblConsoSimulated, fmtNum(prod.totalConsumption, 0, lang) + ' ' + L.unitKwh]);
        }

        configRows.push([L.lblElecPrice,     fmtNum(fp.elecPrice, 4, lang) + ' ' + L.unitEurKwh]);
        configRows.push([L.lblFeedinTariff,   fmtNum(fp.feedinTariff, 4, lang) + ' ' + L.unitEurKwh]);

        drawCompactTable(doc, ctx, configRows);

        // --- Quick-read summary box ---
        ctx.y += 4;
        drawQuickReadBox(doc, ctx, data);
    }

    /**
     * Draws the battery comparison side-by-side cards.
     * Uses data from batteryComparison (not DOM).
     */
    function drawBatteryComparison(doc, ctx, data) {
        var L = ctx.L;
        var lang = ctx.lang;
        var bc = data.batteryComparison;
        if (!bc) return;

        drawSectionTitle(doc, ctx, L.sectionBattery);

        var colW = (BLOCK_W - 6) / 2;
        var colX1 = BLOCK_X;
        var colX2 = BLOCK_X + colW + 6;

        var noBatPayStr = bc.withoutBattery.payback !== null
            ? fmtNum(bc.withoutBattery.payback, 1, lang) + ' ' + L.unitYears
            : L.notReached;
        var batPayStr = bc.withBattery.payback !== null
            ? fmtNum(bc.withBattery.payback, 1, lang) + ' ' + L.unitYears
            : L.notReached;

        // --- Without battery card ---
        doc.setFillColor.apply(doc, C.bg);
        doc.roundedRect(colX1, ctx.y - 2, colW, 24, 2, 2, 'F');
        doc.setFontSize(8);
        doc.setTextColor.apply(doc, C.slate);
        doc.setFont('helvetica', 'bold');
        doc.text(L.lblWithoutBattery, colX1 + colW / 2, ctx.y + 3, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor.apply(doc, C.dark);
        doc.text(L.lblAutoconsoShort + ' : ' + fmtNum(bc.withoutBattery.autoRate, 1, lang) + '%', colX1 + 4, ctx.y + 9);
        doc.text(L.lblSavingsShort + ' : ' + fmtNum(bc.withoutBattery.savings, 0, lang) + ' ' + L.unitEur, colX1 + 4, ctx.y + 14);
        doc.text(L.lblPaybackShort + ' : ' + noBatPayStr, colX1 + 4, ctx.y + 19);

        // --- With battery card ---
        doc.setFillColor.apply(doc, C.bgAmber);
        doc.setDrawColor.apply(doc, C.amber);
        doc.setLineWidth(0.4);
        doc.roundedRect(colX2, ctx.y - 2, colW, 24, 2, 2, 'FD');
        doc.setFontSize(8);
        doc.setTextColor.apply(doc, C.amber);
        doc.setFont('helvetica', 'bold');
        doc.text(L.lblWithBattery, colX2 + colW / 2, ctx.y + 3, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor.apply(doc, C.dark);
        doc.text(L.lblAutoconsoShort + ' : ' + fmtNum(bc.withBattery.autoRate, 1, lang) + '%', colX2 + 4, ctx.y + 9);
        doc.text(L.lblSavingsShort + ' : ' + fmtNum(bc.withBattery.savings, 0, lang) + ' ' + L.unitEur, colX2 + 4, ctx.y + 14);
        doc.text(L.lblPaybackShort + ' : ' + batPayStr, colX2 + 4, ctx.y + 19);

        ctx.y += 26;

        // --- Conclusion text ---
        if (bc.conclusion) {
            doc.setFontSize(7);
            doc.setTextColor.apply(doc, C.muted);
            var concLines = doc.splitTextToSize(clean(bc.conclusion), BLOCK_W);
            doc.text(concLines, BLOCK_X, ctx.y);
            ctx.y += concLines.length * 3 + 4;
        }
        ctx.y += 4;
    }

    // -----------------------------------------------------------------
    //  Client page 2: Analyse technique et financiere
    //  - Production solaire
    //  - Autoconsommation detaillee (conditionnel)
    //  - Bilan financier
    //  - Impact batterie (conditionnel)
    // -----------------------------------------------------------------

    /** Client page 2: Technical & financial analysis */
    function renderClientPage2(doc, ctx, data) {
        var L = ctx.L;
        var lang = ctx.lang;
        var prod = data.production;
        var fin = data.financial;
        var fp = data.financialParams;
        var flags = data.displayFlags;

        // --- Production solaire ---
        drawSectionTitle(doc, ctx, L.sectionProduction);
        drawCompactTable(doc, ctx, [
            [L.lblAnnualProd,   fmtNum(prod.annual, 0, lang) + ' ' + L.unitKwh],
            [L.lblProdPerKwc,   fmtNum(prod.perKwc, 0, lang) + ' ' + L.unitKwhKwc],
            [L.lblSavingsAuto,  fmtNum(fin.savingsAutoconso, 0, lang) + ' ' + L.unitEurAn],
            [L.lblSavingsFeedin, fmtNum(fin.savingsFeedin, 0, lang) + ' ' + L.unitEurAn],
            [L.lblSavingsTotal, fmtNum(fin.annualSavings, 0, lang) + ' ' + L.unitEurAn],
        ]);
        ctx.y += 4;

        // --- Autoconsommation detaillee ---
        // Only show if autoconsoRate is available (always true after simulation)
        drawSectionTitle(doc, ctx, L.sectionAutoconso);
        drawCompactTable(doc, ctx, [
            [L.lblAutoRate,    fmtNum(prod.autoconsoRate, 1, lang) + ' ' + L.unitPercent],
            [L.lblProdRate,    fmtNum(prod.autoprodRate, 1, lang) + ' ' + L.unitPercent],
            [L.lblAutoDirect,  fmtNum(prod.autoDirect, 0, lang) + ' ' + L.unitKwh],
            [L.lblAutoBattery, fmtNum(prod.autoBattery, 0, lang) + ' ' + L.unitKwh],
            [L.lblInjection,   fmtNum(prod.injection, 0, lang) + ' ' + L.unitKwh],
            [L.lblSoutirage,   fmtNum(prod.soutirage, 0, lang) + ' ' + L.unitKwh],
        ]);
        ctx.y += 4;

        // --- Bilan financier ---
        // Check page break: financial section needs ~40mm
        checkPageBreak(doc, ctx, 45);

        var paybackStr = fin.payback !== null
            ? fmtNum(fin.payback, 1, lang) + ' ' + L.unitYears
            : L.notReached;
        var irrStr = flags.irrAvailable
            ? fmtNum(fin.irr * 100, 1, lang) + ' ' + L.unitPercent
            : '—';

        drawSectionTitle(doc, ctx, L.sectionFinancial);
        drawCompactTable(doc, ctx, [
            [L.lblInstallCost, fmtNum(fp.totalInvestment, 0, lang) + ' ' + L.unitEur],
            [L.lblNetCost,     fmtNum(fp.netCost, 0, lang) + ' ' + L.unitEur],
            [L.lblPayback,     paybackStr],
            [L.lblTotalGains,  fmtNum(fin.totalSavings25y, 0, lang) + ' ' + L.unitEur],
            [L.lblIrr,         irrStr],
            [L.lblCo2,         fmtNum(fin.co2Avoided, 0, lang) + ' ' + L.unitKgAn],
        ]);
        ctx.y += 4;

        // --- Battery comparison (conditional) ---
        if (flags.hasBatteryComparison) {
            // Check page break: battery comparison needs ~40mm
            checkPageBreak(doc, ctx, 40);
            drawBatteryComparison(doc, ctx, data);
        }
    }

    // -----------------------------------------------------------------
    //  Helper: drawMiniBlock
    //  Draws a titled mini-block with a short text body.
    //  Used for the structured analysis blocks on page 3.
    // -----------------------------------------------------------------

    /**
     * Draws a titled text block: bold subtitle + body lines.
     * Handles page breaks before drawing.
     *
     * @param {string} title - block subtitle
     * @param {string|Array} body  - text string or array of strings (bullet lines)
     */
    function drawMiniBlock(doc, ctx, title, body) {
        if (!body || (Array.isArray(body) && body.length === 0)) return;

        var textStr = Array.isArray(body) ? body.join('\n') : String(body);
        doc.setFontSize(8);
        var bodyLines = doc.splitTextToSize(clean(textStr), PAGE_W - 2 * M - 8);
        var neededH = 10 + bodyLines.length * 3.5;

        checkPageBreak(doc, ctx, neededH);

        // Subtitle
        doc.setFontSize(9);
        doc.setTextColor.apply(doc, C.dark);
        doc.setFont('helvetica', 'bold');
        doc.text(clean(title), M + 2, ctx.y);
        doc.setFont('helvetica', 'normal');
        ctx.y += 1.5;
        doc.setDrawColor.apply(doc, C.light);
        doc.setLineWidth(0.3);
        doc.line(M + 2, ctx.y, M + 50, ctx.y);
        ctx.y += 4;

        // Body
        doc.setFontSize(8);
        doc.setTextColor.apply(doc, C.slate);
        doc.text(bodyLines, M + 4, ctx.y);
        ctx.y += bodyLines.length * 3.5 + 5;
    }

    /**
     * Builds a strength sentence from numeric data.
     * Returns an array of short factual lines.
     */
    function buildStrengths(data, L, lang) {
        var lines = [];
        var fin = data.financial;
        var prod = data.production;
        var fp = data.financialParams;

        // Good yield
        if (prod.perKwc >= 1100) {
            lines.push('- ' + L.lblProdPerKwc + ' : ' + fmtNum(prod.perKwc, 0, lang) + ' ' + L.unitKwhKwc
                + (lang === 'fr' ? ' (bon gisement solaire)' : ' (good solar resource)'));
        }
        // High self-consumption
        if (prod.autoconsoRate >= 50) {
            lines.push('- ' + L.lblAutoRate + ' : ' + fmtNum(prod.autoconsoRate, 1, lang) + '%'
                + (lang === 'fr' ? ' (valorisation locale forte)' : ' (strong local value)'));
        }
        // Good payback
        if (fin.payback !== null && fin.payback <= 12) {
            lines.push('- ' + L.lblPayback + ' : ' + fmtNum(fin.payback, 1, lang) + ' ' + L.unitYears
                + (lang === 'fr' ? ' (retour rapide)' : ' (fast return)'));
        }
        // Positive IRR (fin.irr is a decimal, e.g. 0.17 = 17%)
        if (fin.irr !== null && fin.irr >= 0.04) {
            lines.push('- ' + L.lblIrr + ' : ' + fmtNum(fin.irr * 100, 1, lang) + '%'
                + (lang === 'fr' ? ' (rendement competitif)' : ' (competitive return)'));
        }
        // Significant 25y gains
        if (fin.totalSavings25y > fp.netCost * 1.5) {
            lines.push('- ' + L.lblTotalGains + ' : ' + fmtNum(fin.totalSavings25y, 0, lang) + ' ' + L.unitEur);
        }
        // Fallback
        if (lines.length === 0) {
            lines.push(lang === 'fr'
                ? '- Les parametres ne font pas ressortir de point fort marque dans cette configuration.'
                : '- The parameters do not highlight a strong advantage in this configuration.');
        }
        return lines;
    }

    /**
     * Builds weakness lines from numeric data.
     */
    function buildWeaknesses(data, L, lang) {
        var lines = [];
        var fin = data.financial;
        var prod = data.production;

        // Low yield
        if (prod.perKwc < 900) {
            lines.push('- ' + L.lblProdPerKwc + ' : ' + fmtNum(prod.perKwc, 0, lang) + ' ' + L.unitKwhKwc
                + (lang === 'fr' ? ' (gisement solaire faible)' : ' (low solar resource)'));
        }
        // Low self-consumption
        if (prod.autoconsoRate < 30) {
            lines.push('- ' + L.lblAutoRate + ' : ' + fmtNum(prod.autoconsoRate, 1, lang) + '%'
                + (lang === 'fr' ? ' (forte injection, faible valorisation locale)' : ' (high injection, low local value)'));
        }
        // Long or no payback
        if (fin.payback === null) {
            lines.push(lang === 'fr'
                ? '- Temps de retour non atteint sur 25 ans'
                : '- Payback period not reached within 25 years');
        } else if (fin.payback > 15) {
            lines.push('- ' + L.lblPayback + ' : ' + fmtNum(fin.payback, 1, lang) + ' ' + L.unitYears
                + (lang === 'fr' ? ' (retour lent)' : ' (slow return)'));
        }
        // Low IRR (fin.irr is a decimal, e.g. 0.02 = 2%)
        if (fin.irr !== null && fin.irr < 0.02) {
            lines.push('- ' + L.lblIrr + ' : ' + fmtNum(fin.irr * 100, 1, lang) + '%'
                + (lang === 'fr' ? ' (rendement inferieur au cout du capital)' : ' (return below cost of capital)'));
        }
        // Fallback
        if (lines.length === 0) {
            lines.push(lang === 'fr'
                ? '- Aucun point faible majeur identifie dans cette configuration.'
                : '- No major weakness identified in this configuration.');
        }
        return lines;
    }

    /**
     * Builds a battery reading block.
     */
    function buildBatteryReading(data, L, lang) {
        var flags = data.displayFlags;
        if (!flags.hasBattery) return [L.p3NoBattery];

        var lines = [];
        var bc = data.batteryComparison;
        if (bc) {
            var diffAuto = fmtNum(bc.autoDiffPoints, 1, lang);
            lines.push(lang === 'fr'
                ? '- La batterie augmente l\'autoconsommation de +' + diffAuto + ' points.'
                : '- The battery increases self-consumption by +' + diffAuto + ' points.');

            if (bc.withBattery.payback !== null && bc.withoutBattery.payback !== null) {
                var diffPay = fmtNum(bc.paybackDiffYears, 1, lang);
                if (bc.paybackDiffYears > 0) {
                    lines.push(lang === 'fr'
                        ? '- Elle allonge le retour sur investissement de ' + diffPay + ' ' + L.unitYears + '.'
                        : '- It extends the payback period by ' + diffPay + ' ' + L.unitYears + '.');
                } else {
                    lines.push(lang === 'fr'
                        ? '- Elle reduit le retour sur investissement de ' + fmtNum(Math.abs(bc.paybackDiffYears), 1, lang) + ' ' + L.unitYears + '.'
                        : '- It reduces the payback period by ' + fmtNum(Math.abs(bc.paybackDiffYears), 1, lang) + ' ' + L.unitYears + '.');
                }
            }

            if (bc.conclusion) {
                lines.push('- ' + bc.conclusion);
            }
        } else {
            lines.push(lang === 'fr'
                ? '- Batterie configuree (' + fmtNum(data.battery.capacityKwh, 1, lang) + ' ' + L.unitKwh + '), comparaison non disponible.'
                : '- Battery configured (' + fmtNum(data.battery.capacityKwh, 1, lang) + ' ' + L.unitKwh + '), comparison not available.');
        }
        return lines;
    }

    // -----------------------------------------------------------------
    //  Client page 3: Analyse decisionnelle
    //  Structured, dense, decision-oriented — no marketing filler
    // -----------------------------------------------------------------

    function renderClientPage3(doc, ctx, data) {
        var L = ctx.L;
        var lang = ctx.lang;
        var verdict = data.verdict;
        var flags = data.displayFlags;

        // --- 1. Why this verdict ---
        if (flags.hasVerdict && verdict) {
            drawMiniBlock(doc, ctx, L.p3WhyVerdict, verdict.narrative || '');
        }

        // --- 2. Strengths ---
        var strengths = buildStrengths(data, L, lang);
        drawMiniBlock(doc, ctx, L.p3Strengths, strengths);

        // --- 3. Weaknesses ---
        var weaknesses = buildWeaknesses(data, L, lang);
        drawMiniBlock(doc, ctx, L.p3Weaknesses, weaknesses);

        // --- 4. Battery reading (only if battery configured) ---
        var batLines = buildBatteryReading(data, L, lang);
        drawMiniBlock(doc, ctx, L.p3BatteryReading, batLines);

        // --- 5. What to check before deciding ---
        var checks = [];
        if (flags.hasVerdict && verdict && Array.isArray(verdict.recommendations) && verdict.recommendations.length > 0) {
            verdict.recommendations.forEach(function (r) {
                checks.push('- ' + r);
            });
        }
        // Always add the generic check
        checks.push('- ' + L.p3DefaultCheck);
        drawMiniBlock(doc, ctx, L.p3CheckBefore, checks);
    }

    // -----------------------------------------------------------------
    //  Helper: drawGlossaryCompact
    //  Draws a reduced glossary (max 5 terms, inline, dense)
    // -----------------------------------------------------------------

    function drawGlossaryCompact(doc, ctx, L) {
        var items = L.glossary;
        if (!items || items.length === 0) return;

        // Use at most 5 terms
        var maxTerms = Math.min(items.length, 5);

        checkPageBreak(doc, ctx, 8 + maxTerms * 5);

        drawSectionTitle(doc, ctx, L.sectionGlossary);
        doc.setFontSize(7.5);

        for (var i = 0; i < maxTerms; i++) {
            if (ctx.y + 5 > PAGE_BOTTOM) break;
            doc.setFont('helvetica', 'bold');
            doc.setTextColor.apply(doc, C.dark);
            doc.text(items[i][0], M + 2, ctx.y);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor.apply(doc, C.slate);
            var defLines = doc.splitTextToSize(items[i][1], PAGE_W - 2 * M - 22);
            doc.text(defLines, M + 20, ctx.y);
            ctx.y += Math.max(defLines.length * 3.2, 3.5) + 3;
        }
        ctx.y += 4;
    }

    // -----------------------------------------------------------------
    //  Helper: drawDisclaimerBox
    //  Draws the disclaimer in a subtle background box
    // -----------------------------------------------------------------

    function drawDisclaimerBox(doc, ctx, L) {
        doc.setFontSize(6.5);
        var discLines = doc.splitTextToSize(L.disclaimer, PAGE_W - 2 * M - 8);
        var boxH = Math.max(14, discLines.length * 3 + 6);

        checkPageBreak(doc, ctx, boxH + 4);

        doc.setFillColor.apply(doc, C.bg);
        doc.roundedRect(M, ctx.y - 2, PAGE_W - 2 * M, boxH, 2, 2, 'F');
        doc.setTextColor.apply(doc, C.muted);
        doc.text(discLines, M + 4, ctx.y + 3);
        ctx.y += boxH + 4;
    }

    // -----------------------------------------------------------------
    //  Client page 4: Hypotheses / Method / Limits / Glossary / Disclaimer
    //  Reinforces credibility — concise, factual, no padding
    // -----------------------------------------------------------------

    function renderClientPage4(doc, ctx, data) {
        var L = ctx.L;
        var lang = ctx.lang;
        var fp = data.financialParams;
        var flags = data.displayFlags;

        // --- 1. Key assumptions (compact table) ---
        drawSectionTitle(doc, ctx, L.p4Assumptions);

        var assumptionRows = [
            [L.lblAssumedElecPrice,  fmtNum(fp.elecPrice, 4, lang) + ' ' + L.unitEurKwh],
            [L.lblAssumedFeedin,     fmtNum(fp.feedinTariff, 4, lang) + ' ' + L.unitEurKwh],
            [L.lblAssumedIncrease,   fmtNum(fp.priceIncreaseRate * 100, 1, lang) + ' ' + L.unitPercent],
            [L.lblDegradationPv,     fmtNum(fp.degradationPv * 100, 1, lang) + ' ' + L.unitPercent],
        ];
        // Battery degradation only if battery present
        if (flags.hasBattery) {
            assumptionRows.push([L.lblDegradationBat, fmtNum(fp.degradationBattery * 100, 1, lang) + ' ' + L.unitPercent]);
        }
        assumptionRows.push([L.lblHorizon,      fmtNum(fp.years, 0, lang) + ' ' + L.unitYears]);
        assumptionRows.push([L.lblDiscountRate,  fmtNum(fp.discountRate * 100, 1, lang) + ' ' + L.unitPercent]);

        drawCompactTable(doc, ctx, assumptionRows);
        ctx.y += 4;

        // --- 2. Method ---
        checkPageBreak(doc, ctx, 30);
        drawMiniBlock(doc, ctx, L.p4Method, L.p4MethodText);

        // --- 3. Limits ---
        checkPageBreak(doc, ctx, 30);
        drawMiniBlock(doc, ctx, L.p4Limits, L.p4LimitsText);

        // --- 4. Glossary (compact, max 5 terms) ---
        drawGlossaryCompact(doc, ctx, L);

        // --- 5. Disclaimer ---
        drawDisclaimerBox(doc, ctx, L);
    }

    // =================================================================
    //  STUDY MODE — Pages 1 to 4
    //  Tone: neutral, methodical, traceable. No marketing vocabulary.
    //  Intended audience: loan officer, technical reviewer, project file.
    // =================================================================

    // -----------------------------------------------------------------
    //  Study helper: drawSensitivityTable
    //  Draws a structured table of 3 scenarios with headers.
    // -----------------------------------------------------------------

    function drawSensitivityTable(doc, ctx, data) {
        var L = ctx.L;
        var lang = ctx.lang;
        var sens = data.sensitivity;
        if (!sens || !Array.isArray(sens.scenarios)) return;

        var scenarios = sens.scenarios;
        var colWidths = [30, 30, 32, 30, 28, 28]; // scenario, elecPrice, installCost, prod, payback, gains25y
        var tableW = 0;
        colWidths.forEach(function (w) { tableW += w; });
        var startX = (PAGE_W - tableW) / 2;

        var headers = [
            L.lblScenario,
            L.lblElecPriceShort,
            L.lblInstallCostShort,
            L.lblProdShort,
            L.lblPayback,
            L.lblGains25y
        ];

        var scenarioLabels = {
            'pessimist': L.scenarioPessimist,
            'base':      L.scenarioBase,
            'optimist':  L.scenarioOptimist,
        };

        // Header row
        doc.setFillColor.apply(doc, C.dark);
        doc.rect(startX, ctx.y, tableW, 7, 'F');
        doc.setFontSize(7);
        doc.setTextColor.apply(doc, C.white);
        doc.setFont('helvetica', 'bold');
        var hx = startX;
        headers.forEach(function (h, i) {
            doc.text(clean(h), hx + colWidths[i] / 2, ctx.y + 5, { align: 'center' });
            hx += colWidths[i];
        });
        doc.setFont('helvetica', 'normal');
        ctx.y += 7;

        // Data rows
        scenarios.forEach(function (sc, idx) {
            var rowBg = idx % 2 === 0 ? C.bgCard : C.white;
            doc.setFillColor.apply(doc, rowBg);
            doc.rect(startX, ctx.y, tableW, 6, 'F');

            doc.setFontSize(7);
            doc.setTextColor.apply(doc, C.dark);
            var rx = startX;

            var payStr = sc.payback !== null ? fmtNum(sc.payback, 1, lang) : L.notReached;

            var cells = [
                scenarioLabels[sc.key] || sc.key,
                fmtNum(sc.elecPrice, 4, lang),
                fmtNum(sc.installCost, 0, lang),
                fmtNum(sc.production, 0, lang),
                payStr,
                fmtNum(sc.totalGains25y, 0, lang),
            ];

            cells.forEach(function (cell, i) {
                var align = i === 0 ? 'left' : 'center';
                var tx = i === 0 ? rx + 2 : rx + colWidths[i] / 2;
                doc.text(clean(String(cell)), tx, ctx.y + 4.5, { align: align });
                rx += colWidths[i];
            });
            ctx.y += 6;
        });

        // Bottom border
        doc.setDrawColor.apply(doc, C.light);
        doc.setLineWidth(0.3);
        doc.line(startX, ctx.y, startX + tableW, ctx.y);
        ctx.y += 4;
    }

    // -----------------------------------------------------------------
    //  Study page 1: Synthese projet
    //  - Title / summary
    //  - 4 KPI (neutral accent)
    //  - Strengths / Cautions (factual, no color verdict)
    // -----------------------------------------------------------------

    function renderStudyPage1(doc, ctx, data) {
        var L = ctx.L;
        var lang = ctx.lang;
        var fin = data.financial;
        var prod = data.production;
        var cfg = data.config;
        var flags = data.displayFlags;

        // --- Summary title ---
        drawSectionTitle(doc, ctx, L.studySummary);

        // Summary text: factual one-liner
        doc.setFontSize(8.5);
        doc.setTextColor.apply(doc, C.slate);
        var summaryText = lang === 'fr'
            ? 'Installation photovoltaique de ' + fmtNum(cfg.kwc, 1, lang) + ' kWc a ' + cfg.countryName
              + '. Simulation sur ' + fmtNum(data.financialParams.years, 0, lang) + ' ans.'
            : 'Photovoltaic installation of ' + fmtNum(cfg.kwc, 1, lang) + ' kWp in ' + cfg.countryName
              + '. Simulation over ' + fmtNum(data.financialParams.years, 0, lang) + ' years.';
        doc.text(clean(summaryText), M, ctx.y);
        ctx.y += 6;

        // --- 4 KPI cards (neutral: all slate accent, no green/amber) ---
        var paybackVal = fin.payback !== null
            ? fmtNum(fin.payback, 1, lang)
            : L.notReached;
        var irrVal = flags.irrAvailable
            ? fmtNum(fin.irr * 100, 1, lang)
            : '\u2014';

        drawKpiCards(doc, ctx, [
            { label: L.kpiSavings,   value: fmtNum(fin.annualSavings, 0, lang), unit: L.unitEurAn, accent: C.slate },
            { label: L.kpiPayback,   value: paybackVal,                          unit: L.unitYears, accent: C.slate },
            { label: L.kpiAutoconso, value: fmtNum(prod.autoconsoRate, 1, lang), unit: L.unitPercent, accent: C.slate },
            { label: L.kpiIrr,       value: irrVal,                              unit: L.unitPercent, accent: C.slate },
        ]);

        // --- Strengths ---
        ctx.y += 2;
        var strengths = buildStrengths(data, L, lang);
        drawMiniBlock(doc, ctx, L.studyStrengths, strengths);

        // --- Cautions ---
        var weaknesses = buildWeaknesses(data, L, lang);
        drawMiniBlock(doc, ctx, L.studyWeaknesses, weaknesses);

        // --- Battery reading (if applicable) ---
        if (flags.hasBattery) {
            var batLines = buildBatteryReading(data, L, lang);
            drawMiniBlock(doc, ctx, L.p3BatteryReading, batLines);
        }
    }

    // -----------------------------------------------------------------
    //  Study page 2: Donnees techniques et economiques
    //  - Configuration complete
    //  - Production
    //  - Autoconsommation
    //  - Bilan economique
    //  Dense, traceable, all numbers explicit.
    // -----------------------------------------------------------------

    function renderStudyPage2(doc, ctx, data) {
        var L = ctx.L;
        var lang = ctx.lang;
        var cfg = data.config;
        var bat = data.battery;
        var fp = data.financialParams;
        var prod = data.production;
        var fin = data.financial;
        var flags = data.displayFlags;

        // --- Configuration ---
        drawSectionTitle(doc, ctx, L.sectionConfig);

        var batteryText = flags.hasBattery
            ? fmtNum(bat.capacityKwh, 1, lang) + ' ' + L.unitKwh + ' (' + fmtNum(bat.cost, 0, lang) + ' ' + L.unitEur + ')'
            : L.no;

        var configRows = [
            [L.lblLocation,     cfg.countryName + ' (' + fmtNum(cfg.lat, 4, lang) + ', ' + fmtNum(cfg.lon, 4, lang) + ')'],
            [L.lblPower,        fmtNum(cfg.kwc, 1, lang) + ' ' + L.unitKwc],
            [L.lblSurface,      fmtNum(cfg.surface, 0, lang) + ' ' + L.unitM2],
            [L.lblTiltOrient,   fmtNum(cfg.tilt, 0, lang) + '\u00b0 / ' + orientLabel(cfg.orientation, L)],
            [L.lblProfile,      profileLabel(cfg.profile, L)],
            [L.lblBattery,      batteryText],
            [L.lblConsoInput,   fmtNum(cfg.consumption, 0, lang) + ' ' + L.unitKwh],
        ];
        if (flags.consoModified) {
            configRows.push([L.lblConsoSimulated, fmtNum(prod.totalConsumption, 0, lang) + ' ' + L.unitKwh]);
        }
        configRows.push([L.lblElecPrice,     fmtNum(fp.elecPrice, 4, lang) + ' ' + L.unitEurKwh]);
        configRows.push([L.lblFeedinTariff,  fmtNum(fp.feedinTariff, 4, lang) + ' ' + L.unitEurKwh]);

        drawCompactTable(doc, ctx, configRows);
        ctx.y += 4;

        // --- Production ---
        checkPageBreak(doc, ctx, 40);
        drawSectionTitle(doc, ctx, L.sectionProduction);
        drawCompactTable(doc, ctx, [
            [L.lblAnnualProd,   fmtNum(prod.annual, 0, lang) + ' ' + L.unitKwh],
            [L.lblProdPerKwc,   fmtNum(prod.perKwc, 0, lang) + ' ' + L.unitKwhKwc],
        ]);
        ctx.y += 2;

        // --- Autoconsommation ---
        drawSectionTitle(doc, ctx, L.sectionAutoconso);
        drawCompactTable(doc, ctx, [
            [L.lblAutoRate,    fmtNum(prod.autoconsoRate, 1, lang) + ' ' + L.unitPercent],
            [L.lblProdRate,    fmtNum(prod.autoprodRate, 1, lang) + ' ' + L.unitPercent],
            [L.lblAutoDirect,  fmtNum(prod.autoDirect, 0, lang) + ' ' + L.unitKwh],
            [L.lblAutoBattery, fmtNum(prod.autoBattery, 0, lang) + ' ' + L.unitKwh],
            [L.lblInjection,   fmtNum(prod.injection, 0, lang) + ' ' + L.unitKwh],
            [L.lblSoutirage,   fmtNum(prod.soutirage, 0, lang) + ' ' + L.unitKwh],
        ]);
        ctx.y += 4;

        // --- Bilan economique ---
        checkPageBreak(doc, ctx, 50);
        drawSectionTitle(doc, ctx, L.sectionFinancial);

        var paybackStr = fin.payback !== null
            ? fmtNum(fin.payback, 1, lang) + ' ' + L.unitYears
            : L.notReached;
        var irrStr = flags.irrAvailable
            ? fmtNum(fin.irr * 100, 1, lang) + ' ' + L.unitPercent
            : '\u2014';

        drawCompactTable(doc, ctx, [
            [L.lblInstallCost,   fmtNum(fp.installCost, 0, lang) + ' ' + L.unitEur + ' (PV)'],
            [L.lblBattery,       flags.hasBattery ? fmtNum(bat.cost, 0, lang) + ' ' + L.unitEur : '\u2014'],
            ['Total',            fmtNum(fp.totalInvestment, 0, lang) + ' ' + L.unitEur],
            [L.lblNetCost,       fmtNum(fp.netCost, 0, lang) + ' ' + L.unitEur],
            [L.lblSavingsAuto,   fmtNum(fin.savingsAutoconso, 0, lang) + ' ' + L.unitEurAn],
            [L.lblSavingsFeedin, fmtNum(fin.savingsFeedin, 0, lang) + ' ' + L.unitEurAn],
            [L.lblSavingsTotal,  fmtNum(fin.annualSavings, 0, lang) + ' ' + L.unitEurAn],
            [L.lblPayback,       paybackStr],
            [L.lblTotalGains,    fmtNum(fin.totalSavings25y, 0, lang) + ' ' + L.unitEur],
            [L.lblIrr,           irrStr],
            [L.lblCo2,           fmtNum(fin.co2Avoided, 0, lang) + ' ' + L.unitKgAn],
        ]);
    }

    // -----------------------------------------------------------------
    //  Study page 3: Scenarios / Sensitivity
    //  - Sensitivity table (3 scenarios)
    //  - Intro text
    //  - Financing placeholder (reserved, not displayed if null)
    // -----------------------------------------------------------------

    function renderStudyPage3(doc, ctx, data) {
        var L = ctx.L;
        var lang = ctx.lang;
        var flags = data.displayFlags;

        // --- Sensitivity analysis ---
        if (flags.hasSensitivity) {
            drawSectionTitle(doc, ctx, L.studyScenarios);

            // Intro text
            doc.setFontSize(8);
            doc.setTextColor.apply(doc, C.slate);
            var introLines = doc.splitTextToSize(clean(L.studySensitivityIntro), PAGE_W - 2 * M);
            doc.text(introLines, M, ctx.y);
            ctx.y += introLines.length * 3.5 + 4;

            // Table
            drawSensitivityTable(doc, ctx, data);
            ctx.y += 4;

            // Variation note
            doc.setFontSize(7);
            doc.setTextColor.apply(doc, C.muted);
            var varNote = lang === 'fr'
                ? 'Variation appliquee : +/- ' + fmtNum(data.sensitivity.variation * 100, 0, lang) + '%'
                : 'Applied variation: +/- ' + fmtNum(data.sensitivity.variation * 100, 0, lang) + '%';
            doc.text(clean(varNote), M, ctx.y);
            ctx.y += 8;
        } else {
            drawSectionTitle(doc, ctx, L.studyScenarios);
            doc.setFontSize(8);
            doc.setTextColor.apply(doc, C.muted);
            var noSens = lang === 'fr'
                ? 'Analyse de sensibilite non disponible pour cette simulation.'
                : 'Sensitivity analysis not available for this simulation.';
            doc.text(clean(noSens), M, ctx.y);
            ctx.y += 8;
        }

        // --- Battery comparison (study tone) ---
        if (flags.hasBatteryComparison) {
            checkPageBreak(doc, ctx, 45);
            drawSectionTitle(doc, ctx, L.sectionBattery);

            var bc = data.batteryComparison;
            var noBatPayStr = bc.withoutBattery.payback !== null
                ? fmtNum(bc.withoutBattery.payback, 1, lang) + ' ' + L.unitYears
                : L.notReached;
            var batPayStr = bc.withBattery.payback !== null
                ? fmtNum(bc.withBattery.payback, 1, lang) + ' ' + L.unitYears
                : L.notReached;

            drawCompactTable(doc, ctx, [
                [L.lblWithoutBattery + ' \u2014 ' + L.lblAutoRate, fmtNum(bc.withoutBattery.autoRate, 1, lang) + ' %'],
                [L.lblWithoutBattery + ' \u2014 ' + L.lblSavingsShort, fmtNum(bc.withoutBattery.savings, 0, lang) + ' ' + L.unitEur],
                [L.lblWithoutBattery + ' \u2014 ' + L.lblPayback, noBatPayStr],
                [L.lblWithBattery + ' \u2014 ' + L.lblAutoRate, fmtNum(bc.withBattery.autoRate, 1, lang) + ' %'],
                [L.lblWithBattery + ' \u2014 ' + L.lblSavingsShort, fmtNum(bc.withBattery.savings, 0, lang) + ' ' + L.unitEur],
                [L.lblWithBattery + ' \u2014 ' + L.lblPayback, batPayStr],
            ]);

            if (bc.conclusion) {
                ctx.y += 2;
                doc.setFontSize(7);
                doc.setTextColor.apply(doc, C.muted);
                var concLines = doc.splitTextToSize(clean(bc.conclusion), PAGE_W - 2 * M - 4);
                doc.text(concLines, M + 2, ctx.y);
                ctx.y += concLines.length * 3 + 4;
            }
            ctx.y += 4;
        }

        // --- Financing (V2 placeholder — only show note if financing is null) ---
        // Deliberately not rendering an empty financing block.
        // When data.financing becomes non-null in V2, a section will be added here.
    }

    // -----------------------------------------------------------------
    //  Study page 4: Hypotheses / Risks / Method / Limits / Disclaimer
    //  Reinforces traceability and prudence.
    // -----------------------------------------------------------------

    function renderStudyPage4(doc, ctx, data) {
        var L = ctx.L;
        var lang = ctx.lang;
        var fp = data.financialParams;
        var flags = data.displayFlags;

        // --- 1. Key assumptions (detailed) ---
        drawSectionTitle(doc, ctx, L.p4Assumptions);

        var assumptionRows = [
            [L.lblAssumedElecPrice,  fmtNum(fp.elecPrice, 4, lang) + ' ' + L.unitEurKwh],
            [L.lblAssumedFeedin,     fmtNum(fp.feedinTariff, 4, lang) + ' ' + L.unitEurKwh],
            [L.lblAssumedIncrease,   fmtNum(fp.priceIncreaseRate * 100, 1, lang) + ' ' + L.unitPercent],
            [L.lblDegradationPv,     fmtNum(fp.degradationPv * 100, 2, lang) + ' ' + L.unitPercent],
        ];
        if (flags.hasBattery) {
            assumptionRows.push([L.lblDegradationBat, fmtNum(fp.degradationBattery * 100, 1, lang) + ' ' + L.unitPercent]);
        }
        assumptionRows.push([L.lblHorizon,      fmtNum(fp.years, 0, lang) + ' ' + L.unitYears]);
        assumptionRows.push([L.lblDiscountRate,  fmtNum(fp.discountRate * 100, 1, lang) + ' ' + L.unitPercent]);

        drawCompactTable(doc, ctx, assumptionRows);
        ctx.y += 4;

        // --- 2. Risks ---
        checkPageBreak(doc, ctx, 30);
        drawMiniBlock(doc, ctx, L.studyRisks, L.studyRisksText);

        // --- 3. Method ---
        checkPageBreak(doc, ctx, 30);
        drawMiniBlock(doc, ctx, L.p4Method, L.p4MethodText);

        // --- 4. Limits ---
        checkPageBreak(doc, ctx, 30);
        drawMiniBlock(doc, ctx, L.p4Limits, L.p4LimitsText);

        // --- 5. Disclaimer ---
        drawDisclaimerBox(doc, ctx, L);
    }


    // =================================================================
    //  8. ENTRY POINT
    // =================================================================

    /**
     * Generates a PDF from simulation data.
     *
     * @param {Object} data          - window.lastSimulationData
     * @param {Object} opts
     * @param {string} opts.mode     - 'client' | 'study'
     * @param {string} opts.lang     - 'fr' | 'en' (overrides data.meta.lang)
     */
    function generateSimulationPdf(data, opts) {
        // --- Validate inputs ---
        if (!data) {
            console.error('[pdf-generator] No simulation data provided.');
            return;
        }
        var mode = (opts && opts.mode) || 'client';
        var lang = (opts && opts.lang) || (data.meta && data.meta.lang) || 'fr';

        if (mode !== 'client' && mode !== 'study') {
            console.error('[pdf-generator] Invalid mode: ' + mode + '. Use "client" or "study".');
            return;
        }
        if (lang !== 'fr' && lang !== 'en') {
            console.warn('[pdf-generator] Unknown lang: ' + lang + '. Falling back to "fr".');
            lang = 'fr';
        }

        // --- Check jsPDF availability ---
        var jsPDFConstructor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
        if (!jsPDFConstructor) {
            console.error('[pdf-generator] jsPDF library not loaded.');
            return;
        }

        // --- Normalize data ---
        var normalized = normalizeSimulationData(data);
        if (!normalized) {
            console.error('[pdf-generator] Data normalization failed.');
            return;
        }

        // --- Create document ---
        var doc = new jsPDFConstructor('p', 'mm', 'a4');

        // --- Drawing context ---
        var ctx = {
            y:    0,
            lang: lang,
            mode: mode,
            L:    LABELS[lang],
        };

        // --- Dispatch to mode-specific page composers ---
        if (mode === 'client') {
            drawHeader(doc, ctx);
            renderClientPage1(doc, ctx, normalized);
            doc.addPage();
            drawHeader(doc, ctx);
            renderClientPage2(doc, ctx, normalized);
            doc.addPage();
            drawHeader(doc, ctx);
            renderClientPage3(doc, ctx, normalized);
            doc.addPage();
            drawHeader(doc, ctx);
            renderClientPage4(doc, ctx, normalized);
        } else {
            drawHeader(doc, ctx);
            renderStudyPage1(doc, ctx, normalized);
            doc.addPage();
            drawHeader(doc, ctx);
            renderStudyPage2(doc, ctx, normalized);
            doc.addPage();
            drawHeader(doc, ctx);
            renderStudyPage3(doc, ctx, normalized);
            doc.addPage();
            drawHeader(doc, ctx);
            renderStudyPage4(doc, ctx, normalized);
        }

        // --- Draw footers on pages 2+ (no footer on cover/page 1) ---
        var totalPages = doc.getNumberOfPages();
        for (var p = 2; p <= totalPages; p++) {
            doc.setPage(p);
            drawFooter(doc, ctx, p, totalPages);
        }

        // --- Save ---
        var filename = 'solardataatlas-'
            + (mode === 'study' ? 'etude' : 'rapport')
            + '-' + lang
            + '.pdf';
        doc.save(filename);

        console.log('[pdf-generator] PDF generated: ' + filename + ' (' + totalPages + ' pages, mode=' + mode + ', lang=' + lang + ')');
    }

    // --- Expose public API ---
    window.generateSimulationPdf = generateSimulationPdf;

    // --- Expose internals for testing (optional, remove in production) ---
    window._pdfGen = {
        clean:                  clean,
        fmtNum:                 fmtNum,
        normalizeSimulationData: normalizeSimulationData,
        LABELS:                 LABELS,
        C:                      C,
        drawHeader:             drawHeader,
        drawFooter:             drawFooter,
        drawSectionTitle:       drawSectionTitle,
        drawCompactTable:       drawCompactTable,
        drawKpiCards:           drawKpiCards,
        drawVerdictBlock:       drawVerdictBlock,
        checkPageBreak:         checkPageBreak,
    };

})();
