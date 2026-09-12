// Nonblocking default-framebuffer readback. Capture the renderer's actual
// sRGB/ACES output before replacing it with the previous processed frame.
// One PBO/fence maximum, no gl.finish(), synchronous readPixels or busy wait.
export function createFrameReadback(gl) {
  let pbo = null, capacity = 0, pending = null;
  function cancel(lost = false) {
    if (pending) {
      const p = pending; pending = null; clearTimeout(p.timer);
      if (!lost) gl.deleteSync(p.sync);
      p.reject(Object.assign(new Error('Frame cancelled'), {name: 'AbortError'}));
    }
    if (pbo && !lost) gl.deleteBuffer(pbo);
    pbo = null; capacity = 0;
  }
  function capture(width, height, pixels) {
    if (pending) return Promise.reject(new Error('Readback already pending'));
    if (gl.isContextLost()) return Promise.reject(Object.assign(new Error('Context lost'), {name: 'AbortError'}));
    pbo ||= gl.createBuffer();
    if (!pbo) return Promise.reject(new Error('Pixel buffer unavailable'));
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pbo);
    if (capacity !== pixels.byteLength) {
      gl.bufferData(gl.PIXEL_PACK_BUFFER, pixels.byteLength, gl.STREAM_READ);
      capacity = pixels.byteLength;
    }
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, 0);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    if (!sync) return Promise.reject(new Error('Frame fence unavailable'));
    gl.flush();
    return new Promise((resolve, reject) => {
      const p = {sync, reject, timer: null, start: performance.now()}; pending = p;
      function poll() {
        if (pending !== p) return;
        if (gl.isContextLost()) { cancel(true); return; }
        const result = gl.clientWaitSync(sync, 0, 0);
        if (result === gl.TIMEOUT_EXPIRED && performance.now() - p.start < 5000) {
          p.timer = setTimeout(poll, 2); return;
        }
        pending = null; gl.deleteSync(sync);
        if (result !== gl.ALREADY_SIGNALED && result !== gl.CONDITION_SATISFIED) {
          reject(new Error('Frame readback failed')); return;
        }
        try {
          gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pbo);
          gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, pixels);
          resolve(pixels);
        } catch (error) { reject(error); }
        finally { gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null); }
      }
      p.timer = setTimeout(poll, 0);
    });
  }
  return {capture, cancel};
}
