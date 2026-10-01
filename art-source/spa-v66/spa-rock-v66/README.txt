spa-rock-v66 — continuous embedded limestone cliff

Files
  spa-rock-v66.mjs      ES module factory: createSpaRock(T), returns THREE.BufferGeometry
  generate_spa_rock.py  Deterministic generator; uses NumPy, SciPy, VTK, matplotlib
  validation.json      Topology, triangle counts, bounds, downray contacts, clearance
  spa-rock-v66.npz      Source vertex, face, normal and color arrays
  rock-preview.png     Geometry inspection without the final triplanar material

Integration
  import { createSpaRock } from './spa-rock-v66.mjs';
  const geometry = createSpaRock(THREE);
  const cliff = new THREE.Mesh(geometry, limestoneMaterial);
  // Geometry is already in WORLD METRE coordinates. Do not translate or scale it.
  // position, normal, uv and color are present. Enable vertexColors if desired.
  // Normals are field-gradient normals; do not recompute them indiscriminately.
  // UV is x,z fallback. Triplanar shading is preferred for vertical surfaces.

Geology
A single closed mass built from embedded nonperiodic angular limestone beds,
depth-limited joint cuts, weathered arrises, dipping shelves, broad flat statue
contacts and a rooted outlet bracket. No detached/scattered rock primitives.

Contacts
Both original statue origins are supported at y=1.18 exactly:
  seated   (6.88, 1.18, -4.73)
  kneeling (7.88, 1.18, -5.18)
All 25 sampled points over the first ±0.35m square are on-plane.
The second pad has 20/25 ±0.35m sample points on-plane, including all inner
±0.25m points. Only its x=8.23 extreme east row rolls over the bevel to y=1.16054,
adjoining the arch. Original statue position stays unchanged.
The outlet bracket hits exactly y=1.02 at x=7.57,z=-4.46.
The fall line x=7.57,z=-4.21 has no mesh intersection at any height.

49k triangle budget: 48,974 triangles, 24,489 indexed vertices.
One component, closed manifold, zero degenerate faces.
Pool clearance sampled across triangle interiors: 2.44685m for all y<=.82,
above the required 2.43m. Overhangs occur only above .82m.
Bounds: [4.16,-.28,-5.72] to [8.24197,3.185,-3.1182].
Rear and west geometry intentionally embeds behind z=-5.60 and x=4.24 walls.
