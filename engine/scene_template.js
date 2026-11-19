// scene_template.js — a minimal, generic example that uses every technique in engine.js.
// Replace the hero object, the beats and the camera shots with your own topic.
//
// Story of this template (12 s, purely illustrative):
//   0–3 s  PROBLEM: the hero block wobbles on the water (problem visible before narration names it)
//   3–7 s  FIX: a cutaway slices the water; two supports snap in underneath (click + ring flash)
//   7–12 s REVEAL: pull back; final cutaway glimpse
import {
  THREE, createWorld, sm, eout, lerp, V, rng, add, mat, box, topBox, noiseTex, planksTex,
  createCutaway, sweepCut, createWater, gentleWaves, tree, shotCamera, createParticles, createFlashes, exposeRenderer,
} from './engine.js';

const world = createWorld();
const { scene } = world;
const cut = createCutaway(scene);
const BED = -6;

// ---- environment
add(scene, new THREE.PlaneGeometry(160, 160).rotateX(-Math.PI / 2), mat({ map: noiseTex('#d6c08a', ['#c4ad76', '#e6d4a3'], [14, 14], 10) }), 0, BED, 0, { cast: false });
const backWall = add(scene, new THREE.PlaneGeometry(200, 1), mat({ color: 0x14588f }), 0, 0, -26, { cast: false });
const grass = mat({ map: noiseTex('#6fb34a', ['#5a9a3a', '#86c95c'], [12, 12], 8) }), dirt = mat({ map: noiseTex('#8a6a48', ['#6e5136', '#a3825c'], [8, 2], 9) });
topBox(scene, 240, 6, 30, grass, dirt, 0, -1, -75);                 // far shore
const r = rng(4); for (let i = 0; i < 30; i++) tree(scene, -90 + r() * 180, 2, -64 - r() * 12, 1.4 + r());
const water = createWater(scene, { clip: cut.plane });

// ---- hero object (keep it identical in every shot)
const hero = new THREE.Group(); scene.add(hero);
const heroMats = { side: THREE.DoubleSide };
topBox(hero, 4, 0.35, 4, mat({ map: planksTex() }), mat({ map: planksTex('#8c5e35', [2, 1], 5) }), 0, -0.175, 0);
// placeholder hero: a plain crate with a beacon — swap in your own object built from primitives
add(hero, box(2.6, 2.0, 2.6), mat({ map: noiseTex('#4f86b8', ['#3f73a3', '#6a9ccc'], [1, 1], 12, 1500, 2), ...heroMats }), 0, 1.0, 0);
add(hero, box(2.8, 0.15, 2.8), mat({ color: 0x2d3b48, ...heroMats }), 0, 2.07, 0);
add(hero, new THREE.CylinderGeometry(0.18, 0.18, 0.35, 12), mat({ color: 0xffb020, emissive: 0x663300, ...heroMats }), 0, 2.32, 0);
const supports = [-1.2, 1.2].map(x => {
  const f = add(hero, new THREE.CapsuleGeometry(0.55, 3.0, 8, 20).rotateX(Math.PI / 2), mat({ color: 0xf2b531, roughness: 0.5, side: THREE.DoubleSide, clippingPlanes: [cut.plane] }), x, -0.8, 0);
  return f;
});
const SUPPORT_T = [4.2, 4.8];

const particles = createParticles(scene);
const flashes = createFlashes(scene);
const camAt = shotCamera(world.camera, [
  [0, 3, [[0, [-7, 4.5, 11], [0, 1, 0]], [3, [-5.5, 2.5, 9], [0, 0.8, 0]]]],
  [3, 7, [[3, [3.5, -0.5, 15], [0, -1, 0]], [7, [4.0, -0.3, 14], [0, -0.9, 0]]]],
  [7, 12, [[7, [-6, 4, 10], [0, 1, 0]], [10, [-10, 7, 20], [0, 1, 0]], [12, [-1, 0.5, 18], [0, -1, 0]]]],
]);

function update(t) {
  const level = 0, waves = gentleWaves(1);
  water.update(t, level, waves);
  backWall.scale.y = level - 0.25 - BED; backWall.position.y = (level - 0.25 + BED) / 2;
  const c = t >= 3 && t < 7 ? sweepCut(t, 3.1, 4.0, 4.5) : t >= 10.5 ? sweepCut(t, 10.5, 11.5, 4.5) : 1000;
  cut.update(c, level, BED);

  // problem → fix: wobble until the supports lock in, then it rides high and level
  const fixed = sm(5.0, 6.5, t);
  const wobble = 0.22 * Math.sin(2.4 * t) * sm(0.2, 1.0, t) * (1 - fixed);
  hero.position.set(0, level + lerp(0.1, 0.75, fixed) + waves(0, 0, t) * 0.6, 0);
  hero.rotation.set(0, 0, wobble + 0.02 * Math.sin(1.1 * t));
  supports.forEach((f, i) => { const k = eout(Math.min(Math.max((t - SUPPORT_T[i] + 0.45) / 0.45, 0), 1)); f.visible = t > SUPPORT_T[i] - 0.5; f.position.y = -0.8 - 5 * (1 - k); });
  hero.updateMatrixWorld(true);

  particles.update(t, [
    { t0: 0.6, t1: 3.0, count: 80, life: 0.6, size: 0.09, spawn: r => ({ p: V(-2 + r() * 4, level, 2.1), v: V((r() - 0.5), 1.5 + r() * 1.5, -1 - r()) }) },
  ]);
  flashes.update(t, SUPPORT_T.map((ft, i) => ({ t: ft, pos: () => V(supports[i].position.x, -0.8, 2.2).applyMatrix4(hero.matrixWorld) })));
  const { p } = camAt(t);
  world.sun.target.position.set(p.x * 0.5, 0, 0); world.sun.position.set(p.x * 0.5 - 14, 26, 20);
}

exposeRenderer(world, update);
