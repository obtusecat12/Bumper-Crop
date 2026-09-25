// Opt-in local diagnostics. One asynchronous GPU query at a time, at most once
// per 60 frames. Never wait for a result or change the scene/quality settings.
export function createPerformanceMeter(renderer, clock = () => performance.now()) {
  let gl, ext, initialized = false, frame = 0, lastQueryFrame = -60, pending = null, active = false, enabled = false, start = 0, renderStart = 0;
  const values = {cpu: null, gpu: null, calls: 0, triangles: 0, supported: null, simulation: null, submission: null};
  const average = (old, next) => old === null ? next : old * .9 + next * .1;
  function drop() { if (pending) gl.deleteQuery(pending); pending = null; active = false; }
  function begin(value) {
    enabled = value; frame++;
    if (!enabled) { if (pending) drop(); return; }
    start = clock();renderStart=start;
    if (!initialized) {
      gl = renderer.getContext(); ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
      initialized = true; values.supported = !!ext;
    }
    // Poll on a later animation frame, sparsely. QUERY_RESULT is only read
    // after availability; a disjoint interval is discarded rather than shown.
    if (pending && frame % 10 === 0) {
      const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT);
      const available = gl.getQueryParameter(pending, gl.QUERY_RESULT_AVAILABLE);
      if (disjoint) { values.gpu = null; drop(); }
      else if (available) {
        const ms = gl.getQueryParameter(pending, gl.QUERY_RESULT) / 1e6;
        if (Number.isFinite(ms) && ms >= 0) values.gpu = average(values.gpu, ms);
        drop();
      }
    }
  }
  function beforeRender() {
    // VHS presents cached frames between captures. Wait for an actual scene
    // draw after the interval, rather than repeatedly timing only the blit.
    if (!enabled || !ext || pending || frame - lastQueryFrame < 60) return;
    gl.getParameter(ext.GPU_DISJOINT_EXT);
    pending = gl.createQuery();
    if (pending) { gl.beginQuery(ext.TIME_ELAPSED_EXT, pending); active = true; lastQueryFrame = frame; }
  }
  function markSimulation(){if(enabled){renderStart=clock();values.simulation=average(values.simulation,renderStart-start);}}
  function end() {
    if (active) { gl.endQuery(ext.TIME_ELAPSED_EXT); active = false; }
    if (!enabled) return;
    const end=clock();values.cpu = average(values.cpu, end - start);values.submission=average(values.submission,end-renderStart);
    values.calls = renderer.info.render.calls; values.triangles = renderer.info.render.triangles;
  }
  function reset() {
    // Lost-context handles are invalid and cannot be queried or deleted.
    pending = null; active = false; initialized = false; ext = null;
    values.cpu = values.gpu = values.supported = null;
  }
  return {begin, beforeRender, markSimulation, end, reset, values};
}
