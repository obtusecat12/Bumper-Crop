import * as T from './vendor/three.module.min.js';

// Kephart Farm, reconstructed from the two supplied field photographs.
// Metres; barn ridge runs along Z, the tall door gable faces +Z. Each of the
// four buildings is a separate movable group. Materials/maps are shared;
// geometries made by this factory belong to the returned instance.
const shared = new Set();
const BOX = new T.BoxGeometry(1, 1, 1).toNonIndexed();
const CYL = new T.CylinderGeometry(1, 1, 1, 8, 1).toNonIndexed();
const PLANE = new T.PlaneGeometry(1, 1).toNonIndexed();
shared.add(BOX); shared.add(CYL); shared.add(PLANE);
const temp = new T.Object3D(), point = new T.Vector3(), normal = new T.Vector3();
const normalMatrix = new T.Matrix3(), up = new T.Vector3(0, 1, 0);
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let x = Math.imul(seed ^ seed >>> 15, 1 | seed); x ^= x + Math.imul(x ^ x >>> 7, 61 | x); return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }

function surfaceMap(kind) {
  const n = 128, pixels = new Uint8Array(n * n * 4), r = rng(71071 + kind.length * 491);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const u = x / n, v = y / n, a = u * Math.PI * 2, b = v * Math.PI * 2;
    const broad = .5 + .18 * Math.sin(a + b * 2) + .15 * Math.cos(b - a * 3) + .12 * Math.sin(b * 3);
    let shade = .89 + r() * .09;
    if (kind === 'wood') {
      const grain = Math.sin(a * 25 + Math.sin(b * 2) * .65 + Math.sin(a * 3) * .3);
      shade *= .91 + .07 * grain * grain + .02 * broad;
      if (grain < -.985 && Math.sin(b * 5 + a) > .2) shade *= .72;
    } else if (kind === 'tin') {
      shade = .90 + .065 * broad + .025 * r() + .014 * Math.sin(a * 20);
    } else if (kind === 'shingle') {
      const row = Math.floor(y / 16), joint = (x + (row % 2) * 16) % 32;
      shade = .76 + r() * .16 + broad * .08;
      if (y % 16 < 2 || joint < 1) shade *= .61;
    } else if (kind === 'stone') {
      shade = .74 + .18 * broad + .07 * r();
    }
    const k = (y * n + x) * 4;
    pixels[k] = shade * 255; pixels[k + 1] = shade * (kind === 'wood' ? 251 : 254); pixels[k + 2] = shade * (kind === 'wood' ? 243 : 252); pixels[k + 3] = 255;
  }
  const tex = new T.DataTexture(pixels, n, n);
  tex.wrapS = tex.wrapT = T.RepeatWrapping; tex.colorSpace = T.SRGBColorSpace;
  tex.magFilter = T.LinearFilter; tex.minFilter = T.LinearMipmapLinearFilter;
  tex.generateMipmaps = true; tex.anisotropy = 4; tex.needsUpdate = true; shared.add(tex); return tex;
}
const wood = surfaceMap('wood'), tin = surfaceMap('tin'), shingle = surfaceMap('shingle'), stone = surfaceMap('stone');
export const kephartSurfaceTextures=[wood,tin,shingle,stone];
function material(color, map = null, more = {}) {
  const m = new T.MeshStandardMaterial({ color, map, roughness: .91, vertexColors: true, ...more });
  shared.add(m); return m;
}
const M = {
  red: material('#942b24', wood), redDark: material('#792720', wood),
  redLight: material('#a3382b', wood), trim: material('#e8e4d5', wood),
  shadow: material('#222820'), glass: material('#3d5354', null, { roughness: .29, metalness: .08 }),
  paneReflection: material('#758889', null, { roughness: .43 }),
  roof: material('#a1aaaa', tin, { roughness: .62, metalness: .22 }),
  roofEdge: material('#bdc3bc', tin, { roughness: .62, metalness: .17 }),
  darkRoof: material('#343e40', shingle), metal: material('#4f5550', tin, { roughness: .7, metalness: .24 }),
  foundation: material('#99988b', stone), timber: material('#695647', wood),
  interior: material('#57473a', wood)
};

function makeSignMap() {
  let canvas;
  if (typeof document !== 'undefined') { canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 768; }
  else if (typeof OffscreenCanvas !== 'undefined') canvas = new OffscreenCanvas(1024, 768);
  if (!canvas) return null;
  const ctx = canvas.getContext('2d'); if (!ctx) return null;
  const W = canvas.width, H = canvas.height, r = rng(7712026);
  ctx.fillStyle = '#963228'; ctx.fillRect(0, 0, W, H);
  // Subtle vertical siding is continuous behind the painted sign, as in photo 1.
  for (let x = 0; x < W; x += 43) { ctx.fillStyle = `rgba(36,20,16,${.055 + r() * .055})`; ctx.fillRect(x, 0, 2, H); }
  for (let i = 0; i < 4100; i++) { ctx.fillStyle = `rgba(222,196,160,${r() * .045})`; ctx.fillRect(r() * W, r() * H, 1 + r() * 3, 2 + r() * 12); }
  ctx.strokeStyle = '#f3eedc'; ctx.lineWidth = 35; ctx.lineJoin = 'miter';
  ctx.strokeRect(32, 31, W - 64, H - 62);
  // The original has inset chamfered corners rather than a generic rectangle.
  ctx.lineWidth = 15; ctx.beginPath();
  ctx.moveTo(153, 70); ctx.lineTo(W - 153, 70); ctx.lineTo(W - 153, 96); ctx.lineTo(W - 92, 145);
  ctx.lineTo(W - 72, 145); ctx.lineTo(W - 72, H - 151); ctx.lineTo(W - 98, H - 151);
  ctx.lineTo(W - 153, H - 96); ctx.lineTo(W - 153, H - 70); ctx.lineTo(153, H - 70);
  ctx.lineTo(153, H - 96); ctx.lineTo(98, H - 151); ctx.lineTo(72, H - 151);
  ctx.lineTo(72, 145); ctx.lineTo(92, 145); ctx.lineTo(153, 96); ctx.closePath(); ctx.stroke();
  ctx.fillStyle = '#f6f0de'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  function spaced(text, yy, target, size) {
    ctx.font = `bold ${size}px Georgia, 'Times New Roman', serif`;
    const widths = [...text].map(c => ctx.measureText(c).width), sum = widths.reduce((a, b) => a + b, 0);
    const spacing = Math.max(0, (target - sum) / Math.max(1, text.length - 1));
    let x = (W - sum - spacing * (text.length - 1)) / 2;
    [...text].forEach((c, i) => { ctx.fillText(c, x + widths[i] / 2, yy); x += widths[i] + spacing; });
  }
  spaced('KEPHART', 290, 808, 151); spaced('FARM', 497, 595, 167);
  const tex = new T.CanvasTexture(canvas); tex.colorSpace = T.SRGBColorSpace;
  tex.anisotropy = 8; tex.minFilter = T.LinearMipmapLinearFilter; tex.magFilter = T.LinearFilter;
  shared.add(tex); return tex;
}
let signMaterial;
function getSignMaterial() {
  if (!signMaterial) signMaterial = material('#ffffff', makeSignMap(), { roughness: .94, vertexColors: false });
  return signMaterial;
}
export function isSharedKephartResource(resource) { return shared.has(resource); }

// One merged mesh per material per movable building, including all narrow
// boards, roof ribs, trim and window mullions. No per-frame work or shaders.
class Batch {
  constructor(seed) { this.parts = new Map(); this.r = rng(seed); }
  matrix(geo, mat, matrix, shade = 1, nativeUV = false) {
    if (!this.parts.has(mat)) this.parts.set(mat, { p: [], n: [], u: [], c: [] });
    const out = this.parts.get(mat), p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
    normalMatrix.getNormalMatrix(matrix);
    for (let i = 0; i < p.count; i++) {
      point.fromBufferAttribute(p, i).applyMatrix4(matrix); normal.fromBufferAttribute(n, i).applyNormalMatrix(normalMatrix);
      out.p.push(point.x, point.y, point.z); out.n.push(normal.x, normal.y, normal.z);
      if (nativeUV && uv) out.u.push(uv.getX(i), uv.getY(i));
      else {
        const ax = Math.abs(normal.x), ay = Math.abs(normal.y), az = Math.abs(normal.z);
        if (ay > ax && ay > az) out.u.push(point.x * .65, point.z * .65);
        else if (ax > az) out.u.push(point.z * .7, point.y * .4);
        else out.u.push(point.x * .7, point.y * .4);
      }
      const foot = mat.map === wood ? 1 - .09 * Math.max(0, 1 - point.y / .9) : 1;
      out.c.push(shade * foot, shade * foot, shade * foot);
    }
  }
  add(geo, mat, x, y, z, w = 1, h = 1, d = 1, rx = 0, ry = 0, rz = 0, shade = 1, nativeUV = false) {
    temp.position.set(x, y, z); temp.rotation.set(rx, ry, rz); temp.scale.set(w, h, d); temp.updateMatrix(); this.matrix(geo, mat, temp.matrix, shade, nativeUV);
  }
  box(mat, x, y, z, w, h, d, rx = 0, ry = 0, rz = 0, shade = 1) { if (w > 0 && h > 0 && d > 0) this.add(BOX, mat, x, y, z, w, h, d, rx, ry, rz, shade); }
  beam(mat, start, end, w = .09, d = w, shade = 1) {
    const a = new T.Vector3(...start), b = new T.Vector3(...end), delta = b.clone().sub(a);
    temp.position.copy(a).add(b).multiplyScalar(.5); temp.quaternion.setFromUnitVectors(up, delta.clone().normalize()); temp.scale.set(w, delta.length(), d); temp.updateMatrix(); this.matrix(BOX, mat, temp.matrix, shade);
  }
  polygon(mat, vertices, shade = 1, reverse = false) {
    const p = [], v = reverse ? [...vertices].reverse() : vertices;
    for (let i = 1; i < v.length - 1; i++) p.push(...v[0], ...v[i], ...v[i + 1]);
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(p, 3)); g.computeVertexNormals();
    this.add(g, mat, 0, 0, 0, 1, 1, 1, 0, 0, 0, shade); g.dispose();
  }
  finish(group) {
    for (const [mat, data] of this.parts) {
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(data.p, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(data.n, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(data.u, 2)); g.setAttribute('color', new T.Float32BufferAttribute(data.c, 3));
      g.computeBoundingBox(); g.computeBoundingSphere();
      const mesh = new T.Mesh(g, mat); mesh.castShadow = mesh.receiveShadow = true; mesh.name = `${group.name}-${Object.keys(M).find(k => M[k] === mat) || 'sign'}`; group.add(mesh);
    }
  }
}

function facade(b, axis, fixed, outward) {
  const sign = outward ?? (Math.sign(fixed) || 1);
  return {
    box(mat, at, y, w, h, depth = .1, offset = 0, shade = 1) {
      if (axis === 'z') b.box(mat, at, y, fixed + sign * offset, w, h, depth, 0, 0, 0, shade);
      else b.box(mat, fixed + sign * offset, y, at, depth, h, w, 0, 0, 0, shade);
    },
    pt(at, y, offset = 0) { return axis === 'z' ? [at, y, fixed + sign * offset] : [fixed + sign * offset, y, at]; },
    beam(mat, a, c, width, depth = width, offset = 0) { b.beam(mat, this.pt(a[0], a[1], offset), this.pt(c[0], c[1], offset), width, depth); }
  };
}

function wall(b, axis, fixed, lo, hi, h, { horizontal = false, openings = [], mat = M.red, bottom = .18 } = {}) {
  const f = facade(b, axis, fixed), cuts = [lo, hi, ...openings.flatMap(o => [o.at - o.w / 2, o.at + o.w / 2])].filter(a => a >= lo && a <= hi).sort((a, c) => a - c);
  const heights = [bottom, h, ...openings.flatMap(o => [o.bottom, o.bottom + o.h])].filter(y => y >= bottom && y <= h).sort((a, c) => a - c);
  for (let i = 1; i < cuts.length; i++) for (let j = 1; j < heights.length; j++) {
    const left = cuts[i - 1], right = cuts[i], low = heights[j - 1], high = heights[j], mid = (left + right) / 2, yy = (low + high) / 2;
    if (right - left < .001 || high - low < .001 || openings.some(o => Math.abs(mid - o.at) < o.w / 2 - .001 && yy > o.bottom && yy < o.bottom + o.h)) continue;
    f.box(mat, mid, yy, right - left, high - low, .13, -.025, .92);
    if (horizontal) {
      const n = Math.ceil((high - low) / .23), step = (high - low) / n;
      for (let k = 0; k < n; k++) f.box(mat, mid, low + (k + .5) * step, right - left, step - .012, .095, .042, .94 + b.r() * .11);
    } else {
      const n = Math.ceil((right - left) / .235), step = (right - left) / n;
      for (let k = 0; k < n; k++) {
        const at = left + (k + .5) * step;
        f.box(mat, at, yy, step - .012, high - low, .10, .035, .94 + b.r() * .12);
        if (k % 3 === 0) f.box(mat, at - step / 2 + .018, yy, .033, high - low, .036, .10, .87);
      }
    }
  }
}

function window(b, axis, fixed, at, bottom, w, h, { columns = 2, rows = 3, trim = M.trim, screen = false } = {}) {
  const f = facade(b, axis, fixed), yy = bottom + h / 2, fw = .105;
  f.box(M.shadow, at, yy, w + .10, h + .10, .055, -.014);
  const innerW = w - .08, innerH = h - .08;
  f.box(M.glass, at, yy, innerW, innerH, .028, .026, .92);
  // Individual slightly differing panes retain the sash rhythm from a distance.
  for (let ix = 0; ix < columns; ix++) for (let iy = 0; iy < rows; iy++) {
    const cw = innerW / columns, ch = innerH / rows;
    f.box((ix + iy) % 4 === 0 ? M.paneReflection : M.glass, at - innerW / 2 + (ix + .5) * cw, bottom + .04 + (iy + .5) * ch, cw - .025, ch - .025, .015, .05, .76 + (ix + iy) % 3 * .075);
  }
  for (const x of [at - w / 2, at + w / 2]) f.box(trim, x, yy, fw, h + fw, .15, .084);
  for (const y of [bottom, bottom + h]) f.box(trim, at, y, w + fw * 2, fw, .15, .084);
  for (let x = 1; x < columns; x++) f.box(trim, at - w / 2 + w * x / columns, yy, .036, h, .053, .13);
  for (let y = 1; y < rows; y++) f.box(trim, at, bottom + h * y / rows, w, y === Math.ceil(rows / 2) ? .056 : .035, .055, .13);
  f.box(trim, at, bottom - .085, w + .24, .10, .25, .10, .88);
  f.box(trim, at, bottom + h + .077, w + .26, .06, .22, .105);
  if (screen) for (let y = bottom + .11; y < bottom + h; y += .105) f.box(M.metal, at, y, w - .09, .008, .013, .075, .8);
}

function vent(b, axis, fixed, at, y, w = .58, h = .68) {
  const f = facade(b, axis, fixed);
  f.box(M.shadow, at, y, w, h, .04, .025);
  for (const x of [at - w / 2, at + w / 2]) f.box(M.trim, x, y, .065, h + .09, .075, .064);
  for (const yy of [y - h / 2, y + h / 2]) f.box(M.trim, at, yy, w + .11, .07, .08, .066);
  const count = Math.floor(h / .085); for (let i = 0; i < count; i++) f.box(M.trim, at, y - h / 2 + (i + .5) * h / count, w - .06, .043, .085, .072, .9);
}

function foundation(b, w, d, height = .34) {
  // Foot extends below terrain. There is deliberately no surrounding slab or
  // raised ground plane: the parent can dress this footprint with native dirt.
  b.box(M.foundation, 0, height / 2 - .18, 0, w + .07, height + .36, d + .07, 0, 0, 0, .88);
  for (const z of [-d / 2 - .043, d / 2 + .043]) for (let x = -w / 2 + .5; x < w / 2; x += 1.11) b.box(M.foundation, x, .20, z, .96, .17, .022, 0, 0, 0, .88 + b.r() * .16);
  for (const x of [-w / 2 - .043, w / 2 + .043]) for (let z = -d / 2 + .5; z < d / 2; z += 1.11) b.box(M.foundation, x, .20, z, .022, .17, .96, 0, 0, 0, .89 + b.r() * .16);
}

function corners(b, w, d, h, mat = M.trim, size = .14) {
  for (const x of [-w / 2, w / 2]) for (const z of [-d / 2, d / 2]) {
    b.box(mat, x, (h + .22) / 2, z, size, h - .22, size, 0, 0, 0, .96);
  }
  for (const x of [-w / 2, w / 2]) b.box(mat, x, h - .035, 0, .16, .16, d + .13);
}

function gableFill(b, profile, depth, mat = M.red, trim = M.trim, siding = 'vertical') {
  const base = profile[0][1], width = profile[profile.length - 1][0] - profile[0][0];
  function top(x) { for (let i = 1; i < profile.length; i++) if (x <= profile[i][0]) { const a = profile[i - 1], c = profile[i], t = (x - a[0]) / (c[0] - a[0]); return a[1] + (c[1] - a[1]) * t; } return base; }
  for (const side of [-1, 1]) {
    const z = side * depth / 2;
    // Polygon winding: front +Z anticlockwise, rear -Z clockwise.
    b.polygon(mat, profile.map(p => [p[0], p[1], z]), .98, side > 0);
    if (siding === 'vertical') {
      const n = Math.ceil(width / .235), step = width / n;
      for (let i = 0; i < n; i++) {
        const left = profile[0][0] + i * step + .009, right = left + step - .018;
        b.polygon(mat, [[left, base, z + side * .045], [right, base, z + side * .045], [right, top(right), z + side * .045], [left, top(left), z + side * .045]], .92 + b.r() * .14, side < 0);
      }
    } else for (let y = base + .22; y < Math.max(...profile.map(p => p[1])) - .1; y += .23) {
      const rise = profile[1][1] - base, half = width / 2 * (1 - (y - base) / rise);
      if (half > .05) b.box(mat, 0, y, z + side * .04, half * 2, .21, .06, 0, 0, 0, .94 + b.r() * .10);
    }
    for (let i = 1; i < profile.length; i++) b.beam(trim, [profile[i - 1][0], profile[i - 1][1] + .025, z + side * .12], [profile[i][0], profile[i][1] + .025, z + side * .12], .15, .16);
  }
}

function roof(b, profile, depth, mat = M.roof, { seams = true, eave = .38, end = .36 } = {}) {
  const points = profile.map(p => [...p]);
  const a = points[0], q = points[1], last = points[points.length - 1], before = points[points.length - 2];
  a[0] -= eave; a[1] -= eave * (q[1] - a[1]) / (q[0] - a[0] - eave);
  last[0] += eave; last[1] += eave * (last[1] - before[1]) / (last[0] - before[0] - eave);
  const length = depth + 2 * end;
  for (let i = 1; i < points.length; i++) {
    const p = points[i - 1], c = points[i], dx = c[0] - p[0], dy = c[1] - p[1], span = Math.hypot(dx, dy), angle = Math.atan2(dy, dx);
    const x = (p[0] + c[0]) / 2, y = (p[1] + c[1]) / 2, nx = -Math.sin(angle), ny = Math.cos(angle);
    b.box(mat, x, y, 0, span + .025, .08, length, 0, 0, angle);
    if (seams) {
      const n = Math.ceil(length / .48), step = length / n;
      for (let k = 0; k <= n; k++) {
        const z = -length / 2 + k * step;
        b.box(M.roofEdge, x + nx * .052, y + ny * .052, z, span + .025, .043, .027, 0, 0, angle, .91 + b.r() * .1);
      }
      // Sheet overlaps travel horizontally across the roof, like the reference.
      if (span > 4) b.box(mat, p[0] + dx * .56 + nx * .05, p[1] + dy * .56 + ny * .05, 0, .038, .018, length, 0, 0, angle, .9);
    }
    for (const z of [-length / 2, length / 2]) b.box(seams ? M.roofEdge : M.darkRoof, x + nx * .033, y + ny * .033, z, span + .07, .135, .105, 0, 0, angle);
  }
  for (let i = 1; i < points.length - 1; i++) b.box(seams ? M.roofEdge : M.darkRoof, points[i][0], points[i][1] + .077, 0, i === Math.floor(points.length / 2) ? .21 : .105, .09, length + .10);
}

function gutters(b, w, d, eaveY, { color = M.roofEdge, overhang = .38, down = true } = {}) {
  for (const side of [-1, 1]) {
    const x = side * (w / 2 + overhang);
    b.box(color, x, eaveY - .035, 0, .13, .13, d + .72);
    b.box(M.shadow, x, eaveY + .03, 0, .10, .014, d + .69, 0, 0, 0, .75);
    if (down) for (const z of [-d / 2 + .24, d / 2 - .24]) {
      const wx = side * (w / 2 + .11);
      b.beam(color, [x, eaveY - .05, z], [wx, eaveY - .43, z], .075);
      b.beam(color, [wx, .4, z], [wx, eaveY - .43, z], .075);
      b.beam(color, [wx, .4, z], [wx + side * .36, .13, z], .075);
      for (const yy of [1.1, eaveY * .55]) b.box(color, wx, yy, z, .13, .035, .12, 0, 0, 0, .86);
    }
  }
}

function pedestrianDoor(b, axis, fixed, at, bottom = .22, w = .96, h = 2.14, { panel = M.trim, glazed = false } = {}) {
  const f = facade(b, axis, fixed), yy = bottom + h / 2;
  f.box(M.shadow, at, yy, w + .10, h + .06, .08, .04);
  f.box(panel, at, yy, w - .055, h - .045, .07, .10);
  for (const xx of [at - w / 2 - .045, at + w / 2 + .045]) f.box(M.trim, xx, yy, .105, h + .15, .15, .13);
  f.box(M.trim, at, bottom + h + .045, w + .22, .105, .15, .13);
  if (glazed) window(b, axis, fixed + Math.sign(fixed) * .125, at, bottom + 1.09, w * .62, .81, { rows: 2, columns: 2 });
  else for (const y of [bottom + .45, bottom + 1.43]) f.box(panel, at, y, w * .73, .62, .035, .15, .83);
  f.box(M.metal, at + w * .33, bottom + 1.06, .047, .16, .035, .18);
  f.box(M.foundation, at, bottom - .065, w + .27, .12, .48, .14);
}

function barnDoor(b, z, { width = 5.3, height = 4.8, at = 0 } = {}) {
  const side = Math.sign(z), f = facade(b, 'z', z);
  f.box(M.shadow, at, height / 2 + .18, width + .06, height + .03, .09, .035);
  for (const s of [-1, 1]) {
    const center = at + s * width / 4;
    f.box(M.redDark, center, height / 2 + .2, width / 2 - .035, height - .04, .13, .12);
    const boards = 10, bw = width / 2 / boards;
    for (let i = 0; i < boards; i++) f.box(M.red, center - width / 4 + (i + .5) * bw, height / 2 + .2, bw - .014, height - .07, .04, .20, .92 + b.r() * .13);
    f.box(M.trim, at + s * width / 2, height / 2 + .18, .13, height + .14, .13, .24);
    // Narrow door battens and long black strap hinges, restrained as in photo 2.
    for (const y of [.57, height - .36]) {
      f.box(M.redDark, center, y, width / 2 - .11, .10, .055, .235);
      f.box(M.metal, at + s * width * .39, y + .02, .44, .043, .035, .27);
    }
    f.box(M.metal, at + s * .11, 1.22, .048, .28, .045, .27);
  }
  f.box(M.trim, at, height / 2 + .19, .095, height + .10, .11, .245);
  f.box(M.trim, at, height + .23, width + .22, .16, .18, .18);
  f.box(M.metal, at, height + .43, width * 1.6, .07, .09, .18);
  for (const x of [-width * .37, width * .37]) f.box(M.metal, at + x, height + .27, .06, .31, .06, .20);
  f.box(M.foundation, at, .13, width + .3, .16, .5, .13);
  // A shallow timber rain hood follows the historic over-door profile.
  b.box(M.roof, at, height + .57, z + side * .24, width + .47, .067, .50, side * .1);
}

function makeBarn() {
  const group = new T.Group(); group.name = 'kephart-main-barn'; const b = new Batch(82019);
  const w = 14, d = 23, h = 6.35, front = d / 2;
  const profile = [[-7, h], [-4.65, 10.46], [0, 12.15], [4.65, 10.46], [7, h]];
  foundation(b, w, d, .37);
  // Low, small white multipane windows are the characteristic long-wall rhythm.
  const sidePositions = [-9.24, -7.49, -5.74, -2.05, -.31, 1.43, 6.80, 9.28];
  const sideWindows = sidePositions.map((at, i) => ({ at, bottom: i === 0 || i === 7 ? 2.00 : 1.91, w: i === 0 || i === 7 ? .78 : .90, h: i === 0 || i === 7 ? .89 : 1.26 }));
  for (const s of [-1, 1]) {
    // The steep lower roof covers the outside face of the siding. Terminating
    // boards under that plane prevents their upper edge piercing the tin.
    wall(b, 'x', s * w / 2, -front, front, h - .18, { openings: sideWindows });
    for (const o of sideWindows) window(b, 'x', s * w / 2, o.at, o.bottom, o.w, o.h, { columns: 2, rows: o.h < 1 ? 2 : 3 });
    b.box(M.interior, s * 6.70, h - .15, 0, .70, .08, d);
  }
  for (const s of [-1, 1]) {
    const z = s * front, doorWidth = s > 0 ? 5.3 : 4.45, doorHeight = s > 0 ? 4.82 : 4.28;
    wall(b, 'z', z, -w / 2, w / 2, h, { openings: [{ at: -.35, w: doorWidth, bottom: .18, h: doorHeight }, { at: 4.28, w: .92, bottom: .22, h: 2.27 }, { at: 3.58, w: .70, bottom: 4.02, h: 1.55 }] });
    barnDoor(b, z, { width: doorWidth, height: doorHeight, at: -.35 });
    pedestrianDoor(b, 'z', z, 4.28, .22, .92, 2.27, { panel: M.redDark });
    window(b, 'z', z, 3.58, 4.02, .70, 1.55, { columns: 1, rows: 2 });
    window(b, 'z', z, 0, 9.61, .50, .85, { columns: 1, rows: 1 });
    const f = facade(b, 'z', z); f.box(M.trim, -5.96, 2.0, .10, 3.56, .14, .14);
    f.box(M.redDark, -4.55, 3.04, 2.03, .07, .14, .09);
  }
  corners(b, w, d, h - .18, M.trim, .13); gableFill(b, profile, d); roof(b, profile, d);
  // Gambrel lower edges carry slim pale fascia, upper break and ridge are tin.
  gutters(b, w, d, h - .65, { down: true });
  b.finish(group);
  group.userData.localColliders = [{ kind: 'obb', x: 0, z: 0, hx: w / 2 + .1, hz: d / 2 + .1, angle: 0 }];
  group.userData.footprint = { width: w, depth: d, height: 12.3, roofOverhang: .44, dirtPadding: 2.6 };
  return group;
}

function porch(b, side, zCenter, length = 4.5, projection = 2.05, eaveY = 2.86) {
  const wallX = side * 4, outerX = side * (4 + projection), centerX = side * (4 + projection / 2);
  // Deck sits on dirt-height stone piers, with a single low weathered step.
  b.box(M.timber, centerX, .18, zCenter, projection, .16, length);
  const n = Math.ceil(length / .15); for (let i = 0; i < n; i++) b.box(M.timber, centerX, .275, zCenter - length / 2 + (i + .5) * length / n, projection, .042, length / n - .008, 0, 0, 0, .91 + b.r() * .11);
  b.box(M.foundation, outerX + side * .23, .04, zCenter, .51, .19, 1.35);
  b.box(M.darkRoof, centerX, eaveY + .28, zCenter, projection + .3, .10, length + .45, 0, 0, side * -.15);
  for (const z of [zCenter - length / 2 + .12, zCenter + length / 2 - .12]) {
    b.box(M.trim, outerX, (eaveY + .29) / 2, z, .14, eaveY - .17, .14);
    b.box(M.trim, centerX, 1.03, z, projection + .10, .095, .075);
    b.box(M.trim, centerX, .51, z, projection + .06, .075, .075);
    for (let x = 4.22; x < 4 + projection; x += .20) b.box(M.trim, side * x, .75, z, .042, .48, .042);
    b.beam(M.trim, [outerX, eaveY - .5, z], [outerX - side * .52, eaveY + .06, z], .065);
  }
  for (const sign of [-1, 1]) {
    const z = zCenter + sign * (length / 4 + .38), run = length / 2 - .78;
    for (const y of [.51, 1.03]) b.box(M.trim, outerX, y, z, .075, .08, run);
    for (let i = 0; i < Math.floor(run / .2); i++) b.box(M.trim, outerX, .75, z - run / 2 + .12 + i * .2, .043, .49, .043);
  }
  b.box(M.trim, outerX + side * .10, eaveY + .10, zCenter, .12, .15, length + .48);
  return { kind: 'obb', x: centerX, z: zCenter, hx: projection / 2 + .1, hz: length / 2, angle: 0 };
}

function makeAnnex() {
  const group = new T.Group(); group.name = 'kephart-sign-annex'; const b = new Batch(309220);
  const w = 8, d = 13.4, h = 5.35, peak = 8.10, front = d / 2;
  foundation(b, w, d, .32); const sideWindows = [3.98, 1.66, -.66].map(at => ({ at, bottom: .81, w: .87, h: 3.46 }));
  for (const s of [-1, 1]) {
    const openings = [...sideWindows, { at: -4.53, w: 1.02, bottom: .25, h: 2.30 }];
    wall(b, 'x', s * w / 2, -front, front, h, { horizontal: true, openings });
    for (const o of sideWindows) window(b, 'x', s * w / 2, o.at, o.bottom, o.w, o.h, { columns: 2, rows: 6 });
    pedestrianDoor(b, 'x', s * w / 2, -4.53, .25, 1.02, 2.30, { panel: M.trim, glazed: true });
  }
  wall(b, 'z', front, -w / 2, w / 2, h, { horizontal: true });
  wall(b, 'z', -front, -w / 2, w / 2, h, { horizontal: true });
  corners(b, w, d, h, M.trim, .19);
  const profile = [[-w / 2, h], [0, peak], [w / 2, h]];
  gableFill(b, profile, d, M.red, M.trim, 'horizontal'); roof(b, profile, d, M.darkRoof, { seams: false, eave: .30, end: .29 });
  gutters(b, w, d, h - .23, { color: M.trim, overhang: .29 });
  for (const z of [-front, front]) {
    const f = facade(b, 'z', z); f.box(M.trim, 0, h - .025, w + .15, .22, .16, .13); vent(b, 'z', z, 0, 6.67, .58, .78);
  }
  const f = facade(b, 'z', front);
  // Timber sign frame and the distinctive two-line white serif inscription.
  f.box(M.redDark, 0, 2.68, 5.09, 3.74, .12, .19);
  for (const x of [-2.55, 2.55]) f.box(M.trim, x, 2.68, .115, 3.82, .10, .28);
  for (const y of [.77, 4.59]) f.box(M.trim, 0, y, 5.20, .115, .10, .28);
  b.add(PLANE, getSignMaterial(), 0, 2.68, front + .295, 5.03, 3.74, 1, 0, 0, 0, 1, true);
  for (const x of [-1.85, 1.72]) {
    f.box(M.trim, x, 4.72, .055, .21, .055, .19);
    f.box(M.trim, x, 4.66, .29, .055, .11, .26);
  }
  // Opposite photographed gable: a five-light transom over red carriage doors.
  const rear = facade(b, 'z', -front), gateW = 4.5;
  rear.box(M.redDark, 0, 1.68, gateW, 2.75, .09, .09);
  for (const x of [-gateW / 2, 0, gateW / 2]) rear.box(M.trim, x, 1.68, .11, 2.84, .12, .16);
  for (const yy of [.28, 3.11, 4.32]) rear.box(M.trim, 0, yy, gateW + .11, .11, .12, .16);
  for (let i = 0; i < 5; i++) {
    const x = -gateW / 2 + (i + .5) * gateW / 5;
    rear.box(M.redDark, x, 3.72, gateW / 5 - .10, 1.11, .05, .1);
    rear.box(M.trim, x + gateW / 10, 3.72, .075, 1.19, .12, .16);
    // Small pale diamond panes are visible across this end in the wider photo.
    b.box(M.trim, x, 3.76, -front - .18, .16, .16, .032, 0, 0, Math.PI / 4);
  }
  for (const x of [-3.26, 3.26]) window(b, 'z', -front, x, .96, .72, 2.63, { columns: 1, rows: 4 });
  const porchCollider = porch(b, 1, -4.20, 4.7, 1.85, 2.83);
  b.finish(group);
  group.userData.localColliders = [{ kind: 'obb', x: 0, z: 0, hx: w / 2 + .1, hz: d / 2 + .1, angle: 0 }, porchCollider];
  group.userData.footprint = { width: w, depth: d, height: peak + .14, roofOverhang: .37, dirtPadding: 1.8, extra: [{ x: 4.97, z: -4.2, width: 2.1, depth: 4.9 }] };
  return group;
}

function makeCottage() {
  const group = new T.Group(); group.name = 'kephart-link-cottage'; const b = new Batch(588270);
  const w = 24.4, d = 7.6, h = 2.95, front = d / 2;
  foundation(b, w, d, .27);
  const frontOpenings = [-10.05, -6.45, -2.6, 2.54, 6.42, 10.0].map(at => ({ at, w: 1.34, bottom: .9, h: 1.53 }));
  frontOpenings.push({ at: .05, w: 1.02, bottom: .23, h: 2.25 });
  wall(b, 'z', front, -w / 2, w / 2, h, { horizontal: true, openings: frontOpenings });
  const rearWindows = [-9.8, -5.9, -1.9, 1.9, 5.9, 9.8].map(at => ({ at, w: 1.36, bottom: .9, h: 1.5 }));
  wall(b, 'z', -front, -w / 2, w / 2, h, { horizontal: true, openings: rearWindows });
  pedestrianDoor(b, 'z', front, .05, .23, 1.02, 2.25, { glazed: true, panel: M.redDark });
  for (const o of frontOpenings.filter(o => o.bottom > .5)) window(b, 'z', front, o.at, o.bottom, o.w, o.h, { columns: 2, rows: 2 });
  for (const o of rearWindows) window(b, 'z', -front, o.at, .9, 1.36, 1.5, { columns: 2, rows: 2 });
  for (const s of [-1, 1]) {
    wall(b, 'x', s * w / 2, -front, front, h, { horizontal: true, openings: [{ at: -1.72, w: 1.42, bottom: .96, h: 1.41 }, { at: 1.58, w: 1.01, bottom: .96, h: 1.41 }] });
    window(b, 'x', s * w / 2, -1.72, .96, 1.42, 1.41, { columns: 2, rows: 2 });
    window(b, 'x', s * w / 2, 1.58, .96, 1.01, 1.41, { columns: 2, rows: 2 });
  }
  corners(b, w, d, h, M.trim, .15);
  // Broad low hipped silver roof matches the linking house from both views.
  const roofW = w / 2 + .36, roofD = d / 2 + .36, ridgeHalf = w / 2 - 3.25, peak = 4.5;
  const roofFaces = [
    [[-roofW, h, -roofD], [-ridgeHalf, peak, 0], [ridgeHalf, peak, 0], [roofW, h, -roofD]],
    [[roofW, h, roofD], [ridgeHalf, peak, 0], [-ridgeHalf, peak, 0], [-roofW, h, roofD]],
    [[-roofW, h, roofD], [-ridgeHalf, peak, 0], [-roofW, h, -roofD]],
    [[roofW, h, -roofD], [ridgeHalf, peak, 0], [roofW, h, roofD]]
  ];
  for (const pts of roofFaces) b.polygon(M.roof, pts, .98);
  b.box(M.roofEdge, 0, peak + .035, 0, ridgeHalf * 2 + .12, .10, .15);
  for (const s of [-1, 1]) for (const side of [-1, 1]) b.beam(M.roofEdge, [side * roofW, h + .025, s * roofD], [side * ridgeHalf, peak + .025, 0], .06);
  // Standing seams are clipped to the hip edges instead of floating over them.
  for (const s of [-1, 1]) for (let x = -roofW + .3; x < roofW; x += .46) {
    const topX = Math.max(-ridgeHalf, Math.min(ridgeHalf, x));
    b.beam(M.roofEdge, [x, h + .035, s * roofD], [topX, peak + .035, 0], .026);
  }
  for (const s of [-1, 1]) b.box(M.trim, 0, h - .035, s * roofD, roofW * 2, .16, .11);
  for (const s of [-1, 1]) b.box(M.trim, s * roofW, h - .035, 0, .11, .16, roofD * 2);
  // Low open front deck, square posts and restrained dark railing.
  b.box(M.timber, 0, .14, front + .91, 7.9, .17, 1.65);
  for (let i = 0; i < 42; i++) b.box(M.timber, -3.84 + i * .187, .245, front + .91, .177, .045, 1.66, 0, 0, 0, .91 + b.r() * .13);
  b.box(M.roof, 0, 2.81, front + .87, 8.18, .085, 2.07, .10);
  for (let x = -3.96; x < 4.04; x += .46) b.box(M.roofEdge, x, 2.86, front + .87, .026, .035, 2.09, .10);
  b.box(M.trim, 0, 2.68, front + 1.90, 8.24, .14, .11);
  for (const x of [-3.80, 3.80]) {
    b.box(M.trim, x, 1.43, front + 1.62, .12, 2.59, .12);
    b.box(M.timber, x, .83, front + .84, .08, .09, 1.58);
    for (let z = front + .18; z < front + 1.64; z += .23) b.box(M.timber, x, .54, z, .045, .56, .045);
  }
  for (const s of [-1, 1]) {
    const x = s * 2.33; b.box(M.timber, x, .83, front + 1.62, 2.95, .10, .085);
    b.box(M.timber, x, .34, front + 1.62, 2.95, .075, .075);
    for (let i = 0; i < 12; i++) b.box(M.timber, s * (.88 + i * .244), .59, front + 1.62, .044, .49, .044);
  }
  b.box(M.foundation, 0, .045, front + 1.90, 1.55, .15, .61);
  b.finish(group);
  group.userData.localColliders = [{ kind: 'obb', x: 0, z: 0, hx: w / 2 + .1, hz: d / 2 + .1, angle: 0 }, { kind: 'obb', x: 0, z: front + .9, hx: 3.95, hz: .90, angle: 0 }];
  group.userData.footprint = { width: w, depth: d, height: peak + .12, roofOverhang: .41, dirtPadding: 1.5, extra: [{ x: 0, z: front + .95, width: 8, depth: 2.1 }] };
  return group;
}

function makeShed() {
  const group = new T.Group(); group.name = 'kephart-red-shed'; const b = new Batch(129057);
  const w = 9, d = 16, h = 3.20, front = d / 2;
  foundation(b, w, d, .20);
  for (const s of [-1, 1]) {
    wall(b, 'x', s * w / 2, -front, front, h, { horizontal: true, openings: s > 0 ? [{ at: 3.9, w: .97, bottom: .2, h: 2.23 }] : [{ at: -3.0, w: 1.20, bottom: 1.23, h: .95 }] });
    if (s > 0) pedestrianDoor(b, 'x', s * w / 2, 3.9, .2, .97, 2.23);
    else window(b, 'x', s * w / 2, -3.0, 1.23, 1.20, .95, { rows: 2, columns: 2 });
  }
  wall(b, 'z', front, -w / 2, w / 2, h, { horizontal: true });
  wall(b, 'z', -front, -w / 2, w / 2, h, { horizontal: true, openings: [{ at: 0, w: 3.2, bottom: .20, h: 2.65 }] });
  barnDoor(b, -front, { width: 3.2, height: 2.63 });
  corners(b, w, d, h, M.trim, .115);
  const profile = [[-w / 2, h], [0, 4.20], [w / 2, h]];
  gableFill(b, profile, d, M.red, M.trim, 'horizontal'); roof(b, profile, d, M.roof, { seams: true, eave: .28, end: .30 });
  gutters(b, w, d, h - .06, { color: M.roofEdge, overhang: .28, down: false });
  b.finish(group);
  group.userData.localColliders = [{ kind: 'obb', x: 0, z: 0, hx: w / 2 + .08, hz: d / 2 + .08, angle: 0 }];
  group.userData.footprint = { width: w, depth: d, height: 4.32, roofOverhang: .34, dirtPadding: 1.9 };
  return group;
}

export const KEPHART_DEFAULT_PLACEMENTS = Object.freeze({
  barn: Object.freeze({ x: 0, z: 0, angle: 0 }),
  annex: Object.freeze({ x: -19, z: 33, angle: -Math.PI / 2 }),
  cottage: Object.freeze({ x: -39, z: 0, angle: 0 }),
  shed: Object.freeze({ x: 25, z: -25, angle: Math.PI / 2 })
});

/**
 * Return local-space model/collision data. Move/rotate any named child, then
 * call refreshMetadata() before transforming colliders into the game's world.
 * No imported world/terrain state, no new ground slab, and no vehicle props.
 */
export function makeKephartBuildings(options = {}) {
  const group = new T.Group(); group.name = 'kephart-farm-buildings';
  const buildings = { barn: makeBarn(), annex: makeAnnex(), cottage: makeCottage(), shed: makeShed() };
  for (const [key, child] of Object.entries(buildings)) {
    const p = { ...KEPHART_DEFAULT_PLACEMENTS[key], ...(options.placements?.[key] || {}) };
    child.position.set(p.x, p.y || 0, p.z); child.rotation.y = p.angle || 0;
    child.scale.set(p.scaleX||1,p.scaleY||1,p.scaleZ||1);
    if (p.scale) child.scale.setScalar(p.scale); group.add(child);
  }
  const result = { group, buildings, parts: buildings, colliders: [], localColliders: [], footprints: [], footprint: null, refreshMetadata };
  function refreshMetadata() {
    result.colliders.length = 0; result.footprints.length = 0;
    const allCorners = [];
    for (const [key, child] of Object.entries(buildings)) {
      const co = Math.cos(child.rotation.y), si = Math.sin(child.rotation.y), sx = child.scale.x, sz = child.scale.z;
      const transform = (x, z) => ({ x: child.position.x + co * x * sx + si * z * sz, z: child.position.z - si * x * sx + co * z * sz });
      for (const c of child.userData.localColliders) {
        const p = transform(c.x, c.z);
        result.colliders.push({ ...c, ...p, hx: c.hx * Math.abs(sx), hz: c.hz * Math.abs(sz), angle: c.angle + child.rotation.y, building: key });
      }
      const fp = child.userData.footprint;
      const rectangles = [{ x: 0, z: 0, width: fp.width, depth: fp.depth }, ...(fp.extra || [])];
      for (const rect of rectangles) {
        const p = transform(rect.x, rect.z), corners = [[-1, -1], [-1, 1], [1, 1], [1, -1]].map(([x, z]) => transform(rect.x + x * (rect.width / 2 + fp.roofOverhang), rect.z + z * (rect.depth / 2 + fp.roofOverhang)));
        result.footprints.push({ building: key, ...p, width: rect.width * Math.abs(sx), depth: rect.depth * Math.abs(sz), hx: rect.width / 2 * Math.abs(sx), hz: rect.depth / 2 * Math.abs(sz), angle: child.rotation.y, roofOverhang: fp.roofOverhang, dirtPadding: fp.dirtPadding, height: fp.height * child.scale.y, corners });
        allCorners.push(...corners);
      }
    }
    result.localColliders = result.colliders;
    result.footprint = { minX: Math.min(...allCorners.map(p => p.x)), maxX: Math.max(...allCorners.map(p => p.x)), minZ: Math.min(...allCorners.map(p => p.z)), maxZ: Math.max(...allCorners.map(p => p.z)), rectangles: result.footprints };
    return result;
  }
  return refreshMetadata();
}
