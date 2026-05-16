/**
 * Anneau décoratif type « conique » : segments d’arc + couleur interpolée (pas de Skia).
 */

export type SweepSegment = { d: string; stroke: string };

const STOPS: { t: number; c: string }[] = [
  { t: 0, c: '#FDF3EC' },
  { t: 0.18, c: '#F5D0D8' },
  { t: 0.4, c: '#D4A088' },
  { t: 0.62, c: '#D4822A' },
  { t: 0.82, c: '#F2A04A' },
  { t: 1, c: '#FDF3EC' },
];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (x: number) => Math.round(Math.min(255, Math.max(0, x))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function lerpHex(a: string, b: string, u: number): string {
  const [r0, g0, b0] = hexToRgb(a);
  const [r1, g1, b1] = hexToRgb(b);
  const t = Math.min(1, Math.max(0, u));
  return rgbToHex(r0 + (r1 - r0) * t, g0 + (g1 - g0) * t, b0 + (b1 - b0) * t);
}

function colorAtT(t: number): string {
  const x = ((t % 1) + 1) % 1;
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (x <= STOPS[i + 1].t) {
      const span = STOPS[i + 1].t - STOPS[i].t || 1;
      const u = (x - STOPS[i].t) / span;
      return lerpHex(STOPS[i].c, STOPS[i + 1].c, u);
    }
  }
  return STOPS[STOPS.length - 1].c;
}

/** Segments d’arc sur le cercle (sens horaire depuis 12 h). */
export function buildConicSweepSegments(size: number, stroke: number, nSeg: number): SweepSegment[] {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - stroke) / 2;
  const out: SweepSegment[] = [];
  for (let i = 0; i < nSeg; i++) {
    const t0 = i / nSeg;
    const t1 = (i + 1) / nSeg;
    const th0 = -Math.PI / 2 + t0 * 2 * Math.PI;
    const th1 = -Math.PI / 2 + t1 * 2 * Math.PI;
    const x0 = cx + r * Math.cos(th0);
    const y0 = cy + r * Math.sin(th0);
    const x1 = cx + r * Math.cos(th1);
    const y1 = cy + r * Math.sin(th1);
    const d = `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
    out.push({ d, stroke: colorAtT((t0 + t1) / 2) });
  }
  return out;
}
