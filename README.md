# Build-It Explainer Shorts: Skills Repo

Everything an AI (or a person) needs to make **55–60 s vertical 3D "What if you built…?" explainer Shorts**
for YouTube Shorts, Reels and TikTok: the storytelling rules, the visual and audio style, and a working,
free toolchain (three.js scene engine, GPU-free renderer, captions, voice matching, procedural sound effects).

**AI agents: start with [AGENT_INSTRUCTIONS.md](AGENT_INSTRUCTIONS.md).**

## What's inside
```
AGENT_INSTRUCTIONS.md     the end-to-end workflow and the rules that matter most
skills/                   12 short guides: story, beat sheet, 3D look, cutaways, camera, effects,
                          rendering, captions, voice, sound, quality checklist, missing-tool fallbacks
templates/                brief template + example beat sheet (the JSON that drives everything)
engine/engine.js          reusable scene library: textures, cutaways, water, camera shots, particles,
                          ring flashes, glowing pulses, wind streaks, tubes/ropes
engine/scene_template.js  minimal working scene using the library (placeholder object; replace with yours)
engine/render.mjs         headless Chrome + SwiftShader → ffmpeg (stills, ranges, or one MP4 per beat)
audio/                    analyze a reference voice, match it with stock voices, generate lines,
                          procedural SFX, mix + caption timing, transcription-based sync check
captions/                 .ass caption builder (bold white, outline, yellow keyword, safe-zone placement)
finish.sh                 join beats + captions + audio → final.mp4 at −14 LUFS
```

## Setup
```bash
npm install && npx playwright install chromium     # or set CHROME_PATH to an installed Chrome
pip install -r requirements.txt
./download_models.sh                               # Kokoro TTS, Whisper-tiny, WeSpeaker → models/
```
Also needs `ffmpeg` (with libass) and the **Poppins** font.

## Run the example end to end (12 s)
```bash
cp templates/beat_sheet.example.json beat_sheet.json
node engine/render.mjs stills 1.5,4.6,9          # look first
node engine/render.mjs beats beat_sheet.json out
python3 audio/generate_lines.py beat_sheet.json lines
python3 audio/mix.py beat_sheet.json lines
python3 audio/verify_sync.py
python3 captions/build_captions.py beat_sheet.json cues.json > captions.ass
./finish.sh
```
Reference-voice matching: `python3 audio/analyze_voice.py ref.wav` then `python3 audio/match_voice.py ref.wav`.

## Making a new video
1. Write `beat_sheet.json` from the brief (`skills/02-beat-sheet.md`).
2. Copy `engine/scene_template.js` and build your hero object, environment, beats and camera shots.
3. Follow the same commands. Check `skills/11-quality-checklist.md` before delivering.

Only clone a voice you own or have permission to use. Matching a style with stock voices is the default.
