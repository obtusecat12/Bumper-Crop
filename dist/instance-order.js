// Exact, camera-sector ordering for opaque wheat-card instances.
// The worker prepares eight small index permutations. The main thread swaps
// complete matrix/color records in place, only when a visible mesh's sector
// changes. No geometry, RNG, density, instance count, or extra draw is involved.
import * as T from './vendor/three.module.min.js';

export const CARD_ORDER_KEY = 'cardDrawOrder';
const SECTORS = 8, SECTOR_ANGLE = Math.PI / 4;
const eligible = mesh => mesh?.isInstancedMesh && mesh.count > 0 && mesh.name === 'dense-wheat-cards' &&
  !Array.isArray(mesh.material) && mesh.material?.transparent !== true && !mesh.morphTexture;

/** Worker-side preparation; keep this optional metadata next to the mesh.
 * Eight Uint16 permutations cost 16 bytes per clump (<65536 clumps/mesh).
 * The matrices/colors themselves are not copied or changed.
 */
export function prepareCardDrawOrder(mesh) {
  if (!eligible(mesh)) return null;
  const count = mesh.count, matrix = mesh.instanceMatrix.array;
  if (matrix.length !== count * 16 || (mesh.instanceColor && mesh.instanceColor.count !== count)) return null;
  const Index = count <= 65535 ? Uint16Array : Uint32Array, orders = [];
  for (let sector = 0; sector < SECTORS; sector++) {
    const angle = sector * SECTOR_ANGLE, dx = Math.cos(angle), dz = Math.sin(angle);
    const indices = Index.from({ length: count }, (_, i) => i);
    indices.sort((a, b) => (matrix[a * 16 + 12] * dx + matrix[a * 16 + 14] * dz) -
      (matrix[b * 16 + 12] * dx + matrix[b * 16 + 14] * dz) || a - b);
    orders.push(indices);
  }
  return { version: 1, count, sectors: SECTORS, orders };
}

/** Optional standalone helper for the packer. It shallow-copies userData while
 * letting the permutation arrays travel once by transfer, like instanceMatrix.
 * Other userData values continue through the caller's existing clone function.
 */
export function packCardOrderUserData(userData, clone, addTransfer) {
  const data = userData?.[CARD_ORDER_KEY];
  if (!data) return clone(userData);
  const { [CARD_ORDER_KEY]: ignored, ...rest } = userData;
  const packed = clone(rest);
  packed[CARD_ORDER_KEY] = data;
  for (const order of data.orders) addTransfer(order.buffer);
  return packed;
}

/** The unpacker has already received ownership of the transferred arrays.
 * Copy ordinary metadata as before without cloning these arrays a second time.
 */
export function unpackCardOrderUserData(userData, clone) {
  const data = userData?.[CARD_ORDER_KEY];
  if (!data) return clone(userData);
  const { [CARD_ORDER_KEY]: ignored, ...rest } = userData;
  const unpacked = clone(rest); unpacked[CARD_ORDER_KEY] = data; return unpacked;
}

export function createCardOrderController({ maxUploadBytes = 1024 * 1024, hysteresis = Math.PI / 24 } = {}) {
  const records = new Map(), states = new WeakMap(), forward = new T.Vector3(), frustum = new T.Frustum(), projection = new T.Matrix4();
  const sphere = new T.Sphere(), center = new T.Vector3();
  let targetSector = null;
  const stats = { meshes: 0, sector: null, pendingMeshes: 0, updatedMeshes: 0, uploadBytes: 0,
    totalUpdatedMeshes: 0, totalUploadBytes: 0 };
  function remove(mesh) {
    const record = records.get(mesh); if (!record) return;
    mesh.removeEventListener('dispose', record.onDispose); records.delete(mesh); stats.meshes = records.size;
  }
  function register(root) {
    root.traverse(mesh => {
      if (!eligible(mesh) || records.has(mesh)) return;
      const data = mesh.userData[CARD_ORDER_KEY];
      // Main-thread fallback deliberately leaves the original order intact.
      // Preparation belongs in the worker/staged builder, never movement frames.
      if (!data || data.version !== 1 || data.count !== mesh.count || data.orders.length !== SECTORS ||
        data.orders.some(a => !ArrayBuffer.isView(a) || a.length !== mesh.count)) return;
      const Index = data.orders[0].constructor;
      const previous = states.get(mesh);
      const current = previous?.current || Index.from({ length: mesh.count }, (_, i) => i), slots = previous?.slots || current.slice();
      const record = { mesh, data, current, slots, sector: previous?.sector ?? null, onDispose: () => remove(mesh),
        bytes: mesh.instanceMatrix.array.byteLength + (mesh.instanceColor?.array.byteLength || 0) };
      // Static arrays still upload correctly, but DynamicDrawUsage advertises the
      // occasional sector changes. Register before the mesh's first rendering.
      mesh.instanceMatrix.setUsage(T.DynamicDrawUsage); mesh.instanceColor?.setUsage(T.DynamicDrawUsage);
      mesh.addEventListener('dispose', record.onDispose); records.set(mesh, record); states.set(mesh, record);
    });
    stats.meshes = records.size;
  }
  function reorder(record, sector) {
    const { mesh, current, slots } = record, order = record.data.orders[sector];
    const matrix = mesh.instanceMatrix.array, colors = mesh.instanceColor?.array;
    for (let i = 0; i < order.length; i++) {
      const wanted = order[i], from = slots[wanted]; if (from === i) continue;
      const displaced = current[i];
      for (let k = 0; k < 16; k++) { const at = i * 16 + k, src = from * 16 + k, value = matrix[at]; matrix[at] = matrix[src]; matrix[src] = value; }
      if (colors) for (let k = 0; k < 3; k++) { const at = i * 3 + k, src = from * 3 + k, value = colors[at]; colors[at] = colors[src]; colors[src] = value; }
      current[i] = wanted; current[from] = displaced; slots[wanted] = i; slots[displaced] = from;
    }
    mesh.instanceMatrix.clearUpdateRanges(); mesh.instanceMatrix.addUpdateRange(0, matrix.length); mesh.instanceMatrix.needsUpdate = true;
    if (colors) { mesh.instanceColor.clearUpdateRanges(); mesh.instanceColor.addUpdateRange(0, colors.length); mesh.instanceColor.needsUpdate = true; }
    // Reordering leaves the existing conservative bounds valid.
    record.sector = sector;
  }
  function update(camera) {
    stats.updatedMeshes = 0; stats.uploadBytes = 0; stats.pendingMeshes = 0;
    camera.getWorldDirection(forward);
    if (forward.x * forward.x + forward.z * forward.z > .0001) {
      const angle = Math.atan2(forward.z, forward.x);
      const delta = targetSector === null ? Infinity : Math.atan2(Math.sin(angle - targetSector * SECTOR_ANGLE), Math.cos(angle - targetSector * SECTOR_ANGLE));
      if (Math.abs(delta) > SECTOR_ANGLE / 2 + hysteresis) targetSector = (Math.round(angle / SECTOR_ANGLE) % SECTORS + SECTORS) % SECTORS;
    }
    stats.sector = targetSector; if (targetSector === null) return stats;
    projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); frustum.setFromProjectionMatrix(projection);
    const pending = [];
    for (const record of records.values()) {
      if (record.sector === targetSector || !record.mesh.visible) continue;
      const mesh = record.mesh;
      // Only pending meshes update their matrices here; steady walking with a
      // stable sector never recomposes instance matrices or uploads buffers.
      mesh.updateWorldMatrix(true, false);
      if (!mesh.boundingSphere) mesh.computeBoundingSphere();
      sphere.copy(mesh.boundingSphere).applyMatrix4(mesh.matrixWorld);
      if (mesh.frustumCulled && !frustum.intersectsSphere(sphere)) continue;
      center.copy(sphere.center); record.distance = center.distanceToSquared(camera.position); pending.push(record);
    }
    pending.sort((a, b) => a.distance - b.distance); stats.pendingMeshes = pending.length;
    for (const record of pending) {
      if (stats.updatedMeshes && stats.uploadBytes + record.bytes > maxUploadBytes) break;
      reorder(record, targetSector); stats.updatedMeshes++; stats.uploadBytes += record.bytes;
    }
    stats.pendingMeshes -= stats.updatedMeshes; stats.totalUpdatedMeshes += stats.updatedMeshes; stats.totalUploadBytes += stats.uploadBytes;
    return stats;
  }
  return { register, update, stats, unregister(root) { root.traverse(remove); }, dispose() { for (const mesh of [...records.keys()]) remove(mesh); } };
}
