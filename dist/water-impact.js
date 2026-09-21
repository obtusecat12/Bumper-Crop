import * as T from './vendor/three.module.min.js';

// Three bounded draws: connected sheets/rims/ligaments, faceted spray, wave packets.
// Every position remains relative to its source BigInt chunk until it is drawn.
const TAU = Math.PI * 2, SEGMENTS = 36, ROWS = 3, EVENTS = 6, JETS = 8;
const SHEET_VERTS = SEGMENTS * ROWS, RIM_VERTS = SEGMENTS * 2;
const EVENT_VERTS = SHEET_VERTS + RIM_VERTS + JETS * 6;
const EVENT_INDICES = SEGMENTS * 12 + SEGMENTS * 6 + JETS * 12;
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const smooth = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

export function createWaterImpact(scene, { limit = 64, rng = Math.random } = {}) {
  limit = Math.max(1, Math.floor(Number.isFinite(limit) ? limit : 64));
  const particles = [], rings = [], group = new T.Group();
  group.name = 'water-entry spray and ripples';
  scene.add(group);
  const dummy = new T.Object3D(), up = new T.Vector3(0, 1, 0), axis = new T.Vector3();
  const cos = new Float32Array(SEGMENTS), sin = new Float32Array(SEGMENTS);
  for (let i = 0; i < SEGMENTS; i++) {
    cos[i] = Math.cos(i * TAU / SEGMENTS); sin[i] = Math.sin(i * TAU / SEGMENTS);
  }

  function waterMaterial(kind) {
    const material = new T.MeshBasicMaterial({
      name: `water-impact-${kind}-v25`, color: '#b5c5c9', fog: true,
      transparent: true, opacity: 1, depthTest: true, depthWrite: false,
      side: kind === 'spray' ? T.FrontSide : T.DoubleSide, alphaTest: .012
    });
    // Transparent DoubleSide normally costs two draws in Three. These thin sheets
    // need both orientations, but deliberately use one pass to preserve the budget.
    material.forceSinglePass = true;
    material.defines = { USE_UV: '' };
    material.onBeforeCompile = shader => {
      shader.vertexShader = `attribute float splashOpacity;
        varying float vSplashAlpha;
        varying vec3 vImpactView;
        ${kind === 'rings' ? 'attribute vec3 splashPacket; varying vec3 vSplashPacket;' : ''}
      ` + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        vSplashAlpha = splashOpacity;
        ${kind === 'rings' ? 'vSplashPacket = splashPacket;' : ''}`);
      shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
        vImpactView = -mvPosition.xyz;`);
      shader.fragmentShader = `varying float vSplashAlpha;
        varying vec3 vImpactView;
        ${kind === 'rings' ? 'varying vec3 vSplashPacket;' : ''}
      ` + shader.fragmentShader;
      let finish;
      if (kind === 'rings') {
        finish = `
          vec2 q = vUv * 2. - 1.;
          float r = length(q), worldR = r * vSplashPacket.y;
          float wave = worldR - vSplashPacket.x;
          float envelope = exp(-wave * wave * 31.);
          float theta = atan(q.y, q.x);
          // Several narrow alternating crests, with softly broken angular strength.
          float crest = sin(wave * 48. + sin(theta * 3. + vSplashPacket.z) * .45);
          float bands = pow(abs(crest), 12.);
          float irregular = .60 + .40 * sin(theta * 4. + vSplashPacket.z) * sin(theta * 7. - .8);
          diffuseColor.rgb *= mix(.43, 1.18, smoothstep(-.25, .75, crest));
          diffuseColor.a *= vSplashAlpha * envelope * bands * irregular * .40;
        `;
      } else {
        finish = `
          // Derivatives give stable low-poly facets on the animated continuous mesh.
          vec3 normalWater = normalize(cross(dFdx(vImpactView), dFdy(vImpactView)));
          vec3 viewWater = normalize(vImpactView);
          float fresnel = .02 + .98 * pow(1. - abs(dot(normalWater, viewWater)), 3.);
          float glint = pow(abs(dot(normalWater, normalize(vec3(-.38, .75, .54)))), 20.);
          ${kind === 'sheet' ? `
            float rim = smoothstep(.80, 1., vUv.y);
            diffuseColor.rgb *= .45 + fresnel * .75 + rim * .19 + glint * .35;
            diffuseColor.a *= vSplashAlpha * (.12 + fresnel * .49 + rim * .29);
          ` : `
            diffuseColor.rgb *= .56 + fresnel * .67 + glint * .46;
            diffuseColor.a *= vSplashAlpha * (.55 + fresnel * .34);
          `}
        `;
      }
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>',
        '#include <color_fragment>\n' + finish);
      // Keep stock fog_vertex / fog_fragment includes for atmosphere.attachFog().
    };
    material.customProgramCacheKey = () => `connected-water-impact-v25-${kind}`;
    return material;
  }

  const positions = new Float32Array(EVENTS * EVENT_VERTS * 3);
  const normals = new Float32Array(EVENTS * EVENT_VERTS * 3);
  const uvs = new Float32Array(EVENTS * EVENT_VERTS * 2);
  const opacity = new Float32Array(EVENTS * EVENT_VERTS);
  const indices = new Uint16Array(EVENTS * EVENT_INDICES);
  const sheetGeometry = new T.BufferGeometry();
  let indexCursor = 0;
  function quad(a, b, c, d) {
    indices[indexCursor++] = a; indices[indexCursor++] = b; indices[indexCursor++] = c;
    indices[indexCursor++] = b; indices[indexCursor++] = d; indices[indexCursor++] = c;
  }
  for (let e = 0; e < EVENTS; e++) {
    const base = e * EVENT_VERTS;
    for (let row = 0; row < ROWS; row++) for (let i = 0; i < SEGMENTS; i++) {
      const v = base + row * SEGMENTS + i;
      uvs[v * 2] = i / SEGMENTS; uvs[v * 2 + 1] = row / (ROWS - 1);
      if (row < ROWS - 1) {
        const j = (i + 1) % SEGMENTS;
        quad(v, base + row * SEGMENTS + j, v + SEGMENTS, base + (row + 1) * SEGMENTS + j);
      }
    }
    for (let i = 0; i < SEGMENTS; i++) {
      const v = base + SHEET_VERTS + i * 2, j = (i + 1) % SEGMENTS;
      uvs[v * 2] = uvs[(v + 1) * 2] = i / SEGMENTS;
      uvs[v * 2 + 1] = uvs[(v + 1) * 2 + 1] = 1;
      quad(v, v + 1, base + SHEET_VERTS + j * 2, base + SHEET_VERTS + j * 2 + 1);
    }
    for (let jet = 0; jet < JETS; jet++) {
      const v = base + SHEET_VERTS + RIM_VERTS + jet * 6;
      for (let row = 0; row < 3; row++) {
        uvs[(v + row * 2) * 2] = 0; uvs[(v + row * 2 + 1) * 2] = 1;
        uvs[(v + row * 2) * 2 + 1] = uvs[(v + row * 2 + 1) * 2 + 1] = 1;
      }
      quad(v, v + 1, v + 2, v + 3); quad(v + 2, v + 3, v + 4, v + 5);
    }
  }
  sheetGeometry.setIndex(new T.BufferAttribute(indices, 1));
  sheetGeometry.setAttribute('position', new T.BufferAttribute(positions, 3).setUsage(T.DynamicDrawUsage));
  sheetGeometry.setAttribute('normal', new T.BufferAttribute(normals, 3).setUsage(T.DynamicDrawUsage));
  sheetGeometry.setAttribute('uv', new T.BufferAttribute(uvs, 2));
  sheetGeometry.setAttribute('splashOpacity', new T.BufferAttribute(opacity, 1).setUsage(T.DynamicDrawUsage));
  sheetGeometry.setDrawRange(0, 0);
  const sheet = new T.Mesh(sheetGeometry, waterMaterial('sheet'));
  sheet.name = 'connected 36-segment crown sheets, scalloped lips and fine ligaments';
  sheet.frustumCulled = false; group.add(sheet);

  function instanced(geometry, kind, capacity) {
    geometry.setAttribute('splashOpacity', new T.InstancedBufferAttribute(new Float32Array(capacity), 1).setUsage(T.DynamicDrawUsage));
    const mesh = new T.InstancedMesh(geometry, waterMaterial(kind), capacity);
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    mesh.count = 0; mesh.frustumCulled = false; group.add(mesh);
    return mesh;
  }
  const spray = instanced(new T.IcosahedronGeometry(1, 0), 'spray', limit);
  spray.name = 'ballistic faceted water drops, pooled varied sizes';
  const ringGeometry = new T.CircleGeometry(1, 48);
  ringGeometry.rotateX(-Math.PI / 2);
  ringGeometry.setAttribute('splashPacket', new T.InstancedBufferAttribute(new Float32Array(EVENTS * 3), 3).setUsage(T.DynamicDrawUsage));
  const ripple = instanced(ringGeometry, 'rings', EVENTS);
  ripple.name = 'fine damped surface wave packets';

  const particlePool = Array.from({ length: limit }, () => ({ active: false }));
  const eventPool = Array.from({ length: EVENTS }, () => ({
    active: false, radial: new Float32Array(SEGMENTS), lobe: new Float32Array(SEGMENTS),
    tear: new Float32Array(SEGMENTS), jetIndex: new Uint8Array(JETS),
    jetLength: new Float32Array(JETS), rimX: new Float32Array(SEGMENTS),
    rimY: new Float32Array(SEGMENTS), rimZ: new Float32Array(SEGMENTS)
  }));

  function clear() {
    for (let i = 0; i < limit; i++) particlePool[i].active = false;
    for (let i = 0; i < EVENTS; i++) eventPool[i].active = false;
    particles.length = 0; rings.length = 0;
    spray.count = 0; ripple.count = 0; sheetGeometry.setDrawRange(0, 0);
    sheet.visible = spray.visible = ripple.visible = group.visible = false;
  }

  function emit(power, state, level) {
    if (!(power > 0) || !Number.isFinite(level)) return;
    const energy = clamp(power, .06, 2.5), major = energy > .3;
    const vx = Number.isFinite(state.velocity?.x) ? state.velocity.x : 0;
    const vz = Number.isFinite(state.velocity?.z) ? state.velocity.z : 0;
    const speed = Math.hypot(vx, vz), yaw = Number.isFinite(state.yaw) ? state.yaw : 0;
    const dx = speed > .08 ? vx / speed : -Math.sin(yaw);
    const dz = speed > .08 ? vz / speed : -Math.cos(yaw);
    let event = null;
    for (let i = 0; i < EVENTS; i++) if (!eventPool[i].active) { event = eventPool[i]; break; }
    if (!event) { event = rings.shift(); event.active = false; }
    const e = event;
    e.active = true; e.cx = state.cx; e.cz = state.cz;
    const ahead = major ? .65 + energy * .12 : .28;
    e.x = state.x + dx * ahead; e.z = state.z + dz * ahead; e.y = level + .012;
    e.age = 0; e.power = power; e.energy = energy; e.major = major;
    e.life = major ? 1.40 + energy * .14 : .90;
    e.sheetLife = major ? .61 + energy * .055 : .34;
    e.dx = dx; e.dz = dz; e.direction = Math.atan2(dz, dx);
    e.speed = speed; e.skew = clamp(speed * .065, .08, .45);
    e.seed = rng() * TAU; e.seed2 = rng() * TAU;
    e.r0 = major ? .15 + energy * .035 : .055;
    e.radialSpeed = major ? 1.05 + energy * .28 : .49;
    e.launch = major ? 2.35 + energy * .55 : 1.25;
    e.gravity = major ? 9.8 : 11.5;
    e.waveSpeed = major ? 1.25 + energy * .28 : .85;
    for (let i = 0; i < SEGMENTS; i++) {
      const theta = i * TAU / SEGMENTS;
      const forward = Math.max(0, Math.cos(theta - e.direction));
      e.radial[i] = 1 + .075 * Math.sin(theta * 3 + e.seed) + .035 * Math.cos(theta * 7 - e.seed2) + forward * e.skew;
      e.lobe[i] = (.62 + .23 * Math.sin(theta * 6 + e.seed) + .10 * Math.sin(theta * 11 - e.seed2)) * (.55 + forward * .90);
      e.tear[i] = .56 + .44 * Math.sin(theta * 5 + e.seed2) * Math.sin(theta * 2 - e.seed);
    }
    for (let j = 0; j < JETS; j++) {
      e.jetIndex[j] = Math.floor((j + .2 + rng() * .55) * SEGMENTS / JETS) % SEGMENTS;
      e.jetLength[j] = (major ? .10 + energy * .12 : .038) * (.55 + rng() * 1.1);
    }
    rings.push(e);

    // Scheduled spray starts on the rising rim, then detaches ballistically.
    // All records are acquired now: update() allocates no particle/geometry objects.
    const count = Math.min(limit, major ? Math.round(18 + energy * 11) : 7);
    for (let i = 0; i < count; i++) {
      let p = null;
      for (let j = 0; j < limit; j++) if (!particlePool[j].active) { p = particlePool[j]; break; }
      if (!p) p = particles.shift();
      p.active = true; p.cx = e.cx; p.cz = e.cz; p.level = level;
      const theta = i < JETS ? e.jetIndex[i] * TAU / SEGMENTS : rng() * TAU;
      const c = Math.cos(theta), s = Math.sin(theta);
      const forward = Math.max(0, c * dx + s * dz);
      const delay = (major ? .045 : .015) + rng() * (major ? .15 : .07);
      const rimR = e.r0 + e.radialSpeed * delay + (major ? .15 : .045);
      const rimHeight = Math.max(0, e.launch * delay - .5 * e.gravity * delay * delay);
      p.ox = e.x + c * rimR * (1 + forward * e.skew) + dx * delay * e.skew;
      p.oz = e.z + s * rimR * (1 + forward * e.skew) + dz * delay * e.skew;
      p.oy = e.y + rimHeight * (.58 + forward * .55);
      const v = (major ? .95 + energy * .35 : .43) * (.48 + rng() * 1.2);
      p.vx = c * v + dx * Math.min(speed, 4) * .20;
      p.vz = s * v + dz * Math.min(speed, 4) * .20;
      p.initialVy = (major ? 1.90 + energy * .62 : .90) * (.60 + rng() * .68);
      p.vy = p.initialVy; p.x = p.ox; p.y = p.oy; p.z = p.oz;
      const size = rng();
      p.radius = (major ? .016 + energy * .010 : .010) * (.60 + size * size * 2.15);
      p.w = p.radius * 2; p.h = p.radius * (2.8 + rng() * 1.3);
      p.roll = rng() * TAU; p.age = 0; p.delay = delay;
      p.life = delay + (major ? .85 : .48) + rng() * .12;
      p.alpha = .60 + rng() * .35;
      particles.push(p);
    }
    group.visible = true;
  }

  function vertex(v, x, y, z, nx, ny, nz, alpha) {
    const i = v * 3;
    positions[i] = x; positions[i + 1] = y; positions[i + 2] = z;
    normals[i] = nx; normals[i + 1] = ny; normals[i + 2] = nz;
    opacity[v] = alpha;
  }

  function writeSheet(e, slot, state) {
    const base = slot * EVENT_VERTS, t = e.age;
    const ox = Number(e.cx - state.cx) * 64 + e.x;
    const oz = Number(e.cz - state.cz) * 64 + e.z;
    const rise = Math.max(0, e.launch * t - .5 * e.gravity * t * t);
    const radius = e.r0 + e.radialSpeed * t / (1 + t * .90);
    const flare = (e.major ? .055 + e.energy * .065 : .035) + t * .20;
    const fade = smooth((e.sheetLife - t) / (e.major ? .20 : .12)) * smooth(t / .025);
    const breakup = smooth((t - e.sheetLife * .52) / (e.sheetLife * .43));
    const lip = (e.major ? .012 : .006) * (1 - breakup * .55);
    for (let i = 0; i < SEGMENTS; i++) {
      const c = cos[i], s = sin[i], shape = e.radial[i];
      const height = rise * Math.max(.15, e.lobe[i]);
      const tear = 1 - breakup * smooth((e.tear[i] - .43) * 3);
      for (let row = 0; row < ROWS; row++) {
        const q = row / (ROWS - 1);
        // The lower ring stays on the surface; the middle ring forms a continuous
        // sloping lamella; only the flared top becomes the scalloped crown rim.
        const r = (radius + flare * q * q) * shape;
        const x = ox + c * r + e.dx * e.skew * q * t;
        const z = oz + s * r + e.dz * e.skew * q * t;
        const y = e.y + height * q * q + Math.sin(i * 1.7 + e.seed) * .006 * q;
        vertex(base + row * SEGMENTS + i, x, y, z, c, .25, s,
          fade * (1 - q * .2) * (row === 0 ? 1 : tear));
        if (row === ROWS - 1) { e.rimX[i] = x; e.rimY[i] = y; e.rimZ[i] = z; }
      }
      const v = base + SHEET_VERTS + i * 2;
      vertex(v, e.rimX[i], e.rimY[i], e.rimZ[i], c, .7, s, fade * tear);
      vertex(v + 1, e.rimX[i] + c * lip, e.rimY[i] - lip * .38, e.rimZ[i] + s * lip,
        c, .7, s, fade * tear);
    }
    const jetEnvelope = smooth((t - .035) / .07) * (1 - smooth((t - .25) / .21));
    for (let j = 0; j < JETS; j++) {
      const i = e.jetIndex[j], c = cos[i], s = sin[i];
      const length = e.jetLength[j] * jetEnvelope;
      const v = base + SHEET_VERTS + RIM_VERTS + j * 6;
      for (let row = 0; row < 3; row++) {
        const q = row * .5, width = (e.major ? .012 : .006) * (1 - q * .88) * jetEnvelope;
        const x = e.rimX[i] + c * length * q;
        const z = e.rimZ[i] + s * length * q;
        const y = e.rimY[i] + length * (1.45 * q - .48 * q * q) - breakup * .12 * q;
        const a = fade * jetEnvelope * (1 - breakup * .65);
        vertex(v + row * 2, x - s * width, y, z + c * width, c, .4, s, a);
        vertex(v + row * 2 + 1, x + s * width, y, z - c * width, c, .4, s, a);
      }
    }
  }

  function update(dt, state, camera, enabled = true) {
    if (!enabled) { clear(); return; }
    // Positions use event-relative analytic motion, so long frames advance time
    // correctly without a fixed-step backlog or slow-motion delta clamp.
    dt = Number.isFinite(dt) ? Math.max(0, dt) : 0;
    let particleCount = 0, drawParticles = 0;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]; p.age += dt;
      const t = p.age - p.delay;
      if (t >= 0) {
        p.x = p.ox + p.vx * t; p.z = p.oz + p.vz * t;
        p.y = p.oy + p.initialVy * t - 4.9 * t * t; p.vy = p.initialVy - 9.8 * t;
      }
      if (p.age >= p.life || (t > .02 && p.y <= p.level + .008)) { p.active = false; continue; }
      particles[particleCount++] = p;
      if (t < 0) continue;
      dummy.position.set(Number(p.cx - state.cx) * 64 + p.x, p.y, Number(p.cz - state.cz) * 64 + p.z);
      axis.set(p.vx, p.vy, p.vz).normalize();
      if (axis.lengthSq() < .001) axis.copy(up);
      dummy.quaternion.setFromUnitVectors(up, axis); dummy.rotateY(p.roll);
      const stretch = clamp(1.35 + Math.abs(p.vy) * .30, 1.4, 2.9);
      dummy.scale.set(p.radius * .80, p.radius * stretch, p.radius * .68);
      dummy.updateMatrix(); spray.setMatrixAt(drawParticles, dummy.matrix);
      spray.geometry.attributes.splashOpacity.setX(drawParticles++, p.alpha * smooth(t / .018) * smooth((p.life - p.age) / .12));
    }
    particles.length = particleCount;
    let eventCount = 0, drawSheets = 0;
    for (let i = 0; i < rings.length; i++) {
      const e = rings[i]; e.age += dt;
      if (e.age >= e.life) { e.active = false; continue; }
      rings[eventCount] = e;
      if (e.age < e.sheetLife) writeSheet(e, drawSheets++, state);
      const waveCenter = e.r0 + e.waveSpeed * e.age, radius = waveCenter + .38;
      dummy.position.set(Number(e.cx - state.cx) * 64 + e.x, e.y + .010, Number(e.cz - state.cz) * 64 + e.z);
      // Slightly stretched with travel, but still follows the impact's exact center.
      dummy.rotation.set(0, -e.direction, 0);
      dummy.scale.set(radius * (1 + e.skew * .17), 1, radius);
      dummy.updateMatrix(); ripple.setMatrixAt(eventCount, dummy.matrix);
      ringGeometry.attributes.splashOpacity.setX(eventCount,
        smooth(e.age / .055) * Math.pow(1 - e.age / e.life, 1.45) * (e.major ? 1 : .65));
      ringGeometry.attributes.splashPacket.setXYZ(eventCount, waveCenter, radius, e.seed);
      eventCount++;
    }
    rings.length = eventCount;
    spray.count = drawParticles; ripple.count = eventCount;
    sheetGeometry.setDrawRange(0, drawSheets * EVENT_INDICES);
    sheet.visible = drawSheets > 0; spray.visible = drawParticles > 0; ripple.visible = eventCount > 0;
    group.visible = sheet.visible || spray.visible || ripple.visible;
    if (drawSheets) {
      sheetGeometry.attributes.position.needsUpdate = true;
      sheetGeometry.attributes.normal.needsUpdate = true;
      sheetGeometry.attributes.splashOpacity.needsUpdate = true;
    }
    if (drawParticles) {
      spray.instanceMatrix.needsUpdate = true;
      spray.geometry.attributes.splashOpacity.needsUpdate = true;
    }
    if (eventCount) {
      ripple.instanceMatrix.needsUpdate = true;
      ringGeometry.attributes.splashOpacity.needsUpdate = true;
      ringGeometry.attributes.splashPacket.needsUpdate = true;
    }
  }

  function dispose() {
    clear(); scene.remove(group);
    for (const mesh of [sheet, spray, ripple]) {
      if (mesh.isInstancedMesh) mesh.dispose();
      mesh.geometry.dispose(); mesh.material.dispose();
    }
  }
  clear();
  return { group, particles, rings, emit, update, clear, dispose };
}
