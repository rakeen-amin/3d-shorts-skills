# 7. Rendering (no GPU needed)

`engine/render.mjs` opens the scene in headless Chrome with software WebGL (SwiftShader), calls
`window.grab(t)` for each frame and pipes JPEG frames straight into ffmpeg (H.264, CRF 18, yuv420p, 30 fps).

```bash
node engine/render.mjs stills 0.5,4.2,11      # look before you render
node engine/render.mjs beats beat_sheet.json out   # one MP4 per beat; skips beats already rendered
ffmpeg -f concat -safe 0 -i out/list.txt -c copy video_nocap.mp4
```

## Practices
- **Stills first.** Render the busiest moments of every beat and actually look at them (contact sheet: `ffmpeg … hstack`).
  Fix framing, scale, things off-screen, objects blocking the subject, ugly intersections.
- **One file per beat.** Re-render only the beat you changed, then re-join with `-c copy`.
- Write to a temp name and rename on success (render.mjs does this), so a stopped render never looks complete.
- Speed: ~0.5 s/frame at 1080×1920 on 2 CPU cores with shadows; a 58 s Short ≈ 15 min. Run it in the background and check progress.
- Keep geometry modest: a few hundred meshes, a 150×150 water grid, a 2048 shadow map. Rebuild tubes only when visible.
- Final assembly (`finish.sh`): burn captions with libass, add the mix, loudness-normalize to −14 LUFS, AAC 192k, `+faststart`.
- Changing only captions or audio? Don't re-render frames: just re-run `finish.sh`.
