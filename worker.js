// SJscanner image processing worker: edge detection, perspective
// correction and document filters. Pixels are RGBA (ImageData layout).
'use strict';

function insetQuad(w, h) {
  const a = w * 0.06, b = h * 0.06;
  return [a, b, w - a, b, w - a, h - b, a, h - b];
}

function quadValid(q, w, h) {
  let sgn = 0;
  for (let i = 0; i < 4; i++) {
    const ax = q[i * 2], ay = q[i * 2 + 1];
    const bx = q[((i + 1) % 4) * 2], by = q[((i + 1) % 4) * 2 + 1];
    const cx = q[((i + 2) % 4) * 2], cy = q[((i + 2) % 4) * 2 + 1];
    const cr = (bx - ax) * (cy - by) - (by - ay) * (cx - bx);
    if (Math.abs(cr) < 1e-6) return false;
    const s = cr > 0 ? 1 : -1;
    if (sgn === 0) sgn = s; else if (s !== sgn) return false;
  }
  let ar = 0;
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    ar += q[i * 2] * q[j * 2 + 1] - q[j * 2] * q[i * 2 + 1];
  }
  return Math.abs(ar) / 2 > w * h * 0.01;
}

// Downscale RGBA to grayscale (box average) with max side `max`.
function smallGray(d, W, H, max) {
  const k = Math.min(1, max / Math.max(W, H));
  const w = Math.max(8, Math.round(W * k)), h = Math.max(8, Math.round(H * k));
  const g = new Float64Array(w * h);
  const sx = W / w, sy = H / h;
  for (let y = 0; y < h; y++) {
    const y0 = Math.floor(y * sy), y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy));
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor(x * sx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx));
      let s = 0, c = 0;
      const stepY = Math.max(1, (y1 - y0) >> 2), stepX = Math.max(1, (x1 - x0) >> 2);
      for (let yy = y0; yy < y1 && yy < H; yy += stepY) {
        for (let xx = x0; xx < x1 && xx < W; xx += stepX) {
          const i = (yy * W + xx) * 4;
          s += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          c++;
        }
      }
      g[y * w + x] = s / Math.max(1, c);
    }
  }
  return { g, w, h, k: w / W };
}

// Finds the paper: Otsu threshold, flood fill of the bright region nearest
// the centre, then the extreme points of that region as its four corners.
function detectQuad(d, bigW, bigH) {
  let { g, w, h, k } = smallGray(d, bigW, bigH, 320);
  const n = w * h;
  for (let pass = 0; pass < 2; pass++) {
    const o = new Float64Array(n);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let s = 0, c = 0;
        for (let dy = -2; dy <= 2; dy++) {
          const yy = y + dy;
          if (yy < 0 || yy >= h) continue;
          for (let dx = -2; dx <= 2; dx++) {
            const xx = x + dx;
            if (xx < 0 || xx >= w) continue;
            s += g[yy * w + xx]; c++;
          }
        }
        o[y * w + x] = s / c;
      }
    }
    g = o;
  }
  const hist = new Array(256).fill(0);
  for (let i = 0; i < n; i++) hist[Math.min(255, g[i] | 0)]++;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sB = 0, best = 0, wB = 0, th = 128;
  for (let i = 0; i < 256; i++) {
    wB += hist[i];
    if (wB === 0) continue;
    const wF = n - wB;
    if (wF === 0) break;
    sB += i * hist[i];
    const mB = sB / wB, mF = (sum - sB) / wF;
    const v = wB * wF * (mB - mF) * (mB - mF);
    if (v > best) { best = v; th = i; }
  }
  const m = new Uint8Array(n);
  for (let i = 0; i < n; i++) m[i] = g[i] > th ? 1 : 0;
  const erodeN = 3;
  for (let it = 0; it < erodeN; it++) {
    const e = new Uint8Array(n);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        if (m[i] && m[i - 1] && m[i + 1] && m[i - w] && m[i + w] &&
            m[i - w - 1] && m[i - w + 1] && m[i + w - 1] && m[i + w + 1]) e[i] = 1;
      }
    }
    m.set(e);
  }
  let seed = -1, bd = Infinity;
  const cx = w / 2, cy = h / 2;
  for (let i = 0; i < n; i++) {
    if (m[i] !== 1) continue;
    const dx = (i % w) - cx, dy = ((i / w) | 0) - cy;
    const dd = dx * dx + dy * dy;
    if (dd < bd) { bd = dd; seed = i; }
  }
  if (seed < 0) return { quad: insetQuad(bigW, bigH), found: false };
  const stack = [seed];
  m[seed] = 2;
  let area = 0;
  let s1 = 1 << 30, s2 = -(1 << 30), d1 = 1 << 30, d2 = -(1 << 30);
  let tlx = 0, tly = 0, brx = 0, bry = 0, trx = 0, tryy = 0, blx = 0, bly = 0;
  while (stack.length) {
    const p = stack.pop();
    area++;
    const x = p % w, y = (p / w) | 0;
    const a = x + y, b = x - y;
    if (a < s1) { s1 = a; tlx = x; tly = y; }
    if (a > s2) { s2 = a; brx = x; bry = y; }
    if (b > d2) { d2 = b; trx = x; tryy = y; }
    if (b < d1) { d1 = b; blx = x; bly = y; }
    if (x > 0 && m[p - 1] === 1) { m[p - 1] = 2; stack.push(p - 1); }
    if (x < w - 1 && m[p + 1] === 1) { m[p + 1] = 2; stack.push(p + 1); }
    if (y > 0 && m[p - w] === 1) { m[p - w] = 2; stack.push(p - w); }
    if (y < h - 1 && m[p + w] === 1) { m[p + w] = 2; stack.push(p + w); }
  }
  const pts = [[tlx, tly], [trx, tryy], [brx, bry], [blx, bly]];
  const mcx = pts.reduce((s, p) => s + p[0], 0) / 4, mcy = pts.reduce((s, p) => s + p[1], 0) / 4;
  const q = [];
  for (const p of pts) {
    let dx = p[0] - mcx, dy = p[1] - mcy;
    const l = Math.hypot(dx, dy);
    if (l > 0) { dx /= l; dy /= l; }
    const px = p[0] + 0.5 + dx * erodeN * 1.0, py = p[1] + 0.5 + dy * erodeN * 1.0;
    q.push(Math.min(bigW, Math.max(0, px / k)));
    q.push(Math.min(bigH, Math.max(0, py / k)));
  }
  const fr = area / n;
  if (fr < 0.08 || fr > 0.97 || !quadValid(q, bigW, bigH)) return { quad: insetQuad(bigW, bigH), found: false };
  return { quad: q, found: true };
}

function solve(a, b) {
  const n = b.length;
  const m = a.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r;
    [m[c], m[p]] = [m[p], m[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = m[r][c] / m[c][c];
      for (let k = c; k <= n; k++) m[r][k] -= f * m[c][k];
    }
  }
  return m.map((r, i) => r[n] / r[i]);
}

// Perspective-corrects the quad [tl, tr, br, bl] into a flat rectangle.
function warp(sd, sw, sh, q, maxOut) {
  const len = (a, b) => Math.hypot(q[a * 2] - q[b * 2], q[a * 2 + 1] - q[b * 2 + 1]);
  const wd = Math.max(len(0, 1), len(3, 2)), ht = Math.max(len(0, 3), len(1, 2));
  const k = Math.min(1, maxOut / Math.max(wd, ht));
  const ow = Math.max(16, Math.round(wd * k)), oh = Math.max(16, Math.round(ht * k));
  const dst = [0, 0, ow, 0, ow, oh, 0, oh];
  const A = [], B = [];
  for (let i = 0; i < 4; i++) {
    const u = dst[i * 2], v = dst[i * 2 + 1], x = q[i * 2], y = q[i * 2 + 1];
    A.push([u, v, 1, 0, 0, 0, -u * x, -v * x]); B.push(x);
    A.push([0, 0, 0, u, v, 1, -u * y, -v * y]); B.push(y);
  }
  const hm = solve(A, B);
  const out = new Uint8ClampedArray(ow * oh * 4);
  const mx = sw - 1.001, my = sh - 1.001;
  for (let v = 0; v < oh; v++) {
    for (let u = 0; u < ow; u++) {
      const z = hm[6] * u + hm[7] * v + 1;
      let x = (hm[0] * u + hm[1] * v + hm[2]) / z;
      let y = (hm[3] * u + hm[4] * v + hm[5]) / z;
      if (x < 0) x = 0; else if (x > mx) x = mx;
      if (y < 0) y = 0; else if (y > my) y = my;
      const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0;
      const i00 = (y0 * sw + x0) * 4, i10 = i00 + 4, i01 = i00 + sw * 4, i11 = i01 + 4;
      const o = (v * ow + u) * 4;
      for (let ch = 0; ch < 3; ch++) {
        const t = sd[i00 + ch] + (sd[i10 + ch] - sd[i00 + ch]) * fx;
        const bt = sd[i01 + ch] + (sd[i11 + ch] - sd[i01 + ch]) * fx;
        out[o + ch] = t + (bt - t) * fy;
      }
      out[o + 3] = 255;
    }
  }
  return { data: out, w: ow, h: oh };
}

// Filters: 'orig', 'enh' (white paper, deeper ink, colours kept), 'gray', 'bw'.
function applyFilter(d, w, h, f) {
  if (f === 'orig') return;
  const cs = Math.max(6, Math.round(Math.max(w, h) / 40));
  const gw = Math.ceil(w / cs), gh = Math.ceil(h / cs);
  const cell = new Float64Array(gw * gh * 3), lum = new Float64Array(gw * gh);
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      const x0 = gx * cs, y0 = gy * cs, x1 = Math.min(w, x0 + cs), y1 = Math.min(h, y0 + cs);
      let s = 0, n = 0;
      for (let yy = y0; yy < y1; yy += 2) for (let xx = x0; xx < x1; xx += 2) {
        const i = (yy * w + xx) * 4; s += d[i] + d[i + 1] + d[i + 2]; n++;
      }
      const mean = s / Math.max(1, n);
      let rr = 0, gg = 0, bb = 0, k = 0;
      for (let yy = y0; yy < y1; yy += 2) for (let xx = x0; xx < x1; xx += 2) {
        const i = (yy * w + xx) * 4;
        if (d[i] + d[i + 1] + d[i + 2] >= mean) { rr += d[i]; gg += d[i + 1]; bb += d[i + 2]; k++; }
      }
      k = Math.max(1, k);
      const j = gy * gw + gx;
      cell[j * 3] = rr / k; cell[j * 3 + 1] = gg / k; cell[j * 3 + 2] = bb / k;
      lum[j] = (rr + gg + bb) / k;
    }
  }
  const bg = new Float64Array(gw * gh * 3);
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      let bj = gy * gw + gx;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const yy = gy + dy, xx = gx + dx;
        if (yy < 0 || xx < 0 || yy >= gh || xx >= gw) continue;
        const j = yy * gw + xx;
        if (lum[j] > lum[bj]) bj = j;
      }
      const o = (gy * gw + gx) * 3;
      bg[o] = Math.max(1, cell[bj * 3]); bg[o + 1] = Math.max(1, cell[bj * 3 + 1]); bg[o + 2] = Math.max(1, cell[bj * 3 + 2]);
    }
  }
  const curve = new Uint8Array(256);
  for (let i = 0; i < 256; i++) curve[i] = Math.round(255 * Math.pow(i / 255, 1.55));
  const norm = (a, b, c, e, i, ch, tx, ty) => {
    const top = bg[a + ch] + (bg[b + ch] - bg[a + ch]) * tx;
    const bot = bg[c + ch] + (bg[e + ch] - bg[c + ch]) * tx;
    const nv = d[i + ch] / (top + (bot - top) * ty) * 268;
    return nv > 255 ? 255 : nv;
  };
  for (let y = 0; y < h; y++) {
    let fy = y / cs - 0.5;
    if (fy < 0) fy = 0; if (fy > gh - 1) fy = gh - 1;
    const y0 = Math.floor(fy), y1 = Math.min(gh - 1, y0 + 1), ty = fy - y0;
    for (let x = 0; x < w; x++) {
      let fx = x / cs - 0.5;
      if (fx < 0) fx = 0; if (fx > gw - 1) fx = gw - 1;
      const x0 = Math.floor(fx), x1 = Math.min(gw - 1, x0 + 1), tx = fx - x0;
      const a = (y0 * gw + x0) * 3, b = (y0 * gw + x1) * 3, c = (y1 * gw + x0) * 3, e = (y1 * gw + x1) * 3;
      const i = (y * w + x) * 4;
      const v0 = norm(a, b, c, e, i, 0, tx, ty), v1 = norm(a, b, c, e, i, 1, tx, ty), v2 = norm(a, b, c, e, i, 2, tx, ty);
      if (f === 'enh') {
        d[i] = curve[v0 | 0]; d[i + 1] = curve[v1 | 0]; d[i + 2] = curve[v2 | 0];
      } else {
        const l = 0.299 * v0 + 0.587 * v1 + 0.114 * v2;
        let o;
        if (f === 'gray') o = curve[Math.min(255, Math.max(0, l | 0))];
        else o = l < 160 ? 0 : l > 205 ? 255 : Math.round((l - 160) / 45 * 255);
        d[i] = o; d[i + 1] = o; d[i + 2] = o;
      }
    }
  }
}

self.onmessage = (ev) => {
  const { id, op, data, w, h, quad, filter, maxOut } = ev.data;
  try {
    const px = new Uint8ClampedArray(data);
    if (op === 'detect') {
      self.postMessage({ id, result: detectQuad(px, w, h) });
    } else if (op === 'render') {
      const r = warp(px, w, h, quad, maxOut || 2000);
      applyFilter(r.data, r.w, r.h, filter);
      self.postMessage({ id, result: { data: r.data.buffer, w: r.w, h: r.h } }, [r.data.buffer]);
    }
  } catch (e) {
    self.postMessage({ id, error: String(e && e.message || e) });
  }
};
