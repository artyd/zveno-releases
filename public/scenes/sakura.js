// Сакура: 8-bit spring garden. Sky, mountain, trees, torii, grass and pond are pre-rendered once;
// each frame draws drifting clouds, the pond shimmer and the falling petals (the cursor blows them like a gust).
import { layer, blob } from './pxa-util.js';

const SKY = ['#7cc4ec', '#9ed4f0', '#c4e6f4', '#e6f2f6', '#fbe6ee'];
const PETAL = ['#ffd6e2', '#ffb3c6', '#f68ea8', '#ffffff'];

export default function create({ bayer, fbm, noise, rng, bandedSky, pointer }) {
  let W = 0, H = 0, back = null, front = null, clouds = null, pond = null, petals = [];
  let gx = 0, gy = 0, lastX = null, lastY = null;

  function canopy(L, cx, cy, rx, ry, r, n) {
    const blobs = [];
    for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()); blobs.push([cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d * 0.9, 4 + r() * 6]); }
    blobs.sort((p, q) => p[1] - q[1]);
    for (const [bx, by, br] of blobs) blob(L, bx, by, br, br * 0.85, (dx, dy, nx, ny, x, y) => {
      const light = -nx * 0.45 - ny * 0.75 + (noise(x * 0.5, y * 0.5) - 0.5) * 0.6 - (by - cy) / ry * 0.35;
      if (light > 0.75) return '#fff0f5';
      if (light > 0.3) return bayer(x, y) < 0.85 ? '#ffd0de' : '#ffb3c6';
      if (light > -0.25) return bayer(x, y) < 0.8 ? '#ffb3c6' : '#f68ea8';
      if (light > -0.7) return bayer(x, y) < 0.75 ? '#f08aa4' : '#c9708e';
      return '#a85a7e';
    });
  }
  function trunk(L, x, base, top, lean, r) {
    for (let y = base; y > top; y--) {
      const k = (base - y) / (base - top), w = Math.max(1, Math.round(1.4 + 2.6 * (1 - k) ** 2)), cx = Math.round(x + lean * k * k * 10);
      for (let dx = -w; dx <= w; dx++) L.dot(cx + dx, y, dx > w * 0.3 ? '#8a4a44' : dx < -w * 0.4 ? '#3e2228' : '#5e3034');
    }
    for (let b = 0; b < 4; b++) { // branches into the crown
      let bx = x + lean * 6, by = top + 6; const dir = b % 2 ? 1 : -1;
      for (let s = 0; s < 14; s++) { bx += dir * (0.8 + r() * 0.6); by -= 0.6 + r() * 0.5; L.dot(Math.round(bx), Math.round(by), '#4a2830'); L.dot(Math.round(bx), Math.round(by) + 1, '#5e3034'); }
    }
  }

  function build(g) {
    W = g.canvas.width; H = g.canvas.height; const r = rng(5);
    back = layer(W, H);
    bandedSky(back.g, W, 0, 100, SKY);
    // mountain with a snow cap
    const mx = Math.round(W * 0.6), top = 38, base = 96;
    for (let y = top; y < base; y++) {
      const k = (y - top) / (base - top), hw = Math.round(4 + k * k * 70 + k * 18);
      for (let x = mx - hw; x <= mx + hw; x++) {
        if (x < 0 || x >= W) continue;
        const snowLine = top + 16 + Math.round(4 * Math.sin(x * 0.6) + 3 * noise(x * 0.3, 1));
        const lit = x > mx + Math.round((noise(y * 0.3, 2) - 0.5) * 6);
        let c = y < snowLine ? (lit ? '#ffffff' : '#c8d6ec') : lit ? '#9fb4d8' : '#7f92c0';
        if (y > base - 14) c = bayer(x, y) < (y - (base - 14)) / 14 ? '#b8cbe0' : c; // haze at the foot
        back.dot(x, y, c);
      }
    }
    // distant tree line: rounded green crowns with pink sakura puffs between
    for (let i = 0; i < 70; i++) {
      const x = (i / 70) * (W + 20) - 10 + r() * 4, pinky = r() < 0.3, rr = 3 + r() * 3.5;
      blob(back, x, 93 - r() * 3, rr, rr * 0.8, (dx, dy, nx, ny, px, py) => pinky ? (ny < -0.2 ? '#f6c4d4' : bayer(px, py) < 0.5 ? '#e8a4bc' : '#d890ac') : ny < -0.3 ? '#8cbc84' : nx > 0.3 ? '#4c7a58' : '#5e8f64');
    }
    back.rect(0, 93, W, 4, '#5e8f64');
    // meadow
    for (let y = 96; y < H; y++) for (let x = 0; x < W; x++) {
      const n = fbm(x * 0.06, y * 0.14, 3) + (y - 96) * 0.004;
      let c = n > 0.62 ? '#9ad466' : n > 0.5 ? (bayer(x, y) < 0.5 ? '#9ad466' : '#76b850') : n > 0.4 ? '#76b850' : '#5e9e46';
      if (bayer(x * 3, y * 5) < 0.02 && n > 0.45) c = '#d4f08c';
      back.dot(x, y, c);
    }
    // flowers and fallen petals on the grass
    for (let i = 0; i < 160; i++) { const x = (r() * W) | 0, y = 98 + ((r() * (H - 98)) | 0); back.dot(x, y, ['#ffffff', '#fee761', '#ffb3c6', '#ffd6e2', '#f68ea8'][(r() * 5) | 0]); }
    // pond (bottom right) with stones
    pond = { cx: W * 0.72, cy: 124, rx: W * 0.19, ry: 10 };
    const inPond = (x, y) => ((x - pond.cx) / (pond.rx * (1 + 0.05 * Math.sin(y)))) ** 2 + ((y - pond.cy) / pond.ry) ** 2 < 1;
    pond.inPond = inPond;
    for (let y = 112; y < 136; y++) for (let x = 0; x < W; x++) {
      if (!inPond(x, y)) continue;
      const edge = !inPond(x, y - 1) || !inPond(x - 1, y) || !inPond(x + 1, y);
      back.dot(x, y, edge ? '#4f8a52' : y < pond.cy - 5 ? (bayer(x, y) < 0.5 ? '#6cc4ec' : '#58b0e0') : y < pond.cy + 3 ? '#4aa0d8' : '#3a88c8');
    }
    for (let i = 0; i < 6; i++) { const sx = pond.cx - pond.rx * 0.75 + i * pond.rx * 0.3, sy = pond.cy + 2 - Math.sin(i * 0.9) * 4; blob(back, sx, sy, 3.2, 1.8, (dx, dy, nx, ny) => (ny < -0.2 ? '#d8d8e0' : nx > 0.3 ? '#a8a8b8' : '#8a8aa0')); back.rect(sx - 2, sy + 2, 4, 1, '#3a78b0'); }
    for (let i = 0; i < 14; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 0.85; back.dot(pond.cx + Math.cos(a) * pond.rx * d, pond.cy + Math.sin(a) * pond.ry * d, '#ffd6e2'); }
    // torii gate
    const tx = Math.round(W * 0.47), tb = 104, th = 26, tw = 14;
    back.rect(tx - tw, tb - th, 2, th, '#c8323c'); back.rect(tx + tw - 1, tb - th, 2, th, '#c8323c');
    back.rect(tx - tw, tb - th, 1, th, '#e4505a'); back.rect(tx + tw - 1, tb - th, 1, th, '#e4505a');
    back.rect(tx - tw - 3, tb - th + 5, tw * 2 + 7, 2, '#c8323c');
    back.rect(tx - tw - 5, tb - th - 1, tw * 2 + 11, 2, '#c8323c'); back.rect(tx - tw - 6, tb - th - 3, tw * 2 + 13, 2, '#2a1d22');
    back.dot(tx - tw - 7, tb - th - 4, '#2a1d22'); back.dot(tx + tw + 7, tb - th - 4, '#2a1d22');
    back.rect(tx - 1, tb - th + 1, 2, 4, '#c8323c');
    back.rect(tx - tw - 1, tb, 4, 1, '#5e5e70'); back.rect(tx + tw - 2, tb, 4, 1, '#5e5e70');
    // trees: a small one behind the gate, big ones on both edges
    front = layer(W, H);
    trunk(back, Math.round(W * 0.34), 102, 84, 0.2, r); canopy(back, W * 0.34, 78, 16, 10, r, 26);
    trunk(front, Math.round(W * 0.9), 120, 62, -0.6, r); canopy(front, W * 0.86, 36, 42, 30, r, 90);
    trunk(front, Math.round(W * 0.07), 126, 70, 0.5, r); canopy(front, W * 0.08, 44, 30, 28, r, 70);
    // soft shadows under the trees
    for (const [sx, sy, w] of [[W * 0.88, 121, 22], [W * 0.08, 127, 18], [W * 0.34, 103, 10]]) for (let x = -w; x <= w; x++) for (let y = -2; y <= 2; y++) if ((x / w) ** 2 + (y / 2.5) ** 2 < 1 && bayer(sx + x, sy + y) < 0.5) back.dot(sx + x, sy + y, '#4a8a42');
    // clouds strip that drifts
    clouds = layer(W, 40);
    for (let i = 0; i < 5; i++) { const cx = r() * W, cy = 8 + r() * 22, s = 6 + r() * 8; for (let k = 0; k < 5; k++) blob(clouds, cx + (k - 2) * s * 0.7, cy - (k % 2) * 2, s * (k === 2 ? 0.9 : 0.6), s * 0.45, (dx, dy, nx, ny) => (ny > 0.3 ? '#e6eef8' : '#ffffff')); }
    petals = Array.from({ length: 150 }, () => ({ x: r() * W, y: r() * H, vx: 0, vy: 0, ph: r() * 6.28, s: 0.6 + r() * 0.8, c: PETAL[(r() * PETAL.length) | 0] }));
  }

  return {
    onPointer(p) { if (lastX !== null) { gx += (p.x - lastX) * 0.35; gy += (p.y - lastY) * 0.35; } lastX = p.x; lastY = p.y; },
    onLeave() { lastX = lastY = null; },
    draw(g, t, dt) {
      if (g.canvas.width !== W || !back) build(g);
      g.drawImage(back.c, 0, 0);
      const off = Math.floor(t * 1.5) % W; g.drawImage(clouds.c, off, 2); g.drawImage(clouds.c, off - W, 2);
      // pond shimmer: short light lines that slide
      g.fillStyle = '#c4ecfa';
      for (let i = 0; i < 9; i++) { const y = Math.round(pond.cy - 6 + i * 1.6), x = Math.round(pond.cx - pond.rx * 0.7 + ((t * 4 + i * 23) % (pond.rx * 1.4))); if (pond.inPond(x, y) && pond.inPond(x + 3, y)) g.fillRect(x, y, 3, 1); }
      g.drawImage(front.c, 0, 0);
      gx *= 0.94; gy *= 0.94;
      for (const p of petals) {
        let ax = -9 * p.s + Math.sin(t * 0.7 + p.ph) * 5 + gx * 3, ay = 7 * p.s + Math.cos(t * 1.3 + p.ph) * 3 + gy * 3;
        if (pointer.in) { const dx = p.x - pointer.x, dy = p.y - pointer.y, d = Math.hypot(dx, dy); if (d < 18) { ax += (dx / (d + 0.1)) * (18 - d) * 6; ay += (dy / (d + 0.1)) * (18 - d) * 6; } }
        p.vx += (ax - p.vx) * 0.08; p.vy += (ay - p.vy) * 0.08; p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.y > H + 2 || p.x < -3 || p.x > W + 3 || p.y < -6) { p.x = W * (0.3 + Math.random() * 0.8); p.y = -2; }
        g.fillStyle = p.c; const flip = Math.sin(t * 3 * p.s + p.ph) > 0;
        g.fillRect(Math.round(p.x), Math.round(p.y), flip ? 2 : 1, 1);
      }
    },
  };
}
