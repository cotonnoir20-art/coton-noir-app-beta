# Animations Lottie

## Splash (`splash-logo-reveal.json`)

Animation de démarrage : traits blancs qui se dessinent, puis apparition du logo.

### Regénérer depuis le PNG source

```bash
npm run build:splash-lottie
```

Source : `assets/brand/splash-logo.png` (logo blanc sur fond noir).

### Remplacer par un export After Effects / LottieFiles

1. Exporte ton animation en **Lottie JSON** (Bodymovin ou plugin LottieFiles).
2. Remplace le fichier :

   `assets/animations/splash-logo-reveal.json`

3. Garde le même nom de fichier — aucun changement de code.
4. Recharge l’app.

**Conseil export AE :** composition carrée ~512×512 px, fond noir, animation « Trim Paths » sur les contours du logo, puis calque image si besoin.

### Ancien fichier

`splash-glow.json` — halo décoratif (remplacé par `splash-logo-reveal.json`).
