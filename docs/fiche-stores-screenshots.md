# Fiche stores & brief screenshots — Coton Noir

Document de référence pour **Claude Design** (visuels App Store / Google Play) et pour **App Store Connect** / **Google Play Console**.

> **Maj.** mai 2026 · App v1.0.0 · Domaine : `appcotonnoir.com`

---

## Sommaire

1. [Brief Claude Design — identité & formats](#1-brief-claude-design--identité--formats)
2. [Les 8 screenshots (ordre stores)](#2-les-8-screenshots-ordre-stores)
   - [Spécifications UI pixel-perfect (8 écrans)](#21-spécifications-ui-pixel-perfect--8-écrans)
3. [Feature Graphic Google Play](#3-feature-graphic-google-play)
4. [Préparation des captures (compte démo)](#4-préparation-des-captures-compte-démo)
5. [Textes App Store Connect (iOS)](#5-textes-app-store-connect-ios)
6. [Textes Google Play Console (Android)](#6-textes-google-play-console-android)
7. [Métadonnées communes](#7-métadonnées-communes)
8. [Notes légales & conformité](#8-notes-légales--conformité)

---

## 1. Brief Claude Design — identité & formats

### Identité visuelle

| Élément | Valeur |
|---------|--------|
| **Nom** | Coton Noir |
| **Tagline** | Ta copilote capillaire pour mieux prendre soin de tes cheveux |
| **Accroche welcome** | Ta copilote capillaire pour mieux prendre soin de tes cheveux. |
| **Sous-accroche welcome** | Diagnostic, routines, wash day et pousse — cheveux texturés de type 3 à 4 |
| **Public** | Femmes cheveux afro, crépus, bouclés, frisés (3C–4C) |
| **Ton** | Tutoiement, chaleureux, expert mais accessible |
| **Couleurs charte** | Noir `#1D1D1B` · Orange `#F49423` · Sage `#79B7A1` · Fond crème `#FDF8F4` · Bordeaux `#631617` |
| **Typo app** | Satoshi Medium (titres) · DM Sans (corps) |

### Formats de livraison

| Plateforme | Dimensions | Quantité | Obligatoire |
|------------|------------|----------|-------------|
| **iOS iPhone 6,7"** | **1290 × 2796 px** | 8 visuels | Oui |
| **Android Phone** | **1080 × 1920 px** (9:16) | 8 visuels (même ordre) | Oui |
| **Google Play Feature Graphic** | **1024 × 500 px** | 1 bannière | Oui |
| iOS iPhone 6,5" | 1284 × 2778 px | 8 visuels | Optionnel (redimensionner depuis 6,7") |
| Captures sans texte | 1290 × 2796 px | 8 visuels | Optionnel (App Preview vidéo) |

### Style des visuels

Chaque screenshot = **mockup téléphone** + **capture réelle de l’app** + **accroche marketing**.

```
┌─────────────────────────┐
│  ACCROCHE (1 ligne max) │  ← Satoshi Medium
│  Sous-titre (1 ligne)   │  ← DM Sans
│                         │
│   ┌───────────────┐     │
│   │  CAPTURE APP  │     │  ← coins arrondis, ombre légère
│   └───────────────┘     │
│                         │
│  fond crème / dégradé   │  charte orange ou sage selon slide
└─────────────────────────┘
```

**Règles :**
- Maximum 2 lignes de texte par visuel
- Ne pas étirer les captures
- Pas de fausses notes ou avis sur les visuels (sauf stats réelles vérifiées)
- Cohérence des 8 slides : même style de mockup et typographie

---

## 2. Les 8 screenshots (ordre stores)

| # | Écran | Route | Titre overlay | Sous-titre overlay |
|---|-------|-------|---------------|-------------------|
| 1 | Welcome | `app/(auth)/welcome.tsx` | Ta copilote capillaire | Pour mieux prendre soin de tes cheveux — diagnostic, routines & pousse |
| 2 | Accueil | `app/(tabs)/index.tsx` | Ton copilote capillaire | Suis ta pousse et ton hydratation au quotidien |
| 3 | Routine wash day | `app/(tabs)/routine.tsx?routine=washday` | Routines matin, soir & wash day | Étapes à cocher, minuteurs, rappels |
| 4 | Analyse résultats | `app/(tabs)/analyze.tsx` (phase `results`) | Analyse tes cheveux en photo | Conseils personnalisés par Black Cotton |
| 5 | Progression | `app/growth.tsx` | Suis ta pousse zone par zone | Objectif en cm, paliers, projection |
| 6 | Récompenses | `app/rewards.tsx` | Gagne des CotonCoins | Routines validées = récompenses & codes partenaires |
| 7 | Recettes | `app/recipes.tsx` | Recettes naturelles maison | Frigo → cheveux, filtrées selon ton profil |
| 8 | Communauté | `app/community.tsx` | Rejoins la communauté | Partage ta progression · entraide |

**Alternative slide 8 :** écran Premium (`app/premium.tsx`).

---

### 2.1 Spécifications UI pixel-perfect — 8 écrans

> **Objectif :** que Claude Design / Claude Code reproduise l’UI **à l’identique** (textes exacts, couleurs, ordre des blocs, données de démo).
>
> **Méthode recommandée :** captures sur **build production** avec compte démo rempli, OU reconstruction Figma/HTML en copiant cette spec.

#### Éléments globaux (tous écrans connectés sauf Welcome)

**Barre d’onglets basse** (`AppTabBar`) — visible dès qu’une session est active :

| Position | Libellé | Icône Ionicons (inactif → actif) |
|----------|---------|----------------------------------|
| Gauche 1 | Accueil | `home-outline` → `home` |
| Gauche 2 | Découvrir | `grid-outline` → `grid` |
| Centre | *(action)* | Bouton **+** noir `#1D1D1B`, cercle 56px, surélevé |
| Droite 1 | Routine | `calendar-outline` → `calendar` |
| Droite 2 | Profil | `person-outline` → `person` |

- Fond barre : blanc `#FFFFFF`, bordure top `#E8DDD5`
- Onglet actif : pastille cercle noir + icône blanche + label 9px DM Sans Medium ink
- Onglet inactif : icône `#5C5652` (warmGray), label 10px

**Assistant flottant** : avatar Black Cotton (coin bas-droit, au-dessus de la tab bar) — ne pas masquer sur les captures accueil/routine.

**Données démo unifiées** (utiliser partout pour cohérence) :

| Champ | Valeur démo |
|-------|-------------|
| Prénom | Aïssatou |
| Type cheveux | 4C |
| Porosité | Élevée |
| Longueur actuelle | 38,5 cm |
| Objectif longueur | 45 cm |
| Échéance objectif | déc. 2026 |
| CotonCoins (solde) | 187 |
| Points cumulés (niveau) | 320 → **niveau 2 Curlie Cutie** 💜 |
| Streak | 5 jours |
| Score santé capillaire | 72/100 |

---

#### ÉCRAN 1 — Welcome (non connecté)

**Route :** `/(auth)/welcome` · **Fichier :** `app/(auth)/welcome.tsx`

**Pas de tab bar.** Fond plein écran `#FDF8F4` (Colors.bg). Padding horizontal 28px. Layout `space-between` vertical.

| Zone | Contenu exact | Style |
|------|---------------|-------|
| **Logo** (haut, centré) | Composant `AuthBrandLogo` width **200px**, variant **rounded** (carré arrondi ~13%, pas cercle) | Tuile noire `#000`, logo blanc splash à 88% |
| **Tagline** | Ligne 1 : **« La routine capillaire »** + saut de ligne + **« faite pour toi. »** | Satoshi Bold 30px, ink `#1D1D1B`, centré, line-height 38 |
| **Sous-titre** | **« Personnalisée, gamifiée et pensée »** + **« pour les cheveux afro & bouclés. »** | DM Sans Regular 14px, warmGray `#5C5652` |
| **Stats** (carte) | 3 colonnes dans carte blanche bordure `#E8DDD5`, radius 18px | |
| | Col 1 : **+2 000** / utilisatrices | Val 18px Bold ink · label 11px warmGray |
| | Col 2 : **4.9 ★** / note moyenne | idem |
| | Col 3 : **100%** / naturel | idem |
| **CTA primaire** | **« Commencer mon diagnostic → »** (flèche en orange `#F49423`) | Fond ink, radius 18, padding vertical 18, texte blanc DM Sans Bold 16px |
| **CTA secondaire** | **« J'ai déjà un compte »** | Bordure `#E8DDD5`, texte warmGray Medium 14px |

**Ne pas afficher :** clavier, bandeau beta web, login.

**Overlay marketing slide 1 :** titre = tagline · sous-titre = sous-titre welcome.

---

#### ÉCRAN 2 — Accueil

**Route :** `/(tabs)/` · **Fichier :** `app/(tabs)/index.tsx`

**Tab bar :** onglet **Accueil** actif.

**Hero** — fond dégradé (LinearGradient) :
`#FDF1EC` → `#FCE8E8` → `#FAF0EA` → `#FDF8F4` (haut vers bas).

| Zone (haut → bas) | Contenu exact | Style / notes |
|-------------------|---------------|---------------|
| **Top bar** | Badge CC : icône pièce + **187** · Pill streak **🔥 5 j** · Cloche notifications (sans badge ou badge « 2 ») | Badge CC : fond ink, chiffre amber Bold 15px |
| **Salutation** | Avatar 40px + **« Bonjour Aïssatou »** | « Bonjour » warmGray Medium · prénom ink greeting style |
| **Tagline** | **« Ton copilote capillaire — pour mieux prendre soin de tes cheveux. »** | 1 ligne mobile natif, centré sous le salut |
| **Anneau longueur** (`HomeLengthRing`) | Anneau 288px, stroke conique orange/sage | |
| | Kicker : **« LONGUEUR - 4C »** | label 12px SemiBold warmGray |
| | Centre : **« 38,5 cm »** | Chiffre 46px display ink · unité 20px |
| | Pilule santé : **« Santé 72/100 »** | fond sage clair, texte sage |
| | Objectif : **« Objectif 45 cm · déc. 2026 »** | 13px Medium warmGray |
| | Delta (optionnel) : **« ↑ +0,8 cm ce mois »** | pilule vert sage |
| **Frise semaine** (`HomeWeekStrip`) | 7 cercles **L M M J V S D** | Passés validés : fond ink + check amber · Aujourd’hui : fond amber · Futur : blanc bordure |
| **CTA routine** (`HomeRoutineCTA`) | Carte noire radius 18 | |
| | Icône check fond amber 44px | |
| | Titre : **« Valider ma routine »** | blanc Bold 17px |
| | Sous-titre : **« Routine matin · 2 / 4 étapes »** *(exemple)* | blanc 72% opacité 12px |
| | Pilule récompense : **« +10 »** + icône CC | fond amber |

**Scroll (bloc blanc sous le hero)** — pour capture **serrée slide 2**, couper au CTA routine ; optionnel en dessous :
- Carte intent (ex. lien analyse/croissance)
- Frise paliers longueur cm
- Carte « Mes routines » matin/soir

**Ne pas afficher :** popin placard, bannière comeback, guide J0, modal pantry.

**Overlay slide 2 :** *Ton copilote capillaire* · *Suis ta pousse et ton hydratation au quotidien*.

---

#### ÉCRAN 3 — Routine (Wash day)

**Route :** `/(tabs)/routine?routine=washday&period=today` · **Fichier :** `app/(tabs)/routine.tsx`

**Tab bar :** onglet **Routine** actif.

**Header fixe :**

| Élément | Texte |
|---------|-------|
| Retour | chevron ← (ink) |
| Titre centre | **Ma Routine** |
| Badge droite | icône CC + **187** |

**Onglets période** (sous header) : **Aujourd'hui** *(actif)* · Cette semaine · Ce mois

**Corps scroll — ordre exact :**

1. **Carte streak** (fond clair)
   - Icône flamme fond `#FFF7ED`
   - **« 5 jours de suite »**
   - Sous-texte : **« Streak de routine · Continue comme ça ! »**
   - Badge droite : **5** / **JOURS**

2. **Sélecteur type** — seulement **Matin** et **Soir** en tabs visibles ; wash day s’ouvre via deep link (pas de 3e tab visible). Pour wash day, le titre carte sombre affiche **Wash Day**.

3. **Carte « Définir ma routine »** ou **« Modifier ma routine »** — sous-texte : *Nom, produits, recettes, étapes et tes retours cheveux*

4. **Carte progression sombre** (`darkCard`, fond ink ~#1D1D1B)
   - Sous-titre : **« Aujourd'hui · Wash Day »**
   - Titre : **« Routine complète »** *(ou nom plan perso)*
   - Barre progression orange ~60–80% remplie
   - **« 3 / 5 étapes complétées »** · **« ~80 min »**

5. **Mini-cartes** (row)
   - Gauche : **Dernière routine** / **Aujourd'hui**
   - Droite (fond sombre) : **Prochain wash day** / **dans 6 jours →**

6. **Titre section** : **Étapes**

7. **Liste étapes wash day** (timeline + checkbox) — **cocher 3 sur 5** pour la capture :

| # | Titre | Durée | Description (extrait) | Produits (pills) |
|---|-------|-------|----------------------|------------------|
| 1 ✓ | Pré-poo | 30 min | Bain d'huile coco/avocat sur cheveux secs… | Huile de coco · Huile d'avocat |
| 2 ✓ | Co-wash | 15 min | Nettoyage doux sans sulfates… | Co-wash Aloe |
| 3 ✓ | Masque hydratant | 20 min | Démêlage doux à plat… | Masque Karité Profond |
| 4 ○ | Leave-in + huile | 10 min | Méthode LCO… | Leave-in Hydrate · Huile Ricin Noir |
| 5 ○ | Protection nocturne | 5 min | Bonnet satin + ananas style… | Bonnet satin |

- Checkbox cochée : fond amber + **✓** blanc
- Connecteur vertical entre étapes

8. **Bloc conseils Black Cotton** (bas) — titre **« Conseils Black Cotton »** · avatar BC coaching · ex. **« Méthode LCO »**

**Ne pas afficher :** bouton « Valider ma routine » plein écran (sauf si toutes étapes cochées), overlay Lottie célébration.

**Overlay slide 3 :** *Routines matin, soir & wash day* · *Étapes à cocher, minuteurs, rappels*.

---

#### ÉCRAN 4 — Analyse Black Cotton (résultats)

**Route :** `/(tabs)/analyze` · phase **`results`** · **Fichier :** `app/(tabs)/analyze.tsx`

**Tab bar :** aucun onglet actif obligatoire (analyze est hors tab bar href) — OK sans tab ou depuis Découvrir.

**Header :** **« Analyse Black Cotton »** · badge CC **187**

**Corps — ordre exact (phase résultats) :**

1. **Photo principale** + **anneau score** superposé
   - Score centre : **72** / **/100** *(exemple cohérent avec santé accueil)*

2. **Miniatures** (2 photos secondaires si disponibles)

3. **Cartes comparaison** (row)
   - Carte sage : **« +4 pts vs dernière analyse »** · Score précédent : 68/100
   - OU carte crème première analyse : **« Première analyse »**
   - Carte objectif : **« Objectif : 84/100 »** · **« ~6 semaines avec routine adaptée »**

4. **Carte type détecté**
   - Label : **TYPE DÉTECTÉ**
   - Titre : **4C** *(ou type profil)*
   - Pills : **Porosité élevée** · densité si dispo

5. **Carte progression objectif**
   - **« Progression vers l'objectif »** · ~6 semaines
   - Barre : Actuel **72** · Objectif **80** · Max **100**

6. **Carte « Détail du score »** — jauges horizontales :

| Label | Valeur | Couleur barre |
|-------|--------|---------------|
| 💧 Hydratation | 58% | bleu `#3B82F6` |
| 💪 Solidité | 72% | violet `#8B5CF6` |
| ✨ Brillance | 80% | ambre `#F59E0B` |

7. **Carte synthèse**
   - Titre : **Synthèse personnalisée**
   - Texte paragraphe (ex. fallback ou IA) sur sécheresse longueurs + routine LCO

8. **Segmented control** (4 onglets) :
   **Problèmes** *(actif)* · Conseils · Routine · Ingrédients

9. **Onglet Problèmes actif** — cartes avec badge sévérité :

| Emoji | Nom | Badge | Description |
|-------|-----|-------|-------------|
| 🧴 | Sécheresse marquée | Élevé (rouge) | Manque d'hydratation profonde… |
| ✂️ | Pointes fourchues | Modéré (orange) | Quelques pointes abîmées… |
| ✨ | Brillance correcte | Faible (sage) | Cuticule plutôt fermée… |

**Ne pas afficher :** phase empty (upload photos), loading, questionnaire.

**Overlay slide 4 :** *Analyse tes cheveux en photo* · *Conseils personnalisés par Black Cotton*.

---

#### ÉCRAN 5 — Progression (croissance)

**Route :** `/growth` · **Fichier :** `app/growth.tsx`

**Header :** retour · **Progression** · badge CC **187**

**Corps — ordre exact :**

1. **Grille stats 2×2**

| Carte | Valeur démo | Label |
|-------|-------------|-------|
| Fond sombre | **+2,3 cm** | Pousse totale |
| Clair | **4 mois** | Suivi en cours |
| Clair | **72/100** | Score santé |
| Clair | **5 🔥** | Streak actuel |

2. **Titre :** **Badges & succès** — grille 2×3 badges (emoji + label + hint) :
   - 🔥 Streak 7j · 🧴 Hydra Pro · 📏 +5 cm · 🍌 Bonnet 30j · ✂️ Trim Master · 👑 Crown
   - Débloquer visuellement 1–2 badges (Streak 7j verrouillé « Encore 2j »)

3. **Carte BILAN AUTOMATIQUE** — mois courant (ex. **Mai 2026**)
   - 3 colonnes : **8** Soins effectués · **+0,8 cm** Gagnés ce mois · **+6 pts défi** Score Black Cotton
   - Bloc Black Cotton : synthèse texte 2–3 lignes

4. **Bouton :** 📏 **Définir ma longueur** — *Mesure tes 4 zones pour un suivi précis*

5. **Historique des entrées** — **3 entrées** timeline :
   - Dates avec badge **DERNIÈRE** sur la plus récente
   - Pills : **38,5 cm (moy.)** · **4 zones**

6. **Évolution mensuelle** — graphique ligne **sage** « Pousse (cm/mois) » avec points Jan–Avr

7. **Carte Prochain palier**
   - **« Tu es à 6,5 cm de ton objectif 45 cm »**
   - Barre progression ~85%
   - **« À ton rythme actuel (+0,8 cm/mois), tu y seras dans ~8 mois 🌱 »**

8. **Carte OBJECTIF**
   - **Atteindre 45 cm** · Échéance date · **85% accompli**

**Ne pas afficher :** modal saisie mesure, empty state sans historique.

**Overlay slide 5 :** *Suis ta pousse zone par zone* · *Objectif en cm, paliers, projection*.

---

#### ÉCRAN 6 — Récompenses

**Route :** `/rewards` · **Fichier :** `app/rewards.tsx`

**Header AppHeader :** titre **Récompenses** · sous-titre exact :
**« Les points cumulés font monter ton niveau. Les CotonCoins (CC) servent à échanger des récompenses. »**

**Corps — ordre exact :**

1. **Bandeau Premium** (si non premium) :
   - **« CotonCoins × 2 avec Premium »**
   - **« Chaque routine, wash day et défi rapporte le double… »**
   - CTA **« Essai 7 jours → »**

2. **Carte niveau** (dégradé violet `#2D1B4E` → `#1A1209`, emoji 👑 décoratif)
   - Label : **NIVEAU ACTUEL**
   - **💜 Curlie Cutie**
   - 2 boîtes : **Points cumulés 320** · **CotonCoins 187** *(icône pièce)*
   - Barre progression orange→rose vers niveau 3
   - **« 320 / 300 → Afro Queenie »** *(ajuster selon barre)*
   - Bouton : **🎁 Échanger mes CotonCoins**

3. **Titre :** **Niveaux · selon tes points cumulés** — carrousel horizontal 10 cartes :
   Baby Hair 🌱 · **Curlie Cutie 💜 EN COURS** · Afro Queenie 👑 · … · Afrolicious Icon 🏆

4. **Catalogue récompenses** (au moins 4 lignes visibles) :

| Emoji | Nom | Coût | Bouton |
|-------|-----|------|--------|
| 🏷️ | Code -5% partenaire | 200 CC | Échanger |
| 🚚 | Livraison offerte | 300 CC | Échanger |
| 📦 | Produit découverte offert | 500 CC | Insuff. |
| 🏷️ | Code -15% partenaire | 750 CC | Insuff. |

5. **Comment gagner** — tableau (extrait) :
   - ✅ Routine daily / night · **+10 CC** · **+5 pts**
   - 💧 Wash day complet · **+30 CC** · **+10 pts**

**Overlay slide 6 :** *Gagne des CotonCoins* · *Routines validées = récompenses & codes partenaires*.

---

#### ÉCRAN 7 — Recettes

**Route :** `/recipes` · **Fichier :** `app/recipes.tsx`

**Header :** **Recettes**

**Corps — ordre exact :**

1. **Hero card** (fond sage/vert clair)
   - **🌿 Recettes naturelles**
   - Titre : **Du frigo aux cheveux**
   - Desc : **« 24 recettes 100 % naturelles validées par notre experte. Économiques, écolos, et efficaces. »**
   - Stats row : **24 recettes** · **3,50€ coût moyen** · **15 min en moyenne**

2. **Filtres chips** horizontal : **✨ Toutes** *(actif)* · 🥛 Masques · 🌿 Huiles · 💧 Sprays · 🍃 Cuir chevelu

3. **Carte signature** (featured)
   - Badge **⭐ Signature**
   - Fond `#C8E6C0`, emoji **🥛** grand
   - Badge likes **❤ 1,2k**
   - Titre : **Masque Karité-Avocat profond**
   - Desc : *La recette signature pour les cheveux 3C/4A asséchés…*
   - Pills : durée · difficulté Facile

4. **Titre section :** **Recettes populaires**

5. **Grille 2 colonnes** — cartes avec :
   - Fond thumb coloré + emoji
   - Badge catégorie (Masque, Huile…)
   - Nom recette · ⏱ durée · ⭐ note

**Capture alternative (modal ouvert) :** fiche **Masque Karité-Avocat profond**
- Hero emoji 🥛 gradient
- Pills : **⏱️ 15 min de prep + 30 min de pose** · Facile · **⭐ 4.9**
- Bloc **🧴 Ingrédients** (liste à puces)
- Bloc **Étapes** numérotées (5 étapes karité catalogue)
- Boutons cœur favori + like

**Overlay slide 7 :** *Recettes naturelles maison* · *Frigo → cheveux, filtrées selon ton profil*.

---

#### ÉCRAN 8 — Communauté

**Route :** `/community` · **Fichier :** `app/community.tsx`

**Header :** **Communauté**

**Corps — ordre exact :**

1. **Stats row** (carte 3 colonnes)
   - **12** Posts publiés · **8** Jours défi Hydra · **8/30** Objectif défi

2. **Bannière défi Hydra** (fond dégradé rose/eau)
   - Pill timer : **⏱ Jour 8 · 22 j restants**
   - Titre : **#HydraChallenge30**
   - **« 30 jours d'hydratation profonde — publie ta progression (avant/après bienvenus). »**
   - Meta : **🏆 Défi communauté** · **🔥 +30 pts défi/jour**
   - Boutons : **✓ Inscrite · Publier** · **Classement**

3. **Champ publication**
   - Avatar initiale **A**
## 3. Feature Graphic Google Play

**Format :** 1024 × 500 px · PNG ou JPEG

**Contenu suggéré :**
- Logo Coton Noir (blanc sur fond noir ou bordeaux)
- Tagline : *Ton copilote capillaire*
- Éléments visuels : silhouette profil + fleur orange (charte)
- Fond : dégradé bordeaux `#631617` → noir `#1D1D1B` ou crème + accent orange
- **Pas de texte trop petit** (illisible en miniature)

---

## 4. Préparation des captures (compte démo)

Pour des écrans remplis et crédibles :

| Donnée | Recommandation |
|--------|----------------|
| Profil | Onboarding terminé (type, porosité, objectif, longueur repères + cm) |
| Routines | Au moins 1 wash day et 1 routine matin validés |
| Mesures | 3+ mesures sur différentes zones |
| CotonCoins | Solde ≥ 100 (niveau 2 visible) |
| Recettes | 1–2 favoris |
| Communauté | 1 post ou défi Hydra en cours |

Utiliser le compte démo dev si configuré (`EXPO_PUBLIC_DEV_DEMO_EMAIL`).

---

## 5. Textes App Store Connect (iOS)

### Informations de base

| Champ | Texte |
|-------|-------|
| **Nom** | Coton Noir |
| **Sous-titre** (30 car. max) | Copilote capillaire afro |
| **Catégorie principale** | Santé et forme |
| **Catégorie secondaire** | Style de vie |
| **URL assistance** | `https://appcotonnoir.com` *(ou page /support)* |
| **URL marketing** | `https://appcotonnoir.com` |
| **Politique de confidentialité** | `https://appcotonnoir.com/privacy` *(à publier)* |

### Texte promotionnel (170 car. max — modifiable sans nouvelle version)

```
Diagnostic capillaire, wash day guidé, analyse Black Cotton et pousse en cm. Ta copilote afro, dans ta poche.
```

### Mots-clés (100 car. max, virgules sans espace)

```
cheveux,afro,routine,capillaire,bouclés,crépus,washday,hydratation,pousse,4C,3C,so dirigeant,coiffure,naturel,DIY
```

*(Retirer un mot si dépassement — ex. « dirigeant » → supprimer, c’était une erreur, use « soin »)*

**Version corrigée :**

```
cheveux,afro,routine,capillaire,bouclés,crépus,washday,hydratation,pousse,4C,3C,soin,coiffure,naturel,DIY
```

### Description (4000 car. max)

```
Coton Noir — ta copilote capillaire dans ton smartphone.

Fini les conseils génériques qui ne collent pas à ta texture. Ici, tu comprends tes cheveux, tu sais quoi faire aujourd'hui, et tu vois ta progression semaine après semaine — routines, wash day, mesures et communauté, dans une seule app pensée pour les cheveux afro, crépus, bouclés et frisés (3C à 4C).

◆ DIAGNOSTIC & ROUTINE SUR MESURE
• Diagnostic capillaire dès l'inscription (type, porosité, objectifs, problématiques)
• Analyse photo Black Cotton — racines, longueurs, pointes + conseils actionnables
• Routine matin, soir et wash day générées pour ton profil

◆ TON COPILOTE AU QUOTIDIEN
• Accueil intelligent : prochaine action du jour (routine, mesure, wash day…)
• Wash day planifié : calendrier, minuteurs, historique de tes soins
• Black Cotton te guide avec des conseils adaptés à ta porosité et tes objectifs

◆ SUIVI DE POUSSE CONCRET
• Mesures par zones (devant, côtés, derrière) en centimètres
• Objectif de longueur + repères corporels + graphiques
• Anneau longueur sur l'accueil pour visualiser ton évolution

◆ RECETTES, CONTENUS & EXPERTS
• Recettes DIY naturelles — frigo → cheveux, filtrées selon ton profil
• Articles et tutoriels capillaires
• Recommandations produits et partenaires

◆ MOTIVATION & COMMUNAUTÉ
• CotonCoins (CC) : gagne des points en validant routines, wash days et analyses
• 10 niveaux capillaires : de Baby Hair à Afrolicious Icon
• Communauté : partage ta progression, défi Hydra, entraide entre utilisatrices

◆ PREMIUM (OPTIONNEL)
• Analyse photo avancée · contenus expert · CotonCoins × 2
• Historique 12 mois · export bilan · box digitale
• Essai gratuit 7 jours · 9,99 €/mois ou 39,99 €/an

Coton Noir ne te promet pas un laboratoire dans ta poche — elle te promet une copilote qui t'aide à agir, pas seulement à scanner.

Télécharge Coton Noir. Black Cotton t'accompagne — de la première analyse à ta prochaine longueur.

---
Support : support@appcotonnoir.com · https://appcotonnoir.com
Les achats Premium sont facturés sur ton compte Apple. Renouvellement automatique sauf annulation 24 h avant la fin de la période.
```

### « Quoi de neuf » — v1.0.0

```
Première version de Coton Noir !
• Diagnostic capillaire personnalisé
• Routines matin, soir et wash day
• Suivi de pousse par zones en cm
• Analyse photo Black Cotton
• CotonCoins, niveaux et récompenses partenaires
• Recettes DIY et articles experts
• Communauté et défis
Bienvenue dans ton copilote capillaire !
```

---

## 6. Textes Google Play Console (Android)

### Informations de base

| Champ | Texte |
|-------|-------|
| **Titre** (30 car. max) | Coton Noir — Copilote Afro |
| **Description courte** (80 car. max) | Ta copilote capillaire : diagnostic, routines, pousse en cm & communauté. |
| **Catégorie** | Santé et remise en forme |
| **Tags** | Soin capillaire, Cheveux afro, Routine beauté, Wash day, Hydratation |
| **Email développeur** | *(email pro)* |
| **Site web** | `https://appcotonnoir.com` |
| **Politique de confidentialité** | `https://appcotonnoir.com/privacy` |

### Description complète (4000 car. max)

*(Reprendre la description iOS ci-dessus — identique.)*

### Notes de version — v1.0.0

```
🎉 Lancement de Coton Noir !

✓ Ta copilote capillaire dans ton smartphone
✓ Diagnostic + analyse photo Black Cotton
✓ Routines matin, soir & wash day guidés
✓ Suivi de pousse en cm par zones
✓ CotonCoins, niveaux & communauté
✓ Recettes DIY + articles experts

Fait avec amour pour les cheveux texturés. 💜🌱
```

---

## 7. Métadonnées communes

### Classification contenu

| Plateforme | Réponse suggérée |
|------------|------------------|
| **Violence** | Non |
| **Contenu sexuel** | Non |
| **Achats intégrés** | Oui (abonnement Premium) |
| **Publicité** | Non *(ou Non si pas de pubs tierces)* |
| **Âge minimum** | 4+ (iOS) / Tout public (Android) |
| **Données collectées** | Email, photos (analyse capillaire), données profil — voir politique de confidentialité |

### Identifiants app

| | iOS | Android |
|---|-----|---------|
| **Bundle / Package** | `com.cotonnoir.app` | `com.cotonnoir.app` |
| **Version** | 1.0.0 (build 1) | 1.0.0 (versionCode 1) |

### Premium — texte achats intégrés (stores)

```
Abonnement Premium optionnel.
• Mensuel : 9,99 €/mois
• Annuel : 39,99 €/an (économise ~67 %)
• Essai gratuit : 7 jours (puis facturation automatique)
Annulable à tout moment dans les paramètres de ton compte store.
```

---

## 8. Notes légales & conformité

### À vérifier avant publication

- [ ] Page **politique de confidentialité** publique sur `appcotonnoir.com/privacy`
- [ ] Page **CGU / support** ou email support visible
- [ ] Ne pas afficher de stats marketing non vérifiables sur welcome / stores (retirées de l’app v1)
- [ ] Captures d’écran = **build de production** (pas dev avec bandeau debug)
- [ ] Compte démo pour review Apple/Google si login obligatoire
- [ ] SKU IAP créés : Premium mensuel + annuel (App Store Connect + Play Console)

### Compte démo pour reviewers

Fournir dans App Store Connect / Play Console :

```
Email : [compte test dédié]
Mot de passe : [mot de passe]
Notes : Compte avec profil rempli, routines et mesures de démo.
```

---

*Document interne Coton Noir — partageable avec Claude Design et équipe marketing.*
