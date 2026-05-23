# Navigation v2 — Matrice entrée → objectif

Référence produit pour l’app Coton Noir. La barre basse reste : **Accueil · Découvrir · Routine · Profil** (+ « + » = mesure / journal).

> **Maj. mai 2026** : longueur hybride (repères + cm), problématiques profil/onboarding, favoris recettes, anneau accueil en cm seul. Patterns techniques : `.cursor/rules/stack.md`.

## Matrice

| Objectif | Entrées naturelles | Parcours gagnant |
|----------|-------------------|------------------|
| Hydrater chaque jour | Accueil, Routine | Matin → validation → streak |
| Moins de casse | Analyse (Découvrir / intent accueil) | Analyse → routine-plan → recettes du diagnostic |
| Gagner en longueur | Anneau accueil, Progression | Repères/cm profil → mesures zones → wash day → bilan trimestriel |
| Trouver des produits | Shop, Analyse | Fiche produit → routine-plan (tester) |
| Économiser | Recettes, Codes, Partenaires | DIY → routine ; codes partenaires ; **favoris recettes** |
| Rester motivée | CC, Récompenses, Communauté | Récompenses → défi Hydra / communauté |
| Tout comprendre | Articles, Tutos, Black Cotton | Contenu → coach flottant |
| Reprendre après absence | Accueil (bannière) | Routine courte → wash day simple |

## Découvrir (`explorerSections`)

Sections ordonnées par intention (plus « Mes outils » fourre-tout) :

1. **Prendre soin** — Routine, Wash day, Analyse, Profil capillaire  
2. **Progresser** — Croissance, Calculateur, Bilan trimestriel, Favoris (articles, produits, **recettes**)  
3. **Économiser & acheter** — Recettes, Codes, Shop, Partenaires, Box  
4. **Comprendre & se coiffer** — Articles, Tutos, Coiffures  
5. **Motivation & communauté** — Niveaux, Communauté, Inviter, Premium  

## Accueil

- **CTA principal** : `HomeRoutineCTA` (hydratation / validation du jour).  
- **Anneau longueur** : `HomeLengthRing` — **cm uniquement** dans le cercle ; objectif affiché en `Objectif X cm · date` (données via `getHomeLengthMetrics()` / `homeGrowth.ts`).  
- **Intent du jour** : `HomeIntentCard` — un seul raccourci contextuel selon `resolveHomeIntent()` (masqué si bannière comeback ou guide J0).  
- **Semaine capillaire** : après « Mes routines ».  

## Profil capillaire & onboarding

- **Longueur actuelle / souhaitée** : repères corporels (Oreilles → Hanches) + champ « Préciser en cm (optionnel) » ; stockage `repère|cm` si affiné.  
- **Problématiques** (optionnel) : 10 chips — onboarding étape 3 **avant** objectif principal ; même picker sur profil capillaire.  
- **Priorité affichage longueur** : mesures par zone > cm profil > estimation repère (voir `stack.md`).

## Deep links utiles

| Route | Params | Usage |
|-------|--------|--------|
| `/(tabs)/routine` | `routine`, `period=week` | Agenda semaine |
| `/routine-plan` | `source=product\|analysis\|event` | Parcours produit / analyse / coiffure |
| `/recipes` | `openId` | Ouvrir une recette ; favori depuis la fiche |
| `/favorites` | — | Onglets articles / produits / **recettes** |
| `/quarterly-bilan` | — | Bilan 90 j (Premium export) |
| `/hair-length` | — | Intent longueur ; mesures zones |
| `/hair-profile` | — | Repères, problématiques, objectif |
| `/growth-calculator` | — | Projection repères + cm |
| `/(tabs)/analyze` | — | Intent casse / produits |

## Non couvert en v2 (backlog)

- Analyse et Shop en onglet dédié  
- Filtre recettes par param URL depuis analyse  
- « + » central = hub multi-intent  
- Sync serveur des favoris recettes (aujourd’hui AsyncStorage local)
