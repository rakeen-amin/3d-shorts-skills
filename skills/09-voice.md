# 9. Narrator voice

## Direction
Warm, curious, brisk and conversational, like explaining a clever idea to a friend. Pause after the "it works!" line,
then read the turn ("But now…") like you just noticed the new problem. Voice clearly above the effects.

## Generating it (free, local)
- TTS: **Kokoro** (open model, many voices, runs on CPU) via `kokoro-onnx`. `audio/generate_lines.py` reads every line
  from the beat sheet, trims silence and warns when a line overruns its slot.
- Speed 0.84–0.93 gives ~180–215 wpm, about right for this style. Use per-line `speed` for tight beats.
- Punctuation is your acting tool: commas for breaths, "!" for surprise, a separate short sentence for a beat ("Great. It works.").

## Matching a reference voice (without cloning)
1. `audio/analyze_voice.py ref.wav` gives the transcript, words per minute, pauses, pitch (median and range) and brightness.
2. `audio/match_voice.py ref.wav` scores every stock voice against the reference with a speaker-embedding model
   (WeSpeaker; cosine similarity, 1.0 = same speaker) and then tests 2- and 3-voice blends of the best four.
   Blending averages the voices' style vectors into a new in-between voice. 0.85–0.90 is a close match.
3. Put the winning blend in `beat_sheet.json → voice.blend`.
4. **Don't pitch-shift** to close a pitch gap: it adds artifacts and drops similarity sharply. Accept a small difference.

## Cloning
- A true clone needs a cloning service (ElevenLabs, Higgsfield voices, etc.), which usually costs credits.
- **Only clone a voice you own or have the speaker's permission to use.** Ask whose voice it is first.
- Be honest in the hand-off: say whether it's a clone or a match, and how close it is.

## Polish (done in `audio/mix.py`)
High-pass at 70 Hz, slight warmth around 180 Hz, gentle 3:1 compression, peak −1 dB. Final loudness −14 LUFS in `finish.sh`.
