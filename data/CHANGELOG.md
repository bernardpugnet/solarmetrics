# SolarMetrics — Data Changelog

## v2026-03 (7 mars 2026)
- **Création** du dataset initial d'hypothèses (`/data/snapshots/2026-03/assumptions.json`)
- CAPEX : modules PV (PERC, TOPCon, HJT), onduleurs, batteries LFP, coûts installés France
- OPEX : maintenance, assurance, dégradation panneaux & batterie
- WACC : taux d'actualisation par segment (résidentiel, C&I, utility)
- Productible : rendements PVGIS par zone géographique
- Prix : tarifs EDF OA T1 2026, prime autoconsommation, TVA réduite
- CO₂ : facteurs d'émission RTE 2024, mix France/Allemagne/Europe
- **Page Prix du Solaire** : création avec données complètes 2025-2026
- **Page Hypothèses** : interface à onglets avec download JSON
- **Simulateur autoconsommation** : ajout pertes système, hausse prix, type montage, profils EV/PAC/ECS, comparaison batterie

### Sources principales
- Fraunhofer ISE Photovoltaics Report 2025
- IRENA Renewable Power Generation Costs 2024
- BNEF Global Solar Outlook 2026
- PV Tech, PV Magazine
- RTE Bilan électrique 2024
- photovoltaique.info (tarifs OA)
- Légifrance (arrêtés tarifaires)
- Eurostat (prix électricité ménages)
- ADEME (consommation résidentielle)
