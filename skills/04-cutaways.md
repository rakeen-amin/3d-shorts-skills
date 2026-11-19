# 4. Cutaway views

Cutaways are the signature of the style: slice the world open to show what's hidden.

## How it works (`engine.js` → `createCutaway`)
- A clipping plane keeps everything with `z < cut`. Anything that should be sliced gets `clippingPlanes: [cutaway.plane]`
  (water surface, buried pipes, the near half of a wall, tanks).
- A translucent gradient **cap** is drawn on the cut face (light at the top, dark at the bottom) with a bright edge line.
  For water it reads as "looking through the side of an aquarium". For soil use brown/orange colours.
- Sliced solids need `side: THREE.DoubleSide`, so the cut shows an inside wall instead of a see-through hole.
- Add a dark **back wall** behind the underwater/underground area so you don't see sky through it. Keep its top just below the surface.

## Using it well
- **Sweep the cut in** (`sweepCut`, ~1 s) at the start of a beat, so the slice itself is a reveal.
- Put the cut plane **in front of** the parts you want to show, not through them, unless you want to show their insides (hollow tanks, pipes).
- Interior cutaways: a second plane removes the front wall of a building/vehicle. Turn it on only for those shots.
- Frame cutaways so the surface line sits in the **upper third**: above-surface context on top, hidden systems in the middle, ground at the bottom.
- Hide props that would block the hidden detail during that shot (a pole, a railing). Toggle `visible` by time.
- End the video with one last quick cutaway glimpse of all the hidden systems together.
