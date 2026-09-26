import * as THREE from './vendor/three.module.min.js';

// Additional 1970–1990 street furniture. Metres, ground origin, +Z front.
// All geometry goes through UrbanBatch; no meshes, textures or materials are
// created here. Mount the entire prop using b.push(x, groundY, z, yaw)/b.pop().
// Newspaper print and warning marks are functional, batched geometric graphics.
const PI = Math.PI;
const cache = new Map();
const cached = (key, make) => {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
};
const cube = () => cached('cube', () => new THREE.BoxGeometry(1, 1, 1));
const random = seed => {
  let n = seed >>> 0;
  return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; };
};

function frontBolt(b, x, y, z, radius = .008, tone = .89) {
  b.cylinder('metal', x, y, z, radius, radius, .006, 6, PI / 2, 0, tone);
}
function groundBolt(b, x, y, z, radius = .011) {
  b.cylinder('metal', x, y, z, radius, radius, .009, 6, 0, 0, .89);
}
function sideBolt(b, side, y, z, radius = .009, x = .91) {
  b.cylinder('metal', side * x, y, z, radius, radius, .009, 6, 0, PI / 2, .95);
}

// A face whose outward normal is explicitly selected, avoiding inside-out
// panels when the same glazing shape is reflected onto the other car side.
function polygonGeometry(points, outward = [0, 0, 1]) {
  const a = new THREE.Vector3(...points[0]);
  const normal = new THREE.Vector3(...points[1]).sub(a)
    .cross(new THREE.Vector3(...points[2]).sub(a));
  const axis = Math.abs(normal.x) > Math.abs(normal.y) && Math.abs(normal.x) > Math.abs(normal.z)
    ? 0 : Math.abs(normal.y) > Math.abs(normal.z) ? 1 : 2;
  const project = p => axis === 0 ? new THREE.Vector2(p[1], p[2])
    : axis === 1 ? new THREE.Vector2(p[0], p[2]) : new THREE.Vector2(p[0], p[1]);
  const triangles = THREE.ShapeUtils.triangulateShape(points.map(project), []);
  const target = new THREE.Vector3(...outward);
  const vertices = [], uvs = [];
  for (const triangle of triangles) {
    const [i, j, k] = triangle, start = new THREE.Vector3(...points[i]);
    const n = new THREE.Vector3(...points[j]).sub(start)
      .cross(new THREE.Vector3(...points[k]).sub(start));
    for (const k of n.dot(target) < 0 ? [triangle[0], triangle[2], triangle[1]] : triangle) {
      vertices.push(...points[k]);
      // Remain inside the shared glass shader's first UV cell: no building
      // window blinds, while its view-dependent sky reflection stays active.
      uvs.push(.08 + .08 * (k % 2), .08 + .04 * Math.floor(k / 2));
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.computeVertexNormals();
  return g;
}
function face(b, key, points, outward, tone = 1) {
  const g = polygonGeometry(points, outward);
  b.add(g, key, 0, 0, 0, 1, 1, 1, 0, 0, 0, tone);
  g.dispose();
}
function profilePrism(profile, width) {
  const shape = new THREE.Shape();
  profile.forEach(([z, y], i) => i ? shape.lineTo(z, y) : shape.moveTo(z, y));
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false, steps: 1, curveSegments: 1 });
  g.translate(0, 0, -width / 2);
  g.rotateY(-PI / 2);
  return g;
}

// Tiny 3×5 lettering is appropriate for near-field stencilling and newspaper
// mastheads. Horizontal runs merge adjacent pixels into one batch primitive.
const GLYPH = {
  A:['010','101','111','101','101'], C:['111','100','100','100','111'],
  D:['110','101','101','101','110'], E:['111','100','110','100','111'],
  I:['111','010','010','010','111'], L:['100','100','100','100','111'],
  N:['101','111','111','111','101'], O:['111','101','101','101','111'],
  P:['110','101','110','100','100'], R:['110','101','110','101','101'],
  S:['111','100','111','001','111'], T:['111','010','010','010','010'],
  U:['101','101','101','101','111'], V:['101','101','101','101','010'], W:['101','101','111','111','101'],
  Y:['101','101','010','010','010'], H:['101','101','111','101','101'],
  '0':['111','101','101','101','111'], '1':['010','110','010','010','111'],
  '2':['111','001','111','100','111'], '3':['111','001','111','001','111'],
  '4':['101','101','111','001','001'], '5':['111','100','111','001','111'],
  '6':['111','100','111','101','111'], '7':['111','001','010','010','010'],
  '8':['111','101','111','101','111'], '9':['111','101','111','001','111'],
  ' ':['000','000','000','000','000']
};
function stencil(b, label, x, y, z, width, height, key = 'dark', tone = .8) {
  const cellW = width / Math.max(1, label.length * 4 - 1), cellH = height / 5;
  [...label].forEach((letter, i) => {
    const rows = GLYPH[letter] || GLYPH[' '];
    rows.forEach((row, j) => {
      for (let k = 0; k < 3;) {
        if (row[k] !== '1') { k++; continue; }
        const start = k;
        while (k < 3 && row[k] === '1') k++;
        b.box(key, x - width / 2 + (i * 4 + (start + k) / 2) * cellW,
          y + height / 2 - (j + .5) * cellH, z,
          (k - start) * cellW, cellH * .91, .0018, 0, tone);
      }
    });
  });
}

/** Footprint .56 × .48 m; height 1.24 m. Red, blue or yellow enamel. */
export function addNewspaperBox(b, { color = 'blue', seed = 1 } = {}) {
  const key = ['red', 'blue', 'yellow'].includes(color) ? color : 'blue';
  const rng = random(seed), tone = .76 + rng() * .15;
  // Raised plinth and four separated feet keep the cabinet off wet pavement.
  for (const x of [-.205, .205]) for (const z of [-.145, .145]) {
    b.box('rubber', x, .014, z, .074, .028, .075, 0, .68);
    b.box('metal', x, .117, z, .051, .21, .052, 0, .68);
  }
  b.box(key, 0, .238, 0, .55, .065, .445, 0, tone * .92);
  b.box('dark', 0, .322, 0, .49, .104, .395, 0, .64);
  // Hollow case: the newspaper window has real depth and a surrounding door.
  b.box(key, -.267, .752, 0, .026, .965, .445, 0, tone);
  b.box(key, .267, .752, 0, .026, .965, .445, 0, tone * .95);
  b.box(key, 0, .754, -.211, .51, .96, .024, 0, tone * .88);
  b.box(key, 0, 1.207, 0, .56, .059, .48, 0, tone * 1.04);
  b.box(key, 0, .607, .207, .51, .484, .035, 0, tone);
  b.box(key, 0, 1.144, .207, .51, .098, .035, 0, tone);
  b.box('dark', 0, .968, .183, .47, .259, .016, 0, .65);
  // Newsprint folds and a visible front page, with two printed columns.
  for (let i = 0; i < 4; i++) b.box('white', -.016 + i * .002, .858 + i * .005,
    .193 + i * .002, .343, .008, .081, 0, .66 + i * .04);
  b.box('white', -.007, .966, .211, .351, .231, .009, 0, .89);
  stencil(b, seed % 2 ? 'CITY NEWS' : 'DIARIO', -.007, 1.047, .218, .302, .032, 'dark', .81);
  b.box('dark', -.007, 1.021, .219, .310, .003, .002, 0, .66);
  for (let c = 0; c < 2; c++) for (let row = 0; row < 9; row++) {
    const w = .126 - (row % 4 === 3 ? .029 : 0);
    b.box('dark', -.09 + c * .16, .997 - row * .013, .219,
      w, .004, .002, 0, .40 + (row % 3) * .05);
  }
  // Glazed display frame and a narrow reflected edge leave the type visible.
  for (const x of [-.227, .227]) b.box('metal', x, .969, .229, .020, .263, .026, 0, .73);
  for (const y of [.833, 1.104]) b.box('metal', 0, y, .229, .474, .019, .026, 0, .76);
  b.box('glassLight', .200, .973, .236, .022, .242, .004, 0, .95);
  b.box('glassLight', 0, 1.093, .237, .420, .009, .004, 0, .94);
  // Full hinged outer door, latch, coin plate, return cup and a cast pull.
  for (const x of [-.246, .246]) b.box(key, x, .776, .243, .019, .787, .025, 0, tone * .91);
  for (const y of [.383, 1.171]) b.box(key, 0, y, .243, .51, .019, .025, 0, tone * .88);
  for (const y of [.491, 1.122]) {
    b.cylinder('metal', -.267, y, .242, .014, .014, .081, 8, 0, 0, .69);
    b.box('metal', -.244, y, .237, .041, .050, .008, 0, .75);
  }
  b.box('metal', .146, .711, .238, .111, .113, .015, 0, .9);
  b.box('dark', .146, .729, .248, .046, .008, .006, 0, .51);
  b.box('dark', .146, .682, .249, .037, .025, .005, 0, .60);
  b.box('metal', .146, .668, .262, .054, .011, .033, 0, .83);
  b.rod('metal', [.058, .791, .246], [.058, .791, .282], .009);
  b.rod('metal', [.199, .791, .246], [.199, .791, .282], .009);
  b.rod('metal', [.058, .791, .282], [.199, .791, .282], .013);
  for (const x of [.103, .19]) frontBolt(b, x, .752, .249, .005);
  b.box('white', -.086, .722, .231, .210, .084, .006, 0, .81);
  stencil(b, '25', -.09, .724, .236, .104, .052, 'dark', .84);
  stencil(b, key === 'yellow' ? 'DIARIO' : 'NEWS', 0, .507, .231, .328, .083, 'white', .94);
  // Restrained lower-edge chips retain the enamel body's readable colour.
  for (let i = 0; i < 4; i++) b.box('rust', -.20 + rng() * .40, .412 + rng() * .017,
    .260, .009 + rng() * .020, .007, .002, 0, .72);
  b.solid(0, .012, .57, .54);
}

/** One inverted-U steel rack: .97 m overall width, .93 m tall, .17 m deep. */
export function addBikeRack(b) {
  const tube = cached('bike-rack', () => {
    const p = new THREE.CurvePath();
    const v = (x, y) => new THREE.Vector3(x, y, 0);
    p.add(new THREE.LineCurve3(v(-.42, .038), v(-.42, .70)));
    p.add(new THREE.QuadraticBezierCurve3(v(-.42, .70), v(-.42, .90), v(-.22, .90)));
    p.add(new THREE.LineCurve3(v(-.22, .90), v(.22, .90)));
    p.add(new THREE.QuadraticBezierCurve3(v(.22, .90), v(.42, .90), v(.42, .70)));
    p.add(new THREE.LineCurve3(v(.42, .70), v(.42, .038)));
    return new THREE.TubeGeometry(p, 28, .029, 7, false);
  });
  b.add(tube, 'metal', 0, 0, 0, 1, 1, 1, 0, 0, 0, .98);
  for (const x of [-.42, .42]) {
    b.box('metal', x, .015, 0, .135, .030, .17, 0, .76);
    b.cylinder('metal', x, .046, 0, .043, .043, .032, 10, 0, 0, .84);
    for (const z of [-.054, .054]) groundBolt(b, x, .037, z, .010);
  }
  b.solid(0, 0, .975, .17);
}

/** Wheeled commercial dumpster: 1.89 × 1.12 m, 1.38 m tall. */
export function addDumpster(b) {
  const body = cached('dumpster-body', () => profilePrism([
    [-.445, .28], [.445, .28], [.525, 1.20], [-.525, 1.20]
  ], 1.57));
  b.add(body, 'green', 0, 0, 0, 1, 1, 1, 0, 0, 0, .76);
  b.box('metal', 0, .276, 0, 1.59, .062, .906, 0, .56);
  b.box('dark', 0, 1.206, 0, 1.535, .017, 1.018, 0, .68);
  for (const x of [-.782, .782]) b.box('green', x, 1.206, 0, .047, .071, 1.102, 0, .69);
  for (const z of [-.527, .527]) b.box('green', 0, 1.206, z, 1.62, .071, .047, 0, .67);
  // Two ribbed lids share a real rear hinge pin. Their fronts sit slightly high.
  for (const side of [-1, 1]) {
    const x = side * .407;
    b.add(cube(), 'dark', x, 1.269, .007, .793, .054, 1.10, 0, -.070, 0, .76);
    for (const dx of [-.245, 0, .245]) b.add(cube(), 'dark', x + dx, 1.299, .02,
      .027, .026, .902, 0, -.070, 0, .93);
    b.rod('metal', [x - .10, 1.309, .403], [x - .10, 1.359, .403], .013);
    b.rod('metal', [x + .10, 1.309, .403], [x + .10, 1.359, .403], .013);
    b.rod('metal', [x - .10, 1.359, .403], [x + .10, 1.359, .403], .016);
  }
  b.cylinder('metal', 0, 1.230, -.528, .019, .019, 1.63, 10, 0, PI / 2, .59);
  for (const x of [-.66, -.21, .21, .66]) b.box('metal', x, 1.232, -.497, .083, .045, .094, 0, .53);
  // Side lifting ears have open fork pockets instead of a solid painted blob.
  for (const side of [-1, 1]) {
    const x = side * .863;
    b.box('green', x, .858, 0, .140, .047, .48, 0, .64);
    b.box('green', x, 1.026, 0, .140, .047, .48, 0, .71);
    b.box('green', side * .919, .943, 0, .028, .174, .48, 0, .66);
    for (const z of [-.225, .225]) sideBolt(b, side, .945, z, .015, .939);
  }
  // Rolled front ribs, a small caution label, and weld-like lower seams.
  for (const x of [-.54, 0, .54]) b.add(cube(), 'green', x, .742, .488,
    .031, .826, .025, 0, .083, 0, .84);
  b.box('yellow', -.37, .983, .541, .226, .105, .006, 0, .78);
  stencil(b, 'CAUTION', -.37, .983, .546, .201, .034, 'dark', .78);
  for (const x of [-.654, .654]) for (const z of [-.348, .348]) {
    b.cylinder('metal', x, .238, z, .045, .039, .081, 8, 0, 0, .69);
    for (const dx of [-.053, .053]) b.box('metal', x + dx, .163, z, .018, .118, .076, 0, .65);
    b.cylinder('rubber', x, .101, z, .101, .101, .086, 12, 0, PI / 2, .61);
    b.cylinder('metal', x + .056, .101, z, .036, .036, .014, 8, 0, PI / 2, .80);
  }
  b.solid(0, 0, 1.89, 1.14);
}

function sedanBody() {
  return cached('sedan-body', () => {
    // The complete extruded profile includes wheel-arch cutouts. The tyres
    // remain genuinely exposed from either side, not pasted over a box body.
    const p = [[-2.17, .431], [-1.706, .431]];
    for (const wheelZ of [-1.35, 1.35]) {
      if (wheelZ > 0) p.push([.994, .431]);
      for (let i = 0; i <= 10; i++) {
        const a = 2.813 - i * 2.484 / 10;
        p.push([wheelZ + Math.cos(a) * .377, .31 + Math.sin(a) * .377]);
      }
    }
    p.push([2.17, .431], [2.17, .80], [2.055, .900],
      [1.04, .979], [-1.08, .979], [-2.095, .919], [-2.17, .81]);
    return profilePrism(p, 1.744);
  });
}
function carGlass(b, side) {
  const x = y => side * (.793 - (y - .985) * .235);
  face(b, 'glassLight', [[x(1.007), 1.007, .977], [x(1.375), 1.375, .402],
    [x(1.375), 1.375, -.004], [x(1.007), 1.007, -.004]], [side, 0, 0], .79);
  face(b, 'glassLight', [[x(1.007), 1.007, -.083], [x(1.375), 1.375, -.083],
    [x(1.375), 1.375, -.604], [x(1.007), 1.007, -1.045]], [side, 0, 0], .75);
}

/**
 * Parked sedan, longitudinal +Z: body 1.744 m wide, bumper-to-bumper 4.52 m,
 * mirror envelope 1.98 m, roof height 1.478 m. Collider includes the mirrors.
 * Seed chooses subdued existing paint, rectangular/twin-round lamps and vinyl
 * roof. No occupants, wheels touching y=0, no animation or per-car material.
 */
export function addParkedSedan(b, { seed = 1 } = {}) {
  const rng = random(seed), options = [['white', .75], ['red', .70], ['blue', .51], ['green', .90], ['yellow', .54]];
  const [paint, baseTone] = options[(seed >>> 0) % options.length];
  const tone = baseTone * (.96 + rng() * .06), vinyl = (seed >>> 0) % 3 === 0;
  b.add(sedanBody(), paint, 0, 0, 0, 1, 1, 1, 0, 0, 0, tone);
  b.box('dark', 0, .357, -.02, 1.37, .137, 3.83, 0, .63);
  // Independent tyres and hubs are centred on the actual arch openings.
  for (const side of [-1, 1]) for (const z of [-1.35, 1.35]) {
    b.cylinder('rubber', side * .790, .31, z, .31, .31, .211, 18, 0, PI / 2, .60);
    b.cylinder('dark', side * .900, .31, z, .244, .244, .014, 18, 0, PI / 2, .83);
    b.cylinder('metal', side * .911, .31, z, .171, .171, .018, 12, 0, PI / 2, 1.19);
    b.cylinder('metal', side * .924, .31, z, .080, .080, .025, 12, 0, PI / 2, .95);
    for (let i = 0; i < 5; i++) {
      const a = i * PI * .4;
      sideBolt(b, side, .31 + Math.cos(a) * .111, z + Math.sin(a) * .111, .012, .928);
    }
    b.box('rubber', side * .77, .251, z - .328, .21, .215, .023, 0, .54);
  }
  // The greenhouse tapers inward at the roof and slopes at both ends.
  face(b, 'glassLight', [[-.778, .991, 1.049], [.778, .991, 1.049],
    [.691, 1.397, .425], [-.691, 1.397, .425]], [0, 1, 1], .91);
  face(b, 'glassLight', [[.778, .990, -1.095], [-.778, .990, -1.095],
    [-.691, 1.397, -.644], [.691, 1.397, -.644]], [0, 1, -1], .83);
  for (const side of [-1, 1]) {
    carGlass(b, side);
    // Painted A/B/C pillars and thin metal seals frame each separate pane.
    b.rod(paint, [side * .784, .987, 1.059], [side * .697, 1.416, .418], .027);
    b.rod(paint, [side * .784, .986, -1.110], [side * .697, 1.416, -.653], .038);
    b.rod(paint, [side * .794, .990, -.042], [side * .697, 1.410, -.042], .033);
    b.rod('metal', [side * .795, .988, -1.105], [side * .795, .988, 1.056], .011);
    b.rod('metal', [side * .708, 1.419, -.663], [side * .708, 1.419, .430], .012);
    // Door gaps, handles, rub strips and side marker lamps.
    for (const z of [-1.05, -.04, 1.02]) b.box('dark', side * .875, .772, z,
      .006, .348, .011, 0, .49);
    b.box('dark', side * .876, .580, -.02, .012, .029, 3.87, 0, .73);
    b.box('metal', side * .883, .584, -.02, .007, .009, 3.81, 0, .83);
    for (const z of [-.70, .264]) {
      b.box('dark', side * .879, .906, z, .008, .036, .165, 0, .67);
      b.box('metal', side * .892, .910, z, .023, .018, .140, 0, 1.16);
    }
    b.box('yellow', side * .878, .719, 1.986, .009, .057, .135, 0, .88);
    b.box('red', side * .878, .728, -1.987, .009, .059, .112, 0, .91);
    // Wing mirrors extend only 12 cm beyond the body side.
    b.rod('metal', [side * .780, 1.027, .815], [side * .922, 1.071, .815], .015);
    b.box('metal', side * .932, 1.092, .805, .114, .088, .161, 0, .82);
    b.box('glassLight', side * .932, 1.094, .716, .100, .069, .007, 0, .91);
  }
  b.box(vinyl ? 'dark' : paint, 0, 1.440, -.115, 1.45, .076, 1.116, 0, vinyl ? .80 : tone * 1.05);
  b.rod('metal', [-.706, 1.410, .445], [.706, 1.410, .445], .012);
  b.rod('metal', [-.706, 1.410, -.672], [.706, 1.410, -.672], .012);
  b.rod('metal', [-.779, .984, 1.067], [.779, .984, 1.067], .011);
  b.rod('metal', [-.779, .984, -1.116], [.779, .984, -1.116], .011);
  // Hood and trunk seams follow their gently sloping top panels.
  b.rod('dark', [-.745, .907, 2.012], [.745, .907, 2.012], .005);
  b.rod('dark', [-.738, .927, -1.973], [.738, .927, -1.973], .005);
  for (const side of [-1, 1]) {
    b.rod('dark', [side * .745, .907, 2.012], [side * .745, .972, 1.125], .0045);
    b.rod('dark', [side * .738, .927, -1.973], [side * .738, .977, -1.133], .0045);
  }
  b.rod('rubber', [-.633, 1.019, 1.013], [-.195, 1.089, .914], .009);
  b.rod('rubber', [.115, 1.019, 1.013], [.529, 1.089, .914], .009);
  // Deep grille, chrome frames and period rectangular or twin round lamps.
  b.box('dark', 0, .743, 2.180, 1.624, .214, .023, 0, .67);
  b.box('metal', 0, .746, 2.196, .757, .161, .018, 0, .94);
  b.box('dark', 0, .746, 2.208, .710, .126, .010, 0, .69);
  for (let i = -6; i <= 6; i++) b.box('metal', i * .052, .746, 2.218, .009, .117, .010, 0, .92);
  for (const side of [-1, 1]) {
    if (seed % 2 === 0) {
      b.box('metal', side * .609, .750, 2.198, .340, .183, .025, 0, 1.18);
      b.box('lamp', side * .609, .750, 2.216, .293, .140, .021, 0, .91);
      for (let i = -2; i <= 2; i++) b.box('white', side * .609 + i * .046, .750, 2.229,
        .007, .126, .002, 0, .77);
    } else {
      for (const x of [.510, .706]) {
        b.cylinder('metal', side * x, .751, 2.203, .093, .093, .025, 14, PI / 2, 0, 1.13);
        b.cylinder('lamp', side * x, .751, 2.220, .073, .073, .018, 14, PI / 2, 0, .90);
      }
    }
    b.box('yellow', side * .652, .558, 2.187, .209, .055, .026, 0, .79);
    b.box('metal', side * .616, .757, -2.182, .392, .146, .024, 0, .87);
    b.box('red', side * .662, .760, -2.201, .249, .107, .019, 0, .95);
    b.box('white', side * .498, .760, -2.202, .077, .105, .019, 0, .85);
    b.box('rubber', side * .529, .498, 2.213, .104, .130, .066, 0, .64);
    b.box('rubber', side * .529, .498, -2.213, .104, .130, .066, 0, .64);
  }
  for (const z of [-2.202, 2.202]) {
    b.box('metal', 0, .497, z, 1.789, .085, .096, 0, 1.11);
    b.box('rubber', 0, .505, z + Math.sign(z) * .051, 1.707, .025, .013, 0, .61);
    b.box('dark', 0, .650, z, .356, .141, .027, 0, .64);
    b.box('white', 0, .650, z + Math.sign(z) * .017, .324, .112, .006, 0, .77);
  }
  stencil(b, 'L 1978', 0, .650, 2.225, .280, .052, 'dark', .78);
  // Rear plate uses the same geometry in a half-turn local frame.
  b.push(0, 0, 0, PI);
  stencil(b, 'L 1978', 0, .650, 2.225, .280, .052, 'dark', .78);
  b.pop();
  b.cylinder('dark', -.574, .287, -2.079, .030, .030, .21, 9, PI / 2, 0, .73);
  // One small rust scar and an aerial: age through construction details, not
  // heavy noise. The car still reads clearly under daylight and at distance.
  b.box('rust', -.878, .638, -.597, .007, .023, .114, 0, .66);
  b.rod('metal', [.714, .945, 1.439], [.714, 1.447, 1.439], .0045);
  b.solid(0, 0, 1.98, 4.53);
}

function warningMark(b, x, y, z, size) {
  face(b, 'dark', [[x, y + size * .54, z], [x - size * .55, y - size * .44, z],
    [x + size * .55, y - size * .44, z]], [0, 0, 1], .78);
  face(b, 'yellow', [[x, y + size * .405, z + .002], [x - size * .415, y - size * .36, z + .002],
    [x + size * .415, y - size * .36, z + .002]], [0, 0, 1], .87);
  face(b, 'dark', [[x + size * .035, y + size * .265, z + .004],
    [x - size * .140, y - size * .03, z + .004], [x - size * .015, y - size * .014, z + .004],
    [x - size * .085, y - size * .259, z + .004], [x + size * .155, y + size * .083, z + .004],
    [x + size * .023, y + size * .063, z + .004]], [0, 0, 1], .90);
}

/**
 * Add-on only; default dimensions match addUtilityCabinet({variant:0}).
 * Optional width/height/depth/baseY also allow matching the green .76×1.32×.43
 * cabinet. Does not duplicate its box or collider. Its conduit sits at +X.
 */
export function addUtilityDetails(b, {
  seed = 1, width = .58, height = 1.08, depth = .36, baseY = .16
} = {}) {
  const rng = random(seed), front = depth / 2 + .023;
  warningMark(b, -width * .035, baseY + height * .81, front, Math.min(.17, width * .29));
  b.box('metal', width * .31, baseY + height * .48, front + .015,
    .049, .115, .014, 0, .90);
  b.box('dark', width * .31, baseY + height * .49, front + .024,
    .014, .034, .008, 0, .69);
  b.rod('metal', [width * .31, baseY + height * .45, front + .030],
    [width * .31, baseY + height * .52, front + .030], .008);
  frontBolt(b, width * .31, baseY + height * .422, front + .025, .009);
  b.box('white', -width * .14, baseY + height * .674, front + .002,
    width * .37, .054, .004, 0, .76);
  stencil(b, 'HV ' + String(10 + (seed >>> 0) % 90), -width * .14,
    baseY + height * .674, front + .006, width * .31, .026, 'dark', .73);
  const cx = width / 2 + .071, cz = -depth * .18, top = baseY + height * .51;
  b.cylinder('metal', cx, (top + .035) / 2, cz, .018, .018, top - .035, 8, 0, 0, .75);
  // A connected quarter-turn conduit elbow enters the cabinet side.
  let last = [cx, top, cz];
  for (let i = 1; i <= 5; i++) {
    const a = i * PI / 10;
    const next = [cx - .072 * (1 - Math.cos(a)), top + .072 * Math.sin(a), cz];
    b.rod('metal', last, next, .018); last = next;
  }
  for (const y of [baseY + .073, top - .084]) {
    b.box('metal', width / 2 + .038, y, cz, .085, .029, .051, 0, .67);
    sideBolt(b, 1, y, cz, .008, cx + .02);
  }
  b.cylinder('metal', cx, .053, cz, .029, .029, .039, 8, 0, 0, .66);
  for (let i = 0; i < 3; i++) frontBolt(b, -width * .37 + rng() * width * .06,
    baseY + .15 + i * height * .26, front + .003, .005, .7);
}
