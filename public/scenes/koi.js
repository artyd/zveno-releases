// Пруд с карпами: a garden pond seen from above: grass, rim stones, teal water with pebbles, lily pads and lotus, nine koi.
// Cursor: a slow cursor over the water gathers the koi under it, a fast one scatters them; moving over the water leaves ripples.
import { layer, ellipse, disc, hash, bayer, fbm } from './kit-a.js';
import { rng } from './common.js';

const PATTERNS = [
  ['#ffffff', '#e8541d', '#ffffff', '#e8541d', '#e8541d'], // kohaku
  ['#feae34', '#feae34', '#fee761', '#feae34', '#feae34'], // yamabuki ogon
  ['#ffffff', '#ffffff', '#d23b1f', '#181425', '#ffffff'], // sanke
  ['#e8541d', '#ffffff', '#181425', '#e8541d', '#ffffff'], // showa
  ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff'], // tancho (red dot on the head below)
  ['#be4a2f', '#be4a2f', '#d77643', '#be4a2f', '#be4a2f'], // chagoi
  ['#8b9bb4', '#8b9bb4', '#e8541d', '#8b9bb4', '#8b9bb4'], // asagi
  ['#ffffff', '#e43b44', '#ffffff', '#ffffff', '#e43b44'],
  ['#f77622', '#ffffff', '#f77622', '#181425', '#f77622'],
];
const N = 10;
const PROFILE = [1.5, 1.9, 2.1, 2.1, 1.9, 1.6, 1.3, 1.0, 0.7, 0.5];

export default function create({ PAL, pointer }) {
  const C = PAL;
  let W = 0, H = 0, ground, water, top, cx, cy, rx, ry, koi = [], ripples = [], lastRip = 0, scare = 0;
  const inPond = (x, y, m = 0) => { const dx = (x - cx) / (rx - m), dy = (y - cy) / (ry - m); return dx * dx + dy * dy < 1 + (fbm(x * 0.05, y * 0.05, 2) - 0.5) * 0.22; };

  function build(w, h) {
    W = w; H = h; const R = rng(9);
    cx = W * 0.56; cy = H * 0.52; rx = Math.min(W * 0.4, H * 0.95); ry = H * 0.4;
    ground = layer(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const n = fbm(x * 0.07, y * 0.07, 3), d = bayer(x, y); ground.g.fillStyle = n > 0.6 ? (d < 0.5 ? C.leaf : C.green) : n > 0.42 ? C.green : (d < 0.4 ? C.forest : C.green); ground.g.fillRect(x, y, 1, 1); }
    for (let i = 0; i < W * H / 60; i++) { const x = Math.floor(R() * W), y = Math.floor(R() * H); if (inPond(x, y, -8)) continue; ground.g.fillStyle = C.forest; ground.g.fillRect(x, y, 1, 2); ground.g.fillStyle = C.lime; ground.g.fillRect(x, y - 1, 1, 1); }
    for (let i = 0; i < 26; i++) { const fx = Math.floor(R() * W), fy = Math.floor(R() * H); if (inPond(fx, fy, -10)) continue; const col = [C.yellow, C.rose, C.white, C.pink][i % 4]; for (let k = 0; k < 4; k++) { ground.g.fillStyle = col; ground.g.fillRect(fx + Math.floor(R() * 5), fy + Math.floor(R() * 4), 1, 1); } }
    // water: depth-dithered teal, pebbles at the shallow edge
    water = layer(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!inPond(x, y)) continue;
      const dx = (x - cx) / rx, dy = (y - cy) / ry, depth = 1 - Math.min(1, Math.hypot(dx, dy));
      const lv = depth * 3 + (bayer(x, y) - 0.5) * 0.55; const col = lv < 0.45 ? '#5fae9c' : lv < 1.2 ? '#3f8f8c' : lv < 2.1 ? '#2b6f7c' : '#1f5468';
      water.g.fillStyle = col; water.g.fillRect(x, y, 1, 1);
      if (depth < 0.14 && hash(x, y) < 0.18) { water.g.fillStyle = hash(y, x) > 0.5 ? '#9a8a6a' : '#7c6f5a'; water.g.fillRect(x, y, 1, 1); }
    }
    // the rim: stones around the edge, plus lily pads and lotus on a top layer (drawn above the fish)
    top = layer(W, H);
    for (let a = 0; a < Math.PI * 2; a += 0.075 + R() * 0.06) { let r = 1.02; for (let k = 0; k < 30 && inPond(cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r); k++) r += 0.01; const x = cx + Math.cos(a) * rx * r, y = cy + Math.sin(a) * ry * r; const s = 2 + R() * 3; ellipse(top.g, x + 1, y + 1, s + 0.5, s * 0.75, '#2c3348'); ellipse(top.g, x, y, s, s * 0.7, R() > 0.4 ? C.slate : C.mist); ellipse(top.g, x - s * 0.3, y - s * 0.3, s * 0.45, s * 0.3, C.fog); }
    for (let i = 0; i < 6; i++) { const x = Math.floor(R() * W), y = Math.floor(R() * H); if (inPond(x, y, -14)) continue; ellipse(top.g, x + 2, y + 2, 7, 4, '#2c3348'); ellipse(top.g, x, y, 7, 4.5, C.slate); ellipse(top.g, x - 2, y - 1, 4, 2, C.mist); top.g.fillStyle = C.green; top.g.fillRect(x - 5, y - 3, 2, 1); }
    const pads = [];
    for (let i = 0; i < 16; i++) { let x, y, k = 0; do { const a = R() * Math.PI * 2, rr = 0.55 + R() * 0.38; x = cx + Math.cos(a) * rx * rr; y = cy + Math.sin(a) * ry * rr; k++; } while (k < 20 && pads.some((p) => Math.hypot(p[0] - x, p[1] - y) < 10)); pads.push([x, y]); }
    pads.forEach(([x, y], i) => {
      const r = 3.5 + hash(i, 4) * 3; ellipse(top.g, x + 1, y + 1, r, r * 0.85, '#1f4f5a'); ellipse(top.g, x, y, r, r * 0.85, C.green); ellipse(top.g, x - r * 0.25, y - r * 0.25, r * 0.55, r * 0.45, C.leaf);
      top.g.fillStyle = C.forest; const a0 = hash(i, 6) * Math.PI * 2; for (let k = 0; k < r; k++) top.g.fillRect(Math.round(x + Math.cos(a0) * k), Math.round(y + Math.sin(a0) * k * 0.85), 1, 1);
      for (let k = 0; k <= r + 1; k++) for (let j = -Math.floor(k * 0.4); j <= Math.floor(k * 0.4); j++) top.g.clearRect(Math.round(x + Math.cos(a0 + 0.35) * k - Math.sin(a0) * j * 0.3), Math.round(y + Math.sin(a0 + 0.35) * k * 0.85 + Math.cos(a0) * j * 0.3), 1, 1);
      if (i % 4 === 1) { const fx = Math.round(x), fy = Math.round(y - 1); top.g.fillStyle = C.rose; for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [-1, -1], [1, -1], [-1, 1], [1, 1]]) top.g.fillRect(fx + dx, fy + dy, 1, 1); top.g.fillStyle = C.pink; top.g.fillRect(fx - 1, fy, 3, 1); top.g.fillRect(fx, fy - 1, 1, 1); top.g.fillStyle = C.yellow; top.g.fillRect(fx, fy, 1, 1); }
    });
    koi = PATTERNS.map((pat, i) => { const a = R() * Math.PI * 2, rr = R() * 0.6; const k = { x: cx + Math.cos(a) * rx * rr, y: cy + Math.sin(a) * ry * rr, a: R() * Math.PI * 2, v: 0.5, len: 13 + R() * 6, pat, tancho: i === 4, hist: [], wob: R() * 6.28, scare: 0 }; for (let j = 0; j < 40; j++) k.hist.push({ x: k.x, y: k.y }); return k; });
  }

  function drawKoi(g, k, t) {
    const step = k.len / N; const pts = [k.hist[0]]; let acc = 0;
    for (let i = 1; i < k.hist.length && pts.length < N; i++) { const a = k.hist[i - 1], b = k.hist[i]; acc += Math.hypot(a.x - b.x, a.y - b.y); if (acc >= step) { pts.push(b); acc = 0; } }
    while (pts.length < N) pts.push(pts[pts.length - 1]);
    // shadow
    for (let i = 0; i < N; i += 2) disc(g, pts[i].x + 2, pts[i].y + 3, PROFILE[i], '#174452');
    // tail fan
    const tp = pts[N - 1], tb = pts[N - 3]; const ta = Math.atan2(tp.y - tb.y, tp.x - tb.x) + Math.sin(t * 6 * k.v + k.wob) * 0.6;
    g.fillStyle = 'rgba(255,255,255,0.55)';
    for (let s = 1; s <= 3; s++) for (const side of [-1, 1]) g.fillRect(Math.round(tp.x + Math.cos(ta + side * 0.5) * s), Math.round(tp.y + Math.sin(ta + side * 0.5) * s), 1, 1);
    // pectoral fins
    const f0 = pts[2], f1 = pts[1]; const fa = Math.atan2(f1.y - f0.y, f1.x - f0.x);
    for (const side of [-1, 1]) { const fx = f0.x + Math.cos(fa + side * 1.9) * 2.6, fy = f0.y + Math.sin(fa + side * 1.9) * 2.6; g.fillRect(Math.round(fx), Math.round(fy), 1, 1); }
    // body, tail to head
    for (let i = N - 1; i >= 0; i--) disc(g, pts[i].x, pts[i].y, PROFILE[i], k.pat[Math.min(4, Math.floor(i / 2))]);
    if (k.tancho) disc(g, pts[1].x, pts[1].y, 0.9, '#e43b44');
    // a light stripe along the back for volume
    g.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 1; i < 6; i++) g.fillRect(Math.round(pts[i].x), Math.round(pts[i].y), 1, 1);
  }

  function ripple(x, y, big) { ripples.push({ x, y, r: 1, a: 1, max: big ? 16 : 10 }); if (ripples.length > 24) ripples.shift(); }

  return {
    resize(w, h) { build(w, h); },
    onPointer(p) { if (p.speed > 6 && inPond(p.x, p.y)) scare = 1; },
    draw(g, t, dt) {
      if (g.canvas.width !== W || g.canvas.height !== H) build(g.canvas.width, g.canvas.height);
      const f = Math.min(2, (dt || 1 / 30) * 30);
      g.drawImage(ground.c, 0, 0); g.drawImage(water.c, 0, 0);
      // sparkles on the water
      const step = Math.floor(t * 4);
      for (let i = 0; i < 18; i++) { const a = hash(i, step) * Math.PI * 2, rr = Math.sqrt(hash(i + 50, step)) * 0.9; const x = Math.round(cx + Math.cos(a) * rx * rr), y = Math.round(cy + Math.sin(a) * ry * rr); g.fillStyle = i % 3 ? '#8fd3c3' : C.white; g.fillRect(x, y, i % 3 ? 2 : 1, 1); }
      const pin = pointer.in && inPond(pointer.x, pointer.y);
      if (pin && t - lastRip > 0.3 && pointer.speed > 0.6) { ripple(pointer.x, pointer.y, false); lastRip = t; }
      if (hash(step, 7) < 0.02 && Math.floor(t * 30) % 4 === 0) { const a = hash(step, 8) * 6.28, rr = hash(step, 9) * 0.7; ripple(cx + Math.cos(a) * rx * rr, cy + Math.sin(a) * ry * rr, false); }
      for (const k of koi) {
        let tx, ty;
        if (scare > 0 && pointer.in) { tx = k.x + (k.x - pointer.x) * 2; ty = k.y + (k.y - pointer.y) * 2; k.v = Math.min(k.v + 0.08 * f, 2.2); }
        else if (pin && pointer.speed < 6) { const ki = koi.indexOf(k); const ang = ki * 0.7 + t * (0.35 + (ki % 3) * 0.08); const orb = 7 + (ki % 3) * 5; tx = pointer.x + Math.cos(ang) * orb; ty = pointer.y + Math.sin(ang) * orb * 0.75; k.v += (0.75 - k.v) * 0.05; if (Math.hypot(k.x - pointer.x, k.y - pointer.y) < 8 && hash(Math.floor(t * 2), koi.indexOf(k)) < 0.01) ripple(k.x, k.y, false); }
        else { const wa = k.a + Math.sin(t * 0.5 + k.wob) * 0.9; tx = k.x + Math.cos(wa) * 20; ty = k.y + Math.sin(wa) * 20; k.v += (0.45 - k.v) * 0.03; }
        if (!inPond(k.x + Math.cos(k.a) * 10, k.y + Math.sin(k.a) * 10, 8)) { tx = cx; ty = cy; }
        for (const o of koi) { if (o === k) continue; const dx = k.x - o.x, dy = k.y - o.y, d = Math.hypot(dx, dy); if (d < 7 && d > 0) { tx += (dx / d) * 14; ty += (dy / d) * 14; } }
        let da = Math.atan2(ty - k.y, tx - k.x) - k.a; da = Math.atan2(Math.sin(da), Math.cos(da)); k.a += da * 0.07 * f;
        k.x += Math.cos(k.a) * k.v * f; k.y += Math.sin(k.a) * k.v * f; k.wob += 0.004;
        k.hist.unshift({ x: k.x, y: k.y }); if (k.hist.length > 60) k.hist.length = 60;
        drawKoi(g, k, t);
      }
      scare = Math.max(0, scare - 0.02 * f);
      // ripples
      for (let i = ripples.length - 1; i >= 0; i--) { const rp = ripples[i]; rp.r += 0.35 * f; rp.a = 1 - rp.r / rp.max; if (rp.a <= 0) { ripples.splice(i, 1); continue; }
        const n = Math.max(8, Math.round(rp.r * 5)); g.fillStyle = rp.a > 0.5 ? '#c4f0e6' : '#8fd3c3';
        for (let k = 0; k < n; k++) { if (bayer(k, Math.round(rp.r)) > rp.a + 0.2) continue; const a = (k / n) * Math.PI * 2; const x = Math.round(rp.x + Math.cos(a) * rp.r), y = Math.round(rp.y + Math.sin(a) * rp.r * 0.75); if (inPond(x, y)) g.fillRect(x, y, 1, 1); } }
      g.drawImage(top.c, 0, 0);
    },
  };
}
