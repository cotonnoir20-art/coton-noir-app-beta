/**
 * Aplatit welcome-avatar.png sur le fond app (Colors.bg) pour supprimer
 * la transparence / l’effet damier autour du portrait.
 * Usage : npm run flatten-welcome-avatar
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const BG = { r: 253, g: 248, b: 244 }; // #FDF8F4 — Colors.bg

async function main() {
  const root = path.join(__dirname, '..');
  const src = path.join(root, 'assets', 'welcome-avatar.png');
  if (!fs.existsSync(src)) {
    console.error('Missing:', src);
    process.exit(1);
  }
  const input = fs.readFileSync(src);
  const buf = await sharp(input)
    .ensureAlpha()
    .flatten({ background: BG })
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(src, buf);
  console.log('welcome-avatar.png flattened on #FDF8F4', buf.length, 'bytes');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
