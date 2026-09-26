# v53 ground ownership audit

Read-only code audit of v52 `exit-scene.js`, `reference-scenes.js`, `urban-streets.js`, `exit-route.js`, with supporting layout, terrain and walking code. Inspected the user's Hope screenshot directly; its broad alternating asphalt patches are consistent with the exact duplicate surfaces below. No browser rendering was performed by this audit.

All heights below are relative to `Y = EXIT_CITY_Y = 0.28`; city coordinates are after the Hope mirror.

## Ground overlap findings

| Owners | Exact overlap / risk | Small correction |
|---|---|---|
| Hope main slab vs reserved-block bases | Main `photoAsphalt`: x [-112,112], z [-32,448], top 0. Every reserved block emits its asphalt box **before** returning, also top 0. Exact duplicate throughout all eight reserved blocks at iz 0..3 and the northern 32 m of iz -1. | Exclude authored ground footprints from generated base rectangles. Keep other reserved ground; deleting every reserved slab leaves empty coverage. |
| Hope main vs Hope cross street | Cross street x [-165,165], z [-12.5,10.5], top .004 overlaps main slab. Four millimetres apart is a depth precision hazard, not intentional street grading. | Partition main slab at z -12.5 and 10.5; cross street is sole owner in its rectangle. Prefer consistent street elevation at shared edge. |
| Hope cross street vs ordinary generated blocks | Cross street reaches beyond reserved x ±112 to ±165, through nonreserved iz -1/0 road/base geometry. Generated base is top 0; crowned road faces intersect the cross-street top .004 near 6.833 m from each road axis. | Apply authored-ground exclusion to bases and road faces of adjacent **nonreserved** blocks too. Clip paint/furniture if left detached. |
| Hope main/returns vs approach | Asphalt ribbon top .028 continues s 362 / city z -19.97164, 12 m into Hope. Sidewalk ribbons top .17 continue s 364 / z -17.97448, overlapping foreground return slabs top .18 on city+x and .15 city-x. | Clip all approach ground triangles at city z -32 and make a short taper into the Hope cross section. Include gutters, curbs and paint in the same ownership cut. |
| Clinic apron vs approach asphalt | Clinic apron final X ±21.76, Z -24..-18 slopes .025→.02. Its street lip is roughly 4 m from route center; ribbon top .028 overlaps it by up to about .10 m, with only 3 mm separation. | Let clinic own its apron. Subtract its transformed convex ground rectangle from ribbon triangles; preserve apron walking height. |
| Clinic court vs reserved base | Cobble top .02 is only 2 cm above reserved base top 0. Side service strips top -.01 are buried by reserved base, concealing their layout. | Exclude clinic court/apron and service-strip polygons from generated base. Court/apron final X [-21.76,21.76], Z [-24,52]; strips X [21.76,25.6] and [-25.6,-21.76], Z [-18,62]. |
| Ordinary road half strips vs corner patches | Four strips currently span the full block. Each corner patch exactly duplicates the visible triangle of each adjacent half-road, giving double surfaces throughout each 7.5×7.5 m corner square. | Trim straight half-road longitudinal range to R..B-R, retain corner patches. Current corner elevations match `roadHeight`. |
| Ordinary service court vs aisle | Both boxes top .016; duplicate rectangle x [53,59], z [36,76] inside block. | Split aisle into z [12,36] and [76,100]. Keep full existing walk registration at .016. |
| Generic curb cap vs pavement top | `curb` top q [.04,.24] overlaps pavement beginning at q 0, exactly at .15/.18. Applies to generated frontage and reference returns. | Pavement should begin at the curb's back edge, or curb top should be trimmed off above the slab. Preserve walk coverage to the street lip. |

The fallback `cityGround` is top -.065 and is not coplanar with any of the above. It is only visible in Level 11. Keep it as hidden structural coverage.

Authored Hope sidewalk slabs end/start at z 10/340; new returns end at z 10, so those boundaries do not duplicate a finite area. The original raised steps, drains, clinic ramps and platforms should retain their geometry and registered heights. Thin paint/joint overlays with explicit vertical separation are different from ground ownership and need no blanket deletion.

## Exact approach join and walking support

The centerline meets city z=-32 at **s=349.954291354659**, where `roadHalf=7.149090857782` and center x=-.0573139243. The route normal is still slightly rotated, so stopping at this s does not make an exact city-Z seam:

| Side | Road edge (city x,z) | Outer sidewalk edge (city x,z) |
|---|---|---|
| -1 | (-7.205697531,-31.899442029) | (-11.905232565,-31.833332580) |
| +1 | (7.091069682,-32.100557971) | (11.790604717,-32.166667420) |

Clip against the line city z=-32, or explicitly end a tapered join on it. Hope's target edges there are road x ±11, sidewalk outer x ±17. Approach walk top .17 should grade to city+x .18 and city-x .15. Road top .028 should grade into its owner's Hope height instead of forming a coincident lower layer.

`floorAt` currently approximates the approach using `s=city.z+382` and `abs(city.x)` until city z=-12. This misaligns the curved path by up to 14 m near s218 and leaves a phantom +.17 walking strip on Hope asphalt x≈8..11 after the ribbons stop. Use `exitSample(wx,wz).s/signed` plus true intervals and clipped end boundary, or register the actual ribbon walk polygons. Avoid changing protected landmark walk records.

## Rural terrain

`ground.js` renders the actual `surfaceHeight` mesh and merely recolors it with `exitField`; there is **no discard**. `exitBaseHeight` reaches Y for progress≥.65 (s≥234) with full influence. Thus the level-10 terrain becomes exactly coplanar with Hope's top-Y slab before city activation. City activation is only at s360, so approximately the last 10 m before activation can show terrain/Hope overlap. The terrain also continues under the clinic ground and approach, though their upper surfaces differ by 2–3 cm.

A deterministic terrain mask under always-present authored Hope/clinic polygons removes these hidden owners without altering visible terrain height. Do not discard terrain under streamed generated blocks unless coverage is guaranteed. Shader world coordinates must use `p+uExitOffset`; existing `exitField` is an approximate x/z projection, unsuitable for exact polygon clipping. `f.exit` is enabled for chunk x5..10,z2..12; include any additional intersecting chunks if applying the entire lateral Hope footprint. At Level 11, `enterCity()` hides and removes rural chunks, so terrain cannot explain persistent jitter in the user's city screenshot.

## Clinic coordinate contract and attachment fit

`clinicToWorld` accepts **final**, already mirrored/compressed clinic coordinates. For raw authored `(u,v)`:

- final `(X,Z)=(-.64*u,v)`; world y=`Y+rawY`.
- origin world `(551.5354939890623,452.0336804894834)`; angle `1.604210399469424`.
- world x=`551.5354939890623 - .0334078552181962*X + .999441801812252*Z`.
- world z=`452.0336804894834 - .999441801812252*X - .0334078552181962*Z`.
- city x=`23.4154309164493 - .109864295338406*X + .993946596457675*Z`.
- city z=`-102.766059828937 - .993946596457675*X - .109864295338406*Z`.

Raw bare-wall center `(-21.3,5.95)` → final `(13.632,5.95)` → world `(557.026756827511,438.210513108631)` → city `(27.8317430913192,-116.969232389111)`.

The bare wall occupies final X [7.872,19.392], Z [5.6,6.3], top Y+8.62; coping top Y+8.74. Its street face is -Z; behind it is +Z, pointing world (+.9994418,-.0334079), city (+.9939466,-.1098643).

Protected neighbors: return wing X [4.992,15.104], Z [16.3,30.3]; perpendicular mosaic wall X [19.168,19.616], Z [5.6,23.2]; cream neighbor X [19.2,25.6], Z [5.5,31.5]. A behind-wall infill envelope X≈[7.9,19.14], Z=[6.31,16.1] avoids these masses (about 11.24×9.79 m). For direct final-frame infill use `b.push(CLINIC_ORIGIN.x,Y,CLINIC_ORIGIN.z,CLINIC_ANGLE)` and physical widths; **do not mirror or scale that infill again**. `addStreetwallBuilding` has its street face at its own +Z, so nest it with rotation `Math.PI` to face clinic-local -Z.
