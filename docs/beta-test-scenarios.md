# Coton Noir — Scénarios de test (premières testeuses)

**Objectif :** vérifier que l’app répond à un **vrai besoin** (cheveux afro / texturés) et apporte de la **valeur rapidement** — pas seulement que « ça marche techniquement ».

**Positionnement à valider :** *« Ton copilote capillaire — pour mieux prendre soin de tes cheveux. »*

---

## Avant de commencer

### Compte à utiliser

| Type | Usage |
|------|--------|
| **Compte réel** (inscription email) | **Obligatoire** pour tester la persistance, la sync, le parcours « vraie utilisatrice » |
| **Compte démo** (email `.env` dev) | Présentation / démo uniquement — **les modifications sont réinitialisées** à chaque connexion |

### Ce qui n’est pas encore testable en prod

- **Paiement Premium** (bouton « S’abonner » désactivé tant que toutes les features Premium ne sont pas livrées)
- **Essai 7 jours** : fonctionne pour débloquer l’accès, mais ce n’est pas un abonnement App Store
- **Multi-profils**, export PDF complet, box digitale « complète » : partiellement promis, pas tous livrés

### Matériel recommandé

- **Idéal :** iPhone ou Android avec l’app installée (TestFlight / APK interne)
- **Acceptable :** PWA sur `appcotonnoir.com` (pas de notifications push, pas d’achats natifs)
- **Connexion internet** stable pour l’analyse photo IA

### Après chaque session, note (30 sec)

1. **As-tu compris quoi faire ensuite ?** (oui / hésitation / perdu)
2. **As-tu eu une « petite victoire » ?** (ex. routine validée, mesure enregistrée, conseil utile)
3. **Frustration principale** (1 phrase)
4. **Recommanderais-tu l’app à une amie ?** (0–10)

---

## Les 5 questions produit (à garder en tête)

Pour chaque scénario, demande-toi :

1. **Besoin** — Est-ce que ça règle un problème que j’ai *vraiment* (routine floue, wash day oublié, pousse invisible, produits inadaptés) ?
2. **Rapidité** — En combien de minutes j’ai eu quelque chose d’**utile** (pas juste un écran joli) ?
3. **Clarté** — Est-ce que je comprends *pourquoi* l’app me propose ça ?
4. **Habitude** — Est-ce que j’ai envie de **revenir demain** ?
5. **Confiance** — Est-ce que je me sens comprise (cheveux 3C/4C, porosité, protecteur, etc.) ?

---

## Personas (choisis 1 principale + 1 secondaire)

| Persona | Profil | Ce qu’on veut valider |
|---------|--------|----------------------|
| **Aïssatou — Débutante** | 3C/4C, routine irrégulière, ne sait pas sa porosité | Onboarding + 1ère routine + 1ère mesure |
| **Fatou — Régulière** | Wash day toutes les 2 semaines, quelques produits | Wash day + rappels + historique soins |
| **Roxane — Objectif longueur** | Cible cm + date, mesure mensuelle | Anneau accueil + écran Pousse + paliers |
| **Amina — Protective** | Tresses / locks, routine soir | Mode protecteur + routine soir |
| **Kadi — Curieuse IA** | Beaucoup de questions sur ses cheveux | Analyse photo + application des conseils |
| **Mariam — Communauté** | Aime partager progrès | Post + défi Hydra + likes |

---

# Phase 1 — Première session (15–25 min)  
*Valeur attendue : « L’app me connaît déjà et me dit quoi faire aujourd’hui. »*

## S1 — Parcours nouvelle inscrite (parcours complet)

**Persona :** Aïssatou (débutante)

| Étape | Action | Succès utilisateur | À noter / bug |
|-------|--------|-------------------|---------------|
| 1 | Ouvrir l’app → **Commencer mon diagnostic** | Envie de continuer | Temps de chargement |
| 2 | Onboarding : type cheveux, porosité, densité, objectif, style de soin (commerce/DIY/mix) | Se sent comprise, pas jugée | Étapes trop longues ? |
| 3 | **Recommandations** (avant compte) : voir routine matin ; soir/wash floutés | Comprend qu’il y a plus après inscription | Teaser +50 CC clair ? |
| 4 | Créer compte (email réel) | Compte créé, arrive sur l’accueil | Email de confirmation ? |
| 5 | Accueil : lire tagline, anneau longueur, CTA routine | Comprend « copilote » en 10 s | Anneau vide = message clair ? |
| 6 | Valider **routine du matin** (cocher étapes → valider) | +CC, feedback positif, streak | Haptic / animation |
| 7 | Tap **+** → ajouter une entrée ou planifier wash day | Action évidente | Menu + compréhensible ? |

**Questions à la testeuse :**
- « En une phrase, à quoi sert Coton Noir pour toi ? »
- « Qu’est-ce qui t’a semblé le plus utile dans ces 20 minutes ? »
- « Qu’est-ce qui t’a fait hésiter ou abandonner ? »

---

## S2 — Abandon puis retour (J0 → J1)

**Persona :** toute

| Étape | Action | Succès | À noter |
|-------|--------|--------|---------|
| 1 | Fermer l’app au milieu de l’onboarding (étape 4) | — | — |
| 2 | Rouvrir → reprise au bon endroit | Pas de perte de données saisies | Mot de passe non repris (normal) |
| 3 | Terminer onboarding + créer compte | Données profil présentes sur accueil | |
| 4 | Se déconnecter puis reconnecter (**compte réel**) | Profil capillaire identique | **Ne pas tester avec compte démo** |

---

## S3 — « Je me connecte, j’ai déjà un compte »

| Étape | Action | Succès | À noter |
|-------|--------|--------|---------|
| 1 | Login email/mot de passe | Accueil personnalisé (prénom) | |
| 2 | Profil incomplet (si test interne) | Redirection onboarding | |
| 3 | Mot de passe oublié | Email reçu (si configuré) | |

---

# Phase 2 — Valeur quotidienne (J1 à J7)  
*Valeur attendue : « L’app m’aide chaque jour sans que je réfléchisse trop. »*

## S4 — Routine matin + soir (3 jours)

| Jour | Action | Succès | Valeur |
|------|--------|--------|--------|
| J1 | Valider routine **matin** | CC + streak = 1 | Habitude lancée |
| J2 | Valider routine **soir** | Streak = 2 | Deux ancres dans la journée |
| J3 | Oublier volontairement | Bannière **comeback** ? | Réengagement doux |

**Questions :**
- Les étapes de routine sont-elles **réalistes** pour tes cheveux ?
- Le gain de CC motive-t-il ou semble-t-il gadget ?

---

## S5 — Premier wash day planifié et réalisé

| Étape | Action | Succès | À noter |
|-------|--------|--------|---------|
| 1 | Accueil → historique soins → **Planifier un washday** | Date choisie | |
| 2 | Le jour J : ouvrir **Wash day**, suivre étapes / timer | Wash day « fait » | |
| 3 | Vérifier calendrier accueil (pastille planifié / effectué) | Visuel cohérent | |
| 4 | Noter produits utilisés (optionnel) | Journal enrichi | |

**Valeur à valider :** moins d’oubli de wash day, sentiment d’accomplissement.

---

## S6 — Première mesure de longueur (anneau accueil)

| Étape | Action | Succès | À noter |
|-------|--------|--------|---------|
| 1 | Tap anneau vide → **Mesures** / `hair-length` | Guide compréhensible | Popin première mesure ? |
| 2 | Saisir cm zone **Devant** (minimum) | Anneau accueil affiche cm | |
| 3 | Revenir lendemain : « pousse ce mois » | Chiffre ou message clair | |

**Valeur à valider :** la pousse devient **visible**, pas abstraite.

---

## S7 — Première analyse IA (Black Cotton)

| Étape | Action | Succès | À noter |
|-------|--------|--------|---------|
| 1 | Découvrir → **Analyse IA** | Comprend qu’il faut 2+ photos | |
| 2 | Photos racines + longueurs (+ pointes si possible) | Upload OK | Lumière / qualité |
| 3 | Lire résultats : problèmes, conseils, routine suggérée | « C’est pertinent pour MOI » | Temps d’attente API |
| 4 | **Appliquer** routine proposée (si bouton) | Étapes dans Routine | |
| 5 | 3e analyse dans le mois (compte gratuit) | Paywall **analysis_limit** | Message clair ? Essai 7j proposé ? |

**Valeur à valider :** l’IA apporte un conseil qu’elle n’aurait pas eu sur TikTok/YouTube.

---

## S8 — Essai Premium 7 jours (sans payer)

| Étape | Action | Succès | À noter |
|-------|--------|--------|---------|
| 1 | Déclencher paywall (analyse 3, ou moment routine) | Comprend la valeur Premium | |
| 2 | Démarrer **essai 7 jours** | Accès débloqué | |
| 3 | Vérifier CC ×2 sur une action | Solde augmente plus | |
| 4 | Tenter **S’abonner** | Message « bientôt disponible » (attendu) | Pas de frustration ? |

---

# Phase 3 — Valeur à moyen terme (J8 à J30)  
*Valeur attendue : « Je vois ma progression et l’app grandit avec moi. »*

## S9 — Suivi pousse (4 semaines simulées ou réelles)

| Étape | Action | Succès | À noter |
|-------|--------|--------|---------|
| 1 | 2e mesure (même zone, +2–4 semaines) | Graphique / delta mois | |
| 2 | Écran **Pousse** : paliers cm, score santé | Motivation | Gate >3 mois → Premium ? |
| 3 | **Calculateur** de pousse | Projection compréhensible | |

---

## S10 — Profil capillaire enrichi

| Étape | Action | Succès | À noter |
|-------|--------|--------|---------|
| 1 | Profil → **Profil capillaire** | | |
| 2 | Ajouter problématiques, budget, région | Score complétion monte | |
| 3 | Sauvegarder → déconnexion → reconnexion | Données identiques (compte réel) | |
| 4 | Recos accueil / Black Cotton mises à jour ? | Personnalisation visible | |

---

## S11 — Récompenses & niveau

| Étape | Action | Succès | À noter |
|-------|--------|--------|---------|
| 1 | **Récompenses** : lire légende CC vs points niveau | Pas de confusion | |
| 2 | Atteindre palier niveau (si possible) | Célébration level-up | |
| 3 | **Succès** / achievements | Badges débloqués | |
| 4 | **Inviter** une amie (code parrainage) | Code affiché / partage | |

---

## S12 — Communauté & Hydra

| Étape | Action | Succès | À noter |
|-------|--------|--------|---------|
| 1 | Publier un post (progrès ou avant/après) | Visible dans le fil | Erreur RLS ? |
| 2 | Liker un post | Compteur likes | |
| 3 | **Défi Hydra** : rejoindre, 1 post/jour | **pts défi** (pas CC) — légende claire ? | |
| 4 | Lire classement / jours restants | Engagement | |

**Valeur à valider :** sentiment d’appartenance, pas « encore un réseau social vide ».

---

## S13 — Contenu & économies

| Scénario | Route | Valeur à valider |
|----------|-------|------------------|
| Recette DIY matchée | `/recipes` depuis analyse ou Découvrir | « Je peux faire chez moi » |
| Favoris recette | `/favorites` | Retrouver plus tard (local) |
| Codes promo | `/codes` | Envie de revenir (même si Premium) |
| Articles / tutos | `/articles`, `/tutorials` | Complément utile, pas doublon YouTube |
| Journal | `/journal` | Lien avec routines validées |

---

# Phase 4 — Scénarios négatifs & confiance

## S14 — Erreurs réseau

| Cas | Action | Succès attendu |
|-----|--------|----------------|
| Mode avion pendant analyse | Message d’erreur clair, pas crash | |
| Mode avion pendant sauvegarde profil | Alerte sync (si implémentée) | |
| Connexion lente | Loader, pas écran blanc | |

## S15 — Permissions refusées

| Cas | Action | Succès attendu |
|-----|--------|----------------|
| Refuser caméra (analyse) | Alternative galerie ou explication | |
| Refuser notifications | App utilisable sans harcèlement | |

## S16 — Compte & données

| Cas | Action | Succès attendu |
|-----|--------|----------------|
| CGU / Confidentialité sans login | Pages `/legal`, `/privacy`, `/cgv` lisibles | |
| Déconnexion | Retour écran bienvenue, pas de fuite de données autre compte | |
| Deux comptes sur même téléphone | Préfs avatar pas mélangées (compte réel) | |

## S17 — Web (PWA) vs app native

| Test | Web | Native |
|------|-----|--------|
| Onboarding complet | ☐ | ☐ |
| Analyse photo | ☐ | ☐ |
| Validation routine | ☐ | ☐ |
| Notification rappel | N/A | ☐ |
| Session après refresh navigateur | ☐ (selon config staging) | ☐ |

---

# Phase 5 — Moments « valeur rapide » (checklist 5 minutes)

À faire **dès la première ouverture** — si un point échoue, priorité produit haute :

| # | En 5 min, l’utilisatrice peut… | ☐ OK | ☐ KO | Commentaire |
|---|-------------------------------|------|------|-------------|
| 1 | Comprendre à quoi sert l’app (accueil / welcome) | | | |
| 2 | Voir une routine **personnalisée** (même partielle) | | | |
| 3 | Valider **une** action et recevoir un retour (CC, streak, message) | | | |
| 4 | Savoir **quand** faire son prochain wash day | | | |
| 5 | Avoir **un** conseil capillaire actionnable (reco ou analyse) | | | |

---

# Grille de feedback final (à envoyer aux testeuses)

Copier-coller dans un Google Form ou WhatsApp :

```
1. Type de cheveux / routine actuelle (libre)
2. Note globale 0–10 : « Coton Noir m’aide vraiment à prendre soin de mes cheveux »
3. Première chose utile (1 phrase)
4. Première frustration (1 phrase)
5. Fonction préférée : Routine / Wash day / Pousse / Analyse IA / CC / Communauté / Autre
6. Fonction la plus confuse ou inutile
7. Est-ce que tu reviendrais dans 7 jours ? Oui / Non / Peut-être — pourquoi ?
8. Paierais-tu pour Premium quand disponible ? Oui / Non / Peut-être — à quel prix ?
9. Recommandation à une amie (0–10)
10. Bug bloquant rencontré (capture écran si possible)
```

---

# Priorisation des retours (pour l’équipe)

| Priorité | Type | Exemple |
|----------|------|---------|
| **P0** | Bloquant | Crash, impossible de créer compte, analyse ne renvoie rien |
| **P1** | Valeur | « Je ne sais pas quoi faire sur l’accueil », routine non pertinente |
| **P2** | Confusion | CC vs pts défi, Premium vs essai |
| **P3** | Polish | Texte coupé, animation, couleur |

---

# Synthèse : ce qu’on valide en beta

| Hypothèse produit | Scénarios clés |
|-------------------|----------------|
| L’onboarding crée confiance + routine utilisable | S1, S2 |
| L’accueil donne **la prochaine action** du jour | S1, S4, checklist 5 min |
| Wash day + calendrier réduisent l’oubli | S5 |
| La pousse visible motive sur 30 j | S6, S9 |
| L’IA apporte plus que les réseaux sociaux | S7 |
| CC + niveaux gamifient sans frustrer | S4, S11 |
| La communauté a une raison d’exister | S12 |
| Premium a un sens avant paiement | S8 |

---

*Dernière mise à jour : beta v1.0.0 — paiements Premium désactivés, compte démo non persistant.*
