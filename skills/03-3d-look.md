# 3. The 3D look

## Style
- **Simple, low-poly, slightly textured** models built from primitives (boxes, cylinders, capsules, cones, extruded shapes).
- **Bright daylight**: blue gradient sky, warm sun with soft shadows, hemisphere fill, ACES tone mapping.
- Saturated but natural palette: white/cream walls, one strong accent per object (red, blue, yellow), green land, blue water, tan sand.
- Textures are **drawn on a canvas in code** (`engine.js`: `noiseTex`, `planksTex`, `sidingTex`, `tilesTex`, `stripeTex`), so there are no image files and nothing to license.
- Distant scenery is cheap: a far shoreline box, rows of cone trees, flattened sphere hills, a few big soft clouds. Add fog for depth.

## The hero object
- One object carries the whole video. Build it once as a `THREE.Group`, never rebuild it differently per shot.
- Give it **3–4 recognisable details** at different scales (e.g. a coloured trim, a window pattern, a beacon, a door) so it reads instantly in wide shots and close-ups.
- Model the parts the story needs to open or slice (an interior, an underside) so cutaways have something to show.
- Parts added by a fix (supports, floats, cables) are children of the hero, so they move with it.

## Scale and units
Work in metres. Typical: hero 3–9 m wide, camera 8–25 m away, water/ground at y = 0, seabed/underground at y ≈ −6 to −8.
Real-world proportions make the physics read correctly.

## Make it deterministic
- Every property is computed from `t` inside one `update(t)` function. No `requestAnimationFrame`, no accumulated state.
- Use seeded random (`rng(seed)`) for scatter and particles.
- Write each motion as a small function: `level(t)`, `tilt(t)`, `drift(t)`. Compose them with `sm(a, b, t)` (smoothstep),
  `eio`/`eout` easing, `bounce` (things dropping into place) and `settle` (damped spring after a jolt).

## Physical believability (cheap tricks)
- Floating objects: height = water level + draft + 0.6 × wave height at their position; add a slow small roll.
- Heavier = lower draft; adding buoyancy raises it, so animate the draft change.
- Wind: a gust envelope drives streaks, tree bend, bigger waves and the drift together.
- Water level change: keep shore and fixed structures still and add a **measuring pole** (`stripeTex`) so the rise reads.
