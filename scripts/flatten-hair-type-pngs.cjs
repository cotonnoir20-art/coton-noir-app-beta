/**
 * Aplatit tous les PNG de assets/images/hair-types/ sur un fond opaque (cream),
 * pour supprimer transparence / damier. Réécrit chaque fichier sur place.
 * Usage : npm run flatten-hair-types
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Colors.cream — même fond que la zone image dans l’onboarding
const BG = { r: 250, g: 243, b: 236 };

async function flattenFile(filePath) {
  const input = fs.readFileSync(filePath);
  const buf = await sharp(input)
    .ensureAlpha()
    .flatten({ background: BG })
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(filePath, buf);
  return buf.length;
}

async function main() {
  const root = path.join(__dirname, '..');
  const dir = path.join(root, 'assets', 'images', 'hair-types');
  if (!fs.existsSync(dir)) {
    console.error('Missing dir:', dir);
    process.exit(1);
  }
  const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.png'));
  if (!files.length) {
    console.error('No PNG in', dir);
    process.exit(1);
  }
  for (const f of files.sort()) {
    const p = path.join(dir, f);
    const n = await flattenFile(p);
    console.log('OK', f, n, 'bytes');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
