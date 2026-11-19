"""Shared helpers: model paths, Kokoro voice blending, speaker embeddings, transcription."""
import os, numpy as np, librosa

MODELS = os.environ.get('MODELS', os.path.join(os.path.dirname(__file__), '..', 'models'))
WHISPER = os.path.join(MODELS, 'sherpa-onnx-whisper-tiny.en')


def kokoro():
    from kokoro_onnx import Kokoro
    return Kokoro(os.path.join(MODELS, 'kokoro-v1.0.onnx'), os.path.join(MODELS, 'voices-v1.0.bin'))


def blend_style(k, blend):
    """blend: {'am_liam': 0.4, 'am_michael': 0.6} → weighted average of style vectors (a new, in-between voice)."""
    return sum(k.get_voice_style(v) * w for v, w in blend.items())


def recognizer():
    import sherpa_onnx
    return sherpa_onnx.OfflineRecognizer.from_whisper(
        encoder=os.path.join(WHISPER, 'tiny.en-encoder.int8.onnx'), decoder=os.path.join(WHISPER, 'tiny.en-decoder.int8.onnx'),
        tokens=os.path.join(WHISPER, 'tiny.en-tokens.txt'), num_threads=2)


def transcribe(rec, y16):
    s = rec.create_stream(); pad = np.zeros(1600, np.float32)
    s.accept_waveform(16000, np.concatenate([pad, y16.astype(np.float32), pad, pad])); rec.decode_stream(s)
    return s.result.text.strip()


def embedder():
    import sherpa_onnx
    ext = sherpa_onnx.SpeakerEmbeddingExtractor(sherpa_onnx.SpeakerEmbeddingExtractorConfig(
        model=os.path.join(MODELS, 'wespeaker_en_voxceleb_resnet34.onnx'), num_threads=2))
    def emb(y, sr):
        if sr != 16000: y = librosa.resample(y, orig_sr=sr, target_sr=16000)
        s = ext.create_stream(); s.accept_waveform(16000, y.astype(np.float32)); s.input_finished()
        e = np.array(ext.compute(s)); return e / np.linalg.norm(e)
    return emb


def median_pitch(y, sr):
    y = librosa.resample(y, orig_sr=sr, target_sr=16000)
    f, v, _ = librosa.pyin(y, fmin=60, fmax=400, sr=16000, frame_length=1024)
    return float(np.median(f[v])) if v.any() else float('nan')


def load16(path):
    y, sr = librosa.load(path, sr=16000, mono=True)
    return y
