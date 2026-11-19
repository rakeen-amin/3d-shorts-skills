"""Find the stock TTS voice (or blend of voices) that sounds most like a reference narrator.
Scores every voice with a speaker-embedding model (cosine similarity, 1.0 = same speaker), then tries
blends of the top 4. This *matches* a voice; it does not clone one.
usage: python3 audio/match_voice.py ref.wav [--female]   → prints ranking + best blend JSON"""
import sys, itertools, json, soundfile as sf
from common import kokoro, blend_style, embedder, median_pitch, load16

ref = sys.argv[1]; female = '--female' in sys.argv
TEST = ("Dig a hole in your backyard, and when the storm hits, your family will be the safest people on the street. "
        "Up top, the wind is howling. Down here, it's quiet.")
k = kokoro(); emb = embedder()
R = emb(load16(ref), 16000)
prefix = ('af', 'bf') if female else ('am', 'bm')
voices = [v for v in k.get_voices() if v[:2] in prefix]
score = {}
for v in voices:
    y, sr = k.create(TEST, voice=v, speed=1.0, lang='en-us' if v[0] == 'a' else 'en-gb')
    score[v] = float(emb(y, sr) @ R)
    print(f'{v:12s} similarity {score[v]:.3f}  pitch {median_pitch(y, sr):.0f} Hz')
top = sorted(score, key=score.get, reverse=True)[:4]
best = ({top[0]: 1.0}, score[top[0]])
combos = [dict(zip(p, w)) for p in itertools.combinations(top, 2) for w in [(0.3, 0.7), (0.5, 0.5), (0.7, 0.3)]]
combos += [dict(zip(top[:3], w)) for w in [(0.4, 0.4, 0.2), (0.34, 0.33, 0.33), (0.5, 0.3, 0.2)]]
for c in combos:
    y, sr = k.create(TEST, voice=blend_style(k, c), speed=1.0, lang='en-us')
    s = float(emb(y, sr) @ R); print('blend', c, f'{s:.3f}')
    if s > best[1]: best = (c, s)
print('\nBEST', json.dumps(best[0]), f'similarity {best[1]:.3f}')
print('Put it in beat_sheet.json → voice.blend. Do NOT pitch-shift to close the gap: it lowers similarity sharply.')
