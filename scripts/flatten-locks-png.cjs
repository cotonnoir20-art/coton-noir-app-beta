/**
 * Locks.png : fond noir → cream, puis cadrage 1024×1024 identique aux autres types
 * (cover + alignement haut, comme 4C.png dans la carte onboarding).
 * Usage : npm run flatten-locks
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const BG = { r: 250, g: 243, b: 236 };
const SIZE = 1024;
const LOCKS = path.join(__dirname, '..', 'assets', 'images', 'hair-types', 'Locks.png');

function isPureBlack(r, g, b) {
  return r <= 8 && g <= 8 && b <= 8;
}

function keyOutEdgeBlack(data, width, height, channels) {
  const n = width * height;
  const visited = new Uint8Array(n);
  const stack = [];

  const tryPush = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    const i = idx * channels;
    if (!isPureBlack(data[i], data[i + 1], data[i + 2])) return;
    visited[idx] = 1;
    stack.push(idx);
  };

  for (let x = 0; x < width; x++) {
    tryPush(x, 0);
    tryPush(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    tryPush(0, y);
    tryPush(width - 1, y);
  }

  while (stack.length) {
    const idx = stack.pop();
    const i = idx * channels;
    data[i + 3] = 0;
    const x = idx % width;
    const y = (idx - x) / width;
    tryPush(x - 1, y);
    tryPush(x + 1, y);
    tryPush(x, y - 1);
    tryPush(x, y + 1);
  }
}

async function main() {
  if (!fs.existsSync(LOCKS)) {
    console.error('Missing', LOCKS);
    process.exit(1);
  }
  const input = fs.readFileSync(LOCKS);
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  keyOutEdgeBlack(data, info.width, info.height, info.channels);

  const buf = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .flatten({ background: BG })
    .resize(SIZE, SIZE, {
      fit: 'cover',
      background: BG,
      position: 'north',
    })
    .png({ compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(LOCKS, buf);
  const meta = await sharp(buf).metadata();
  console.log('OK Locks.png', buf.length, 'bytes', meta.width, 'x', meta.height);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
