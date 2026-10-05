/** Detailed, metre-scale field-camp interiors. No imports; inject the scene's THREE and textured materials. */
export function createCampInteriors(THREE, mats = {}) {
  const animated = [];
  const warmLights = [];
  const steamPoints = [];
  const dynamicRoots = [];
  const M = {};
  const defaults = { wood: 0x766146, metal: 0x626661, rust: 0x75513c, canvas: 0xb39a50, olive: 0x596345, tile: 0xd0c8b3, blue: 0x396776, mud: 0x4b4438, container: 0x8d8271, brass: 0x887344, rubber: 0x272824, pvc: 0xbab7a3, paper: 0xd1c8a8, fabric: 0x857d5b, ceramic: 0xb4b9a6 };
  for (const key in defaults) M[key] = mats[key] || new THREE.MeshStandardMaterial({ color: defaults[key], roughness: key === 'metal' ? .64 : .92, metalness: ['metal', 'brass', 'rust'].includes(key) ? .65 : 0 });
  const tint = (base, color, roughness) => { const m = M[base].clone(); m.color.multiply(new THREE.Color(color)); if (roughness !== undefined) m.roughness = roughness; return m; };
  const blackIron = tint('metal', 0x73756e, .84);
  const soot = tint('rust', 0x36352c, .99);
  const stoveEnamel = tint('metal', 0xd5ccaa, .67);
  const darkRubber = tint('rubber', 0x45453d, .95);
  const fadedFabric = [tint('fabric', 0xb2a88a), tint('fabric', 0x62735d), tint('fabric', 0xb0a18c), tint('fabric', 0x818976)];
  const oliveDark = tint('olive', 0x748268);
  const woodDark = tint('wood', 0x938264);
  const stainless = tint('metal', 0xdadfda, .38);
  const tanCanvas = tint('canvas', 0xc5b69a, .98);
  const ash = tint('mud', 0xb3b1a2);
  const paperMat = tint('paper', 0xffffe5);
  const mahogany = mats.mahogany || tint('wood', 0x9c5540, .47);
  const mahoganyTrim = mahogany.clone(); mahoganyTrim.color.multiplyScalar(.81); mahoganyTrim.roughness = .45;
  const deskBrass = M.brass.clone(); deskBrass.roughness = .43;
  const G = name => { const g = new THREE.Group(); g.name = name; return g; };
  function mesh(parent, geometry, material, x = 0, y = 0, z = 0, shadow = true) {
    const o = new THREE.Mesh(geometry, material); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; parent.add(o); return o;
  }
  function box(parent, w, h, d, material, x = 0, y = 0, z = 0, ry = 0) {
    const o = mesh(parent, new THREE.BoxGeometry(w, h, d), material, x, y, z); o.rotation.y = ry; return o;
  }
  function cyl(parent, top, bottom, h, material, x = 0, y = 0, z = 0, n = 12, open = false) {
    return mesh(parent, new THREE.CylinderGeometry(top, bottom, h, n, 1, open), material, x, y, z);
  }
  function beam(parent, a, b, r, material, n = 4, r2 = r) {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const o = cyl(parent, r2, r, va.distanceTo(vb), material, 0, 0, 0, n);
    o.position.copy(va).add(vb).multiplyScalar(.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.sub(va).normalize()); return o;
  }
  function torus(parent, r, tube, material, x, y, z, rx = Math.PI / 2, arc = Math.PI * 2, seg = 16) {
    // Sub-centimetre rolled tin lips use a flat annulus; larger handles retain their volume.
    const thinLip = r < .09 && tube <= .006 && rx === Math.PI / 2 && arc === Math.PI * 2;
    const geometry = thinLip ? new THREE.RingGeometry(r - tube, r + tube, 8) : new THREE.TorusGeometry(r, tube, 3, r < .09 ? Math.min(seg, 8) : r < .19 ? Math.min(seg, 12) : seg, arc);
    const o = mesh(parent, geometry, material, x, y, z); o.rotation.x = thinLip ? -rx : rx; return o;
  }
  function tube(parent, points, radius, material, segments = 12, radial = 6) {
    const c = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    return mesh(parent, new THREE.TubeGeometry(c, segments, radius, radial, false), material);
  }
  function rounded(parent, w, h, d, material, x, y, z, r = .035) {
    const sh = new THREE.Shape(); const a = -w / 2, b = -h / 2;
    sh.moveTo(a + r, b); sh.lineTo(a + w - r, b); sh.quadraticCurveTo(a + w, b, a + w, b + r); sh.lineTo(a + w, b + h - r); sh.quadraticCurveTo(a + w, b + h, a + w - r, b + h); sh.lineTo(a + r, b + h); sh.quadraticCurveTo(a, b + h, a, b + h - r); sh.lineTo(a, b + r); sh.quadraticCurveTo(a, b, a + r, b);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false, steps: 1, curveSegments: 2 }); geo.translate(0, 0, -d / 2);
    return mesh(parent, geo, material, x, y, z);
  }
  // A closed, upholstered surface, with sagging edges and nonidentical creases.
  function softBlock(parent, w, d, h, material, x, y, z, seed = 0) {
    const nx = 4, nz = 7, positions = [], uvs = [], indices = [];
    for (let iz = 0; iz <= nz; iz++) for (let ix = 0; ix <= nx; ix++) {
      const u = ix / nx, v = iz / nz, edge = Math.sin(Math.PI * u) * Math.sin(Math.PI * v);
      const ripple = (.015 * Math.sin(u * 25 + v * 11 + seed) + .009 * Math.cos(v * 35 - u * 14 + seed)) * Math.sqrt(Math.max(0, edge));
      positions.push((u - .5) * w, h * (.42 + .58 * Math.pow(Math.max(edge, 0), .26)) + ripple, (v - .5) * d); uvs.push(u, v);
    }
    for (let iz = 0; iz < nz; iz++) for (let ix = 0; ix < nx; ix++) { const i = iz * (nx + 1) + ix; indices.push(i, i + nx + 1, i + 1, i + 1, i + nx + 1, i + nx + 2); }
    const perimeter = [];
    for (let ix = 0; ix <= nx; ix++) perimeter.push(ix);
    for (let iz = 1; iz <= nz; iz++) perimeter.push(iz * (nx + 1) + nx);
    for (let ix = nx - 1; ix >= 0; ix--) perimeter.push(nz * (nx + 1) + ix);
    for (let iz = nz - 1; iz > 0; iz--) perimeter.push(iz * (nx + 1));
    for (let j = 0; j < perimeter.length; j++) { const i = perimeter[j]; const b = positions.length / 3; positions.push(positions[i * 3], 0, positions[i * 3 + 2]); uvs.push(uvs[i * 2], uvs[i * 2 + 1]); const ni = perimeter[(j + 1) % perimeter.length]; const nb = j + 1 < perimeter.length ? b + 1 : (nx + 1) * (nz + 1); indices.push(i, b, ni, ni, b, nb); }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
    return mesh(parent, geometry, material, x, y, z);
  }
  function plankTop(parent, width, depth, y, x = 0, z = 0, material = M.wood, count = 5) {
    for (let i = 0; i < count; i++) box(parent, width, .048, depth / count - .008, material, x + Math.sin(i * 21) * .004, y + Math.sin(i * 2.7) * .003, z - depth / 2 + depth * (i + .5) / count);
  }
  function bench(width = .86, seed = 0) {
    const g = G('handmade split-plank stool'); plankTop(g, width, .34, .4, 0, 0, seed % 2 ? woodDark : M.wood, 2);
    for (const x of [-width * .36, width * .36]) {
      const a = box(g, .075, .39, .27, M.wood, x, .19, 0); a.rotation.z = -Math.sign(x) * .1;
      box(g, .3, .055, .055, woodDark, x, .1, 0);
    }
    box(g, width * .8, .065, .055, woodDark, 0, .18, 0); return g;
  }
  function woodChair() {
    const g = G('repaired wooden chair'); plankTop(g, .44, .43, .46, 0, 0, M.wood, 3);
    for (const x of [-.17, .17]) {
      box(g, .046, .92, .046, woodDark, x, .46, -.16);
      const leg = box(g, .046, .43, .046, M.wood, x, .215, .16); leg.rotation.z = -Math.sign(x) * .06;
      box(g, .033, .037, .35, M.wood, x, .19, 0);
    }
    box(g, .39, .12, .034, M.wood, 0, .8, -.165);
    box(g, .39, .055, .034, M.wood, 0, .635, -.165);
    return g;
  }
  function foldingChair(material = oliveDark) {
    const g = G('army folding chair');
    rounded(g, .39, .025, .38, material, 0, .455, .015, .012);
    rounded(g, .39, .19, .025, material, 0, .78, -.155, .025);
    for (const x of [-.205, .205]) {
      beam(g, [x, .035, -.22], [x, .51, .19], .013, blackIron);
      beam(g, [x, .03, .24], [x, .86, -.17], .013, blackIron);
      const pivot = cyl(g, .023, .023, .045, stainless, x, .315, 0, 8); pivot.rotation.z = Math.PI / 2;
      beam(g, [x, .47, -.17], [x, .47, .19], .012, blackIron);
    }
    beam(g, [-.21, .14, -.14], [.21, .14, -.14], .012, blackIron); return g;
  }
  function crate(w = .7, h = .5, d = .52, open = false) {
    const g = G('slatted shipping crate');
    const courses = h < .34 ? 2 : 3;
    for (const x of [-w / 2 + .028, w / 2 - .028]) for (let j = 0; j < courses; j++) box(g, .043, h / courses - .014, d, M.wood, x, h * (j + .5) / courses, 0);
    for (const z of [-d / 2 + .025, d / 2 - .025]) for (let j = 0; j < courses; j++) box(g, w, h / courses - .014, .043, woodDark, 0, h * (j + .5) / courses, z);
    for (const x of [-w / 2 + .065, w / 2 - .065]) for (const z of [-d / 2 + .04, d / 2 - .04]) box(g, .062, h + .018, .058, M.wood, x, h / 2, z);
    plankTop(g, w - .04, d - .04, .045, 0, 0, woodDark, 4);
    if (!open) plankTop(g, w + .03, d + .02, h + .02, 0, 0, M.wood, 4);
    return g;
  }
  function can(parent, x, y, z, radius = .073, height = .14, type = 0) {
    const g = G('tinned provisions'); g.position.set(x, y, z); parent.add(g);
    cyl(g, radius, radius, height, stainless, 0, height / 2, 0, 8);
    const labelMat = type % 3 === 0 ? M.paper : type % 3 === 1 ? M.canvas : oliveDark;
    cyl(g, radius + .001, radius + .001, height * .69, labelMat, 0, height * .49, 0, 8, true);
    torus(g, radius * .91, .005, stainless, 0, height, 0, Math.PI / 2, Math.PI * 2, 12);
    torus(g, radius * .95, .004, stainless, 0, .006, 0, Math.PI / 2, Math.PI * 2, 12);
    if (type % 4 === 0) torus(g, radius * .26, .004, blackIron, 0, height + .004, .01, Math.PI / 2, Math.PI * 2, 8);
    return g;
  }
  function sack(parent, x, y, z, seed = 0, scale = 1) {
    const g = G('bulging tied flour sack'); parent.add(g); g.position.set(x, y, z); g.rotation.y = seed * .79; g.scale.setScalar(scale);
    const rings = [[0, .21], [.045, .27], [.15, .33], [.33, .35], [.52, .30], [.65, .21], [.72, .08], [.78, .085], [.82, .14]];
    const p = [], uv = [], ind = [], n = 12;
    rings.forEach(([yy, r], j) => { for (let i = 0; i <= n; i++) { const t = i / n * Math.PI * 2; const rumple = 1 + .055 * Math.sin(i * 2.93 + j * 1.73 + seed); p.push(Math.sin(t) * r * rumple, yy + .008 * Math.sin(i * 3 + seed), Math.cos(t) * r * .76 * rumple); uv.push(i / n, yy / .82); if (j < rings.length - 1 && i < n) { const a = j * (n + 1) + i; ind.push(a, a + n + 1, a + 1, a + 1, a + n + 1, a + n + 2); } } });
    const geom = new THREE.BufferGeometry(); geom.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); geom.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geom.setIndex(ind); geom.computeVertexNormals(); mesh(g, geom, mats.sack||tanCanvas);
    torus(g, .083, .014, M.wood, 0, .746, 0, Math.PI / 2, Math.PI * 2, 10);
    beam(g, [.045, .75, .055], [.15, .69, .12], .008, M.wood, 4);
    return g;
  }
  function cup(parent, x, y, z, material = M.ceramic) {
    const g = G('enamel camp mug'); g.position.set(x, y, z); parent.add(g);
    cyl(g, .043, .038, .084, material, 0, .042, 0, 10, true);
    cyl(g, .038, .038, .006, blackIron, 0, .009, 0, 10);
    torus(g, .041, .006, blackIron, 0, .085, 0, Math.PI / 2, Math.PI * 2, 12);
    const handle = torus(g, .026, .006, material, .054, .047, 0, 0, Math.PI * 2, 10); handle.scale.x = .7;
    return g;
  }
  function tray(parent, x, y, z, rotation = 0, occupied = true) {
    const g = G('pressed steel mess tray'); g.position.set(x, y, z); g.rotation.y = rotation; parent.add(g);
    rounded(g, .34, .018, .24, stainless, 0, .012, 0, .025);
    for (const zz of [-.116, .116]) box(g, .295, .018, .009, stainless, 0, .025, zz);
    for (const xx of [-.161, .161]) box(g, .009, .018, .195, stainless, xx, .025, 0);
    box(g, .009, .022, .215, stainless, .07, .026, 0);
    box(g, .078, .022, .009, stainless, .112, .026, .024);
    if (occupied) {
      const spoon = G('spoon'); spoon.position.set(-.05, .037, -.008); spoon.rotation.y = .48; g.add(spoon);
      box(spoon, .008, .004, .12, stainless, 0, 0, .01);
      const bowl = mesh(spoon, new THREE.SphereGeometry(.021, 8, 4), stainless, 0, .001, -.064, false); bowl.scale.set(.75, .16, 1);
      const fork = G('fork'); fork.position.set(-.09, .04, .012); fork.rotation.y = -.24; g.add(fork);
      box(fork, .008, .004, .12, stainless, 0, 0, .01); box(fork, .022, .004, .025, stainless, 0, 0, -.049);
      for (let i = 0; i < 3; i++) box(fork, .003, .004, .025, stainless, (i - 1) * .008, 0, -.072);
    }
    return g;
  }
  function fire(parent, radius, height, y, intensity = 1.2) {
    const g = G('moving flame cluster'); g.position.y = y; parent.add(g);
    dynamicRoots.push(g);
    const fm = new THREE.MeshBasicMaterial({ color: 0xff8124, transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const im = fm.clone(); im.color.setHex(0xffdc85); im.opacity = .88;
    for (let i = 0; i < 7; i++) {
      const h = height * (.52 + .46 * ((Math.sin(i * 42.1) + 1) / 2)); const w = radius * (.32 + .19 * Math.cos(i * 2));
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute([-w, 0, 0, w, 0, 0, -w * .7, h * .46, .02, w * .55, h * .52, -.014, w * .13, h, .015], 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, .12, .5, .9, .5, .5, 1], 2)); geo.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4]); geo.computeVertexNormals();
      const o = mesh(g, geo, i % 3 ? fm : im, Math.sin(i * 2.39) * radius * .52, 0, Math.cos(i * 2.39) * radius * .52, false); o.rotation.y = i * 1.71;
      animated.push({ mesh: o, h, phase: i * 2.47 + y * 10, flame: true });
    }
    const light = new THREE.PointLight(0xffa64f, intensity, 4.5, 2); light.position.y = height * .5; g.add(light); warmLights.push({ light, base: intensity, phase: y * 9.3 }); return g;
  }
  function firewood(parent, x, z, count = 12) {
    const g = G('split firewood stack'); parent.add(g); g.position.set(x, 0, z);
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / 4), col = i % 4; const h = .47 + .1 * Math.sin(i * 4.5);
      const log = cyl(g, .061, .081, h, M.wood, (col - 1.5) * .12, .07 + row * .125, Math.sin(i * 3.1) * .03, 5); log.rotation.x = Math.PI / 2; log.rotation.z = Math.sin(i * 5) * .12;
      const end = cyl(g, .064, .064, .004, tanCanvas, (col - 1.5) * .12, .07 + row * .125, h / 2 + Math.sin(i * 3.1) * .03, 5); end.rotation.x = Math.PI / 2;
    }
    return g;
  }
  function stove() {
    const g = G('round sheet-iron wood stove');
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3 + .3; beam(g, [Math.sin(a) * .31, .24, Math.cos(a) * .31], [Math.sin(a) * .40, .045, Math.cos(a) * .40], .036, blackIron, 5); }
    cyl(g, .39, .39, .046, blackIron, 0, .25, 0, 20);
    const chamber = new THREE.CylinderGeometry(.355, .38, .61, 22, 1, true, .57, Math.PI * 2 - 1.14); mesh(g, chamber, blackIron, 0, .565, 0);
    cyl(g, .394, .394, .045, blackIron, 0, .887, 0, 20);
    torus(g, .38, .016, M.rust, 0, .29, 0, Math.PI / 2, Math.PI * 2, 20);
    torus(g, .371, .012, soot, 0, .853, 0, Math.PI / 2, Math.PI * 2, 20);
    const hinge = G('ajar stove fire door'); hinge.position.set(-.20, .54, .32); hinge.rotation.y = -.6; g.add(hinge);
    rounded(hinge, .37, .45, .03, blackIron, .185, 0, 0, .055);
    for (const y of [-.15, .15]) cyl(hinge, .024, .024, .09, M.rust, 0, y, .022, 8);
    beam(hinge, [.28, .02, .06], [.37, .02, .06], .014, stainless); beam(hinge, [.29, .02, .018], [.29, .02, .06], .014, stainless);
    for (let i = 0; i < 4; i++) box(hinge, .038, .008, .002, soot, .12 + i * .05, -.13, .017);
    for (let i = 0; i < 5; i++) beam(g, [-.26 + i * .125, .325, -.20], [-.26 + i * .125, .325, .24], .012, blackIron);
    cyl(g, .30, .30, .014, ash, 0, .3, 0, 16);
    fire(g, .21, .38, .35, 1.8);
    tube(g, [[0, .89, -.23], [0, 1.06, -.23], [0, 1.18, -.30], [0, 1.34, -.36], [0, 3.45, -.36]], .082, blackIron, 10, 10);
    for (const yy of [1.35, 2.18, 2.92]) torus(g, .083, .012, M.rust, 0, yy, -.36, Math.PI / 2, Math.PI * 2, 10);
    // Spun-metal kettle: broad belly, tapered shoulder, fitted lid, arch handle, upturned spout.
    const kettle = G('boiling iron kettle'); kettle.position.set(.045, .912, .052); g.add(kettle);
    const profile = [[0, 0], [.135, 0], [.17, .035], [.175, .11], [.146, .195], [.095, .235]].map(p => new THREE.Vector2(...p));
    mesh(kettle, new THREE.LatheGeometry(profile, 16), stainless);
    cyl(kettle, .107, .12, .02, blackIron, 0, .247, 0, 14);
    cyl(kettle, .031, .031, .025, darkRubber, 0, .273, 0, 8);
    const handle = torus(kettle, .154, .014, blackIron, 0, .245, 0, 0, Math.PI, 14); handle.rotation.z = 0;
    for (const xx of [-.152, .152]) cyl(kettle, .022, .022, .022, M.rust, xx, .22, 0, 8);
    tube(kettle, [[.12, .07, 0], [.20, .11, 0], [.247, .20, 0], [.262, .25, 0]], .029, stainless, 7, 8);
    const spoutRim = torus(kettle, .029, .006, blackIron, .264, .25, 0, Math.PI / 2, Math.PI * 2, 8); spoutRim.rotation.z = -.25;
    const steam = new THREE.Object3D(); steam.name = 'kettle steam outlet'; steam.position.set(.265, .278, 0); kettle.add(steam); steamPoints.push(steam); dynamicRoots.push(steam);
    return g;
  }
  function desk() {
    const g = G('salvaged double-pedestal mahogany office desk');
    // Solid, softly rounded slab. The desk's working side faces -Z; the panelled
    // public side faces the tent entrance, +Z. Its clear knee bay is 1.1 m wide.
    const outline = new THREE.Shape(), w = 2.226, d = .976, corner = .035;
    outline.moveTo(-w / 2 + corner, -d / 2); outline.lineTo(w / 2 - corner, -d / 2);
    outline.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + corner); outline.lineTo(w / 2, d / 2 - corner);
    outline.quadraticCurveTo(w / 2, d / 2, w / 2 - corner, d / 2); outline.lineTo(-w / 2 + corner, d / 2);
    outline.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - corner); outline.lineTo(-w / 2, -d / 2 + corner);
    outline.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + corner, -d / 2);
    const slab = new THREE.ExtrudeGeometry(outline, { depth: .052, bevelEnabled: true, bevelThickness: .01, bevelSize: .012, bevelSegments: 1, steps: 1, curveSegments: 3 });
    slab.translate(0, 0, -.026);
    const slabUV = slab.getAttribute('uv');
    for (let i = 0; i < slabUV.count; i++) slabUV.setXY(i, slabUV.getX(i) / 2.25 + .5, slabUV.getY(i) + .5);
    mesh(g, slab, mahogany, 0, .758, 0).rotation.x = -Math.PI / 2;
    box(g, 2.12, .035, .88, mahoganyTrim, 0, .706, 0);
    for (const x of [-.81, .81]) {
      box(g, .49, .60, .84, mahogany, x, .395, 0);
      box(g, .525, .07, .872, mahoganyTrim, x, .063, 0);
      // Slightly inset drawer fronts, with rails left between the drawers.
      for (const [yy, hh] of [[.245, .242], [.452, .145], [.625, .145]]) {
        box(g, .436, hh, .031, mahoganyTrim, x, yy, -.429);
        box(g, .395, hh - .038, .018, mahogany, x, yy, -.453);
        const py = yy + (hh > .20 ? .04 : 0);
        for (const dx of [-.07, .07]) {
          const rose = cyl(g, .017, .017, .008, deskBrass, x + dx, py, -.468, 8); rose.rotation.x = Math.PI / 2;
          beam(g, [x + dx, py, -.472], [x + dx, py - .014, -.496], .006, deskBrass, 6);
        }
        beam(g, [x - .07, py - .014, -.496], [x + .07, py - .014, -.496], .008, deskBrass, 6);
      }
      const lock = cyl(g, .012, .012, .008, deskBrass, x, .675, -.469, 8); lock.rotation.x = Math.PI / 2;
      box(g, .003, .009, .002, blackIron, x, .675, -.475);
      // The entrance side has framed panels rather than exposed drawer backs.
      box(g, .418, .507, .018, mahoganyTrim, x, .402, .431);
      box(g, .354, .443, .013, mahogany, x, .402, .445);
      for (const side of [-1, 1]) box(g, .025, .52, .027, mahogany, x + side * .215, .402, .442);
    }
    box(g, 1.145, .475, .037, mahoganyTrim, 0, .440, .365);
    box(g, 1.065, .383, .015, mahogany, 0, .440, .390);
    for (const x of [-.55, .55]) box(g, .026, .447, .023, mahogany, x, .440, .401);
    for (const y of [.221, .659]) box(g, 1.124, .024, .023, mahogany, 0, y, .401);
    box(g, 1.09, .06, .48, mahogany, 0, .670, -.17);
    box(g, 1.022, .046, .026, mahoganyTrim, 0, .670, -.424);
    beam(g, [-.07, .668, -.456], [.07, .668, -.456], .006, deskBrass, 6);
    for (const x of [-.07, .07]) beam(g, [x, .668, -.439], [x, .668, -.456], .005, deskBrass, 5);
    // The map, folder and radio are arranged for the chair behind the desk.
    for (let i = 0; i < 5; i++) box(g, .42, .0016, .31, paperMat, .03 + Math.sin(i * 3) * .014, .798 + i * .002, .20, -.05 + i * .019);
    box(g, .39, .024, .28, oliveDark, .60, .804, .17, -.09);
    box(g, .34, .026, .019, M.canvas, .76, .806, .16, -.09);
    beam(g, [-.10, .814, .13], [.04, .814, .18], .004, blackIron, 5);
    cup(g, -.66, .798, -.23);
    const radio = G('portable shortwave field radio'); g.add(radio); radio.position.set(-.68, .798, .18); radio.rotation.y = Math.PI;
    rounded(radio, .38, .23, .135, oliveDark, 0, .115, 0, .022);
    rounded(radio, .20, .17, .006, blackIron, -.063, .118, .072, .018);
    for (let i = 0; i < 8; i++) box(radio, .166, .006, .007, M.metal, -.063, .056 + i * .017, .076);
    box(radio, .095, .038, .009, M.paper, .123, .172, .074);
    for (const yy of [.054, .10]) { const knob = cyl(radio, .017, .017, .018, blackIron, .12, yy, .079, 8); knob.rotation.x = Math.PI / 2; }
    beam(radio, [.12, .238, -.01], [.17, .66, .01], .004, stainless, 5);
    tube(radio, [[-.12, .21, -.018], [-.12, .29, -.018], [.12, .29, -.018], [.12, .21, -.018]], .013, darkRubber, 6, 5);
    return g;
  }
  function diningTable(w = 1.1, d = 2.9, folding = false) {
    const g = G(folding ? 'trestle mess table' : 'small wooden meal table'); plankTop(g, w, d, .765, 0, 0, M.wood, Math.round(d / .17));
    for (const z of [-d * .35, d * .35]) {
      if (folding) {
        for (const x of [-w * .36, w * .36]) beam(g, [x, .73, z], [x * 1.2, .03, z + Math.sign(z) * .20], .025, blackIron);
        beam(g, [-w * .38, .28, z + Math.sign(z) * .13], [w * .38, .28, z + Math.sign(z) * .13], .022, blackIron);
      } else for (const x of [-w * .39, w * .39]) box(g, .075, .72, .075, woodDark, x, .38, z);
      box(g, w * .87, .075, .06, woodDark, 0, .704, z);
    }
    box(g, .056, .065, d * .76, woodDark, 0, .40, 0); return g;
  }
  const office = G('MEG office and living tent contents');
  const offDesk = desk(); offDesk.position.set(-1.7, 0, -2.35); office.add(offDesk);
  const offChair = woodChair(); offChair.position.set(-1.70, 0, -3.29); offChair.rotation.y = .015; office.add(offChair);
  const st = stove(); st.position.set(.58, 0, -.26); office.add(st);
  firewood(office, 1.37, -.46, 15);
  const ashPail = cyl(office, .16, .12, .28, M.metal, 1.40, .15, .29, 12, true); torus(office, .16, .01, blackIron, 1.4, .29, .29, Math.PI / 2, Math.PI * 2, 12);
  beam(office, [1.58, .02, -.31], [1.33, .93, -.53], .014, blackIron); box(office, .13, .19, .024, blackIron, 1.57, .11, -.31);
  const mealTable = diningTable(.97, 1.58); mealTable.position.set(-2.25, 0, .78); office.add(mealTable);
  for (const [x, z, a] of [[-3.13, .31, -Math.PI / 2], [-3.12, 1.25, -Math.PI / 2], [-1.43, .88, Math.PI / 2]]) { const ch = woodChair(); ch.position.set(x, 0, z); ch.rotation.y = a; office.add(ch); }
  cup(mealTable, -.21, .794, .28); tray(mealTable, .13, .794, -.3, .10); can(mealTable, -.25, .79, -.53, .058, .12, 0);
  const filing = crate(.68, .58, .52); filing.position.set(-3.02, 0, -4.24); office.add(filing);
  const documents = crate(.65, .29, .46, true); documents.position.set(-3.0, .625, -4.22); office.add(documents);
  for (let i = 0; i < 5; i++) box(documents, .36, .015, .26, i % 2 ? paperMat : oliveDark, .025, .075 + i * .026, 0, (i - 2) * .045);
  const gear = crate(.82, .47, .62); gear.position.set(2.58, 0, -3.96); gear.rotation.y = -.09; office.add(gear);
  softBlock(gear, .68, .42, .13, fadedFabric[1], 0, .5, 0, 4);

  function electricStove() {
    const g = G('grease-caked electric range');
    rounded(g, 1.02, .78, .68, stoveEnamel, 0, .48, 0, .033);
    for (const x of [-.4, .4]) for (const z of [-.26, .26]) cyl(g, .025, .03, .13, blackIron, x, .065, z, 6);
    box(g, 1.06, .04, .74, stainless, 0, .89, 0);
    box(g, 1.03, .23, .047, stoveEnamel, 0, 1.005, -.338);
    if (mats.cookerTop) {
      // A separately cropped, orthographic hob texture carries the grease,
      // scratched enamel and coils; pans remain volumetric above the plate.
      // Preserve the generated 1254:583 aspect ratio so the coils stay round.
      const hob = mesh(g, new THREE.PlaneGeometry(1.02, 1.02 * 583 / 1254), mats.cookerTop, 0, .913, 0);
      hob.rotation.x = -Math.PI / 2; hob.name = 'generated stained electric hob surface';
    } else for (const x of [-.25, .25]) for (const z of [-.18, .17]) {
      cyl(g, .17, .17, .008, soot, x, .918, z, 12);
      for (const r of [.038, .077, .112, .142]) torus(g, r, .009, blackIron, x, .93, z, Math.PI / 2, Math.PI * 2, 14);
    }
    if (mats.cookerFront) {
      const front = mesh(g, new THREE.PlaneGeometry(.987, .744), mats.cookerFront, 0, .48, .342);
      front.name = 'generated enamel oven fascia and door';
    } else {
      rounded(g, .78, .43, .026, blackIron, 0, .48, .356, .04);
      rounded(g, .64, .31, .017, soot, 0, .48, .372, .025);
    }
    // Front image is cropped from y590..1254. Put the projecting grip directly
    // over its printed handle (source y894), and the two knobs over their art.
    const handleY = mats.cookerFront ? .48 + .744 * (.5 - (894 - 590) / 664) : .705;
    const handleHalf = mats.cookerFront ? .423 : .36;
    beam(g, [-handleHalf, handleY, .39], [handleHalf, handleY, .39], .019, stainless);
    for (const x of [-handleHalf, handleHalf]) beam(g, [x, handleY, .349], [x, handleY, .39], .015, blackIron);
    if (mats.cookerFront) {
      for (const x of [-.212, .212]) {
        const knob = cyl(g, .047, .047, .025, blackIron, x, .729, .361, 12);
        knob.rotation.x = Math.PI / 2; knob.scale.z = 1.32;
        rounded(g, .021, .088, .012, darkRubber, x, .729, .381, .008);
        box(g, .004, .013, .002, M.paper, x, .764, .388);
      }
    } else for (const x of [-.35, -.12, .12, .35]) { const knob = cyl(g, .034, .034, .024, blackIron, x, 1.02, -.303, 10); knob.rotation.x = Math.PI / 2; box(g, .006, .018, .007, M.paper, x, 1.032, -.288); }
    const panBase = mats.cookerTop ? .913 : .939;
    const pan = cyl(g, .145, .12, .052, blackIron, -.25, panBase + .026, 0, 14, true); beam(g, [-.35, panBase + .041, .04], [-.65, panBase + .051, .14], .019, blackIron);
    cyl(g, .145, .145, .011, soot, -.25, panBase + .006, 0, 14);
    const pot = cyl(g, .155, .148, .25, stainless, .25, 1.04, 0, 14, true); cyl(g, .16, .17, .022, stainless, .25, 1.175, 0, 14); cyl(g, .026, .026, .023, blackIron, .25, 1.198, 0, 8);
    for (const x of [.045, .455]) { const handle = torus(g, .054, .012, blackIron, x, 1.103, 0, 0, Math.PI * 2, 10); handle.scale.x = .7; }
    const cable = tube(g, [[.38, .12, -.35], [.44, .04, -.51], [.70, .025, -.59], [.75, .027, -.90]], .014, darkRubber, 7, 6); cable.name = 'electric range power lead';
    g.userData.powerSocketLocal = [.75, .027, -.90]; return g;
  }
  const kitchen = G('MEG kitchen and mess tent contents');
  const cooker = electricStove(); cooker.position.set(-1.81, 0, -3.90); kitchen.add(cooker);
  const prep = diningTable(1.65, .7); prep.position.set(-.14, 0, -3.94); kitchen.add(prep);
  box(prep, .44, .034, .27, M.wood, -.25, .802, -.025, .08);
  box(prep, .018, .016, .12, blackIron, -.07, .824, .03, .16); box(prep, .035, .005, .18, stainless, -.09, .826, -.10, .16);
  for (let i = 0; i < 4; i++) can(prep, .34 + (i % 2) * .13, .801, -.17 + Math.floor(i / 2) * .16, .056, .12, i);
  for (let i = 0; i < 7; i++) { const layer = i > 3 ? 1 : 0; sack(kitchen, 2.07 + (i % 3) * .56, layer ? .62 : 0, -3.96 + Math.floor((i % 4) / 3) * .54, i + 1, .82 + (i % 2) * .07); }
  const rack = G('rough timber provision rack'); rack.position.set(-3.20, 0, -1.12); kitchen.add(rack);
  for (const x of [-.32, .32]) for (const z of [-.95, .95]) box(rack, .06, 1.62, .06, M.wood, x, .81, z);
  for (const yy of [.10, .64, 1.18]) {
    plankTop(rack, .69, 2.03, yy, 0, 0, M.wood, 9);
    for (let layer=0;layer<3;layer++) for(let row=0;row<14;row++) for(let col=0;col<4;col++) can(rack,(col-1.5)*.146,yy+.027+layer*.146,-.906+row*.139,.062,.143,row+col+layer);
  }
  for (const xx of [-1.43, 1.48]) {
    const table = diningTable(.88, 3.16, true); table.position.set(xx, 0, 1.51); kitchen.add(table);
    for (let i = 0; i < 3; i++) for (const side of [-1, 1]) {
      const chair = foldingChair(i % 2 ? fadedFabric[1] : oliveDark); chair.position.set(xx + side * .8, 0, .36 + i * 1.09); chair.rotation.y = -side * Math.PI / 2 + Math.sin(i * 4 + xx) * .06; kitchen.add(chair);
      const activeDiner=xx===-1.43&&i===0&&side===-1;
      tray(table, side * .18, .797, -1.11 + i * 1.08, side * .04 + Math.sin(i * 7) * .04, !activeDiner&&(i !== 2 || side === -1));
      if (i !== 1&&!activeDiner) cup(table, side * .18, .797, -.74 + i * .97, M.ceramic);
    }
    can(table, .01, .797, -.11, .049, .094, 3);
  }
  const spareChair = foldingChair(fadedFabric[2]); spareChair.position.set(3.18, 0, 3.69); spareChair.rotation.y = -.44; kitchen.add(spareChair);

  function cot(parent, x, z, seed, floor = false) {
    const g = G(floor ? 'bedroll on damp-proof ground pad' : 'canvas folding camp bed'); g.position.set(x, 0, z); parent.add(g);
    const y = floor ? .035 : .42;
    if (floor) box(g, .90, .028, 1.94, darkRubber, 0, .018, 0);
    else {
      for (const xx of [-.43, .43]) beam(g, [xx, .43, -.99], [xx, .43, .99], .026, M.wood);
      for (const zz of [-.73, .73]) {
        beam(g, [-.4, .415, zz], [.38, .032, zz], .019, blackIron);
        beam(g, [.4, .415, zz], [-.38, .032, zz], .019, blackIron);
      }
      rounded(g, .85, .036, 1.94, oliveDark, 0, .41, 0, .012);
    }
    softBlock(g, .83, 1.9, .095, fadedFabric[seed % 4], 0, y, 0, seed);
    const blanket = softBlock(g, .85, seed===0?.42:1.15 + .05 * (seed % 2), .057, fadedFabric[(seed + 2) % 4], .01, y + .087, seed===0?.70:.33, seed + 5); blanket.rotation.y = (seed % 3 - 1) * .025;
    const pillow = softBlock(g, .57, .34, .112, paperMat, -.04 + seed % 2 * .08, y + .09, -.68, seed + 20); pillow.rotation.y = -.12 + seed * .03;
    const folded = softBlock(g, .7, .28, .09, oliveDark, .01, y + .155, .72, seed + 10); folded.rotation.y = -.03;
    return g;
  }
  const dorms = [];
  for (let j = 0; j < 4; j++) {
    const dorm = G('green shelter ' + (j + 1) + ' interior'); dorms.push(dorm);
    cot(dorm, -.99, -.40, j, j === 2);
    cot(dorm, .99, -.43, j + 1, j === 1 || j === 3);
    const storage = crate(.62, .43, .48, j === 3); storage.position.set(-1.0, 0, 1.12); storage.rotation.y = .05 - .035 * j; dorm.add(storage);
    const equipment = crate(.51, .36, .40, false); equipment.position.set(1.01, 0, 1.29); equipment.rotation.y = -.08 + j * .03; dorm.add(equipment);
    softBlock(storage, .51, .32, .13, fadedFabric[(j + 1) % 4], 0, .47, 0, j + 31);
    cup(equipment, .09, .41, -.02, M.ceramic);
    const chair = j % 2 ? foldingChair() : woodChair(); chair.position.set(j % 2 ? -.31 : .24, 0, -1.73); chair.rotation.y = j % 2 ? .22 : -.45; dorm.add(chair);
    const pack = G('slumped canvas kitbag'); pack.position.set(.55, 0, -1.55); dorm.add(pack);
    softBlock(pack, .37, .31, .48, oliveDark, 0, 0, 0, j + 16);
    for (const xx of [-.12, .12]) box(pack, .03, .30, .026, darkRubber, xx, .24, .163);
    rounded(pack, .27, .13, .07, fadedFabric[1], 0, .19, .168, .025);
    const bootPair = G('work boots'); bootPair.position.set(-.36 + j * .04, 0, 1.69); bootPair.rotation.y = -.23; dorm.add(bootPair);
    for (const xx of [-.10, .10]) { const toe = softBlock(bootPair, .14, .30, .12, darkRubber, xx, .01, .05, j); rounded(bootPair, .13, .21, .17, darkRubber, xx, .16, -.035, .026); box(bootPair, .147, .027, .31, blackIron, xx, .012, .05); }
  }

  const containerBeds = G('container back-wall sleeping berths');
  for (const [x, seed] of [[-1.7, 2], [.5, 5]]) {
    const berth = cot(containerBeds, x, -.5, seed);
    berth.rotation.y = Math.PI / 2;
    berth.name = 'container narrow folding bed with rumpled bedding';
  }
  // Two 1.98 x .88 m beds run along the back wall; the right-hand doorway
  // at x=2.2 and the full front aisle stay unobstructed.
  containerBeds.userData.collisionBoxes = [
    { x: -1.7, z: -.5, hx: 1.00, hz: .46 },
    { x: .5, z: -.5, hx: 1.00, hz: .46 }
  ];

  const restProps = G('sheltered fire barrel and improvised seats');
  const drum = G('open rusted burn barrel'); restProps.add(drum);
  const barrelMat = M.rust.clone(); barrelMat.side = THREE.DoubleSide;
  cyl(drum, .355, .335, .87, barrelMat, 0, .46, 0, 20, true);
  cyl(drum, .327, .327, .015, soot, 0, .047, 0, 16);
  for (const yy of [.05, .28, .63, .899]) torus(drum, yy > .80 ? .357 : .346, .017, M.rust, 0, yy, 0, Math.PI / 2, Math.PI * 2, 20);
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; const vent = box(drum, .065, .062, .012, soot, Math.sin(a) * .342, .17, Math.cos(a) * .342); vent.rotation.y = a; }
  cyl(drum, .30, .30, .035, ash, 0, .71, 0, 16);
  for (let i = 0; i < 4; i++) { const log = cyl(drum, .046, .052, .47, woodDark, Math.sin(i * 4) * .10, .76, Math.cos(i * 3) * .08, 5); log.rotation.set(Math.PI / 2, i * 1.35, .1); }
  fire(drum, .24, .68, .78, 3.2);
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 + .18; const b = bench(.63 + (i % 3) * .13, i); b.position.set(Math.sin(a) * (1.4 + (i % 2) * .2), 0, Math.cos(a) * (1.4 + (i % 2) * .2)); b.rotation.y = a + .08 * Math.sin(i * 8); restProps.add(b); }
  firewood(restProps, 1.82, -1.31, 9);
  const teaCrate = crate(.47, .36, .43); teaCrate.position.set(-1.78, 0, .15); restProps.add(teaCrate); cup(teaCrate, .07, .40, -.03); can(teaCrate, -.10, .40, .07, .047, .1, 1);
  const all = [office, kitchen, ...dorms, containerBeds, restProps];
  for (const root of all) root.userData.campInterior = true;
  office.userData.steamPoints = steamPoints;
  kitchen.userData.electricalAppliances = [cooker];
  return {
    office, kitchen, dorms, containerBeds, restProps, steamPoints, dynamicRoots, warmLights: warmLights.map(x => x.light),
    update(time, dt = 0) {
      for (const a of animated) {
        const flicker = Math.sin(time * 7.7 + a.phase) * .12 + Math.sin(time * 13.1 + a.phase * 2) * .07;
        a.mesh.scale.y = .91 + flicker; a.mesh.scale.x = 1.0 + Math.sin(time * 8.8 + a.phase) * .14;
        a.mesh.rotation.z = Math.sin(time * 5.3 + a.phase) * .09;
      }
      for (const a of warmLights) a.light.intensity = a.base * (.94 + Math.sin(time * 7 + a.phase) * .11 + Math.sin(time * 11.8) * .06);
    }
  };
}
