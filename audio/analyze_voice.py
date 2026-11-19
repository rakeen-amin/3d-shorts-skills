"""Describe a reference narration: transcript, pace, pauses, pitch, brightness.
usage: python3 audio/analyze_voice.py ref.wav  → prints a profile and writes voice_profile.json"""
import sys, json, numpy as np, librosa
from common import recognizer, transcribe, load16

y = load16(sys.argv[1]); sr = 16000
rec = recognizer()
iv = librosa.effects.split(y, top_db=35, frame_length=1024, hop_length=256)
# group speech into <25 s pieces for Whisper
segs, cur = [], None
for a, b in iv:
    if cur is None: cur = [a, b]
    elif (b - cur[0]) / sr < 25 and (a - cur[1]) / sr < 1.2: cur[1] = b
    else: segs.append(cur); cur = [a, b]
if cur: segs.append(cur)
text = [transcribe(rec, y[a:b]) for a, b in segs]
words = sum(len(t.split()) for t in text)
speech = sum(b - a for a, b in iv) / sr
gaps = [(iv[i + 1][0] - iv[i][1]) / sr for i in range(len(iv) - 1)]
f0, vf, _ = librosa.pyin(y, fmin=60, fmax=400, sr=sr, frame_length=1024); f = f0[vf]
cent = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
prof = {
    'duration_s': round(len(y) / sr, 1), 'words': words,
    'wpm_while_speaking': round(words / speech * 60), 'wpm_overall': round(words / (len(y) / sr) * 60),
    'pauses_over_0_25s': int(sum(g > 0.25 for g in gaps)),
    'median_pause_s': round(float(np.median([g for g in gaps if g > 0.25])), 2) if any(g > 0.25 for g in gaps) else 0,
    'pitch_median_hz': round(float(np.median(f))), 'pitch_p10_hz': round(float(np.percentile(f, 10))), 'pitch_p90_hz': round(float(np.percentile(f, 90))),
    'pitch_range_semitones': round(float(12 * np.log2(np.percentile(f, 90) / np.percentile(f, 10))), 1),
    'brightness_centroid_hz': round(float(np.median(cent[cent > 0]))),
    'transcript': ' '.join(text),
}
for k, v in prof.items(): print(f'{k:24s} {v}')
json.dump(prof, open('voice_profile.json', 'w'), indent=1)
print('\nRead it: ~85–125 Hz deep male, 165–255 Hz typical female; range >8 semitones = expressive; 160–200 wpm = brisk narrator.')
