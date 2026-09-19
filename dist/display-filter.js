import * as T from './vendor/three.module.min.js';
import {createFrameReadback} from './frame-readback.js?v=14';

export const VHS_SIGNAL_SIZE=Object.freeze({width:640,height:480});
export const FILTERS = Object.freeze(['vhs', 'pixel', 'ps1', 'native']);
export function displayFrame(filter,width,height){
  const w=filter==='vhs'?Math.min(width,height*4/3):width,h=filter==='vhs'?w*3/4:height;
  return {width:w,height:h,left:(width-w)/2,top:(height-h)/2,aspect:w/Math.max(1,h)};
}
export function displaySize(filter, quality, width, height, autoScale = 1) {
  // 1080 progressive lines, square pixels, with the existing 4:3 camera.
  if(filter==='vhs')return {width:1440,height:1080};
  const aspect = Math.max(.2, width / Math.max(1, height));
  if (filter === 'ps1') {
    const h = Math.max(2, Math.min(320, Math.floor(1920 / aspect)));
    return {width: Math.max(2, Math.round(h * aspect / 2) * 2), height: h};
  }
  const scale = (filter === 'pixel' ? quality === 'high' ? .75 : quality === 'low' ? .48 : .62 : 1) * autoScale;
  const maxWidth = quality === 'low' ? 1100 : quality === 'high' ? 1920 : 1600;
  const w = Math.min(width * scale, maxWidth);
  return {width: Math.max(320, Math.floor(w)), height: Math.max(200, Math.floor(w / aspect))};
}

export const DISPLAY_VERTEX = `precision highp float;
in vec3 position;
out vec2 vUv;
void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position,1.0);}`;
export const DISPLAY_FRAGMENT = `precision highp float;
precision highp int;
uniform sampler2D picture;
uniform sampler2D detailPicture;
uniform sampler2D lowPicture;
uniform vec2 detailTexel;
uniform int filterMode;
uniform float frameHeight;
in vec2 vUv;
out vec4 outColor;
// PS1 GPU's signed 4x4 dither matrix before RGB555 truncation.
const int dither[16]=int[16](-4,0,-3,1,2,-2,3,-1,-3,1,-4,0,3,-1,2,-2);
void main(){
  vec2 uv=filterMode==0?vec2(vUv.x,1.0-vUv.y):vUv;
  vec3 c=texture(picture,uv).rgb;
  if(filterMode==2){
    // Area sample the HD scene into the lower bandwidth tape signal.
    vec2 d=detailTexel*.65;
    c=(texture(picture,uv+vec2(d.x,d.y)).rgb+texture(picture,uv+vec2(-d.x,d.y)).rgb+
       texture(picture,uv+vec2(d.x,-d.y)).rgb+texture(picture,uv-d).rgb)*.25;
  }else if(filterMode==0){
    // Matched-frame luminance detail, never a sharpened upscale of the tape.
    // Chroma, low-frequency luma, noise and phase remain official ntsc-rs.
    vec3 hd=texture(detailPicture,vUv).rgb*.5;
    hd+=(texture(detailPicture,vUv+vec2(detailTexel.x,0)).rgb+
         texture(detailPicture,vUv-vec2(detailTexel.x,0)).rgb+
         texture(detailPicture,vUv+vec2(0,detailTexel.y)).rgb+
         texture(detailPicture,vUv-vec2(0,detailTexel.y)).rgb)*.125;
    float detail=dot(hd-texture(lowPicture,vUv).rgb,vec3(.299,.587,.114));
    c+=vec3(clamp(detail,-.16,.16)*.72*smoothstep(.012,.035,vUv.y));
    c=clamp(c,0.0,1.0);
  }
  if(filterMode==1){
    int x=int(gl_FragCoord.x)&3;
    int y=int(frameHeight-gl_FragCoord.y)&3;
    // Recover the source byte before truncation; normalized texture values
    // can otherwise round just below an integer and lose a whole 5-bit step.
    c=clamp(floor((floor(c*255.0+.5)+float(dither[y*4+x]))/8.0),0.0,31.0)/31.0;
  }
  // Samples already contain display-encoded RGB. No second tone map/gamma.
  outColor=vec4(c,1.0);
}`;

export function createDisplayFilter(renderer, {onError = () => {}} = {}) {
  const readback = createFrameReadback(renderer.getContext());
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute([-1,-1,0, 3,-1,0, -1,3,0], 3));
  const material = new T.RawShaderMaterial({glslVersion: T.GLSL3,
    vertexShader: DISPLAY_VERTEX, fragmentShader: DISPLAY_FRAGMENT,
    uniforms: {picture: {value: null},detailPicture:{value:null},lowPicture:{value:null},detailTexel:{value:new T.Vector2(1/1440,1/1080)}, filterMode: {value: 0}, frameHeight: {value: 480}},
    depthTest: false, depthWrite: false, toneMapped: false, blending: T.NoBlending});
  const screen = new T.Scene(), camera = new T.Camera(), quad = new T.Mesh(geometry, material);
  quad.frustumCulled = false; screen.add(quad);
  renderer.info.autoReset = false;
  let mode = 'native', width = 0, height = 0, epoch = 0, disposed = false;
  let worker = null, workerReady = false, failed = false, inFlight = null, workerTimer = null;
  let texture = null, framebuffer = null, spare = null, lastCapture = -Infinity, lastOutput = 0;
  let capturePair=null,displayPair=null;
  const values = {ms: null, latency: null, fps: 0};
  const smooth = (a,b) => a === null ? b : a * .85 + b * .15;
  function fail(error) {
    if (failed || disposed) return;
    failed = true; workerReady = false; epoch++; inFlight = null;
    clearTimeout(workerTimer); readback.cancel(); worker?.terminate(); worker = null;
    console.error('VHS filter failed', error);
    onError(error);
  }
  function startWorker() {
    if (worker || failed || disposed) return;
    try {
      worker = new Worker(new URL('./vhs-worker.js?v=19', import.meta.url), {type: 'module', name: 'ntsc-rs-vhs'});
      workerTimer = setTimeout(() => fail(new Error('VHS initialization timed out')), 15000);
      worker.onerror = event => {event.preventDefault?.(); fail(new Error(event.message || 'VHS worker failed'));};
      worker.onmessageerror = () => fail(new Error('VHS frame transfer failed'));
      worker.onmessage = ({data}) => {
        if (data.type === 'error') {fail(new Error(data.message)); return;}
        if (data.type === 'ready') {clearTimeout(workerTimer); workerReady = true; return;}
        if (data.type !== 'frame') return;
        clearTimeout(workerTimer); inFlight = null;
        if (data.epoch !== epoch || mode !== 'vhs' || disposed || data.width !== VHS_SIGNAL_SIZE.width || data.height !== VHS_SIGNAL_SIZE.height) return;
        if (!(data.buffer instanceof ArrayBuffer) || data.buffer.byteLength !== VHS_SIGNAL_SIZE.width * VHS_SIGNAL_SIZE.height * 4) {
          fail(new Error('VHS frame size mismatch')); return;
        }
        const now = performance.now();
        values.ms = smooth(values.ms, data.ms); values.latency = smooth(values.latency, now - data.capturedAt);
        if (lastOutput && now - lastOutput < 1000) values.fps = values.fps ? values.fps * .85 + 1000 / (now - lastOutput) * .15 : 1000 / (now - lastOutput);
        lastOutput = now;
        if (!texture) {
          texture = new T.DataTexture(new Uint8Array(data.buffer), VHS_SIGNAL_SIZE.width, VHS_SIGNAL_SIZE.height, T.RGBAFormat);
          texture.minFilter = texture.magFilter = T.LinearFilter;
          texture.generateMipmaps = false; texture.colorSpace = T.NoColorSpace;
        } else {
          spare = texture.image.data; texture.image.data = new Uint8Array(data.buffer);
        }
        texture.needsUpdate = true;
        // The high-detail and pre-filter signal textures belong to this exact
        // captured frame. Never mix new camera motion with an older tape frame.
        [capturePair,displayPair]=[displayPair,capturePair];
      };
    } catch (error) {fail(error);}
  }
  function newPair(){
    const hi=new T.FramebufferTexture(width,height),low=new T.FramebufferTexture(VHS_SIGNAL_SIZE.width,VHS_SIGNAL_SIZE.height);
    for(const t of [hi,low]){t.colorSpace=T.NoColorSpace;t.minFilter=t.magFilter=T.LinearFilter;t.generateMipmaps=false;}
    return{hi,low};
  }
  function disposePairs(){for(const pair of [capturePair,displayPair])if(pair){pair.hi.dispose();pair.low.dispose();}capturePair=displayPair=null;}
  function configure(nextMode, w, h) {
    if (disposed || (mode === nextMode && width === w && height === h)) return;
    epoch++; readback.cancel();
    // An already running WASM frame finishes, then is discarded by epoch.
    if (inFlight?.phase === 'readback') inFlight = null;
    mode = nextMode; width = w; height = h; lastCapture = -Infinity; lastOutput = 0;
    texture?.dispose(); texture = null; framebuffer?.dispose(); framebuffer = null; spare = null;disposePairs();
    material.uniforms.picture.value=material.uniforms.detailPicture.value=material.uniforms.lowPicture.value=null;
    values.ms = values.latency = null; values.fps = 0;
    if (mode === 'vhs') {
      capturePair=newPair();displayPair=newPair();failed = false; startWorker();
    } else if (mode === 'ps1') {
      framebuffer = new T.FramebufferTexture(width, height);
      framebuffer.colorSpace = T.NoColorSpace;
    }
  }
  function present(picture, ps1) {
    material.uniforms.picture.value = picture; material.uniforms.filterMode.value = ps1 ? 1 : 0;
    material.uniforms.frameHeight.value = height;
    if(!ps1&&displayPair){material.uniforms.detailPicture.value=displayPair.hi;material.uniforms.lowPicture.value=displayPair.low;material.uniforms.detailTexel.value.set(1/width,1/height);}
    renderer.render(screen, camera);
  }
  function render(scene, view, now, beforeScene) {
    renderer.info.reset();
    if (mode === 'pixel' || mode === 'native' || failed) {beforeScene?.(); renderer.render(scene, view); return;}
    if (mode === 'ps1') {
      beforeScene?.(); renderer.render(scene, view); renderer.copyFramebufferToTexture(framebuffer); present(framebuffer, true); return;
    }
    // A single frame in flight bounds both latency and memory. The 3D scene
    // only renders when a new tape frame can be processed (up to 60 fps).
    // Input, simulation and UI still run on requestAnimationFrame.
    if (workerReady && !inFlight && now - lastCapture >= 16) {
      beforeScene?.(); renderer.render(scene, view);
      renderer.copyFramebufferToTexture(capturePair.hi);
      material.uniforms.picture.value=capturePair.hi;material.uniforms.filterMode.value=2;
      material.uniforms.detailTexel.value.set(1/width,1/height);
      renderer.setViewport(0,0,VHS_SIGNAL_SIZE.width,VHS_SIGNAL_SIZE.height);
      renderer.render(screen,camera);renderer.copyFramebufferToTexture(capturePair.low);
      const {width:sw,height:sh}=VHS_SIGNAL_SIZE;
      const pixels=spare?.byteLength===sw*sh*4?spare:new Uint8Array(sw*sh*4);
      spare=null;lastCapture=now;
      const job={epoch,width:sw,height:sh,capturedAt:now,phase:'readback'};inFlight=job;
      const pending=readback.capture(sw,sh,pixels);
      renderer.setViewport(0,0,width,height);
      // First frame has no completed tape image yet. Show its real HD source.
      if(!texture){material.uniforms.picture.value=capturePair.hi;material.uniforms.filterMode.value=3;renderer.render(screen,camera);}
      pending.then(bytes => {
        if (inFlight !== job || job.epoch !== epoch || disposed) return;
        job.phase = 'worker';
        workerTimer = setTimeout(() => fail(new Error('VHS processing timed out')), 10000);
        // Both/progressive mode runs one complete field. Its phase/noise time
        // follows the 59.94 Hz NTSC field clock even if a slow frame is skipped.
        worker.postMessage({type: 'frame', buffer: bytes.buffer, width: job.width, height: job.height,
          epoch: job.epoch, capturedAt: job.capturedAt, frame: Math.floor(job.capturedAt * 60 / 1001)}, [bytes.buffer]);
      }).catch(error => {if (inFlight === job) inFlight = null; if (error.name !== 'AbortError') fail(error);});
    } else if (!texture) {beforeScene?.(); renderer.render(scene, view);}
    if (texture) present(texture, false);
  }
  function contextLost() {
    epoch++; readback.cancel(true); if (inFlight?.phase === 'readback') inFlight = null;
    width = height = 0; // Force texture/fence recreation when restored.
  }
  function dispose() {
    disposed = true; epoch++; clearTimeout(workerTimer); readback.cancel(renderer.getContext().isContextLost());
    worker?.terminate(); texture?.dispose(); framebuffer?.dispose();disposePairs(); geometry.dispose(); material.dispose();
  }
  return {configure, render, contextLost, dispose, values};
}
