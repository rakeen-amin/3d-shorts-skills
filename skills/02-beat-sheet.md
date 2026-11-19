# 2. The beat sheet (single source of truth)

Everything is driven by one JSON file: see `templates/beat_sheet.example.json`.

```jsonc
{
  "title": "...", "duration": 58, "fps": 30, "width": 1080, "height": 1920,
  "voice":    { "blend": {"am_liam": 0.4, "am_michael": 0.4, "am_adam": 0.2}, "speed": 0.88, "lang": "en-us" },
  "captions": { "font": "Poppins", "size": 94, "outline": 7, "default_y": 1390, "raised_y": 1000 },
  "beats": [
    { "name": "Hook", "start": 0, "end": 7,
      "visual": "what the viewer sees, in one or two sentences",
      "caption_y": "raised",            // optional: move captions up for this beat
      "lines": [ { "id": "b1a", "start": 0.2, "text": "Full sentence.",
                   "chunks": ["2–5 words", "with one *key* word"], "speed": 0.93 } ],
      "sfx":   [ { "type": "splash", "at": 0.4, "gain": 0.3 } ] }
  ],
  "ambience": { "type": "water", "gain": 0.05 }, "music": false
}
```

## How to fill it from a brief
1. Copy the creator's beat times exactly if they gave them. Otherwise use the shape in `01-story-and-script.md`.
2. Split each beat's voice-over into sentences → `lines`. Give each a `start` 0.15–0.4 s after the beat starts,
   and later lines after the previous one ends (generate_lines.py tells you if they overlap).
3. Split each line into caption `chunks` of **2–5 words**, breaking at natural phrase boundaries (commas, "and", prepositions).
   Wrap **one** important word per sentence in `*asterisks*` for yellow.
   The chunks joined must equal the line text exactly.
4. Write the `visual` so you can build it: object, action, camera, and the exact second the problem shows.
5. List effects with times tied to visual events (part locks → `click`, impact → `splash`, running water → `pour`).
6. Keep a per-line `speed` override for beats that are tight on time.

## Timing sanity
- A line at speed 0.88 takes about **0.33 s per word**. A 7 s beat holds about 18–20 words.
- Leave ≥0.2 s between lines and a ~0.6 s pause before a "but now…" turn.
- The camera cuts on beat boundaries, so lines shouldn't run across them (the generator warns you).
