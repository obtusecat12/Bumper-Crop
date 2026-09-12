import {farmRoadWeight} from './farm-layout.js?v=12';
// Pure, chunk-independent power-line layout. Dependencies come from world.js.
// A span exists only between consecutive physical poles. A missing wet-land
// pole terminates the line at its last real support; it never creates a long
// unsupported bridge to the next dry tile.
export const POWER_POLE_HEIGHT = 9.8;
export const POWER_POLE_Z = 34;
export const POWER_INSULATOR_OFFSET = POWER_POLE_HEIGHT - .41 + .26 / 2;
export const POWER_WIRE_SIDES = [-1, 0, 1];
const evenBelow = z => z - ((z % 2n + 2n) % 2n);

export function createPowerLinePlanner({CHUNK = 64, field, laneOffset, surfaceHeight, pondShoreDistance}) {
  if (CHUNK !== 64) throw Error('The existing pole layout requires 64 m tiles');
  const cache = new Map();

  function poleForField(f) {
    if (f.z % 2n !== 0n || !f.roads?.[0]?.enabled) return null;
    const x = 2.4 + laneOffset(f.roads[0], POWER_POLE_Z), z = POWER_POLE_Z;
    if(farmRoadWeight(x,z,f)<.5)return null;
    if (f.type === 'pond' && pondShoreDistance(x, z, f) < .8) return null;
    const y = surfaceHeight(x, z, f);
    return {cx: f.x, cz: f.z, x, y, z, wireY: y + POWER_INSULATOR_OFFSET};
  }

  function remember(key, pole) {
    cache.set(key, pole);
    if (cache.size > 512) cache.delete(cache.keys().next().value);
    return pole;
  }

  function poleAt(cx, cz, seed, current) {
    const key = `${typeof seed}:${seed}:${cx}:${cz}`;
    if (cx === current.x && cz === current.z) return remember(key, poleForField(current));
    if (cache.has(key)) return cache.get(key);
    // The optional fourth argument avoids vegetation generation when world.js
    // supports it. Existing field() implementations safely ignore the argument.
    return remember(key, poleForField(field(cx, cz, seed, false)));
  }

  function planTile(f) {
    // f.seed is a derived CHUNK seed and cannot recreate neighboring fields.
    if (f.worldSeed === undefined) throw Error('Power lines require field.worldSeed');
    const seed = f.worldSeed, pole = poleAt(f.x, f.z, seed, f);
    const spans = [], positions = [];
    const lower = evenBelow(f.z);
    // An odd tile crosses one whole middle section. An even tile crosses the
    // end of the previous span and beginning of the next, meeting at its pole.
    const starts = f.z === lower ? [lower - 2n, lower] : [lower];
    for (const startZ of starts) {
      const a = poleAt(f.x, startZ, seed, f), b = poleAt(f.x, startZ + 2n, seed, f);
      if (!a || !b) continue;
      // Subtract BigInts BEFORE converting: coordinates can exceed 2^53.
      const z0 = Number(a.cz - f.z) * CHUNK + a.z;
      const length = Number(b.cz - a.cz) * CHUNK + b.z - a.z;
      const t0 = Math.max(0, -z0 / length), t1 = Math.min(1, (CHUNK - z0) / length);
      if (t1 <= t0) continue;
      const id = `${typeof seed}:${seed}:power:${f.x}:${startZ}`;
      const ts = [t0];
      // All tiles share the same full-span tessellation, including exact clip
      // points at their tile boundaries. Rebuilds at any LOD are identical.
      for (let k = 1; k < 20; k++) if (k / 20 > t0 && k / 20 < t1) ts.push(k / 20);
      ts.push(t1);
      const wires = POWER_WIRE_SIDES.map(side => {
        const points = ts.map(t => ({
          x: a.x + (b.x - a.x) * t + side * 1.1,
          y: a.wireY + (b.wireY - a.wireY) * t - 4 * 1.5 * t * (1 - t),
          z: z0 + length * t,
        }));
        // LineSegments allows one fog-aware draw call for all three wires.
        for (let i = 1; i < points.length; i++) {
          const p = points[i - 1], q = points[i];
          positions.push(p.x, p.y, p.z, q.x, q.y, q.z);
        }
        return {side, points};
      });
      spans.push({id, a, b, t0, t1, wires});
    }
    return {pole, spans, positions: new Float32Array(positions)};
  }

  return {poleForField, planTile, clearCache: () => cache.clear()};
}
