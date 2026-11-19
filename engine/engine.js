// engine.js — reusable building blocks for deterministic 3D explainer Shorts (three.js).
// Every visual is a pure function of time t, so any frame can be rendered alone and re-renders match.
import * as THREE from 'three';
export { THREE };

// ---------------------------------------------------------------- timing helpers
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
/** smoothstep 0→1 as t goes a→b (the workhorse for every animation) */
export const sm = (a, b, t) => { const x = clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
export const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;   // ease in-out cubic
export const eout = x => 1 - Math.pow(1 - x, 3);                                      // ease out cubic
export const lerp = (a, b, k) => a + (b - a) * k;
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
/** bouncy landing, for parts that drop/swing into place */
export function bounce(x) {
  const n1 = 7.5625, d1 = 2.75;
  if (x < 1 / d1) return n1 * x * x;
  if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
  if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
  return n1 * (x -= 2.625 / d1) * x + 0.984375;
}
/** damped spring settle: value overshoots then settles to 0 after time k (seconds) */
export const settle = (k, amp = 1, damp = 1.6, freq = 2.4) => k < 0 ? amp : amp * Math.exp(-damp * k) * Math.cos(freq * k);
/** seeded random, so particles and scatter are identical every render */
export function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------------------------------------------------------------- renderer / world
export function createWorld({ width = 1080, height = 1920, fov = 50, sky = ['#3f8fdc', '#8cc6f0', '#dff1fb'], fog = [0xcde7f5, 70, 230], sunIntensity = 2.7, shadowSize = 24 } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(width, height);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.localClippingEnabled = true;
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = gradientTex(sky);
  if (fog) scene.fog = new THREE.Fog(...fog);
  const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 500);
  const hemi = new THREE.HemisphereLight(0xd6ecff, 0x7a9a62, 1.25); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff3df, sunIntensity);
  sun.position.set(-14, 26, 20); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -shadowSize, right: shadowSize, top: shadowSize, bottom: -shadowSize, near: 1, far: 90 });
  sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03;
  scene.add(sun); scene.add(sun.target);
  return { renderer, scene, camera, sun, hemi, width, height };
}

// ---------------------------------------------------------------- textures (drawn on canvas, no image files)
export function canvasTex(w, h, draw, rep = [1, 1], srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
export function gradientTex(stops) {
  const t = canvasTex(4, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c)); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}
function speckle(g, w, h, n, cols, r, size = 2) {
  for (let i = 0; i < n; i++) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.globalAlpha = 0.15 + r() * 0.35; const s = size * (0.5 + r()); g.fillRect(r() * w, r() * h, s, s); }
  g.globalAlpha = 1;
}
/** speckled surface: grass, sand, dirt, concrete, painted metal… pick a base and 3–4 nearby colors */
export const noiseTex = (base, cols, rep = [1, 1], seed = 1, dots = 3000, size = 3) =>
  canvasTex(256, 256, (g, w, h) => { const r = rng(seed); g.fillStyle = base; g.fillRect(0, 0, w, h); speckle(g, w, h, dots, cols, r, size); }, rep);
/** wooden planks with gaps, grain and nails */
export const planksTex = (base = '#b98250', rep = [3, 3], seed = 3) => canvasTex(256, 256, (g, w, h) => {
  const r = rng(seed); g.fillStyle = base; g.fillRect(0, 0, w, h); const pw = 32; const c = new THREE.Color(base);
  for (let x = 0; x < w; x += pw) {
    const v = Math.floor(r() * 26) - 13;
    g.fillStyle = `rgb(${c.r * 255 + v},${c.g * 255 + v},${c.b * 255 + v * 0.6})`; g.fillRect(x + 2, 0, pw - 4, h);
    g.strokeStyle = 'rgba(60,35,15,0.25)';
    for (let k = 0; k < 4; k++) { g.beginPath(); const gx = x + 5 + r() * (pw - 10); g.moveTo(gx, 0); for (let y = 0; y <= h; y += 16) g.lineTo(gx + Math.sin(y * 0.05 + k) * 2, y); g.stroke(); }
    g.fillStyle = 'rgba(40,22,10,0.85)'; g.fillRect(x, 0, 2, h);
    const ny = r() * h; g.fillRect(x, ny, pw, 2);
  }
}, rep);
/** horizontal siding / panel lines on a light wall */
export const sidingTex = (base = '#f5f2ea', line = '#d8d2c4', rep = [2, 2]) => canvasTex(256, 256, (g, w, h) => {
  const r = rng(1); g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 21) { g.fillStyle = line; g.fillRect(0, y, w, 3); g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(0, y + 3, w, 2); }
  speckle(g, w, h, 900, [line, '#ffffff'], r, 2);
}, rep);
/** staggered tiles / shingles / bricks */
export const tilesTex = (rgb = [190, 52, 42], rep = [3, 2], rowH = 32, tileW = 48) => canvasTex(256, 256, (g, w, h) => {
  const r = rng(2); g.fillStyle = `rgb(${rgb})`; g.fillRect(0, 0, w, h);
  for (let row = 0; row < h / rowH; row++) {
    const off = (row % 2) * tileW / 2;
    for (let x = -tileW; x < w; x += tileW) { const v = Math.floor(r() * 30) - 15; g.fillStyle = `rgb(${rgb[0] + v},${rgb[1] + v / 2},${rgb[2] + v / 2})`; g.fillRect(x + off + 2, row * rowH + 2, tileW - 4, rowH - 4); }
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, row * rowH + rowH - 4, w, 4);
  }
}, rep);
/** red/white measuring stripes — great for showing a level change */
export const stripeTex = (a = '#d93a2b', b = '#ffffff', n = 16) => canvasTex(64, 256, (g, w, h) => { for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(0, i * h / n, w, h / n); } });
export const ringTex = () => canvasTex(128, 128, g => { g.strokeStyle = '#fff'; g.lineWidth = 10; g.beginPath(); g.arc(64, 64, 50, 0, 7); g.stroke(); g.globalAlpha = 0.4; g.lineWidth = 22; g.beginPath(); g.arc(64, 64, 46, 0, 7); g.stroke(); });
export const glowTex = () => canvasTex(128, 128, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });

// ---------------------------------------------------------------- meshes
export const mat = (o = {}) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.85, metalness: 0 }, o));
export const box = (x, y, z) => new THREE.BoxGeometry(x, y, z);
export function add(parent, geo, material, x = 0, y = 0, z = 0, { cast = true, recv = true } = {}) {
  const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = recv; parent.add(m); return m;
}
/** box with a different material on top (planks on top, end-grain on the sides, grass on dirt…) */
export function topBox(parent, w, h, d, topMat, sideMat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(box(w, h, d), [sideMat, sideMat, topMat, sideMat, sideMat, sideMat]);
  m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m;
}
/** a tube along points; call again each frame to animate (hoses, cables, ropes) */
export function tubeAlong(mesh, points, radius = 0.08, segs = 100) {
  const c = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  mesh.geometry.dispose(); mesh.geometry = new THREE.TubeGeometry(c, segs, radius, 8, false); return c;
}
/** a rope/line between two points with sag (0 = taut) */
export function ropeBetween(mesh, a, b, sag = 0.3, radius = 0.1) {
  const mid = a.clone().lerp(b, 0.5); mid.y -= sag;
  mesh.geometry.dispose(); mesh.geometry = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), 40, radius, 8, false);
}

// ---------------------------------------------------------------- cutaway views
/**
 * A cutaway hides everything in front of a vertical plane z = cut and shows a translucent "cap"
 * on the cut face (water, soil, a wall). Give any material `clippingPlanes: [cutaway.plane]` to be sliced.
 * Sliced solids should use side: DoubleSide so the cut shows an inside instead of a hole.
 */
export function createCutaway(scene, { width = 150, colors = ['#5fc2ee', '#2f95cf', '#0f4f86'], opacity = 0.5, edgeColor = 0xe8f8ff } = {}) {
  const plane = new THREE.Plane(V(0, 0, -1), 1000);            // keeps z < constant
  const capMat = new THREE.MeshBasicMaterial({ map: gradientTex(colors), transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const cap = new THREE.Mesh(new THREE.PlaneGeometry(width, 1), capMat); scene.add(cap);
  const edge = new THREE.Mesh(new THREE.PlaneGeometry(width, 0.07), new THREE.MeshBasicMaterial({ color: edgeColor, transparent: true, opacity: 0.9 })); scene.add(edge);
  return {
    plane, cap, edge,
    /** cut: z of the slice (>=100 disables). top/bottom: vertical extent of the cap face (e.g. surface → ground/seabed) */
    update(cut, top, bottom) {
      plane.constant = cut; const on = cut < 100;
      cap.visible = edge.visible = on;
      cap.scale.y = Math.max(top - bottom, 0.01); cap.position.set(0, (top + bottom) / 2, cut - 0.01);
      edge.position.set(0, top, cut - 0.005);
    },
  };
}
/** animate a slice sweeping in: returns the cut z for time t */
export const sweepCut = (t, t0, t1, target, from = 40) => lerp(from, target, eio(sm(t0, t1, t)));

// ---------------------------------------------------------------- water / ground
export function createWater(scene, { size = 150, segs = 150, color = 0x2c9bd0, opacity = 0.93, clip = null } = {}) {
  const geo = new THREE.PlaneGeometry(size, size, segs, segs).rotateX(-Math.PI / 2);
  const material = mat({ color, roughness: 0.18, metalness: 0.05, transparent: true, opacity, flatShading: true, clippingPlanes: clip ? [clip] : [] });
  const mesh = new THREE.Mesh(geo, material); mesh.receiveShadow = true; scene.add(mesh);
  const base = geo.attributes.position.array.slice();
  return {
    mesh,
    /** waveFn(x, z, t) → height offset; level = mean water height */
    update(t, level, waveFn) {
      const p = geo.attributes.position.array;
      for (let i = 0; i < p.length; i += 3) p[i + 1] = level + waveFn(base[i], base[i + 2], t);
      geo.attributes.position.needsUpdate = true;
    },
  };
}
export const gentleWaves = (strength = 1) => (x, z, t) => strength * (0.07 * Math.sin(0.55 * x + 1.3 * t + 0.4 * z) + 0.05 * Math.sin(0.8 * z - 1.05 * t + 0.3 * x) + 0.03 * Math.sin(1.7 * x + 2.1 * z + 2.3 * t));

/** quick low-poly tree */
export function tree(scene, x, y, z, s = 1) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s);
  add(g, new THREE.CylinderGeometry(0.15, 0.22, 1.4, 6), mat({ color: 0x7a5232 }), 0, 0.7, 0);
  add(g, new THREE.ConeGeometry(1.1, 1.9, 7), mat({ color: 0x3f8f3a, flatShading: true }), 0, 2.0, 0);
  add(g, new THREE.ConeGeometry(0.85, 1.5, 7), mat({ color: 0x57a845, flatShading: true }), 0, 2.9, 0);
  scene.add(g); return g;
}

// ---------------------------------------------------------------- camera shots
/**
 * shots: [[tStart, tEnd, [[t, [px,py,pz], [tx,ty,tz]], ...]], ...]
 * Inside a shot, keys are eased (smooth move). Between shots the camera jumps (hard cut).
 */
export function shotCamera(camera, shots) {
  return t => {
    const s = shots.find(s => t >= s[0] && t < s[1]) || shots[shots.length - 1];
    const ks = s[2]; let p, q;
    if (t <= ks[0][0]) { p = V(...ks[0][1]); q = V(...ks[0][2]); }
    else {
      const i = ks.findIndex((k, j) => j < ks.length - 1 && t <= ks[j + 1][0]);
      if (i < 0) { const l = ks[ks.length - 1]; p = V(...l[1]); q = V(...l[2]); }
      else { const k = eio((t - ks[i][0]) / (ks[i + 1][0] - ks[i][0])); p = V(...ks[i][1]).lerp(V(...ks[i + 1][1]), k); q = V(...ks[i][2]).lerp(V(...ks[i + 1][2]), k); }
    }
    camera.position.copy(p); camera.lookAt(q); return { p, q };
  };
}

// ---------------------------------------------------------------- effects
/**
 * Deterministic particles (splashes, sprays, dust, sparks).
 * emitters: [{ t0, t1, count, life, gravity, size, spawn(r) → { p: Vector3, v: Vector3 } }]
 * Particle j is born at t0 + (t1-t0)*j/count; its position is pure physics from birth, so it's frame-exact.
 */
export function createParticles(scene, max = 400, material = null) {
  material = material || new THREE.MeshStandardMaterial({ color: 0xe6f7ff, roughness: 0.2, emissive: 0x9fd9f5, emissiveIntensity: 0.35, transparent: true, opacity: 0.92 });
  const inst = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), material, max); inst.frustumCulled = false; scene.add(inst);
  const d = new THREE.Object3D();
  return {
    mesh: inst,
    update(t, emitters) {
      let n = 0;
      for (const e of emitters) for (let j = 0; j < e.count && n < max; j++) {
        const birth = e.t0 + (e.t1 - e.t0) * j / e.count, age = t - birth;
        if (age < 0 || age > e.life) continue;
        const r = rng(j * 7919 + Math.floor(e.t0 * 100)); const { p, v } = e.spawn(r);
        d.position.copy(p).addScaledVector(v, age); d.position.y -= 0.5 * (e.gravity ?? 9.8) * age * age;
        d.scale.setScalar((e.size ?? 0.1) * (1 - 0.6 * age / e.life) * (0.6 + r())); d.updateMatrix(); inst.setMatrixAt(n++, d.matrix);
      }
      for (let j = n; j < max; j++) { d.position.set(0, -999, 0); d.scale.setScalar(1e-4); d.updateMatrix(); inst.setMatrixAt(j, d.matrix); }
      inst.instanceMatrix.needsUpdate = true;
    },
  };
}
/** expanding ring flash when a part locks into place. defs: [{ t, pos: () => Vector3, size, color }] */
export function createFlashes(scene, n = 10) {
  const tex = ringTex();
  const sprites = Array.from({ length: n }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false })); s.visible = false; scene.add(s); return s; });
  return {
    update(t, defs, dur = 0.45) {
      sprites.forEach(s => s.visible = false);
      defs.forEach((f, i) => {
        const a = t - f.t; if (a < 0 || a > dur || i >= n) return; const s = sprites[i];
        s.visible = true; s.position.copy(f.pos()); s.scale.setScalar((f.size ?? 2.4) * (0.3 + a / dur));
        s.material.opacity = 1 - a / dur; s.material.color.set(f.color ?? 0xffffff);
      });
    },
  };
}
/** glowing pulse that travels along a curve, with a trail (power, water, data, heat…) */
export function createPulse(scene, color = 0xffe066) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10), new THREE.MeshBasicMaterial({ color })));
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); sp.scale.setScalar(1.6); g.add(sp);
  scene.add(g);
  const trail = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 })); scene.add(trail);
  return {
    update(curve, u, visible = true) {
      g.visible = trail.visible = visible && !!curve; if (!g.visible) return;
      g.position.copy(curve.getPointAt(clamp(u, 0, 1)));
      trail.visible = u > 0.01;
      if (trail.visible) { const pts = []; for (let s = 0; s <= 40; s++) pts.push(curve.getPointAt(u * s / 40)); trail.geometry.dispose(); trail.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.1, 8, false); }
    },
  };
}
/** wind streaks across the frame; strength 0..1 */
export function createStreaks(scene, n = 22) {
  const ms = Array.from({ length: n }, () => { const m = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.06), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })); scene.add(m); return m; });
  return {
    update(t, strength, { x0 = -12, span = 26, y0 = 1.2, ySpan = 6.5, z0 = -3, zSpan = 9 } = {}) {
      ms.forEach((s, i) => {
        const r = rng(100 + i), per = 1.1 + r() * 0.6, ph = ((t + r() * per) % per) / per;
        s.position.set(x0 + ph * span, y0 + r() * ySpan, z0 + r() * zSpan); s.scale.x = 0.7 + r();
        s.material.opacity = 0.75 * strength * Math.sin(Math.PI * ph); s.visible = strength > 0.01;
      });
    },
  };
}

// ---------------------------------------------------------------- page hook for the renderer
/** expose renderAt/grab for render.mjs. update(t) must set the whole scene for time t. */
export function exposeRenderer(world, update) {
  window.renderAt = t => { update(t); world.renderer.render(world.scene, world.camera); };
  window.grab = (t, q = 0.93) => { window.renderAt(t); return world.renderer.domElement.toDataURL('image/jpeg', q); };
  window.ready = true;
}
