#!/usr/bin/env bash
# finish.sh beat_sheet.json  — join rendered beats, add mix.wav, burn captions.ass → final.mp4
set -e
SHEET=${1:-beat_sheet.json}
ffmpeg -y -loglevel error -f concat -safe 0 -i out/list.txt -c copy video_nocap.mp4
ffmpeg -y -loglevel error -i video_nocap.mp4 -i mix.wav -map 0:v -map 1:a -vf "ass=captions.ass" \
  -af "loudnorm=I=-14:TP=-1.5:LRA=9" -ar 48000 -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -shortest -movflags +faststart final.tmp.mp4
mv final.tmp.mp4 final.mp4 && echo "final.mp4 ready"
