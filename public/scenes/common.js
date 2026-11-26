// Shared harness for the 8-bit pixel window backgrounds (plain 2D canvas, no WebGL).
// The scene draws into a tiny canvas (about 144 px tall); CSS stretches it with `image-rendering: pixelated`,
// so the GPU does the upscale and the CPU only touches ~30k pixels a frame, at most 30 frames a second.
// A scene module exports `default function create(ctx)` and returns `{ draw(g, t, dt), resize?(W, H), onPointer?(p), onLeave?() }`.
// ctx: { W, H, pointer: { x, y, in, speed, down }, rng, noise, fbm, PAL, bayer, dither(g, x, y, w, h, colA, colB, level), hex }

export const ROWS = 144;
const FPS = 30;

export function rng(seed = 1) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const P = new Uint8Array(512); { const r = rng(7); const p = [...Array(256).keys()]; for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) P[i] = p[i & 255]; }
const h2 = (x, y) => P[(P[x & 255] + y) & 255] / 255;
const sm = (t) => t * t * (3 - 2 * t);
export function noise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const a = h2(xi, yi), b = h2(xi + 1, yi), c = h2(xi, yi + 1), d = h2(xi + 1, yi + 1); const u = sm(xf), v = sm(yf); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
export function fbm(x, y, o = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * noise(x * f, y * f); f *= 2.03; a *= 0.5; } return s; }

/** 4x4 ordered-dither threshold (0..1) at a pixel. */
const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const bayer = (x, y) => (B4[(y & 3) * 4 + (x & 3)] + 0.5) / 16;

/**
 * A 32-colour 8-bit palette (Endesga-32-like) by name, so every scene shares one look.
 * Scenes may add their own colours, but should stay in this spirit: few, saturated, no gradients except by dithering.
 */
export const PAL = {
  ink: '#181425', night: '#262b44', navy: '#3a4466', slate: '#5a6988', mist: '#8b9bb4', fog: '#c0cbdc', white: '#ffffff',
  deep: '#124e89', blue: '#0099db', sky: '#2ce8f5', ice: '#a3e7f0',
  pine: '#193c3e', forest: '#265c42', green: '#3e8948', leaf: '#63c74d', lime: '#b8e986',
  wine: '#3e2731', brown: '#733e39', bark: '#a22633', clay: '#be4a2f', tan: '#d77643', sand: '#ead4aa', cream: '#e4a672',
  red: '#e43b44', orange: '#f77622', gold: '#feae34', yellow: '#fee761',
  plum: '#68386c', purple: '#b55088', pink: '#f6757a', rose: '#ffb3c6', violet: '#8f5fd7', dusk: '#5d3a7a',
};

/** Fills a w×h block mixing two colours by `level` (0 = all A, 1 = all B) with ordered dither. */
export function dither(g, x0, y0, w, h, a, b, level) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { g.fillStyle = bayer(x, y) < level ? b : a; g.fillRect(x, y, 1, 1); }
}

/** A vertical sky made of colour bands with dithered seams (cheap: one row at a time). */
export function bandedSky(g, W, y0, y1, colours) {
  const n = colours.length - 1;
  for (let y = y0; y < y1; y++) {
    const u = ((y - y0) / Math.max(1, y1 - y0)) * n; const i = Math.min(n - 1, Math.floor(u)); const f = u - i;
    if (f < 0.25 || f > 0.75) { g.fillStyle = f < 0.5 ? colours[i] : colours[i + 1]; g.fillRect(0, y, W, 1); }
    else { const lvl = (f - 0.25) * 2; for (let x = 0; x < W; x++) { g.fillStyle = bayer(x, y) < lvl ? colours[i + 1] : colours[i]; g.fillRect(x, y, 1, 1); } }
  }
}

/** '#rrggbb' → 0xAABBGGRR for writing straight into an ImageData Uint32Array (little-endian). */
export const u32 = (hex) => { const n = parseInt(hex.slice(1), 16); return (0xff << 24 | (n & 0xff) << 16 | (n & 0xff00) | (n >> 16 & 0xff)) >>> 0; };

/** A per-pixel frame buffer for scenes that shade every pixel (water, sky): write `px[y * W + x] = u32(colour)`, then `put()`. */
export function frameBuffer(g, W, H) {
  const img = g.createImageData(W, H); const px = new Uint32Array(img.data.buffer);
  return { px, put: () => g.putImageData(img, 0, 0) };
}

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Mounts a pixel scene into `host` (a positioned element). Renders only while on screen and the tab is visible. Returns stop().
 * `still`: draw one frame at `stillAt` seconds and never animate (the Settings cards).
 * `pointerTarget`: where the cursor is read (the window desk sits under the page, so it reads `window`).
 * `pauseOnBlur`: stop drawing while the window is out of focus.
 */
export function mountPixel(host, create, { rows = ROWS, still = false, stillAt = 3, pointerTarget = host, pauseOnBlur = false } = {}) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;image-rendering:pixelated;image-rendering:crisp-edges';
  host.prepend(canvas);
  const g = canvas.getContext('2d', { alpha: false });
  const pointer = { x: -999, y: -999, in: false, speed: 0, down: false };
  const ctx = { W: 0, H: rows, pointer, rng, noise, fbm, PAL, bayer, dither, bandedSky, u32, frameBuffer };
  let inst = null, raf = 0, visible = false, stopped = false, last = 0, acc = 0, t = 0;
  function resize() {
    const r = host.getBoundingClientRect(); if (!r.width || !r.height) return;
    const W = Math.max(64, Math.round((rows * r.width) / r.height));
    if (W === ctx.W) return;
    ctx.W = W; canvas.width = W; canvas.height = rows; g.imageSmoothingEnabled = false;
    inst?.resize?.(W, rows);
  }
  let focused = !pauseOnBlur || document.hasFocus();
  function frame(now) {
    raf = 0; if (!visible || stopped || document.hidden || !focused) return;
    const dt = Math.min(0.1, (now - last) / 1000); last = now; acc += dt;
    if (acc >= 1 / FPS - 0.002) { t += acc; inst?.draw(g, t, acc); acc = 0; pointer.speed *= 0.8; }
    if (!reduce) raf = requestAnimationFrame(frame);
  }
  const start = () => { if (!still && !raf && !stopped) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  /** A still card: the scene run to `stillAt` seconds in big steps, then drawn once. */
  const drawStill = () => { if (!inst) return; t = 0; for (let i = 0; i < Math.round(stillAt * 10); i++) { t += 0.1; inst.draw(g, t, 0.1); } };
  const toLocal = (e) => { const r = host.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * ctx.W, ((e.clientY - r.top) / r.height) * rows, r]; };
  const onMove = (e) => {
    const [x, y, r] = toLocal(e);
    const inside = e.clientX >= r.left && e.clientX < r.right && e.clientY >= r.top && e.clientY < r.bottom;
    if (!inside) { if (pointer.in) { pointer.in = false; inst?.onLeave?.(); } return; }
    if (pointer.in) pointer.speed = Math.max(pointer.speed, Math.hypot(x - pointer.x, y - pointer.y));
    pointer.x = x; pointer.y = y; pointer.in = true; inst?.onPointer?.(pointer); if (reduce && !still) { inst?.draw(g, t, 0); }
  };
  const onLeave = () => { pointer.in = false; inst?.onLeave?.(); };
  const onFocus = () => { focused = true; start(); };
  const onBlur = () => { focused = false; };
  if (!still) {
    pointerTarget.addEventListener('pointermove', onMove);
    (pointerTarget === host ? host : document.documentElement).addEventListener(pointerTarget === host ? 'pointerleave' : 'mouseleave', onLeave);
    if (pauseOnBlur) { window.addEventListener('focus', onFocus); window.addEventListener('blur', onBlur); }
  }
  const ro = new ResizeObserver(() => { const was = ctx.W; resize(); if (still && ctx.W !== was) drawStill(); start(); }); ro.observe(host);
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); }, { rootMargin: '100px' }); io.observe(host);
  const onVis = () => { if (!document.hidden) start(); }; document.addEventListener('visibilitychange', onVis);
  resize();
  try { inst = create(ctx); host.dataset.ready = '1'; if (still) drawStill(); else inst.draw(g, 0, 0); } catch (err) { console.error('scene failed', err); host.dataset.error = String(err?.message || err); }
  start();
  return () => {
    stopped = true; ro.disconnect(); io.disconnect(); document.removeEventListener('visibilitychange', onVis);
    pointerTarget.removeEventListener('pointermove', onMove);
    (pointerTarget === host ? host : document.documentElement).removeEventListener(pointerTarget === host ? 'pointerleave' : 'mouseleave', onLeave);
    window.removeEventListener('focus', onFocus); window.removeEventListener('blur', onBlur);
    if (raf) cancelAnimationFrame(raf); canvas.remove();
  };
}
