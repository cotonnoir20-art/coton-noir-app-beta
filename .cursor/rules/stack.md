# Stack & conventions — Coton Noir

## Stack
- **Runtime** : Expo SDK 54, React Native 0.81, React 19
- **Navigation** : Expo Router (`app/`, file-based routing)
- **Langage** : TypeScript strict
- **Backend** : Supabase (Auth, Postgres, Storage, Edge Functions dans `supabase/functions/`)
- **État** : React Context (`src/context/`), AsyncStorage pour cache local
- **UI** : composants dans `src/components/`, thème `src/constants/theme.ts`
- **Web / PWA** : `expo export -p web`, déploiement Vercel

## Arborescence
```
app/              # Écrans Expo Router (tabs, auth, modales)
src/
  components/     # UI réutilisable (profile/, home/, growth/)
  constants/      # Données statiques, repères, thème, problématiques
  context/        # AppContext, Achievements, etc.
  lib/            # Supabase, premium, homeGrowth, contentFavorites, etc.
supabase/         # Scripts SQL migrations (à exécuter dans le dashboard)
docs/             # Documentation métier / navigation produit
.cursor/rules/    # security.md, stack.md, workflow.md (+ security.mdc)
CLAUDE.md         # Index maître IA (~50 lignes)
```

## Conventions de code
- Chemins relatifs cohérents avec le fichier appelant (`../../src/...` depuis `app/`)
- Pas de logique métier lourde dans les écrans : extraire vers `src/lib/` ou `src/constants/`
- Nommage : camelCase (TS), PascalCase (composants), fichiers écrans en kebab ou nom route
- Texte UI en français ; commentaires en français si nécessaire (code auto-documenté sinon)
- Styles profil/onboarding : `src/components/profile/profileSectionStyles.ts` (titres 14px semi-gras)
- Variables d’env publiques : préfixe `EXPO_PUBLIC_` uniquement (voir `src/lib/supabase.ts`)

## Supabase côté app
- Client unique : `src/lib/supabase.ts` (anon key + `pickAuthKV()`)
- Pas de service role dans le repo mobile
- Nouvelles tables : fichier SQL dans `supabase/` + RLS documenté dans `security.md`

## Premium & achats
- IAP : RevenueCat (`react-native-purchases`) + gate catalogue `src/constants/premiumCatalog.ts`
- Legacy : `expo-iap` conservé mais non utilisé pour le checkout
- Web checkout : `EXPO_PUBLIC_PREMIUM_CHECKOUT_URL`
- Logique : `src/lib/premiumPurchase.ts`, `src/lib/premiumAccess.ts`

---

## Décisions & patterns (session mai 2026)

### Instructions projet (gouvernance IA)
- **Décision** : index court `CLAUDE.md` + règles détaillées dans `.cursor/rules/` (`security.md`, `stack.md`, `workflow.md`).
- **Décision** : références `@.cursor/rules/...` pour attacher le contexte ; `.cursorrules` = renvoi legacy.
- **Décision** : `security.mdc` avec `alwaysApply: true` pour Cursor ; contenu canonique dans `security.md`.
- **Décision** : alias npm `dev` / `build` / `test` alignés sur le template (voir `workflow.md`).
- **Règle** : ne pas modifier les fichiers de règles sans demande explicite.

### Longueur capillaire (repères + cm hybride)
- **Repères** : Oreilles → Hanches (`src/constants/hairLengthLandmarks.ts`), fourchettes cm par repère.
- **Sérialisation profil** : `Épaules|38` = repère + cm affiné optionnel (`parseProfileLength` / `serializeProfileLength`).
- **Priorité longueur actuelle** (`resolveCurrentLength` dans `src/lib/homeGrowth.ts`) :
  1. Moyenne des dernières mesures par zone (`HOME_GROWTH_ZONES`, sync avec `growth.tsx` / `hair-length.tsx`)
  2. Dernière mesure zone « Devant »
  3. Cm affiné du profil
  4. Estimation du repère (`refined` / `estimate`)
- **Objectif** : `resolveTargetLength` sur `profileTarget` (même parseur).
- **UI partagée** : `HairLengthLandmarkPicker`, `ProfileLengthLandmarksForm` — variantes `profile` | `onboarding` via `profileSectionStyles`.
- **Écrans** : `app/hair-profile.tsx`, `app/(auth)/onboarding.tsx`, `app/hair-length.tsx`, `app/growth-calculator.tsx`.
- **Projection** : `src/lib/growthProjection.ts` + bannière si `projectionIsEstimate` (confiance insuffisante).

### Anneau accueil (`HomeLengthRing`)
- **Décision** : afficher **uniquement les cm** dans le cercle (plus le libellé repère).
- **Objectif sous l’anneau** : `Objectif X cm · date` (pas repère + cm).
- **Métriques** : `getHomeLengthMetrics()` dans `homeGrowth.ts` (labels, confidence, flags estimation).

### Problématiques capillaires
- **Liste canonique** : 10 chips avec icônes (`src/constants/hairProblematics.ts`).
- **Migration** : `normalizeProblematicLabel` + `LEGACY_ALIASES` pour anciens libellés profil.
- **UI** : `HairProblematicsPicker` — onboarding **étape 3, optionnelle, avant objectif principal** ; idem profil capillaire.
- **Stockage** : libellés français en base (pas les ids seuls).

### Favoris recettes
- **Pattern** : même couche AsyncStorage que articles/produits (`src/lib/contentFavorites.ts`, clé `@coton_noir_fav_recipes`).
- **Écrans** : onglet Recettes dans `app/favorites.tsx` ; bouton signet dans `app/recipes.tsx` (`openId` en param).
- **Badge** : « Première recette testée » via favoris recettes (`AchievementsContext`).

### Harmonisation UI profil
- Titres de section unifiés via `profileSectionStyles.ts` (14px, semi-gras) sur pickers profil/onboarding.

### SQL Supabase (côté dashboard — pas exécuté par l’agent)
Scripts récents à appliquer manuellement si pas déjà fait : `community-virality.sql`, `community-likes-hydra.sql`, `premium-access.sql`, `security-premium-checkout.sql`, `product-analytics.sql`, `product-test-signals.sql`, `similar-routine-recos.sql`.

---

## Erreurs corrigées (session mai 2026)

| Symptôme | Cause | Correctif |
|----------|--------|-----------|
| `profileSectionStyles is not defined` | Import manquant | Import dans `HairLengthLandmarkPicker.tsx` |
| `targetLandmarkLabel is not defined` | Props non branchées | Props `HomeLengthRing` puis simplification (cm seul) |
| `objTargetLandmark is not defined` | `useState` manquants | États repère objectif dans `growth-calculator.tsx` |
| `resolveCurrentLength is not a function` | Fonctions supprimées par erreur | Restauration exports dans `homeGrowth.ts` |
| Problématiques absentes du profil | Composant importé mais pas dans le JSX | `HairProblematicsPicker` ajouté dans `hair-profile.tsx` |
