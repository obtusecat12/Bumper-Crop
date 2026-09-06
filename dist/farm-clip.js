import * as T from './vendor/three.module.min.js';

const EPSILON = 1e-7;
const WIND_PADDING = .25;
const meshFlags = ['castShadow', 'receiveShadow', 'renderOrder', 'frustumCulled',
  'customDepthMaterial', 'customDistanceMaterial', 'onBeforeRender', 'onAfterRender',
  'onBeforeShadow', 'onAfterShadow'];

function localMatrix(object) {
  return object.matrixAutoUpdate
    ? new T.Matrix4().compose(object.position, object.quaternion, object.scale)
    : object.matrix.clone();
}
function ancestorMatrix(object) {
  if (!object) return new T.Matrix4();
  if (object.matrixWorldAutoUpdate === false) return object.matrixWorld.clone();
  return ancestorMatrix(object.parent).multiply(localMatrix(object));
}
function copyFlags(from, to) {
  for (const key of meshFlags) to[key] = from[key];
  to.layers.mask = from.layers.mask;
  to.userData = {...from.userData};
}
function interpolate(a, b, t, axis, boundary) {
  const vertex = {};
  for (const name of Object.keys(a)) vertex[name] = a[name].map((x, i) => x + (b[name][i] - x) * t);
  vertex.position[axis] = boundary;
  return vertex;
}
function clipPlane(polygon, axis, boundary, direction) {
  if (!polygon.length) return polygon;
  const result = [];
  let a = polygon[polygon.length - 1], da = (a.position[axis] - boundary) * direction;
  for (const b of polygon) {
    const db = (b.position[axis] - boundary) * direction;
    if ((da >= 0) !== (db >= 0)) result.push(interpolate(a, b, da / (da - db), axis, boundary));
    if (db >= 0) result.push(b);
    a = b; da = db;
  }
  return result;
}
function areaSquared(a, b, c) {
  const x = b[0] - a[0], y = b[1] - a[1], z = b[2] - a[2];
  const u = c[0] - a[0], v = c[1] - a[1], w = c[2] - a[2];
  return (y * w - z * v) ** 2 + (z * u - x * w) ** 2 + (x * v - y * u) ** 2;
}
function rawComponent(attribute, index, component) {
  if (attribute.isInterleavedBufferAttribute) return attribute.data.array[index * attribute.data.stride + attribute.offset + component];
  return attribute.array[index * attribute.itemSize + component];
}
function geometryBounds(geometry) {
  return geometry.boundingBox ? geometry.boundingBox.clone()
    : new T.Box3().setFromBufferAttribute(geometry.getAttribute('position'));
}

/**
 * Partition a static farm hierarchy into one XZ tile, without changing it.
 * All ancestors/root transforms are included; output has identity transform
 * and tile-local X/Z coordinates (Y is unchanged). Add group to its tile root.
 * Meshes are clipped exactly; foliage instances belong to [min,max) by center.
 * Returned ordinary geometries / instance buffers are owned by this output.
 * Instanced geometries/materials/custom shadow materials remain SHARED.
 * Caller must retain its existing shared-resource disposal guard.
 */
export function clipStaticSceneToTile(root, tileMinX, tileMinZ, size = 64) {
  if (!root?.isObject3D) throw new TypeError('clipStaticSceneToTile needs an Object3D root');
  if (![tileMinX, tileMinZ, size].every(Number.isFinite) || size <= 0) throw new RangeError('Tile coordinates and positive size must be finite');
  const maxX = tileMinX + size, maxZ = tileMinZ + size;
  const group = new T.Group(); group.name = `${root.name || 'farm'} / tile ${tileMinX},${tileMinZ}`;
  group.userData.farmTile = {minX: tileMinX, minZ: tileMinZ, size};
  const stats = {sourceMeshes: 0, sourceInstances: 0, testedTriangles: 0, keptSourceTriangles: 0,
    clippedSourceTriangles: 0, outputTriangles: 0, selectedInstances: 0, outputMeshes: 0,
    outputInstancedMeshes: 0, ownedGeometries: 0, attributeBytes: 0};
  const batches = new Map(), identifiers = new Map(); let nextId = 0;
  const id = value => {if (!identifiers.has(value)) identifiers.set(value, nextId++); return identifiers.get(value);};
  const point = new T.Vector3(), direction = new T.Vector3(), normalMatrix = new T.Matrix3();
  const instanceMatrix = new T.Matrix4(), composed = new T.Matrix4();
  function batchFor(mesh, material, schema, groupOrder) {
    const key = [id(material), schema.map(([n, a]) => `${n}:${a.itemSize}`).join('|'),
      meshFlags.map(k => id(mesh[k])).join(','), mesh.layers.mask, groupOrder].join(';');
    if (!batches.has(key)) batches.set(key, {mesh, material, schema,
      groupOrder, arrays: Object.fromEntries(schema.map(([n]) => [n, []])), triangles: 0});
    return batches.get(key);
  }
  function addTriangle(batch, a, b, c) {
    if (areaSquared(a.position, b.position, c.position) <= 1e-20) return;
    for (const vertex of [a, b, c]) {
      for (const [name] of batch.schema) {
        const value = vertex[name];
        if (name === 'position') batch.arrays[name].push(value[0] - tileMinX, value[1], value[2] - tileMinZ);
        else if (name === 'normal') {
          const length = Math.hypot(...value) || 1;
          batch.arrays[name].push(...value.map(x => x / length));
        } else batch.arrays[name].push(...value);
      }
    }
    batch.triangles++; stats.outputTriangles++;
  }
  function placeOutput(mesh, groupOrder) {
    if (groupOrder) {
      let holder = group.children.find(c => c.isGroup && c.renderOrder === groupOrder);
      if (!holder) {holder = new T.Group(); holder.renderOrder = groupOrder; group.add(holder);}
      holder.add(mesh);
    } else group.add(mesh);
  }
  function partitionInstances(mesh, world, groupOrder) {
    stats.sourceInstances += mesh.count;
    const selected = [];
    for (let index = 0; index < mesh.count; index++) {
      mesh.getMatrixAt(index, instanceMatrix); composed.multiplyMatrices(world, instanceMatrix);
      const e = composed.elements;
      if (e[12] >= tileMinX && e[12] < maxX && e[14] >= tileMinZ && e[14] < maxZ) selected.push(index);
    }
    if (!selected.length) return;
    if (mesh.morphTexture) throw new Error('Farm tile clipping does not support instanced morph targets');
    const result = new T.InstancedMesh(mesh.geometry, mesh.material, selected.length);
    copyFlags(mesh, result); result.name = mesh.name + ' / tile foliage';
    result.userData.farmSharedGeometry = true;
    result.instanceMatrix.setUsage(mesh.instanceMatrix.usage);
    if (mesh.instanceColor) {
      const color = mesh.instanceColor, sourceArray = color.isInterleavedBufferAttribute ? color.data.array : color.array;
      result.instanceColor = new T.InstancedBufferAttribute(new sourceArray.constructor(selected.length * color.itemSize), color.itemSize, color.normalized);
      result.instanceColor.setUsage(color.usage ?? color.data?.usage ?? T.StaticDrawUsage);
    }
    const localBounds = geometryBounds(mesh.geometry), bounds = new T.Box3();
    selected.forEach((sourceIndex, outputIndex) => {
      mesh.getMatrixAt(sourceIndex, instanceMatrix); composed.multiplyMatrices(world, instanceMatrix);
      composed.elements[12] -= tileMinX; composed.elements[14] -= tileMinZ;
      result.setMatrixAt(outputIndex, composed);
      bounds.union(localBounds.clone().applyMatrix4(composed));
      if (mesh.instanceColor) for (let c = 0; c < mesh.instanceColor.itemSize; c++) {
        result.instanceColor.array[outputIndex * mesh.instanceColor.itemSize + c] = rawComponent(mesh.instanceColor, sourceIndex, c);
      }
    });
    // Per-instance geometry can protrude across its ownership boundary. Keep
    // culling bounds conservative, including small twig shader deformation.
    bounds.expandByScalar(WIND_PADDING);
    result.boundingBox = bounds; result.boundingSphere = bounds.getBoundingSphere(new T.Sphere());
    result.instanceMatrix.needsUpdate = true;
    if (result.instanceColor) result.instanceColor.needsUpdate = true;
    stats.attributeBytes += result.instanceMatrix.array.byteLength + (result.instanceColor?.array.byteLength || 0);
    stats.selectedInstances += selected.length; stats.outputInstancedMeshes++;
    placeOutput(result, groupOrder);
  }
  function clipMesh(mesh, world, groupOrder) {
    const geometry = mesh.geometry;
    if (!geometry?.getAttribute('position')) return;
    if (mesh.isSkinnedMesh || Object.keys(geometry.morphAttributes || {}).length) throw new Error('Farm tile clipping accepts static geometry only');
    const box = geometryBounds(geometry).applyMatrix4(world);
    if (box.max.x < tileMinX - EPSILON || box.min.x >= maxX + EPSILON || box.max.z < tileMinZ - EPSILON || box.min.z >= maxZ + EPSILON) return;
    const schema = Object.entries(geometry.attributes).sort(([a], [b]) => a.localeCompare(b));
    if (schema.some(([, attr]) => attr.isInstancedBufferAttribute)) throw new Error('Unexpected instanced vertex attribute on a regular farm mesh');
    const position = geometry.getAttribute('position'), index = geometry.index;
    const drawStart = Math.max(0, geometry.drawRange.start), drawEnd = Math.min(index?.count ?? position.count, drawStart + geometry.drawRange.count);
    const ranges = Array.isArray(mesh.material) ? geometry.groups.map(g => ({start: Math.max(drawStart, g.start), end: Math.min(drawEnd, g.start + g.count), material: mesh.material[g.materialIndex]}))
      : [{start: drawStart, end: drawEnd, material: mesh.material}];
    normalMatrix.getNormalMatrix(world);
    const reflected = world.determinant() < 0, cache = index ? new Map() : null;
    function vertexAt(index) {
      if (cache?.has(index)) return cache.get(index);
      const vertex = {};
      for (const [name, attribute] of schema) {
        const value = [];
        for (let c = 0; c < attribute.itemSize; c++) value.push(attribute.getComponent(index, c));
        if (name === 'position') {
          point.fromArray(value).applyMatrix4(world); value[0] = point.x; value[1] = point.y; value[2] = point.z;
          for (const [axis, bounds] of [[0, [tileMinX, maxX]], [2, [tileMinZ, maxZ]]]) for (const bound of bounds) if (Math.abs(value[axis] - bound) < EPSILON) value[axis] = bound;
        } else if (name === 'normal') {direction.fromArray(value).applyNormalMatrix(normalMatrix); value[0] = direction.x; value[1] = direction.y; value[2] = direction.z;}
        else if (name === 'tangent') {direction.fromArray(value).transformDirection(world); value[0] = direction.x; value[1] = direction.y; value[2] = direction.z; if (reflected) value[3] *= -1;}
        vertex[name] = value;
      }
      cache?.set(index, vertex); return vertex;
    }
    for (const range of ranges) {
      if (!range.material?.visible) continue;
      let batch;
      for (let offset = range.start; offset + 2 < range.end; offset += 3) {
        stats.testedTriangles++;
        let a = vertexAt(index ? index.getX(offset) : offset), b = vertexAt(index ? index.getX(offset + 1) : offset + 1), c = vertexAt(index ? index.getX(offset + 2) : offset + 2);
        if (reflected) [b, c] = [c, b];
        const original = [a, b, c], xs = original.map(v => v.position[0]), zs = original.map(v => v.position[2]);
        const minX = Math.min(...xs), highX = Math.max(...xs), minZ = Math.min(...zs), highZ = Math.max(...zs);
        // Half-open ownership for entire wall triangles coplanar with a tile
        // maximum; crossing triangles may retain boundary vertices.
        if (highX < tileMinX || minX >= maxX || highZ < tileMinZ || minZ >= maxZ) continue;
        let polygon = original;
        const crossesBoundary = minX < tileMinX || highX > maxX || minZ < tileMinZ || highZ > maxZ;
        if (crossesBoundary) for (const plane of [[0, tileMinX, 1], [0, maxX, -1], [2, tileMinZ, 1], [2, maxZ, -1]]) polygon = clipPlane(polygon, ...plane);
        if (polygon.length < 3) continue;
        batch ??= batchFor(mesh, range.material, schema, groupOrder);
        const before = batch.triangles;
        for (let i = 1; i < polygon.length - 1; i++) addTriangle(batch, polygon[0], polygon[i], polygon[i + 1]);
        if (batch.triangles > before) {
          stats.keptSourceTriangles++;
          if (crossesBoundary) stats.clippedSourceTriangles++;
        }
      }
    }
  }
  function visit(node, parentWorld, inheritedOrder) {
    if (!node.visible) return;
    const world = node.matrixWorldAutoUpdate === false ? node.matrixWorld.clone() : parentWorld.clone().multiply(localMatrix(node));
    const groupOrder = node.isGroup ? node.renderOrder : inheritedOrder;
    if (node.isMesh) {
      stats.sourceMeshes++;
      if (node.isInstancedMesh) partitionInstances(node, world, groupOrder);
      else clipMesh(node, world, groupOrder);
    }
    for (const child of node.children) visit(child, world, groupOrder);
  }
  visit(root, ancestorMatrix(root.parent), 0);
  for (const batch of batches.values()) {
    if (!batch.triangles) continue;
    const geometry = new T.BufferGeometry();
    for (const [name, source] of batch.schema) {
      const attribute = new T.Float32BufferAttribute(batch.arrays[name], source.itemSize);
      geometry.setAttribute(name, attribute); stats.attributeBytes += attribute.array.byteLength;
    }
    geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    const mesh = new T.Mesh(geometry, batch.material); copyFlags(batch.mesh, mesh);
    mesh.name = `${batch.material.name || batch.mesh.name || 'farm surface'} / clipped tile`;
    mesh.userData.farmOwnedGeometry = true;
    placeOutput(mesh, batch.groupOrder); stats.outputMeshes++; stats.ownedGeometries++;
  }
  group.userData.farmTileStats = {...stats};
  return {group, stats};
}
