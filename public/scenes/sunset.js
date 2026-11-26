// Пиксельный закат: sea at sunset, striped sun, clouds, sailboat, lighthouse island, gulls. Cursor: parallax by whole pixels.
import { layer, ellipse, halo, ridge, vgrad, parallax, hash, bayer } from './kit-a.js';

export default function create({ PAL, pointer }) {
  const C = PAL;
  let W = 0, H = 0, hz = 0, sky, sea, far, isle, sunGlow, clouds = [], streaks = [];
  const pstate = { v: 0 };
  const PAD = 8;

  function build(w, h) {
    W = w; H = h; hz = Math.round(H * 0.6);
    // sky with the sun painted in
    sky = layer(W, hz);
    vgrad(sky.g, 0, 0, W, hz, [C.ink, C.night, C.dusk, C.plum, C.purple, C.pink, C.orange, C.gold]);
    for (let i = 0; i < 40; i++) { const x = Math.floor(hash(i, 1) * W), y = Math.floor(hash(i, 2) * hz * 0.35); sky.g.fillStyle = hash(i, 3) > 0.7 ? C.fog : C.mist; sky.g.fillRect(x, y, 1, 1); }
    const sx = Math.round(W * 0.64), sr = 17, sy = hz - 5;
    sunGlow = halo(46, C.gold, 0.55);
    sky.g.drawImage(sunGlow, sx - 46, sy - 46);
    sky.g.drawImage(halo(28, C.yellow, 0.5), sx - 28, sy - 28);
    for (let dy = -sr; dy <= sr; dy++) {
      const y = sy + dy; if (y >= hz) break;
      const k = (dy + sr) / (sr * 2); const hw = Math.floor(Math.sqrt(Math.max(0, (sr + 0.4) ** 2 - dy * dy)));
      if (dy > 2) { const gap = 1 + Math.floor((dy - 2) / 4); if ((dy - 2) % 5 < Math.min(gap, 3)) continue; }
      sky.g.fillStyle = k < 0.35 ? '#fff6c2' : k < 0.6 ? C.yellow : k < 0.8 ? C.gold : C.orange; sky.g.fillRect(sx - hw, y, hw * 2 + 1, 1);
    }
    // far mountains on the horizon (left) and a low headland (right)
    far = layer(W + PAD * 2, hz);
    const r1 = ridge(W + PAD * 2, { base: hz, amp: 26, freq: 0.022, seed: 3, sharp: 0.5 });
    const r2 = ridge(W + PAD * 2, { base: hz, amp: 14, freq: 0.04, seed: 9, sharp: 0.3 });
    for (let x = 0; x < W + PAD * 2; x++) {
      const fade = Math.max(0, 1 - Math.max(0, x - W * 0.5) / (W * 0.18));
      const top1 = Math.round(hz - (hz - r1[x]) * fade); far.g.fillStyle = C.plum; far.g.fillRect(x, top1, 1, hz - top1);
      if (top1 < hz) { far.g.fillStyle = C.purple; far.g.fillRect(x, top1, 1, 1); }
      const top2 = Math.round(hz - (hz - r2[x]) * (0.5 + 0.5 * fade)); far.g.fillStyle = C.dusk; far.g.fillRect(x, top2, 1, hz - top2);
    }
    // sea base
    sea = layer(W, H - hz);
    vgrad(sea.g, 0, 0, W, H - hz, [C.purple, C.plum, C.dusk, C.navy, C.night]);
    for (let y = 0; y < H - hz; y++) for (let x = 0; x < W; x++) { const n = Math.sin(x * 0.35 + y * 1.7) + Math.sin(x * 0.13 - y * 0.9); if (n > 1.82 && bayer(x, y) < 0.5) { sea.g.fillStyle = y < (H - hz) * 0.4 ? C.pink : C.plum; sea.g.fillRect(x, y, 2, 1); } }
    // lighthouse island
    isle = layer(60, 44);
    const ib = 40; ellipse(isle.g, 30, ib + 2, 26, 6, C.ink); ellipse(isle.g, 24, ib - 1, 14, 6, C.night); ellipse(isle.g, 36, ib, 12, 5, C.ink);
    isle.g.fillStyle = C.wine; isle.g.fillRect(14, ib - 3, 6, 1); isle.g.fillRect(36, ib - 2, 8, 1);
    const tx = 28; for (let y = 0; y < 20; y++) { const w = 4 + Math.floor(y / 7); isle.g.fillStyle = Math.floor(y / 4) % 2 ? C.red : C.fog; isle.g.fillRect(tx - Math.floor(w / 2), ib - 24 + y, w, 1); isle.g.fillStyle = C.navy; isle.g.fillRect(tx - Math.floor(w / 2), ib - 24 + y, 1, 1); }
    isle.g.fillStyle = C.ink; isle.g.fillRect(tx - 3, ib - 25, 7, 1); isle.g.fillRect(tx - 2, ib - 30, 1, 5); isle.g.fillRect(tx + 2, ib - 30, 1, 5);
    isle.g.fillStyle = C.red; isle.g.fillRect(tx - 2, ib - 32, 5, 2); isle.g.fillRect(tx - 1, ib - 33, 3, 1); isle.g.fillStyle = C.ink; isle.g.fillRect(tx, ib - 34, 1, 1);
    // clouds
    clouds = [];
    for (let i = 0; i < 7; i++) {
      const cw = 22 + Math.floor(hash(i, 7) * 30), ch = 5 + Math.floor(hash(i, 8) * 4); const s = layer(cw + 4, ch + 4);
      for (let k = 0; k < 4; k++) ellipse(s.g, 4 + (k + 0.5) * (cw / 4), ch / 2 + 2 + (k % 2), cw / 6 + hash(i, k) * 4, ch / 2 - (k % 2), C.plum);
      ellipse(s.g, cw / 2 + 2, ch / 2 + 1, cw / 2.2, ch / 2.4, C.purple);
      s.g.globalCompositeOperation = 'source-atop';
      s.g.fillStyle = C.pink; s.g.fillRect(0, ch, cw + 4, 2); s.g.fillStyle = C.gold; s.g.fillRect(0, ch + 2, cw + 4, 2);
      s.g.fillStyle = C.dusk; s.g.fillRect(0, 0, cw + 4, 2);
      s.g.globalCompositeOperation = 'source-over';
      clouds.push({ c: s.c, x: hash(i, 9) * (W + 60) - 30, y: 6 + Math.floor(hash(i, 10) * (hz * 0.5)), sp: 0.6 + hash(i, 11) * 1.4 });
    }
    streaks = Array.from({ length: 26 }, (_, i) => ({ x: hash(i, 21) * W, y: hz + 3 + Math.floor(hash(i, 22) ** 1.6 * (H - hz - 4)), len: 3 + Math.floor(hash(i, 23) * 8), sp: 1 + hash(i, 24) * 3, col: hash(i, 25) > 0.5 ? C.pink : C.purple }));
  }

  function boat(g, x, y, t) {
    const bob = Math.round(Math.sin(t * 1.6)) ;
    y += bob;
    // reflection
    g.fillStyle = C.night; for (let i = 0; i < 4; i++) { const w = 14 - i * 3, o = Math.round(Math.sin(t * 3 + i) * 1); g.fillRect(x - 7 + o + i, y + 3 + i * 2, w, 1); }
    // hull
    g.fillStyle = C.ink; g.fillRect(x - 8, y, 17, 1); g.fillRect(x - 7, y + 1, 15, 1); g.fillRect(x - 5, y + 2, 11, 1);
    g.fillStyle = C.wine; g.fillRect(x - 8, y, 17, 1);
    // mast and sails
    g.fillStyle = C.ink; g.fillRect(x, y - 19, 1, 19);
    for (let i = 0; i < 17; i++) { const w = Math.floor(i * 0.55); g.fillStyle = C.sand; g.fillRect(x + 1, y - 18 + i, w, 1); if (w > 1) { g.fillStyle = C.cream; g.fillRect(x + w, y - 18 + i, 1, 1); } }
    for (let i = 0; i < 13; i++) { const w = Math.floor(i * 0.5); g.fillStyle = C.cream; g.fillRect(x - w - 1, y - 14 + i, w, 1); }
    g.fillStyle = C.red; g.fillRect(x + 1, y - 20, 3, 1);
  }
  function gull(g, x, y, t, i) {
    const up = Math.floor(t * 4 + i) % 2;
    g.fillStyle = C.ink;
    if (up) { g.fillRect(x - 3, y - 1, 1, 1); g.fillRect(x - 2, y, 2, 1); g.fillRect(x, y + 1, 1, 1); g.fillRect(x + 1, y, 2, 1); g.fillRect(x + 3, y - 1, 1, 1); }
    else { g.fillRect(x - 3, y + 1, 3, 1); g.fillRect(x, y + 1, 1, 1); g.fillRect(x + 1, y + 1, 3, 1); }
  }

  return {
    resize(w, h) { build(w, h); },
    draw(g, t) {
      if (g.canvas.width !== W || g.canvas.height !== H) build(g.canvas.width, g.canvas.height);
      const p = parallax(pstate, pointer, W);
      g.drawImage(sky.c, 0, 0);
      for (const c of clouds) { const x = Math.round(((c.x + t * c.sp) % (W + 70)) - 50 + p * 2); g.drawImage(c.c, x, c.y); }
      g.drawImage(far.c, Math.round(-PAD - p * 1), 0);
      g.drawImage(sea.c, 0, hz);
      // sun path on the water, re-shuffled 6 times a second
      const step = Math.floor(t * 6), sx = Math.round(W * 0.64);
      for (let y = hz + 1; y < H; y++) {
        const k = (y - hz) / (H - hz); const hw = Math.round(5 + k * 26);
        const n = 1 + (hash(y, step) > 0.55 ? 1 : 0) + (k < 0.3 ? 1 : 0);
        for (let i = 0; i < n; i++) { const r = hash(y * 3 + i, step); if (r < 0.18) continue; const len = 2 + Math.floor(hash(y, i + step * 7) * (k < 0.25 ? 10 : 6)); const x = sx - hw + Math.floor(hash(i + 9, y + step) * hw * 2) - (len >> 1);
          g.fillStyle = k < 0.18 ? '#fff6c2' : k < 0.45 ? C.yellow : k < 0.7 ? C.gold : C.orange; g.fillRect(x, y, len, 1); }
      }
      for (const s of streaks) { const x = Math.round(((s.x + t * s.sp) % (W + 20)) - 10); g.fillStyle = s.col; g.fillRect(x, s.y, s.len, 1); }
      // island + lighthouse
      const ix = Math.round(W * 0.86 - 30 + p * 3), iy = hz - 41;
      g.drawImage(isle.c, ix, iy);
      const on = (t % 3) < 1.4;
      const lx = ix + 28, ly = iy + 40 - 28;
      g.fillStyle = on ? '#fff6c2' : C.gold; g.fillRect(lx - 1, ly - 1, 3, 2);
      if (on) { const dir = Math.floor(t / 3) % 2 ? 1 : -1; for (let i = 3; i < 34; i++) { const spread = Math.floor(i / 6); for (let j = -spread; j <= spread; j++) if (bayer(lx + dir * i, ly + j) < 0.45 - i / 90) { g.fillStyle = C.yellow; g.fillRect(lx + dir * i, ly + j, 1, 1); } } }
      // boat
      const bx = Math.round(W * 0.3 + Math.sin(t * 0.05) * W * 0.08 + p * 4), by = hz + Math.round((H - hz) * 0.42);
      boat(g, bx, by, t);
      // gulls
      for (let i = 0; i < 3; i++) { const x = Math.round(((t * (5 + i * 2) + i * 90) % (W + 40)) - 20 + p * 3), y = Math.round(hz * 0.36 + i * 9 + Math.sin(t * 0.7 + i) * 3); gull(g, x, y, t, i); }
    },
  };
}
