"""Procedural sound effects (no sample files): splash, pour, click, thud, whoosh, water ambience.
All return mono float arrays at SR. Normalized to peak 1; scale with a gain when placing."""
import numpy as np
from scipy import signal

SR = 48000
_rng = np.random.default_rng(7)


def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), hi / (SR / 2)], 'band'); return signal.lfilter(b, a, x)


def lp(x, f, order=2):
    b, a = signal.butter(order, f / (SR / 2), 'low'); return signal.lfilter(b, a, x)


def env(n, att, dec):
    e = np.ones(n); na = max(1, int(att * SR)); e[:na] = np.linspace(0, 1, na)
    e[na:] = np.exp(-np.arange(n - na) / (dec * SR)); return e


def norm(x): return x / (np.max(np.abs(x)) + 1e-9)


def splash(size=1.0, length=0.8):
    """impact splash: bright noise burst + low body + droplets"""
    n = int(length * SR)
    x = bp(_rng.standard_normal(n), 400, 5000) * env(n, 0.006, length * 0.3)
    x += bp(_rng.standard_normal(n), 120, 600) * env(n, 0.01, length * 0.2) * 0.8
    for _ in range(int(10 * size)):
        i = int(_rng.uniform(0.05, 0.9) * n); m = int(0.03 * SR); f = _rng.uniform(900, 2200)
        d = np.sin(2 * np.pi * np.cumsum(np.linspace(f, f * 1.6, m)) / SR) * env(m, 0.002, 0.01)
        x[i:i + m] += d[:n - i] * 0.25
    return norm(x)


def pour(length=2.0, lo=500, hi=3500):
    """running / washing water; lo-hi sets the character (tap 1500–6000, rising water 200–1200)"""
    n = int(length * SR)
    x = bp(_rng.standard_normal(n), lo, hi)
    mod = lp(np.abs(_rng.standard_normal(n)), 8); x *= 0.5 + mod / np.max(mod)
    fade = np.minimum(1, np.minimum(np.arange(n) / (0.4 * SR), (n - np.arange(n)) / (0.8 * SR)))
    return norm(x) * fade


def click(freq=2400):
    """soft mechanical click for a part locking in, a switch, a latch"""
    n = int(0.06 * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * t) * env(n, 0.0005, 0.006)
    x += bp(_rng.standard_normal(n), 2000, 7000) * env(n, 0.0005, 0.004) * 0.6
    x += np.sin(2 * np.pi * 180 * t) * env(n, 0.001, 0.012) * 0.5
    return norm(x)


def thud(length=0.35):
    """heavy thing settling (on a seabed, on ground)"""
    n = int(length * SR); return norm(lp(_rng.standard_normal(n), 120) * env(n, 0.005, 0.08))


def whoosh(length=1.5):
    """gust of wind / fast pass-by"""
    n = int(length * SR); x = _rng.standard_normal(n)
    out = np.zeros(n); seg = int(0.05 * SR)
    for i in range(0, n, seg):
        f = 300 + 1500 * np.sin(np.pi * i / n); out[i:i + seg] = bp(x[i:i + seg + 2000], f * 0.6, f * 1.6)[:len(out[i:i + seg])]
    return norm(out * np.sin(np.pi * np.arange(n) / n))


def water_ambience(duration, laps=True):
    """soft brown-noise wash with slow swell and occasional gentle laps"""
    n = int(duration * SR); t = np.arange(n) / SR
    b = np.cumsum(_rng.standard_normal(n)); b -= lp(b, 0.5, 1)
    x = norm(lp(b, 500)) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.12 * t) ** 2)
    if laps:
        for _ in range(int(duration / 1.6)):
            i = int(_rng.uniform(0, max(duration - 1, 0.1)) * SR); m = int(0.5 * SR)
            x[i:i + m] += norm(bp(_rng.standard_normal(m), 250, 1400) * env(m, 0.12, 0.12))[:n - i] * 0.6
    return norm(x)


LIB = {'splash': splash, 'pour': pour, 'click': click, 'thud': thud, 'whoosh': whoosh}


def make(ev):
    """ev from the beat sheet: {"type": "splash", "at": 1.2, "gain": 0.3, ...extra args}"""
    kw = {k: v for k, v in ev.items() if k not in ('type', 'at', 'gain')}
    return LIB[ev['type']](**kw)
