# Pages légales — Coton Noir

## URLs publiques (stores & site)

| Page | URL | Fichier app |
|------|-----|-------------|
| Politique de confidentialité | https://appcotonnoir.com/privacy | `app/privacy.tsx` |
| CGV (Premium) | https://appcotonnoir.com/cgv | `app/cgv.tsx` |
| Hub légal (CGU, mentions, RGPD) | https://appcotonnoir.com/legal | `app/legal.tsx` |

**Source unique du texte** : `src/content/legalDocuments.ts`

Ces routes sont accessibles **sans connexion** (requis App Store Connect / Google Play).

## Contacts

- Données / juridique : contact@appcotonnoir.com
- Support : support@appcotonnoir.com

## À compléter avant publication

- [ ] Raison sociale exacte (SAS, SARL…)
- [ ] Adresse du siège social
- [ ] Numéro SIRET / RCS
- [ ] Nom du médiateur de la consommation (CGV §12)
- [ ] Vérification par un avocat / DPO

## Déploiement Vercel

Les pages `/privacy` et `/cgv` restent visibles même si `EXPO_PUBLIC_ALLOW_WEB_PROD` est désactivé (voir `WebProductionBlocker`).
