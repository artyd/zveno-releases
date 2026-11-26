// Северное сияние: 8-bit night over a snowy valley. Static sky, mountains, pines and lake are pre-rendered;
// each frame only the aurora columns, star twinkles, lake reflection and falling snow are drawn.
import { layer, clamp } from './pxa-util.js';

const SKY = ['#090a1a', '#0e1230', '#141b44', '#1a2654', '#223266', '#2c3f74'];
const GREEN = ['#12324a', '#145252', '#18755e', '#22a06c', '#4fd08a', '#a6f2b6', '#e6ffe8'];
const VIOLET = ['#1c1f4a', '#33306a', '#523f8e', '#7656b4', '#9b74d4'];

export default function create({ bayer, fbm, noise, rng, u32, frameBuffer, pointer }) {
  let W = 0, H = 0, fb = null, base = null, fg = null, lake = null, stars = [], flakes = [];
  let sway = 0, glowX = -999, glowA = 0;
  const G32 = GREEN.map(u32), V32 = VIOLET.map(u32);
  const pick = (arr, x, y, v) => { const u = clamp(v, 0, 0.999) * (arr.length - 1); const i = Math.floor(u); return arr[Math.min(arr.length - 1, i + (bayer(x, y) < u - i ? 1 : 0))]; };

  function build(g) {
    W = g.canvas.width; H = g.canvas.height; fb = frameBuffer(g, W, H);
    const r = rng(11);
    // ---- static background buffer: sky, stars, moon, lake ice
    const bg = new Uint32Array(W * H); const sky32 = SKY.map(u32);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) bg[y * W + x] = pick(sky32, x, y, Math.pow(y / 96, 1.15));
    stars = [];
    for (let i = 0; i < 140; i++) { const x = (r() * W) | 0, y = (r() * 86) | 0; const bright = r() < 0.2; bg[y * W + x] = u32(bright ? '#dfe8ff' : r() < 0.5 ? '#8b9bb4' : '#5a6988'); if (bright || r() < 0.15) stars.push({ x, y, ph: r() * 6.28, sp: 1 + r() * 2 }); }
    // moon with halo
    const mx = Math.round(W * 0.85), my = 20;
    for (let y = my - 14; y <= my + 14; y++) for (let x = mx - 14; x <= mx + 14; x++) {
      if (x < 0 || x >= W || y < 0) continue; const d = Math.hypot(x + 0.5 - mx, y + 0.5 - my);
      if (d < 6) bg[y * W + x] = u32(d > 4.8 && x < mx ? '#c0cbdc' : (x - mx) * 0.7 + (y - my) > 2.5 ? '#c9d4ea' : '#f4f8ff');
      else if (d < 9 && bayer(x, y) < (9 - d) / 6) bg[y * W + x] = u32('#3a4a80');
      else if (d < 13 && bayer(x, y) < (13 - d) / 16) bg[y * W + x] = u32('#2c3f74');
    }
    [[-2, -1], [1, 2], [2, -2]].forEach(([dx, dy]) => (bg[(my + dy) * W + mx + dx] = u32('#c9d4ea')));
    // lake (ice): dark blue with cracks, moon glitter column
    lake = { cx: W * 0.56, cy: 114, rx: W * 0.31, ry: 11 };
    const inLake = (x, y) => { const nx = (x - lake.cx) / (lake.rx * (1 + 0.06 * Math.sin(y * 0.9))), ny = (y - lake.cy) / lake.ry; return nx * nx + ny * ny < 1; };
    lake.inLake = inLake;
    for (let y = 100; y < 128; y++) for (let x = 0; x < W; x++) {
      if (!inLake(x, y)) continue; const n = fbm(x * 0.08, y * 0.3, 3);
      let c = n > 0.62 ? '#2a4a78' : n > 0.48 ? '#1c3460' : '#162a52';
      if (Math.abs(noise(x * 0.12, y * 0.5) - 0.5) < 0.025) c = '#4a6a9a'; // cracks
      if (Math.abs(x - mx) < 3 - (y - 100) * 0.05 && bayer(x, y) < 0.45) c = '#8fa8d0'; // moon on ice
      bg[y * W + x] = u32(c);
    }
    base = bg;
    // ---- foreground: mountains, snowfields, pines (transparent where sky / lake show through)
    fg = layer(W, H);
    // classic 8-bit peaks: shadow on the left slope, moonlit right slope, jagged snow caps
    const peak = (cx, top, baseY, halfW, col) => {
      const cap = Math.round((baseY - top) * col.cap);
      for (let y = Math.round(top); y < baseY; y++) {
        const k = (y - top) / (baseY - top), hw = Math.round(halfW * k * (1 + 0.12 * Math.sin(y * 0.7 + cx)));
        const split = cx + Math.round((noise(y * 0.25, cx) - 0.5) * 4 * k);
        for (let x = cx - hw; x <= cx + hw; x++) {
          if (x < 0 || x >= W) continue;
          const capEdge = top + cap + Math.round(3 * noise(x * 0.35, cx * 0.1) - 1.5) + (Math.abs(x - cx) > hw * 0.6 ? 2 : 0);
          const snowy = y < capEdge, lit = x >= split;
          fg.dot(x, y, snowy ? (lit ? col.snow : col.snowShade) : lit ? col.rock : col.rockDark);
        }
      }
    };
    const FAR = { snow: '#e8f0ff', snowShade: '#8b9bb4', rock: '#3a4466', rockDark: '#262b44', cap: 0.42 };
    const NEAR = { snow: '#c0cbdc', snowShade: '#6c7c9c', rock: '#2a3352', rockDark: '#1b2140', cap: 0.3 };
    let x0 = -10; while (x0 < W + 10) { const hw = 16 + r() * 22; peak(Math.round(x0), 52 + r() * 18, 96, hw, FAR); x0 += hw * (0.9 + r() * 0.5); }
    x0 = -6; while (x0 < W + 10) { const hw = 12 + r() * 14; peak(Math.round(x0), 74 + r() * 10, 100, hw, NEAR); x0 += hw * (1.1 + r() * 0.6); }
    // snowfields with soft blue shading, leaving the lake open
    for (let y = 90; y < H; y++) for (let x = 0; x < W; x++) {
      const hill = 96 + 6 * Math.sin(x * 0.03 + 1) + 3 * Math.sin(x * 0.09); if (y < hill || inLake(x, y)) continue;
      const s = fbm(x * 0.05, y * 0.12, 3) + (y - hill) * 0.004;
      fg.dot(x, y, s > 0.62 ? '#f4f8ff' : s > 0.5 ? '#c0cbdc' : s > 0.42 ? (bayer(x, y) < 0.5 ? '#c0cbdc' : '#8b9bb4') : '#8b9bb4');
    }
    // lake rim
    for (let x = 0; x < W; x++) for (let y = 100; y < 128; y++) if (lake.inLake(x, y) && !lake.inLake(x, y - 1)) { fg.dot(x, y, '#5a6988'); break; }
    // pines
    const pine = (x, by, h) => {
      const tiers = Math.max(2, Math.round(h / 7)), tl = h / tiers;
      for (let rr = 0; rr < h; rr++) {
        const inTier = (rr % tl) / tl, w = Math.max(0, Math.round((0.35 + inTier * 0.65) * (rr / h) * h * 0.36));
        const y = by - h + rr;
        for (let dx = -w; dx <= w; dx++) {
          const snowTop = inTier < 0.25 && dx < w - 1 && bayer(x + dx, y) < 0.8;
          const lit = dx > 0;
          fg.dot(x + dx, y, snowTop ? (lit ? '#e8f0ff' : '#a9b8d0') : lit ? '#24505a' : dx === 0 ? '#1a3a44' : '#10242e');
        }
      }
      fg.rect(x, by, 1, Math.max(1, Math.round(h / 10)), '#2a1d22');
      fg.dot(x, by - h - 1, '#e8f0ff');
    };
    for (let x = 6; x < W - 4; x += 4 + ((r() * 4) | 0)) { const by = 102 + ((r() * 2) | 0); if (lake.inLake(x, by + 2) || r() < 0.15) continue; pine(x, by, 7 + ((r() * 6) | 0)); }
    for (let i = 0; i < 9; i++) pine(((r() * W * 0.2) | 0) + 2, 120 + ((r() * 22) | 0), 18 + ((r() * 18) | 0));
    for (let i = 0; i < 8; i++) pine(Math.round(W * 0.86 + r() * W * 0.15), 124 + ((r() * 20) | 0), 20 + ((r() * 20) | 0));
    // foreground drift
    for (let x = 0; x < W; x++) { const top = 136 + Math.round(3 * Math.sin(x * 0.05) + 2 * Math.sin(x * 0.17)); for (let y = top; y < H; y++) fg.dot(x, y, y === top ? '#ffffff' : bayer(x, y) < 0.25 ? '#c0cbdc' : '#e8f0ff'); }
    flakes = Array.from({ length: 46 }, () => ({ x: r() * W, y: r() * H, v: 4 + r() * 6, ph: r() * 6.28 }));
  }

  return {
    draw(g, t, dt) {
      if (g.canvas.width !== W || !fb) build(g);
      const px = fb.px; px.set(base);
      // cursor: sways the curtains and brightens the part nearest to it
      sway += ((pointer.in ? (pointer.x / W - 0.5) * 2.2 : 0) - sway) * 0.05;
      if (pointer.in) { glowX = pointer.x; glowA += (1 - glowA) * 0.08; } else glowA *= 0.95;
      const bright = pointer.in ? 0.9 + (1 - pointer.y / H) * 0.25 : 1;
      const I1 = new Float32Array(W);
      for (let x = 0; x < W; x++) {
        // a front curtain (green, violet crown) and a fainter one behind it; both are vertical streaks over a wavy lower edge
        const b1 = 56 + 7 * Math.sin(x * 0.03 + t * 0.15 + sway * 1.4) + 3 * Math.sin(x * 0.085 - t * 0.27 + sway);
        const h1 = 36 + 8 * Math.sin(x * 0.02 + t * 0.08);
        const b2 = 36 + 5 * Math.sin(x * 0.026 - t * 0.12 + 2 + sway) + 2 * Math.sin(x * 0.1 + t * 0.2);
        const env1 = clamp(0.6 + 0.32 * Math.sin(x * 0.022 + t * 0.12 + sway) + 0.18 * Math.sin(x * 0.071 - t * 0.21), 0.08, 1);
        const env2 = clamp(0.4 + 0.3 * Math.sin(x * 0.03 - t * 0.1 + 1.7), 0, 0.7);
        const rays = 0.3 + 0.7 * noise(x * 0.75, t * 0.4);
        const near = glowA * 0.45 * Math.exp(-(((x - glowX) / 26) ** 2));
        const i1 = clamp(env1 * rays * bright + near, 0, 1.2), i2 = clamp(env2 * (0.4 + 0.6 * noise(x * 0.6 + 40, t * 0.35)) * bright, 0, 0.75);
        I1[x] = i1;
        const top = Math.max(0, Math.floor(Math.min(b1 - h1, b2 - 26)) - 1), bot = Math.min(H - 1, Math.ceil(b1) + 3);
        for (let y = top; y <= bot; y++) {
          const k = y * W + x;
          const f1 = (b1 - y) / h1;
          let v1 = f1 < 0 ? i1 * (1 + (f1 * h1) / 2.5) : f1 > 1 ? 0 : i1 * Math.pow(1 - f1, 1.3) * (f1 < 0.1 ? 1.3 : 1);
          if (v1 >= 0.17) { px[k] = f1 > 0.6 ? pick(V32, x, y, v1 * 2.2) : pick(G32, x, y, v1); continue; }
          const f2 = (b2 - y) / 26;
          const v2 = f2 < 0 ? i2 * (1 + f2 * 10) : f2 > 1 ? 0 : i2 * Math.pow(1 - f2, 1.2);
          if (v2 >= 0.16) px[k] = f2 > 0.5 ? pick(V32, x, y, v2 * 1.6) : pick(G32, x, y, v2 * 0.6);
        }
      }
      // star twinkle
      for (const s of stars) if (Math.sin(t * s.sp + s.ph) > 0.6) px[s.y * W + s.x] = 0xffffffff;
      // the aurora in the ice
      for (let y = 104; y < 127; y++) { const fade = 1 - (y - 104) / 23; for (let x = 0; x < W; x++) if (I1[x] > 0.5 && lake.inLake(x, y) && bayer(x, y + (Math.floor(t * 2) % 2)) < (I1[x] - 0.45) * 0.5 * fade) px[y * W + x] = G32[2]; }
      fb.put();
      g.drawImage(fg.c, 0, 0);
      // gentle snowfall
      g.fillStyle = '#e8f0ff';
      for (const f of flakes) { f.y += f.v * dt; f.x += Math.sin(t * 0.8 + f.ph) * 0.15 + sway * 0.1; if (f.y > H) { f.y = -2; f.x = Math.random() * W; } if (f.x < 0) f.x += W; if (f.x >= W) f.x -= W; g.fillRect(f.x | 0, f.y | 0, 1, 1); }
    },
  };
}
