// Под водой: 8-bit coral reef. Water, distant rocks, sand and the reef are pre-rendered; each frame adds
// light rays, caustics on the sand, swaying kelp, a fish school that dodges the cursor, angelfish and bubbles.
import { layer, blob } from './pxa-util.js';

const WATER = ['#5ad6ec', '#2cb4e0', '#1a92cc', '#1474b0', '#105a94', '#0c4a7e'];
const WATER_LIT = ['#9eeaf6', '#5ad6ec', '#2cb4e0', '#1a92cc', '#1474b0', '#105a94'];
const ANGEL = [
  '....k......',
  '...kk......',
  '..kyyk.....',
  '.kyykyk..k.',
  'kyykyyykkk.',
  'eyykyyykyk.',
  'kyykyyykkk.',
  '.kyykyk..k.',
  '..kyyk.....',
  '...kk......',
  '....k......',
];

export default function create({ bayer, fbm, noise, rng, u32, frameBuffer, pointer }) {
  let W = 0, H = 0, fb = null, bg = null, lit = null, floorTop = null, reef = null, kelps = [], fish = [], angels = [], bubbles = [];
  let n1 = null, n2 = null; const NT = 64;
  const sandA = u32('#f2e2b4'), sandB = u32('#fff4d2');

  function coralBranch(L, x, y, a, len, w, col, colLit, r, depth = 0) {
    for (let i = 0; i < len; i++) { x += Math.cos(a); y -= Math.sin(a); for (let k = 0; k < w; k++) L.dot(Math.round(x) + k, Math.round(y), k === w - 1 ? colLit : col); a += (r() - 0.5) * 0.25; }
    L.dot(Math.round(x), Math.round(y) - 1, colLit);
    if (depth < 3) for (let b = 0; b < 2; b++) coralBranch(L, x, y, a + (b ? 0.5 : -0.5) + (r() - 0.5) * 0.3, len * (0.6 + r() * 0.2), Math.max(1, w - 1), col, colLit, r, depth + 1);
  }

  function build(g) {
    W = g.canvas.width; H = g.canvas.height; fb = frameBuffer(g, W, H); const r = rng(21);
    bg = new Uint32Array(W * H); lit = new Uint32Array(W * H);
    floorTop = new Int16Array(W);
    for (let x = 0; x < W; x++) floorTop[x] = Math.round(112 + 5 * Math.sin(x * 0.035) + 3 * fbm(x * 0.08, 4, 3));
    const w32 = WATER.map(u32), wl32 = WATER_LIT.map(u32);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const k = y * W + x, u = Math.min(0.999, Math.pow(y / 118, 1.1)) * (WATER.length - 1), i = Math.floor(u), j = Math.min(WATER.length - 1, i + (bayer(x, y) < u - i ? 1 : 0));
      bg[k] = w32[j]; lit[k] = wl32[j];
    }
    // distant rock silhouettes, two layers
    for (const [base, amp, f0, seed, c1, c2] of [[104, 34, 0.025, 8, '#3a8cc4', '#2c78b2'], [116, 24, 0.04, 3, '#2a72aa', '#1c5f96']]) {
      for (let x = 0; x < W; x++) { const top = Math.round(base - amp * Math.pow(fbm(x * f0, seed, 4), 1.6) * 1.8); for (let y = top; y < 120; y++) { const c = u32(y < top + 1 ? c1 : c2); bg[y * W + x] = c; lit[y * W + x] = c; } }
    }
    // sand with ripples
    for (let x = 0; x < W; x++) for (let y = floorTop[x]; y < H; y++) {
      const rip = Math.sin(x * 0.25 + y * 1.1 + noise(x * 0.1, y * 0.2) * 3);
      const c = u32(y === floorTop[x] ? '#fff0c8' : rip > 0.7 ? '#f2dca6' : rip < -0.75 ? '#d8bc84' : bayer(x, y) < 0.15 ? '#e4cc94' : '#ecd6a2');
      bg[y * W + x] = c; lit[y * W + x] = c;
    }
    // caustic noise tiles
    n1 = new Float32Array(NT * NT); n2 = new Float32Array(NT * NT);
    for (let y = 0; y < NT; y++) for (let x = 0; x < NT; x++) { n1[y * NT + x] = noise(x * 0.25, y * 0.25) ; n2[y * NT + x] = noise(x * 0.25 + 31, y * 0.25 + 17); }
    // the reef (front layer)
    reef = layer(W, H);
    const rock = (cx, cy, rx, ry) => blob(reef, cx, cy, rx, ry, (dx, dy, nx, ny, x, y) => { const l = -nx * 0.4 - ny * 0.8 + (noise(x * 0.4, y * 0.4) - 0.5) * 0.7; return l > 0.5 ? '#7a9ab4' : l > 0 ? '#5a7a98' : l > -0.5 ? '#44607e' : '#334a66'; });
    rock(W * 0.06, 124, 26, 16); rock(W * 0.2, 130, 18, 10); rock(W * 0.9, 120, 30, 20); rock(W * 0.76, 132, 16, 8); rock(W * 0.55, 136, 12, 6);
    const brain = (cx, cy, rr, a, b) => blob(reef, cx, cy, rr, rr * 0.75, (dx, dy, nx, ny, x, y) => (Math.sin(x * 1.3 + Math.sin(y * 0.9) * 2) > 0.4 ? b : ny < -0.4 ? '#ffd29c' : a));
    brain(W * 0.13, 116, 7, '#e4a672', '#b87a4a'); brain(W * 0.82, 106, 8, '#d77643', '#a2522f'); brain(W * 0.44, 132, 6, '#c8a0d8', '#8f5fd7');
    // branching corals
    [[0.03, 112, '#f77622', '#ffb070'], [0.24, 122, '#e43b44', '#ff8a8a'], [0.94, 104, '#f6757a', '#ffc0c8'], [0.7, 128, '#feae34', '#fee761'], [0.86, 128, '#b55088', '#f08ad0'], [0.32, 134, '#f6757a', '#ffc0c8']].forEach(([fx, y, c, cl]) => { for (let k = 0; k < 3; k++) coralBranch(reef, W * fx + k * 3 - 3, y, Math.PI / 2 + (k - 1) * 0.35, 6 + r() * 4, 2, c, cl, r); });
    // sea fans (lattice)
    const fan = (cx, by, h, col) => { for (let y = 0; y < h; y++) { const hw = Math.round(Math.sin((y / h) * Math.PI) * h * 0.55); for (let x = -hw; x <= hw; x++) if ((x + y) % 3 === 0 || (x - y) % 4 === 0 || Math.abs(x) === hw) reef.dot(cx + x, by - y, col); } reef.rect(cx, by - 2, 1, 4, '#5a3a5a'); };
    fan(Math.round(W * 0.97), 100, 22, '#b55088'); fan(Math.round(W * 0.08), 106, 18, '#8f5fd7');
    // tube sponges
    const tube = (x, by, h, c, cl) => { reef.rect(x, by - h, 3, h, c); reef.rect(x, by - h, 1, h, cl); reef.rect(x, by - h, 3, 1, '#2a1d3a'); };
    tube(Math.round(W * 0.78), 116, 12, '#8f5fd7', '#b88af0'); tube(Math.round(W * 0.78) + 4, 116, 8, '#8f5fd7', '#b88af0'); tube(Math.round(W * 0.17), 124, 9, '#feae34', '#fee761');
    // kelp: positions and phases (drawn every frame)
    kelps = [0.01, 0.04, 0.09, 0.15, 0.21, 0.6, 0.66, 0.83, 0.88, 0.93, 0.97].map((fx, i) => ({ x: Math.round(W * fx), base: 126 + (i % 3) * 5, h: 46 + r() * 52, ph: r() * 6.28, front: i % 4 === 1 }));
    fish = Array.from({ length: 30 }, () => ({ x: W * 0.7 + r() * 30, y: 50 + r() * 30, vx: 10, vy: 0, c: r() < 0.25 ? '#fee761' : r() < 0.5 ? '#ffffff' : '#c4ecfa' }));
    angels = [{ x: W * 0.3, y: 64, d: 1, sp: 6, ph: 0 }, { x: W * 0.8, y: 86, d: -1, sp: 4.5, ph: 2 }];
    bubbles = [];
  }

  function drawKelp(g, k, t) {
    for (let s = 0; s < k.h; s++) {
      const y = k.base - s, sw = Math.sin(t * 1.1 + s * 0.09 + k.ph) * (s / k.h) * 6 + Math.sin(t * 0.7 + k.ph) * 2 * (s / k.h);
      const x = Math.round(k.x + sw);
      g.fillStyle = '#245e3a'; g.fillRect(x, y, 1, 1); g.fillStyle = s % 3 ? '#3e9e52' : '#2e8a4a'; g.fillRect(x + 1, y, 2, 1);
      if (s % 6 === 2) { const side = s % 12 === 2 ? 1 : -1; g.fillStyle = '#63c74d'; g.fillRect(side > 0 ? x + 3 : x - 3, y, 3, 1); g.fillStyle = '#8edc6a'; g.fillRect(side > 0 ? x + 5 : x - 4, y - 1, 2, 1); }
    }
  }

  return {
    onPointer(p) { if (p.speed > 0.6 && bubbles.length < 90 && Math.random() < 0.6) bubbles.push({ x: p.x, y: p.y, r: Math.random() < 0.3 ? 2 : 1, v: 10 + Math.random() * 10, ph: Math.random() * 6.28 }); },
    draw(g, t, dt) {
      if (g.canvas.width !== W || !fb) build(g);
      const px = fb.px; px.set(bg);
      // light rays from the surface (dithered towards the lighter water)
      const drift = Math.sin(t * 0.25) * 6;
      const OFF = 60, tab = new Float32Array(W + OFF + 8);
      for (let i = 0; i < tab.length; i++) { const d = i - OFF + drift; tab[i] = Math.pow(Math.max(0, Math.sin(d * 0.075) * Math.sin(d * 0.031 + t * 0.2)), 3); }
      for (let y = 6; y < 108; y++) {
        const fade = (1 - y / 112) * 0.9, shift = Math.round(y * 0.45), row = y * W, b0 = bayer(0, y), b1 = bayer(1, y), b2 = bayer(2, y), b3 = bayer(3, y);
        for (let x = 0; x < W; x++) { const rv = tab[x - shift + OFF] * fade; if (rv > 0.035) { const th = (x & 3) === 0 ? b0 : (x & 3) === 1 ? b1 : (x & 3) === 2 ? b2 : b3; if (th < rv && y < floorTop[x]) px[row + x] = lit[row + x]; } }
      }
      // caustics on the sand
      const o1 = Math.floor(t * 3), o2 = Math.floor(t * 2.2);
      for (let x = 0; x < W; x++) for (let y = floorTop[x] + 1; y < H; y += 1) { const a = n1[((y * 2 + o1) & 63) * NT + ((x + o1) & 63)], b = n2[((y * 2 - o2) & 63) * NT + ((x - o2) & 63)]; if (Math.abs(a - b) < 0.035) px[y * W + x] = (x + y) & 1 ? sandB : sandA; }
      // surface shimmer
      for (let x = 0; x < W; x++) { const s = Math.sin(x * 0.2 + t * 2) + Math.sin(x * 0.07 - t * 1.3); px[(s > 1.2 ? 0 : 1) * W + x] = 0xfff8f0c8; if (s > 0.6) px[2 * W + x] = 0xfff8e6a0; }
      fb.put();
      for (const k of kelps) if (!k.front) drawKelp(g, k, t);
      // fish school: follows a wandering point, keeps apart, flees the cursor
      const tx = W * 0.62 + Math.sin(t * 0.21) * W * 0.25, ty = 58 + Math.sin(t * 0.37) * 22;
      for (const f of fish) {
        let ax = (tx - f.x) * 0.6, ay = (ty - f.y) * 0.6;
        for (const o of fish) { if (o === f) continue; const dx = f.x - o.x, dy = f.y - o.y, d2 = dx * dx + dy * dy; if (d2 < 36 && d2 > 0) { ax += (dx / d2) * 40; ay += (dy / d2) * 40; } }
        if (pointer.in) { const dx = f.x - pointer.x, dy = f.y - pointer.y, d = Math.hypot(dx, dy); if (d < 24) { ax += (dx / (d + 0.1)) * 900 / (d + 4); ay += (dy / (d + 0.1)) * 900 / (d + 4); } }
        f.vx += ax * dt; f.vy += ay * dt; const sp = Math.hypot(f.vx, f.vy), max = 34; if (sp > max) { f.vx *= max / sp; f.vy *= max / sp; }
        f.vx *= 0.99; f.vy *= 0.97; f.x += f.vx * dt; f.y = Math.max(8, Math.min(104, f.y + f.vy * dt));
        const x = Math.round(f.x), y = Math.round(f.y), dir = f.vx >= 0 ? 1 : -1;
        g.fillStyle = f.c; g.fillRect(x - 2, y, 4, 1); g.fillRect(x - 1, y - 1, 2, 1); g.fillStyle = '#7fb8d8'; g.fillRect(x - 1, y + 1, 2, 1);
        g.fillStyle = f.c; g.fillRect(dir > 0 ? x - 4 : x + 2, y - 1, 1, 3); g.fillRect(dir > 0 ? x - 3 : x + 2, y, 1, 1);
        g.fillStyle = '#0c2a4a'; g.fillRect(dir > 0 ? x + 1 : x - 2, y, 1, 1);
      }
      // angelfish
      for (const a of angels) {
        a.x += a.d * a.sp * dt; if (a.x > W + 10) a.d = -1; if (a.x < -10) a.d = 1;
        const ay = Math.round(a.y + Math.sin(t * 0.8 + a.ph) * 3), ax = Math.round(a.x);
        ANGEL.forEach((row, ry) => { for (let rx = 0; rx < row.length; rx++) { const ch = row[a.d > 0 ? row.length - 1 - rx : rx]; if (ch === '.') continue; g.fillStyle = ch === 'y' ? '#fee761' : ch === 'e' ? '#181425' : '#2a2a3a'; g.fillRect(ax + rx - 5, ay + ry - 5, 1, 1); } });
      }
      g.drawImage(reef.c, 0, 0);
      for (const k of kelps) if (k.front) drawKelp(g, k, t);
      // bubbles from vents and from the cursor
      if (Math.random() < dt * 2) bubbles.push({ x: W * 0.9 + Math.random() * 4, y: 104, r: 1, v: 12, ph: Math.random() * 6 });
      if (Math.random() < dt * 1.2) bubbles.push({ x: W * 0.13, y: 110, r: 1, v: 10, ph: Math.random() * 6 });
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i]; b.y -= b.v * dt; if (b.y < 3) { bubbles.splice(i, 1); continue; }
        const x = Math.round(b.x + Math.sin(t * 3 + b.ph) * 1.2), y = Math.round(b.y);
        g.fillStyle = '#d8f8ff';
        if (b.r === 1) { g.fillRect(x, y - 1, 1, 1); g.fillRect(x - 1, y, 1, 1); g.fillRect(x + 1, y, 1, 1); g.fillRect(x, y + 1, 1, 1); }
        else { g.fillRect(x - 1, y - 2, 3, 1); g.fillRect(x - 1, y + 2, 3, 1); g.fillRect(x - 2, y - 1, 1, 3); g.fillRect(x + 2, y - 1, 1, 3); g.fillStyle = '#ffffff'; g.fillRect(x - 1, y - 1, 1, 1); }
      }
    },
  };
}
