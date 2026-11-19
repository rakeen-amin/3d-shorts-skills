"""Build burned-in Shorts captions (.ass for ffmpeg/libass).
- From voice timing:  python3 captions/build_captions.py beat_sheet.json cues.json [nudges.json] > captions.ass
- Script timing only (no voice yet): python3 captions/build_captions.py beat_sheet.json --script > captions.ass
  (spreads each line's chunks over an estimated duration at ~3 words/s)
Style: bold white, black outline, small shadow, 2–5 words per cue, *word* → yellow, quick scale pop,
lower-middle position clear of the Shorts UI; beats with "caption_y": "raised" move up so the text
doesn't cover the key detail."""
import sys, json

sheet = json.load(open(sys.argv[1])); cap = sheet.get('captions', {})
W, H = sheet.get('width', 1080), sheet.get('height', 1920)
Y_DEF, Y_UP = cap.get('default_y', int(H * 0.724)), cap.get('raised_y', int(H * 0.52))
HL = cap.get('highlight_bgr', '00E1FF')

if len(sys.argv) > 2 and sys.argv[2] == '--script':
    cues = []
    for bi, beat in enumerate(sheet['beats']):
        for l in beat['lines']:
            t = l['start']
            for c in l['chunks']:
                d = max(0.55, len(c.replace('*', '').split()) / 3.0)
                cues.append([t, t + d, c, bi]); t += d
else:
    cues = json.load(open(sys.argv[2]))
    nudges = json.load(open(sys.argv[3])) if len(sys.argv) > 3 else {}
    for i, c in enumerate(cues):
        if c[2] in nudges:
            c[0] += nudges[c[2]]
            if i: cues[i - 1][1] = c[0] - 0.02

def ts(t): return f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"
def fmt(s):
    out, on = '', False
    for ch in s:
        if ch == '*': on = not on; out += f'{{\\c&H{HL}&}}' if on else '{\\c&HFFFFFF&}'
        else: out += ch
    return out

print(f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,{cap.get('font', 'Poppins')},{cap.get('size', 94)},&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,{cap.get('outline', 7)},2,2,60,60,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text""")
for a, b, text, bi in cues:
    y = Y_UP if sheet['beats'][bi].get('caption_y') == 'raised' else Y_DEF
    pop = r'{\fscx88\fscy88\t(0,90,\fscx100\fscy100)}'
    print(f"Dialogue: 0,{ts(a)},{ts(b)},Cap,,0,0,0,,{{\\pos({W // 2},{y})}}{pop}{fmt(text)}")
