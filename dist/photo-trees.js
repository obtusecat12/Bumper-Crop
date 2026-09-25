import {plantTexture} from './plant-texture.js?v=44';
import * as T from './vendor/three.module.min.js';
import {JoinedWood} from './joined-wood.js?v=44';
import {attachRuralDetail} from './rural-textures.js?v=44';

// Photo-specific Kephart Farm trees. Trunks and branch scaffolds are merged;
// foliage is individual small leaves drawn into shared alpha-cut twig cards.
// There are no solid crown hulls. Each tree costs two regular draw calls.
const TAU = Math.PI * 2, UP = new T.Vector3(0, 1, 0);
const V = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);
const shared = new Set(), templates = new Map(), textures = new Map();
const materialSets = new WeakMap();
const stillWind = {time: {value: 0}, strength: {value: .35}};
const profiles = {
  broad: {height: 12.4, width: 10.0, leaf: 'broad', leaves: 1120, bark: '#524b3f', color: '#587b3f', spread: .68},
  burgundy: {height: 6.9, width: 6.8, leaf: 'maple', leaves: 930, bark: '#574a42', color: '#63403c', spread: .56},
  orchard: {height: 4.9, width: 9.0, leaf: 'narrow', leaves: 930, bark: '#585342', color: '#6b854c', spread: .72},
  weeping: {height: 7.6, width: 4.1, leaf: 'willow', leaves: 690, bark: '#787265', color: '#899660', spread: .55},
  evergreen: {height: 11.4, width: 4.5, leaf: 'needle', leaves: 290, bark: '#686051', color: '#355746', spread: .60},
};
const aliases = {green: 'broad', maple: 'broad', oak: 'broad', 'broad-green': 'broad', 'green-maple': 'broad', plum: 'burgundy', 'purple-maple': 'burgundy', 'burgundy-maple': 'burgundy', 'red-maple': 'burgundy', 'low-willow': 'orchard', 'low-orchard': 'orchard', willow: 'weeping', 'thin-willow': 'weeping', 'thin-weeping': 'weeping', pine: 'evergreen', spruce: 'evergreen', conifer: 'evergreen'};
const barkMaterial = new T.MeshStandardMaterial({vertexColors: true, roughness: 1});
attachRuralDetail(barkMaterial,'bark');
barkMaterial.name = 'Photo trees / shared rough bark'; shared.add(barkMaterial);

function random(seed) {
  let a = seed >>> 0;
  return () => {a += 0x6d2b79f5; let x = a; x = Math.imul(x ^ x >>> 15, x | 1); x ^= x + Math.imul(x ^ x >>> 7, x | 61); return ((x ^ x >>> 14) >>> 0) / 4294967296;};
}
function nameFor(kind) {const k = String(kind || 'broad').toLowerCase(); return profiles[k] ? k : aliases[k] || 'broad';}

// Deterministic rasterization works both in the browser and the world worker:
// no Canvas, image loads, data URLs, or external textures are required.
export function twigTexture(shape) {
  if (textures.has(shape)) return textures.get(shape);
  const n = 256, data = new Uint8Array(n * n * 4), r = random(7821 + shape.length * 917);
  // Keep transparent texels light too: black RGB in empty texels bleeds into
  // tiny leaves through mip filtering and falsely darkens an entire crown.
  for (let i = 0; i < data.length; i += 4) data[i] = data[i + 1] = data[i + 2] = 232;
  function pixel(x, y, shade, alpha = 255) {
    if (x < 0 || y < 0 || x >= n || y >= n) return;
    const i = ((n - 1 - y) * n + x) * 4;
    if (alpha < data[i + 3]) return;
    data[i] = shade; data[i + 1] = shade; data[i + 2] = shade; data[i + 3] = alpha;
  }
  function line(ax, ay, bx, by, width, shade) {
    const length = Math.hypot(bx - ax, by - ay), steps = Math.ceil(length * 1.6);
    for (let s = 0; s <= steps; s++) {
      const x = ax + (bx - ax) * s / Math.max(1, steps), y = ay + (by - ay) * s / Math.max(1, steps);
      for (let dy = -width; dy <= width; dy++) for (let dx = -width; dx <= width; dx++) {
        const d = Math.hypot(dx, dy); if (d <= width + .3) pixel(Math.round(x + dx), Math.round(y + dy), shade, Math.min(255, (width + .7 - d) * 255));
      }
    }
  }
  function leaf(cx, cy, angle, length, halfWidth, shade) {
    const co = Math.cos(angle), si = Math.sin(angle), rad = Math.ceil(length + halfWidth);
    for (let y = Math.max(0, Math.floor(cy - rad)); y < Math.min(n, cy + rad); y++) {
      for (let x = Math.max(0, Math.floor(cx - rad)); x < Math.min(n, cx + rad); x++) {
        const dx = x + .5 - cx, dy = y + .5 - cy, u = (dx * co + dy * si) / length, v = (-dx * si + dy * co) / halfWidth;
        if (u < -.5 || u > .5) continue;
        let edge = Math.pow(Math.max(0, 1 - Math.pow(u * 2, 2)), .72);
        if (shape === 'maple') edge *= .77 + .23 * Math.cos((u + .50) * Math.PI * 5);
        const coverage = (edge - Math.abs(v)) * halfWidth;
        if (coverage > -.4) {
          const vein = Math.abs(v) < .040 ? .94 : 1;
          const light = (1 + v * .075 + u * .04) * vein;
          pixel(x, y, Math.max(0, Math.min(255, Math.round(shade * light))), Math.max(0, Math.min(255, Math.round((coverage + .4) * 255))));
        }
      }
    }
  }
  if (shape === 'needle') {
    line(128, 241, 128, 20, 1.1, 150);
    for (let j = 0; j < 12; j++) for (const sign of [-1, 1]) {
      const y = 227 - j * 16, reach = (100 - j * 5.8) * (.85 + r() * .17), ex = 128 + sign * reach, ey = y - 30;
      line(128, y, ex, ey, 1, 168);
      for (let k = 0; k < 9; k++) {
        const f = .13 + k * .095, x = 128 + sign * reach * f, yy = y - 30 * f;
        leaf(x + sign * 4, yy - 5, sign > 0 ? -.9 : -2.25, 23, 2.1, 176 + r() * 58);
        leaf(x + sign * 4, yy + 4, sign > 0 ? .4 : 2.8, 18, 2, 166 + r() * 62);
      }
    }
  } else {
    const thin = shape === 'willow', narrow = shape === 'narrow';
    line(126, 236, 129, 21, .9, 145);
    for (let j = 0; j < 6; j++) for (const sign of [-1, 1]) {
      const y = 209 - j * 30, reach = (j === 5 ? 32 : 65 + r() * 20), ex = 128 + reach * sign, ey = y - 27 - r() * 10;
      line(128, y, ex, ey, .8, 160);
      for (let k = 0; k < 3; k++) {
        const f = .38 + k * .29, x = 128 + sign * reach * f, yy = y + (ey - y) * f;
        const angle = sign > 0 ? -.77 + (k % 2) * 1.18 : -2.38 - (k % 2) * 1.14;
        const len = thin ? 37 + r() * 8 : narrow ? 31 + r() * 7 : 34 + r() * 9;
        const width = thin ? 3.2 : narrow ? 6.3 : shape === 'maple' ? 13.5 : 10.4;
        leaf(x + Math.cos(angle) * len * .18, yy + Math.sin(angle) * len * .18, angle, len, width, 179 + r() * 72);
      }
    }
    leaf(129, 24, -Math.PI * .5, 33, thin ? 3.0 : narrow ? 6 : 10, 232);
  }
  const texture = plantTexture(data,n,n);
  texture.name = 'Photo tree twig / ' + shape;
  texture.colorSpace = T.SRGBColorSpace;
  texture.magFilter = T.LinearFilter; texture.minFilter = T.LinearMipmapLinearFilter;
  texture.generateMipmaps = false; texture.anisotropy = 4; texture.needsUpdate = true;
  shared.add(texture); textures.set(shape, texture); return texture;
}

const sprayGeometry = (() => {
  const positions = [], normals = [], uv = [], indices = [];
  // Three intersecting little leafy shoots, never a tree-sized billboard.
  for (let plane = 0; plane < 3; plane++) {
    const a = plane * Math.PI / 3, co = Math.cos(a), si = Math.sin(a), b = positions.length / 3;
    for (const [x, y, u, v] of [[-.5, -.5, 0, 0], [.5, -.5, 1, 0], [.5, .5, 1, 1], [-.5, .5, 0, 1]]) {
      positions.push(x * co, y, x * si);
      const norm = V(-si + x * .5, .38, co + x * .5).normalize();
      normals.push(norm.x, norm.y, norm.z); uv.push(u, v);
    }
    indices.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geometry.setIndex(indices);
  geometry.computeBoundingSphere(); geometry.computeBoundingBox(); geometry.name = 'Photo trees / shared crossed twig cards';
  shared.add(geometry); return geometry;
})();

function addWind(material, wind, kind) {
  const key = wind && typeof wind === 'object' ? wind : stillWind;
  const flex = kind === 'weeping' ? .038 : kind === 'orchard' ? .025 : .018;
  material.onBeforeCompile = shader => {
    shader.uniforms.uPhotoTreeTime = key.time || stillWind.time;
    shader.uniforms.uPhotoTreeWind = key.strength || stillWind.strength;
    shader.vertexShader = 'uniform float uPhotoTreeTime;\nuniform float uPhotoTreeWind;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
        float pphase=instanceMatrix[3].x*.57+instanceMatrix[3].z*.41;
        float pflex=clamp(position.y+.55,0.,1.);
        transformed.x+=sin(uPhotoTreeTime*.83+pphase)*${flex.toFixed(3)}*uPhotoTreeWind*pflex;
        transformed.z+=sin(uPhotoTreeTime*.67+pphase*1.29)*${(flex * .55).toFixed(3)}*uPhotoTreeWind*pflex;
      #endif`);
  };
  material.customProgramCacheKey = () => 'photo-twig-wind-v1-' + kind;
}
function materials(kind, wind) {
  const key = wind && typeof wind === 'object' ? wind : stillWind;
  if (!materialSets.has(key)) materialSets.set(key, new Map());
  const map = materialSets.get(key); if (map.has(kind)) return map.get(kind);
  const texture = twigTexture(profiles[kind].leaf);
  const alphaTest = kind === 'weeping' ? .27 : kind === 'orchard' ? .31 : .36;
  const leaves = new T.MeshStandardMaterial({map: texture, color: 0xffffff, alphaTest, side: T.DoubleSide, roughness: 1, metalness: 0});
  leaves.name = 'Photo trees / ' + kind + ' alpha-cut foliage';
  const depth = new T.MeshDepthMaterial({map: texture, alphaTest, side: T.DoubleSide, depthPacking: T.RGBADepthPacking});
  const distance = new T.MeshDistanceMaterial({map: texture, alphaTest, side: T.DoubleSide});
  for (const m of [leaves, depth, distance]) {addWind(m, key, kind); shared.add(m);}
  attachRuralDetail(leaves,kind==='weeping'?'fineleaf':'broadleaf');
  const result = {leaves, depth, distance}; map.set(kind, result); return result;
}

function createTemplate(kind, variant) {
  const cacheKey = kind + ':' + variant; if (templates.has(cacheKey)) return templates.get(cacheKey);
  const p = profiles[kind], h = p.height, radius = p.width * .5, r = random(891 + Object.keys(profiles).indexOf(kind) * 973 + variant * 1427);
  const positions = [], colors = [], sprays = [], branchColor = new T.Color(p.bark), color = new T.Color(p.color);
  let woodTriangles = 0;
  function triangle(a, b, c, tint) {for (const q of [a, b, c]) {positions.push(q.x, q.y, q.z); colors.push(tint.r, tint.g, tint.b);} woodTriangles++;}
  const wood = new JoinedWood(triangle);
  function faceTints(sides) {
    // Keep exactly the original per-segment RNG draws in their original order:
    // all later branch points, spray transforms and colours depend on them.
    return Array.from({length: sides}, () => branchColor.clone().multiplyScalar(.85 + r() * .25));
  }
  function limb(a, b, ra, rb, sides = 5, sag = .05) {
    const mid = a.clone().lerp(b, .53).add(V((r() - .5) * .15, a.distanceTo(b) * sag, (r() - .5) * .15));
    wood.add([a, mid, b], [ra, ra * .49 + rb * .51, rb], sides, [faceTints(sides), faceTints(sides)]);
  }
  function spray(point, size = 1, direction = UP, shade = 1) {
    const quaternion = new T.Quaternion().setFromUnitVectors(UP, direction.clone().normalize());
    quaternion.multiply(new T.Quaternion().setFromAxisAngle(UP, r() * TAU));
    const matrix = new T.Matrix4().compose(point, quaternion, V(size * (.86 + r() * .25), size, size * (.86 + r() * .25)));
    const tint = color.clone().multiplyScalar(shade * (.85 + r() * .30));
    // Burgundy maples retain very occasional green leaves within the dark crown.
    if (kind === 'burgundy' && r() > .96) tint.lerp(new T.Color('#596342'), .55);
    sprays.push({matrix, color: tint});
  }
  const trunkRadius = kind === 'broad' ? .30 : kind === 'orchard' ? .235 : kind === 'burgundy' ? .19 : kind === 'weeping' ? .12 : .17;
  const lean = V((r() - .5) * .27, 0, (r() - .5) * .2);
  const trunkAt = y => V(lean.x * y / h, y, lean.z * y / h);
  const trunkTop = kind === 'orchard' ? .60 : kind === 'weeping' ? .94 : kind === 'evergreen' ? .98 : .85;
  const spine = [0, .18, .39, .63, trunkTop].sort((a, b) => a - b);
  for (let i = 0; i < spine.length - 1; i++) limb(trunkAt(h * spine[i]), trunkAt(h * spine[i + 1]), trunkRadius * (1 - spine[i] / trunkTop * .93), trunkRadius * (1 - spine[i + 1] / trunkTop * .93), i < 2 ? 8 : 6, .004);

  if (kind === 'evergreen') {
    const tiers = 10;
    for (let j = 0; j < tiers; j++) {
      const u = j / tiers, y = h * (.17 + .77 * u), reach = radius * Math.pow(1 - u, .90) * (.90 + r() * .12), count = j > 7 ? 4 : 6;
      for (let k = 0; k < count; k++) {
        const a = k / count * TAU + j * 1.9 + r() * .2, start = trunkAt(y), tip = V(Math.cos(a) * reach, y - .10 + u * .38, Math.sin(a) * reach);
        limb(start, tip, .038 * (1 - u * .8), .006, 4, -.07);
        for (let q = 0; q < 4; q++) {
          const t = .27 + q * .22, point = start.clone().lerp(tip, t).add(V((r() - .5) * .23, (r() - .5) * .27, (r() - .5) * .23));
          spray(point, (.90 - u * .48) * (.85 + r() * .20), V(Math.cos(a) * .42, .75, Math.sin(a) * .42), .92 + u * .1);
        }
      }
    }
    while (sprays.length < p.leaves) {
      const u = r(), a = r() * TAU, reach = radius * (1 - u) * Math.sqrt(r()) * .83;
      spray(V(Math.cos(a) * reach, h * (.25 + u * .73), Math.sin(a) * reach), .64 * (1 - u * .47), UP, 1);
    }
  } else if (kind === 'weeping') {
    // A light, narrow willow/birch-like tree with independently descending twigs.
    const curtains = [];
    for (let j = 0; j < 11; j++) {
      const u = j / 11, a = j * 2.399 + r() * .3, start = trunkAt(h * (.24 + u * .57)), reach = radius * (.48 + Math.sin(u * Math.PI) * .45);
      const arch = V(Math.cos(a) * reach * .64, h * (.68 + u * .28), Math.sin(a) * reach * .64);
      limb(start, arch, .061 * (1 - u * .55), .015, 5, .1);
      for (let k = 0; k < 5; k++) {
        const aa = a + (k - 2) * .20, top = arch.clone().add(V(Math.cos(aa) * reach * .23, (r() - .5) * .31, Math.sin(aa) * reach * .23));
        const length = h * (.25 + r() * .34), bottom = top.clone().add(V(Math.cos(aa) * .27, -length, Math.sin(aa) * .27));
        limb(arch, top, .012, .005, 3, .07); limb(top, bottom, .006, .0018, 3, -.035);
        curtains.push({top, bottom});
      }
    }
    for (let i = 0; i < p.leaves; i++) {
      const c = curtains[i % curtains.length], t = r(), pt = c.top.clone().lerp(c.bottom, t).add(V((r() - .5) * .28, (r() - .5) * .18, (r() - .5) * .28));
      spray(pt, .56 + r() * .18, V((r() - .5) * .24, -1, (r() - .5) * .24), .90 + (pt.y / h) * .15);
    }
    for (let i = 0; i < 18; i++) spray(V((r() - .5) * .36, h * (.84 + r() * .12), (r() - .5) * .36), .5, V(.1, -1, 0));
  } else {
    const orchard = kind === 'orchard', burgundy = kind === 'burgundy', crowns = [];
    const scaffolds = orchard ? 7 : burgundy ? 8 : 9;
    const tierY = orchard ? [.39, .49, .61, .73, .84] : burgundy ? [.31, .45, .61, .76, .87] : [.30, .45, .62, .77, .88];
    const tierR = orchard ? [.74, .86, .84, .65, .32] : burgundy ? [.42, .74, .86, .72, .40] : [.43, .76, .88, .70, .40];
    for (let j = 0; j < scaffolds; j++) {
      const u = j / scaffolds, a = j / scaffolds * TAU + r() * .22;
      const start = trunkAt(h * (orchard ? .13 + u * .12 : .14 + u * .17));
      const reach = radius * (orchard ? .60 + r() * .12 : .50 + r() * .10);
      const y = h * (orchard ? .53 + r() * .07 : .55 + r() * .08);
      const elbow = V(Math.cos(a) * reach * .49, y - h * .17, Math.sin(a) * reach * .49), tip = V(Math.cos(a + .1) * reach, y, Math.sin(a + .1) * reach);
      limb(start, elbow, trunkRadius * (orchard ? .57 : .41) * (1 - u * .45), .05, 5, orchard ? .03 : .06);
      limb(elbow, tip, .05, .019, 5, .03);
      for (let k = 0; k < 5; k++) {
        // Every scaffold carries low, middle, and upper shoots. The old single
        // high twig endpoint left a half-height bare trunk and umbrella crown.
        const aa = a + (k - 2) * .18 + (r() - .5) * .25, anchor = elbow.clone().lerp(tip, .23 + k * .15), rr = radius * tierR[k] * (.92 + r() * .13);
        const end = V(Math.cos(aa) * rr, h * (tierY[k] + (r() - .5) * .036), Math.sin(aa) * rr);
        limb(anchor, end, .020, .006, 3, orchard ? .12 : .04);
        crowns.push({center: end, x: radius * (orchard ? .24 : .245), y: h * (orchard ? .12 : .135), z: radius * (orchard ? .24 : .245), angle: aa});
      }
    }
    // Interior shoots occupy the middle as well as the top; this closes hollow
    // spaces between the radial scaffolds without increasing the spray budget.
    const topCount = orchard ? 8 : 11;
    for (let j = 0; j < topCount; j++) {
      const a = j * 2.399, rr = radius * (.05 + (j % 4) * .048), y = h * (orchard ? .49 + (j % 4) * .105 + r() * .025 : .43 + (j % 4) * .15 + r() * .025), point = V(Math.cos(a) * rr, y, Math.sin(a) * rr);
      limb(trunkAt(h * .43), point, .034, .006, 3, .06);
      crowns.push({center: point, x: radius * .26, y: h * .14, z: radius * .26, angle: a});
    }
    // Stratified samples follow fine-branch territories. Multiple uneven small
    // lobes merge into the photographic silhouette; no ellipsoid mesh is drawn.
    for (let i = 0; i < p.leaves; i++) {
      const c = crowns[i % crowns.length], phi = r() * TAU, zz = r() * 2 - 1, radial = Math.pow(r(), .45), flat = Math.sqrt(1 - zz * zz);
      const point = c.center.clone().add(V(Math.cos(phi) * flat * radial * c.x, zz * radial * c.y, Math.sin(phi) * flat * radial * c.z));
      if (i % 5 === 0) {point.x *= .40; point.z *= .40;}
      const outward = Math.hypot(point.x, point.z) / radius;
      if (orchard) point.y -= Math.max(0, outward - .55) * h * .16;
      // The photos show neither topiary spheres nor sharply clipped rooflines.
      const jitter = Math.sin(Math.atan2(point.z, point.x) * 5 + variant) * .10;
      point.x *= 1 + jitter; point.z *= 1 - jitter * .4;
      const scale = (orchard ? .67 : burgundy ? .66 : .90) * (.82 + r() * .36);
      const direction = orchard && outward > .63 ? V(point.x * .045, -.75, point.z * .045) : V((r() - .5) * .85, .7 + r() * .45, (r() - .5) * .85);
      spray(point, scale, direction, .83 + (point.y / h) * .22);
    }
  }
  wood.finish();
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals(); geometry.computeBoundingSphere(); geometry.computeBoundingBox();
  geometry.name = 'Photo trees / shared ' + cacheKey + ' branch scaffold'; shared.add(geometry);
  const bounds = geometry.boundingBox.clone(), cardBounds = new T.Box3();
  for (const spray of sprays) bounds.union(cardBounds.copy(sprayGeometry.boundingBox).applyMatrix4(spray.matrix));
  const extent = bounds.getSize(V());
  const result = {geometry, sprays, trunkRadius, triangles: woodTriangles + sprays.length * 6, woodTriangles, boundsHeight: bounds.max.y, boundsWidth: Math.max(extent.x, extent.z), defaultHeight: h, defaultWidth: p.width};
  templates.set(cacheKey, result); return result;
}

/**
 * Build a tree at the local origin. Place/rotate result.group in the farm group.
 * kind: broad | burgundy | orchard | weeping | evergreen (aliases also accepted).
 * Colliders are local circles; apply the group's placement externally.
 * Shared resources must be excluded from farm/chunk resource disposal.
 */
export function makePhotoTree({kind = 'broad', seed = 1, height, crownWidth, wind} = {}) {
  kind = nameFor(kind);
  const p = profiles[kind], variant = (seed >>> 0) % 3, template = createTemplate(kind, variant), set = materials(kind, wind);
  const h = Number.isFinite(height) ? Math.max(.3, height) : p.height;
  const width = Number.isFinite(crownWidth) ? Math.max(.3, crownWidth) : p.width;
  const sx = width / template.boundsWidth, sy = h / template.boundsHeight;
  const group = new T.Group(); group.name = 'Photo farm / ' + kind + ' tree'; group.scale.set(sx, sy, sx);
  const bark = new T.Mesh(template.geometry, barkMaterial); bark.name = 'Merged trunk and branching limbs'; bark.castShadow = true; bark.receiveShadow = true; group.add(bark);
  const foliage = new T.InstancedMesh(sprayGeometry, set.leaves, template.sprays.length);
  foliage.name = 'Individual leaves on small branch sprays';
  template.sprays.forEach((s, i) => {foliage.setMatrixAt(i, s.matrix); foliage.setColorAt(i, s.color);});
  foliage.instanceMatrix.needsUpdate = true; foliage.instanceColor.needsUpdate = true;
  foliage.computeBoundingSphere(); foliage.castShadow = true; foliage.receiveShadow = true;
  foliage.customDepthMaterial = set.depth; foliage.customDistanceMaterial = set.distance;
  group.add(foliage);
  const colliders = [{kind: 'circle', x: 0, z: 0, r: template.trunkRadius * sx * 1.04}];
  const stats = {kind, triangles: template.triangles, woodTriangles: template.woodTriangles, leafSprays: template.sprays.length, drawCalls: 2, height: h, crownWidth: width};
  group.userData.photoTreeStats = stats; group.userData.natureStats = {...stats, trees: 1, shrubs: 0};
  return {group, colliders, softVolumes: [], stats};
}

export function isSharedPhotoTreeResource(resource) {return shared.has(resource);}
export function photoTreeKinds() {return Object.keys(profiles);}
