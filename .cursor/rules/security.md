# Règles de sécurité - OBLIGATOIRES

> **Gouvernance (mai 2026)** : ce fichier est la source canonique. Copie indexée dans `CLAUDE.md` / `.cursorrules` ; application auto Cursor via `security.mdc` (`alwaysApply: true`). Ne pas éditer sans demande explicite.


## Secrets & Clés API
- JAMAIS de clé API, token, ou mot de passe en dur dans le code
- TOUS les secrets vont dans un fichier `.env.local` (jamais commité)
- Le fichier `.env` doit être dans le `.gitignore` AVANT le premier commit
- Côté client (Expo) : utiliser UNIQUEMENT les variables `EXPO_PUBLIC_*`
- Côté serveur (Edge Functions Supabase) : clés sensibles via secrets Deno / dashboard — jamais exposées au frontend
- La **service role key** Supabase = backend uniquement ; en app mobile/web : **anon key** uniquement

## Base de données (Supabase)
- Row Level Security (RLS) ACTIVÉ sur TOUTES les tables sans exception
- Chaque table : au minimum 1 policy SELECT, 1 UPDATE, 1 DELETE (selon besoins)
- Policy par défaut = RESTRICTIVE (tout bloqué sauf autorisation explicite)
- Utiliser UNIQUEMENT `auth.uid()` dans les policies (JAMAIS `user_metadata`)
- Ajouter `WITH CHECK` sur toutes les policies UPDATE et INSERT
- Index sur `user_id` pour chaque table avec RLS
- Migrations SQL dans `supabase/` — requêtes paramétrées, pas de concaténation utilisateur

## Authentification
- Routes protégées : redirection login si session absente (`app/(auth)/`, guards layout)
- JWT validé côté serveur pour les Edge Functions (`getUser()`)
- Logout : `supabase.auth.signOut()` + purge état local (pas seulement un redirect)
- Stockage session : `expo-secure-store` / KV sécurisé (`src/lib/secureStorage.ts`)
- Refresh token géré par le client Supabase (`autoRefreshToken: true`)

## Inputs utilisateur (injections)
- JAMAIS de concaténation SQL → requêtes paramétrées / client Supabase typé
- JAMAIS de `dangerouslySetInnerHTML` avec contenu utilisateur
- Valider ET sanitizer côté serveur (Edge Functions) pour tout input critique
- Contenu communautaire / avis : modération et limites de taille

## API & Réseau
- HTTPS obligatoire en production
- CORS restreint sur les Edge Functions (domaines explicites, pas `*`)
- Rate limiting sur login, signup, paiement, posts communauté
- Pas de secrets dans les URLs (`?apiKey=xxx` interdit)

## Dépendances & Packages
- Vérifier chaque package ajouté dans `package.json` avant commit
- Lancer `npm audit` régulièrement
- Se méfier des packages peu connus suggérés par l’IA
- Pas de `eval()`, `Function()`, ni exécution dynamique de code

## Déploiement
- Variables d’environnement dans EAS / Vercel / Supabase dashboard — pas dans Git
- Tester le parcours complet en staging avant production
- Pas de stack trace visible en production
- Headers web : CSP (`src/lib/webCsp.ts`), X-Frame-Options, HSTS (Vercel)
