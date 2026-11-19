# Instructions for an AI using this repo

You are making a **55–60 second vertical (9:16) 3D explainer Short** in the "What if you built…?" style:
a simple 3D object faces a chain of problems, each fix creates the next problem, cutaway views show how
things work, a warm narrator explains, bold captions follow the voice, and only sound effects play (no music).

Read these files in order before you start:
1. `skills/01-story-and-script.md`: the story shape that makes these videos work
2. `skills/02-beat-sheet.md`: turning a brief into a timed plan (the single source of truth)
3. `skills/03-3d-look.md` to `skills/06-motion-effects.md`: building and animating the scene
4. `skills/07-rendering.md`: getting frames out without a GPU
5. `skills/08-captions.md`, `skills/09-voice.md`, `skills/10-sound.md`: the audio and text layer
6. `skills/11-quality-checklist.md`: what to check before you hand anything over
7. `skills/12-when-tools-are-missing.md`: what to do when credits, models or network access are unavailable

## The workflow

| Step | You do | Tool in this repo |
|---|---|---|
| 1 | Turn the creator's brief into `beat_sheet.json`: beats, times, visuals, voice lines, caption chunks, effects | `templates/beat_sheet.example.json`, `templates/brief_template.md` |
| 2 | Build the scene: one hero object, environment, every beat's animation as a function of time `t` | `engine/engine.js`, start from `engine/scene_template.js` |
| 3 | Render 4–8 **stills** at the busiest moments and look at them. Fix framing, scale and clarity | `node engine/render.mjs stills 1.5,9,24` |
| 4 | Render one MP4 per beat | `node engine/render.mjs beats beat_sheet.json out` |
| 5 | (If a reference voice is given) analyze it and find the closest voice blend | `audio/analyze_voice.py`, `audio/match_voice.py` |
| 6 | Generate the narration lines and fix any that overrun their slot | `audio/generate_lines.py` |
| 7 | Mix voice + effects, time captions to the real voice | `audio/mix.py` |
| 8 | Verify caption sync by transcription, add nudges for any leaks | `audio/verify_sync.py`, `nudges.json` |
| 9 | Build captions, assemble the final video | `captions/build_captions.py`, `finish.sh` |
| 10 | Check frames of the final video against the checklist, then deliver | `skills/11-quality-checklist.md` |

## Rules that matter most
- **Show the problem before the narrator names it.** The viewer should notice it, then hear it.
- **Every fix creates the next problem.** That chain is what keeps people watching.
- **Keep the hero object identical in every shot** (same colours, proportions, details).
- **Look at your frames.** Render stills before the full render and check the finished video. Never deliver unseen.
- **Captions follow the real voice, not the script.** Re-time them whenever the audio changes.
- **No music** unless the creator asks for it. Voice and effects only.
- **Voices:** matching a style with stock voices is fine. Cloning a real person's voice needs their permission,
  so ask whose voice it is before you clone.
- Be honest about limits. If something is approximate (a voice match, a timing estimate), say so.

## What to ask the creator (only if missing)
- The title question and the problems/fixes they want (or permission to invent the chain).
- Whether there is a reference voice and whose it is.
- Where the file should go (folder, platform).
Everything else has a default in this repo; decide and state it.
