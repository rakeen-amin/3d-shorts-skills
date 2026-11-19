"""Generate every narration line in the beat sheet with the chosen voice, and check it fits the timeline.
usage: python3 audio/generate_lines.py beat_sheet.json [out_dir=lines]"""
import sys, os, json, librosa, soundfile as sf
from common import kokoro, blend_style

sheet = json.load(open(sys.argv[1])); out = sys.argv[2] if len(sys.argv) > 2 else 'lines'
os.makedirs(out, exist_ok=True)
vc = sheet['voice']; k = kokoro(); style = blend_style(k, vc['blend'])
lines = [(b, l) for b in sheet['beats'] for l in b['lines']]
meta = {}
for i, (beat, l) in enumerate(lines):
    y, sr = k.create(l['text'], voice=style, speed=l.get('speed', vc.get('speed', 0.9)), lang=vc.get('lang', 'en-us'))
    y, _ = librosa.effects.trim(y, top_db=40)
    sf.write(os.path.join(out, f"{l['id']}.wav"), y, sr)
    dur = len(y) / sr; end = l['start'] + dur
    nxt = lines[i + 1][1]['start'] if i + 1 < len(lines) else sheet['duration']
    limit = min(nxt, beat['end'] + 0.3)
    flag = '' if end <= limit - 0.1 else f'  <-- TOO LONG by {end - limit + 0.1:.2f}s: raise speed, cut words, or move the next line'
    print(f"{l['id']:6s} {l['start']:6.2f}→{end:6.2f}  ({dur:.2f}s){flag}")
    meta[l['id']] = {'dur': dur, 'sr': sr}
json.dump(meta, open(os.path.join(out, 'meta.json'), 'w'), indent=1)
