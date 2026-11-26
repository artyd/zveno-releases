// Helpers for the koi, lake, fireflies, sunset and hills pixel scenes.
import { bayer, noise, fbm } from './common.js';

/** An offscreen canvas with its 2D context. */
export function layer(W, H) {
  const c = document.createElement('canvas'); c.width = Math.max(1, W); c.height = Math.max(1, H);
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return { c, g, W, H };
}
export const px = (g, x, y, col) => { g.fillStyle = col; g.fillRect(x | 0, y | 0, 1, 1); };

/** Filled pixel disc by horizontal spans. */
export function disc(g, cx, cy, r, col) {
  g.fillStyle = col; const R = r + 0.35;
  for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) { const hw = Math.floor(Math.sqrt(Math.max(0, R * R - dy * dy))); if (R * R - dy * dy < 0) continue; g.fillRect(Math.round(cx) - hw, Math.round(cy) + dy, hw * 2 + 1, 1); }
}
/** Filled pixel ellipse by spans. */
export function ellipse(g, cx, cy, rx, ry, col) {
  g.fillStyle = col;
  for (let dy = -Math.ceil(ry); dy <= Math.ceil(ry); dy++) { const f = 1 - (dy * dy) / ((ry + 0.35) * (ry + 0.35)); if (f < 0) continue; const hw = Math.floor((rx + 0.35) * Math.sqrt(f)); g.fillRect(Math.round(cx) - hw, Math.round(cy) + dy, hw * 2 + 1, 1); }
}
/** Dithered transparent halo sprite: rings of `col` thinning out to radius r. */
export function halo(r, col, strength = 0.9) {
  const s = layer(r * 2 + 1, r * 2 + 1); s.g.fillStyle = col;
  for (let y = 0; y <= r * 2; y++) for (let x = 0; x <= r * 2; x++) { const d = Math.hypot(x - r, y - r) / r; if (d > 1) continue; const lvl = strength * (1 - d) ** 1.6; if (bayer(x, y) < lvl) s.g.fillRect(x, y, 1, 1); }
  return s.c;
}
/** Heights of a mountain ridge across W columns. */
export function ridge(W, { base, amp, freq = 0.03, seed = 0, sharp = 0.6, oct = 5 }) {
  const h = new Float32Array(W);
  for (let x = 0; x < W; x++) { const n = fbm(x * freq + seed, seed * 1.7, oct); const r = 1 - Math.abs(n * 2 - 1); h[x] = base - amp * (n * (1 - sharp) + r * r * sharp); }
  return h;
}
/** Dithered fill between two colours by level per pixel row band (vertical gradient over a rect). */
export function vgrad(g, x0, y0, w, h, cols) {
  const n = cols.length - 1;
  for (let y = 0; y < h; y++) { const u = (y / Math.max(1, h - 1)) * n; const i = Math.min(n - 1, Math.floor(u)); const f = u - i;
    if (f < 0.2 || f > 0.8) { g.fillStyle = f < 0.5 ? cols[i] : cols[i + 1]; g.fillRect(x0, y0 + y, w, 1); continue; }
    const lvl = (f - 0.2) / 0.6; for (let x = 0; x < w; x++) { g.fillStyle = bayer(x0 + x, y0 + y) < lvl ? cols[i + 1] : cols[i]; g.fillRect(x0 + x, y0 + y, 1, 1); } }
}
/** A pine silhouette: stacked jagged tiers. light: lit side colour (right side) or null. */
export function pine(g, x, base, h, dark, light, rnd, wf = 0.42) {
  const w = Math.max(3, Math.round(h * wf));
  g.fillStyle = dark; g.fillRect(Math.round(x), base - Math.round(h * 0.18), 1, Math.round(h * 0.18));
  const top = base - h, tiers = Math.max(2, Math.round(h / 6));
  for (let y = top; y < base - Math.round(h * 0.12); y++) {
    const u = (y - top) / (h * 0.88); const tierU = (u * tiers) % 1; const hw = Math.max(0, Math.round((w * (0.25 + 0.75 * u)) * (0.45 + 0.55 * tierU)));
    g.fillStyle = dark; g.fillRect(Math.round(x) - hw, y, hw * 2 + 1, 1);
    if (light && hw > 0 && (rnd ? rnd() : 0.5) > 0.25) { g.fillStyle = light; g.fillRect(Math.round(x) + hw, y, 1, 1); if (hw > 2 && tierU > 0.7) g.fillRect(Math.round(x) + hw - 1, y, 1, 1); }
  }
}
/** A round deciduous tree: trunk + lumpy crown with lit and shadow sides. */
export function roundTree(g, x, base, r, cols, rnd) {
  const [trunk, shade, mid, lit] = cols;
  g.fillStyle = trunk; g.fillRect(Math.round(x), base - Math.round(r * 0.9), 1, Math.round(r * 0.9) + 1);
  const cy = base - r * 1.5;
  const blobs = 4 + Math.round(r / 3);
  for (let i = 0; i < blobs; i++) { const a = (i / blobs) * Math.PI * 2 + (rnd ? rnd() : 0); const d = r * 0.45; ellipse(g, x + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7, r * 0.6, r * 0.55, shade); }
  ellipse(g, x - 0.5, cy - 0.5, r * 0.85, r * 0.75, mid);
  for (let i = 0; i < 3; i++) ellipse(g, x + r * 0.25 + i * 0.4, cy - r * 0.35 - i * 0.3, r * (0.45 - i * 0.1), r * (0.35 - i * 0.08), lit);
}
/** Eased cursor parallax value in -1..1. */
export function parallax(state, pointer, W, speed = 0.08) {
  const target = pointer.in ? (pointer.x / W - 0.5) * 2 : 0; state.v += (target - state.v) * speed; return state.v;
}
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
export { noise, fbm, bayer };
