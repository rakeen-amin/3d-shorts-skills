#!/usr/bin/env bash
# Free models, all hosted as GitHub release assets.
set -e
mkdir -p "$(dirname "$0")/models" && cd "$(dirname "$0")/models"
K=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
curl -L -O $K/kokoro-v1.0.onnx
curl -L -O $K/voices-v1.0.bin
curl -L https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-tiny.en.tar.bz2 | tar xj
curl -L -O https://github.com/k2-fsa/sherpa-onnx/releases/download/speaker-recongition-models/wespeaker_en_voxceleb_resnet34.onnx
echo "models ready"
