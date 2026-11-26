// Галактика: 8-bit spiral galaxy. ~4k star particles are projected each frame into a light buffer that maps
// to a warm (core) or cool (arms) colour ramp with ordered dither; the cursor tilts and turns the disc, damped.
import { clamp } from './pxa-util.js';

const COOL = ['#141a4a', '#22307a', '#2e52b0', '#4a82e0', '#8ab8f6', '#d4e8ff', '#ffffff'];
const WARM = ['#2a1830', '#5e2e3c', '#a2523a', '#e08e4a', '#f6c46a', '#ffeab0', '#ffffff'];

export default function create({ bayer, fbm, rng, u32, frameBuffer, pointer }) {
  let W = 0, H = 0, fb = null, bg = null, acc = null, cool = null, parts = [], hii = [], twinkle = [];
  let rx = 0.5, yaw = 0;
  const C32 = COOL.map(u32), W32 = WARM.map(u32);

  function build(g) {
    W = g.canvas.width; H = g.canvas.height; fb = frameBuffer(g, W, H); const r = rng(9);
    acc = new Float32Array(W * H); cool = new Float32Array(W * H);
    bg = new Uint32Array(W * H);
    const space = [u32('#05050f'), u32('#090a1c'), u32('#0e0f28')];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const n = fbm(x * 0.03, y * 0.05, 4), m = fbm(x * 0.05 + 20, y * 0.04, 3);
      let c = bayer(x, y) < n * 0.9 - 0.25 ? space[1] : space[0];
      if (n > 0.6 && bayer(x, y) < (n - 0.6) * 2.5) c = x < W * 0.4 ? u32('#1c1a48') : u32('#2a1638');
      if (m > 0.66 && bayer(x, y) < (m - 0.66) * 2) c = u32('#301a44');
      bg[y * W + x] = c;
    }
    twinkle = [];
    for (let i = 0; i < 170; i++) { const x = (r() * W) | 0, y = (r() * H) | 0; const b = r(); bg[y * W + x] = u32(b > 0.9 ? '#ffffff' : b > 0.6 ? '#a8b8e0' : '#4a5a8a'); if (b > 0.85) twinkle.push({ x, y, ph: r() * 6.28, sp: 1 + r() * 2 }); }
    // a few distant galaxies
    for (const [fx, fy, a, s] of [[0.14, 0.2, 0.5, 4], [0.3, 0.78, -0.3, 3], [0.08, 0.6, 0.9, 2.5]]) {
      const cx = W * fx, cy = H * fy;
      for (let dy = -4; dy <= 4; dy++) for (let dx = -6; dx <= 6; dx++) { const u = (dx * Math.cos(a) + dy * Math.sin(a)) / s, v = (-dx * Math.sin(a) + dy * Math.cos(a)) / (s * 0.35); const d = u * u + v * v; if (d < 1) bg[Math.round(cy + dy) * W + Math.round(cx + dx)] = u32(d < 0.15 ? '#ffe6b0' : d < 0.5 ? '#b0a0c8' : '#5a5a8a'); }
    }
    // disc particles: two log-spiral arms with dust lanes, a warm bulge
    parts = [];
    const arms = 2;
    for (let i = 0; i < 6500; i++) {
      const kind = r();
      if (kind < 0.18) { // bulge
        const rr = Math.pow(r(), 2.2) * 0.22, a = r() * 6.283; parts.push([rr, a, (r() - 0.5) * 0.12 * (1 - rr * 3), 1.6, 0]);
      } else if (kind < 0.8) { // arms
        const rr = 0.12 + Math.pow(r(), 0.85) * 0.88, arm = (r() * arms) | 0;
        const a = arm * (Math.PI * 2 / arms) + Math.log(rr / 0.1) * 1.7 + (r() - 0.5) * (0.42 + rr * 0.3);
        const coolness = clamp(0.35 + rr * 0.9 + (r() - 0.5) * 0.3);
        parts.push([rr, a, (r() - 0.5) * 0.04, 0.9, coolness]);
      } else { // diffuse disc
        const rr = Math.sqrt(r()) * 0.95; parts.push([rr, r() * 6.283, (r() - 0.5) * 0.05, 0.75 * (1 - rr * 0.6), 0.55]);
      }
    }
    // dust: darken just inside the arms
    for (let i = 0; i < 1100; i++) { const rr = 0.16 + Math.pow(r(), 0.9) * 0.7, arm = (r() * arms) | 0; parts.push([rr, arm * Math.PI + Math.log(rr / 0.1) * 1.7 - 0.22 + (r() - 0.5) * 0.12, 0, -1.2, 0]); }
    // star-forming knots
    hii = Array.from({ length: 26 }, () => { const rr = 0.3 + r() * 0.62, arm = (r() * arms) | 0; return [rr, arm * Math.PI + Math.log(rr / 0.1) * 1.7 + (r() - 0.5) * 0.2, r() < 0.5 ? '#f6757a' : '#ffb3c6']; });
  }

  return {
    draw(g, t) {
      if (g.canvas.width !== W || !fb) build(g);
      const trx = pointer.in ? 0.28 + (pointer.y / H) * 0.7 : 0.5, tyaw = pointer.in ? (pointer.x / W - 0.5) * 1.3 : 0;
      rx += (trx - rx) * 0.04; yaw += (tyaw - yaw) * 0.04;
      const spin = t * 0.045, cy0 = Math.cos(yaw), sy0 = Math.sin(yaw), cr = Math.cos(rx), sr = Math.sin(rx);
      const cx = W * 0.62, cyy = H * 0.5, R = Math.min(H * 0.62, W * 0.34);
      acc.fill(0); cool.fill(0);
      const plot = (rr, a, h, wgt, cl) => {
        const x3 = rr * Math.cos(a + spin), z3 = rr * Math.sin(a + spin);
        const x1 = x3 * cy0 - z3 * sy0, z1 = x3 * sy0 + z3 * cy0, y1 = h * cr - z1 * sr;
        const X = Math.round(cx + x1 * R), Y = Math.round(cyy + y1 * R);
        if (X < 0 || Y < 0 || X >= W || Y >= H) return -1;
        const k = Y * W + X; acc[k] += wgt; cool[k] += wgt * cl; return k;
      };
      for (const p of parts) plot(p[0], p[1], p[2], p[3], p[4]);
      const px = fb.px; px.set(bg);
      for (let k = 0; k < acc.length; k++) {
        const b = acc[k]; if (b < 0.3) continue;
        const x = k % W, y = (k / W) | 0, q = cool[k] / b;
        const v = 1 - Math.exp(-b * 0.42), rampArr = q + (bayer(x, y) - 0.5) * 0.25 > 0.5 ? C32 : W32;
        const u = clamp(v, 0, 0.999) * (rampArr.length - 1), i = Math.floor(u);
        px[k] = rampArr[Math.min(rampArr.length - 1, i + (bayer(x + 1, y) < u - i ? 1 : 0))];
      }
      // glowing core halo (dithered)
      const cX = Math.round(cx), cY = Math.round(cyy);
      for (let dy = -9; dy <= 9; dy++) for (let dx = -14; dx <= 14; dx++) { const d = Math.hypot(dx / 1.4, dy / Math.max(0.35, Math.cos(rx) * 0.9 + 0.3)); const x = cX + dx, y = cY + dy; if (x < 0 || y < 0 || x >= W || y >= H) continue; if (d < 9 && bayer(x, y) < (9 - d) / 14 && acc[y * W + x] < 2) px[y * W + x] = W32[3]; }
      for (const s of twinkle) if (Math.sin(t * s.sp + s.ph) > 0.7) px[s.y * W + s.x] = 0xffffffff;
      fb.put();
      for (const [rr, a, col] of hii) { const x3 = rr * Math.cos(a + spin), z3 = rr * Math.sin(a + spin); const x1 = x3 * cy0 - z3 * sy0, z1 = x3 * sy0 + z3 * cy0; g.fillStyle = col; g.fillRect(Math.round(cx + x1 * R), Math.round(cyy - z1 * sr * R), 1, 1); }
    },
  };
}
