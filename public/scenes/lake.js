// Горное озеро на рассвете: snowy peaks lit pink, pine shores, a mirror lake with rippled reflection, mist, birds.
// Cursor: moves the sun (and its path on the water); slight parallax.
import { layer, ellipse, halo, ridge, vgrad, pine, parallax, hash, bayer, fbm, clamp } from './kit-a.js';
import { rng } from './common.js';

export default function create({ PAL, pointer }) {
  const C = PAL;
  const PAD = 6;
  let W = 0, H = 0, hz = 0, sky, far, land, above, water, mist, glowBig, glowSmall;
  const sun = { x: 0, y: 0 }; const pstate = { v: 0 };
  const ROCK_LIT = '#b5708a', ROCK_SH = '#4b3a6e', SNOW_LIT = '#ffe3ea', SNOW_SH = '#a7a3d4', HAZE = '#8c8fc0';

  function build(w, h) {
    W = w; H = h; hz = Math.round(H * 0.57); const LW = W + PAD * 2; const R = rng(5);
    sun.x = W * 0.72; sun.y = hz * 0.4;
    sky = layer(W, hz);
    vgrad(sky.g, 0, 0, W, hz, [C.night, C.navy, '#6b5a8e', '#b77aa0', C.pink, C.cream, '#ffe0a8']);
    for (let i = 0; i < 30; i++) { sky.g.fillStyle = C.fog; sky.g.fillRect(Math.floor(hash(i, 1) * W), Math.floor(hash(i, 2) * hz * 0.3), 1, 1); }
    glowBig = halo(40, C.cream, 0.45); glowSmall = halo(18, '#fff6c2', 0.7);
    // far hazy range
    far = layer(LW, hz);
    const rf = ridge(LW, { base: hz - 2, amp: 26, freq: 0.03, seed: 21, sharp: 0.7 });
    for (let x = 0; x < LW; x++) { const top = Math.round(rf[x]); far.g.fillStyle = HAZE; far.g.fillRect(x, top, 1, hz - top); far.g.fillStyle = C.rose; far.g.fillRect(x, top, 1, 1); }
    // main peaks + shore forest
    land = layer(LW, hz);
    // classic pixel peaks: each has a lit right face and a shaded left face split along a jagged ridge line, and a snow cap
    const peaks = []; const n = Math.max(4, Math.round(LW / 46));
    for (let i = 0; i < n; i++) peaks.push({ x: (i + 0.3 + R() * 0.4) * (LW / n), h: 26 + R() * 26, k: 0.75 + R() * 0.5, cap: 0.32 + R() * 0.12, lean: (R() < 0.5 ? -1 : 1) * (0.25 + R() * 0.25) });
    for (let x = 0; x < LW; x++) {
      let best = null, top = hz;
      for (const pk of peaks) { const y = hz - 3 - pk.h + Math.abs(x - pk.x) * pk.k + Math.round((fbm(x * 0.15, pk.h, 3) - 0.5) * 5); if (y < top) { top = y; best = pk; } }
      top = Math.round(top); if (!best) continue;
      const peakY = hz - 3 - best.h;
      for (let y = top; y < hz; y++) {
        const depth = y - peakY; const split = best.x + Math.round((fbm(y * 0.18, best.h * 3, 3) - 0.5) * 6) + depth * best.lean;
        const lit = x >= split;
        const capY = best.h * best.cap + Math.round((fbm(x * 0.2, y * 0.05, 2) - 0.5) * 7);
        let col;
        if (depth < capY) col = lit ? SNOW_LIT : SNOW_SH;
        else if (depth < capY + 3 && bayer(x, y) < 0.5) col = lit ? SNOW_LIT : SNOW_SH;
        else col = lit ? ROCK_LIT : ROCK_SH;
        if (!lit && x >= split - 1 && depth < capY) col = C.fog;
        if (y === top && lit) col = C.white;
        const fogK = (y - (hz - 18)) / 18; if (fogK > 0 && bayer(x, y) < fogK * 0.7) col = HAZE;
        land.g.fillStyle = col; land.g.fillRect(x, y, 1, 1);
      }
    }
    // shore: dark ground strip and pines (open in the middle so the reflection reads)
    land.g.fillStyle = C.pine; land.g.fillRect(0, hz - 3, LW, 3);
    for (let i = 0; i < 90; i++) { const x = Math.floor(R() * LW); const mid = Math.abs(x / LW - 0.5); if (mid < 0.12 && R() < 0.8) continue; const s = (4 + R() * 10) * (0.6 + mid * 1.2); pine(land.g, x, hz, Math.round(s), C.pine, '#5f7d5e', R); }
    for (let i = 0; i < 30; i++) { const x = Math.floor(R() * LW); land.g.fillStyle = R() > 0.5 ? C.slate : C.navy; land.g.fillRect(x, hz - 1, 2 + Math.floor(R() * 3), 1); }
    above = layer(W, hz);
    // water darkening and streaks (static, drawn over the reflection)
    // water: a few calm light lines (static), the darkening is a flat tint per frame
    water = layer(W, H - hz);
    for (let i = 0; i < 26; i++) { const y = 2 + Math.floor(hash(i, 31) ** 1.4 * (H - hz - 3)); water.g.fillStyle = y < (H - hz) * 0.35 ? '#c7b3d8' : '#6e6a9e'; water.g.fillRect(Math.floor(hash(i, 32) * W), y, 3 + Math.floor(hash(i, 33) * 10), 1); }
    mist = layer(W * 2, 10);
    for (let y = 0; y < 10; y++) for (let x = 0; x < W * 2; x++) { const d = Math.abs(y - 5) / 5; const nn = fbm(x * 0.035, y * 0.3, 3); if (bayer(x, y) < (1 - d) * 0.2 * nn) { mist.g.fillStyle = '#d9a9c6'; mist.g.fillRect(x, y, 1, 1); } }
  }

  return {
    resize(w, h) { build(w, h); },
    draw(g, t) {
      if (g.canvas.width !== W || g.canvas.height !== H) build(g.canvas.width, g.canvas.height);
      const p = parallax(pstate, pointer, W);
      const tx = pointer.in ? clamp(pointer.x, 8, W - 8) : W * 0.72, ty = pointer.in ? clamp(pointer.y, hz * 0.18, hz - 6) : hz * 0.4;
      sun.x += (tx - sun.x) * 0.06; sun.y += (ty - sun.y) * 0.06;
      const sx = Math.round(sun.x), sy = Math.round(sun.y);
      // the world above the waterline, composed once per frame so the reflection mirrors it exactly
      const a = above.g;
      a.drawImage(sky.c, 0, 0);
      a.drawImage(glowBig, sx - 40, sy - 40); a.drawImage(glowSmall, sx - 18, sy - 18); ellipse(a, sx, sy, 5, 5, '#fff6c2');
      a.drawImage(far.c, Math.round(-PAD - p), 0);
      a.drawImage(land.c, Math.round(-PAD - p * 3), 0);
      for (let i = 0; i < 4; i++) { const bx = Math.round(((t * (5 + i) + i * 60) % (W + 30)) - 15), by = Math.round(hz * 0.3 + i * 5 + Math.sin(t + i) * 2); a.fillStyle = C.night; if (Math.floor(t * 4 + i) % 2) { a.fillRect(bx - 2, by - 1, 1, 1); a.fillRect(bx - 1, by, 1, 1); a.fillRect(bx + 1, by, 1, 1); a.fillRect(bx + 2, by - 1, 1, 1); } else a.fillRect(bx - 2, by, 5, 1); }
      g.drawImage(above.c, 0, 0);
      // reflection, row by row with a small sideways ripple that grows toward the viewer
      for (let y = hz; y < H; y++) { const k = (y - hz) / (H - hz); const src = hz - 1 - Math.floor((y - hz) * 1.15); if (src < 0) break; const off = Math.round(Math.sin(y * 0.9 + t * 2.2) * (0.4 + k * 1.8)); g.drawImage(above.c, 0, src, W, 1, off, y, W, 1); }
      g.fillStyle = C.night; g.fillRect(0, hz + Math.floor((hz) / 1.15), W, H);
      g.globalAlpha = 0.42; g.fillStyle = '#2a2d55'; g.fillRect(0, hz, W, H - hz); g.globalAlpha = 1;
      g.drawImage(water.c, Math.round(-((t * 2) % 8)), hz); g.drawImage(water.c, Math.round(W - ((t * 2) % 8)), hz);
      // sun path
      const step = Math.floor(t * 6);
      for (let y = hz + 2; y < H; y += 1) { const k = (y - hz) / (H - hz); if (hash(y, step) < 0.35) continue; const hw = 2 + k * 14; const len = 1 + Math.floor(hash(y + 5, step) * 4); g.fillStyle = k < 0.3 ? '#fff6c2' : C.cream; g.fillRect(Math.round(sx - hw + hash(y, step + 1) * hw * 2), y, len, 1); }
      // mist over the shore line
      const m1 = Math.round((t * 3) % W); g.drawImage(mist.c, -m1, hz - 9); g.drawImage(mist.c, Math.round(-((t * 1.7 + W * 0.5) % W)), hz - 4);
    },
  };
}
