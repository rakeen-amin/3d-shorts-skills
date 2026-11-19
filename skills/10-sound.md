# 10. Sound design

**No music by default.** Voice plus effects only.

## Palette (`audio/sfx.py`, all synthesized, no sample files)
| Event | Sound | Typical gain |
|---|---|---|
| Object hits water / big impact | `splash` (size 1–2, 0.8–1.2 s) | 0.25–0.35 |
| Water spilling, washing, draining | `pour` (500–3500 Hz) | 0.05–0.08 |
| Tap / thin stream | `pour` (1500–6000 Hz) | 0.08–0.1 |
| Level rising | `pour` (200–1200 Hz, long) | 0.05–0.06 |
| Part locks in, switch, latch | `click` (1900–2600 Hz) | 0.3–0.35 |
| Heavy thing settles | `thud` | 0.3–0.4 |
| Gust | `whoosh` | 0.1–0.15 |
| Bed under everything | `water_ambience` (wash + gentle laps) | 0.04–0.06 |

## Rules
- Each sound sits on a **visible event**, timed to the frame it happens (the same seconds as the animation code).
- Effects are **ducked ~55% under speech** so the narrator is always clearly on top.
- One clear sound per event beats layers of noise. Small splashes repeat during an ongoing spill.
- Underwater or inside shots can drop the ambience a little; keep transitions smooth.
- Master: normalize to −14 LUFS integrated, true peak −1.5 dB.
