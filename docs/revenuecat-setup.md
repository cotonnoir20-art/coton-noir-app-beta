# RevenueCat — Coton Noir

Les paiements in-app passent par **RevenueCat** (`react-native-purchases`).  
Ils restent **désactivés** tant que toutes les features listées dans `src/constants/premiumCatalog.ts` ne sont pas à `true`.

## 1. Dashboard RevenueCat

1. Créer un projet sur [app.revenuecat.com](https://app.revenuecat.com)
2. Lier **App Store Connect** (iOS) et **Google Play Console** (Android)
3. Créer l’entitlement **`premium`** (ou définir `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID`)
4. Créer les produits stores :
   - Mensuel : 9,99 €/mois
   - Annuel : 39,99 €/an
5. Créer une **Offering** `default` avec packages **Monthly** et **Annual**

## 2. Variables d’environnement

Dans `.env.local` (dev) et EAS Secrets (builds) :

```env
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=appl_xxxxxxxx
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=goog_xxxxxxxx
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=premium
```

Optionnel web : `EXPO_PUBLIC_PREMIUM_CHECKOUT_URL` (Stripe / landing allowlistée).

QA interne (bypass gate catalogue) : `EXPO_PUBLIC_PREMIUM_PURCHASES_FORCE=true` — **ne pas** utiliser en prod stores.

## 3. Activer les paiements

Dans `src/constants/premiumCatalog.ts`, passer chaque feature à `true` au fur et à mesure des livraisons.  
Quand **toutes** sont `true`, `isPremiumPurchasesEnabled()` retourne `true` et les boutons S'abonner s’activent.

## 4. Build native (obligatoire pour vrais achats)

- **Expo Go** : Preview API Mode (mocks) — pas de vrais achats
- **EAS development build** : `eas build --profile development --platform ios|android`
- New Architecture activée (Expo SDK 54) — utiliser `react-native-purchases` ≥ 10.x

## 5. Flux app

| Fichier | Rôle |
|---------|------|
| `src/constants/premiumCatalog.ts` | Catalogue features + readiness |
| `src/lib/premiumPaymentsGate.ts` | Gate paiements |
| `src/lib/revenueCat.ts` | SDK RevenueCat |
| `src/lib/premiumPurchase.ts` | Checkout + restore |
| `src/context/PremiumContext.tsx` | Init RC + sync entitlement |

## 6. Webhooks Supabase (à faire)

Pour synchroniser `profiles.is_premium` côté serveur :

1. RevenueCat → Project Settings → Integrations → Webhooks
2. Edge Function Supabase qui valide la signature RC et met à jour `profiles`
3. Ne jamais faire confiance au seul client pour l’accès Premium en prod

## 7. Restauration & gestion

- Bouton **Restaurer mes achats** sur `/premium` (visible quand paiements activés)
- Gestion abonnement : liens App Store / Play (à ajouter si besoin)
