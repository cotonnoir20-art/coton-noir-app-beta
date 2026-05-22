# Navigation v2 — Matrice entrée → objectif

Référence produit pour l’app Coton Noir. La barre basse reste : **Accueil · Découvrir · Routine · Profil** (+ « + » = mesure / journal).

## Matrice

| Objectif | Entrées naturelles | Parcours gagnant |
|----------|-------------------|------------------|
| Hydrater chaque jour | Accueil, Routine | Matin → validation → streak |
| Moins de casse | Analyse (Découvrir / intent accueil) | Analyse → routine-plan → recettes du diagnostic |
| Gagner en longueur | Anneau accueil, Progression | Mesure → wash day planifié → bilan trimestriel |
| Trouver des produits | Shop, Analyse | Fiche produit → routine-plan (tester) |
| Économiser | Recettes, Codes, Partenaires | DIY → routine ; codes partenaires |
| Rester motivée | CC, Récompenses, Communauté | Récompenses → défi Hydra / communauté |
| Tout comprendre | Articles, Tutos, Black Cotton | Contenu → coach flottant |
| Reprendre après absence | Accueil (bannière) | Routine courte → wash day simple |

## Découvrir (`explorerSections`)

Sections ordonnées par intention (plus « Mes outils » fourre-tout) :

1. **Prendre soin** — Routine, Wash day, Analyse, Profil capillaire  
2. **Progresser** — Croissance, Calculateur, Bilan trimestriel, Favoris  
3. **Économiser & acheter** — Recettes, Codes, Shop, Partenaires, Box  
4. **Comprendre & se coiffer** — Articles, Tutos, Coiffures  
5. **Motivation & communauté** — Niveaux, Communauté, Inviter, Premium  

## Accueil

- **CTA principal** : `HomeRoutineCTA` (hydratation / validation du jour).  
- **Intent du jour** : `HomeIntentCard` — un seul raccourci contextuel selon `resolveHomeIntent()` (masqué si bannière comeback ou guide J0).  
- **Semaine capillaire** : après « Mes routines ».  

## Deep links utiles

| Route | Params | Usage |
|-------|--------|--------|
| `/(tabs)/routine` | `routine`, `period=week` | Agenda semaine |
| `/routine-plan` | `source=product\|analysis\|event` | Parcours produit / analyse / coiffure |
| `/recipes` | — | Depuis analyse : section « Recettes pour ton diagnostic » |
| `/quarterly-bilan` | — | Bilan 90 j (Premium export) |
| `/hair-length` | — | Intent longueur |
| `/(tabs)/analyze` | — | Intent casse / produits |

## Non couvert en v2 (backlog)

- Analyse et Shop en onglet dédié  
- Filtre recettes par param URL depuis analyse  
- « + » central = hub multi-intent  
