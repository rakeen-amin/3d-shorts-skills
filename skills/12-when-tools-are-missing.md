# 12. When tools are missing

| Situation | What to do |
|---|---|
| No credits for AI video generation | Build the video in code with `engine/`. It costs nothing, and you control every frame and stay consistent. |
| No GPU | SwiftShader software WebGL in headless Chrome (`render.mjs` already sets it). ~0.5 s/frame. |
| Can't watch a reference video | Ask for the creator's description or use a scene-analysis tool if available; otherwise build from the brief's style notes and say so. Don't claim you studied it. |
| Model hosts blocked (e.g. Hugging Face) | Many open models are mirrored in **GitHub release assets**: Kokoro TTS (`thewh1teagle/kokoro-onnx`), Whisper and speaker-embedding models (`k2-fsa/sherpa-onnx`). See `download_models.sh`. |
| No transcription service | `sherpa-onnx` Whisper-tiny on CPU is enough for checking sync. |
| Voice cloning unavailable or no permission | Match the style with stock-voice blends (`match_voice.py`) and say it's a match, not a clone. |
| No font for captions | Install Poppins (or any bold geometric sans) and set `captions.font`. |
| ffmpeg without libass | Install a full ffmpeg build; captions must be burned in for Shorts. |
| Can't push to the creator's GitHub / cloud | Deliver a zip with git history and the exact push commands. |
