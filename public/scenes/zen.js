// Сад камней: 8-bit Japanese rock garden. The raked sand is a shade map redrawn only when the cursor rakes it;
// foliage, bamboo fence, mossy islands, rocks, lantern, maple and veranda are pre-rendered; leaves fall now and then.
import { layer, blob } from './pxa-util.js';

const SAND = ['#e6d8b8', '#c4b28a', '#fbf3dc']; // base, groove, ridge
const SAND_SH = ['#c9b994', '#a99772', '#dccfac']; // same in rock shadow

export default function create({ bayer, fbm, noise, rng, u32 }) {
  let W = 0, H = 0, back = null, front = null, sand = null, img = null, px32 = null, S = null, shade = null, island = null, isl = [];
  let dirty = true, last = null, leaves = [], nextLeaf = 2, lantern = null;
  const Y0 = 36, Y1 = 132;
  const C = SAND.map(u32), CS = SAND_SH.map(u32), MOSS = u32('#2f6e3c');
  const val = (d) => [1, 2, 0][((d % 3) + 3) % 3];

  function build(g) {
    W = g.canvas.width; H = g.canvas.height; const r = rng(3);
    back = layer(W, H); front = layer(W, H); sand = layer(W, H);
    img = sand.g.createImageData(W, H); px32 = new Uint32Array(img.data.buffer);
    S = new Uint8Array(W * H); shade = new Uint8Array(W * H); island = new Uint8Array(W * H);
    // foliage behind the fence
    for (let y = 0; y < 20; y++) for (let x = 0; x < W; x++) { const n = fbm(x * 0.09, y * 0.12, 3); back.dot(x, y, n > 0.6 ? '#3e8948' : n > 0.48 ? (bayer(x, y) < 0.5 ? '#3e8948' : '#265c42') : n > 0.38 ? '#265c42' : '#193c3e'); }
    // bamboo fence
    for (let x = 0; x < W; x++) {
      const pole = Math.floor(x / 3), k = x % 3, top = 12 + (pole % 2);
      for (let y = top; y < Y0; y++) back.dot(x, y, k === 0 ? '#8a7a34' : k === 1 ? (pole % 3 ? '#d4c26a' : '#c8b45a') : '#a89440');
      for (let y = top + 7; y < Y0; y += 9) back.dot(x, y, '#7a6a2a');
    }
    for (const ty of [18, 29]) { back.rect(0, ty, W, 2, '#5a3e2a'); for (let x = 1; x < W; x += 6) back.dot(x, ty, '#7a5a3a'); }
    back.rect(0, Y0 - 1, W, 1, '#6a5a3a');
    // islands: moss with rocks (sun from the upper left, shadows to the lower right)
    isl = [[W * 0.2, 66, 15, 8, 2], [W * 0.74, 60, 20, 10, 3], [W * 0.88, 106, 12, 7, 1], [W * 0.36, 112, 10, 6, 1]];
    for (const [cx, cy, rx, ry] of isl) for (let y = Y0; y < Y1; y++) for (let x = 0; x < W; x++) {
      const nx = (x - cx) / rx, ny = (y - cy) / ry, d = Math.sqrt(nx * nx + ny * ny) + (noise(x * 0.3, y * 0.3) - 0.5) * 0.25;
      if (d < 1) island[y * W + x] = 1;
    }
    // rock shadows on the sand
    for (const [cx, cy, rx, ry] of isl) for (let y = Y0; y < Y1; y++) for (let x = 0; x < W; x++) { const nx = (x - cx - rx * 0.55) / (rx * 1.15), ny = (y - cy - ry * 0.35) / (ry * 1.05); if (nx * nx + ny * ny < 1 && !island[y * W + x]) shade[y * W + x] = 1; }
    // initial raking: gentle horizontal lines, rings around the islands
    for (let y = Y0; y < Y1; y++) for (let x = 0; x < W; x++) {
      let p = y + Math.round(Math.sin(x * 0.045 + y * 0.02) * 1.2);
      for (const [cx, cy, rx, ry] of isl) { const dx = (x - cx) / (rx + 2), dy = (y - cy) / (ry + 2); const d = Math.sqrt(dx * dx + dy * dy); if (d < 1 + 12 / (ry + 2)) { p = Math.round((d - 1) * (ry + 2) * 1.0); break; } }
      S[y * W + x] = val(p);
    }
    // moss, rocks, small plants (front)
    for (const [cx, cy, rx, ry, rocks] of isl) {
      blob(front, cx, cy, rx + 0.5, ry + 0.5, (dx, dy, nx, ny, x, y) => { if (!island[y * W + x]) return null; const n = noise(x * 0.4, y * 0.4); return ny < -0.5 && n > 0.4 ? '#7fc65a' : n > 0.62 ? '#5aa646' : n > 0.4 ? '#3e8948' : '#2f6e3c'; });
      for (let i = 0; i < 6; i++) front.dot(cx + (r() - 0.5) * rx * 1.4, cy + (r() - 0.5) * ry * 1.2, r() < 0.5 ? '#fee761' : '#ffffff');
      for (let i = 0; i < rocks; i++) {
        const bx = cx + (i - (rocks - 1) / 2) * rx * 0.55, by = cy - 2 + (i % 2) * 3, rr = (i === 0 ? 6 : 4) + r() * 2, tall = 1.2 + r() * 0.5;
        blob(front, bx, by - rr * (tall - 1) * 0.6, rr * 0.9, rr * tall * 0.7, (dx, dy, nx, ny, x, y) => { const l = -nx * 0.6 - ny * 0.7 + (noise(x * 0.5, y * 0.5) - 0.5) * 0.5; return l > 0.55 ? '#c8c8d0' : l > 0.1 ? '#9a9aa8' : l > -0.4 ? '#74748a' : '#55556a'; });
        front.dot(bx - 1, by - rr * tall * 0.8, '#7fc65a'); front.dot(bx, by - rr * tall * 0.8, '#5aa646');
      }
    }
    // stone lantern (right side)
    const lx = Math.round(W * 0.95), lb = 92; lantern = { x: lx, y: lb - 17 };
    front.rect(lx - 3, lb - 2, 7, 2, '#74748a'); front.rect(lx - 1, lb - 12, 3, 10, '#9a9aa8'); front.rect(lx - 1, lb - 12, 1, 10, '#c8c8d0');
    front.rect(lx - 3, lb - 14, 7, 2, '#9a9aa8'); front.rect(lx - 3, lb - 20, 7, 6, '#74748a'); front.rect(lx - 2, lb - 19, 5, 4, '#2a2a3a');
    front.rect(lx - 5, lb - 22, 11, 2, '#9a9aa8'); front.rect(lx - 4, lb - 23, 9, 1, '#c8c8d0'); front.rect(lx - 1, lb - 25, 3, 2, '#9a9aa8');
    for (let x = -4; x <= 6; x++) if (bayer(lx + x, lb) < 0.5) front.dot(lx + x, lb, '#b8a888');
    // maple at the top right, over the fence
    const tx = Math.round(W * 0.9);
    for (let y = 10; y < 44; y++) { const w = y > 36 ? 3 : 2; front.rect(tx - 1, y, w, 1, '#4a2a24'); front.dot(tx + w - 1, y, '#6a3a30'); }
    for (let i = 0; i < 28; i++) { const a = r() * 6.28, d = Math.sqrt(r()); const bx = tx + Math.cos(a) * 24 * d, by = 12 + Math.sin(a) * 13 * d, br = 4 + r() * 4; blob(front, bx, by, br, br * 0.8, (dx, dy, nx, ny, x, y) => { const l = -nx * 0.5 - ny * 0.8 + (noise(x * 0.6, y * 0.6) - 0.5) * 0.6; return l > 0.5 ? '#f77622' : l > 0 ? '#e43b44' : l > -0.5 ? '#b02a3a' : '#7a1e30'; }); }
    // wooden veranda edge
    for (let y = Y1; y < H; y++) for (let x = 0; x < W; x++) front.dot(x, y, y === Y1 ? '#3a2420' : y === Y1 + 1 ? '#c08048' : (y - Y1) % 4 === 0 ? '#6a4030' : (x + (((y - Y1) / 4) | 0) * 17) % 37 === 0 ? '#6a4030' : bayer(x, y) < 0.2 ? '#9a5e38' : '#8a5232');
    dirty = true; leaves = [];
  }

  function renderSand() {
    px32.fill(0);
    for (let y = Y0; y < Y1; y++) for (let x = 0; x < W; x++) { const k = y * W + x; px32[k] = island[k] ? MOSS : (shade[k] ? CS : C)[S[k]]; }
    sand.g.putImageData(img, 0, 0); dirty = false;
  }

  function rake(x0, y0, x1, y1) {
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy); if (len < 0.5) return;
    const nx = -dy / len, ny = dx / len, ux = dx / len, uy = dy / len;
    const minX = Math.max(0, Math.floor(Math.min(x0, x1) - 8)), maxX = Math.min(W - 1, Math.ceil(Math.max(x0, x1) + 8));
    const minY = Math.max(Y0, Math.floor(Math.min(y0, y1) - 8)), maxY = Math.min(Y1 - 1, Math.ceil(Math.max(y0, y1) + 8));
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      const k = y * W + x; if (island[k]) continue;
      const rx = x + 0.5 - x0, ry = y + 0.5 - y0, along = rx * ux + ry * uy, perp = rx * nx + ry * ny;
      if (along < -1 || along > len + 1 || Math.abs(perp) > 6.5) continue;
      S[k] = val(Math.round(perp + 7));
    }
    dirty = true;
  }

  return {
    onPointer(p) {
      if (p.y < Y0 || p.y >= Y1) { last = null; return; }
      if (last) rake(last.x, last.y, p.x, p.y);
      last = { x: p.x, y: p.y };
    },
    onLeave() { last = null; },
    draw(g, t, dt) {
      if (g.canvas.width !== W || !back) build(g);
      if (dirty) renderSand();
      g.drawImage(back.c, 0, 0); g.drawImage(sand.c, 0, 0); g.drawImage(front.c, 0, 0);
      // lantern flame flicker
      g.fillStyle = Math.sin(t * 9) + Math.sin(t * 13.7) > 0.3 ? '#fee761' : '#feae34';
      g.fillRect(lantern.x - 1, lantern.y + 1, 3, 2);
      // maple leaves drift down, rest on the sand for a while
      nextLeaf -= dt; if (nextLeaf < 0 && leaves.length < 14) { nextLeaf = 1.5 + Math.random() * 3; leaves.push({ x: W * (0.78 + Math.random() * 0.2), y: 20, land: Y0 + 6 + Math.random() * (Y1 - Y0 - 14), ph: Math.random() * 6, life: 18, c: Math.random() < 0.5 ? '#e43b44' : '#f77622' }); }
      for (let i = leaves.length - 1; i >= 0; i--) {
        const L = leaves[i];
        if (L.y < L.land) { L.y += 9 * dt; L.x += Math.sin(t * 1.6 + L.ph) * 0.35 - 0.15; } else { L.life -= dt; if (L.life < 0) { leaves.splice(i, 1); continue; } }
        const x = Math.round(L.x), y = Math.round(L.y), spin = L.y < L.land ? Math.sin(t * 4 + L.ph) > 0 : true;
        g.fillStyle = L.c; g.fillRect(x, y, 1, 1); g.fillRect(x - 1, y + (spin ? 0 : 1), 3, 1); g.fillRect(x, y + 1, 1, 1);
        if (L.y >= L.land) { g.fillStyle = '#7a1e30'; g.fillRect(x, y + 2, 1, 1); }
      }
    },
  };
}
