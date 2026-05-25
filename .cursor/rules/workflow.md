# Workflow — commandes & process

## Setup local
1. `npm install`
2. Copier `.env.example` → `.env.local` (ou créer `.env.local`) avec `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Ne jamais committer `.env` / `.env*.local` (déjà dans `.gitignore`)

## Développement
| Commande | Usage |
|----------|--------|
| `npm run dev` | Expo dev server (alias de `npm start`) |
| `npm start` | Idem |
| `npm run start:tunnel` | Expo avec tunnel (test device distant) |
| `npm run android` | Build/run Android natif |
| `npm run ios` | Build/run iOS natif |
| `npm run web` | Preview web locale |

## Build & déploiement web
| Commande | Usage |
|----------|--------|
| `npm run build` | Export statique web → `dist/` (alias de `build:web`) |
| `npm run build:web` | Idem |
| `npm run preview:web` | Servir `dist/` en local |
| `npm run deploy:vercel` | Prod Vercel |
| `npm run deploy:vercel:preview` | Preview Vercel |

Checklist Vercel : `scripts/vercel-env-checklist.txt`

## Scripts assets (ponctuels)
- `npm run flatten-welcome-avatar`
- `npm run flatten-hair-types`
- `npm run flatten-locks`

## Supabase
- Exécuter les `.sql` du dossier `supabase/` dans l’ordre logique (RLS, FK, fonctions) via SQL Editor
- Edge Functions : `supabase/functions/` — secrets dans le dashboard Supabase
- **Session mai 2026** : scripts listés dans `stack.md` (section SQL) — vérifier lesquels sont déjà appliqués avant prod
- **Pré-déploiement RLS** : `supabase/security-pre-deploy-rls.sql` (profiles WITH CHECK, reward_*, routine plans)
- **Edge Function integrity** : secret `INTEGRITY_ALLOWED_ORIGINS` + redeploy `verify-app-integrity`

## Avant commit (IA ou humain)
1. Relire le diff ; pas de secrets ni clés en dur
2. `npm run test` ou `npm audit` si nouvelles dépendances
3. Vérifier RLS pour tout nouveau SQL
4. Tester le parcours touché sur device ou web
5. Ne pas modifier `.cursor/rules/*`, `CLAUDE.md`, `.cursorrules` sans demande

## Tests
- `npm run test` → `npm audit --audit-level=high` (pas de suite Jest)
- Smoke test manuel : auth → onboarding → accueil → écran modifié

## Smoke tests recommandés (features mai 2026)
| Parcours | Vérifier |
|----------|----------|
| Onboarding | Repères longueur + cm optionnel ; problématiques (étape 3) ; objectif |
| Profil capillaire | Même pickers ; problématiques visibles |
| Accueil | Anneau = cm seul ; objectif `X cm · date` |
| Calculateur pousse | Repères actuel/objectif sans crash |
| Recettes | Favori → onglet Favoris → badge achievement |
| Croissance | Mesures zones prioritaires sur repère seul |

---

## Journal de session (mai 2026)

### Commits livrés (fonctionnalités app)
- **`b874252`** — longueur par repères corporels + problématiques capillaires
- **`1c5e8be`** — longueur hybride (zones/cm/repère), favoris recettes, anneau cm, fix calculateur

### Commits / fichiers instructions (à committer si pas encore fait)
- `CLAUDE.md`, `.cursorrules`, `.cursor/rules/*` (security, stack, workflow, security.mdc)
- `package.json` — alias `dev`, `build`, `test`

### Process suivi aujourd’hui
1. Règles sécurité → `security.md` + `security.mdc` (alwaysApply)
2. Restructuration index `CLAUDE.md` (template `@.cursor/rules/...`, ~50 lignes)
3. Documentation patterns dans `stack.md` + smoke tests ici
4. Mise à jour `docs/navigation-v2.md` (anneau, favoris, profil)
