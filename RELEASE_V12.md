# Natural meadow communities

Replaces the photograph-B rotated rectangle with a smooth implicit lobe union and bounded two-scale domain warp. Independent seeded 512 m macro regions occasionally generate additional meadows. BigInt addresses, bounded neighbour queries, four-channel 2 m habitat grids and LRU caches preserve a deterministic infinite world and exact grid-edge continuity. Existing road, lake, building and world seed rules are retained.

The map, ground mesh, wheat exclusion and plant placement sample the same meadow descriptor. Background scene packets preserve descriptor arrays. Procedural shrubs form small peripheral colonies. Shared instanced short grass, tall bunchgrass, airy seed grass, feathered ferns and small fleabane-like flowers use density, moisture and local canopy influence. Rooted wind and nested LOD samples retain plant positions. These are visual habitat rules, not a biological growth simulator.

Validation: 64,152 seam comparisons including very large signed addresses; actual world seed 2,304-tile scan with 1.7465% coverage and 19 contributing patch IDs; deterministic placement and all five herbs present across selected meadows; finite mesh and instance buffers; worker packet transfer and shared resource preservation; existing world worker, map landing and huge-coordinate regression passed. Actual material/geometry rendered with native GLES. Browser and user-device FPS were not measured.

Sources:
- https://thebookofshaders.com/13/ — multiscale noise and coordinate warping.
- https://algorithmicbotany.org/papers/eco.gi2002.html — density-driven plant distributions and clustering.
- https://www.nps.gov/ozar/learn/nature/grasses.htm — native open-field grasses, including bluestems and broomsedge.
- https://www.nps.gov/indu/learn/nature/plant-succession.htm — shrubs, shade and plant succession.
