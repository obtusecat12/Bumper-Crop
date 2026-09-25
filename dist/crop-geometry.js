// Procedural crop templates. No imports, network or textures required.
// Pass existing Three namespace; vertexColors:true, side:T.DoubleSide,
// roughness:.95 material. Geometry is shared across InstancedMesh batches.
// Units match dense-wheat.js; barley overall height ~1.3m.
// Deliberately muted red-brown straw: avoid applying yellow instance colors.
export function createBarleyGeometry(T, variant = 0) {
  const TAU = Math.PI * 2;
  variant = Math.abs(Math.floor(variant)) % 3;
  const positions = [], colors = [], grains = [];
  const palette = ['#98745a', '#c5ac84', '#ac8968', '#987456', '#87735a'].map(c => {const v=new T.Color(c),l=.2126*v.r+.7152*v.g+.0722*v.b;v.setRGB(l+(v.r-l)*1.06,l+(v.g-l)*1.06,l+(v.b-l)*1.06);return v});
  const tri = (a, b, c, tone) => {
    positions.push(...a, ...b, ...c); const col = palette[tone];
    for (let i = 0; i < 3; i++) colors.push(col.r, col.g, col.b);
  };
  const quad = (a, b, c, d, tone) => { tri(a, b, c, tone); tri(a, c, d, tone); };
  const add = (a, b, scale = 1) => a.map((v, i) => v + b[i] * scale);
  const profiles = [
    { x: .145, y: 1.155, z: -.013, start: .68, curve: .84, length: .244 },
    { x: .242, y: 1.178, z: .032, start: 1.12, curve: .85, length: .252 },
    { x: .316, y: 1.143, z: -.027, start: 1.40, curve: .96, length: .260 }
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
    const center = add(add(head(t), across, side * .010 * taper), [0, 0, 1], (row % 2 ? 1 : -1) * .0035);
    const axis = add(along, across, side * .21), tip = add(center, axis, .028 * taper), base = add(center, axis, -.025 * taper);
    const ring = [add(center, across, .008 * taper), add(center, [0, 0, 1], .0065 * taper),
      add(center, across, -.008 * taper), add(center, [0, 0, 1], -.0065 * taper)];
    const grainStart = positions.length;
    for (let edge = 0; edge < 4; edge++) {
      const next = (edge + 1) % 4;
      tri(base, ring[next], ring[edge], edge % 2 ? 3 : 2);
      tri(tip, ring[edge], ring[next], edge < 2 ? 1 : 2);
    }
    grains.push({ start: grainStart, end: positions.length, center, axis, taper });
    // Crossed tapered bristles remain visible around the head without thick needles.
    const awn = add(add(tip, along, .205 + (7 - row) * .006), across, side * (.045 + row * .003));
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
      const across = (q[0] * n[0] + q[1] * n[1]) / (.008 * grain.taper) ** 2;
      const nx = a[0] * along + n[0] * across, ny = a[1] * along + n[1] * across, nz = q[2] / (.0065 * grain.taper) ** 2;
      const norm = Math.hypot(nx, ny, nz); normals[i] = nx / norm; normals[i + 1] = ny / norm; normals[i + 2] = nz / norm;
    }
  }
  g.computeBoundingBox(); g.computeBoundingSphere();
  g.name = ['barley-light-nod', 'barley-arched-ear', 'barley-heavy-nod'][variant]; return g;
}

// Six short blunt stalks plus six loose straw pieces, 54 triangles total.
// Plant on row-aligned jittered centers; rotate instances within +/-0.15 radians
// to keep coherent harvest rows. Random whole-patch rotation loses row structure.
export function createStubbleGeometry(T, variant = 0) {
  const positions = [], colors = [];
  const palette = ['#88715a','#aa9070','#c2ac85','#6c5947'].map(c=>new T.Color(c));
  let seed = (112831 + variant * 7919) >>> 0;
  const rng = () => {seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const tri=(a,b,c,t)=>{ positions.push(...a,...b,...c);const col=palette[t];for(let i=0;i<3;i++)colors.push(col.r,col.g,col.b); };
  const quad=(a,b,c,d,t)=>{tri(a,b,c,t);tri(a,c,d,t);};
  for(let i=0;i<6;i++) {
    const x=(rng()-.5)*.25,z=(i/5-.5)*.62+(rng()-.5)*.05;
    const height=.115+rng()*.12, r=.004+rng()*.002;
    const leanX=(rng()-.5)*.035,leanZ=(rng()-.5)*.035;
    const ring=(y,side)=>{const a=side*Math.PI*2/3;return [x+Math.cos(a)*r+(y?leanX:0),y,z+Math.sin(a)*r+(y?leanZ:0)];};
    for(let side=0;side<3;side++)quad(ring(0,side),ring(0,side+1),ring(height,side+1),ring(height,side),side===1?1:0);
    tri(ring(height,0),ring(height,1),ring(height,2),2);
  }
  for(let i=0;i<6;i++) {
    const x=(rng()-.5)*.65,z=(rng()-.5)*.75,a=rng()*Math.PI*2;
    const l=.06+rng()*.13,w=.003+rng()*.003,y=.009+rng()*.006;
    const dx=Math.cos(a),dz=Math.sin(a);
    quad([x-dx*l-dz*w,y,z-dz*l+dx*w],[x-dx*l+dz*w,y,z-dz*l-dx*w],
      [x+dx*l+dz*w,y+.004,z+dz*l-dx*w],[x+dx*l-dz*w,y+.004,z+dz*l+dx*w],i%3);
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
  g.name=`harvested-cereal-stubble-${variant}`;return g;
}
