/**
 * pdf-generator.js — Solar Data Atlas
 * v2 PDF generator for solar simulation reports
 *
 * Dependencies: jsPDF 2.5.1 (UMD, loaded via CDN in HTML)
 * Data source:  window.lastSimulationData (built by calculateDetailed / generateVerdict / updateSensitivity)
 *
 * Public API:
 *   window.generateSimulationPdf(data, { mode, lang })
 *     mode: 'v2' (only)
 *     lang: 'fr' | 'en'  (takes precedence over data.meta.lang)
 *
 * Architecture:
 *   1. Constants (palette, dimensions, margins)
 *   2. LABELS object (FR/EN bilingual strings)
 *   3. clean() — unicode sanitizer
 *   4. fmtNum() — locale-aware number formatting
 *   5. normalizeSimulationData(rawData) — adds displayFlags layer
 *   6. Low-level draw helpers (header, footer, section, table, kpi, verdict, pageBreak)
 *   7. Page composers — v2 pages 1–6
 *   8. Entry point — generateSimulationPdf()
 *
 * @version 2.1.0
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
            profileDescFamily:      'faible presence en journee, ~4h/jour',
            profileDescRetired:     'presence moyenne en journee, ~8h/jour',
            profileDescTelecommute: 'forte presence en journee, ~9h/jour',
            profileDescAllElectric: 'chauffage electrique / PAC, ~10h/jour',

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

            // Misc
            no:           'Non',
            notReached:   'Non atteint',
            disclaimer:   'Ce rapport est une estimation indicative basee sur les donnees PVGIS (Commission europeenne) et les parametres moyens du pays. Les resultats reels peuvent varier selon l\'ombrage, la qualite de l\'installation, la meteo et l\'evolution des tarifs.',
            footer:       'Solar Data Atlas (c) 2024-2026 Bernard Pugnet - Donnees PVGIS - Simulation indicative, non contractuelle.',
            footerLine1:  'Solar Data Atlas \u2014 rapport realise par Bernard Pugnet',
            footerLine2:  'Pour plus d\'informations : +33 6 02 19 94 81',

            // Cover page (v2)
            coverReportTitle:  'Rapport de simulation solaire',
            coverStudyTitle:   'Etude technico-economique',
            coverSubtitle:     'Analyse personnalisee de rentabilite photovoltaique',
            coverLocation:     'Localisation',
            coverPower:        'Puissance',
            coverDate:         'Date de generation',
            coverPanelType:    'Type de panneaux',
            coverCoordinates:  'Coordonnees',
            coverOrientation:  'Orientation / Inclinaison',
            coverBattery:      'Batterie',
            coverConsumption:  'Consommation',
            coverEquipment:    'Equipements simules :',
            coverEditor:       'Solar Data Atlas \u2014 Bernard Pugnet',
            coverTocTitle:     'Sommaire',
            coverToc1:         'Presentation',
            coverToc2:         'Synthese financiere',
            coverToc3:         'Autoconsommation detaillee',
            coverToc4:         'Comparaison batterie & aides',
            coverToc5:         'Rapport d\'analyse',
            coverToc6:         'Hypotheses & methode',

            // v2 section titles
            v2SynthesisTitle:  'Synthese du projet',
            v2ConfigTitle:     'Configuration de l\'installation',
            v2ProfileNote:     'Le profil de consommation determine la repartition horaire de votre consommation entre le jour et la nuit. Il influence directement le taux d\'autoconsommation : plus vous etes present en journee, plus vous consommez votre propre production solaire.',
            v2ProductionTitle: 'Production solaire',
            v2AutoconsoTitle:  'Autoconsommation detaillee',
            v2ConsoBoxTitle:   'Consommation simulee',
            v2ConsoBoxBase:    'La consommation annuelle actuelle est de',
            v2ConsoBoxAddons:  'Equipements a venir :',
            v2ConsoBoxResult:  'Le total simule est de',
            v2ConsoBoxNoChange:'Aucun equipement a venir ajoute. La consommation simulee correspond a la consommation actuelle.',
            v2AddonEv:         'Vehicule electrique',
            v2AddonPac:        'Pompe a chaleur',
            v2AddonEcs:        'Chauffe-eau thermodynamique',
            v2AddonAc:         'Climatisation',
            v2AddonPool:       'Piscine',

            // v2 page 2 — financial summary
            v2PageTitle2:      'Synthese financiere',
            p2ProductionSavings: 'Production & Economies',
            p2Investment:      'Investissement & Rentabilite',

            // v2 page 3 — self-consumption details
            v2PageTitle3:      'Autoconsommation detaillee',
            p3MonthlyTitle:    'Bilan mensuel',

            // v2 page 4 — battery & subsidies
            v2PageTitle4:      'Comparaison batterie & aides',
            p4BatteryComparison: 'Comparaison avec / sans batterie',
            p4Subsidies:       'Aides et subventions',
            p4SubsidyNote:     'Dispositifs applicables',
            p4SystemRecap:     'Recapitulatif systeme',
            p4NoSubsidy:       'Aucune aide deduite dans cette simulation.',

            // v2 page 5 — analysis report
            v2PageTitle5:      'Rapport d\'analyse',
            p5ReportTitle:     'Rapport d\'analyse solaire',

            // v2 page 6 — assumptions & method
            v2PageTitle6:      'Hypotheses & methode',

            // v2 page intros (pages 2–6)
            v2IntroP2: 'Cette page presente une lecture d\'ensemble du projet a partir du verdict, des principaux indicateurs de performance et de la configuration retenue. Elle permet d\'apprecier rapidement si l\'installation parait coherente avec votre profil de consommation et vos objectifs.',
            v2IntroP3: 'Cette page detaille la production solaire attendue, la repartition des flux d\'energie et le niveau d\'autoconsommation du systeme. Elle precise egalement comment la consommation a ete modelisee afin de rendre les resultats plus lisibles et plus comparables.',
            v2IntroP4: 'Cette page presente les principaux equilibres financiers du projet : investissement, economies annuelles, temps de retour et gains sur la duree d\'analyse. Elle permet aussi d\'apprecier l\'impact specifique de la batterie sur la rentabilite globale de l\'installation.',
            v2IntroP5: 'Cette page propose une lecture interpretative des resultats en mettant en evidence les elements qui soutiennent le projet, ceux qui le limitent, ainsi que les verifications utiles avant engagement. Elle vise a transformer les chiffres du rapport en points de vigilance concrets.',
            v2IntroP6: 'Cette page explicite les hypotheses retenues pour la simulation, la methode de calcul utilisee et les principales limites du modele. Elle replace les resultats dans leur cadre technique et rappelle leur caractere indicatif.',

            // v2 page 2 — financial analysis
            v2FinancialTitle:  'Bilan financier',
            v2SavingsTitle:    'Economies annuelles',
            v2BatteryTitle:    'Impact de la batterie',
            v2CostPv:          'Cout installation PV',
            v2CostBattery:     'Cout batterie',
            v2CostTotal:       'Investissement total',
            v2Subsidies:       'Aides deduites',
            v2Co2Note:         'Empreinte carbone evitee',

            // v2 page 5 — decision analysis
            v2DecisionTitle:   'Analyse et aide a la decision',

            // v2 page 6 — assumptions, method, limits
            v2HypothesesTitle: 'Hypotheses, methode et limites',
            v2SensitivityNote: 'Les resultats de cette simulation dependent principalement de quatre facteurs : le prix futur de l\'electricite, la degradation reelle des panneaux, la degradation de la batterie (si presente), et l\'adequation du profil de consommation retenu avec vos usages reels.',

            // Months
            months: ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'],

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
            profileDescFamily:      'low daytime presence, ~4h/day',
            profileDescRetired:     'medium daytime presence, ~8h/day',
            profileDescTelecommute: 'high daytime presence, ~9h/day',
            profileDescAllElectric: 'electric heating / heat pump, ~10h/day',

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

            // Misc
            no:           'No',
            notReached:   'Not reached',
            disclaimer:   'This report is an indicative estimate based on PVGIS data (European Commission) and country-average parameters. Actual results may vary depending on shading, installation quality, weather and tariff evolution.',
            footer:       'Solar Data Atlas (c) 2024-2026 Bernard Pugnet - PVGIS data - Indicative simulation, non-contractual.',
            footerLine1:  'Solar Data Atlas \u2014 report by Bernard Pugnet',
            footerLine2:  'For more information: +33 6 02 19 94 81',

            // Cover page (v2)
            coverReportTitle:  'Solar Simulation Report',
            coverStudyTitle:   'Techno-Economic Feasibility Study',
            coverSubtitle:     'Personalised photovoltaic profitability analysis',
            coverLocation:     'Location',
            coverPower:        'Capacity',
            coverDate:         'Generated on',
            coverPanelType:    'Panel type',
            coverCoordinates:  'Coordinates',
            coverOrientation:  'Orientation / Tilt',
            coverBattery:      'Battery',
            coverConsumption:  'Consumption',
            coverEquipment:    'Simulated equipment:',
            coverEditor:       'Solar Data Atlas \u2014 Bernard Pugnet',
            coverTocTitle:     'Contents',
            coverToc1:         'Overview',
            coverToc2:         'Financial summary',
            coverToc3:         'Self-consumption details',
            coverToc4:         'Battery comparison & subsidies',
            coverToc5:         'Analysis report',
            coverToc6:         'Assumptions & method',

            // v2 section titles
            v2SynthesisTitle:  'Project summary',
            v2ConfigTitle:     'Installation configuration',
            v2ProfileNote:     'The consumption profile determines the hourly distribution of your electricity usage between day and night. It directly affects the self-consumption rate: the more you are home during the day, the more you use your own solar production.',
            v2ProductionTitle: 'Solar production',
            v2AutoconsoTitle:  'Self-consumption details',
            v2ConsoBoxTitle:   'Simulated consumption',
            v2ConsoBoxBase:    'Current annual consumption is',
            v2ConsoBoxAddons:  'Planned equipment:',
            v2ConsoBoxResult:  'Simulated total is',
            v2ConsoBoxNoChange:'No planned equipment added. Simulated consumption matches your current consumption.',
            v2AddonEv:         'Electric vehicle',
            v2AddonPac:        'Heat pump',
            v2AddonEcs:        'Thermodynamic water heater',
            v2AddonAc:         'Air conditioning',
            v2AddonPool:       'Swimming pool',

            // v2 page 2 — financial summary
            v2PageTitle2:      'Financial summary',
            p2ProductionSavings: 'Production & Savings',
            p2Investment:      'Investment & Returns',

            // v2 page 3 — self-consumption details
            v2PageTitle3:      'Self-consumption details',
            p3MonthlyTitle:    'Monthly summary',

            // v2 page 4 — battery & subsidies
            v2PageTitle4:      'Battery comparison & subsidies',
            p4BatteryComparison: 'Comparison with / without battery',
            p4Subsidies:       'Subsidies and incentives',
            p4SubsidyNote:     'Applicable schemes',
            p4SystemRecap:     'System summary',
            p4NoSubsidy:       'No subsidies deducted in this simulation.',

            // v2 page 5 — analysis report
            v2PageTitle5:      'Analysis report',
            p5ReportTitle:     'Solar analysis report',

            // v2 page 6 — assumptions & method
            v2PageTitle6:      'Assumptions & method',

            // v2 page intros (pages 2–6)
            v2IntroP2: 'This page provides an overall reading of the project based on the verdict, the main performance indicators and the selected system configuration. It allows a quick assessment of whether the installation is broadly consistent with your consumption profile and objectives.',
            v2IntroP3: 'This page details expected solar production, energy flows and the level of self-consumption achieved by the system. It also explains how consumption was modeled in order to make the results easier to read and compare.',
            v2IntroP4: 'This page presents the project\'s main financial balances: investment, annual savings, payback period and gains over the analysis horizon. It also helps assess the specific impact of the battery on overall project profitability.',
            v2IntroP5: 'This page provides an interpretative reading of the results by highlighting what supports the project, what limits it, and which checks remain useful before committing. Its purpose is to turn the report\'s figures into concrete decision points.',
            v2IntroP6: 'This page explains the assumptions used for the simulation, the calculation method and the model\'s main limitations. It places the results in their technical context and reminds the reader of their indicative nature.',

            // v2 page 2 — financial analysis
            v2FinancialTitle:  'Financial summary',
            v2SavingsTitle:    'Annual savings breakdown',
            v2BatteryTitle:    'Battery impact',
            v2CostPv:          'PV installation cost',
            v2CostBattery:     'Battery cost',
            v2CostTotal:       'Total investment',
            v2Subsidies:       'Subsidies deducted',
            v2Co2Note:         'Carbon footprint avoided',

            // v2 page 5 — decision analysis
            v2DecisionTitle:   'Analysis and decision support',

            // v2 page 6 — assumptions, method, limits
            v2HypothesesTitle: 'Assumptions, method and limitations',
            v2SensitivityNote: 'The results of this simulation depend primarily on four factors: the future price of electricity, the actual degradation of solar panels, battery degradation (if applicable), and how well the selected consumption profile matches your real usage patterns.',

            // Months
            months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],

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

            /** Financial data available (from simulator check) */
            financialAvailable: rawData.financialAvailable !== false,
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
        var subtitle = L.reportSubtitle;
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
     * Draws a short editorial introduction below the section title.
     * Style: small italic grey text, no box, no background.
     * Typically ~8-10mm height for 2 sentences.
     */
    function drawPageIntro(doc, ctx, text) {
        if (!text) return;
        doc.setFontSize(7.5);
        doc.setTextColor(130, 140, 155);
        doc.setFont('helvetica', 'italic');
        var lines = doc.splitTextToSize(clean(text), PAGE_W - 2 * M);
        doc.text(lines, M, ctx.y);
        ctx.y += lines.length * 3.2 + 3;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor.apply(doc, C.dark);
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
     * Draws the disclaimer in a subtle background box
     */
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

    /**
     * Draws the battery comparison section.
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
        var descMap = {
            'family':       L.profileDescFamily,
            'retired':      L.profileDescRetired,
            'telecommute':  L.profileDescTelecommute,
            'allElectric':  L.profileDescAllElectric,
        };
        var name = map[key] || key;
        var desc = descMap[key];
        return desc ? name + ' (' + desc + ')' : name;
    }

    /**
     * Returns a human-readable panel type string from efficiency value.
     * e.g. 0.20 → "Monocristallin — 20 %"
     */
    function panelTypeLabel(efficiency, lang) {
        var pct = Math.round((efficiency || 0.20) * 100);
        var type = lang === 'fr' ? 'Monocristallin' : 'Monocrystalline';
        return type + ' — ' + pct + ' %';
    }


    // =================================================================
    //  7. PAGE COMPOSERS (v2)
    // =================================================================

    /**
     * Renders the cover page (page 1) for the v2 report.
     * Light/white design matching the validated mock:
     *   - Amber accent bar at top (4mm)
     *   - Centered logo + subtitle
     *   - Info card with all system details
     *   - Equipment list (if addons)
     *   - Verdict banner (green/amber/red)
     *   - Footer editor mention
     */
    function renderCoverPage(doc, ctx, data) {
        var L = ctx.L;
        var lang = ctx.lang;
        var cfg = data.config || {};
        var bat = data.battery || {};
        var flags = data.displayFlags || {};
        var verdict = data.verdict;
        var fin = data.financial || {};
        var prod = data.production || {};

        // -------------------------------------------------------
        //  Amber accent bar — top 4mm
        // -------------------------------------------------------
        doc.setFillColor.apply(doc, C.amber);
        doc.rect(0, 0, PAGE_W, 4, 'F');

        // -------------------------------------------------------
        //  Logo area — centered
        // -------------------------------------------------------
        doc.setFontSize(26);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor.apply(doc, C.dark);
        doc.text('Solar Data Atlas', PAGE_W / 2, 28, { align: 'center' });

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor.apply(doc, C.slate);
        doc.text(clean(L.coverReportTitle), PAGE_W / 2, 38, { align: 'center' });

        // -------------------------------------------------------
        //  Info card — rounded rect with system details
        // -------------------------------------------------------
        var cardX = 25;
        var cardW = PAGE_W - 50;
        var cardTop = 50;

        // Build info lines
        var locationStr = cfg.countryName || '';
        if (cfg.city) locationStr = cfg.city + ', ' + locationStr;
        var coordStr = '';
        if (cfg.lat && cfg.lon) {
            coordStr = fmtNum(cfg.lat, 4, lang) + ', ' + fmtNum(cfg.lon, 4, lang);
        }
        var powerStr = fmtNum(cfg.kwc, 1, lang) + ' ' + L.unitKwc;
        if (cfg.surface) powerStr += ' — ' + fmtNum(cfg.surface, 0, lang) + ' ' + L.unitM2;
        var orientStr = orientLabel(cfg.orientation, L) + ' / ' + fmtNum(cfg.tilt, 0, lang) + '\u00b0';
        var batteryStr = flags.hasBattery
            ? fmtNum(bat.capacityKwh, 1, lang) + ' ' + L.unitKwh
            : L.no;
        var consoStr = fmtNum(prod.totalConsumption || cfg.consumption, 0, lang) + ' ' + L.unitKwh + '/' + (lang === 'fr' ? 'an' : 'yr');

        var infoLines = [
            [L.coverLocation,    locationStr],
            [L.coverCoordinates, coordStr],
            [L.coverPower,       powerStr],
            [L.coverPanelType,   panelTypeLabel(cfg.panelEfficiency, lang)],
            [L.coverOrientation, orientStr],
            [L.coverBattery,     batteryStr],
            [L.coverConsumption, consoStr],
        ];

        var lineH = 7.5;
        var cardH = 10 + infoLines.length * lineH + 4;

        // Card background
        doc.setFillColor.apply(doc, C.bgCard);
        doc.setDrawColor.apply(doc, C.light);
        doc.setLineWidth(0.3);
        doc.roundedRect(cardX, cardTop, cardW, cardH, 3, 3, 'FD');

        // Card content
        var labelX = cardX + 5;
        var valueX = cardX + 55;
        var iy = cardTop + 9;

        for (var i = 0; i < infoLines.length; i++) {
            var lbl = infoLines[i][0];
            var val = infoLines[i][1];
            doc.setFontSize(8);
            doc.setTextColor.apply(doc, C.slate);
            doc.setFont('helvetica', 'normal');
            doc.text(clean(lbl), labelX, iy);
            doc.setTextColor.apply(doc, C.dark);
            doc.setFont('helvetica', 'bold');
            doc.text(clean(val), valueX, iy);
            iy += lineH;
        }

        var currentY = cardTop + cardH + 6;

        // -------------------------------------------------------
        //  Equipment list (addons) — if any
        // -------------------------------------------------------
        var addons = cfg.addons || [];
        var ra = cfg.resolvedAddons || {};
        if (addons.length > 0) {
            var addonMap = {
                ev:   L.v2AddonEv,
                pac:  L.v2AddonPac,
                ecs:  L.v2AddonEcs,
                ac:   L.v2AddonAc,
                pool: L.v2AddonPool,
            };

            doc.setFontSize(9);
            doc.setTextColor.apply(doc, C.dark);
            doc.setFont('helvetica', 'bold');
            doc.text(clean(L.coverEquipment), cardX + 5, currentY);
            currentY += 5;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor.apply(doc, C.slate);
            for (var a = 0; a < addons.length; a++) {
                var key = addons[a];
                var addonName = addonMap[key] || key;
                var kwhStr = '';
                if (ra[key] && ra[key].annualKwh) {
                    kwhStr = ' : ' + fmtNum(ra[key].annualKwh, 0, lang) + ' ' + L.unitKwh + '/' + (lang === 'fr' ? 'an' : 'yr');
                }
                doc.text(clean('- ' + addonName + kwhStr), cardX + 10, currentY);
                currentY += 5;
            }
            currentY += 4;
        }

        // -------------------------------------------------------
        //  Table of contents — compact
        // -------------------------------------------------------
        currentY += 2;
        doc.setFontSize(11);
        doc.setTextColor.apply(doc, C.dark);
        doc.setFont('helvetica', 'bold');
        doc.text(clean(L.coverTocTitle), M, currentY);
        currentY += 3;
        doc.setDrawColor.apply(doc, C.amber);
        doc.setLineWidth(0.6);
        doc.line(M, currentY, M + 25, currentY);
        currentY += 7;

        var tocItems = [
            L.coverToc1, L.coverToc2, L.coverToc3,
            L.coverToc4, L.coverToc5, L.coverToc6,
        ];

        doc.setFont('helvetica', 'normal');
        for (var t = 0; t < tocItems.length; t++) {
            var pageNum = t + 1;
            // Number
            doc.setFontSize(9);
            doc.setTextColor.apply(doc, C.amber);
            doc.setFont('helvetica', 'bold');
            doc.text(String(pageNum) + '.', M + 2, currentY);
            // Title
            doc.setTextColor.apply(doc, C.dark);
            doc.setFont('helvetica', 'normal');
            doc.text(clean(tocItems[t]), M + 12, currentY);
            // Dots + page num
            doc.setFontSize(7.5);
            doc.setTextColor.apply(doc, C.muted);
            doc.text(String(pageNum), PAGE_W - M, currentY, { align: 'right' });
            var tw = doc.getTextWidth(clean(tocItems[t]));
            var dStart = M + 12 + tw + 2;
            var dEnd = PAGE_W - M - 8;
            if (dEnd > dStart) {
                doc.setDrawColor.apply(doc, C.light);
                doc.setLineWidth(0.2);
                doc.setLineDashPattern([0.5, 1.5], 0);
                doc.line(dStart, currentY + 1, dEnd, currentY + 1);
                doc.setLineDashPattern([], 0);
            }
            currentY += 9;
        }

        // -------------------------------------------------------
        //  Verdict banner — bottom area
        // -------------------------------------------------------
        if (flags.hasVerdict && verdict) {
            var bannerY = Math.max(currentY + 6, 230);
            var bannerH = 18;
            var bannerX = 25;
            var bannerW = PAGE_W - 50;

            // Determine colors based on verdict level
            var vBorder = C.amber;
            var vBg = C.bgAmber;
            var vIcon = '?';
            if (verdict.level === 'good') {
                vBorder = C.green; vBg = C.bgGreen; vIcon = 'OK';
            } else if (verdict.level === 'poor') {
                vBorder = C.red; vBg = C.bgRed; vIcon = '!';
            }

            doc.setFillColor.apply(doc, vBg);
            doc.setDrawColor.apply(doc, vBorder);
            doc.setLineWidth(0.8);
            doc.roundedRect(bannerX, bannerY, bannerW, bannerH, 3, 3, 'FD');

            // Verdict title — centered
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor.apply(doc, vBorder);
            doc.text(clean(vIcon + '  ' + (verdict.title || '')), PAGE_W / 2, bannerY + 8, { align: 'center' });

            // Subtitle line — payback + annual savings
            var subParts = [];
            if (fin.payback !== null && fin.payback !== undefined && fin.payback < 50) {
                var paybackLabel = lang === 'fr' ? 'Retour sur investissement en ' : 'Payback in ';
                subParts.push(paybackLabel + fmtNum(fin.payback, 1, lang) + ' ' + (lang === 'fr' ? 'ans' : 'years'));
            }
            if (fin.annualSavings) {
                var savingsLabel = lang === 'fr' ? 'Economies annuelles : ' : 'Annual savings: ';
                subParts.push(savingsLabel + fmtNum(fin.annualSavings, 0, lang) + ' ' + L.unitEur);
            }
            if (subParts.length > 0) {
                doc.setFontSize(7.5);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor.apply(doc, C.slate);
                doc.text(clean(subParts.join(' — ')), PAGE_W / 2, bannerY + 14, { align: 'center' });
            }
        }

        // -------------------------------------------------------
        //  Footer — editor mention
        // -------------------------------------------------------
        doc.setFontSize(7.5);
        doc.setTextColor.apply(doc, C.muted);
        doc.text(clean(L.coverEditor), PAGE_W / 2, 282, { align: 'center' });
    }

    /**
     * Renders v2 page 2: "Synthese financiere" / "Financial summary"
     * Structure:
     *   1. Section "Production & Economies" with 2 rows of 3 KPI cards
     *   2. Section "Investissement & Rentabilite" with 2 rows of 3 KPI cards
     */
    function renderV2Page2(doc, ctx, data) {
        var L = ctx.L;
        var lang = ctx.lang;
        var fin = data.financial;
        var fp = data.financialParams;
        var prod = data.production;

        // --- Section 1: Production & Economies ---
        drawSectionTitle(doc, ctx, L.p2ProductionSavings);
        drawPageIntro(doc, ctx, L.v2IntroP2);

        // Row 1: Production, Rendement, Puissance
        drawKpiCards(doc, ctx, [
            { label: L.lblAnnualProd,   value: fmtNum(prod.annual, 0, lang), unit: L.unitKwhAn, accent: C.green },
            { label: L.lblProdPerKwc,   value: fmtNum(prod.perKwc, 0, lang), unit: L.unitKwhKwc, accent: C.green },
            { label: L.lblPower,        value: fmtNum(fp.installedCapacity || data.config.kwc, 1, lang), unit: L.unitKwc, accent: C.green },
        ]);

        // Row 2: Eco. autoconso, Revente surplus, Total annuel
        drawKpiCards(doc, ctx, [
            { label: L.lblSavingsAuto,   value: fmtNum(fin.savingsAutoconso, 0, lang), unit: L.unitEurAn, accent: C.amber },
            { label: L.lblSavingsFeedin,  value: fmtNum(fin.savingsFeedin, 0, lang), unit: L.unitEurAn, accent: C.amber },
            { label: L.lblSavingsTotal,   value: fmtNum(fin.annualSavings, 0, lang), unit: L.unitEurAn, accent: C.green },
        ]);

        ctx.y += 4;

        // --- Section 2: Investissement & Rentabilite ---
        drawSectionTitle(doc, ctx, L.p2Investment);

        var paybackVal = fin.payback !== null ? fmtNum(fin.payback, 1, lang) : L.notReached;
        var irrVal = fin.irr !== null ? fmtNum(fin.irr * 100, 1, lang) : '\u2014';

        // Row 1: Cout install. (brut), Cout net apres aides, Temps retour
        checkPageBreak(doc, ctx, 35);
        drawKpiCards(doc, ctx, [
            { label: L.v2CostPv,         value: fmtNum(fp.installCost, 0, lang), unit: L.unitEur, accent: C.slate },
            { label: L.lblNetCost,       value: fmtNum(fp.netCost, 0, lang), unit: L.unitEur, accent: C.slate },
            { label: L.lblPayback,       value: paybackVal, unit: L.unitYears, accent: C.amber },
        ]);

        // Row 2: Gains nets 25 ans, TRI, CO2 evite
        drawKpiCards(doc, ctx, [
            { label: L.lblTotalGains,    value: fmtNum(fin.totalSavings25y, 0, lang), unit: L.unitEur, accent: C.green },
            { label: L.lblIrr,           value: irrVal, unit: L.unitPercent, accent: C.green },
            { label: L.lblCo2,           value: fmtNum(fin.co2Avoided, 0, lang), unit: L.unitKgAn, accent: C.green },
        ]);
    }

    /**
     * Renders v2 page 3: "Autoconsommation detaillee" / "Self-consumption details"
     * Structure:
     *   1. 6 KPI cards in 2 rows
     *   2. Monthly table with Mois | Production | Consommation | Auto % | Injection
     */
    function renderV2Page3(doc, ctx, data) {
        var L = ctx.L;
        var lang = ctx.lang;
        var prod = data.production;

        // --- Section: Autoconsommation details ---
        drawSectionTitle(doc, ctx, L.v2AutoconsoTitle);
        drawPageIntro(doc, ctx, L.v2IntroP3);

        // Row 1: Taux autoconso, Couverture solaire, Auto-directe
        drawKpiCards(doc, ctx, [
            { label: L.lblAutoRate,   value: fmtNum(prod.autoconsoRate, 1, lang), unit: L.unitPercent, accent: C.amber },
            { label: L.lblProdRate,   value: fmtNum(prod.autoprodRate, 1, lang), unit: L.unitPercent, accent: C.amber },
            { label: L.lblAutoDirect, value: fmtNum(prod.autoDirect, 0, lang), unit: L.unitKwh, accent: C.green },
        ]);

        // Row 2: Auto-batterie, Injection, Soutirage
        drawKpiCards(doc, ctx, [
            { label: L.lblAutoBattery, value: fmtNum(prod.autoBattery, 0, lang), unit: L.unitKwh, accent: C.green },
            { label: L.lblInjection,   value: fmtNum(prod.injection, 0, lang), unit: L.unitKwh, accent: C.slate },
            { label: L.lblSoutirage,   value: fmtNum(prod.soutirage, 0, lang), unit: L.unitKwh, accent: C.slate },
        ]);

        ctx.y += 6;

        // --- Monthly table ---
        checkPageBreak(doc, ctx, 75);
        drawSectionTitle(doc, ctx, L.p3MonthlyTitle);

        var monthlyProd = prod.monthly && prod.monthly.production ? prod.monthly.production : [];
        var monthlyConso = prod.monthly && prod.monthly.consumption ? prod.monthly.consumption : [];
        var monthlyAutoDirect = prod.monthly && prod.monthly.autoDirect ? prod.monthly.autoDirect : [];
        var monthlyAutoBat = prod.monthly && prod.monthly.autoBattery ? prod.monthly.autoBattery : [];
        var monthlyInj = prod.monthly && prod.monthly.injection ? prod.monthly.injection : [];

        var months = L.months;
        if (!months) {
            months = lang === 'fr'
                ? ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec']
                : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        }

        // Table header
        var colW = (PAGE_W - 2 * M) / 5;
        var tableX = M;
        var tableHeaderY = ctx.y;

        doc.setFillColor.apply(doc, C.dark);
        doc.rect(tableX, tableHeaderY - 1, PAGE_W - 2 * M, 6, 'F');
        doc.setFontSize(7);
        doc.setTextColor.apply(doc, C.white);
        doc.setFont('helvetica', 'bold');
        doc.text(L.month || 'Mois', tableX + colW / 2, tableHeaderY + 2.5, { align: 'center' });
        doc.text(L.lblAnnualProd, tableX + colW + colW / 2, tableHeaderY + 2.5, { align: 'center' });
        doc.text(L.lblConsoInput || 'Consommation', tableX + 2 * colW + colW / 2, tableHeaderY + 2.5, { align: 'center' });
        doc.text(L.lblAutoRate, tableX + 3 * colW + colW / 2, tableHeaderY + 2.5, { align: 'center' });
        doc.text(L.lblInjection, tableX + 4 * colW + colW / 2, tableHeaderY + 2.5, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        ctx.y = tableHeaderY + 8;

        // Table rows
        for (var m = 0; m < 12; m++) {
            if (ctx.y > PAGE_BOTTOM - 5) {
                doc.addPage();
                drawHeader(doc, ctx);
            }

            var rowBg = m % 2 === 0 ? C.bgCard : C.white;
            doc.setFillColor.apply(doc, rowBg);
            doc.rect(tableX, ctx.y - 1, PAGE_W - 2 * M, 5, 'F');

            doc.setFontSize(7);
            doc.setTextColor.apply(doc, C.dark);

            var autoPercent = monthlyProd[m] > 0 ? ((monthlyAutoDirect[m] + monthlyAutoBat[m]) / monthlyProd[m] * 100) : 0;

            doc.text(months[m], tableX + colW / 2, ctx.y + 2.5, { align: 'center' });
            doc.text(fmtNum(monthlyProd[m], 0, lang), tableX + colW + colW / 2, ctx.y + 2.5, { align: 'center' });
            doc.text(fmtNum(monthlyConso[m], 0, lang), tableX + 2 * colW + colW / 2, ctx.y + 2.5, { align: 'center' });
            doc.text(fmtNum(autoPercent, 1, lang) + '%', tableX + 3 * colW + colW / 2, ctx.y + 2.5, { align: 'center' });
            doc.text(fmtNum(monthlyInj[m], 0, lang), tableX + 4 * colW + colW / 2, ctx.y + 2.5, { align: 'center' });

            ctx.y += 5;
        }

        ctx.y += 4;
    }

    /**
     * Renders v2 page 4: "Comparaison batterie & aides" / "Battery comparison & subsidies"
     * Structure:
     *   1. Battery comparison table (if battery enabled)
     *   2. Subsidies section
     *   3. System recap table
     */
    function renderV2Page4(doc, ctx, data) {
        var L = ctx.L;
        var lang = ctx.lang;
        var fin = data.financial;
        var fp = data.financialParams;
        var flags = data.displayFlags;

        drawSectionTitle(doc, ctx, L.v2PageTitle4);
        drawPageIntro(doc, ctx, L.v2IntroP4);

        // --- Battery comparison (if battery enabled) ---
        if (flags.hasBatteryComparison) {
            drawBatteryComparison(doc, ctx, data);
        }

        // --- Subsidies section ---
        checkPageBreak(doc, ctx, 30);
        drawSectionTitle(doc, ctx, L.p4Subsidies);

        var subsidies = fp.totalInvestment - fp.netCost;
        if (subsidies > 0) {
            doc.setFontSize(9);
            doc.setTextColor.apply(doc, C.dark);
            doc.text(clean(L.p4SubsidyNote + ' — ' + (data.config.countryName || '') + ':'), M, ctx.y);
            ctx.y += 6;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(fmtNum(subsidies, 0, lang) + ' ' + L.unitEur, M, ctx.y);
            doc.setFont('helvetica', 'normal');
            ctx.y += 8;
        } else {
            doc.setFontSize(9);
            doc.setTextColor.apply(doc, C.slate);
            doc.text(clean(L.p4NoSubsidy), M, ctx.y);
            ctx.y += 10;
        }

        // --- System recap table ---
        checkPageBreak(doc, ctx, 40);
        drawSectionTitle(doc, ctx, L.p4SystemRecap);

        var recapRows = [
            [L.lblLocation, data.config.countryName],
            [L.lblPower, fmtNum(data.config.kwc, 1, lang) + ' ' + L.unitKwc],
            [L.lblSurface, fmtNum(data.config.surface, 0, lang) + ' ' + L.unitM2],
            [L.lblTiltOrient, fmtNum(data.config.tilt, 0, lang) + '\u00b0 / ' + orientLabel(data.config.orientation, L)],
            [L.coverPanelType, panelTypeLabel(data.config.panelEfficiency, lang)],
            [L.lblBattery, flags.hasBattery ? fmtNum(data.battery.capacityKwh, 1, lang) + ' ' + L.unitKwh : L.no],
            [L.lblConsoInput, fmtNum(data.config.consumption, 0, lang) + ' ' + L.unitKwh],
            [L.lblConsoSimulated, fmtNum(data.production.totalConsumption, 0, lang) + ' ' + L.unitKwh],
            [L.lblProfile, profileLabel(data.config.profile, L)],
        ];

        drawCompactTable(doc, ctx, recapRows);
    }

    /**
     * Renders v2 page 5: "Rapport d'analyse" / "Analysis report"
     * Structure:
     *   1. Verdict block
     *   2. Strengths
     *   3. Weaknesses
     *   4. Battery reading (if battery)
     *   5. Points to check before deciding
     */
    function renderV2Page5(doc, ctx, data) {
        var L = ctx.L;
        var lang = ctx.lang;
        var verdict = data.verdict;
        var flags = data.displayFlags;

        drawSectionTitle(doc, ctx, L.v2PageTitle5);
        drawPageIntro(doc, ctx, L.v2IntroP5);

        // --- Verdict block ---
        if (flags.hasVerdict && verdict) {
            drawVerdictBlock(doc, ctx, verdict);
        }

        // --- Strengths ---
        var strengths = buildStrengths(data, L, lang);
        drawMiniBlock(doc, ctx, L.p3Strengths, strengths);

        // --- Weaknesses ---
        var weaknesses = buildWeaknesses(data, L, lang);
        drawMiniBlock(doc, ctx, L.p3Weaknesses, weaknesses);

        // --- Battery reading (if battery configured) ---
        if (flags.hasBattery) {
            var batLines = buildBatteryReading(data, L, lang);
            drawMiniBlock(doc, ctx, L.p3BatteryReading, batLines);
        }

        // --- Points to check ---
        checkPageBreak(doc, ctx, 25);
        var checks = [];
        if (flags.hasVerdict && verdict && Array.isArray(verdict.recommendations) && verdict.recommendations.length > 0) {
            verdict.recommendations.forEach(function (r) {
                checks.push('- ' + r);
            });
        }
        checks.push('- ' + L.p3DefaultCheck);
        drawMiniBlock(doc, ctx, L.p3CheckBefore, checks);
    }

    /**
     * Renders v2 page 6: "Hypotheses & methode" / "Assumptions & method"
     * Structure:
     *   1. Assumptions table
     *   2. Sensitivity note
     *   3. Method block
     *   4. Limits block
     *   5. Disclaimer
     */
    function renderV2Page6(doc, ctx, data) {
        var L = ctx.L;
        var lang = ctx.lang;
        var fp = data.financialParams;
        var flags = data.displayFlags;

        drawSectionTitle(doc, ctx, L.v2PageTitle6);
        drawPageIntro(doc, ctx, L.v2IntroP6);

        // --- Assumptions table ---
        var assumptionRows = [
            [L.lblAssumedElecPrice,  fmtNum(fp.elecPrice, 4, lang) + ' ' + L.unitEurKwh],
            [L.lblAssumedFeedin,     fmtNum(fp.feedinTariff, 4, lang) + ' ' + L.unitEurKwh],
            [L.lblAssumedIncrease,   fmtNum(fp.priceIncreaseRate * 100, 1, lang) + ' ' + L.unitPercent],
            [L.lblDegradationPv,     fmtNum(fp.degradationPv * 100, 1, lang) + ' ' + L.unitPercent],
        ];
        if (flags.hasBattery) {
            assumptionRows.push([L.lblDegradationBat, fmtNum(fp.degradationBattery * 100, 1, lang) + ' ' + L.unitPercent]);
        }
        assumptionRows.push([L.lblHorizon,      fmtNum(fp.years, 0, lang) + ' ' + L.unitYears]);
        assumptionRows.push([L.lblDiscountRate,  fmtNum(fp.discountRate * 100, 1, lang) + ' ' + L.unitPercent]);

        drawCompactTable(doc, ctx, assumptionRows);
        ctx.y += 4;

        // --- Sensitivity note ---
        doc.setFontSize(8);
        doc.setTextColor.apply(doc, C.slate);
        var noteLines = doc.splitTextToSize(clean(L.v2SensitivityNote), PAGE_W - 2 * M);
        doc.text(noteLines, M, ctx.y);
        ctx.y += noteLines.length * 3.5 + 6;

        // --- Method ---
        checkPageBreak(doc, ctx, 30);
        drawMiniBlock(doc, ctx, L.p4Method, L.p4MethodText);

        // --- Limits ---
        checkPageBreak(doc, ctx, 30);
        drawMiniBlock(doc, ctx, L.p4Limits, L.p4LimitsText);

        // --- Disclaimer ---
        drawDisclaimerBox(doc, ctx, L);
    }


    // =================================================================
    //  8. ENTRY POINT
    // =================================================================

    function generateSimulationPdf(data, opts) {
        // --- Validate inputs ---
        if (!data) {
            console.error('[pdf-generator] No simulation data provided.');
            return;
        }
        var mode = 'v2';  // Force v2 mode
        var lang = (opts && opts.lang) || (data.meta && data.meta.lang) || 'fr';

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

        // --- Check financial data availability ---
        if (normalized.displayFlags.financialAvailable === false) {
            var msg = lang === 'fr'
                ? 'Les donnees financieres ne sont pas renseignees. Le rapport PDF ne peut pas etre genere.'
                : 'Financial data is missing. The PDF report cannot be generated.';
            alert(msg);
            return;
        }

        // --- Create document ---
        var doc = new jsPDFConstructor('p', 'mm', 'a4');

        // --- Drawing context ---
        var L = {};
        var baseL = LABELS[lang];
        for (var k in baseL) {
            if (baseL.hasOwnProperty(k)) L[k] = baseL[k];
        }

        // --- Resolve currency from country data ---
        var cc = (normalized.config && normalized.config.countryCode) || '';
        var countryEntry = (window.SOLAR_DATA && window.SOLAR_DATA.countries && window.SOLAR_DATA.countries[cc]) || null;
        if (countryEntry && countryEntry.currency && countryEntry.currency !== 'EUR') {
            var cur = countryEntry.currency;           // e.g. 'GBP'
            var sym = countryEntry.currencySymbol || cur; // e.g. '£'
            L.unitEur    = cur;
            L.unitEurAn  = lang === 'fr' ? (cur + '/an')  : (cur + '/yr');
            L.unitEurKwh = cur + '/kWh';
            // Also store symbol for potential future use
            L._currencySymbol = sym;
        }

        var ctx = {
            y:    0,
            lang: lang,
            L:    L,
        };

        // --- V2 mode pages ---
        // Page 1: Cover (no header, no footer)
        renderCoverPage(doc, ctx, normalized);

        // Page 2: Financial summary
        doc.addPage();
        drawHeader(doc, ctx);
        renderV2Page2(doc, ctx, normalized);

        // Page 3: Self-consumption details
        doc.addPage();
        drawHeader(doc, ctx);
        renderV2Page3(doc, ctx, normalized);

        // Page 4: Battery comparison & subsidies
        doc.addPage();
        drawHeader(doc, ctx);
        renderV2Page4(doc, ctx, normalized);

        // Page 5: Analysis report
        doc.addPage();
        drawHeader(doc, ctx);
        renderV2Page5(doc, ctx, normalized);

        // Page 6: Assumptions & method
        doc.addPage();
        drawHeader(doc, ctx);
        renderV2Page6(doc, ctx, normalized);

        // --- Draw footers on pages 2+ (no footer on cover/page 1) ---
        var totalPages = doc.getNumberOfPages();
        for (var p = 2; p <= totalPages; p++) {
            doc.setPage(p);
            drawFooter(doc, ctx, p, totalPages);
        }

        // --- Save ---
        var filename = 'solardataatlas-rapport-' + lang + '.pdf';
        doc.save(filename);

        console.log('[pdf-generator] PDF generated: ' + filename + ' (' + totalPages + ' pages, lang=' + lang + ')');
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
        renderCoverPage:        renderCoverPage,
        renderV2Page2:          renderV2Page2,
        renderV2Page3:          renderV2Page3,
        renderV2Page4:          renderV2Page4,
        renderV2Page5:          renderV2Page5,
        renderV2Page6:          renderV2Page6,
    };

})();
