#!/usr/bin/env bash
# Example clips, step 3 of 3: encode. Joins the rendered frames with the levelled voice.
#   video: <id>.webm (VP9 + Opus, plays in every browser) and <id>.mp4 (H.264 + AAC, fallback and VLC backup)
#   voice note: <id>.webm (Opus) and <id>.m4a (AAC)
#   poster: <id>-poster.jpg, the picture shown before a video starts
# usage: encode.sh <work folder>
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
WORK="$1"
MEDIA="$HERE/../../app/public/media"
mkdir -p "$MEDIA"
for manifest in "$WORK"/example-*.json; do
  id="$(basename "$manifest" .json)"
  kind="$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['kind'])" "$manifest")"
  wav="$WORK/$id.wav"
  if [ "$kind" = "video" ]; then
    ffmpeg -y -loglevel error -framerate 25 -i "$WORK/$id/%05d.jpg" -i "$wav" \
      -c:v libvpx-vp9 -b:v 0 -crf 34 -row-mt 1 -deadline good -cpu-used 3 -pix_fmt yuv420p \
      -c:a libopus -b:a 96k -shortest "$MEDIA/$id.webm"
    ffmpeg -y -loglevel error -framerate 25 -i "$WORK/$id/%05d.jpg" -i "$wav" \
      -c:v libx264 -crf 21 -preset medium -pix_fmt yuv420p -movflags +faststart \
      -c:a aac -b:a 128k -shortest "$MEDIA/$id.mp4"
    cp "$WORK/$id/00012.jpg" "$MEDIA/$id-poster.jpg"
  else
    ffmpeg -y -loglevel error -i "$wav" -c:a libopus -b:a 96k "$MEDIA/$id.webm"
    ffmpeg -y -loglevel error -i "$wav" -c:a aac -b:a 128k -movflags +faststart "$MEDIA/$id.m4a"
  fi
  echo "$id ($kind) encoded"
done
