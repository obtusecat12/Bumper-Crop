/**
 * Photo-grounded public-pool shower fittings, authored in metres.
 * Wall z=0; occupied side +z; floor y=0. All geometry is static.
 * No loaders, imports, generated canvas labels, or animation callbacks.
 * Pass Three.js as T and shared materials as m. Front-label materials may
 * carry image textures. Missing palette entries have geometry-only fallbacks.
 */
export function createStallKit(T, m = {}, variant = 0) {
  const group = new T.Group();
  group.name = `shower-stall-kit-${variant}`;
  const V = (x, y, z) => new T.Vector3(x, y, z);
  const fallback = (key, color, roughness = .45, metalness = 0) => m[key] || new T.MeshStandardMaterial({ color, roughness, metalness });
  const chrome = fallback('chrome', 0xa9b6bb, .18, .96);
  const dark = fallback('darkPlastic', 0x12191b, .62);
  const blue = fallback('bluePlastic', 0x1688ae, .19);
  const white = fallback('whitePlastic', 0xecebe1, .32);
  const marble = fallback('marble', 0xe8e6dc, .25);
  const braid = fallback('braid', 0x8d9799, .34, .9);
  const cord = fallback('cord', 0xd1cabb, .93);
  const rubber = fallback('rubber', 0x293033, .85);
  const tealCloth = fallback('tealCloth', 0x64968b, .96);
  const wood = fallback('wood', 0x987753, .88);
  const amber = white.clone(); amber.color.set(0x965a1e); amber.metalness=.05; amber.roughness=.28; 
  const mint = white.clone(); mint.color.set(0x86b4a1); mint.roughness=.33; 
  const burgundy = dark.clone(); burgundy.color.set(0x622e39); burgundy.roughness=.57; 
  const cream = white.clone(); cream.color.set(0xd6ccb1); cream.roughness=.47; 
  const cobalt = blue.clone(); cobalt.color.set(0x123f8b); cobalt.roughness=.22; cobalt.metalness=.12; 
  const green = blue.clone(); green.color.set(0x3d674e); green.roughness=.29; 
  const blade = chrome.clone(); blade.color.set(0xc4cace); blade.metalness=1; blade.roughness=.25; 
  const lime = white.clone(); lime.color.set(0xabc88f); lime.roughness=.74; 
  const add = (geometry, material, parent = group, name = '') => {
    const mesh = new T.Mesh(geometry, material);
    mesh.name = name; mesh.castShadow = true; mesh.receiveShadow = true;
    parent.add(mesh); return mesh;
  };
  const at = (mesh, x, y, z) => { mesh.position.set(x, y, z); return mesh; };
  const roundedRect = (w, h, r) => {
    const s = new T.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y); return s;
  };
  const bevelBox = (w, h, d, r = .003) => {
    r = Math.min(r, w / 5, h / 5, d / 4);
    const g = new T.ExtrudeGeometry(roundedRect(w - 2 * r, h - 2 * r, r), {
      depth: d - 2 * r, bevelEnabled: true, bevelSegments: 1,
      bevelSize: r, bevelThickness: r, curveSegments: 2, steps: 1,
    });
    g.translate(0, 0, -d / 2 + r); return g;
  };
  const box = (w, h, d, material, x, y, z, parent = group, name = '', r = .003) =>
    at(add(bevelBox(w, h, d, r), material, parent, name), x, y, z);
  const cylinder = (rTop, rBottom, length, material, a, b, parent = group, segments = 14, name = '') => {
    const mesh = add(new T.CylinderGeometry(rTop, rBottom, length, segments, 1), material, parent, name);
    mesh.position.copy(a).add(b).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); return mesh;
  };
  const link = (a, b, radius, material, parent = group, name = '', segments = 10) =>
    cylinder(radius, radius, a.distanceTo(b), material, a, b, parent, segments, name);
  const tube = (points, radius, material, segments = 36, radial = 5, parent = group, name = '') => {
    const curve = typeof points.getPoint === 'function' ? points : new T.CatmullRomCurve3(points.map(p => Array.isArray(p) ? V(...p) : p));
    return add(new T.TubeGeometry(curve, segments, radius, radial, false), material, parent, name);
  };
  const torus = (radius, thickness, material, point, normal, parent = group, radial = 5, tubular = 18, name = '') => {
    const mesh = add(new T.TorusGeometry(radius, thickness, radial, tubular), material, parent, name);
    mesh.position.copy(point); mesh.quaternion.setFromUnitVectors(V(0, 0, 1), normal); return mesh;
  };
  const lathe = (profile, material, parent, name = '', segments = 18) =>
    add(new T.LatheGeometry(profile.map(p => new T.Vector2(...p)), segments), material, parent, name);

  // Head and wall plumbing: the face normal is shared by all grommets and jets.
  const normal = V(0, -.55, .835).normalize();
  const faceX = V(1, 0, 0), faceY = V(0, normal.z, -normal.y);
  const headCenter = V(0, 2.08, .28);
  const head = new T.Group(); head.name = 'curved-chrome-showerhead';
  head.position.copy(headCenter); head.quaternion.setFromUnitVectors(V(0, 1, 0), normal); group.add(head);
  lathe([[0, -.086], [.019, -.086], [.024, -.068], [.031, -.05], [.047, -.031], [.069, -.012], [.079, .006], [.08, .023], [.076, .03], [0, .03]], chrome, head, 'flared-shell', 24);
  const faceCenter = headCenter.clone().addScaledVector(normal, .031);
  cylinder(.073, .073, .003, white, faceCenter.clone().addScaledVector(normal, -.003), faceCenter, group, 32, 'enamel-nozzle-plate');
  torus(.076, .004, chrome, faceCenter, normal, group, 6, 32, 'rolled-chrome-rim');
  const nozzles = [];
  const holeG = new T.CylinderGeometry(.00135, .00135, .0014, 6, 1);
  const ringG = new T.TorusGeometry(.00245, .00072, 4, 8);
  const holeInstances = new T.InstancedMesh(holeG, dark, 55);
  const ringInstances = new T.InstancedMesh(ringG, rubber, 55);
  holeInstances.name = '55-recessed-nozzle-bores'; ringInstances.name = '55-rubber-nozzle-grommets';
  const dummy = new T.Object3D(); let holeIndex = 0;
  [[0, 1], [.018, 6], [.034, 12], [.05, 16], [.0655, 20]].forEach(([radius, count], ring) => {
    for (let i = 0; i < count; i++) {
      const a = i / count * Math.PI * 2 + ring * .31;
      const p = faceCenter.clone().addScaledVector(faceX, Math.cos(a) * radius).addScaledVector(faceY, Math.sin(a) * radius);
      dummy.position.copy(p).addScaledVector(normal, .00075);
      dummy.quaternion.setFromUnitVectors(V(0, 0, 1), normal); dummy.updateMatrix(); ringInstances.setMatrixAt(holeIndex, dummy.matrix);
      dummy.position.copy(p).addScaledVector(normal, .00005);
      dummy.quaternion.setFromUnitVectors(V(0, 1, 0), normal); dummy.updateMatrix(); holeInstances.setMatrixAt(holeIndex, dummy.matrix);
      // The jet starts just proud of its individual visible nozzle opening.
      nozzles.push({ position: p.clone().addScaledVector(normal, .0018).toArray(), direction: normal.toArray() });
      holeIndex++;
    }
  });
  holeInstances.castShadow = ringInstances.castShadow = true;
  group.add(holeInstances, ringInstances);
  cylinder(.054, .054, .024, chrome, V(.13, 2.18, .002), V(.13, 2.18, .026), group, 24, 'wall-rosette');
  cylinder(.028, .028, .04, chrome, V(.13, 2.18, .022), V(.13, 2.18, .062), group, 18, 'wall-thread-nut');
  tube([[.13, 2.18, .046], [.125, 2.203, .098], [.08, 2.186, .157], [.021, 2.146, .204]], .018, chrome, 20, 10, group, 'curved-shower-neck');
  torus(.02, .0035, chrome, V(.017, 2.131, .202), normal, group, 5, 14, 'head-swivel-collar');

  // One continuous small-diameter flexible hose; a fine helical steel rib
  // gives the braid a physical highlight even without its optional texture.
  const hosePath = new T.CatmullRomCurve3([
    V(.101, 2.18, .128), V(.197, 2.197, .15), V(.257, 2.121, .163),
    V(.251, 1.69, .17), V(.233, 1.19, .172), V(.208, .848, .163),
    V(.096, .722, .172), V(-.005, .778, .168), V(-.037, .939, .141),
    V(-.03, 1.026, .123),
  ]);
  tube(hosePath, .0071, braid, 104, 6, group, 'continuous-braided-hose');
  const frameN = 128, frames = hosePath.computeFrenetFrames(frameN, false), coilPoints = [];
  const coilTurns = 142, coilSteps = coilTurns * 5;
  for (let i = 0; i <= coilSteps; i++) {
    const t = i / coilSteps, f = t * frameN, f0 = Math.min(frameN - 1, Math.floor(f)), mix = f - f0;
    const n = frames.normals[f0].clone().lerp(frames.normals[f0 + 1], mix).normalize();
    const b = frames.binormals[f0].clone().lerp(frames.binormals[f0 + 1], mix).normalize();
    const angle = t * coilTurns * Math.PI * 2;
    coilPoints.push(hosePath.getPointAt(t).addScaledVector(n, Math.cos(angle) * .00725).addScaledVector(b, Math.sin(angle) * .00725));
  }
  tube(new T.CatmullRomCurve3(coilPoints), .00068, chrome, coilSteps, 3, group, 'fine-continuous-hose-helix');
  cylinder(.011, .011, .028, chrome, V(.095, 2.177, .128), V(.123, 2.177, .128), group, 12, 'upper-hose-crimp');
  cylinder(.049, .049, .025, chrome, V(-.03, 1.049, .003), V(-.03, 1.049, .028), group, 20, 'tap-wall-flange');
  cylinder(.029, .029, .074, chrome, V(-.03, 1.049, .027), V(-.03, 1.049, .101), group, 16, 'mixer-barrel');
  cylinder(.021, .021, .035, chrome, V(-.03, 1.014, .116), V(-.03, 1.049, .116), group, 12, 'lower-hose-coupling');
  cylinder(.033, .031, .012, chrome, V(-.03, 1.049, .106), V(-.03, 1.049, .118), group, 20, 'mixer-front-dial');
  box(.012, .067, .013, chrome, -.03, 1.081, .128, group, 'slim-mixer-lever');
  box(.014, .003, .0015, cobalt, -.044, 1.033, .124, group, 'cold-index', .0003);

  // Paired braided cotton pulls, loose rather than perfectly parallel.
  function pullCord(x, phase, lengthDelta) {
    const bottom = 1.055 + lengthDelta;
    const path = new T.CatmullRomCurve3([
      V(x, 2.128, .082), V(x + .006, 1.92, .096), V(x - .002, 1.63, .112),
      V(x + .006 + phase, 1.34, .12), V(x + .01, bottom + .086, .145),
      V(x + .016, bottom + .025, .151),
    ]);
    tube(path, .00285, cord, 42, 5, group, 'cotton-pull-cord');
    torus(.007, .002, chrome, V(x, 2.128, .083), V(0, 0, 1), group, 4, 12, 'cord-eyelet');
    const knotCenter = V(x + .017, bottom + .013, .151);
    // Two interwoven, deliberately non-coplanar overhand terminal loops.
    const loopA = [], loopB = [];
    for (let i = 0; i <= 24; i++) {
      const a = i / 24 * Math.PI * 2;
      loopA.push(knotCenter.clone().add(V(Math.cos(a) * .0063, Math.sin(a) * .0092, Math.sin(2 * a) * .0032)));
      loopB.push(knotCenter.clone().add(V(Math.cos(a + .5) * .0048, Math.sin(a + .5) * .0075 - .009, Math.sin(2 * a + 1) * .0042)));
    }
    tube(new T.CatmullRomCurve3(loopA), .00265, cord, 24, 5, group, 'first-terminal-knot-loop');
    tube(new T.CatmullRomCurve3(loopB), .00265, cord, 24, 5, group, 'second-terminal-knot-loop');
    tube([[x + .018, bottom + .003, .155], [x + .021, bottom - .015, .16], [x + .029, bottom - .021, .16]], .0026, cord, 9, 5, group, 'loose-cotton-knot-tail');
    // Four fine frayed fibers at the cut end.
    for (let i = 0; i < 4; i++) link(V(x + .029, bottom - .021, .16), V(x + .032 + i * .001, bottom - .024 - i * .0008, .159 + i * .001), .00045, cord, group, 'cord-cut-end-fiber', 3);
  }
  pullCord(.104, -.012, 0); pullCord(.146, .008, .035);

  // Thin polished quarter/trapezoid shelf. Its true top, not the bounding
  // centre, is the authoritative support height for every product.
  const shelfTop = 1.1575, shelfThickness = .015, shelfX = -.438;
  const shelfShape = new T.Shape();
  shelfShape.moveTo(-.244, -.054); shelfShape.lineTo(.244, -.054);
  shelfShape.lineTo(.244, -.157); shelfShape.quadraticCurveTo(.229, -.243, .142, -.307);
  shelfShape.quadraticCurveTo(.048, -.342, -.115, -.333);
  shelfShape.quadraticCurveTo(-.223, -.319, -.244, -.256); shelfShape.closePath();
  const shelfGeo = new T.ExtrudeGeometry(shelfShape, {
    depth: shelfThickness - .004, bevelEnabled: true, bevelThickness: .002,
    bevelSize: .002, bevelSegments: 2, curveSegments: 8, steps: 1,
  });
  shelfGeo.rotateX(-Math.PI / 2);
  at(add(shelfGeo, marble, group, 'beveled-polished-marble-corner-shelf'), shelfX, shelfTop - shelfThickness + .002, 0);
  for (const x of [-.603, -.273]) {
    box(.027, .135, .012, chrome, x, shelfTop - .08, .013, group, 'shelf-wall-bracket');
    box(.025, .011, .192, chrome, x, shelfTop - shelfThickness - .006, .105, group, 'shelf-support-arm', .002);
    link(V(x, shelfTop - .119, .02), V(x, shelfTop - .018, .171), .006, chrome, group, 'shelf-diagonal-support', 8);
    for (const y of [shelfTop - .039, shelfTop - .128]) {
      cylinder(.005, .005, .003, chrome, V(x, y, .019), V(x, y, .022), group, 8, 'bracket-screw');
      box(.006, .0007, .0008, dark, x, y, .023, group, 'screw-slot', .0001);
    }
  }

  const contacts = [];
  const placeProduct = (name, x, z, yaw = 0) => {
    const p = new T.Group(); p.name = name; p.position.set(x, shelfTop, z); p.rotation.y = yaw; group.add(p);
    p.userData.shelfContact = true; p.userData.contactY = shelfTop; contacts.push(p); return p;
  };
  // Squircle loft: width/depth and asymmetry are specified at each height,
  // preserving a flattened product silhouette instead of generic cylinders.
  function loft(profile, material, parent, name, sides = 20) {
    const pos = [], uv = [], idx = [];
    for (let j = 0; j < profile.length; j++) {
      const [y, w, d, shift = 0] = profile[j];
      for (let i = 0; i <= sides; i++) {
        const a = i / sides * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
        pos.push(shift + Math.sign(c) * Math.pow(Math.abs(c), .55) * w / 2, y, Math.sign(s) * Math.pow(Math.abs(s), .55) * d / 2);
        uv.push(i / sides, y / profile[profile.length - 1][0]);
        if (j < profile.length - 1 && i < sides) {
          const a0 = j * (sides + 1) + i, b = a0 + sides + 1;
          idx.push(a0, b, a0 + 1, a0 + 1, b, b + 1);
        }
      }
    }
    for (const end of [0, profile.length - 1]) {
      const p = profile[end], center = pos.length / 3; pos.push(p[3] || 0, p[0], 0); uv.push(.5, .5);
      for (let i = 0; i < sides; i++) {
        const k = end * (sides + 1) + i;
        if (end === 0) idx.push(center, k, k + 1); else idx.push(center, k + 1, k);
      }
    }
    const geometry = new T.BufferGeometry(); geometry.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geometry.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geometry.setIndex(idx); geometry.computeVertexNormals();
    return add(geometry, material, parent, name);
  }
  function label(material, width, height, y, z, parent, name, x = 0, bow = .0015) {
    if (!material) return;
    const geometry = new T.PlaneGeometry(width, height, 8, 1), p = geometry.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, -Math.pow(p.getX(i) / (width / 2), 2) * bow);
    p.needsUpdate = true; geometry.computeVertexNormals();
    const mesh = at(add(geometry, material, parent, name), x, y, z); mesh.castShadow = false; return mesh;
  }
  const bottle = (p, material, h, w, d, neckRatio = .68) => loft([
    [0, w * .84, d * .88], [.006, w, d], [h * .78, w, d],
    [h * .92, w * neckRatio, d * .81], [h, w * neckRatio, d * .76],
  ], material, p, 'shaped-bottle-body');
  const cap = (p, y, w, d, h, material, name = 'bottle-cap') => box(w, h, d, material, 0, y + h / 2, 0, p, name, .0025);
  function razor(parent, x, z, base = 0, tilt = -.13) {
    const r = new T.Group(); r.name = 'safety-razor-with-five-blades'; r.position.set(x, base, z); r.rotation.z = tilt; parent.add(r);
    loft([[0, .011, .012], [.012, .017, .015], [.093, .016, .013], [.119, .011, .011], [.137, .014, .012]], chrome, r, 'curved-metal-razor-handle', 12);
    box(.012, .076, .007, rubber, 0, .059, .007, r, 'rubber-razor-grip', .002);
    for (let i = 0; i < 7; i++) box(.011, .002, .002, dark, 0, .031 + i * .009, .011, r, 'grip-cross-rib', .0004);
    const cartridge = new T.Group(); cartridge.position.set(0, .145, .005); cartridge.rotation.x = -.12; r.add(cartridge);
    box(.046, .024, .012, dark, 0, 0, 0, cartridge, 'razor-cartridge', .002);
    box(.039, .0035, .0015, lime, 0, .0085, .007, cartridge, 'lubrication-strip', .0003);
    for (let i = 0; i < 5; i++) box(.038, .0012, .0012, blade, 0, .004 - i * .0024, .0073, cartridge, 'individual-steel-blade', .00015);
    box(.039, .003, .003, rubber, 0, -.009, .007, cartridge, 'safety-guard', .0004);
    // The handle is rotated above its lowest point, which remains supported.
    r.position.y += Math.abs(Math.sin(tilt)) * .0085;
  }

  if (variant % 4 === 0) {
    // Reference hero: asymmetrical inverted black bottle, broader blue body,
    // slim pale bottle with a sweeping dark-blue lower accent.
    const blackP = placeProduct('NOCTURNE-inverted-black-bottle', -.604, .193, -.12);
    cap(blackP, 0, .081, .051, .027, chrome, 'inverted-steel-flip-cap');
    loft([[.027, .079, .048, 0], [.039, .087, .054, 0], [.092, .096, .057, .003], [.293, .101, .06, -.003], [.325, .095, .058, -.009], [.343, .08, .049, -.017], [.348, .065, .043, -.019]], dark, blackP, 'asymmetric-flattened-tapered-black-body');
    label(m.labelNocturne, .068, .195, .187, .0308, blackP, 'NOCTURNE-generated-front-label', -.006, .0018);
    torus(.006, .0011, dark, V(.019, .012, .0265), V(0, 0, 1), blackP, 4, 10, 'flip-cap-hinge');

    const blueP = placeProduct('AZURE-broad-glossy-shampoo', -.465, .218, .05);
    bottle(blueP, blue, .256, .117, .069, .81);
    cap(blueP, .256, .093, .058, .019, blue, 'blue-flush-shoulder-cap');
    label(m.labelAzure, .087, .164, .14, .0354, blueP, 'AZURE-generated-front-label', 0, .0012);
    box(.024, .002, .004, blue, .025, .27, .03, blueP, 'shampoo-cap-thumb-notch', .0004);

    const whiteP = placeProduct('PURE-tall-slender-white-bottle', -.322, .176, .075);
    loft([[0, .061, .049], [.009, .07, .054], [.063, .067, .052], [.17, .058, .047], [.278, .046, .039], [.309, .045, .037]], white, whiteP, 'slender-tapered-white-body');
    // Curved lower-colour panel follows the narrow bottle front.
    const accent = new T.Shape(); accent.moveTo(-.032, .003); accent.lineTo(.031, .003); accent.lineTo(.029, .093);
    accent.bezierCurveTo(.018, .091, -.02, .066, -.032, .025); accent.closePath();
    const accentG = new T.ShapeGeometry(accent, 10); at(add(accentG, cobalt, whiteP, 'sweeping-cobalt-bottom-accent'), 0, 0, .0277);
    cap(whiteP, .309, .046, .038, .021, white, 'white-shampoo-top');
    label(m.labelPure, .039, .139, .18, .0248, whiteP, 'PURE-generated-front-label', 0, .0012);
    const razorP = placeProduct('razor-between-blue-and-white', -.38, .255);
    razor(razorP, 0, 0, 0, -.14);
  } else if (variant % 4 === 1) {
    const p = placeProduct('SUNDROP-amber-pump', -.604, .189, -.05);
    bottle(p, amber, .217, .095, .067, .55); cap(p, .217, .038, .035, .014, dark, 'pump-screw-collar');
    link(V(0, .23, 0), V(0, .265, 0), .006, dark, p, 'pump-stem', 10);
    box(.065, .012, .019, dark, .019, .27, .004, p, 'pump-paddle', .003);
    box(.01, .02, .017, dark, .047, .263, .003, p, 'pump-spout', .002);
    label(m.labelSundrop, .068, .122, .123, .0344, p, 'SUNDROP-generated-front-label');
    const mintP = placeProduct('PALM-mint-bodywash', -.462, .206, .09);
    bottle(mintP, mint, .237, .11, .058, .67); cap(mintP, .237, .074, .043, .023, cream, 'cream-bodywash-cap');
    label(m.labelPalm, .075, .141, .126, .03, mintP, 'PALM-generated-front-label', 0, .0014);
    const cloth = placeProduct('folded-teal-washcloth-and-soap', -.304, .186, -.04);
    box(.119, .014, .111, tealCloth, 0, .007, 0, cloth, 'cloth-bottom-fold', .003);
    box(.116, .013, .102, tealCloth, .001, .0205, -.003, cloth, 'cloth-top-fold', .004);
    for (let i = 0; i < 6; i++) link(V(-.053 + i * .02, .014, .048), V(-.05 + i * .02, .027, .047), .0007, cord, cloth, 'cloth-edge-stitch', 3);
    box(.079, .026, .046, cream, .005, .04, -.003, cloth, 'ivory-soap-on-folded-cloth', .009);
  } else if (variant % 4 === 2) {
    const wrap = placeProduct('VELVET-burgundy-wrapped-soap', -.609, .202, -.13);
    box(.11, .041, .079, burgundy, 0, .0205, 0, wrap, 'paper-wrapped-bar', .006);
    const topLabel = label(m.labelVelvet, .079, .052, 0, 0, wrap, 'VELVET-generated-wrapper-label', 0, 0);
    if (topLabel) { topLabel.rotation.x = -Math.PI / 2; topLabel.position.set(0, .0423, .004); }
    for (const x of [-.052, .052]) box(.003, .031, .063, burgundy, x, .02, 0, wrap, 'folded-wrapper-end', .0007);
    const jar = placeProduct('low-cream-balm-jar', -.483, .151);
    lathe([[0, 0], [.039, 0], [.043, .005], [.043, .048], [.04, .053], [0, .053]], cream, jar, 'rounded-cream-jar', 18);
    lathe([[0, .051], [.043, .051], [.045, .056], [.045, .066], [.04, .07], [0, .07]], dark, jar, 'wide-jar-lid', 18);
    torus(.0435, .001, chrome, V(0, .055, 0), V(0, 1, 0), jar, 4, 18, 'jar-lid-rim');
    const tubeP = placeProduct('soft-cream-wash-tube', -.383, .142, .05);
    cap(tubeP, 0, .047, .032, .022, burgundy, 'tube-standing-cap');
    loft([[.022, .043, .03], [.04, .052, .035], [.16, .061, .026], [.186, .06, .008], [.192, .062, .006]], cream, tubeP, 'soft-tapered-tube');
    box(.065, .006, .008, cream, 0, .192, 0, tubeP, 'crimped-tube-seam', .001);
    label(m.labelPure, .04, .108, .105, .0188, tubeP, 'small-tube-front-label', 0, .001);
    const brush = placeProduct('oval-wood-scrub-brush', -.312, .262, -.3);
    const base = add(new T.CylinderGeometry(.044, .047, .018, 18), wood, brush, 'oval-wood-brush-base'); base.scale.set(1.1, 1, .58); base.position.y = .009;
    const bristleG = new T.CylinderGeometry(.0013, .0015, .018, 4), bristles = new T.InstancedMesh(bristleG, cord, 54), transform = new T.Object3D();
    for (let i = 0; i < 54; i++) { const a = i * 2.39996, rr = Math.sqrt((i + .5) / 54) * .039;
      transform.position.set(Math.cos(a) * rr * 1.07, .027, Math.sin(a) * rr * .55); transform.updateMatrix(); bristles.setMatrixAt(i, transform.matrix); }
    bristles.name = '54-individual-brush-bristle-tufts'; brush.add(bristles);
    tube([[-.031, .019, 0], [-.018, .054, 0], [.018, .054, 0], [.031, .019, 0]], .003, cream, 14, 5, brush, 'brush-woven-hand-loop');
  } else {
    const greenP = placeProduct('squat-green-shampoo', -.602, .184, -.09);
    bottle(greenP, green, .164, .109, .078, .56); cap(greenP, .164, .066, .051, .023, dark, 'green-bottle-dark-cap');
    label(m.labelPalm, .07, .101, .087, .0399, greenP, 'green-bottle-front-label', 0, .0018);
    const oldTube = placeProduct('old-cream-shaving-tube', -.455, .218, .11);
    cap(oldTube, 0, .044, .03, .028, chrome, 'shaving-tube-ribbed-standing-cap');
    loft([[.028, .04, .029], [.054, .05, .035], [.184, .063, .026], [.205, .065, .009], [.212, .067, .007]], cream, oldTube, 'creased-shaving-cream-tube');
    box(.069, .006, .009, chrome, 0, .212, 0, oldTube, 'old-tube-rolled-crimp', .001);
    label(m.labelPure, .039, .109, .123, .0185, oldTube, 'cream-shaving-tube-label', 0, .0012);
    for (let i = 0; i < 8; i++) link(V(-.021 + i * .006, .004, .0152), V(-.021 + i * .006, .023, .0152), .00055, chrome, oldTube, 'shaving-cap-fluting', 4);
    const cup = placeProduct('cobalt-glass-cup-with-comb', -.31, .171);
    lathe([[0, 0], [.035, 0], [.04, .007], [.043, .118], [.042, .123], [.036, .123], [.034, .016], [0, .016]], cobalt, cup, 'open-cobalt-glass-cup', 24);
    torus(.039, .002, cobalt, V(0, .122, 0), V(0, 1, 0), cup, 5, 24, 'thick-glass-cup-lip');
    const comb = new T.Group(); comb.name = 'small-comb-standing-in-cup'; comb.position.set(-.005, .024, 0); comb.rotation.z = -.15; cup.add(comb);
    box(.042, .125, .004, dark, -.01, .063, 0, comb, 'comb-back', .002);
    // Narrow spine leaves actual air gaps between the teeth.
    const back = comb.children[0]; back.scale.x = .25; back.position.x = -.025;
    for (let i = 0; i < 16; i++) box(.033, .0024, .004, dark, -.005, .01 + i * .0072, 0, comb, 'individual-comb-tooth', .0005);
  }

  // Use transformed vertices for contact, including the tilted razor. An
  // axis-aligned approximation alone would leave its rounded handle floating.
  group.updateMatrixWorld(true);
  for (const product of contacts) {
    const bounds = new T.Box3().setFromObject(product, true);
    product.position.y += shelfTop - bounds.min.y;
    product.updateMatrixWorld(true);
  }
  group.userData = {
    units: 'metres', variant: variant % 4, wallPlaneZ: 0,
    showerHeadCenter: headCenter.toArray(), nozzleNormal: normal.toArray(), nozzleCount: nozzles.length,
    shelfTop, shelfThickness, shelfObjects: contacts.map(p => ({ name: p.name, contactY: shelfTop, localPosition: p.position.toArray() })),
    materialKeys: ['chrome', 'darkPlastic', 'bluePlastic', 'whitePlastic', 'marble', 'braid', 'cord', 'rubber', 'labelNocturne', 'labelAzure', 'labelPure', 'labelSundrop', 'labelPalm', 'labelVelvet', 'tealCloth', 'wood'],
  };
  return { group, nozzles };
}
