# 6. Motion graphics and effects

All in `engine.js`, all deterministic.

| Effect | Use it for | Function |
|---|---|---|
| Particles | splashes, water pouring over an edge, spray, dust, sparks, tap drops | `createParticles` with emitters `{t0, t1, count, life, size, gravity, spawn(r)}` |
| Ring flash | a part locking in, a latch, a heavy part landing | `createFlashes` |
| Glowing pulse + trail | power, water, air or data travelling along a route | `createPulse` with a `CatmullRomCurve3` |
| Wind streaks | gusts, speed | `createStreaks` with a strength envelope |
| Tubes / ropes | hoses, cables, tethers; re-built each frame so they flex | `tubeAlong`, `ropeBetween` (sag → 0 when tensioned) |
| Animated water | wavy flat-shaded surface, level changes | `createWater` + `gentleWaves` |
| Emissive glow | lights turning on (windows, bulbs) + a warm `PointLight` | material `emissiveIntensity` driven by `sm()` |

## Guidelines
- Effects support the story beat. Every effect should point at the thing the narrator is talking about.
- Particles: 40–300 per emitter, life 0.4–0.9 s, size ~0.1 m. Spawn from the exact edge where water spills.
- A thin translucent sheet on a deck/floor sells "water is getting in"; grow it with the failure and drain it after the fix.
- Light-on moments: windows, bulbs and a point light all on the same `sm(t0, t0 + 0.15, t)` so it feels like a switch.
- Flexible things (hoses) should visibly flex: drive the attached object up and down a little in that beat.
- When a gust hits, everything reacts together: streaks, tree bend, wave height, drift.
