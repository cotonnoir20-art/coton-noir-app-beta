/**
 * Génère assets/animations/splash-logo-reveal.json
 * — image PNG (splash) + traits vectoriels « dessinés » + fondu du logo.
 *
 * Pour remplacer par un export After Effects : dépose ton .json ici
 * (même chemin) puis relance `npm run build:splash-lottie` ou remplace directement.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const srcPng = path.join(root, 'assets/brand/splash-logo.png');
const outJson = path.join(root, 'assets/animations/splash-logo-reveal.json');
const outThumb = path.join(root, 'assets/animations/splash-logo-lottie.png');

const W = 512;
const FR = 60;
const DURATION = 120;

async function main() {
  if (!fs.existsSync(srcPng)) {
    console.error('Missing:', srcPng);
    process.exit(1);
  }

  const meta = await sharp(srcPng).metadata();
  const h = Math.round((W * (meta.height ?? W)) / (meta.width ?? W));
  const pngBuf = await sharp(srcPng).resize(W, h, { fit: 'inside' }).png().toBuffer();
  fs.writeFileSync(outThumb, pngBuf);

  const b64 = pngBuf.toString('base64');
  const cx = W / 2;
  const cy = h / 2 + 20;

  const strokeLayers = buildStrokeLayers(cx, cy, h);

  const lottie = {
    v: '5.7.4',
    fr: FR,
    ip: 0,
    op: DURATION,
    w: W,
    h: h,
    nm: 'Coton Noir splash reveal',
    ddd: 0,
    assets: [
      {
        id: 'image_0',
        w: W,
        h,
        u: '',
        p: `data:image/png;base64,${b64}`,
        e: 1,
      },
    ],
    layers: [
      ...strokeLayers,
      {
        ddd: 0,
        ind: strokeLayers.length + 1,
        ty: 2,
        nm: 'Logo',
        refId: 'image_0',
        sr: 1,
        ks: {
          o: {
            a: 1,
            k: [
              { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 38, s: [0] },
              { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 58, s: [100] },
              { t: DURATION, s: [100] },
            ],
            ix: 11,
          },
          r: { a: 0, k: 0, ix: 10 },
          p: { a: 0, k: [cx, cy, 0], ix: 2 },
          a: { a: 0, k: [W / 2, h / 2, 0], ix: 1 },
          s: {
            a: 1,
            k: [
              {
                i: { x: [0.667, 0.667, 0.667], y: [1, 1, 1] },
                o: { x: [0.333, 0.333, 0.333], y: [0, 0, 0] },
                t: 38,
                s: [88, 88, 100],
              },
              {
                i: { x: [0.667, 0.667, 0.667], y: [1, 1, 1] },
                o: { x: [0.333, 0.333, 0.333], y: [0, 0, 0] },
                t: 58,
                s: [100, 100, 100],
              },
              { t: DURATION, s: [100, 100, 100] },
            ],
            ix: 6,
          },
        },
        ao: 0,
        ip: 0,
        op: DURATION,
        st: 0,
        bm: 0,
      },
    ],
    markers: [],
  };

  fs.writeFileSync(outJson, JSON.stringify(lottie));
  const kb = Math.round(fs.statSync(outJson).size / 1024);
  console.log(`Wrote ${outJson} (${kb} KB, ${W}x${h})`);
}

function buildStrokeLayers(cx, cy, compH) {
  /** Courbes stylisées (effet « traits qui se dessinent » autour du logo). */
  const paths = [
    {
      nm: 'Stroke profile',
      start: 0,
      duration: 42,
      v: [
        [-90, -compH * 0.22],
        [-40, -compH * 0.08],
        [20, -compH * 0.12],
        [55, compH * 0.02],
      ],
    },
    {
      nm: 'Stroke hair',
      start: 12,
      duration: 48,
      v: [
        [-110, -compH * 0.05],
        [-70, compH * 0.08],
        [-20, compH * 0.14],
        [30, compH * 0.1],
        [80, compH * 0.02],
      ],
    },
    {
      nm: 'Stroke flourish',
      start: 28,
      duration: 40,
      v: [
        [10, compH * 0.06],
        [35, compH * 0.14],
        [60, compH * 0.08],
        [75, -compH * 0.02],
      ],
    },
  ];

  return paths.map((p, idx) => makeStrokeLayer(p, cx, cy, idx + 1));
}

function makeStrokeLayer({ nm, start, duration, v }, cx, cy, ind) {
  const verts = v.map(([x, y]) => [x + cx, y + cy]);
  const i = verts.slice(1).map((pt, j) => {
    const prev = verts[j];
    return [(pt[0] - prev[0]) * 0.45, (pt[1] - prev[1]) * 0.45];
  });
  const o = verts.slice(0, -1).map((pt, j) => {
    const next = verts[j + 1];
    return [(next[0] - pt[0]) * 0.45, (next[1] - pt[1]) * 0.45];
  });

  const end = start + duration;

  return {
    ddd: 0,
    ind,
    ty: 4,
    nm,
    sr: 1,
    ks: {
      o: { a: 0, k: 100, ix: 11 },
      r: { a: 0, k: 0, ix: 10 },
      p: { a: 0, k: [0, 0, 0], ix: 2 },
      a: { a: 0, k: [0, 0, 0], ix: 1 },
      s: { a: 0, k: [100, 100, 100], ix: 6 },
    },
    ao: 0,
    shapes: [
      {
        ty: 'gr',
        it: [
          {
            ind: 0,
            ty: 'sh',
            ix: 1,
            ks: {
              a: 0,
              k: {
                i,
                o,
                v: verts,
                c: false,
              },
              ix: 2,
            },
            nm: 'Path 1',
            mn: 'ADBE Vector Shape - Group',
            hd: false,
          },
          {
            ty: 'st',
            c: { a: 0, k: [1, 1, 1, 1], ix: 3 },
            o: { a: 0, k: 100, ix: 4 },
            w: { a: 0, k: 2.2, ix: 5 },
            lc: 2,
            lj: 2,
            bm: 0,
            nm: 'Stroke 1',
            mn: 'ADBE Vector Graphic - Stroke',
            hd: false,
          },
          {
            ty: 'tm',
            s: {
              a: 1,
              k: [
                { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: start, s: [0] },
                { t: end, s: [100] },
              ],
              ix: 1,
            },
            e: {
              a: 1,
              k: [
                { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: start, s: [0] },
                { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: start + 8, s: [18] },
                { t: end, s: [100] },
              ],
              ix: 2,
            },
            o: { a: 0, k: 0, ix: 3 },
            m: 1,
            ix: 2,
            nm: 'Trim Paths 1',
            mn: 'ADBE Vector Filter - Trim',
            hd: false,
          },
          {
            ty: 'tr',
            p: { a: 0, k: [0, 0], ix: 2 },
            a: { a: 0, k: [0, 0], ix: 1 },
            s: { a: 0, k: [100, 100], ix: 3 },
            r: { a: 0, k: 0, ix: 6 },
            o: { a: 0, k: 100, ix: 7 },
            sk: { a: 0, k: 0, ix: 4 },
            sa: { a: 0, k: 0, ix: 5 },
            nm: 'Transform',
          },
        ],
        nm: 'Shape 1',
        np: 3,
        cix: 2,
        bm: 0,
        ix: 1,
        mn: 'ADBE Vector Group',
        hd: false,
      },
    ],
    ip: start,
    op: end + 10,
    st: start,
    bm: 0,
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
