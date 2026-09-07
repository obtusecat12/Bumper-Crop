// Additive rural settlement layer. The original V8 landmark stream is unchanged.
// All large coordinates stay BigInt; only bounded cell remainders become Number.
// Cache contents affect speed only, never placement or traversal-order results.
const REGION_SALT = 'rural-settlements:v9';
const MAX_EXTRA_CHANCE = .052;
const MIN_SEPARATION = 128; // metres, using the existing field's exact centre
const NOISE_CACHE_LIMIT = 512;
const CELL_CACHE_LIMIT = 4096;
const NEIGHBOURS = [];
for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
  // A 2,2 offset is always at least sqrt(100² + 100²) metres apart.
  if ((dx || dz) && !(Math.abs(dx) === 2 && Math.abs(dz) === 2)) {
    NEIGHBOURS.push({ dx, dz, bx: BigInt(dx), bz: BigInt(dz) });
  }
}
const floorBig = (value, divisor) => value >= 0n ? value / divisor : (value - divisor + 1n) / divisor;
const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
const smooth = (a, b, value) => {
  const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;

export function createSettlementPlanner({ chunkSeed, random, stringSeed }) {
  const noiseCache = new Map();
  const cellCache = new Map();
  const baselineCache = new Map();
  const centreCache = new Map();
  let baselinePredicate;

  function remember(cache, key, value, limit = CELL_CACHE_LIMIT) {
    cache.set(key, value);
    if (cache.size > limit) cache.delete(cache.keys().next().value);
    return value;
  }

  // Hash the complete signed decimal coordinate, not a truncated Number/low word.
  function hashBigInt(x, z, seed, stream = 'proposal') {
    return stringSeed(`${seed}:${REGION_SALT}:${stream}:${x}:${z}`);
  }

  function corner(x, z, seed, stream) {
    const key = `${seed}:${stream}:${x}:${z}`;
    const cached = noiseCache.get(key);
    if (cached !== undefined) return cached;
    return remember(noiseCache, key, random(hashBigInt(x, z, seed, stream))(), NOISE_CACHE_LIMIT);
  }

  function noise(x, z, seed, period, stream) {
    const size = BigInt(period), gx = floorBig(x, size), gz = floorBig(z, size);
    const tx = fade(Number(x - gx * size) / period);
    const tz = fade(Number(z - gz * size) / period);
    return mix(
      mix(corner(gx, gz, seed, stream), corner(gx + 1n, gz, seed, stream), tx),
      mix(corner(gx, gz + 1n, seed, stream), corner(gx + 1n, gz + 1n, seed, stream), tx),
      tz
    );
  }

  function influence(x, z, seed) {
    // Incommensurate scales avoid a visible single macro-grid. Quintic blends
    // give continuous slopes at every grid edge; smaller features scallop edges.
    const region = .72 * noise(x, z, seed, 32, 'region')
      + .28 * noise(x, z, seed, 11, 'edge');
    return smooth(.49, .69, region);
  }

  function legacyLandmark(x, z, seed) {
    if (x === 0n && z === 0n) return { type: 'building', rank: 0 };
    if (x === -1n && z === 0n) return { type: 'pond', rank: 0 };
    const r = random(chunkSeed(x, z, seed) ^ 0x88aa72), value = r();
    return { type: value < .075 ? 'pond' : value < .13 ? 'building' : 'wheat', rank: r() };
  }

  function legacyBuilding(x, z, seed) {
    const candidate = legacyLandmark(x, z, seed);
    if (candidate.type !== 'building') return false;
    if (x === 0n && z === 0n) return true;
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      if (!dx && !dz) continue;
      const other = legacyLandmark(x + BigInt(dx), z + BigInt(dz), seed);
      if (other.type === 'building' && other.rank <= candidate.rank) return false;
    }
    return true;
  }

  function existingBuilding(x, z, seed) {
    const key = `${seed}:${x}:${z}`, cached = baselineCache.get(key);
    if (cached !== undefined) return cached;
    return remember(baselineCache, key, (baselinePredicate || legacyBuilding)(x, z, seed));
  }

  function centre(x, z, seed) {
    const key = `${seed}:${x}:${z}`, cached = centreCache.get(key);
    if (cached) return cached;
    if (x === 0n && z === 0n) return remember(centreCache, key, { x: 32, z: 27 });
    // Clone the V8 field RNG locally. Never advance the real field/vegetation RNG.
    const r = random(chunkSeed(x, z, seed) ^ 0x127abab);
    r(); r();
    return remember(centreCache, key, { x: 18 + r() * 28, z: 18 + r() * 28 });
  }

  function proposal(x, z, seed) {
    const key = `${seed}:${x}:${z}`;
    if (cellCache.has(key)) return cellCache.get(key);
    const r = random(hashBigInt(x, z, seed));
    // Most cells stop before coherent-noise work. Pond markers stay untouched;
    // authoritative large-lake and fixed-farm exclusions still run in field().
    const chance = r(), rank = r();
    if (chance >= MAX_EXTRA_CHANCE || legacyLandmark(x, z, seed).type === 'pond') {
      return remember(cellCache, key, null);
    }
    if (chance >= MAX_EXTRA_CHANCE * influence(x, z, seed)) return remember(cellCache, key, null);
    return remember(cellCache, key, { rank, ...centre(x, z, seed) });
  }

  function additionalBuilding(x, z, seed, existingBuildingPredicate) {
    // Optional callback lets the caller retain a single authoritative V8 rule.
    // A changed callback only invalidates a memo; it does not seed anything.
    if (baselinePredicate !== existingBuildingPredicate) {
      baselinePredicate = existingBuildingPredicate;
      baselineCache.clear();
    }
    const current = proposal(x, z, seed);
    if (!current || existingBuilding(x, z, seed)) return false;
    for (const { dx, dz, bx, bz } of NEIGHBOURS) {
      const nx = x + bx, nz = z + bz, otherCentre = centre(nx, nz, seed);
      const distanceSquared = (dx * 64 + otherCentre.x - current.x) ** 2
        + (dz * 64 + otherCentre.z - current.z) ** 2;
      if (distanceSquared >= MIN_SEPARATION * MIN_SEPARATION) continue;
      if (existingBuilding(nx, nz, seed)) return false;
      const other = proposal(nx, nz, seed);
      // Total-order tie break makes close pairs impossible even on hash ties.
      if (other && (other.rank < current.rank
        || (other.rank === current.rank && (nx < x || (nx === x && nz < z))))) return false;
    }
    return true;
  }

  function clearCaches() {
    noiseCache.clear(); cellCache.clear(); baselineCache.clear(); centreCache.clear();
  }

  return {
    additionalBuilding, influence, legacyBuilding, hashBigInt, clearCaches,
    cacheSizes: () => ({ noise: noiseCache.size, proposals: cellCache.size,
      baseline: baselineCache.size, centres: centreCache.size }),
    settings: Object.freeze({ maxExtraChance: MAX_EXTRA_CHANCE,
      minSeparationMetres: MIN_SEPARATION, regionPeriods: [32, 11],
      noiseCacheLimit: NOISE_CACHE_LIMIT, cellCacheLimit: CELL_CACHE_LIMIT })
  };
}
