# Brouillons LinkedIn — SolarMetrics

---

## POST 1 : Lancement du site + Analyse LCOE

**Accroche** (les 3 premières lignes visibles avant "voir plus")

Un écart de x2,5 sur le LCOE solaire en Europe : de 24 à 62 €/MWh.
J'ai analysé 9 marchés pour comprendre pourquoi.
Voici ce que j'ai trouvé :

**Corps**

Après 30 ans en finance de marché et gestion des risques, je me suis posé une question simple : est-ce que ma rigueur quantitative peut apporter quelque chose au secteur solaire ?

Pour y répondre, j'ai créé SolarMetrics — un site bilingue FR/EN qui combine :

→ Des analyses sourcées (IRENA, IEA-PVPS, Fraunhofer ISE)
→ Un calculateur LCOE/TRI interactif (12 paramètres, Chart.js)
→ Des comparaisons par pays avec données vérifiées

Ma première analyse porte sur le LCOE solaire en Europe.

Quelques chiffres clés :
• Espagne : 24–32 €/MWh (meilleure irradiation EU)
• France : 35–48 €/MWh (en forte baisse)
• Allemagne : 42–56 €/MWh (volume record malgré un LCOE plus élevé)
• Royaume-Uni : 48–62 €/MWh (le haut de fourchette en Europe)

La formule est connue. Ce qui fait la différence, c'est la qualité des hypothèses.

C'est exactement ce que mon background en pricing d'options et stress tests m'a appris : chaque paramètre compte, chaque sensibilité doit être quantifiée.

L'analyse complète est ici : https://solarmetrics.netlify.app/fr/analyses/lcoe-solaire-europe

Quel WACC utilisez-vous en comité d'investissement pour vos projets solaires ? Curieux de comparer les pratiques.

Je suis en transition vers l'asset management / project finance solaire.
Si vous cherchez quelqu'un qui sait modéliser, analyser et challenger les chiffres → parlons-en.

**Astuce** : accompagne ce post d'une capture d'écran du graphique LCOE par pays de ton article (barres horizontales) — un visuel simple booste la portée de ~20%.

#SolairePhotovoltaique #LCOE #EnergiesRenouvelables #ProjectFinance #AssetManagement #SolarFinance #PV #Finance

---

## POST 2 : Analyse PPA (à publier ~1 semaine après)

**Accroche**

Le PPA solaire moyen en Europe atteint 34,25 €/MWh au Q3 2025 (LevelTen).
Mais entre le Portugal à ~33 €/MWh et l'Irlande à ~120 €/MWh, la dispersion est énorme.
J'ai décortiqué les chiffres pays par pays :

**Corps**

Ma deuxième analyse sur SolarMetrics porte sur les prix PPA solaires en Europe.

Ce que montrent les données (LevelTen, Pexapark, Wood Mackenzie) :

→ L'Espagne et le Portugal affichent les PPA les plus bas d'Europe (<40 €/MWh)
→ L'Allemagne voit ses prix chuter de -15% en un an
→ L'Italie enregistre +184% de volumes PPA signés au H1 2025 (Pexapark)
→ La Pologne émerge comme le marché PPA à la croissance la plus rapide

Mais le vrai sujet, c'est la cannibalisation solaire :
• En Allemagne, les heures à prix négatifs ont doublé en 2024 — et ça continue
• Le taux de capture solaire chute (de 85% vers 65-75% selon les marchés)
• Les PPA "vanilla" sans stockage deviennent plus risqués

La solution ? Des structures hybrides PV + batterie, et des contrats plus sophistiqués.

C'est là que l'expertise en gestion des risques financiers prend tout son sens.

Analyse complète : https://solarmetrics.netlify.app/fr/analyses/prix-ppa-solaire-europe

Si vous structurez des PPA, discutons risques de cannibalisation — c'est mon terrain.

#PPA #SolairePV #PowerPurchaseAgreement #EnergieRenouvelable #MarchéElectricité #SolarFinance #Stockage #BESS

---

## POST 3 : Le calculateur (à publier ~2 semaines après)

**Accroche**

J'ai codé un calculateur solaire avec 12 paramètres financiers.
Pas un gadget. Un vrai outil de pré-faisabilité.
Testez-le gratuitement :

**Corps**

En asset management solaire, on a besoin de réponses rapides :
• Quel LCOE pour ce site ?
• Quel TRI avant impôt ?
• À quel prix PPA le projet est-il à l'équilibre ?

J'ai développé un calculateur (V1) qui répond à ces questions en temps réel.

Ce qu'il fait :
→ 12 paramètres ajustables (CAPEX, OPEX, taux d'actualisation, dégradation...)
→ Presets régionaux (Nord, Centre, Sud Europe via PVGIS)
→ Choix du montage (fixe ou tracker)
→ 5 indicateurs : LCOE, TRI, VAN, prix d'équilibre, payback
→ Graphique cash-flows sur la durée du projet

Les valeurs par défaut sont sourcées :
• CAPEX : fourchette 450–700 €/kW utility-scale (Fraunhofer ISE 2024)
• OPEX : 13,3 €/kW/an (Fraunhofer ISE)
• WACC : 5,3% nominal (IRENA, moyenne EU)

100% JavaScript, pas de backend, pas de compte à créer.

Essayez-le : https://solarmetrics.netlify.app/fr/outils

C'est une V1 — les prochaines versions intégreront d'autres technologies et des scénarios de sensibilité. Retours bienvenus pour orienter les évolutions.

Si vous travaillez en développement ou asset management PV, testez et dites-moi ce qu'il manque.

#Calculateur #LCOE #TRI #SolairePV #AssetManagement #SolarFinance #JavaScript #Outil

---

## NOTES D'UTILISATION

1. **Fréquence** : 1 post par semaine pendant 3 semaines
2. **Meilleur moment** : mardi ou mercredi, 8h-9h ou 12h-13h (peak LinkedIn pros Europe)
3. **Format** : texte + 1 visuel (capture d'écran graphique de l'article). Alternative : tester un carousel (3 slides : accroche, chiffres clés, lien) pour booster les impressions
4. **Engagement** : répondre à chaque commentaire dans les 2h. Poser des questions en réponse ("Quel marché PPA vous intéresse ?") pour relancer le fil
5. **Hashtags** : 5-8 max, toujours inclure #SolarFinance (niche) + mix génériques/spécialisés
6. **Personnalisation** : adapter les chiffres du parcours si besoin (dates, intitulés de postes)
7. **Mesure** : suivre via LinkedIn Analytics (impressions, clics sur les liens, profils visiteurs). Si la portée est faible, envisager un boost sponsorisé ciblé (~20€) vers "asset managers solaire France"
