# Stratégie de communication B2B — Partenaires & marques · Coton Noir

**Objectif** : attirer des marques (cosmétiques, salons, accessoires, services) qui investissent dans **la routine quotidienne** des utilisatrices — pas de la pub interruptive.

> **Maj. technique mai 2026** (app) : profil enrichi (repères longueur + cm, 10 problématiques capillaires), favoris recettes, anneau accueil en cm, scripts SQL communauté/premium/analytics à déployer. Détail dev : `.cursor/rules/stack.md`, `docs/navigation-v2.md`.

**Alignement produit** (déjà en app) :
| Levier dossier | Écran / table Supabase | Statut |
|----------------|------------------------|--------|
| A. Récompense (codes) | `Récompenses` + `codes` (`promo_codes`) | ✅ Live |
| B. Expertise (guides) | `articles` + `recipes` + Premium + **favoris recettes** | ✅ Contenu |
| C. Échantillons / avis | Missions CC + `community` + likes/Hydra (SQL prêt) | 🔶 SQL à exécuter |
| D. Visibilité native | `shop` + reco Black Cotton (roadmap) | 🔶 Partiel |
| Annuaire partenaires | `partners` | ✅ Live |
| Niveaux & % réduction | `levels.ts` (5% → 50% partenaire) | ✅ Gamification |
| Profil & rétention | `hair-profile`, onboarding, anneau longueur | ✅ Mai 2026 |

---

## 1. Proposition de valeur (une phrase)

**Pour une marque** : « Coton Noir place votre offre au moment où l’utilisatrice prend soin de ses cheveux — et la récompense quand elle est régulière. Vous touchez une audience 100 % cheveux texturés / afro, avec une data d’usage réelle (porosité, routines, wash day). »

**Ce que vous ne vendez pas** : des impressions génériques.  
**Ce que vous vendez** : du **trafic qualifié**, des **avis authentiques**, de la **notoriété éthique** et des **conversions mesurables**.

---

## 2. Cibles prioritaires (ICP marque)

| Segment | Exemples | Levier principal | Budget type |
|---------|----------|------------------|-------------|
| **Marques capillaires** | indie clean beauty, gammes afro, masques, leave-in | A + C + D | 500–5 000 €/mois |
| **Accessoires** | bonnets satin, brosses, vaporisateurs | A + D | 300–2 000 €/mois |
| **Salons / pros** | coiffeuses afro, trichologues | A + B (guides) | 200–1 500 €/mois |
| **Retail / e-commerce** | parapharmacie niche, marketplaces | A + D | variable |
| **Médias / experts** | créateurs, associations | B (co-branding) | échange visibilité |

**Critères de qualification** :
- Produits adaptés cheveux texturés / afro (ou service explicite)
- Site / Instagram actifs
- Capacité à fournir **codes**, **échantillons** ou **contenu expert**
- Alignement clean / santé capillaire (pas de greenwashing)

---

## 3. Les 4 leviers — packages communication + livrables

### Levier A — « Récompense » (Codes & CotonStore)

**Promesse marque** : « Vos codes sont échangés contre des CotonCoins gagnés en prenant soin de leurs cheveux. »

| Élément | Détail |
|---------|--------|
| **Dans l’app** | Fiche `partners` + ligne `promo_codes` (-10 / -15 / -20 %) · coût en CC dans catalogue `Récompenses` |
| **Livrables comm** | Logo sur card partenaire · notif push « Offre [Marque] » · Story co-brandée |
| **KPI** | Copies de code · clics `partner_url` · ventes trackées (UTM) |
| **Tarif indicatif** | à partir de **800 €/trimestre** (1 code actif + visibilité annuaire) |

**Script pitch (30 s)** :  
« Vos clientes existent déjà sur Coton Noir. Elles gagnent des CotonCoins en validant leur routine. Elles les dépensent chez vous avec un code exclusif. Vous payez pour du trafic chaud, pas pour du scroll froid. »

---

### Levier B — « Expertise » (Articles, recettes, e-books)

**Promesse marque** : « Devenez la référence technique dans l’app. »

| Élément | Détail |
|---------|--------|
| **Dans l’app** | Article signé expert·e + marque · Recette DIY avec produits [Marque] · Guide PDF débloquable (CC ou Premium) |
| **Livrables comm** | « Guide co-créé by [Marque] » · carrousel IG · extrait Reel · mention onboarding |
| **KPI** | Lectures · sauvegardes · temps passé · leads newsletter marque |
| **Tarif indicatif** | **1 200–3 000 €** par guide + diffusion 30 jours |

**Formats contenu** :
- Article : « 5 erreurs avec les masques [ingrédient star de la marque] »
- Recette : pré-poo / masque maison aligné produit
- E-book : « Le wash day parfait with [Marque] » (8–12 pages)

---

### Levier C — « Échantillonnage & avis » (Missions)

**Promesse marque** : « Des testeuses engagées, des avis dans l’app, du UGC pour vos réseaux. »

| Élément | Détail |
|---------|--------|
| **Mécanique** | Mission : « Teste [Produit] · poste ton avis + photo · +200 CC » · sélection profils (porosité, type) |
| **Dans l’app** | Feed communauté · fiche produit `shop` · notation |
| **Livrables comm** | 20–50 avis · 10 UGC réutilisables (avec accord) · rapport synthèse |
| **KPI** | Taux complétion mission · note moyenne · taux de rachat code |
| **Tarif indicatif** | **2 000–6 000 €** / campagne (produits fournis par la marque) |

**Brief type mission (copy app)** :  
« Teste le [Masque X] pendant 2 wash days. Note hydratation, définition, parfum. Gagne 200 CC + badge “Testeuse [Marque]”. »

---

### Levier D — « Visibilité native » (Reco & placement)

**Promesse marque** : « Votre produit apparaît quand le profil matche le besoin. »

| Élément | Détail |
|---------|--------|
| **Dans l’app** | Bannière accueil / highlight · reco post-analyse · slot `shop` · algorithme porosité × objectif |
| **Livrables comm** | « Recommandé par Black Cotton » · case study chiffrée |
| **KPI** | Impressions in-app · CTR fiche produit · conversion |
| **Tarif indicatif** | **1 500–8 000 €/mois** selon exclusivité catégorie |

**Exemples de déclencheurs** :
- Porosité haute + objectif hydratation → leave-in riche [Marque]
- Mode protecteur actif → soin racines [Marque]
- Après analyse IA « sécheresse » → masque [Marque]

---

## 4. Piliers de contenu B2B — TOFU · MOFU · BOFU

### TOFU — Notoriété auprès des marques (elles découvrent Coton Noir)

| Pilier | Message | Canaux | Formats |
|--------|---------|--------|---------|
| **Marché & tendance** | « +400 % sur certaines gammes afro — le CAC social explose » | LinkedIn, newsletter pro | Carrousel data · post court |
| **Problème CAC** | « Vous payez pour des vues. Nous pour des routines. » | LinkedIn Ads ciblé « brand manager beauty » | Vidéo 45 s |
| **Mission brand** | « Santé capillaire + gamification éthique » | Site page `/marques` | Manifesto 1 page |
| **Preuve écosystème** | Captures app · PWA live · témoignages utilisatrices | Email froid · salons pros | PDF 3 slides |

**CTA TOFU** : Télécharger le dossier partenariat · S’inscrire au webinar « Partenaires Coton Noir »

---

### MOFU — Considération (elles comparent les options)

| Pilier | Message | Canaux | Formats |
|--------|---------|--------|---------|
| **Les 4 leviers** | Dossier détaillé A/B/C/D | Email nurturing | PDF + vidéo démo 3 min |
| **Case study fictive puis réelle** | « Marque X : +Y clics code en 30 j » | LinkedIn | Post chiffres |
| **Data audience** | Profil utilisatrices (âge, zones, porosité) | Appel découverte | Deck 10 slides |
| **Comparatif** | Influence vs App partenaire vs Retail | Blog pro | Tableau |
| **Co-création contenu** | Exemple article + recette | Instagram B2B2C | Mockups |

**CTA MOFU** : Réserver un appel 20 min · Demander une proposition sur mesure

---

### BOFU — Conversion (signature partenariat)

| Pilier | Message | Canaux | Formats |
|--------|---------|--------|---------|
| **Offre pack** | Starter / Growth / Icon (voir §6) | Proposition commerciale | Devis 1 page |
| **Onboarding partenaire** | Checklist : logo, code, URL, visuels | Email post-signature | Notion / PDF |
| **Lancement co-brandé** | « [Marque] x Coton Noir — -15 % dans l’app » | Réseaux des deux marques | Kit presse |
| **Reporting** | Dashboard mensuel (clics, codes, missions) | Email dédié account manager | PDF 1 page |

**CTA BOFU** : Signer · Payer · Date de mise en ligne code

---

## 5. Architecture des messages (marque)

```
TOFU  → « Le marché afro/texturé croît. Votre CAC aussi. Il existe une autre porte d’entrée. »
MOFU  → « Coton Noir = audience qualifiée + 4 leviers mesurables. Voici la démo. »
BOFU  → « Choisissez votre pack. On active votre code sous 7 jours. »
```

**Ton B2B** : professionnel, data-driven, partenarial (pas condescendant). Tutoiement ou vouvoiement selon la marque (indie = tu, groupe = vous).

---

## 6. Grille d’offres commerciales (simplifiée)

| Pack | Inclus | Prix indicatif / trimestre |
|------|--------|---------------------------|
| **Starter** | Fiche `partners` + 1 code promo + mention newsletter | 800 € |
| **Growth** | Starter + article OU recette co-brandé + notif in-app + mission 50 testeuses | 2 500 € |
| **Icon** | Growth + reco native 30 j + highlight accueil + rapport data + exclusivité catégorie | 6 000 €+ |
| **Sur mesure** | Mix leviers + salons + événements | devis |

*Produits fournis par la marque pour les missions (levier C).*

---

## 7. Plan de communication B2B (90 jours)

### Mois 1 — Fondations
- [ ] Page web **/marques** (reprendre dossier §1–5)
- [ ] PDF **Dossier Partenariat** (votre texte + captures app)
- [ ] LinkedIn page + 2 posts/semaine TOFU
- [ ] Liste 50 marques cibles (tier 1 indie, tier 2 établies)
- [ ] Séquence email froid 3 touches (voir §8)

### Mois 2 — Preuves
- [ ] 1 partenaire pilote à prix réduit (case study)
- [ ] Webinar « Comment toucher les routines capillaires » (30 min)
- [ ] Participation 1 salon / événement afro beauty (stand QR PWA)

### Mois 3 — Scale
- [ ] 5 partenaires actifs minimum
- [ ] Template reporting automatique
- [ ] Kit « lancement partenaire » (Stories + notif + post)

---

## 8. Séquence email B2B (prospection)

**Objet 1** : `Vos clientes sont déjà en routine — pas encore chez vous ?`  
**Corps** : 4 lignes + lien dossier PDF + capture app Récompenses/Codes.

**Objet 2 (J+4)** : `CAC Instagram vs routine capillaire (chiffres)`  
**Corps** : marché +400 %, CAC, notre solution en 1 paragraphe.

**Objet 3 (J+9)** : `4 façons de collaborer — laquelle vous correspond ?`  
**Corps** : A/B/C/D en bullet · CTA appel 15 min Calendly.

---

## 9. Lien avec la com B2C (utilisatrices)

Chaque partenaire signé doit déclencher **1 vague B2C** :

| Événement B2B | Contenu B2C |
|---------------|-------------|
| Nouveau code | Story « -15 % chez [Marque] avec tes CC » |
| Nouvelle recette co-brandée | Reel recette + lien app |
| Mission test | Reel « 200 CC si tu testes » |
| Guide e-book | Carrousel extrait + déblocage CC |

→ La marque voit du **volume** ; l’utilisatrice voit de la **valeur**.

---

## 10. KPIs partenariat (reporting mensuel)

| KPI | Source |
|-----|--------|
| Impressions fiche partenaire | Analytics in-app |
| Copies / utilisations code | `promo_codes` + UTM |
| Clics site marque | `partner_url` |
| Missions complétées | table missions (à créer) |
| Articles / recettes vues | Supabase content |
| Ventes attribuées | UTM + code unique |

---

## 11. Assets à produire (checklist com)

| Asset | Usage | Priorité |
|-------|-------|----------|
| Dossier PDF 6–8 pages | Email, salon, appels | P0 |
| Deck 10 slides | Visio | P0 |
| Page `/marques` | Site | P0 |
| Vidéo démo 3 min (app + leviers) | MOFU | P1 |
| One-pager par levier (A4) | Appel rapide | P1 |
| Contrat / CGV partenaire | Juridique | P1 |
| Kit lancement co-brandé (templates Canva) | BOFU | P2 |

---

## 12. Contenu inspiré de votre dossier — prêt à réutiliser

### Accroche LinkedIn (TOFU)
« Le marché des soins capillaires afro explose en France. Le CAC Meta aussi. Et si votre marque apparaissait **au moment du wash day** — pas entre deux Reels ? Coton Noir : coach capillaire gamifié, 100 % cheveux texturés. Partenariats ouverts → [lien] »

### Accroche email (MOFU)
« Bonjour [Prénom],  
Coton Noir récompense les femmes qui tiennent leur routine (CotonCoins). Vos codes promo vivent dans notre boutique in-app ; vos produits peuvent être recommandés selon la porosité et l’objectif.  
4 leviers : réductions, expertise, tests produits, visibilité native.  
15 min pour vous montrer l’app ? [Calendly]  
[Nom] — Coton Noir »

### Post signature partenaire (B2C + B2B)
« 🤝 [Marque] rejoint Coton Noir · -15 % avec tes CotonCoins → onglet Codes »

---

## 13. Prochaines étapes produit (pour tenir la promesse B2B)

| Promesse commerciale | Action produit / admin |
|---------------------|----------------------|
| Missions test +200 CC | Table `partner_missions` + écran validation avis |
| CotonStore unifié | Aligner `rewards` catalogue + `promo_codes` |
| Reco par profil | Brancher routines + analyse → `shop` |
| Reporting marque | Export admin hub ou email auto |

---

## Contact partenaire (à personnaliser)

**[Nom — Responsable partenariats]**  
**[partenariats@coton-noir.com]**  
**[Téléphone]**  
**[Lien PWA / stores]**  
**[Lien dossier PDF]**

---

*Document interne — Coton Noir · à synchroniser avec admin hub (partners, promo_codes, articles, recipes) et com B2C.*
