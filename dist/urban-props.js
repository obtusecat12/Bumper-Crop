import * as THREE from './vendor/three.module.min.js';

// Municipal street furniture, in metres. All origins rest on y=0; +z is front.
// Parts are handed to the host batch builder, so a street of these has no
// per-object draw calls. Additional host material keys: lamp, signalRed.
const PI = Math.PI;
const TAU = PI * 2;
const geometry = new Map();
function cached(key, make) {
  if (!geometry.has(key)) geometry.set(key, make());
  return geometry.get(key);
}
const leafGeometry = () => cached('leaf', () => {const g=new THREE.IcosahedronGeometry(1,0),p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++){const l=Math.hypot(p.getX(i),p.getY(i),p.getZ(i));n.setXYZ(i,p.getX(i)/l,p.getY(i)/l,p.getZ(i)/l);}return g;});
const cubeGeometry = () => cached('cube', () => new THREE.BoxGeometry(1, 1, 1));
// Branch ends terminate inside another limb, soil, or foliage, so caps add no
// visible surface. Six open sides keep a complete tree below 1,600 triangles.
const taperGeometry = () => cached('branch', () => new THREE.CylinderGeometry(.65, 1, 1, 6, 1, true));
function random(seed) {
  let n = (seed | 0) || 1;
  return () => { n = (Math.imul(n, 1664525) + 1013904223) | 0; return (n >>> 0) / 4294967296; };
}
function ringGeometry(radius, tube, segments = 20, tubeSegments = 4) {
  return cached(`ring-${radius}-${tube}-${segments}-${tubeSegments}`, () =>
    new THREE.TorusGeometry(radius, tube, tubeSegments, segments));
}
function ring(b, key, x, y, z, radius, tube, tone = 1, segments = 20) {
  b.add(ringGeometry(radius, tube, segments), key, x, y, z, 1, 1, 1, 0, PI / 2, 0, tone);
}
function roundedBoxGeometry(w, h, d, r) {
  return cached(`round-${w}-${h}-${d}-${r}`, () => {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 2, steps: 1 });
    g.translate(0, 0, -d / 2);
    return g;
  });
}
function branch(b, from, to, radius, tone = 1) {
  const dx = to[0] - from[0], dy = to[1] - from[1], dz = to[2] - from[2];
  const length = Math.hypot(dx, dy, dz);
  if (length < .001) return;
  b.add(taperGeometry(), 'bark', (from[0] + to[0]) / 2, (from[1] + to[1]) / 2,
    (from[2] + to[2]) / 2, radius, length, radius, 0,
    Math.atan2(dz, dy), -Math.asin(dx / length), tone);
}
function bolt(b, x, y, z, radius = .014, tone = .75) {
  b.cylinder('metal', x, y, z, radius, radius, .011, 6, 0, 0, tone);
}
function frontBolt(b, x, y, z, radius = .009) {
  b.cylinder('metal', x, y, z, radius, radius, .007, 6, PI / 2, 0, .72);
}

export function addStreetTree(b, { seed = 1, scale = 1 } = {}) {
  const rng = random(seed), s = scale;
  const at = (p) => p.map(v => v * s);
  const limb = (a, c, radius, tone = 1) => branch(b, at(a), at(c), radius * s, tone);
  // Open iron grate. The individual rails leave genuine slots over recessed soil.
  b.box('dark', 0, -.018 * s, 0, 1.62 * s, .018 * s, 1.62 * s, 0, .77);
  for (const v of [-1, 1]) {
    b.box('metal', v * .80 * s, .018 * s, 0, .055 * s, .037 * s, 1.65 * s, 0, .45);
    b.box('metal', 0, .018 * s, v * .80 * s, 1.65 * s, .037 * s, .055 * s, 0, .45);
  }
  for (let i = -8; i <= 8; i++) {
    const x = i * .089, centerGap = Math.abs(x) < .255;
    if (centerGap) {
      for (const side of [-1, 1]) b.box('metal', x * s, .018 * s, side * .524 * s,
        .024 * s, .032 * s, .48 * s, 0, .43 + (i % 3) * .015);
    } else b.box('metal', x * s, .018 * s, 0, .024 * s, .032 * s, 1.53 * s, 0, .46);
  }
  for (const v of [-1, 1]) b.box('metal', 0, .019 * s, v * .273 * s,
    .58 * s, .035 * s, .029 * s, 0, .45);
  // Flared roots and a branching trunk share endpoints all the way to the twigs.
  const trunk = [[0, .015, 0], [.04, 1.08, .015], [-.035, 2.34, .025], [.075, 3.46, -.035]];
  limb(trunk[0], trunk[1], .245, .85);
  limb(trunk[1], trunk[2], .173, .94);
  limb(trunk[2], trunk[3], .114, 1.01);
  for (let i = 0; i < 6; i++) {
    const a = i * TAU / 6 + .15;
    limb([Math.cos(a) * .28, .035, Math.sin(a) * .28], [.025, .46, 0], .085, .80);
  }
  for (let i = 0; i < 7; i++) {
    const a = i * TAU / 7 + (rng() - .5) * .28;
    const y = 1.90 + i * .155;
    // Exact interpolation along the trunk keeps every fork physically joined.
    const t = y < 2.34 ? (y - 1.08) / 1.26 : (y - 2.34) / 1.12;
    const p = y < 2.34 ? [.04 - .075 * t, y, .015 + .01 * t] : [-.035 + .11 * t, y, .025 - .06 * t];
    const elbow = [Math.cos(a) * .67, y + .69, Math.sin(a) * .67];
    const tip = [Math.cos(a) * (1.35 + rng() * .25), 3.90 + rng() * .30, Math.sin(a) * 1.50];
    limb(p, elbow, .094 - i * .004, .90);
    limb(elbow, tip, .057 - i * .002, .95);
    for (let j = -1; j <= 1; j += 2) {
      const a2 = a + j * .37;
      limb(tip, [Math.cos(a2) * 2.10, 4.27 + rng() * .45, Math.sin(a2) * 2.05], .028, 1.03);
    }
  }
  // Thirty-six interlocking, rotated 20-triangle clusters: scalloped silhouette,
  // an irregular crown, and a visibly darker undersurface, without a blob stack.
  const crowns = [
    { count: 12, radius: 1.88, y: 4.20, size: [.90, .72, .89], tone: .80 },
    { count: 12, radius: 1.24, y: 4.72, size: [1.06, .89, 1.04], tone: .98 },
    { count: 7, radius: .87, y: 5.32, size: [1.02, .69, .99], tone: 1.08 },
    { count: 5, radius: 1.10, y: 3.78, size: [.96, .48, .88], tone: .61 }
  ];
  crowns.forEach((layer, l) => {
    for (let i = 0; i < layer.count; i++) {
      const a = i * TAU / layer.count + l * .61 + (rng() - .5) * .22;
      const r = layer.radius * (.88 + rng() * .23);
      const size = layer.size.map(v => v * (.84 + rng() * .30) * s);
      b.add(leafGeometry(), 'foliage', Math.cos(a) * r * s,
        (layer.y + (rng() - .5) * .26) * s, Math.sin(a) * r * s,
        ...size, rng() * TAU, (rng() - .5) * .36, (rng() - .5) * .27,
        layer.tone + (rng() - .5) * .13);
    }
  });
  b.circle(0, 0, .25 * s);
}

export function addHydrant(b) {
  b.cylinder('metal', 0, .035, 0, .19, .19, .07, 12, 0, 0, .65);
  b.cylinder('yellow', 0, .10, 0, .145, .155, .07, 12, 0, 0, .79);
  b.cylinder('yellow', 0, .365, 0, .113, .137, .47, 12, 0, 0, .93);
  b.cylinder('yellow', 0, .605, 0, .146, .146, .045, 12, 0, 0, .86);
  b.cylinder('yellow', 0, .655, 0, .061, .142, .075, 12, 0, 0, 1.04);
  b.cylinder('yellow', 0, .714, 0, .042, .046, .056, 6, 0, 0, .82);
  for (const side of [-1, 1]) {
    b.cylinder('yellow', side * .16, .45, 0, .065, .076, .14, 10, 0, PI / 2, .94);
    b.cylinder('yellow', side * .24, .45, 0, .083, .083, .04, 10, 0, PI / 2, .87);
    b.cylinder('yellow', side * .267, .45, 0, .033, .034, .028, 6, 0, PI / 2, .78);
    // Hanging cap chain, with connected little links.
    for (let j = 0; j < 5; j++) b.add(ringGeometry(.012, .004, 6, 3), 'metal',
      side * (.232 - .015 * j), .402 - Math.sin(j * PI / 6) * .11, .033,
      1, 1, 1, j % 2 ? PI / 2 : 0, 0, 0, .58);
  }
  b.cylinder('yellow', 0, .365, .135, .088, .089, .10, 12, PI / 2, 0, .88);
  b.cylinder('yellow', 0, .365, .197, .047, .047, .025, 6, PI / 2, 0, .73);
  for (let i = 0; i < 4; i++) bolt(b, Math.cos(i * PI / 2 + PI / 4) * .14, .079,
    Math.sin(i * PI / 2 + PI / 4) * .14, .016);
  b.circle(0, 0, .27);
}

export function addStreetLight(b, { height = 9, arm = 3 } = {}) {
  b.box('metal', 0, .035, 0, .36, .07, .36, 0, .65);
  for (const x of [-.125, .125]) for (const z of [-.125, .125]) bolt(b, x, .08, z, .024);
  b.cylinder('metal', 0, .20, 0, .132, .17, .28, 10, 0, 0, .69);
  const bendStart = height - Math.min(.88, arm * .45);
  b.cylinder('metal', 0, (bendStart + .25) / 2, 0, .064, .111, bendStart - .25, 10, 0, 0, .80);
  // Eight connected segments describe an actual gooseneck instead of a T bar.
  let p = [0, bendStart, 0];
  for (let i = 1; i <= 8; i++) {
    const t = i / 8, angle = t * PI / 2;
    const q = [arm * (1 - Math.cos(angle)), bendStart + (height - bendStart) * Math.sin(angle), 0];
    b.rod('metal', p, q, .066 - t * .018); p = q;
  }
  b.add(roundedBoxGeometry(.72, .18, .32, .07), 'metal', arm + .16, height - .04, 0, 1, 1, 1, 0, 0, -.10, .78);
  b.box('lamp', arm + .20, height - .143, 0, .49, .035, .235, 0, .85);
  b.box('dark', 0, .66, .101, .082, .23, .008, 0, .70);
  frontBolt(b, 0, .77, .108, .010); frontBolt(b, 0, .55, .108, .010);
  b.circle(0, 0, .18);
}

const hoodGeometry = () => cached('signal-hood', () => {
  const vertices = [], indices = [];
  for (let i = 0; i <= 8; i++) {
    const a = i * PI / 8;
    vertices.push(Math.cos(a) * .133, Math.sin(a) * .133, 0,
      Math.cos(a) * .133, Math.sin(a) * .133, .205);
    if (i < 8) { const j = i * 2; indices.push(j, j + 1, j + 2, j + 1, j + 3, j + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  g.setIndex(indices); g.computeVertexNormals(); return g;
});
function trafficHead(b, x, y, z) {
  b.add(roundedBoxGeometry(.40, 1.065, .23, .065), 'dark', x, y, z, 1, 1, 1, 0, 0, 0, .69);
  b.box('yellow', x, y, z - .125, .46, 1.14, .038, 0, .69);
  for (let i = 0; i < 3; i++) {
    const ly = y + .335 - i * .335;
    b.cylinder('metal', x, ly, z + .131, .135, .135, .025, 12, PI / 2, 0, .29);
    b.cylinder(i === 0 ? 'signalRed' : i === 1 ? 'yellow' : 'green', x, ly, z + .149,
      .112, .112, .020, 16, PI / 2, 0, i === 0 ? 1 : .15);
    b.add(hoodGeometry(), 'dark', x, ly, z + .142, 1, 1, 1, 0, 0, 0, .69);
  }
}
export function addTrafficSignal(b, { arm = 15, street = 'hope' } = {}) {
  b.box('dark', 0, .04, 0, .46, .08, .46, 0, .80);
  for (const x of [-.16, .16]) for (const z of [-.16, .16]) bolt(b, x, .091, z, .027);
  b.cylinder('dark', 0, 2.86, 0, .092, .159, 5.56, 12, 0, 0, .84);
  b.cylinder('dark', 0, .37, 0, .173, .189, .32, 12, 0, 0, .82);
  // A short swept bend joins the pole to a tapered, gently cambered mast arm.
  const points = [[0, 5.64, 0], [.10, 5.93, 0], [.35, 6.14, 0], [.68, 6.22, 0],
    [arm * .30, 6.26, 0], [arm * .65, 6.30, 0], [arm, 6.23, 0]];
  for (let i = 1; i < points.length; i++) b.rod('dark', points[i - 1], points[i], .10 - i * .009);
  for (const f of [.52, .91]) {
    const x = arm * f, y = 5.32;
    b.rod('dark', [x, 6.27, 0], [x, y + .55, 0], .035);
    b.box('metal', x, 6.25, 0, .12, .08, .15, 0, .34);
    trafficHead(b, x, y, .05);
  }
  // Blue/white cross-street plaque is mounted on two bands just under the arm.
  const signX = Math.min(arm * .24, 2.55);
  b.box('metal', signX, 5.90, .09, 1.86, .37, .034, 0, .59);
  b.sign(street, signX, 5.90, .114, 1.82, .33);
  for (const x of [signX - .52, signX + .52]) b.rod('metal', [x, 5.90, 0], [x, 6.25, 0], .025);
  // Permanently red pedestrian hand on the same pole.
  b.rod('dark', [0, 2.45, 0], [-.36, 2.45, 0], .031);
  b.add(roundedBoxGeometry(.42, .47, .25, .035), 'dark', -.41, 2.45, .05, 1, 1, 1, 0, 0, 0, .78);
  b.box('dark', -.41, 2.45, .184, .345, .398, .015, 0, .36);
  b.box('signalRed', -.407, 2.425, .199, .115, .132, .012);
  for (let i = 0; i < 4; i++) b.box('signalRed', -.459 + i * .034, 2.534 + (i === 0 || i === 3 ? -.017 : 0),
    .200, .024, .103, .012);
  b.box('signalRed', -.487, 2.447, .200, .030, .090, .012, -.24);
  b.box('signalRed', -.407, 2.345, .199, .083, .065, .012);
  b.circle(0, 0, .24);
}

export function addUtilityCabinet(b, { variant = 0 } = {}) {
  const green = variant % 2 === 1, w = green ? .76 : .58, h = green ? 1.32 : 1.08, d = green ? .43 : .36;
  const key = green ? 'green' : 'stucco', tone = green ? .57 : .90;
  b.box('concrete', 0, .055, 0, w + .13, .11, d + .13, 0, .80);
  b.box('metal', 0, .133, 0, w - .035, .05, d - .025, 0, .69);
  b.add(roundedBoxGeometry(w, h, d, .025), key, 0, .16 + h / 2, 0, 1, 1, 1, 0, 0, 0, tone);
  b.box(key, 0, .17 + h, 0, w + .025, .045, d + .027, 0, tone * .94);
  b.box('dark', 0, .16 + h / 2, d / 2 + .003, w - .066, h - .08, .004, 0, .54);
  b.box(key, 0, .16 + h / 2, d / 2 + .010, w - .078, h - .092, .010, 0, tone);
  for (let i = 0; i < 8; i++) {
    const y = .36 + i * .047;
    b.box('dark', -.045, y, d / 2 + .018, w * .58, .017, .009, 0, .38);
    b.box(key, -.045, y + .012, d / 2 + .029, w * .60, .013, .024, 0, tone * .86);
  }
  b.box('metal', w * .30, .69, d / 2 + .038, .027, .13, .033, 0, .65);
  frontBolt(b, w * .30, .602, d / 2 + .037, .012);
  for (const y of [.31, .13 + h]) b.box('metal', -w / 2 + .019, y, d / 2 + .016, .039, .084, .032, 0, tone * .78);
  b.cylinder('metal', w / 2 + .048, .31, -.09, .021, .021, .49, 8, 0, 0, .61);
  b.rod('metal', [w / 2 + .048, .555, -.09], [w / 2 - .01, .555, -.09], .021);
  b.solid(0, 0, w + .12, d + .12);
}

export function addTrashBin(b) {
  b.cylinder('dark', 0, .08, 0, .245, .258, .12, 12, 0, 0, .70);
  // Recessed liner and crumpled bag tops are visible through the open rim.
  b.cylinder('dark', 0, .355, 0, .232, .22, .49, 14, 0, 0, .47);
  b.add(leafGeometry(), 'dark', -.04, .59, .02, .17, .085, .15, .32, .20, -.14, .55);
  b.add(leafGeometry(), 'dark', .10, .585, -.07, .12, .10, .13, -.2, .15, .29, .43);
  for (let i = 0; i < 16; i++) {
    const a = i * TAU / 16;
    b.box('metal', Math.sin(a) * .262, .45, Math.cos(a) * .262, .027, .68, .035, a, .42);
  }
  for (const y of [.135, .48, .785]) ring(b, 'metal', 0, y, 0, .265, y === .785 ? .026 : .015, .45, 16);
  b.circle(0, 0, .30);
}

export function addParkingMeter(b) {
  b.cylinder('metal', 0, .037, 0, .067, .086, .074, 10, 0, 0, .69);
  b.cylinder('metal', 0, .577, 0, .029, .038, 1.08, 8, 0, 0, .78);
  b.add(roundedBoxGeometry(.19, .30, .15, .065), 'metal', 0, 1.236, 0, 1, 1, 1, 0, 0, 0, .84);
  b.add(roundedBoxGeometry(.148, .152, .010, .026), 'dark', 0, 1.289, .080, 1, 1, 1, 0, 0, 0, .58);
  b.add(roundedBoxGeometry(.124, .111, .006, .019), 'glassLight', 0, 1.301, .088, 1, 1, 1, 0, 0, 0, .86);
  for (let i = -2; i <= 2; i++) b.box('dark', i * .019, 1.334 - Math.abs(i) * .009, .094, .004, .016, .003, 0, .65);
  b.box('red', -.013, 1.296, .095, .004, .048, .003, 0, .82);
  b.box('dark', .013, 1.197, .081, .060, .012, .005, 0, .51);
  b.box('metal', .013, 1.188, .087, .067, .007, .012, 0, .69);
  b.cylinder('dark', -.042, 1.137, .082, .026, .026, .025, 10, PI / 2, 0, .73);
  b.box('metal', -.042, 1.137, .101, .042, .008, .012, 0, .88);
  b.box('metal', 0, 1.103, 0, .145, .024, .11, 0, .73);
  b.circle(0, 0, .09);
}

const wheelStopGeometry = () => cached('wheelstop', () => {
  const s = new THREE.Shape();
  s.moveTo(-.79, .014); s.lineTo(.79, .014); s.lineTo(.76, .090);
  s.lineTo(.69, .122); s.lineTo(-.69, .122); s.lineTo(-.76, .090); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: .17, bevelEnabled: true,
    bevelThickness: .012, bevelSize: .009, bevelSegments: 1, curveSegments: 1, steps: 1 });
  g.translate(0, 0, -.085); return g;
});
export function addWheelStop(b) {
  b.add(wheelStopGeometry(), 'concrete', 0, 0, 0, 1, 1, 1, 0, 0, 0, .87);
  for (const x of [-.49, .49]) {
    b.cylinder('dark', x, .125, 0, .028, .028, .008, 8, 0, 0, .61);
    bolt(b, x, .130, 0, .014, .65);
  }
  b.walk(0, 0, 1.58, .194, .13);
}

export function addManhole(b) {
  b.cylinder('dark', 0, .007, 0, .414, .414, .014, 32, 0, 0, .75);
  b.cylinder('metal', 0, .018, 0, .382, .382, .016, 32, 0, 0, .53);
  ring(b, 'metal', 0, .028, 0, .393, .013, .53, 32);
  for (let i = -5; i <= 5; i++) {
    const z = i * .059, span = Math.sqrt(.351 ** 2 - z ** 2) * 2;
    b.box('dark', 0, .028, z, span, .006, .011, 0, .61);
  }
  for (let i = -5; i <= 5; i++) {
    const x = i * .059, span = Math.sqrt(.351 ** 2 - x ** 2) * 2;
    b.box('dark', x, .029, 0, .011, .006, span, 0, .61);
  }
  for (const x of [-.285, .285]) b.box('dark', x, .033, 0, .023, .004, .049, 0, .31);
}

export function addStormDrain(b) {
  b.box('dark', 0, -.017, 0, .68, .018, .38, 0, .50);
  for (const x of [-.322, .322]) b.box('metal', x, .012, 0, .032, .03, .38, 0, .48);
  for (const z of [-.176, .176]) b.box('metal', 0, .012, z, .64, .03, .028, 0, .48);
  for (let i = -4; i <= 4; i++) b.box('metal', 0, .014, i * .035, .62, .028, .014, 0, .44 + (i % 3) * .02);
  // One cross brace underneath the slats, visible through the drainage slots.
  b.box('metal', 0, -.003, 0, .025, .014, .34, 0, .40);
}

export function addStreetSign(b, { kind = 'speed' } = {}) {
  const wide = kind === 'oneway', square = kind === 'pedestrian';
  const w = wide ? .80 : square ? .61 : .48, h = wide ? .285 : square ? .61 : .65;
  const y = wide ? 2.46 : 2.30, top = y + h / 2;
  b.box('metal', 0, top / 2, 0, .047, top, .025, 0, .81);
  b.box('metal', -.024, top / 2, .012, .010, top, .040, 0, .77);
  b.box('metal', .024, top / 2, .012, .010, top, .040, 0, .77);
  for (let i = 0; i < 20; i++) b.box('dark', 0, .15 + i * .083, .016, .010, .013, .003, 0, .66);
  b.add(roundedBoxGeometry(w + .016, h + .016, .014, .024), 'metal', 0, y, .046, 1, 1, 1, 0, 0, 0, .81);
  b.sign(kind, 0, y, .056, w, h);
  for (const dy of [-h * .37, h * .37]) frontBolt(b, 0, y + dy, .065, .007);
  b.circle(0, 0, .062);
}

export function addBench(b) {
  for (const x of [-.62, .62]) {
    for (const z of [-.19, .21]) {
      b.box('metal', x, .019, z, .14, .038, .14, 0, .40);
      bolt(b, x + .043, .042, z, .014);
      b.rod('metal', [x, .039, z], [x, .43, z * .78], .029);
    }
    b.rod('metal', [x, .421, -.22], [x, .421, .24], .028);
    b.rod('metal', [x, .43, -.18], [x, .99, -.32], .026);
    b.rod('metal', [x, .45, .19], [x, .69, .22], .023);
    b.rod('metal', [x, .69, .22], [x, .69, -.245], .029);
  }
  for (let i = 0; i < 5; i++) b.box('bark', 0, .474, -.201 + i * .096, 1.73, .053, .078, 0, .86 + (i % 3) * .05);
  for (let i = 0; i < 4; i++) {
    const y = .635 + i * .097, z = -.223 - (y - .60) * .25;
    b.add(cubeGeometry(), 'bark', 0, y, z, 1.73, .080, .044, 0, -.245, 0, .84 + (i % 3) * .07);
    for (const x of [-.62, .62]) frontBolt(b, x, y, z + .026, .009);
  }
  b.solid(0, -.04, 1.79, .64);
}

export function addBollard(b) {
  b.box('metal', 0, .018, 0, .20, .036, .20, 0, .51);
  for (const x of [-.067, .067]) for (const z of [-.067, .067]) bolt(b, x, .043, z, .015);
  b.cylinder('metal', 0, .448, 0, .068, .076, .82, 12, 0, 0, .44);
  b.cylinder('yellow', 0, .695, 0, .070, .071, .10, 12, 0, 0, .82);
  b.sphere('metal', 0, .858, 0, .068, .042, .068, .46);
  b.circle(0, 0, .10);
}

export function addParkingLot(b, { w = 20, d = 17, seed = 1 } = {}) {
  const rng = random(seed), count = Math.max(1, Math.floor((w - .9) / 2.60));
  const stallWidth = Math.min(2.70, (w - .65) / count), extent = count * stallWidth;
  const rows = d >= 13.7 ? [-1, 1] : [-1];
  for (const row of rows) {
    const center = row * (d / 2 - 2.65);
    for (let i = 0; i <= count; i++) b.box('white', -extent / 2 + i * stallWidth, .009,
      center, .073, .012, 5.10, 0, .82 + rng() * .10);
    for (let i = 0; i < count; i++) {
      b.push(-extent / 2 + (i + .5) * stallWidth, 0, row * (d / 2 - .71));
      addWheelStop(b); b.pop();
    }
  }
}
