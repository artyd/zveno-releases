// Холмы: golden-hour valley with a winding river, rolling hills, trees. Cursor: parallax by whole pixels.
import { layer, ellipse, halo, ridge, vgrad, pine, roundTree, parallax, hash, bayer } from './kit-a.js';
import { rng } from './common.js';

export default function create({ PAL, pointer }) {
  const C = PAL;
  const PAD = 10;
  let W = 0, H = 0, sky, far, mid, vale, near, clouds = [], riverPts = [];
  const pstate = { v: 0 };
  const SKY_HI = '#3f6ea8', SKY_MID = '#7fb2d6';

  function build(w, h) {
    W = w; H = h; const LW = W + PAD * 2; const R = rng(11);
    const hz = Math.round(H * 0.52);
    // sky + sun
    sky = layer(W, H);
    vgrad(sky.g, 0, 0, W, hz + 10, [C.deep, SKY_HI, SKY_MID, C.ice, C.cream, C.gold]);
    const sx = Math.round(W * 0.3), sy = Math.round(hz - 16);
    sky.g.drawImage(halo(34, C.cream, 0.35), sx - 34, sy - 34); sky.g.drawImage(halo(18, C.yellow, 0.65), sx - 18, sy - 18);
    ellipse(sky.g, sx, sy, 7, 7, '#fff6c2');
    // far mountains: hazy violet with rosy lit crests
    far = layer(LW, H);
    const rf = ridge(LW, { base: hz + 4, amp: 30, freq: 0.018, seed: 5, sharp: 0.55 });
    for (let x = 0; x < LW; x++) { const top = Math.round(rf[x]); far.g.fillStyle = '#8c8fc0'; far.g.fillRect(x, top, 1, H - top); far.g.fillStyle = C.rose; far.g.fillRect(x, top, 1, 1); if (rf[x + 1] < rf[x] || rf[x - 1] > rf[x]) { far.g.fillStyle = '#c7a3c8'; far.g.fillRect(x, top + 1, 1, 2); } }
    for (let y = hz - 30; y < hz + 10; y++) for (let x = 0; x < LW; x++) if (y > rf[x] + 4 && bayer(x, y) < (y - (hz - 30)) / 60) { far.g.fillStyle = '#a9b4d8'; far.g.fillRect(x, y, 1, 1); }
    // mid rolling hills, two bands
    mid = layer(LW, H);
    const bands = [{ base: hz + 14, amp: 14, seed: 13, dark: '#3f7f4a', lit: '#9cc95a', tip: C.gold }, { base: hz + 24, amp: 12, seed: 17, dark: C.forest, lit: C.green, tip: '#c9d65a' }];
    for (const b of bands) {
      const r = ridge(LW, { base: b.base, amp: b.amp, freq: 0.03, seed: b.seed, sharp: 0.1, oct: 3 });
      for (let x = 0; x < LW; x++) { const top = Math.round(r[x]); const litSide = r[x + 1] !== undefined && r[x + 1] > r[x] - 0.05; mid.g.fillStyle = b.dark; mid.g.fillRect(x, top, 1, H - top);
        mid.g.fillStyle = litSide ? b.lit : b.dark; mid.g.fillRect(x, top, 1, 4); if (litSide) { mid.g.fillStyle = b.tip; mid.g.fillRect(x, top, 1, 1); for (let y = top + 4; y < top + 9; y++) if (bayer(x, y) < (top + 9 - y) / 6) { mid.g.fillStyle = b.lit; mid.g.fillRect(x, y, 1, 1); } } }
      for (let i = 0; i < LW / 5; i++) { const x = Math.floor(R() * LW); const top = Math.round(r[x]); if (R() < 0.55) pine(mid.g, x, top + 3, 5 + Math.floor(R() * 5), C.pine, b.lit, R); else roundTree(mid.g, x, top + 3, 2 + R() * 1.5, [C.brown, C.pine, b.dark, b.lit], R); }
    }
    // valley floor + river
    vale = layer(LW, H);
    const vy = hz + 30;
    vgrad(vale.g, 0, vy, LW, H - vy, ['#5d9a48', C.green, '#3b7a3f', C.forest]);
    for (let i = 0; i < LW * 2.5; i++) { const x = Math.floor(R() * LW), y = vy + Math.floor(R() ** 0.7 * (H - vy)); vale.g.fillStyle = R() > 0.5 ? C.leaf : C.forest; vale.g.fillRect(x, y, 1 + (y - vy > 30 ? 1 : 0), 1); }
    riverPts = [];
    for (let y = vy; y < H; y++) { const k = (y - vy) / (H - vy); const cx = LW * 0.58 + Math.sin(k * 5.2 + 0.4) * LW * 0.16 * (0.3 + k) - k * LW * 0.08; const hw = 1 + k * k * 22; riverPts.push([y, cx, hw]);
      vale.g.fillStyle = C.sand; vale.g.fillRect(Math.round(cx - hw - 1 - k * 2), y, Math.round(hw * 2 + 2 + k * 4), 1);
      vale.g.fillStyle = C.blue; vale.g.fillRect(Math.round(cx - hw), y, Math.round(hw * 2), 1);
      vale.g.fillStyle = SKY_MID; vale.g.fillRect(Math.round(cx - hw * 0.4), y, Math.max(1, Math.round(hw * 0.5)), 1);
      if (k > 0.2 && bayer(Math.round(cx), y) < 0.5) { vale.g.fillStyle = C.deep; vale.g.fillRect(Math.round(cx + hw * 0.55), y, Math.max(1, Math.round(hw * 0.3)), 1); } }
    for (let i = 0; i < 40; i++) { const x = Math.floor(R() * LW), y = vy + 6 + Math.floor(R() * (H - vy - 6)); const onRiver = riverPts.find((p) => p[0] === y); if (onRiver && Math.abs(x - onRiver[1]) < onRiver[2] + 6) continue; const s = 2 + ((y - vy) / (H - vy)) * 4; if (R() < 0.5) pine(vale.g, x, y, Math.round(s * 2.2), C.pine, C.leaf, R); else roundTree(vale.g, x, y, s * 0.7, [C.brown, C.forest, C.green, '#c9d65a'], R); }
    // near framing hills with trees, left and right
    near = layer(LW, H);
    const nl = (x) => H * 0.72 + Math.pow(x / (LW * 0.36), 1.6) * H * 0.4, nr = (x) => H * 0.78 + Math.pow((LW - x) / (LW * 0.28), 1.6) * H * 0.4;
    for (let x = 0; x < LW; x++) { const top = Math.round(Math.min(nl(x), nr(x))); if (top >= H) continue; near.g.fillStyle = C.forest; near.g.fillRect(x, top, 1, H - top); near.g.fillStyle = x < LW / 2 ? '#c9d65a' : C.green; near.g.fillRect(x, top, 1, 2); for (let y = top + 2; y < top + 7; y++) if (bayer(x, y) < 0.4) { near.g.fillStyle = x < LW / 2 ? C.green : C.leaf; near.g.fillRect(x, y, 1, 1); } }
    for (let i = 0; i < 26; i++) { const left = i % 2 === 0; const x = left ? Math.floor(R() * LW * 0.28) : LW - Math.floor(R() * LW * 0.22); const top = Math.round(Math.min(nl(x), nr(x))); if (top >= H - 2) continue; const s = 5 + R() * 6; if (R() < 0.5) pine(near.g, x, top + 4, Math.round(s * 2.6), C.pine, '#c9d65a', R); else roundTree(near.g, x, top + 4, s * 0.8, [C.wine, C.pine, C.forest, '#a6c94a'], R); }
    for (let i = 0; i < 30; i++) { const x = Math.floor(R() * LW), top = Math.round(Math.min(nl(x), nr(x))); if (top >= H - 2) continue; near.g.fillStyle = [C.yellow, C.rose, C.white][i % 3]; near.g.fillRect(x, top + 3 + Math.floor(R() * 8), 1, 1); }
    clouds = Array.from({ length: 5 }, (_, i) => { const cw = 18 + Math.floor(hash(i, 3) * 26), s = layer(cw + 4, 10); for (let k = 0; k < 4; k++) ellipse(s.g, 3 + (k + 0.5) * cw / 4, 5 + (k % 2), cw / 6 + 2, 3 - (k % 2), C.cream); ellipse(s.g, cw / 2 + 2, 6, cw / 2.3, 2.5, C.white); s.g.globalCompositeOperation = 'source-atop'; s.g.fillStyle = C.rose; s.g.fillRect(0, 7, cw + 4, 3); s.g.globalCompositeOperation = 'source-over'; return { c: s.c, x: hash(i, 5) * W, y: 4 + Math.floor(hash(i, 6) * H * 0.25), sp: 0.5 + hash(i, 7) }; });
  }

  return {
    resize(w, h) { build(w, h); },
    draw(g, t) {
      if (g.canvas.width !== W || g.canvas.height !== H) build(g.canvas.width, g.canvas.height);
      const p = parallax(pstate, pointer, W);
      g.drawImage(sky.c, 0, 0);
      for (const c of clouds) g.drawImage(c.c, Math.round(((c.x + t * c.sp) % (W + 60)) - 40 - p), c.y);
      g.drawImage(far.c, Math.round(-PAD - p * 1), 0);
      g.drawImage(mid.c, Math.round(-PAD - p * 2), 0);
      const vx = Math.round(-PAD - p * 4);
      g.drawImage(vale.c, vx, 0);
      // glints drifting down the river
      const step = Math.floor(t * 5);
      for (let i = 0; i < riverPts.length; i += 2) { const [y, cx, hw] = riverPts[i]; if (hash(i, step) > 0.45) continue; const x = Math.round(cx - hw * 0.8 + hash(i + 1, step) * hw * 1.6) + vx; g.fillStyle = hash(i, step + 3) > 0.5 ? '#fff6c2' : C.gold; g.fillRect(x, y, 1 + (hw > 10 ? 2 : 0), 1); }
      g.drawImage(near.c, Math.round(-PAD - p * 7), 0);
      // birds
      g.fillStyle = C.navy;
      for (let i = 0; i < 4; i++) { const x = Math.round(((t * (4 + i) + i * 70) % (W + 30)) - 15 - p * 2), y = Math.round(H * 0.18 + i * 6 + Math.sin(t + i) * 2); const up = Math.floor(t * 4 + i) % 2; if (up) { g.fillRect(x - 2, y - 1, 1, 1); g.fillRect(x - 1, y, 1, 1); g.fillRect(x + 1, y, 1, 1); g.fillRect(x + 2, y - 1, 1, 1); } else g.fillRect(x - 2, y, 5, 1); }
    },
  };
}
