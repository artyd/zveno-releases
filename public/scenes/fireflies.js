// Лес со светлячками: moonlit pine forest, moonbeams, forest floor with ferns, logs and mushrooms, blinking fireflies.
// Cursor: fireflies swarm toward it (a soft glow follows on the ground) and drift away when it leaves; slight parallax.
import { layer, ellipse, halo, vgrad, pine, parallax, hash, bayer, fbm, clamp } from './kit-a.js';
import { rng } from './common.js';

export default function create({ PAL, pointer }) {
  const C = PAL;
  const PAD = 10;
  let W = 0, H = 0, gy = 0, sky, back, beams, mid, floor, near, glow, flies = [];
  const pstate = { v: 0 };
  const FAR = '#2b3a63', MIDC = '#1b2645', LIT = '#5b6f9e';

  function fern(g, x, y, s, col, lit) {
    for (let i = -3; i <= 3; i++) { const len = Math.round(s * (1 - Math.abs(i) * 0.12)); for (let k = 0; k < len; k++) { const fx = x + Math.round(i * k * 0.45), fy = y - Math.round(k * (1 - Math.abs(i) * 0.12)) + Math.round((k * k) / (s * 1.6) * Math.abs(i) * 0.4); g.fillStyle = k > len - 2 ? lit : col; g.fillRect(fx, fy, 1, 1); } }
  }
  function mushroom(g, x, y) { g.fillStyle = C.fog; g.fillRect(x, y - 2, 1, 2); g.fillStyle = C.red; g.fillRect(x - 1, y - 3, 3, 1); g.fillRect(x, y - 4, 1, 1); g.fillStyle = C.white; g.fillRect(x - 1, y - 3, 1, 1); }

  function build(w, h) {
    W = w; H = h; gy = Math.round(H * 0.64); const LW = W + PAD * 2; const R = rng(3);
    sky = layer(W, H);
    vgrad(sky.g, 0, 0, W, gy, [C.ink, C.night, '#2f3d66', '#41548a']);
    for (let i = 0; i < 50; i++) { sky.g.fillStyle = hash(i, 4) > 0.7 ? C.white : C.mist; sky.g.fillRect(Math.floor(hash(i, 1) * W), Math.floor(hash(i, 2) * gy * 0.5), 1, 1); }
    const mx = Math.round(W * 0.8), my = Math.round(H * 0.17);
    sky.g.drawImage(halo(30, '#8ea6d6', 0.3), mx - 30, my - 30); sky.g.drawImage(halo(15, C.fog, 0.45), mx - 16, my - 16);
    ellipse(sky.g, mx, my, 7, 7, '#eef3ff'); sky.g.fillStyle = '#c9d3ea'; sky.g.fillRect(mx - 3, my - 2, 2, 2); sky.g.fillRect(mx + 2, my + 2, 2, 1); sky.g.fillRect(mx - 1, my + 3, 1, 1);
    // far forest
    back = layer(LW, H);
    for (let i = 0; i < LW / 3; i++) { const x = Math.floor(R() * LW); pine(back.g, x, gy + 2, Math.round(18 + R() * 22), FAR, null, R, 0.3); }
    back.g.fillStyle = FAR; back.g.fillRect(0, gy - 2, LW, H);
    // moonbeams: slanted dithered shafts from the moon side
    beams = layer(LW, H);
    for (let b = 0; b < 4; b++) { const x0 = W * (0.5 + b * 0.13) + PAD, wdt = 9 + b * 3; for (let y = Math.round(H * 0.3); y < H * 0.95; y++) { const cx = x0 - y * 0.5; const fade = Math.min(1, (y - H * 0.3) / 20) * (1 - y / (H * 0.95)); for (let x = Math.round(cx - wdt); x <= Math.round(cx + wdt); x++) if (bayer(x, y) < 0.12 * fade * (1 - Math.abs(x - cx) / wdt)) { beams.g.fillStyle = '#9fb3dd'; beams.g.fillRect(x, y, 1, 1); } } }
    // mid forest, bigger and darker, lit edge toward the moon
    mid = layer(LW, H);
    for (let i = 0; i < LW / 7; i++) { const x = Math.floor(R() * LW); const hgt = Math.round(34 + R() * 34); pine(mid.g, x, gy + 4, hgt, MIDC, LIT, R, 0.26); mid.g.fillStyle = '#141b33'; mid.g.fillRect(x - 1, gy - 6, 2, 12); }
    // forest floor
    floor = layer(LW, H);
    vgrad(floor.g, 0, gy, LW, H - gy, ['#22423e', C.pine, '#142a2a', C.ink]);
    for (let i = 0; i < LW * 3; i++) { const x = Math.floor(R() * LW), y = gy + Math.floor(R() ** 0.8 * (H - gy)); const n = fbm(x * 0.05, y * 0.08, 3); floor.g.fillStyle = n > 0.55 ? C.forest : n > 0.45 ? '#1d3b36' : '#3b2d3a'; floor.g.fillRect(x, y, 1 + (R() < 0.3 ? 1 : 0), 1); }
    // logs with moss
    for (const [fx, fw] of [[0.18, 34], [0.62, 26]]) { const x = Math.round(fx * LW), y = gy + Math.round((H - gy) * 0.45); floor.g.fillStyle = C.wine; floor.g.fillRect(x, y, fw, 4); floor.g.fillStyle = C.brown; floor.g.fillRect(x, y, fw, 1); floor.g.fillStyle = '#4b8a4f'; for (let k = 0; k < fw; k++) if (fbm(k * 0.3, 2, 2) > 0.45) floor.g.fillRect(x + k, y - 1, 1, 1); floor.g.fillStyle = C.tan; floor.g.fillRect(x + fw, y, 1, 4); floor.g.fillStyle = C.clay; floor.g.fillRect(x + fw, y + 1, 1, 2); }
    // clustered undergrowth: ferns and grass around clump centres, open mossy gaps between
    const clumps = Array.from({ length: Math.round(LW / 26) }, () => [R() * LW, gy + 4 + R() ** 0.9 * (H - gy - 6)]);
    for (const [cx, cy] of clumps) { const count = 3 + Math.floor(R() * 5); for (let i = 0; i < count; i++) { const x = Math.round(cx + (R() - 0.5) * 18), y = Math.round(cy + (R() - 0.5) * 6); const k = (y - gy) / (H - gy); if (R() < 0.6) fern(floor.g, x, y, Math.round(3 + k * 6), C.forest, '#4b8a4f'); else { floor.g.fillStyle = C.forest; for (let j = 0; j < 4; j++) floor.g.fillRect(x + j - 2, y - 1 - (j % 2) - Math.round(k * 3), 1, 2 + Math.round(k * 3)); } if (R() < 0.25) mushroom(floor.g, x + 4, y); } }
    for (let i = 0; i < 5; i++) { const x = Math.floor(R() * LW), y = gy + 4 + Math.floor(R() * (H - gy - 6)); ellipse(floor.g, x, y, 3 + R() * 2, 2, '#26304f'); floor.g.fillStyle = C.navy; floor.g.fillRect(x - 2, y - 2, 3, 1); }
    // near framing trunks
    near = layer(LW, H);
    for (const [fx, tw] of [[0.04, 14], [0.11, 7], [0.95, 16]]) { const x = Math.round(fx * LW); near.g.fillStyle = C.ink; near.g.fillRect(x - (tw >> 1), 0, tw, H); near.g.fillStyle = '#251c2c'; for (let y = 0; y < H; y += 3) if (hash(x, y) > 0.5) near.g.fillRect(x - (tw >> 1) + 2 + Math.floor(hash(y, x) * (tw - 4)), y, 1, 2); near.g.fillStyle = '#3c4a74'; near.g.fillRect(x + (tw >> 1) - 1, 0, 1, H); near.g.fillStyle = C.ink; for (let k = 0; k < 3; k++) { const by = 10 + k * 22 + Math.floor(hash(x, k) * 10); const dir = fx > 0.5 ? -1 : 1; for (let j = 0; j < 16; j++) near.g.fillRect(x + dir * j, by - Math.floor(j * 0.35), 1, 2); } }
    for (let i = 0; i < 4; i++) fern(near.g, Math.round((i < 2 ? 0.05 + i * 0.07 : 0.9 + (i - 2) * 0.06) * LW), H, 12, C.ink, '#1b2b2a');
    glow = halo(20, '#5f9a48', 0.22);
    flies = Array.from({ length: 70 }, () => ({ x: R() * W, y: gy - 30 + R() * (H - gy + 20), vx: 0, vy: 0, ph: R() * 6.28, sp: 0.6 + R() * 0.9 }));
  }

  return {
    resize(w, h) { build(w, h); },
    draw(g, t, dt) {
      if (g.canvas.width !== W || g.canvas.height !== H) build(g.canvas.width, g.canvas.height);
      const p = parallax(pstate, pointer, W);
      g.drawImage(sky.c, 0, 0);
      g.drawImage(back.c, Math.round(-PAD - p), 0);
      g.drawImage(beams.c, Math.round(-PAD - p), 0);
      g.drawImage(mid.c, Math.round(-PAD - p * 2), 0);
      g.drawImage(floor.c, Math.round(-PAD - p * 3), 0);
      const f = Math.min(2, (dt || 1 / 30) * 30);
      let gx = 0, gyy = 0, gn = 0;
      for (const fl of flies) {
        if (pointer.in) { const dx = pointer.x - fl.x, dy = pointer.y - fl.y, d = Math.hypot(dx, dy) + 1; if (d < W * 0.6) { fl.vx += (dx / d) * 0.07 * f; fl.vy += (dy / d) * 0.07 * f; if (d < 10) { fl.vx -= (dx / d) * 0.1; fl.vy -= (dy / d) * 0.1; } } }
        fl.vx += Math.cos(t * fl.sp + fl.ph) * 0.03 * f; fl.vy += Math.sin(t * fl.sp * 0.8 + fl.ph * 2) * 0.03 * f;
        fl.vx *= 0.94; fl.vy *= 0.94; fl.x += fl.vx * f; fl.y += fl.vy * f;
        if (fl.x < 0) fl.x += W; if (fl.x > W) fl.x -= W; fl.y = clamp(fl.y, gy - 50, H - 2);
        if (pointer.in && Math.hypot(pointer.x - fl.x, pointer.y - fl.y) < 26) { gx += fl.x; gyy += fl.y; gn++; }
      }
      if (gn > 4) { const cx = Math.round(gx / gn), cy = Math.max(gy + 4, Math.round(gyy / gn) + 8); g.drawImage(glow, cx - 22, cy - 22); }
      for (const fl of flies) {
        const b = Math.max(0, Math.sin(t * 2.2 * fl.sp + fl.ph)); if (b < 0.15) continue;
        const x = Math.round(fl.x), y = Math.round(fl.y);
        g.fillStyle = b > 0.6 ? '#fff9b0' : '#d8f07a'; g.fillRect(x, y, 1, 1);
        if (b > 0.55) { g.fillStyle = '#7fbf3a'; g.fillRect(x - 1, y, 1, 1); g.fillRect(x + 1, y, 1, 1); g.fillRect(x, y - 1, 1, 1); g.fillRect(x, y + 1, 1, 1); }
      }
      g.drawImage(near.c, Math.round(-PAD - p * 6), 0);
    },
  };
}
