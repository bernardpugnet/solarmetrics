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
    var FOOTER_Y = PAGE_H - 8;         // footer baseline
    var CONTENT_START_Y = 38;           // first content Y after header
    var PAGE_BOTTOM = PAGE_H - 16;      // safe bottom before footer

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

            // Misc
            no:           'Non',
            notReached:   'Non atteint',
            disclaimer:   'Ce rapport est une estimation indicative basee sur les donnees PVGIS (Commission europeenne) et les parametres moyens du pays. Les resultats reels peuvent varier selon l\'ombrage, la qualite de l\'installation, la meteo et l\'evolution des tarifs.',
            footer:       'Solar Data Atlas (c) 2024-2026 Bernard Pugnet - Donnees PVGIS - Simulation indicative, non contractuelle.',

            // Glossary
            glossary: [
                ['kWc', 'Kilowatt-crete : puissance maximale d\'un panneau en conditions standard (1 000 W/m2, 25 C).'],
                ['kWh', 'Kilowattheure : unite d\'energie. 1 kWh = 1 000 watts pendant 1 heure.'],
                ['Gains nets', 'Somme cumulee des gains nets sur 25 ans (non actualisee).'],
                ['TRI', 'Taux de Rentabilite Interne : rendement annuel equivalent. A comparer a un placement bancaire (~3 %).'],
                ['PVGIS', 'Base de donnees europeenne d\'irradiation solaire (Commission europeenne).'],
                ['Autoconso.', 'Part de la production solaire utilisee sur place plutot qu\'injectee au reseau.'],
                ['Couverture sol.', 'Part de la consommation totale couverte par le solaire (autoproduction directe + batterie).'],
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
            lblConsoInput:     'Stated consumption',
            lblConsoSimulated: 'Total consumption (with addons)',
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

            // Misc
            no:           'No',
            notReached:   'Not reached',
            disclaimer:   'This report is an indicative estimate based on PVGIS data (European Commission) and country-average parameters. Actual results may vary depending on shading, installation quality, weather and tariff evolution.',
            footer:       'Solar Data Atlas (c) 2024-2026 Bernard Pugnet - PVGIS data - Indicative simulation, non-contractual.',

            // Glossary
            glossary: [
                ['kWp', 'Kilowatt-peak: maximum panel power under standard conditions (1,000 W/m2, 25 C).'],
                ['kWh', 'Kilowatt-hour: unit of energy. 1 kWh = 1,000 watts for 1 hour.'],
                ['Net gains', 'Cumulative net gains over 25 years (non-discounted).'],
                ['IRR', 'Internal Rate of Return: equivalent annual return. Compare with bank deposits (~3%).'],
                ['PVGIS', 'European solar irradiation database (European Commission).'],
                ['Self-cons.', 'Share of solar production used on-site rather than injected to the grid.'],
                ['Solar cov.', 'Share of total consumption covered by solar (direct self-consumption + battery).'],
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
     * Draws the footer on a given page.
     * Does NOT mutate ctx.y.
     */
    function drawFooter(doc, ctx, pageNum, totalPages) {
        var L = ctx.L;
        doc.setFontSize(6.5);
        doc.setTextColor.apply(doc, C.muted);
        doc.text(clean(L.footer), M, FOOTER_Y);
        doc.text(pageNum + ' / ' + totalPages, PAGE_W - M, FOOTER_Y, { align: 'right' });
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

    /** Client page 1: Decision summary (verdict + KPIs + config) */
    function renderClientPage1(doc, ctx, data) {
        // TODO Step 3: implement
    }

    /** Client page 2: Technical & financial analysis */
    function renderClientPage2(doc, ctx, data) {
        // TODO Step 3: implement
    }

    /** Client page 3: Narrative + battery comparison */
    function renderClientPage3(doc, ctx, data) {
        // TODO Step 4: implement
    }

    /** Client page 4: Sensitivity + glossary + disclaimer */
    function renderClientPage4(doc, ctx, data) {
        // TODO Step 4: implement
    }

    // --- Study mode ---

    /** Study page 1: Project identification + technical parameters */
    function renderStudyPage1(doc, ctx, data) {
        // TODO Step 6: implement
    }

    /** Study page 2: Production & self-consumption analysis */
    function renderStudyPage2(doc, ctx, data) {
        // TODO Step 6: implement
    }

    /** Study page 3: Financial analysis + sensitivity */
    function renderStudyPage3(doc, ctx, data) {
        // TODO Step 6: implement
    }

    /** Study page 4: Conclusion + annexes */
    function renderStudyPage4(doc, ctx, data) {
        // TODO Step 6: implement
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

        // --- Draw footers on all pages ---
        var totalPages = doc.getNumberOfPages();
        for (var p = 1; p <= totalPages; p++) {
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
