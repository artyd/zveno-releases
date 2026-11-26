// Helpers shared by the aurora, sakura, reef, galaxy and zen pixel scenes.
import { bayer } from './common.js';

/** An offscreen canvas layer (transparent) with pixel helpers. */
export function layer(W, H) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const dot = (x, y, col) => { g.fillStyle = col; g.fillRect(x | 0, y | 0, 1, 1); };
  const rect = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x | 0, y | 0, w | 0, h | 0); };
  return { c, g, dot, rect, W, H };
}

/** Pixel disc/ellipse filled through a colour function f(dx, dy, nx, ny, x, y) -> colour | null (nx, ny in -1..1). */
export function blob(L, cx, cy, rx, ry, f) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry; if (nx * nx + ny * ny > 1) continue;
    const col = f(x - cx, y - cy, nx, ny, x, y); if (col) L.dot(x, y, col);
  }
}

/** Picks one of two colours by an ordered-dither threshold. */
export const mix = (x, y, a, b, level) => (bayer(x, y) < level ? b : a);

/** Index into a colour ramp with ordered dither between steps (v in 0..1). */
export function ramp(x, y, cols, v) {
  const u = Math.max(0, Math.min(0.9999, v)) * (cols.length - 1); const i = Math.floor(u);
  return bayer(x, y) < u - i ? cols[Math.min(cols.length - 1, i + 1)] : cols[i];
}

export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;

/** '#rrggbb' -> [r, g, b]. */
export const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
