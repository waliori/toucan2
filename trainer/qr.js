// Minimal QR encoder: byte mode, error correction level L, versions 1-9 (up to 230 bytes), best mask by the
// standard penalty rules. qrMatrix(text) -> array of rows, each an array of 0/1 (1 = dark). No quiet zone.
// Enough for the sync link; not a general library (no alphanumeric mode, no higher versions).
const qrMatrix = (text) => {
  const bytes = [...new TextEncoder().encode(text)];
  // data codewords, ec codewords per block, blocks (level L, v1-9)
  const CAP = [[19, 7, 1], [34, 10, 1], [55, 15, 1], [80, 20, 1], [108, 26, 1], [136, 18, 2], [156, 20, 2], [194, 24, 2], [232, 30, 2]];
  const v = CAP.findIndex(([d]) => bytes.length + 2 <= d) + 1; if (!v) throw new Error("too long for a QR of this kind");
  const [dataLen, ecLen, nb] = CAP[v - 1], N = 17 + 4 * v;
  // bit stream: mode 0100, 8-bit count, bytes, terminator, pad bytes
  const bits = []; const put = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >> i) & 1); };
  put(4, 4); put(bytes.length, 8); bytes.forEach((b) => put(b, 8)); put(0, Math.min(4, dataLen * 8 - bits.length)); while (bits.length % 8) bits.push(0);
  const data = []; for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(""), 2)); for (let p = 0; data.length < dataLen; p ^= 1) data.push(p ? 0x11 : 0xec);
  // Reed-Solomon over GF(256), poly 0x11d
  const EXP = new Array(512), LOG = new Array(256); for (let i = 0, x = 1; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; } for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  const mul = (a, b) => a && b ? EXP[LOG[a] + LOG[b]] : 0;
  let gen = [1]; for (let i = 0; i < ecLen; i++) { const g = new Array(gen.length + 1).fill(0); gen.forEach((c, j) => { g[j] ^= c; g[j + 1] ^= mul(c, EXP[i]); }); gen = g; }
  const ec = (block) => { const r = [...block, ...new Array(ecLen).fill(0)]; for (let i = 0; i < block.length; i++) { const c = r[i]; if (c) gen.forEach((g, j) => { r[i + j] ^= mul(g, c); }); } return r.slice(block.length); };
  const bs = dataLen / nb, blocks = [...Array(nb)].map((_, i) => data.slice(i * bs, (i + 1) * bs)), ecs = blocks.map(ec);
  const cw = []; for (let i = 0; i < bs; i++) blocks.forEach((b) => cw.push(b[i])); for (let i = 0; i < ecLen; i++) ecs.forEach((b) => cw.push(b[i]));
  // matrix: function patterns first (and which modules they occupy), then data in the zigzag, then the mask
  const M = [...Array(N)].map(() => new Array(N).fill(0)), F = [...Array(N)].map(() => new Array(N).fill(0));
  const set = (x, y, d) => { M[y][x] = d; F[y][x] = 1; };
  const finder = (cx, cy) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const x = cx + dx, y = cy + dy; if (x < 0 || y < 0 || x >= N || y >= N) continue; const m = Math.max(Math.abs(dx), Math.abs(dy)); set(x, y, m <= 1 || m === 3 ? 1 : 0); } };
  finder(3, 3); finder(N - 4, 3); finder(3, N - 4);
  for (let i = 8; i < N - 8; i++) { set(i, 6, i % 2 ^ 1); set(6, i, i % 2 ^ 1); }
  // alignment patterns: every pair of centres except the three over a finder (over the timing lines is fine)
  const AL = [[], [], [18], [22], [26], [30], [34], [6, 22, 38], [6, 24, 42], [6, 26, 46]][v];
  AL.forEach((cy) => AL.forEach((cx) => { if ((cx < 9 && cy < 9) || (cx > N - 10 && cy < 9) || (cx < 9 && cy > N - 10)) return; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1 ? 1 : 0); }));
  set(8, N - 8, 1);
  for (let i = 0; i < 8; i++) { F[8][i < 6 ? i : i + 1] = 1; F[i < 6 ? i : i + 1][8] = 1; F[8][N - 1 - i] = 1; F[N - 1 - i][8] = 1; } F[8][8] = 1;   // format areas reserved
  if (v >= 7) { let vi = v << 12, g = 0x1f25; for (let i = 5; i >= 0; i--) if (vi & (1 << (i + 12))) vi ^= g << i; vi |= v << 12; for (let i = 0; i < 18; i++) { const b = (vi >> i) & 1, a = Math.floor(i / 3), c = N - 11 + (i % 3); set(a, c, b); set(c, a, b); } }
  let k = 0; for (let right = N - 1; right >= 1; right -= 2) { if (right === 6) right--; for (let s = 0; s < N; s++) { const y = ((right + 1) & 2) === 0 ? N - 1 - s : s; for (const x of [right, right - 1]) if (!F[y][x]) { M[y][x] = k < cw.length * 8 ? (cw[k >> 3] >> (7 - (k & 7))) & 1 : 0; k++; } } }
  const MASK = [(x, y) => (x + y) % 2, (x, y) => y % 2, (x) => x % 3, (x, y) => (x + y) % 3, (x, y) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2, (x, y) => (x * y) % 2 + (x * y) % 3, (x, y) => ((x * y) % 2 + (x * y) % 3) % 2, (x, y) => ((x + y) % 2 + (x * y) % 3) % 2];
  const format = (mask) => { let f = (1 << 3 | mask) << 10, g = 0x537; for (let i = 4; i >= 0; i--) if (f & (1 << (i + 10))) f ^= g << i; f |= (1 << 3 | mask) << 10; f ^= 0x5412;
    for (let i = 0; i < 15; i++) { const b = (f >> i) & 1; if (i < 6) M[i][8] = b; else if (i < 8) M[i + 1][8] = b; else M[N - 15 + i][8] = b; if (i < 8) M[8][N - 1 - i] = b; else if (i < 9) M[8][7] = b; else M[8][14 - i] = b; } };
  const penalty = () => { let p = 0;
    for (let a = 0; a < N; a++) { let rr = 1, rc = 1; for (let b = 1; b < N; b++) { if (M[a][b] === M[a][b - 1]) { if (++rr === 5) p += 3; else if (rr > 5) p++; } else rr = 1; if (M[b][a] === M[b - 1][a]) { if (++rc === 5) p += 3; else if (rc > 5) p++; } else rc = 1; } }
    for (let y = 0; y < N - 1; y++) for (let x = 0; x < N - 1; x++) if (M[y][x] === M[y][x + 1] && M[y][x] === M[y + 1][x] && M[y][x] === M[y + 1][x + 1]) p += 3;
    const pat = [1, 0, 1, 1, 1, 0, 1], lit = (x, y, i) => x + i < N && y < N ? M[y][x + i] : 0, litc = (x, y, i) => y + i < N ? M[y + i][x] : 0;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const h = pat.every((b, i) => lit(x, y, i) === b), vv = pat.every((b, i) => litc(x, y, i) === b);
      if (h && ((x >= 4 && [1, 2, 3, 4].every((i) => !M[y][x - i])) || (x + 11 <= N && [7, 8, 9, 10].every((i) => !M[y][x + i])))) p += 40;
      if (vv && ((y >= 4 && [1, 2, 3, 4].every((i) => !M[y - i][x])) || (y + 11 <= N && [7, 8, 9, 10].every((i) => !M[y + i][x])))) p += 40; }
    const dark = M.flat().reduce((a, b) => a + b, 0), pct = 100 * dark / (N * N); return p + 10 * Math.floor(Math.abs(pct - 50) / 5); };
  const apply = (m) => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!F[y][x] && MASK[m](x, y) === 0) M[y][x] ^= 1; format(m); };
  let best = 0, bestP = Infinity; for (let m = 0; m < 8; m++) { apply(m); const p = penalty(); if (p < bestP) { bestP = p; best = m; } apply(m); }
  apply(best);
  return M;
};
if (typeof module !== "undefined") module.exports = qrMatrix;
