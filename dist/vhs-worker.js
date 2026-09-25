import {createVhsCore} from './vhs-core.js?v=44';

let core;
try {
  core = await createVhsCore();
  self.postMessage({type: 'ready'});
} catch (error) {
  self.postMessage({type: 'error', message: String(error?.message || error)});
}
self.onmessage = ({data}) => {
  if (!core || data.type !== 'frame') return;
  const {buffer, width, height, frame, epoch, capturedAt, sequence, pregradedTopDown} = data, start = performance.now();
  try {
    core.process(buffer, width, height, frame, {pregradedTopDown});
    self.postMessage({type: 'frame', buffer, width, height, epoch, capturedAt, sequence, ms: performance.now() - start}, [buffer]);
  } catch (error) {
    self.postMessage({type: 'error', message: String(error?.message || error)});
  }
};
