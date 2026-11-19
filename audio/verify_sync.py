"""Check caption sync: transcribe the voice under each caption and print them side by side.
If a heard word belongs to the neighbouring caption, add a nudge (seconds) for that chunk in nudges.json:
  {"into a *tower,*": -0.2}   negative = start earlier, positive = start later
usage: python3 audio/verify_sync.py [cues.json] [vo_only.wav]"""
import sys, json, librosa
from common import recognizer, transcribe

cues = json.load(open(sys.argv[1] if len(sys.argv) > 1 else 'cues.json'))
y, _ = librosa.load(sys.argv[2] if len(sys.argv) > 2 else 'vo_only.wav', sr=16000)
rec = recognizer()
print(f"{'CAPTION':34s} | HEARD")
for a, b, c, *_ in cues:
    b = min(b, a + 3.0)
    print(f"{c.replace('*', ''):34s} | {transcribe(rec, y[int(a * 16000):int(b * 16000)])}")
print('\nWhisper-tiny mishears names and splits words; look only for words that leaked across a boundary.')
