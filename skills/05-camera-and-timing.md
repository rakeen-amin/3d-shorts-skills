# 5. Camera and timing

## Shots (`engine.js` → `shotCamera`)
`[[tStart, tEnd, [[t, position, target], ...]], ...]`. Keys inside a shot are eased (smooth move); moving to the next shot is a hard cut.

## Patterns that work in 9:16
- **Push in / push down** during the hook: start 3/4 high, end low near the waterline/ground where the failure is.
- **Cut to cutaway** for each fix: camera level with the surface, 18–24 m back, so the frame shows above and below.
- **Track** the moving thing (drift, a pulse travelling along a pipe): pan the camera with it, target leading slightly.
- **Close interior** shots for small actions (switch, tap, latch): camera inside the opened building, 2–4 m from the detail.
- **Follow path** for access/route beats: move along the route from start to destination.
- **Pull back** for the reveal: from a lit/close detail out to a wide shot, then a final quick cutaway.

## Vertical framing
- Vertical FOV ~50°. At distance d, the frame is about 0.93·d tall and 0.52·d wide. Wide subjects need distance.
- Keep the subject in the **upper-middle**: the bottom ~20% is covered by platform UI and captions sit at ~72%.
- Keep important action away from the right edge (like/comment buttons).
- Use a 3/4 angle for the hero so two faces show; straight-on only for cutaways.

## Timing
- Cut on beat boundaries. 1–3 shots per beat.
- Moves take 1–4 s with ease in/out; nothing linear.
- Things that lock in: ~0.45 s ease-out slide, then a ring flash and a click on arrival. Stagger repeats by 0.5 s.
- Things that drop or swing into place: `bounce` over ~0.7 s.
- A problem becomes visible 0.5–2 s before the line that names it.
