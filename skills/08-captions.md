# 8. Captions

## Style
- Bold white sans (Poppins Bold), ~94 px on a 1080-wide frame, **black outline 7 px**, small soft shadow.
- **2–5 words** on screen at a time; never wrap to two lines.
- **One yellow word per sentence** (the key noun or verb: the problem or the fix).
- Quick scale pop on each new cue (88% → 100% over 90 ms).
- Position: **lower middle**, centre at x = 540, baseline y ≈ 1390 (≈72% down). Clear of the bottom UI (title, channel, audio) and the right-side buttons.
- **Move up** (y ≈ 1000) for a beat where the key detail sits behind the default spot; check frames to decide.

## Timing
1. Draft timing from the script (`build_captions.py --script`) only for previews.
2. Final timing comes from the real voice: `audio/mix.py` splits each line's audio across its chunks in proportion to
   text length, then snaps each boundary to the quietest 10 ms within ±0.2 s (a gap between words).
3. Verify with `audio/verify_sync.py`: it transcribes the audio under each caption. If a word leaked into the
   neighbouring caption, add a nudge in `nudges.json` (`{"chunk text": -0.2}`) and rebuild.
4. Gaps between lines can be empty; hold the final question to the end of the video.

## Build
```bash
python3 captions/build_captions.py beat_sheet.json cues.json nudges.json > captions.ass
```
Burned in by `finish.sh` with ffmpeg's `ass` filter (needs libass and the font installed).
