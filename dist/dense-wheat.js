// Dense wheat: shared crossed silhouettes, a distant canopy, and bounded near geometry.
// Shared resources are retained while individual world chunks are unloaded.
import * as T from './vendor/three.module.min.js';
import { CHUNK, height, wheatAllowed, wheatCandidates, random } from './world.js';

const dummy = new T.Object3D();
const shared = new Set();
let resources;

// All silhouettes are drawn locally at runtime; there are no image/CDN dependencies.
function wheatAtlas() {
  const cell = 384, n = 3;
  const canvas = document.createElement('canvas');
  canvas.width = cell * n; canvas.height = 512;
  const ctx = canvas.getContext('2d'), rng = random(0x10ab0da);
  for (let variant = 0; variant < n; variant++) {
    ctx.save(); ctx.beginPath(); ctx.rect(variant * cell, 0, cell, 512); ctx.clip();
    for (let stem = 0; stem < 11; stem++) {
      const x = variant * cell + 17 + stem * 34.6 + (rng() - .5) * 14;
      const top = 40 + rng() * 85, bend = (rng() - .5) * 33;
      const shade = Math.floor(rng() * 24);
      const stalk = ctx.createLinearGradient(0, 510, 0, top);
      stalk.addColorStop(0, '#68502c'); stalk.addColorStop(.55, '#ad8844');
      stalk.addColorStop(1, `rgb(${202 + shade},${165 + shade},${98 + shade})`);
      ctx.strokeStyle = stalk; ctx.lineWidth = 1.7 + rng() * .8;
      ctx.beginPath(); ctx.moveTo(x, 515);
      ctx.bezierCurveTo(x - 5, 330, x + bend * .3, 170, x + bend, top + 54); ctx.stroke();
      for (let j = 0; j < 3; j++) {
        const y = 258 + j * 62 + rng() * 18, side = (j + stem) % 2 ? -1 : 1;
        const reach = 22 + rng() * 23;
        ctx.fillStyle = j === 2 ? '#806533' : '#af904d';
        ctx.beginPath(); ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + side * reach * .4, y - 34, x + side * reach, y - 20);
        ctx.quadraticCurveTo(x + side * reach * .45, y - 7, x, y + 3); ctx.fill();
      }
      const headX = x + bend;
      ctx.strokeStyle = '#ccac6b'; ctx.lineWidth = 2.1;
      ctx.beginPath(); ctx.moveTo(headX, top + 65); ctx.lineTo(headX + 5, top + 7); ctx.stroke();
      for (let row = 0; row < 8; row++) for (const side of [-1, 1]) {
        const y = top + 11 + row * 6.2, xx = headX + 5 - row * .53;
        const w = (3.2 + Math.sin((row + 1) / 9 * Math.PI) * 1.6);
        ctx.save(); ctx.translate(xx + side * w * .48, y); ctx.rotate(side * .42);
        ctx.fillStyle = side < 0 ? `rgb(${209 + shade},${175 + shade},${105 + shade})` : `rgb(${180 + shade},${143 + shade},${77 + shade})`;
        ctx.beginPath(); ctx.ellipse(0, 0, w, 5.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        ctx.strokeStyle = 'rgba(218,188,124,.85)'; ctx.lineWidth = .78;
        ctx.beginPath(); ctx.moveTo(xx + side * w, y - 3);
        ctx.lineTo(xx + side * (10 + row * .9), y - 28 - rng() * 13); ctx.stroke();
      }
    }
    ctx.restore();
  }
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.magFilter = T.LinearFilter;
  texture.minFilter = T.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  return texture;
}

function cardGeometry() {
  const p = [], uv = [], normals = [], colors = [];
  const vertex = (x, y, z, u, v) => {
    p.push(x, y, z); uv.push(u, v); normals.push(0, 1, 0);
    colors.push(1, 1, 1);
  };
  for (let side = 0; side < 3; side++) {
    const a = side * Math.PI / 3, x = Math.cos(a) * .43, z = Math.sin(a) * .43;
    const u0 = side / 3, u1 = (side + 1) / 3, top = 1.58;
    vertex(-x, 0, -z, u0, 0); vertex(x, 0, z, u1, 0); vertex(x, top, z, u1, 1);
    vertex(-x, 0, -z, u0, 0); vertex(x, top, z, u1, 1); vertex(-x, top, -z, u0, 1);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
  g.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  return g;
}

function detailedGeometry() {
  const positions = [], colors = [];
  const palette = ['#bfa163', '#dfc185', '#cfaa66', '#b8914d', '#ab9256'].map(c => new T.Color(c));
  const tri = (a, b, c, tone) => { positions.push(...a, ...b, ...c); const col = palette[tone];
    for (let i = 0; i < 3; i++) colors.push(col.r, col.g, col.b); };
  const quad = (a, b, c, d, tone) => { tri(a, b, c, tone); tri(a, c, d, tone); };
  quad([-.006, 0, 0], [.006, 0, 0], [.064, 1.21, 0], [.052, 1.21, 0], 0);
  quad([0, 0, -.006], [0, 0, .006], [.058, 1.21, .006], [.058, 1.21, -.006], 0);
  for (let leaf = 0; leaf < 3; leaf++) {
    const y = .28 + leaf * .23, s = leaf % 2 ? -1 : 1;
    quad([.02, y, 0], [.03, y + .02, .014], [s * .14, y + .19, .045], [s * .23, y + .12, .019], 4);
  }
  for (let row = 0; row < 7; row++) for (const side of [-1, 1]) {
    const y = 1.09 + row * .031, x = .055 + row * .004 + side * .012;
    const z = row % 2 ? .008 : -.008, w = .015 * (1 - row * .045);
    const base = [x - side * .006, y - .022, z], outer = [x + side * w, y + .011, z];
    const top = [x + side * .003, y + .037, z], front = [x, y + .004, z + .012];
    const back = [x, y + .004, z - .012];
    tri(base, front, outer, 2); tri(outer, front, top, 1);
    tri(base, outer, back, 3); tri(outer, top, back, 2);
    tri(top, [top[0] + side * .0018, top[1], top[2] + .001], [x + side * .052, y + .145, z + .006], 1);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  g.computeVertexNormals(); return g;
}

function animateMaterial(material, wind, { cards = false, detail = false, canopy = false, detailRadius, viewCenter } = {}) {
  material.onBeforeCompile = shader => {
    shader.uniforms.uTime = wind.time; shader.uniforms.uPlayer = wind.player;
    shader.uniforms.uWind = wind.strength;
    if (viewCenter) shader.uniforms.uWheatView = viewCenter;
    if (detail) shader.uniforms.uDetailRadius = detailRadius;
    shader.vertexShader = 'uniform float uTime; uniform vec3 uPlayer; uniform float uWind;\n' +
      (viewCenter ? 'uniform vec3 uWheatView;\n' : '') + (detail ? 'uniform float uDetailRadius;\n' : '') + (canopy ? 'varying vec3 vWheatWorld;\n' : '') + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vec3 wheatRoot = (modelMatrix * ${canopy ? '' : 'instanceMatrix *'} vec4(0.,0.,0.,1.)).xyz;
      ${canopy ? 'wheatRoot = (modelMatrix * vec4(position, 1.)).xyz; vWheatWorld = wheatRoot;' : ''}
      float phase = wheatRoot.x * .22 + wheatRoot.z * .17;
      float bend = pow(max(position.y, 0.), 2.);
      float sway = sin(uTime * 1.3 + phase) + .32 * sin(uTime * 2.1 + phase * 2.8);
      transformed.x += sway * .036 * bend * uWind;
      transformed.z += cos(uTime * .94 + phase) * .022 * bend * uWind;
      ${!canopy ? `vec2 away = wheatRoot.xz - uPlayer.xz; float d = length(away);
      vec2 push = away / max(d, .01) * (1. - smoothstep(.18, 1.15, d));
      vec3 localPush = transpose(mat3(instanceMatrix)) * vec3(push.x, 0., push.y);
      transformed.xz += localPush.xz * bend * .3;
      transformed.y -= length(push) * bend * .18;` : ''}
      ${detail ? 'transformed.y *= 1. - smoothstep(uDetailRadius - 2.5, uDetailRadius, length(wheatRoot.xz - uWheatView.xz));' : ''}
    `);
    // Upward vegetation normals give the same soft overcast light from every azimuth.
    if (cards) shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_begin>',
      '#include <normal_fragment_begin>\n#ifdef DOUBLE_SIDED\n normal *= faceDirection;\n#endif');
    if (canopy) {
      shader.fragmentShader = 'uniform vec3 uWheatView; varying vec3 vWheatWorld;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        float canopyFade = smoothstep(25., 42., length(vWheatWorld.xz - uWheatView.xz));
        float screenPattern = fract(dot(floor(gl_FragCoord.xy), vec2(.754877666,.569840296)));
        if (canopyFade < .001 || screenPattern > canopyFade) discard;
      `);
    }
  };
  material.customProgramCacheKey = () => `dense-wheat-v1-${cards}-${detail}-${canopy}`;
}

function getResources(wind) {
  if (resources) return resources;
  const atlas = wheatAtlas(), cards = cardGeometry(), detailed = detailedGeometry();
  const cardMaterial = new T.MeshStandardMaterial({ color: 0xffffff, map: atlas,
    side: T.DoubleSide, alphaTest: .20, roughness: 1, vertexColors: true });
  const detailMaterial = new T.MeshStandardMaterial({ color: 0xffffff, side: T.DoubleSide,
    vertexColors: true, roughness: 1 });
  const canopyMaterial = new T.MeshStandardMaterial({ color: 0xffffff, vertexColors: true,
    side: T.DoubleSide, roughness: 1 });
  const detailRadius = { value: 11 }, viewCenter = { value: new T.Vector3() };
  animateMaterial(cardMaterial, wind, { cards: true });
  animateMaterial(detailMaterial, wind, { detail: true, detailRadius, viewCenter });
  animateMaterial(canopyMaterial, wind, { canopy: true, viewCenter });
  for (const resource of [atlas, cards, detailed, cardMaterial, detailMaterial, canopyMaterial]) shared.add(resource);
  resources = { atlas, cards, detailed, cardMaterial, detailMaterial, canopyMaterial, detailRadius, viewCenter };
  return resources;
}

function canopyGeometry(f) {
  const p = [], c = [], step = 1.55, rng = random(f.seed ^ 0xaaa818), col = new T.Color();
  const vertex = (x, z) => {
    p.push(x, height(x, z, f.x, f.z) + .99 + Math.sin(x * 1.8 + z) * .025, z);
    col.setHSL(.108 + rng() * .016, .36 + rng() * .09, .36 + rng() * .09);
    c.push(col.r, col.g, col.b);
  };
  for (let z = 7.6; z < 55.9; z += step) for (let x = 7.6; x < 55.9; x += step) {
    if (![ [x,z], [x+step,z], [x,z+step], [x+step,z+step] ].every(([a,b]) => wheatAllowed(a,b,f))) continue;
    vertex(x,z); vertex(x,z+step); vertex(x+step,z+step);
    vertex(x,z); vertex(x+step,z+step); vertex(x+step,z);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(p,3));
  g.setAttribute('color', new T.Float32BufferAttribute(c,3)); g.computeVertexNormals(); return g;
}

// Returned `candidates` preserve the existing spatial collision buckets exactly.
// Visual density never changes with chunk LOD; the cheap far canopy prevents mip holes.
export function buildDenseWheat(f, level, quality, wind) {
  const r = getResources(wind), group = new T.Group(), roots = [], rng = random(f.seed ^ 0x72ac0f);
  const spacing = quality === 'low' ? .98 : .80;
  for (let z = 7.65; z < 56.4; z += spacing) for (let x = 7.65; x < 56.4; x += spacing) {
    const xx = x + (rng() - .5) * spacing * .45, zz = z + (rng() - .5) * spacing * .45;
    const a = rng() * Math.PI, s = .94 + rng() * .13;
    if (wheatAllowed(xx, zz, f)) roots.push({x:xx, z:zz, a, s});
  }
  const mesh = new T.InstancedMesh(r.cards, r.cardMaterial, roots.length);
  const width = quality === 'low' ? 1.23 : 1.06;
  roots.forEach((root, i) => {
    dummy.position.set(root.x, height(root.x, root.z, f.x, f.z) - .025, root.z);
    dummy.rotation.set(0, root.a, 0); dummy.scale.set(width, root.s, width);
    dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere();
  // Bounds include shader wind and contact deformation.
  if (mesh.boundingSphere) mesh.boundingSphere.radius += 1;
  mesh.receiveShadow = true; mesh.name = 'dense-wheat-cards';
  const canopy = new T.Mesh(canopyGeometry(f), r.canopyMaterial); canopy.name = 'distant-wheat-canopy';
  group.add(mesh, canopy);
  group.userData.wheat = { clumps: roots.length, silhouettesPerClump: 33, detailLevel: level };
  return { mesh: group, candidates: wheatCandidates(f) };
}

// One bounded detail mesh for the entire world, rather than one high mesh per chunk.
export function createWheatDetailLayer(wind) {
  const r = getResources(wind), maxCount = 12000;
  const object = new T.InstancedMesh(r.detailed, r.detailMaterial, maxCount);
  object.count = 0; object.frustumCulled = false; object.receiveShadow = true;
  object.name = 'near-wheat-grains'; object.instanceMatrix.setUsage(T.DynamicDrawUsage);
  let lastX = Infinity, lastZ = Infinity, lastKey = '', lastQuality = '', lastCount = -1;
  function update(chunks, player, quality, originKey) {
    r.viewCenter.value.copy(player);
    // Chunk count also catches late-streamed fields while the player stands still.
    if (originKey === lastKey && quality === lastQuality && chunks.size === lastCount &&
        Math.hypot(player.x - lastX, player.z - lastZ) < 2.5) return;
    lastX = player.x; lastZ = player.z; lastKey = originKey; lastQuality = quality; lastCount = chunks.size;
    const radius = quality === 'high' ? 14 : quality === 'low' ? 8 : 11;
    const spacing = quality === 'high' ? .31 : quality === 'low' ? .38 : .33;
    const buildRadius = radius + 3.0; r.detailRadius.value = radius;
    let at = 0;
    for (const chunk of chunks.values()) {
      const f = chunk.field, ox = chunk.group.position.x, oz = chunk.group.position.z;
      const px = player.x - ox, pz = player.z - oz;
      if (px < -buildRadius || px > CHUNK + buildRadius || pz < -buildRadius || pz > CHUNK + buildRadius) continue;
      const minX = Math.max(0, Math.floor((px-buildRadius)/spacing)), maxX = Math.min(Math.floor(CHUNK/spacing), Math.ceil((px+buildRadius)/spacing));
      const minZ = Math.max(0, Math.floor((pz-buildRadius)/spacing)), maxZ = Math.min(Math.floor(CHUNK/spacing), Math.ceil((pz+buildRadius)/spacing));
      for (let iz = minZ; iz <= maxZ; iz++) for (let ix = minX; ix <= maxX; ix++) {
        // Each stem is stable across rebuilds and quality-independent world streaming.
        const rng = random(f.seed ^ Math.imul(ix, 734287) ^ Math.imul(iz, 912931));
        const x = (ix + .12 + rng()*.72)*spacing, z = (iz + .12 + rng()*.72)*spacing;
        if (Math.hypot(x-px,z-pz)>buildRadius || !wheatAllowed(x,z,f)) continue;
        if (at >= maxCount) continue;
        dummy.position.set(x + ox, height(x,z,f.x,f.z), z + oz);
        dummy.rotation.set((rng()-.5)*.08, rng()*Math.PI*2, (rng()-.5)*.08);
        dummy.scale.set(.9+rng()*.25, .94+rng()*.14, .9+rng()*.25);
        dummy.updateMatrix(); object.setMatrixAt(at++, dummy.matrix);
      }
    }
    object.count = at; object.instanceMatrix.needsUpdate = true;
  }
  return { object, update, dispose: () => object.dispose() };
}

export function isSharedWheatResource(resource) { return shared.has(resource); }
