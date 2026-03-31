/**
 * Solar Data Atlas - Residential Solar Simulator Data
 * Last updated: March 2026
 *
 * Sources:
 * - Electricity prices: Eurostat (API, auto-updated)
 * - Installation costs: SolarPower Europe, Fraunhofer ISE (2025)
 * - CO₂ emissions: Ember Climate (2025)
 * - Feed-in tariffs: National energy regulators (2025-2026)
 * - Battery costs: BNEF, IRENA (2025)
 * - Subsidies: National government sources (2025-2026)
 */

window.SOLAR_DATA = {
  lastUpdated: "2026-03",

  countries: {
    FR: {
      name: { fr: "France", en: "France" },
      code: "FR",
      region: "EU",
      currency: "EUR",
      currencySymbol: "€",
      eurostatCode: "FR",
      defaultLat: 46.6,
      defaultLon: 2.2,
      mapZoom: 6,
      electricityPrice: 0.2664,  // €/kWh, Eurostat S2 2025, all taxes, medium household
      installCostPerKwc: { min: 1300, max: 2000, avg: 1650 },  // €/kWc residential
      co2Factor: 56,  // gCO₂/kWh, Ember 2025 (low due to nuclear)
      feedInTariff: 0.04,  // €/kWh, tarif rachat surplus autoconso EDF OA T1 2026, ≤9 kWc
      feedInNote: {
        fr: "Tarif EDF OA surplus autoconsommation (≤9 kWc, T1 2026). Garanti 20 ans, révisé chaque trimestre.",
        en: "EDF OA surplus self-consumption rate (≤9 kWp, Q1 2026). Guaranteed 20 years, revised quarterly.",
        link: "https://www.edf-oa.fr/",
        linkLabel: "edf-oa.fr"
      },
      batteryCostPerKwh: 450,  // €/kWh installed
      subsidies: {
        fr: {
          title: "Aides en France (2026)",
          items: [
            "Prime à l'autoconsommation : 220-500 €/kWc selon puissance (≤100 kWc)",
            "Obligation d'achat (OA) : tarif surplus garanti 20 ans (0,04 €/kWh pour ≤9 kWc, T1 2026)",
            "TVA réduite à 10% pour installations ≤3 kWc",
            "MaPrimeRénov' : sous conditions de revenus (rénovation globale)",
            "Exonération d'impôt sur le revenu pour ≤3 kWc"
          ],
          officialLink: "https://www.economie.gouv.fr/particuliers/faire-des-economies-denergie/maprimerenov-parcours-par-geste-la-prime-pour-la-renovation-energetique",
          officialLabel: "economie.gouv.fr"
        },
        en: {
          title: "Subsidies in France (2026)",
          items: [
            "Self-consumption bonus: €220-500/kWp depending on capacity (≤100 kWp)",
            "Feed-in tariff (OA): guaranteed surplus rate for 20 years (€0.04/kWh for ≤9 kWp, Q1 2026)",
            "Reduced VAT at 10% for installations ≤3 kWp",
            "MaPrimeRénov': income-based (whole-house renovation)",
            "Income tax exemption for ≤3 kWp"
          ],
          officialLink: "https://www.economie.gouv.fr/particuliers/faire-des-economies-denergie/maprimerenov-parcours-par-geste-la-prime-pour-la-renovation-energetique",
          officialLabel: "economie.gouv.fr"
        }
      },
      comparator: {
        url: "https://www.hellowatt.fr/panneaux-solaires",
        name: "HelloWatt"
      }
    },

    DE: {
      name: { fr: "Allemagne", en: "Germany" },
      code: "DE",
      region: "EU",
      currency: "EUR",
      currencySymbol: "€",
      eurostatCode: "DE",
      defaultLat: 51.2,
      defaultLon: 10.4,
      mapZoom: 6,
      electricityPrice: 0.3835,
      installCostPerKwc: { min: 1200, max: 1800, avg: 1500 },
      co2Factor: 350,
      feedInTariff: 0.079,  // €/kWh, EEG 2025-2026, ≤10 kWp partial feed-in (decreasing 1%/6mo)
      feedInNote: {
        fr: "Tarif EEG garanti 20 ans pour injection partielle (≤10 kWc). En baisse de ~1% tous les 6 mois. TVA 0% sur les installations.",
        en: "EEG guaranteed 20-year rate for partial feed-in (≤10 kWp). Decreasing ~1% every 6 months. 0% VAT on installations.",
        link: "https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Foerderung/start.html",
        linkLabel: "bundesnetzagentur.de"
      },
      batteryCostPerKwh: 400,
      subsidies: {
        fr: {
          title: "Aides en Allemagne (2026)",
          items: [
            "TVA à 0% sur les installations PV résidentielles (depuis 2023)",
            "Tarif de rachat garanti (EEG) : ~0,079 €/kWh pour ≤10 kWc, 20 ans (en baisse progressive)",
            "Prêts KfW à taux bonifiés (programme 270)",
            "Primes régionales variables (Länder)"
          ],
          officialLink: "https://www.kfw.de/inlandsfoerderung/Privatpersonen/Bestandsimmobilie/F%C3%B6rderprodukte/Erneuerbare-Energien-Standard-(270)/",
          officialLabel: "kfw.de"
        },
        en: {
          title: "Subsidies in Germany (2026)",
          items: [
            "0% VAT on residential PV systems (since 2023)",
            "Feed-in tariff (EEG): ~€0.079/kWh for ≤10 kWp, 20 years (gradually decreasing)",
            "KfW subsidized loans (program 270)",
            "Variable regional premiums (Länder)"
          ],
          officialLink: "https://www.kfw.de/inlandsfoerderung/Privatpersonen/Bestandsimmobilie/F%C3%B6rderprodukte/Erneuerbare-Energien-Standard-(270)/",
          officialLabel: "kfw.de"
        }
      },
      comparator: {
        url: "https://www.verivox.de/solaranlagen/",
        name: "Verivox"
      }
    },

    ES: {
      name: { fr: "Espagne", en: "Spain" },
      code: "ES",
      region: "EU",
      currency: "EUR",
      currencySymbol: "€",
      eurostatCode: "ES",
      defaultLat: 40.0,
      defaultLon: -3.7,
      mapZoom: 6,
      electricityPrice: 0.2608,
      installCostPerKwc: { min: 1000, max: 1400, avg: 1200 },
      co2Factor: 200,
      feedInTariff: 0.075,  // €/kWh, simplified compensation
      feedInNote: {
        fr: "Compensación simplificada : le surplus est compensé au prix du marché, limité à 50% de la facture mensuelle (2026). Pas de tarif fixe garanti.",
        en: "Compensación simplificada: surplus is offset at market price, limited to 50% of monthly bill (2026). No guaranteed fixed rate.",
        link: "https://www.idae.es/ayudas-y-financiacion/para-energias-renovables",
        linkLabel: "idae.es"
      },
      batteryCostPerKwh: 420,
      subsidies: {
        fr: {
          title: "Aides en Espagne (2026)",
          items: [
            "Déduction IRPF (impôt sur le revenu) : 20-60% selon communauté autonome",
            "Bonification IBI (taxe foncière) : 30-50% pendant 3-5 ans",
            "Aides NextGenerationEU / IDAE : jusqu'à 40% du coût (selon disponibilité)",
            "TVA réduite à 10% sur installations résidentielles (certaines régions)"
          ],
          officialLink: "https://www.idae.es/ayudas-y-financiacion/para-energias-renovables",
          officialLabel: "idae.es"
        },
        en: {
          title: "Subsidies in Spain (2026)",
          items: [
            "IRPF income tax deduction: 20-60% depending on autonomous community",
            "IBI property tax discount: 30-50% for 3-5 years",
            "NextGenerationEU / IDAE grants: up to 40% of cost (subject to availability)",
            "Reduced VAT at 10% on residential installations (certain regions)"
          ],
          officialLink: "https://www.idae.es/ayudas-y-financiacion/para-energias-renovables",
          officialLabel: "idae.es"
        }
      },
      comparator: {
        url: "https://selectra.es/autoconsumo/instaladores",
        name: "Selectra"
      }
    },

    IT: {
      name: { fr: "Italie", en: "Italy" },
      code: "IT",
      region: "EU",
      currency: "EUR",
      currencySymbol: "€",
      eurostatCode: "IT",
      defaultLat: 42.5,
      defaultLon: 12.5,
      mapZoom: 6,
      electricityPrice: 0.3291,
      installCostPerKwc: { min: 1100, max: 1500, avg: 1300 },
      co2Factor: 250,
      feedInTariff: 0.06,  // €/kWh, Ritiro Dedicato (SSP fermé aux nouvelles demandes sept 2025)
      feedInNote: {
        fr: "Ritiro Dedicato (rachat dédié) : remplace le Scambio sul Posto fermé aux nouvelles demandes (sept. 2025). Tarif variable selon le marché (~0,05-0,08 €/kWh).",
        en: "Ritiro Dedicato (dedicated buy-back): replaces Scambio sul Posto, closed to new applications (Sept. 2025). Variable market rate (~€0.05-0.08/kWh).",
        link: "https://www.gse.it/servizi-per-te/fotovoltaico/ritiro-dedicato",
        linkLabel: "gse.it"
      },
      batteryCostPerKwh: 430,
      subsidies: {
        fr: {
          title: "Aides en Italie (2026)",
          items: [
            "Bonus ristrutturazione : déduction fiscale 50% sur 10 ans (résidence principale)",
            "Ritiro Dedicato : rachat surplus ~0,05-0,08 €/kWh (remplace le Scambio sul Posto, fermé sept. 2025)",
            "Superbonus résiduel : vérifier conditions en vigueur",
            "TVA réduite à 10% sur installations résidentielles"
          ],
          officialLink: "https://www.gse.it/servizi-per-te/fotovoltaico",
          officialLabel: "gse.it"
        },
        en: {
          title: "Subsidies in Italy (2026)",
          items: [
            "Ristrutturazione bonus: 50% tax deduction over 10 years (primary residence)",
            "Ritiro Dedicato: surplus buy-back ~€0.05-0.08/kWh (replaces Scambio sul Posto, closed Sept. 2025)",
            "Residual Superbonus: check current eligibility",
            "Reduced VAT at 10% on residential installations"
          ],
          officialLink: "https://www.gse.it/servizi-per-te/fotovoltaico",
          officialLabel: "gse.it"
        }
      },
      comparator: {
        url: "https://www.otovo.it/",
        name: "Otovo"
      }
    },

    NL: {
      name: { fr: "Pays-Bas", en: "Netherlands" },
      code: "NL",
      region: "EU",
      currency: "EUR",
      currencySymbol: "€",
      eurostatCode: "NL",
      defaultLat: 52.1,
      defaultLon: 5.3,
      mapZoom: 7,
      electricityPrice: 0.35,
      installCostPerKwc: { min: 1100, max: 1500, avg: 1300 },
      co2Factor: 300,
      feedInTariff: 0.12,  // €/kWh, estimate — saldering (1:1 net metering) until 2027, then min 50% retail
      feedInNote: {
        fr: "Saldering (compensation nette 1:1) en vigueur jusqu'en 2027. Après 2027 : compensation minimale de 50% du tarif retail. La valeur affichée est une estimation conservatrice sur la durée de vie.",
        en: "Saldering (1:1 net metering) in effect until 2027. After 2027: minimum 50% of retail rate. The displayed value is a conservative lifetime estimate.",
        link: "https://business.gov.nl/amendments/netting-scheme-solar-panels-ends/",
        linkLabel: "business.gov.nl"
      },
      batteryCostPerKwh: 420,
      subsidies: {
        fr: {
          title: "Aides aux Pays-Bas (2026)",
          items: [
            "TVA à 0% sur les panneaux solaires résidentiels (depuis 2023)",
            "Saldering (compensation nette) : en cours de suppression progressive (2027)",
            "Subventions municipales variables",
            "ISDE : subvention pour batteries et pompes à chaleur"
          ],
          officialLink: "https://www.rvo.nl/subsidies-financiering/isde",
          officialLabel: "rvo.nl"
        },
        en: {
          title: "Subsidies in the Netherlands (2026)",
          items: [
            "0% VAT on residential solar panels (since 2023)",
            "Saldering (net metering): being phased out gradually (2027)",
            "Variable municipal subsidies",
            "ISDE: subsidy for batteries and heat pumps"
          ],
          officialLink: "https://www.rvo.nl/subsidies-financiering/isde",
          officialLabel: "rvo.nl"
        }
      },
      comparator: {
        url: "https://www.consumentenbond.nl/zonnepanelen",
        name: "Consumentenbond"
      }
    },

    BE: {
      name: { fr: "Belgique", en: "Belgium" },
      code: "BE",
      region: "EU",
      currency: "EUR",
      currencySymbol: "€",
      eurostatCode: "BE",
      defaultLat: 50.8,
      defaultLon: 4.4,
      mapZoom: 8,
      electricityPrice: 0.3571,
      installCostPerKwc: { min: 1200, max: 1800, avg: 1500 },
      co2Factor: 150,
      feedInTariff: 0.05,  // €/kWh, Flanders wholesale credits 0.04-0.06 (net metering ended 2025)
      feedInNote: {
        fr: "Flandre : injection nette au prix wholesale (0,04-0,06 €/kWh). Wallonie/Bruxelles : systèmes différents (certificats verts, compteur qui tourne à l'envers selon période).",
        en: "Flanders: net injection at wholesale price (€0.04-0.06/kWh). Wallonia/Brussels: different systems (green certificates, meter roll-back depending on period).",
        link: "https://www.vreg.be/nl/veelgestelde-vragen-over-zonnepanelen",
        linkLabel: "vreg.be"
      },
      batteryCostPerKwh: 450,
      subsidies: {
        fr: {
          title: "Aides en Belgique (2026)",
          items: [
            "Wallonie : prime Qualiwatt (selon profil consommation)",
            "Flandre : prime batterie + injection nette",
            "Bruxelles : certificats verts (Brugel)",
            "TVA à 6% pour rénovation (bâtiment >10 ans)"
          ],
          officialLink: "https://energie.wallonie.be/fr/aides-et-primes.html",
          officialLabel: "energie.wallonie.be"
        },
        en: {
          title: "Subsidies in Belgium (2026)",
          items: [
            "Wallonia: Qualiwatt premium (based on consumption profile)",
            "Flanders: battery premium + net injection",
            "Brussels: green certificates (Brugel)",
            "6% VAT for renovation (buildings >10 years)"
          ],
          officialLink: "https://energie.wallonie.be/fr/aides-et-primes.html",
          officialLabel: "energie.wallonie.be"
        }
      },
      comparator: {
        url: "https://www.test-achats.be/maison-energie/panneaux-solaires",
        name: "Test-Achats"
      }
    },

    PT: {
      name: { fr: "Portugal", en: "Portugal" },
      code: "PT",
      region: "EU",
      currency: "EUR",
      currencySymbol: "€",
      eurostatCode: "PT",
      defaultLat: 39.4,
      defaultLon: -8.2,
      mapZoom: 6,
      electricityPrice: 0.24,
      installCostPerKwc: { min: 1000, max: 1400, avg: 1200 },
      co2Factor: 200,
      feedInTariff: 0.06,
      feedInNote: {
        fr: "UPAC (autoconsommation) : le surplus est racheté à ~90% du prix du marché OMIE. Varie entre 0,04 et 0,08 €/kWh selon les cours.",
        en: "UPAC (self-consumption): surplus bought back at ~90% of OMIE market price. Varies between €0.04 and €0.08/kWh depending on market.",
        link: "https://www.dgeg.gov.pt/",
        linkLabel: "dgeg.gov.pt"
      },
      batteryCostPerKwh: 440,
      subsidies: {
        fr: {
          title: "Aides au Portugal (2026)",
          items: [
            "Fundo Ambiental : subvention jusqu'à 2 500 € pour autoconsommation",
            "TVA réduite à 6% sur panneaux solaires",
            "Programme PRR : aides à la rénovation énergétique",
            "Déduction IRS (impôt sur le revenu) pour investissements verts"
          ],
          officialLink: "https://www.fundoambiental.pt/",
          officialLabel: "fundoambiental.pt"
        },
        en: {
          title: "Subsidies in Portugal (2026)",
          items: [
            "Fundo Ambiental: subsidy up to €2,500 for self-consumption",
            "Reduced VAT at 6% on solar panels",
            "PRR program: energy renovation grants",
            "IRS income tax deduction for green investments"
          ],
          officialLink: "https://www.fundoambiental.pt/",
          officialLabel: "fundoambiental.pt"
        }
      },
      comparator: {
        url: "https://www.otovo.pt/",
        name: "Otovo"
      }
    },

    PL: {
      name: { fr: "Pologne", en: "Poland" },
      code: "PL",
      region: "EU",
      currency: "EUR",
      currencySymbol: "€",
      eurostatCode: "PL",
      defaultLat: 51.9,
      defaultLon: 19.1,
      mapZoom: 6,
      electricityPrice: 0.22,
      installCostPerKwc: { min: 1000, max: 1400, avg: 1200 },
      co2Factor: 650,  // high: coal-heavy grid
      feedInTariff: 0.06,  // €/kWh, net-billing system (80% market price credit ≤10kW)
      feedInNote: {
        fr: "Net-billing : le surplus est crédité à 80% du prix du marché pour les installations ≤10 kW (depuis 2022). Programme Mój Prąd pour les aides à l'investissement.",
        en: "Net-billing: surplus credited at 80% of market price for installations ≤10 kW (since 2022). Mój Prąd program for investment subsidies.",
        link: "https://mojprad.gov.pl/",
        linkLabel: "mojprad.gov.pl"
      },
      batteryCostPerKwh: 400,
      subsidies: {
        fr: {
          title: "Aides en Pologne (2026)",
          items: [
            "Mój Prąd 6.0 : subvention jusqu'à 7 000 PLN (~1 600 €) pour PV",
            "Bonus batterie : jusqu'à 16 000 PLN (~3 700 €)",
            "Net-billing : compensation au prix du marché",
            "Ulga termomodernizacyjna : déduction fiscale rénovation énergétique"
          ],
          officialLink: "https://mojprad.gov.pl/",
          officialLabel: "mojprad.gov.pl"
        },
        en: {
          title: "Subsidies in Poland (2026)",
          items: [
            "Mój Prąd 6.0: subsidy up to 7,000 PLN (~€1,600) for PV",
            "Battery bonus: up to 16,000 PLN (~€3,700)",
            "Net-billing: market price compensation",
            "Thermomodernization tax relief for energy renovation"
          ],
          officialLink: "https://mojprad.gov.pl/",
          officialLabel: "mojprad.gov.pl"
        }
      },
      comparator: {
        url: "https://www.enerad.pl/fotowoltaika/",
        name: "Enerad"
      }
    },

    AT: {
      name: { fr: "Autriche", en: "Austria" },
      code: "AT",
      region: "EU",
      currency: "EUR",
      currencySymbol: "€",
      eurostatCode: "AT",
      defaultLat: 47.5,
      defaultLon: 14.6,
      mapZoom: 7,
      electricityPrice: 0.30,
      installCostPerKwc: { min: 1200, max: 1600, avg: 1400 },
      co2Factor: 100,  // high hydro share
      feedInTariff: 0.076,  // €/kWh, EAG 2023 partial feed-in (Überschusseinspeisung) ≤10kWp
      feedInNote: {
        fr: "Tarif OeMAG garanti (Überschusseinspeisung) pour injection partielle (≤10 kWc). Contrat 20 ans. TVA 0% sur installations ≤35 kWc depuis 2024.",
        en: "OeMAG guaranteed rate (Überschusseinspeisung) for partial feed-in (≤10 kWp). 20-year contract. 0% VAT on installations ≤35 kWp since 2024.",
        link: "https://www.oem-ag.at/de/foerderung/",
        linkLabel: "oem-ag.at"
      },
      batteryCostPerKwh: 430,
      subsidies: {
        fr: {
          title: "Aides en Autriche (2026)",
          items: [
            "EAG-Investitionszuschuss : prime jusqu'à 285 €/kWc (≤10 kWc)",
            "TVA à 0% sur installations PV ≤35 kWc (depuis 2024)",
            "OeMAG : tarif de rachat garanti",
            "Subventions régionales (Länder) variables"
          ],
          officialLink: "https://www.oem-ag.at/de/foerderung/",
          officialLabel: "oem-ag.at"
        },
        en: {
          title: "Subsidies in Austria (2026)",
          items: [
            "EAG investment grant: up to €285/kWp (≤10 kWp)",
            "0% VAT on PV installations ≤35 kWp (since 2024)",
            "OeMAG: guaranteed feed-in tariff",
            "Variable regional subsidies (Länder)"
          ],
          officialLink: "https://www.oem-ag.at/de/foerderung/",
          officialLabel: "oem-ag.at"
        }
      },
      comparator: {
        url: "https://www.e-control.at/konsumenten/photovoltaik",
        name: "E-Control"
      }
    },

    GR: {
      name: { fr: "Grèce", en: "Greece" },
      code: "GR",
      region: "EU",
      currency: "EUR",
      currencySymbol: "€",
      eurostatCode: "EL",  // Eurostat uses EL for Greece
      defaultLat: 38.5,
      defaultLon: 23.7,
      mapZoom: 6,
      electricityPrice: 0.24,  // €/kWh, Eurostat/GlobalPetrolPrices June 2025
      installCostPerKwc: { min: 1000, max: 1400, avg: 1200 },
      co2Factor: 400,
      feedInTariff: 0.07,  // €/kWh, net billing at wholesale market price
      feedInNote: {
        fr: "Net billing (depuis 2024) : le surplus est compensé au prix du marché de gros. Remplace l'ancien net metering virtuel. Tarif variable (~0,05-0,08 €/kWh).",
        en: "Net billing (since 2024): surplus compensated at wholesale market price. Replaces former virtual net metering. Variable rate (~€0.05-0.08/kWh).",
        link: "https://ypen.gov.gr/energeia/",
        linkLabel: "ypen.gov.gr"
      },
      batteryCostPerKwh: 440,
      subsidies: {
        fr: {
          title: "Aides en Grèce (2026)",
          items: [
            "Programme Fotovoltaïka sto Stegi : subvention résidentielle",
            "Net billing (depuis 2024) : compensation surplus au prix du marché",
            "Communautés énergétiques : cadre réglementaire favorable",
            "Exonérations fiscales pour investissements verts"
          ],
          officialLink: "https://ypen.gov.gr/energeia/",
          officialLabel: "ypen.gov.gr"
        },
        en: {
          title: "Subsidies in Greece (2026)",
          items: [
            "Fotovoltaïka sto Stegi program: residential subsidy",
            "Net billing (since 2024): surplus compensation at market price",
            "Energy communities: favorable regulatory framework",
            "Tax exemptions for green investments"
          ],
          officialLink: "https://ypen.gov.gr/energeia/",
          officialLabel: "ypen.gov.gr"
        }
      },
      comparator: {
        url: "https://helapco.gr/en/",
        name: "HELAPCO"
      }
    },

    US: {
      name: { fr: "États-Unis", en: "United States" },
      code: "US",
      region: "NA",
      currency: "USD",
      currencySymbol: "$",
      irradiationSource: "NREL",
      defaultLat: 39.8,
      defaultLon: -98.6,
      mapZoom: 4,
      electricityPrice: 0.18,  // $/kWh, EIA 2026 average residential
      installCostPerKwc: { min: 2100, max: 3200, avg: 2650 },  // $/kWc (= $/W × 1000), before ITC
      co2Factor: 380,  // gCO₂/kWh, EPA eGRID 2024 national average
      feedInTariff: 0,  // No federal feed-in tariff — net metering varies by state
      feedInNote: {
        fr: "Pas de tarif fédéral de rachat. Le net metering varie par État (crédit au tarif retail ou au tarif avoided cost). Valeur à 0 par défaut — renseignez le tarif de votre utility.",
        en: "No federal feed-in tariff. Net metering varies by state (credit at retail or avoided cost rate). Default 0 — enter your utility's rate.",
        link: "https://www.dsireusa.org/",
        linkLabel: "dsireusa.org"
      },
      netMeteringNote: {
        fr: "Le net metering varie selon votre État et votre fournisseur d'électricité. Consultez votre utility locale.",
        en: "Net metering varies by state and utility. Check with your local electric company."
      },
      batteryCostPerKwh: 500,  // $/kWh installed (Tesla Powerwall range)
      subsidies: {
        fr: {
          title: "Aides aux États-Unis (2026)",
          items: [
            "ITC fédéral (Investment Tax Credit) : expiré le 31/12/2025 — vérifier extensions éventuelles",
            "Crédits d'État variables : California (SGIP), New York (NY-Sun), Massachusetts (SMART), etc.",
            "Net metering : disponible dans ~40 États (conditions variables)",
            "Programmes locaux / utility : remises et financements selon fournisseur",
            "Property tax exemption : dans de nombreux États, les panneaux solaires n'augmentent pas la taxe foncière"
          ],
          officialLink: "https://www.dsireusa.org/",
          officialLabel: "dsireusa.org (DSIRE)"
        },
        en: {
          title: "Incentives in the United States (2026)",
          items: [
            "Federal ITC (Investment Tax Credit): expired 12/31/2025 — check for potential extensions",
            "State-level credits vary: California (SGIP), New York (NY-Sun), Massachusetts (SMART), etc.",
            "Net metering: available in ~40 states (conditions vary)",
            "Local / utility programs: rebates and financing by provider",
            "Property tax exemption: in many states, solar panels don't increase property tax"
          ],
          officialLink: "https://www.dsireusa.org/",
          officialLabel: "dsireusa.org (DSIRE)"
        }
      },
      comparator: {
        url: "https://www.energysage.com/",
        name: "EnergySage"
      }
    },

    CA: {
      name: { fr: "Canada", en: "Canada" },
      code: "CA",
      region: "NA",
      currency: "CAD",
      currencySymbol: "$ CA",
      irradiationSource: "NREL",
      defaultLat: 56.1,
      defaultLon: -106.3,
      mapZoom: 4,
      electricityPrice: 0.16,  // CAD/kWh, national average 2025-2026
      installCostPerKwc: { min: 2200, max: 3500, avg: 2850 },  // CAD/kWc residential
      co2Factor: 120,  // gCO₂/kWh, CER 2024 (high hydro share)
      feedInTariff: 0,  // No national feed-in tariff
      feedInNote: {
        fr: "Pas de tarif national de rachat. Le net metering varie par province (microFIT Ontario fermé). Valeur à 0 par défaut — renseignez le tarif de votre distributeur.",
        en: "No national feed-in tariff. Net metering varies by province (Ontario microFIT closed). Default 0 — enter your distributor's rate.",
        link: "https://natural-resources.canada.ca/energy-efficiency/homes",
        linkLabel: "natural-resources.canada.ca"
      },
      netMeteringNote: {
        fr: "Le net metering varie selon la province et le distributeur. Consultez votre fournisseur local.",
        en: "Net metering varies by province and distributor. Check with your local provider."
      },
      batteryCostPerKwh: 550,  // CAD/kWh installed
      subsidies: {
        fr: {
          title: "Aides au Canada (2026)",
          items: [
            "Greener Homes Grant fédéral : fermé aux nouvelles demandes (oct. 2025)",
            "Colombie-Britannique : jusqu'à 10 000 $ pour panneaux solaires",
            "Ontario : Home Renovation Savings Program, remise jusqu'à 5 000 $",
            "Île-du-Prince-Édouard : 1 000 $/kW jusqu'à 10 000 $",
            "Nouvelle-Écosse : 0,30 $/W jusqu'à 3 000 $",
            "Alberta : programmes municipaux (Edmonton, Calgary)"
          ],
          officialLink: "https://natural-resources.canada.ca/energy-efficiency/homes",
          officialLabel: "natural-resources.canada.ca"
        },
        en: {
          title: "Incentives in Canada (2026)",
          items: [
            "Federal Greener Homes Grant: closed to new applications (Oct. 2025)",
            "British Columbia: up to $10,000 for solar panels",
            "Ontario: Home Renovation Savings Program, rebate up to $5,000",
            "Prince Edward Island: $1,000/kW up to $10,000",
            "Nova Scotia: $0.30/W up to $3,000",
            "Alberta: municipal programs (Edmonton, Calgary)"
          ],
          officialLink: "https://natural-resources.canada.ca/energy-efficiency/homes",
          officialLabel: "natural-resources.canada.ca"
        }
      },
      comparator: {
        url: "https://energyhub.org/solar-panels/",
        name: "EnergyHub"
      }
    },

    GB: {
      name: { fr: "Royaume-Uni", en: "United Kingdom" },
      code: "GB",
      region: "EU",
      currency: "GBP",
      currencySymbol: "£",
      eurostatCode: "UK",
      defaultLat: 51.5074,
      defaultLon: -0.1278,
      mapZoom: 6,
      electricityPrice: 0.2467,  // GBP/kWh, Ofgem cap Q2 2026 (approx. — enter your actual rate)
      installCostPerKwc: { min: 1500, max: 2200, avg: 1850 },  // GBP/kWc installed, indicative UK avg — get local quotes
      co2Factor: 170,  // gCO2/kWh, UK grid avg 2025 (DESNZ)
      feedInTariff: 0.04,  // GBP/kWh, SEG avg ~4p — rates vary widely (1p–25p), enter your actual SEG rate
      feedInNote: {
        fr: "Valeur indicative (~4p). Les tarifs SEG varient de 1p à 25p/kWh selon le fournisseur. Renseignez votre tarif réel.",
        en: "Indicative value (~4p). SEG rates range from 1p to 25p/kWh depending on supplier. Enter your actual SEG rate.",
        link: "https://www.ofgem.gov.uk/environmental-and-social-schemes/smart-export-guarantee-seg",
        linkLabel: "Ofgem SEG"
      },
      netMeteringNote: {
        fr: "Le Royaume-Uni n'a pas de net metering. Le surplus est payé via le Smart Export Guarantee (SEG).",
        en: "The UK does not have net metering. Surplus is paid via the Smart Export Guarantee (SEG)."
      },
      batteryCostPerKwh: 550,  // GBP/kWh installed, UK avg 2026 — varies by brand/capacity
      subsidies: {
        fr: {
          title: "Aides au Royaume-Uni (2026, indicatif)",
          items: [
            "TVA 0 % sur panneaux solaires et batteries (depuis février 2025)",
            "Smart Export Guarantee (SEG) : paiement du surplus injecté (tarif variable selon fournisseur)",
            "ECO4 / Great British Insulation Scheme : sous conditions de ressources",
            "Programmes locaux variables selon la région — vérifiez auprès de votre council"
          ],
          officialLink: "https://www.gov.uk/guidance/apply-for-the-boiler-upgrade-scheme",
          officialLabel: "gov.uk"
        },
        en: {
          title: "UK incentives (2026, indicative)",
          items: [
            "0% VAT on solar panels and batteries (since February 2025)",
            "Smart Export Guarantee (SEG): payment for exported surplus (rate varies by supplier)",
            "ECO4 / Great British Insulation Scheme: means-tested eligibility",
            "Local council schemes vary by region — check with your local authority"
          ],
          officialLink: "https://www.gov.uk/guidance/apply-for-the-boiler-upgrade-scheme",
          officialLabel: "gov.uk"
        }
      },
      comparator: {
        url: "https://www.theecoexperts.co.uk/solar-panels",
        name: "The Eco Experts"
      },
      disclaimer: {
        fr: "Données UK approximatives. Renseignez vos tarifs réels (prix électricité, tarif SEG, coût installation) pour un résultat fiable.",
        en: "UK data is approximate. Enter your actual rates (electricity price, SEG tariff, install cost) for reliable results."
      }
    }
  },

  // Panel specifications
  panels: {
    standard: { efficiency: 0.21, m2PerKwc: 4.76 },
    premium: { efficiency: 0.23, m2PerKwc: 4.35 }
  },

  // Default advanced parameters
  defaults: {
    coverageFactor: 1.0,  // surface = installed panel area (no roof coverage factor)
    selfConsumptionDefault: 50,
    selfConsumptionWithBattery: 80,
    batteryBoost: 35,  // +35% autoconsommation with battery
    pvDegradation: 0.5,  // %/year
    electricityPriceIncrease: 0,  // %/year (conservative default)
    discountRate: 3,  // % for NPV
    systemLifetime: 25,  // years
    batteryPresets: [5, 10, 15]  // kWh options
  },

  // Orientation coefficients (fallback if PVGIS unavailable)
  orientationCoefficients: {
    "S": 1.00, "SSE": 0.97, "SSW": 0.97,
    "SE": 0.95, "SW": 0.95,
    "ESE": 0.90, "WSW": 0.90,
    "E": 0.85, "W": 0.85,
    "ENE": 0.78, "WNW": 0.78,
    "NE": 0.70, "NW": 0.70,
    "NNE": 0.65, "NNW": 0.65,
    "N": 0.60
  },

  // Tilt coefficients (fallback if PVGIS unavailable)
  tiltCoefficients: {
    0: 0.90, 5: 0.93, 10: 0.95, 15: 0.96, 20: 0.98,
    25: 0.99, 30: 1.00, 35: 1.00, 40: 0.99, 45: 0.97,
    50: 0.94, 55: 0.91, 60: 0.88, 65: 0.84, 70: 0.80,
    75: 0.75, 80: 0.70, 85: 0.65, 90: 0.60
  },

  // Eurostat API config
  eurostat: {
    // Dataset: Electricity prices for household consumers (bi-annual)
    // nrg_pc_204: all taxes included
    baseUrl: "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/nrg_pc_204",
    defaultBand: "4141902",  // Band DC: 2500-5000 kWh (medium household)
    defaultTax: "X_TAX",    // All taxes and levies included
    defaultUnit: "KWH",
    defaultCurrency: "EUR"
  },

  // PVGIS config
  pvgis: {
    functionUrl: "/.netlify/functions/pvgis",
    directUrl: "https://re.jrc.ec.europa.eu/api/v5_3/PVcalc",
    defaultLoss: 14,  // system losses %
    defaultPeakPower: 1  // kWp (we scale after)
  },

  // NREL PVWatts config (US + Canada)
  nrel: {
    functionUrl: "/.netlify/functions/nrel",
    apiBaseUrl: "https://developer.nrel.gov/api/pvwatts/v8.json",
    defaultLoss: 14,
    defaultTilt: 30,
    defaultAzimuth: 180,  // South
    defaultArrayType: 1,   // Fixed roof mount
    defaultModuleType: 1,  // Standard
    defaultPeakPower: 1    // kW (we scale after)
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.SOLAR_DATA = SOLAR_DATA;
}
if (typeof module !== 'undefined') {
  module.exports = SOLAR_DATA;
}
