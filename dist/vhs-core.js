import initialize, {NtscEffectBuf, NtscSettingsList} from './vendor/ntsc-rs/ntsc-rs.js';
import {VHS_PRESET, VHS_SATURATION} from './vhs-preset.js?v=28';

// This wraps the unmodified official WASM. The only input adjustment is the
// requested saturation lift; no reimplementation of the analog signal chain.
export async function createVhsCore(moduleOrPath) {
  if (!moduleOrPath) {
    // The official web app likewise prefers relaxed SIMD where supported.
    // Compile first: a rejected feature must not partially initialize the glue.
    try {
      const response = await fetch(new URL('./vendor/ntsc-rs/ntsc_rs_web_wrapper_relaxed_bg.wasm', import.meta.url));
      if (!response.ok) throw new Error('Relaxed SIMD unavailable');
      moduleOrPath = await WebAssembly.compile(await response.arrayBuffer());
    } catch {
      moduleOrPath = new URL('./vendor/ntsc-rs/ntsc_rs_web_wrapper_bg.wasm', import.meta.url);
    }
  }
  const wasm = await initialize({module_or_path: moduleOrPath});
  const list = new NtscSettingsList(), effect = new NtscEffectBuf();
  const preset = {...JSON.parse(list.defaultPreset()), ...VHS_PRESET};
  effect.setEffectSettings(list.settingsFromJSON(JSON.stringify(preset)));
  list.free();
  return {
    preset,
    process(buffer, width, height, frame, {pregradedTopDown = false} = {}) {
      if (!(buffer instanceof ArrayBuffer) || !Number.isInteger(width) || !Number.isInteger(height) ||
          width < 2 || height < 2 || width > 1920 || height > 1080 ||
          buffer.byteLength !== width * height * 4 || !Number.isSafeInteger(frame) || frame < 0) {
        throw new Error('Invalid VHS frame');
      }
      const input = new Uint8Array(buffer), target = effect.inputBuffer(width, height), stride = width * 4;
      // WebGL readback is bottom-up. ntsc-rs expects display-encoded sRGB,
      // top-down. Grade and flip together, in the worker, without extra buffers.
      if (pregradedTopDown) target.set(input);
      else for (let y = 0; y < height; y++) {
        let src = (height - 1 - y) * stride, dst = y * stride;
        for (let x = 0; x < width; x++, src += 4, dst += 4) {
          const r = input[src], g = input[src + 1], b = input[src + 2], luma = .299 * r + .587 * g + .114 * b;
          target[dst] = Math.min(255, Math.max(0, Math.round(luma + (r - luma) * VHS_SATURATION)));
          target[dst + 1] = Math.min(255, Math.max(0, Math.round(luma + (g - luma) * VHS_SATURATION)));
          target[dst + 2] = Math.min(255, Math.max(0, Math.round(luma + (b - luma) * VHS_SATURATION)));
          target[dst + 3] = 255;
        }
      }
      const out = effect.applyEffect(frame, width, height, 1, false, true, 0, 0, width, height, 0);
      try {
        if (out.width !== width || out.height !== height || out.len !== input.length) throw new Error('Unexpected VHS output size');
        // Reacquire the memory view after applyEffect, which can grow memory.
        input.set(new Uint8Array(wasm.memory.buffer, out.ptr, out.len));
      } finally { out.free(); }
      return buffer; // Top-down, opaque RGBA, same transferable buffer.
    },
    dispose() { effect.free(); },
  };
}
