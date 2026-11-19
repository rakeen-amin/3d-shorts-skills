"""Place voice lines + sound effects on the timeline, and time every caption chunk to the real voice.
usage: python3 audio/mix.py beat_sheet.json [lines_dir=lines]
writes: mix.wav (stereo 48 kHz), vo_only.wav, cues.json  ([start, end, chunk_text, beat_index])"""
import sys, os, json, numpy as np, soundfile as sf, librosa
from scipy import signal
import sfx
from sfx import SR, lp

sheet = json.load(open(sys.argv[1])); ld = sys.argv[2] if len(sys.argv) > 2 else 'lines'
DUR = sheet['duration']; N = int(SR * DUR)
vo = np.zeros(N); cues = []

for bi, beat in enumerate(sheet['beats']):
    for l in beat['lines']:
        y, sr = sf.read(os.path.join(ld, f"{l['id']}.wav"), dtype='float32')
        y = librosa.resample(y, orig_sr=sr, target_sr=SR)
        i0 = int(l['start'] * SR); vo[i0:i0 + len(y)] += y[:max(N - i0, 0)]
        # chunk boundaries: proportional to text length (+pause weight for punctuation),
        # snapped to the quietest 10 ms frame within ±0.2 s — lands between words
        ch = l['chunks']
        ws = [len(c.replace('*', '')) + (4 if c.rstrip('*').endswith((',', '.', '!', '?')) else 0) for c in ch]
        hop = int(0.01 * SR); rms = librosa.feature.rms(y=y, frame_length=hop * 3, hop_length=hop)[0]
        bounds, acc = [0.0], 0
        for w in ws[:-1]:
            acc += w; est = acc / sum(ws) * len(y) / SR
            lo, hi = max(int((est - 0.2) / 0.01), 1), min(int((est + 0.2) / 0.01), len(rms) - 1)
            bounds.append((lo + int(np.argmin(rms[lo:hi]))) * 0.01 if hi > lo else est)
        bounds.append(len(y) / SR)
        for c, a, b in zip(ch, bounds[:-1], bounds[1:]):
            cues.append([round(l['start'] + a, 3), round(l['start'] + b, 3), c, bi])
cues[-1][1] = DUR - 0.1                                     # hold the last caption to the end
json.dump(cues, open('cues.json', 'w'), indent=1)

# voice polish: high-pass rumble, a little low-mid warmth, gentle compression
b, a = signal.butter(2, 70 / (SR / 2), 'high'); vo = signal.lfilter(b, a, vo)
b, a = signal.iirpeak(180 / (SR / 2), 1.0); vo = vo + 0.18 * signal.lfilter(b, a, vo)
envl = np.abs(signal.lfilter([0.002], [1, -0.998], np.abs(vo))) * 1.6
vo = vo * np.where(envl > 0.25, (0.25 + (envl - 0.25) / 3) / np.maximum(envl, 1e-9), 1.0)
vo = vo / (np.max(np.abs(vo)) + 1e-9) * 0.89

fx = np.zeros(N)
def put(x, at, gain):
    i = int(at * SR); x = x[:max(N - i, 0)]; fx[i:i + len(x)] += x * gain
amb = sheet.get('ambience')
if amb: fx += sfx.water_ambience(DUR) * amb.get('gain', 0.05)
for beat in sheet['beats']:
    for ev in beat.get('sfx', []): put(sfx.make(ev), ev['at'], ev.get('gain', 0.2))
fx = np.clip(fx, -1, 1)

# duck effects ~55% under speech so the voice stays clearly on top
venv = lp(np.abs(vo), 6); venv /= np.max(venv) + 1e-9
mix = vo + fx * (1 - 0.55 * np.clip(venv * 3, 0, 1))
mix = mix / np.max(np.abs(mix)) * 0.95
if sheet.get('music'): print('NOTE: music is not generated here; add it yourself only if the creator wants it.')
sf.write('mix.wav', np.stack([mix, mix], 1).astype(np.float32), SR, subtype='PCM_16')
sf.write('vo_only.wav', vo.astype(np.float32), SR, subtype='PCM_16')
for a, b, c, _ in cues: print(f'{a:6.2f}-{b:6.2f}  {c}')
