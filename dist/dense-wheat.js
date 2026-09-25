import {createBarleyGeometry,createStubbleGeometry} from './crop-geometry.js?v=38';
// Golden mature wheat: varied silhouette clumps plus three bounded grain meshes.
// Geometry/materials/textures are shared; per-chunk meshes and canopy are owned by the chunk.
import * as T from './vendor/three.module.min.js';
import { exactIndexGeometry } from './exact-index.js?v=38';
import { CHUNK, surfaceHeight, wheatAllowed, wheatCandidates, cropSample, random } from './world.js?v=38';

const dummy = new T.Object3D(), tint = new T.Color(), shared = new Set();
export const WHEAT_GEOMETRY_RADIUS = 45;
const TAU = Math.PI * 2, DETAIL_CAPACITY = 12000, DETAIL_VARIANTS = 9;
let resources, detailTemplates;

// No remote image dependencies. Each tile is a different, irregular stand of ripe ears.
function wheatAtlas(barley=false) {
  const cell = 512, height = 768, count = 3;
  const canvas = document.createElement('canvas');
  canvas.width = cell * count; canvas.height = height;
  const ctx = canvas.getContext('2d'), rng = random(0x5eadb17);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let variant = 0; variant < count; variant++) {
    ctx.save(); ctx.beginPath(); ctx.rect(variant * cell + 2, 0, cell - 4, height); ctx.clip();
    ctx.translate(variant * cell, 0);
    for (let stem = 0; stem < 13; stem++) {
      const rootX = 20 + stem * 39 + (rng() - .5) * 17;
      const direction = rootX < 62 ? 1 : rootX > 444 ? -1 : rng() < .5 ? -1 : 1;
      const bend = direction * (12 + rng() * 47), baseX = rootX + bend;
      const baseY = 175 + rng() * 181, length = 69 + rng() * 30;
      const nodding = barley || (stem + variant) % 3 !== 0;
      const angle = -Math.PI / 2 + direction * (nodding ? .60 + rng() * .59 : .08 + rng() * .34);
      const curve = direction * (nodding ? .50 + rng() * .66 : .13 + rng() * .31);
      const shade = Math.floor(rng() * 21), gold = `rgb(${193 + shade},${158 + shade},${91 + shade})`;
      const stalk = ctx.createLinearGradient(rootX, height, baseX, baseY);
      stalk.addColorStop(0, '#795c32'); stalk.addColorStop(.44, '#b08b4c'); stalk.addColorStop(1, '#d1b376');
      ctx.strokeStyle = stalk; ctx.lineWidth = 1.65 + rng() * .85;
      ctx.beginPath(); ctx.moveTo(rootX, height + 8);
      ctx.bezierCurveTo(rootX - bend * .16, 545, baseX - Math.cos(angle) * 85,
        baseY - Math.sin(angle) * 85, baseX, baseY); ctx.stroke();
      // Mature blades are narrow, ribbon-like and curled down at the tips.
      for (let leaf = 0; leaf < 2; leaf++) {
        const y = 398 + rng() * 315, side = (stem + leaf) % 2 ? 1 : -1;
        const x = rootX + bend * (1 - y / height) * .6, reach = 45 + rng() * 40;
        ctx.strokeStyle = leaf ? '#967740' : '#b49759'; ctx.lineWidth = 1.5 + rng() * .6;
        ctx.beginPath(); ctx.moveTo(x, y);
        ctx.bezierCurveTo(x + side * 20, y - 37, x + side * reach, y - 51, x + side * (reach + 8), y + 24);
        ctx.stroke();
      }
      const point = t => {
        const a = angle + curve * t;
        return { x: baseX + length * (Math.sin(a) - Math.sin(angle)) / curve,
          y: baseY + length * (Math.cos(angle) - Math.cos(a)) / curve, a };
      };
      ctx.strokeStyle = '#ba9659'; ctx.lineWidth = 2.1;
      ctx.beginPath(); ctx.moveTo(baseX, baseY);
      for (let i = 1; i <= 10; i++) { const p = point(i / 10); ctx.lineTo(p.x, p.y); } ctx.stroke();
      // Alternating spikelets around a curved rachis, with side shading and fine awns.
      for (let row = 0; row < 9; row++) for (const side of [-1, 1]) {
        const p = point(.07 + row * .101 + (side > 0 ? .021 : 0));
        const dx = Math.cos(p.a), dy = Math.sin(p.a), nx = -dy, ny = dx;
        const taper = .68 + .32 * Math.sin((row + 1) / 10 * Math.PI);
        const gx = p.x + nx * side * 3.6 * taper, gy = p.y + ny * side * 3.6 * taper;
        ctx.save(); ctx.translate(gx, gy); ctx.rotate(p.a - Math.PI / 2 - side * .27);
        const grain = ctx.createLinearGradient(-4, 0, 4, 0);
        grain.addColorStop(0, '#a37c43'); grain.addColorStop(.42, gold);
        grain.addColorStop(.69, `rgb(${220 + shade},${189 + shade},${129 + shade})`); grain.addColorStop(1, '#b48c4b');
        ctx.fillStyle = grain; ctx.beginPath(); ctx.ellipse(0, 0, (barley?2.4:3.7) * taper, 6.4 * taper, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(143,103,47,.36)'; ctx.lineWidth = .5;
        ctx.beginPath(); ctx.moveTo(.8, -4.6 * taper); ctx.quadraticCurveTo(-.6, 0, .8, 5 * taper); ctx.stroke(); ctx.restore();
        const awnLength = (barley?47:22) + rng() * (barley?30:21), fan = side * (.18 + rng() * .28);
        const ax = Math.cos(p.a + fan), ay = Math.sin(p.a + fan);
        ctx.strokeStyle = `rgba(${221 + shade},${190 + shade},${130 + shade},${.65 + rng() * .25})`;
        ctx.lineWidth = .55 + rng() * .35;
        ctx.beginPath(); ctx.moveTo(gx + dx * 4, gy + dy * 4);
        ctx.quadraticCurveTo(gx + ax * awnLength * .55, gy + ay * awnLength * .55,
          gx + ax * awnLength, gy + ay * awnLength); ctx.stroke();
      }
    }
    ctx.restore();
  }
  // A restrained six-percent chroma boost, baked once into RGB only.
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
  for(let i=0;i<pixels.data.length;i+=4){if(!pixels.data[i+3])continue;const a=pixels.data,l=.2126*a[i]+.7152*a[i+1]+.0722*a[i+2];for(let c=0;c<3;c++)a[i+c]=Math.max(0,Math.min(255,Math.round(l+(a[i+c]-l)*1.06)));}
  if(barley)for(let i=0;i<pixels.data.length;i+=4){pixels.data[i]*=.78;pixels.data[i+1]*=.69;pixels.data[i+2]*=.70;}
  ctx.putImageData(pixels,0,0);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace; texture.magFilter = T.LinearFilter;
  texture.minFilter = T.LinearMipmapLinearFilter; texture.generateMipmaps = true;
  texture.name = barley?'procedural-long-awn-barley-atlas':'procedural-ripe-wheat-atlas'; return texture;
}

function stubbleAtlas(){
 const c=document.createElement('canvas');c.width=1536;c.height=384;const ctx=c.getContext('2d'),r=random(0x572bb3);
 for(let v=0;v<3;v++){ctx.save();ctx.beginPath();ctx.rect(v*512+2,0,508,384);ctx.clip();ctx.translate(v*512,0);
  for(let i=0;i<21;i++){const x=8+r()*496,y=360+r()*24,top=90+r()*180,lean=(r()-.5)*26;
   ctx.strokeStyle='#6f573b';ctx.lineWidth=3+r()*2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+lean,top);ctx.stroke();
   ctx.strokeStyle='#b29763';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x-1,y);ctx.lineTo(x+lean-1,top+3);ctx.stroke();
   ctx.fillStyle='#d1b878';ctx.fillRect(x+lean-2,top,4,2);
   ctx.strokeStyle='#98815a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,364);ctx.lineTo(x+(r()-.5)*130,342+r()*35);ctx.stroke();
  }ctx.restore();
 }const t=new T.CanvasTexture(c);t.name='procedural cut stalks and fallen straw';t.colorSpace=T.SRGBColorSpace;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;return t;
}

function cardGeometry(top=1.77,breadth=.48) {
  const p = [], uv = [], normals = [];
  const vertex = (x, y, z, u, v) => { p.push(x, y, z); uv.push(u, v); normals.push(0, 1, 0); };
  for (let side = 0; side < 3; side++) {
    const a = side * Math.PI / 3, x = Math.cos(a) * breadth, z = Math.sin(a) * breadth;
    // Inset UVs prevent one atlas tile from bleeding into the neighbouring tile.
    const u0 = (side * 512 + 2) / 1536, u1 = ((side + 1) * 512 - 2) / 1536;
    vertex(-x, 0, -z, u0, 0); vertex(x, 0, z, u1, 0); vertex(x, top, z, u1, 1);
    vertex(-x, 0, -z, u0, 0); vertex(x, top, z, u1, 1); vertex(-x, top, -z, u0, 1);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
  g.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); exactIndexGeometry(g, T); return g;
}

// Three distinct ear profiles, each 220 triangles. Kernels have depth from every azimuth.
function detailedGeometry(variant) {
  const positions = [], colors = [], grains = [];
  const palette = ['#b99a5b', '#dfc58c', '#d0af70', '#bb9656', '#a18850'].map(c => {const v=new T.Color(c),l=.2126*v.r+.7152*v.g+.0722*v.b;v.setRGB(l+(v.r-l)*1.06,l+(v.g-l)*1.06,l+(v.b-l)*1.06);return v});
  const tri = (a, b, c, tone) => {
    positions.push(...a, ...b, ...c); const col = palette[tone];
    for (let i = 0; i < 3; i++) colors.push(col.r, col.g, col.b);
  };
  const quad = (a, b, c, d, tone) => { tri(a, b, c, tone); tri(a, c, d, tone); };
  const add = (a, b, scale = 1) => a.map((v, i) => v + b[i] * scale);
  const profiles = [
    { x: .085, y: 1.205, z: -.013, start: .12, curve: .46, length: .244 },
    { x: .222, y: 1.238, z: .032, start: .62, curve: .57, length: .252 },
    { x: .306, y: 1.183, z: -.027, start: 1.08, curve: .93, length: .260 }
  ];
  const p = profiles[variant], end = [p.x, p.y, p.z];
  const c1 = [-.017, .43, -p.z * .3], c2 = [p.x - Math.sin(p.start) * .31, p.y - Math.cos(p.start) * .31, p.z * .65];
  const stem = t => [0, 1, 2].map(i => 3 * (1 - t) ** 2 * t * c1[i] + 3 * (1 - t) * t * t * c2[i] + t ** 3 * end[i]);
  const head = t => {
    const a = p.start + p.curve * t;
    return [p.x + p.length * (Math.cos(p.start) - Math.cos(a)) / p.curve,
      p.y + p.length * (Math.sin(a) - Math.sin(p.start)) / p.curve,
      p.z + Math.sin(t * Math.PI) * .006];
  };
  const tube = (path, segments, radius, tone) => {
    for (let i = 0; i < segments; i++) for (let side = 0; side < 3; side++) {
      const a = path(i / segments), b = path((i + 1) / segments);
      const r0 = radius * (1 - .27 * i / segments), r1 = radius * (1 - .27 * (i + 1) / segments);
      const angle = side * TAU / 3, next = (side + 1) * TAU / 3;
      const offset = (v, angle, r) => [v[0] + Math.cos(angle) * r, v[1], v[2] + Math.sin(angle) * r];
      quad(offset(a, angle, r0), offset(a, next, r0), offset(b, next, r1), offset(b, angle, r1), tone);
    }
  };
  tube(stem, 5, .0048, 0); tube(head, 3, .0030, 2);
  // Long, slim, slightly twisted dry blades. Width is only 8–13 mm.
  for (let leaf = 0; leaf < 2; leaf++) {
    const root = stem(.28 + leaf * .27), angle = variant * .9 + leaf * 2.8;
    const reach = .22 + leaf * .045, dx = Math.cos(angle), dz = Math.sin(angle);
    const center = t => [root[0] + dx * reach * t, root[1] + .14 * Math.sin(t * Math.PI) - .07 * t,
      root[2] + dz * reach * t + .025 * Math.sin(t * Math.PI)];
    for (let segment = 0; segment < 3; segment++) {
      const t0 = segment / 3, t1 = (segment + 1) / 3, a = center(t0), b = center(t1);
      const w0 = .001 + .006 * Math.sin((t0 + .1) / 1.1 * Math.PI), w1 = .0002 + .006 * Math.sin(t1 * Math.PI);
      quad(add(a, [-dz, .18, dx], -w0), add(a, [-dz, .18, dx], w0),
        add(b, [-dz, -.2, dx], w1), add(b, [-dz, -.2, dx], -w1), 4);
    }
  }
  for (let row = 0; row < 8; row++) for (const side of [-1, 1]) {
    const t = .065 + row * .118 + (side > 0 ? .018 : 0), a = p.start + p.curve * t;
    const along = [Math.sin(a), Math.cos(a), 0], across = [Math.cos(a), -Math.sin(a), 0];
    const taper = .71 + .29 * Math.sin((row + 1) / 9 * Math.PI);
    const center = add(add(head(t), across, side * .0135 * taper), [0, 0, 1], (row % 2 ? 1 : -1) * .0035);
    const axis = add(along, across, side * .31), tip = add(center, axis, .028 * taper), base = add(center, axis, -.025 * taper);
    const ring = [add(center, across, .012 * taper), add(center, [0, 0, 1], .0105 * taper),
      add(center, across, -.012 * taper), add(center, [0, 0, 1], -.0105 * taper)];
    const grainStart = positions.length;
    for (let edge = 0; edge < 4; edge++) {
      const next = (edge + 1) % 4;
      tri(base, ring[next], ring[edge], edge % 2 ? 3 : 2);
      tri(tip, ring[edge], ring[next], edge < 2 ? 1 : 2);
    }
    grains.push({ start: grainStart, end: positions.length, center, axis, taper });
    // Crossed tapered bristles remain visible around the head without thick needles.
    const awn = add(add(tip, along, .086 + (7 - row) * .004), across, side * (.026 + row * .003));
    awn[2] += (row % 2 ? 1 : -1) * .017;
    tri(add(tip, across, -.00085), add(tip, across, .00085), awn, 1);
    tri(add(tip, [0, 0, 1], -.0007), add(tip, [0, 0, 1], .0007), awn, 1);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  // Smooth each individual kernel analytically while retaining sharp gaps between glumes.
  const normals = g.attributes.normal.array;
  for (const grain of grains) {
    const length = Math.hypot(...grain.axis), a = grain.axis.map(v => v / length), n = [a[1], -a[0], 0];
    for (let i = grain.start; i < grain.end; i += 3) {
      const q = [positions[i] - grain.center[0], positions[i + 1] - grain.center[1], positions[i + 2] - grain.center[2]];
      const along = (q[0] * a[0] + q[1] * a[1]) / (.026 * grain.taper) ** 2;
      const across = (q[0] * n[0] + q[1] * n[1]) / (.012 * grain.taper) ** 2;
      const nx = a[0] * along + n[0] * across, ny = a[1] * along + n[1] * across, nz = q[2] / (.0105 * grain.taper) ** 2;
      const norm = Math.hypot(nx, ny, nz); normals[i] = nx / norm; normals[i + 1] = ny / norm; normals[i + 2] = nz / norm;
    }
  }
  g.computeBoundingBox(); g.computeBoundingSphere();
  g.name = ['wheat-upright-ear', 'wheat-arched-ear', 'wheat-nodding-ear'][variant]; exactIndexGeometry(g, T); return g;
}

function detailGeometries() {
  return detailTemplates || (detailTemplates = Array.from({ length: DETAIL_VARIANTS }, (_, i) => i<3?detailedGeometry(i):i<6?createBarleyGeometry(T,i-3):createStubbleGeometry(T,i-6)));
}

function animateMaterial(material, wind, { cards = false, detail = false, solidDetail = false, canopy = false, detailRadius, viewCenter } = {}) {
  const fadingDetail = detail && !solidDetail;
  material.onBeforeCompile = shader => {
    shader.uniforms.uTime = wind.time; shader.uniforms.uPlayer = wind.player; shader.uniforms.uWind = wind.strength;
    if (viewCenter) shader.uniforms.uWheatView = viewCenter;
    if (fadingDetail) shader.uniforms.uDetailRadius = detailRadius;
    shader.vertexShader = 'uniform float uTime; uniform vec3 uPlayer; uniform float uWind;\n' +
      (viewCenter ? 'uniform vec3 uWheatView;\n' : '') + (fadingDetail ? 'uniform float uDetailRadius; varying float vWheatRange;\n' : '') +
      (canopy ? 'varying vec3 vWheatWorld;\n' : '') + shader.vertexShader;
    // A whole stem outside the existing detail radius had zero fragment coverage.
    // Clip it before normals, wind, player deformation and projection are evaluated.
    if (fadingDetail) shader.vertexShader = shader.vertexShader.replace('void main() {', `void main() {
      vec3 wheatRoot = (modelMatrix * instanceMatrix * vec4(0.,0.,0.,1.)).xyz;
      vWheatRange = length(wheatRoot.xz - uWheatView.xz);
      if (vWheatRange >= uDetailRadius) { gl_Position = vec4(0., 0., 2., 1.); return; }
    `);
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      ${fadingDetail ? '' : `vec3 wheatRoot = (modelMatrix * ${canopy ? '' : 'instanceMatrix *'} vec4(0.,0.,0.,1.)).xyz;`}
      ${canopy ? 'wheatRoot = (modelMatrix * vec4(position, 1.)).xyz; vWheatWorld = wheatRoot;' : ''}
      float phase = wheatRoot.x * .22 + wheatRoot.z * .17;
      float bend = pow(max(position.y, 0.), 2.);
      float sway = sin(uTime * 1.3 + phase) + .28 * sin(uTime * 2.1 + phase * 2.8);
      ${canopy ? '' : `vec3 wheatWind = transpose(mat3(instanceMatrix)) * vec3(sway * .040, 0., cos(uTime * .94 + phase) * .024);
      transformed.xz += wheatWind.xz * bend * uWind;
      vec2 away = wheatRoot.xz - uPlayer.xz; float d = length(away);
      vec2 push = away / max(d, .01) * (1. - smoothstep(.18, 1.15, d));
      vec3 localPush = transpose(mat3(instanceMatrix)) * vec3(push.x, 0., push.y);
      transformed.xz += localPush.xz * bend * .3;
      transformed.y -= length(push) * bend * .18;`}
    `);
    // Shared upward normals light both card faces evenly; the grain meshes retain volume shading.
    if (cards) shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_begin>',
      '#include <normal_fragment_begin>\n#ifdef DOUBLE_SIDED\n normal *= faceDirection;\n#endif');
    if (fadingDetail) {
      shader.fragmentShader = 'uniform float uDetailRadius; varying float vWheatRange;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        float detailFade = 1. - smoothstep(uDetailRadius - 2.5, uDetailRadius, vWheatRange);
        float detailPattern = fract(dot(floor(gl_FragCoord.xy), vec2(.754877666, .569840296)));
        if (detailFade < .001 || detailPattern > detailFade) discard;
      `);
    }
    if (canopy) {
      shader.fragmentShader = 'uniform vec3 uWheatView; varying vec3 vWheatWorld;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        float canopyFade = smoothstep(25., 42., length(vWheatWorld.xz - uWheatView.xz));
        float screenPattern = fract(dot(floor(gl_FragCoord.xy), vec2(.754877666, .569840296)));
        if (canopyFade < .001 || screenPattern > canopyFade) discard;
      `);
    }
  };
  material.customProgramCacheKey = () => `dense-wheat-v7-${cards}-${detail}-${solidDetail}-${canopy}`;
}

function getResources(wind) {
  if (resources) return resources;
  const atlas = wheatAtlas(), barleyAtlas=wheatAtlas(true), cards = cardGeometry(), detailed = detailGeometries();
  const cardMaterial = new T.MeshStandardMaterial({ color: 0xffffff, map: atlas,
    side: T.DoubleSide, alphaTest: .17, roughness: 1 });
  const barleyCards=cardMaterial.clone();barleyCards.map=barleyAtlas;barleyCards.name='mature brown barley / long awn cards';
  const cutAtlas=stubbleAtlas(),stubbleCards=cardGeometry(.34,.46),stubbleMaterial=cardMaterial.clone();stubbleMaterial.map=cutAtlas;stubbleMaterial.name='harvested stalk silhouettes';
  const detailMaterial = new T.MeshStandardMaterial({ color: 0xffffff, side: T.DoubleSide, vertexColors: true, roughness: .92 });
  const detailCoreMaterial = new T.MeshStandardMaterial({ color: 0xffffff, side: T.DoubleSide, vertexColors: true, roughness: .92 });
  detailMaterial.name = 'Wheat detail / fading fringe'; detailCoreMaterial.name = 'Wheat detail / fully covered core';
  const canopyMaterial = new T.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, side: T.DoubleSide, roughness: 1 });
  const detailRadius = { value: 11 }, viewCenter = { value: new T.Vector3() };
  animateMaterial(cardMaterial, wind, { cards: true, detail:true, detailRadius:{value:45}, viewCenter });animateMaterial(barleyCards,wind,{cards:true,detail:true,detailRadius:{value:45},viewCenter});
  animateMaterial(stubbleMaterial,wind,{cards:true,detail:true,detailRadius:{value:45},viewCenter});
  animateMaterial(detailMaterial, wind, { detail: true, detailRadius, viewCenter });
  animateMaterial(detailCoreMaterial, wind, { detail: true, solidDetail: true, detailRadius, viewCenter });
  animateMaterial(canopyMaterial, wind, { canopy: true, viewCenter });
  for (const resource of [atlas,barleyAtlas,barleyCards,stubbleMaterial,cutAtlas,stubbleCards, cards, ...detailed, cardMaterial, detailMaterial, detailCoreMaterial, canopyMaterial]) shared.add(resource);
  resources = { atlas,barleyAtlas,barleyCards,stubbleMaterial,stubbleCards, cards, detailed, cardMaterial, detailMaterial, detailCoreMaterial, canopyMaterial, detailRadius, viewCenter };
  return resources;
}

function canopyGeometry(f) {
 const p=[],c=[],step=64/42,rng=random(f.seed^0xaaa818),col=new T.Color(),crop={};
 const vertex=(x,z,kind)=>{
  const h=.112+rng()*.012,s=(.35+rng()*.09)*1.06,l=.40+rng()*.085;
  p.push(x,surfaceHeight(x,z,f)+(kind===1?.99:1.055)+Math.sin(x*1.8+z)*.045+Math.sin(x*.51-z*.34)*.055,z);
  col.setHSL(kind===1?.086:h,kind===1?.30:s,kind===1?l*.68:l);c.push(col.r,col.g,col.b);
 };
 for(let j=0;j<42;j++)for(let i=0;i<42;i++){const x=i*step,z=j*step;
  if(![[x,z],[x+step,z],[x,z+step],[x+step,z+step]].every(([a,b])=>wheatAllowed(a,b,f)))continue;
  const kind=cropSample(x+step*.5,z+step*.5,f,crop).crop;
  if(kind===2){for(let i=0;i<18;i++)rng();continue;}
  vertex(x,z,kind);vertex(x,z+step,kind);vertex(x+step,z+step,kind);vertex(x,z,kind);vertex(x+step,z+step,kind);vertex(x+step,z,kind);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.computeVertexNormals();return g;
}
export function buildDenseWheat(f,level,quality,wind){
 const group=new T.Group();
 if(level>0){group.userData.wheat={clumps:0,crops:[0,0,0],detailLevel:level,geometryRadius:45};return {mesh:group,candidates:[]};}
 const r=getResources(wind),roots=[[],[],[]],crop={};
 // Preserve V32's five random draws per wheat lattice point, before any masks.
 // Barley's independent denser stream cannot change a single wheat transform.
 for(let pass=0;pass<2;pass++){
  const spacing=(quality==='low'?.98:.80)*(pass===1?.80:1),rng=random(f.seed^(pass===1?0x3b42d91:0x72ac0f));
  for(let z=.65;z<63.4;z+=spacing)for(let x=.65;x<63.4;x+=spacing){
   const xx=x+(rng()-.5)*spacing*.58,zz=z+(rng()-.5)*spacing*.58,a=rng()*TAU,s=.84+rng()*.29,tone=.89+rng()*.11;
   cropSample(xx,zz,f,crop);if((pass===1)!==(crop.crop===1)||!wheatAllowed(xx,zz,f))continue;
   roots[crop.crop].push({x:xx,z:zz,a,s,tone});
  }
 }
 for(let kind=0;kind<3;kind++){
  if(!roots[kind].length)continue;const stubble=kind===2,mesh=new T.InstancedMesh(stubble?r.stubbleCards:r.cards,stubble?r.stubbleMaterial:kind===1?r.barleyCards:r.cardMaterial,roots[kind].length),width=(quality==='low'?1.25:1.05)*(kind===1?1.08:1);
  roots[kind].forEach((root,i)=>{dummy.position.set(root.x,surfaceHeight(root.x,root.z,f)-(kind===0?.025:.012),root.z);dummy.rotation.set(0,root.a,0);dummy.scale.set(stubble?1:width,stubble?1:root.s,stubble?1:width);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);tint.setRGB(root.tone,root.tone*.987,root.tone*.953);mesh.setColorAt(i,tint)});
  mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();if(mesh.boundingSphere)mesh.boundingSphere.radius+=1.2;mesh.receiveShadow=true;mesh.name=['dense-wheat-cards','dense-barley-cards','harvested-stubble-and-straw'][kind];group.add(mesh);
 }
 // Distant crop colour/waves are shaded on the existing ground, never another canopy mesh.
 group.userData.wheat={clumps:roots[0].length+roots[1].length,silhouettesPerClump:39,detailLevel:level,variants:9,crops:roots.map(a=>a.length)};
 return{mesh:group,candidates:wheatCandidates(f)};
}

const DETAIL_PATCH_SIZE = 6, DETAIL_SPACING = .305, DETAIL_BOUND_PADDING = 1.5;
// Radius tests use CPU doubles; leave 1 mm for Float32 instance/uniform rounding.
const DETAIL_CORE_GUARD = .001;
const qualityDetail = quality => ({ radius: quality === 'high' ? 14 : quality === 'low' ? 8 : 11,
  keep: quality === 'high' ? 1 : quality === 'low' ? .64 : .83 });

// Run in the chunk worker. Every lattice point has its own original RNG stream.
// No atlas, material, DOM, collision, camera or renderer work is needed here.
export function prepareWheatDetail(f, quality = 'balanced') {
  const { keep } = qualityDetail(quality), patches = new Map(), geometries = detailGeometries();
  const temporary = new T.Object3D(), color = new T.Color(), transformedBox = new T.Box3(),crop={};
  for(let pass=0;pass<2;pass++){
  const spacing=pass===1?.245:DETAIL_SPACING,last=Math.floor(CHUNK/spacing);
  for (let iz = 0; iz <= last; iz++) for (let ix = 0; ix <= last; ix++) {
    const rng = random(f.seed ^ Math.imul(ix, 734287) ^ Math.imul(iz, 912931));
    const x = (ix + .10 + rng() * .78) * spacing, z = (iz + .10 + rng() * .78) * spacing;
    const selection = rng(), baseVariant = Math.floor(rng() * 3);
    cropSample(x,z,f,crop);if((pass===1)!==(crop.crop===1)||crop.crop===2&&(ix%3!==0||iz%3!==0))continue;const variant=baseVariant+crop.crop*3;
    if (selection > keep || !wheatAllowed(x, z, f)) continue;
    const key = `${Math.floor(x / DETAIL_PATCH_SIZE)},${Math.floor(z / DETAIL_PATCH_SIZE)},${variant}`;
    let patch = patches.get(key);
    if (!patch) {
      patch = { key, variant, matrices: [], colors: [], roots: [], box: new T.Box3(),
        rootBounds: [Infinity, Infinity, -Infinity, -Infinity] };
      patches.set(key, patch);
    }
    temporary.position.set(x, surfaceHeight(x, z, f) - .012, z);
    temporary.rotation.set((rng() - .5) * .18, rng()*TAU, (rng() - .5) * .20);
    const breadth = .84 + rng() * .31, stature = .82 + rng() * .32;
    temporary.scale.set(breadth, stature, breadth); temporary.updateMatrix();
    patch.matrices.push(...temporary.matrix.elements); patch.roots.push(x, z);
    const shade = .90 + rng() * .10;
    color.setRGB(shade, shade * (.96 + rng() * .035), shade * (.91 + rng() * .07));
    patch.colors.push(color.r, color.g, color.b);
    transformedBox.copy(geometries[variant].boundingBox).applyMatrix4(temporary.matrix); patch.box.union(transformedBox);
    patch.rootBounds[0] = Math.min(patch.rootBounds[0], x); patch.rootBounds[1] = Math.min(patch.rootBounds[1], z);
    patch.rootBounds[2] = Math.max(patch.rootBounds[2], x); patch.rootBounds[3] = Math.max(patch.rootBounds[3], z);
  }
  }
  let count = 0, byteLength = 0;
  const result = [...patches.values()].map(p => {
    const matrices = new Float32Array(p.matrices), colors = new Float32Array(p.colors), roots = new Float64Array(p.roots);
    // Covers the original ear geometry, max wind, tilt, and player-push deformation.
    const box = p.box.expandByScalar(DETAIL_BOUND_PADDING), sphere = box.getBoundingSphere(new T.Sphere());
    count += colors.length / 3; byteLength += matrices.byteLength + colors.byteLength + roots.byteLength;
    return { key: p.key, variant: p.variant, count: colors.length / 3, matrices, colors, roots,
      rootBounds: p.rootBounds, bounds: [...box.min.toArray(), ...box.max.toArray()],
      center: sphere.center.toArray(), radius: sphere.radius };
  });
  return { version: 1, quality, spacing: DETAIL_SPACING, barleySpacing:.245, patchSize: DETAIL_PATCH_SIZE, count, byteLength, patches: result };
}

// A finite global pool: three silhouette draws and nine detailed stem draws.
// Source arrays remain CPU-only. Only roots inside the actual camera circle are
// copied into GPU instance buffers; no hidden distant instance is submitted.
export function createWheatDetailLayer(wind, { onMesh } = {}) {
 const r=getResources(wind),object=new T.Group(),pools=new Map();let lastSignature='';
 object.name='camera-local-cereals';object.count=0;object.userData.wheat={geometryRadius:45};
 const pool=(key,geometry,material,capacity)=>{
  let m=pools.get(key);if(m)return m;
  m=new T.InstancedMesh(geometry,material,capacity);m.count=0;
  m.instanceMatrix.setUsage(T.DynamicDrawUsage);
  m.instanceColor=new T.InstancedBufferAttribute(new Float32Array(capacity*3),3).setUsage(T.DynamicDrawUsage);
  m.name=key;m.frustumCulled=false;m.receiveShadow=true;object.add(m);pools.set(key,m);onMesh?.(m);return m;
 };
 function push(mesh,matrices,colors,i,ox,oz){
  const j=mesh.count++;if(j>=mesh.instanceMatrix.count)throw Error('Cereal radius pool capacity exceeded');
  mesh.instanceMatrix.array.set(matrices.subarray(i*16,i*16+16),j*16);
  mesh.instanceMatrix.array[j*16+12]+=ox;mesh.instanceMatrix.array[j*16+14]+=oz;
  mesh.instanceColor.array.set(colors.subarray(i*3,i*3+3),j*3);
 }
 function update(chunks,player,quality,originKey){
  r.viewCenter.value.copy(player);const {radius}=qualityDetail(quality);r.detailRadius.value=radius;
  const signature=`${player.x}:${player.z}:${quality}:${originKey}:`+[...chunks.values()].map(c=>c.group.uuid).join(',');
  if(signature===lastSignature)return;lastSignature=signature;
  for(const m of pools.values())m.count=0;
  let sourceStems=0,activeStems=0,cards=0,maxRootDistance=0;
  for(const chunk of chunks.values()){
   const ox=chunk.group.position.x,oz=chunk.group.position.z,px=player.x-ox,pz=player.z-oz;
   // CPU-only silhouettes from near tiles. They must never be drawn separately.
   chunk.group.traverse(m=>{
    if(!m.isInstancedMesh||!['dense-wheat-cards','dense-barley-cards','harvested-stubble-and-straw'].includes(m.name))return;
    m.visible=false;const a=m.instanceMatrix.array,c=m.instanceColor.array;
    if(px< -45||px>109||pz< -45||pz>109)return;
    let target;
    for(let i=0;i<m.count;i++){const d=(a[i*16+12]-px)**2+(a[i*16+14]-pz)**2;if(d>2025)continue;
     target ||= pool('local-'+m.name,m.geometry,m.material,22000);push(target,a,c,i,ox,oz);cards++;maxRootDistance=Math.max(maxRootDistance,Math.sqrt(d));
    }
   });
   if(px< -radius||px>64+radius||pz< -radius||pz>64+radius)continue;
   if(!chunk.detailPatches)chunk.detailPatches=prepareWheatDetail(chunk.field,chunk.quality||quality);
   sourceStems+=chunk.detailPatches.count;
   for(const patch of chunk.detailPatches.patches){
    const b=patch.rootBounds,dx=Math.max(b[0]-px,0,px-b[2]),dz=Math.max(b[1]-pz,0,pz-b[3]);if(dx*dx+dz*dz>radius*radius)continue;
    let target;for(let i=0;i<patch.count;i++){
     if((patch.roots[i*2]-px)**2+(patch.roots[i*2+1]-pz)**2>radius*radius)continue;
     target ||= pool('local-grain-'+patch.variant,r.detailed[patch.variant],r.detailMaterial,12000);
     push(target,patch.matrices,patch.colors,i,ox,oz);activeStems++;
    }
   }
  }
  let bytes=0,draws=0;for(const m of pools.values()){
   m.visible=m.count>0;if(!m.visible)continue;draws++;
   for(const a of [m.instanceMatrix,m.instanceColor]){a.clearUpdateRanges();a.addUpdateRange(0,m.count*a.itemSize);a.needsUpdate=true;bytes+=m.count*a.itemSize*4;}
  }
  object.count=activeStems;Object.assign(object.userData.wheat,{activeStems,cards,sourceStems,draws,maxRootDistance,uploadBytes:bytes,originKey});
 }
 return {object,update,dispose(){for(const m of pools.values())m.dispose();pools.clear();object.clear();}};
}

export function isSharedWheatResource(resource) { return shared.has(resource); }
