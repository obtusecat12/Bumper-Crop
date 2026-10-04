/**
 * Local-space effects for the Level 10 field outpost.
 * update(time, dt): seconds. Call before rendering the main scene.
 * GPU smoke state is RGBA = local XYZ + normalized age, advanced at 20 Hz.
 * No particle positions are updated or read back on the CPU.
 */
export function createCampEffects(THREE, renderer, texture) {
  const GRID = 32;
  const COUNT = GRID * GRID;
  const STEP = 1 / 20;
  const smoke = new THREE.Group();
  const steam = new THREE.Group();
  smoke.name = 'outpost-diesel-black-smoke';
  steam.name = 'outpost-kettle-steam';
  const materials = [];
  const geometries = [];
  const fireInstances = [];
  const steamInstances = [];
  const targets = [];
  const ownedTextures = [];
  let mode = 'analytic-shader';
  let disposed = false;
  let accumulator = 0;
  let lastTime = null;
  let currentTexture = null;
  let targetIndex = 0;
  let simulationTime = 0;
  let simMaterial = null;
  let simScene = null;
  let simCamera = null;
  const drawSize = new THREE.Vector2(1080, 720);
  const savedViewport = new THREE.Vector4();
  const savedScissor = new THREE.Vector4();
  const wind = new THREE.Vector2(0.34, -0.19);

  // Kept as an optional integration argument: generated material textures remain
  // caller-owned and are deliberately not disposed by this module.
  void texture;

  const NOISE = `
    float hash12(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * .1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }
    float noise2(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f*f*(3.0-2.0*f);
      return mix(mix(hash12(i),hash12(i+vec2(1,0)),f.x),
                 mix(hash12(i+vec2(0,1)),hash12(i+vec2(1,1)),f.x),f.y);
    }
    float fbm(vec2 p) {
      float n = 0.0, a = .5;
      for (int i=0;i<4;i++) { n += a*noise2(p); p=p*2.03+13.17; a*=.5; }
      return n;
    }
  `;

  function uniforms(extra) {
    return THREE.UniformsUtils.merge([THREE.UniformsLib.fog || {}, extra]);
  }

  function shaderMaterial(parameters) {
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
      fog: true,
      ...parameters,
    });
    materials.push(material);
    return material;
  }

  function pointGeometry(count, withReference = false) {
    const geometry = new THREE.BufferGeometry();
    const seeds = new Float32Array(count * 4);
    const positions = new Float32Array(count * 3);
    const references = withReference ? new Float32Array(count * 2) : null;
    // Deterministic seed, independent of Math.random and of the world generator.
    for (let i = 0; i < count; i++) {
      seeds[i * 4] = fract(Math.sin(i * 127.1 + 71.4) * 43758.5453);
      seeds[i * 4 + 1] = fract(Math.sin(i * 311.7 + 27.9) * 951.1357);
      seeds[i * 4 + 2] = fract(Math.sin(i * 74.7 + 139.2) * 18431.731);
      seeds[i * 4 + 3] = (i + 0.5) / count;
      if (references) {
        references[i * 2] = ((i % GRID) + 0.5) / GRID;
        references[i * 2 + 1] = (Math.floor(i / GRID) + 0.5) / GRID;
      }
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 4));
    if (references) geometry.setAttribute('reference', new THREE.BufferAttribute(references, 2));
    geometries.push(geometry);
    return geometry;
  }

  function fract(x) { return x - Math.floor(x); }

  function rendererStatePass(callback) {
    const previousTarget = renderer.getRenderTarget();
    const previousCubeFace = renderer.getActiveCubeFace ? renderer.getActiveCubeFace() : 0;
    const previousMipmap = renderer.getActiveMipmapLevel ? renderer.getActiveMipmapLevel() : 0;
    renderer.getViewport(savedViewport);
    renderer.getScissor(savedScissor);
    const previousScissorTest = renderer.getScissorTest();
    const previousAutoClear = renderer.autoClear;
    const previousXR = renderer.xr ? renderer.xr.enabled : false;
    try {
      if (renderer.xr) renderer.xr.enabled = false;
      renderer.autoClear = false;
      renderer.setScissorTest(false);
      callback();
    } finally {
      renderer.setRenderTarget(previousTarget, previousCubeFace, previousMipmap);
      renderer.setViewport(savedViewport);
      renderer.setScissor(savedScissor);
      renderer.setScissorTest(previousScissorTest);
      renderer.autoClear = previousAutoClear;
      if (renderer.xr) renderer.xr.enabled = previousXR;
    }
  }

  function initializeGpu() {
    if (!renderer || !renderer.isWebGLRenderer) return;
    const gl = renderer.getContext();
    const webgl2 = !!(renderer.capabilities.isWebGL2 || gl.texStorage2D);
    const floatRenderable = webgl2
      ? !!gl.getExtension('EXT_color_buffer_float')
      : !!(gl.getExtension('OES_texture_float') && gl.getExtension('WEBGL_color_buffer_float'));
    if (!floatRenderable || gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) < 1) return;
    try {
      const data = new Float32Array(COUNT * 4);
      for (let i = 0; i < COUNT; i++) {
        const age = (i + 0.5) / COUNT;
        const n = fract(Math.sin(i * 132.19 + 8.43) * 42971.2);
        const radialSeed = fract(Math.sin(i * 78.23 + 97.16) * 19735.81);
        const h = age * 7;
        const radius = (.018 + Math.pow(age, 1.07) * 1.65) * Math.sqrt(radialSeed);
        const angle = n * Math.PI * 2;
        const roll = Math.sin(h * 1.47) * (.08 + age * .44);
        data[i * 4] = wind.x * h + roll + Math.cos(angle) * radius;
        data[i * 4 + 1] = h + Math.sin(h * 9.0) * age * .15 + (radialSeed - .5) * age * .44;
        data[i * 4 + 2] = wind.y * h + Math.cos(h * 1.21) * age * .34 + Math.sin(angle) * radius;
        data[i * 4 + 3] = age;
      }
      const seedTexture = new THREE.DataTexture(data, GRID, GRID, THREE.RGBAFormat, THREE.FloatType);
      seedTexture.minFilter = THREE.NearestFilter;
      seedTexture.magFilter = THREE.NearestFilter;
      seedTexture.generateMipmaps = false;
      seedTexture.needsUpdate = true;
      ownedTextures.push(seedTexture);
      currentTexture = seedTexture;
      for (let i = 0; i < 2; i++) {
        const target = new THREE.WebGLRenderTarget(GRID, GRID, {
          type: THREE.FloatType,
          format: THREE.RGBAFormat,
          minFilter: THREE.NearestFilter,
          magFilter: THREE.NearestFilter,
          depthBuffer: false,
          stencilBuffer: false,
          generateMipmaps: false,
        });
        target.texture.name = `outpost-smoke-pingpong-${i}`;
        targets.push(target);
      }
      rendererStatePass(() => {
        for (const target of targets) {
          renderer.setRenderTarget(target);
          if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            throw new Error('Float smoke framebuffer unavailable');
          }
        }
      });
      simScene = new THREE.Scene();
      simCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      simMaterial = new THREE.ShaderMaterial({
        depthTest: false,
        depthWrite: false,
        blending: THREE.NoBlending,
        toneMapped: false,
        uniforms: {
          uState: { value: currentTexture },
          uTime: { value: 0 },
          uDt: { value: STEP },
          uWind: { value: wind },
        },
        vertexShader: `varying vec2 vUv;
          void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`,
        fragmentShader: `
          precision highp float;
          varying vec2 vUv;
          uniform sampler2D uState;
          uniform float uTime, uDt;
          uniform vec2 uWind;
          ${NOISE}
          void main() {
            vec4 state=texture2D(uState,vUv);
            float random=hash12(vUv*109.0);
            float lifetime=6.0+random*3.2;
            float age=state.w+uDt/lifetime;
            vec3 p=state.xyz;
            if(age>=1.0){
              age=fract(age);
              float angle=random*6.283185+floor(uTime*.2)*2.39996;
              float radius=.015+.08*hash12(vUv*37.0+floor(uTime));
              p=vec3(cos(angle)*radius,0.0,sin(angle)*radius);
            }
            // Divergence-free local swirl from the curl of an analytic potential.
            // Plume expansion, buoyancy and crosswind act in the same GPU pass.
            float x=p.x*.75+uTime*.23, y=p.y*.75-uTime*.39, z=p.z*.75;
            vec3 curl=vec3(
              .9*cos(x+.9*y) - cos(z+.8*x),
              .7*cos(y+.7*z) - cos(x+.9*y),
              .8*cos(z+.8*x) - cos(y+.7*z)
            );
            float spread=.075+smoothstep(.02,.65,age)*.84;
            float birthPhase=(uTime-age*lifetime)*2.9;
            float particleAngle=hash12(vUv*283.0)*6.283185;
            float outward=smoothstep(.015,.58,age)*(.16+hash12(vUv*173.0)*.30);
            vec3 velocity=vec3(uWind.x*(.4+age*1.55),1.15-age*.28,uWind.y*(.4+age*1.55));
            velocity+=curl*spread;
            // Cohorts billow together, while particle-specific drift breaks their
            // silhouette apart instead of accumulating onto one black ribbon.
            velocity.xz+=vec2(cos(particleAngle),sin(particleAngle))*outward;
            velocity.xz+=vec2(sin(birthPhase),cos(birthPhase*.83))*(.025+age*.27);
            velocity.y+=sin(birthPhase)*.12+random*.11;
            p+=velocity*uDt;
            gl_FragColor=vec4(p,age);
          }`,
      });
      materials.push(simMaterial);
      const quadGeometry = new THREE.PlaneGeometry(2, 2);
      geometries.push(quadGeometry);
      const quad = new THREE.Mesh(quadGeometry, simMaterial);
      quad.frustumCulled = false;
      simScene.add(quad);
      mode = 'gpgpu-float-pingpong';
    } catch (error) {
      for (const target of targets.splice(0)) target.dispose();
      currentTexture = null;
      mode = 'analytic-shader';
      smoke.userData.gpuFallbackReason = error.message;
    }
  }

  initializeGpu();

  const smokeMaterial = shaderMaterial({
    defines: mode === 'gpgpu-float-pingpong' ? { USE_GPU: 1 } : {},
    uniforms: uniforms({
      uState: { value: currentTexture },
      uTime: { value: 0 },
      uViewportHeight: { value: 720 },
      uWind: { value: wind },
      uOpacity: { value: 0.072 },
    }),
    vertexShader: `
      attribute vec4 seed;
      attribute vec2 reference;
      uniform float uTime,uViewportHeight;
      uniform vec2 uWind;
      #ifdef USE_GPU
        uniform sampler2D uState;
      #endif
      varying float vAge,vSeed;
      #include <fog_pars_vertex>
      void main(){
        vec3 p;
        float age;
        #ifdef USE_GPU
          vec4 state=texture2D(uState,reference);p=state.xyz;age=state.w;
        #else
          float lifetime=6.0+seed.x*3.2;
          age=fract(uTime/lifetime+seed.w);
          float h=age*lifetime;
          float a=seed.y*6.283185;
          float spread=pow(age,1.06)*(1.0+seed.z*1.65);
          p=vec3(uWind.x*h*(.8+age*.5),h*(1.0-age*.13),uWind.y*h*(.8+age*.5));
          p.x+=sin(h*1.47)*(.06+age*.5)+cos(a+uTime*.12)*spread;
          p.z+=cos(h*1.21)*age*.34+sin(a+uTime*.12)*spread;
          p.y+=sin(h*9.0)*age*.15;
        #endif
        vAge=age;vSeed=seed.z;
        vec4 mvPosition=modelViewMatrix*vec4(p,1.0);
        gl_Position=projectionMatrix*mvPosition;
        float objectScale=length(modelViewMatrix[0].xyz);
        float size=(.115+pow(age,.69)*.96)*(.79+seed.x*.38)*objectScale;
        gl_PointSize=clamp(size*uViewportHeight*.5*projectionMatrix[1][1]/max(.2,-mvPosition.z),1.0,180.0);
        #include <fog_vertex>
      }`,
    fragmentShader: `
      uniform float uTime,uOpacity;
      varying float vAge,vSeed;
      #include <fog_pars_fragment>
      ${NOISE}
      void main(){
        vec2 q=gl_PointCoord-.5;
        float angle=vSeed*6.283185;
        q=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*q;
        float n=fbm(q*6.6+vec2(vSeed*31.0,uTime*.095));
        float radius=length(q)*(1.0+.76*(n-.5));
        float mask=1.0-smoothstep(.09,.48,radius);
        // Visible immediately at emission: no empty gap above the exhaust.
        float ageFade=1.0-smoothstep(.35,1.0,vAge);
        float wisps=smoothstep(.12,.57,n);
        float alpha=mask*mask*ageFade*uOpacity*(.34+wisps*.91);
        if(alpha<.002)discard;
        float gray=clamp(vAge*.9+n*.22+vSeed*.10,0.0,1.0);
        vec3 soot=mix(vec3(.041,.044,.041),vec3(.245,.254,.240),gray);
        gl_FragColor=vec4(soot,alpha);
        #include <fog_fragment>
      }`,
  });
  const smokePoints = new THREE.Points(pointGeometry(COUNT, true), smokeMaterial);
  smokePoints.position.y = -.035;
  smokePoints.frustumCulled = false;
  smokePoints.renderOrder = 4;
  smoke.add(smokePoints);
  smoke.userData.particleCount = COUNT;
  smoke.userData.stateFormat = 'RGBA: local x, local y, local z, normalized age';
  smoke.userData.simulationHz = 20;

  function createSteam(options = {}) {
    const group = options.group || new THREE.Group();
    group.name = 'outpost-thin-kettle-steam';
    const scale = typeof options.scale === 'number' ? options.scale : 1;
    group.scale.setScalar(scale);
    const material = shaderMaterial({
      uniforms: uniforms({
        uTime: { value: 0 }, uViewportHeight: { value: 720 },
        uOpacity: { value: options.opacity ?? .095 },
      }),
      vertexShader: `
        attribute vec4 seed;
        uniform float uTime,uViewportHeight;
        varying float vAge,vSeed;
        #include <fog_pars_vertex>
        void main(){
          float age=fract(uTime/(1.6+seed.x*1.1)+seed.w);
          float h=age*(.85+seed.x*.65);
          vec3 p=vec3(sin(h*4.0+uTime*.6+seed.y*6.283)*(.008+age*.13),h,
            cos(h*3.1-uTime*.45+seed.z*6.283)*(.008+age*.1));
          p.x+=age*age*.16;
          vAge=age;vSeed=seed.y;
          vec4 mvPosition=modelViewMatrix*vec4(p,1.0);
          gl_Position=projectionMatrix*mvPosition;
          float objectScale=length(modelViewMatrix[0].xyz);
          gl_PointSize=clamp((.032+age*.4)*objectScale*uViewportHeight*.5*projectionMatrix[1][1]/max(.15,-mvPosition.z),1.0,120.0);
          #include <fog_vertex>
        }`,
      fragmentShader: `
        uniform float uTime,uOpacity;
        varying float vAge,vSeed;
        #include <fog_pars_fragment>
        ${NOISE}
        void main(){
          vec2 q=gl_PointCoord-.5;
          float n=fbm(q*5.0+vSeed*17.0+uTime*.13);
          float edge=1.0-smoothstep(.05,.5,length(q)*(1.12-n*.32));
          float alpha=edge*edge*smoothstep(0.0,.12,vAge)*(1.0-smoothstep(.35,1.0,vAge))*uOpacity;
          if(alpha<.001)discard;
          gl_FragColor=vec4(.79,.83,.81,alpha);
          #include <fog_fragment>
        }`,
    });
    const points = new THREE.Points(pointGeometry(options.count || 112), material);
    points.frustumCulled = false;
    points.renderOrder = 5;
    group.add(points);
    steamInstances.push({ group, material });
    return group;
  }

  createSteam({ group: steam });

  function createFire(options = {}) {
    if (typeof options === 'number') options = { scale: options };
    const group = new THREE.Group();
    group.name = 'outpost-crossed-flame-tongues';
    const scale = options.scale ?? 1;
    const phase = options.phase ?? fireInstances.length * 1.713;
    group.scale.setScalar(scale);
    const shared = uniforms({ uTime: { value: phase }, uPhase: { value: phase } });
    const material = shaderMaterial({
      uniforms: shared,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
      vertexShader: `
        varying vec2 vUv;
        uniform float uTime,uPhase;
        #include <fog_pars_vertex>
        void main(){
          vUv=uv;
          vec3 p=position;
          p.x+=sin(uTime*5.0+uv.y*8.0+uPhase)*uv.y*uv.y*.07;
          vec4 mvPosition=modelViewMatrix*vec4(p,1.0);
          gl_Position=projectionMatrix*mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime,uPhase;
        #include <fog_pars_fragment>
        ${NOISE}
        void main(){
          float h=vUv.y;
          vec2 flow=vec2(vUv.x*4.6,h*3.3-uTime*2.9);
          float n=fbm(flow+uPhase*7.0);
          float filament=noise2(vec2(vUv.x*10.0,h*6.0-uTime*4.7));
          float center=.5+sin(h*8.0-uTime*3.7+uPhase)*h*.07;
          float width=(.43-pow(h,.72)*.34)*( .68+n*.57 );
          float tongueHeight=.63+n*.42+filament*.1;
          float sides=1.0-smoothstep(width*.42,width,abs(vUv.x-center));
          float tip=1.0-smoothstep(tongueHeight-.22,tongueHeight,h);
          float base=smoothstep(0.0,.035,h);
          float alpha=sides*tip*base*(.74+n*.25);
          if(alpha<.025)discard;
          float core=(1.0-smoothstep(.0,width*.68,abs(vUv.x-center)))*(1.0-smoothstep(.12,.64,h));
          vec3 color=mix(vec3(.95,.14,.014),vec3(1.0,.43,.027),clamp(n*.75+(1.0-h)*.35,0.0,1.0));
          color=mix(color,vec3(1.0,.88,.35),core*.93);
          gl_FragColor=vec4(color,alpha);
          #include <fog_fragment>
        }`,
    });
    const plane = new THREE.PlaneGeometry(.83, 1.28, 1, 8);
    plane.translate(0, .64, 0);
    geometries.push(plane);
    for (let i = 0; i < 3; i++) {
      const flame = new THREE.Mesh(plane, material);
      flame.rotation.y = i * Math.PI / 3;
      flame.scale.set(1 - i * .07, 1 - i * .09, 1);
      flame.renderOrder = 6;
      group.add(flame);
    }
    let light = null;
    const baseIntensity = options.intensity ?? 1.7;
    if (options.light !== false) {
      light = new THREE.PointLight(0xff982f, baseIntensity, (options.lightDistance ?? 5.5) * scale, 2);
      light.position.set(0, .46, 0);
      light.castShadow = false;
      group.add(light);
    }
    let sparkMaterial = null;
    if (options.embers !== false) {
      sparkMaterial = shaderMaterial({
        blending: THREE.AdditiveBlending,
        uniforms: uniforms({ uTime: { value: 0 }, uPhase: { value: phase }, uViewportHeight: { value: 720 } }),
        vertexShader: `
          attribute vec4 seed;
          uniform float uTime,uPhase,uViewportHeight;
          varying float vAlpha;
          #include <fog_pars_vertex>
          void main(){
            float age=fract((uTime+uPhase)/(1.1+seed.x*1.7)+seed.w);
            float a=seed.y*6.283185+age*2.0;
            vec3 p=vec3(cos(a)*(.05+age*.31),.16+age*(1.5+seed.z*.8),sin(a)*(.05+age*.25));
            vAlpha=smoothstep(0.0,.1,age)*(1.0-smoothstep(.35,1.0,age));
            vec4 mvPosition=modelViewMatrix*vec4(p,1.0);
            gl_Position=projectionMatrix*mvPosition;
            float s=length(modelViewMatrix[0].xyz);
            gl_PointSize=clamp(.012*s*uViewportHeight*.5*projectionMatrix[1][1]/max(.2,-mvPosition.z),1.0,4.0);
            #include <fog_vertex>
          }`,
        fragmentShader: `
          varying float vAlpha;
          #include <fog_pars_fragment>
          void main(){
            float a=(1.0-smoothstep(.1,.5,length(gl_PointCoord-.5)))*vAlpha;
            if(a<.02)discard;
            gl_FragColor=vec4(1.0,.31,.025,a);
            #include <fog_fragment>
          }`,
      });
      const sparks = new THREE.Points(pointGeometry(options.sparkCount || 28), sparkMaterial);
      sparks.frustumCulled = false;
      sparks.renderOrder = 7;
      group.add(sparks);
    }
    fireInstances.push({ group, material, sparkMaterial, light, baseIntensity, phase });
    group.userData.effectType = 'crossed-shader-flames';
    return group;
  }

  const fire = createFire();

  function update(time, dt) {
    if (disposed) return;
    const now = Number.isFinite(time) ? time : (lastTime ?? 0) + (dt || 1 / 60);
    const delta = Math.min(.15, Math.max(0, Number.isFinite(dt) ? dt : (lastTime === null ? 1 / 60 : now - lastTime)));
    lastTime = now;
    if (renderer && renderer.getDrawingBufferSize) renderer.getDrawingBufferSize(drawSize);
    smokeMaterial.uniforms.uTime.value = now;
    smokeMaterial.uniforms.uViewportHeight.value = drawSize.y;
    if (mode === 'gpgpu-float-pingpong' && smoke.visible) {
      accumulator += delta;
      if (accumulator >= STEP) {
        try {
          rendererStatePass(() => {
            let steps = 0;
            while (accumulator >= STEP && steps < 3) {
              const write = targets[targetIndex];
              simulationTime += STEP;
              simMaterial.uniforms.uState.value = currentTexture;
              simMaterial.uniforms.uTime.value = simulationTime;
              simMaterial.uniforms.uDt.value = STEP;
              renderer.setRenderTarget(write);
              renderer.setViewport(0, 0, GRID, GRID);
              renderer.render(simScene, simCamera);
              currentTexture = write.texture;
              targetIndex = 1 - targetIndex;
              accumulator -= STEP;
              steps++;
            }
          });
          smokeMaterial.uniforms.uState.value = currentTexture;
        } catch (error) {
          mode = 'analytic-shader';
          smoke.userData.gpuFallbackReason = error.message;
          delete smokeMaterial.defines.USE_GPU;
          smokeMaterial.needsUpdate = true;
        }
      }
    }
    for (const instance of steamInstances) {
      instance.material.uniforms.uTime.value = now;
      instance.material.uniforms.uViewportHeight.value = drawSize.y;
    }
    for (const instance of fireInstances) {
      instance.material.uniforms.uTime.value = now + instance.phase;
      if (instance.sparkMaterial) {
        instance.sparkMaterial.uniforms.uTime.value = now;
        instance.sparkMaterial.uniforms.uViewportHeight.value = drawSize.y;
      }
      if (instance.light) {
        const pulse = .88 + .075 * Math.sin(now * 13.7 + instance.phase) + .045 * Math.sin(now * 27.1);
        instance.light.intensity = instance.baseIntensity * pulse;
      }
    }
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const target of targets) target.dispose();
    for (const ownedTexture of ownedTextures) ownedTexture.dispose();
    for (const material of materials) material.dispose();
    for (const geometry of geometries) geometry.dispose();
    smoke.removeFromParent();
    for (const instance of steamInstances) instance.group.removeFromParent();
    for (const instance of fireInstances) instance.group.removeFromParent();
    fireInstances.length = 0;
    steamInstances.length = 0;
  }

  return {
    smoke, steam, fire, createFire, createSteam, update, dispose,
    get mode() { return mode; },
    setWind(x, z) { wind.set(x, z); smokeMaterial.uniforms.uWind.value.copy(wind); },
    setSmokeOpacity(opacity) { smokeMaterial.uniforms.uOpacity.value = Math.max(0, Math.min(.5, opacity)); },
  };
}
