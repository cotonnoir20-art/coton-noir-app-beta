# Coton Noir

App mobile/web capillaire (Expo + Supabase). Index maître — le détail est dans `.cursor/rules/`.

## Fichiers de règles
- Sécurité : @.cursor/rules/security.md
- Stack et conventions : @.cursor/rules/stack.md
- Workflow : @.cursor/rules/workflow.md

## Commandes
- Dev : `npm run dev` (Expo dev server)
- Build : `npm run build` (export web PWA → `dist/`)
- Test : `npm run test` (audit deps + rappel smoke test manuel)

Autres : `npm run web`, `npm run deploy:vercel` — voir @.cursor/rules/workflow.md

## Important
- Toujours lire les fichiers de règles avant de coder
- Ne jamais modifier les règles sans demander

## Dernière session (mai 2026) — résumé
- **Instructions** : structure `CLAUDE.md` + `.cursor/rules/` + `security.mdc` alwaysApply
- **Produit** : longueur repères/cm hybride, problématiques, favoris recettes, anneau accueil (cm seul)
- **Détail** : décisions, patterns, erreurs corrigées → @.cursor/rules/stack.md et @.cursor/rules/workflow.md
- **Navigation produit** : `docs/navigation-v2.md`

## Structure du repo

```
coton-noir-app/
├── CLAUDE.md
├── .cursor/rules/     # security.md, stack.md, workflow.md (+ security.mdc)
├── .cursorrules
├── .env.local         # secrets (jamais commité)
├── app/
├── src/
├── supabase/
└── docs/
```
