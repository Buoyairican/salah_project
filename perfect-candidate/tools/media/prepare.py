"""
Prepare a professional's real clip for the show. Needs ffmpeg (https://ffmpeg.org) and Python 3, nothing else.

  python3 tools/media/prepare.py <input file> <name> [--audio]

  <input file>  what the person sent: a phone video (.mp4, .mov, ...) or a voice note (.ogg, .opus, .m4a, .mp3, ...)
  <name>        the base name used in content/experts.ts, e.g. scene-3-recruiter
  --audio       treat it as a voice note (automatic for audio-only files)

It writes, in app/public/media/:
  video:       <name>.webm + <name>.mp4 (max 1080p, phone rotation kept) and <name>-poster.jpg
  voice note:  <name>.webm + <name>.m4a
and app/content/waveforms/<name>.json (the voice's loudness, drives the ring around the photo).
The sound is levelled to the same loudness as every other clip (EBU R128, -16 LUFS), so no clip is too loud or too
quiet in the room. Subtitles are separate: app/subtitles/<name>.vtt (see the README).
"""
import argparse
import array
import json
import math
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MEDIA = ROOT / "app" / "public" / "media"
WAVES = ROOT / "app" / "content" / "waveforms"
LEVEL = "loudnorm=I=-16:TP=-1.5:LRA=11"


def ff(*args: str) -> None:
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *args], check=True)


def has_video(path: Path) -> bool:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries", "stream=codec_type", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True,
    ).stdout
    return "video" in out


def waveform(src: Path, out: Path) -> None:
    pcm = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(src), "-af", LEVEL, "-ac", "1", "-ar", "48000", "-f", "s16le", "-"],
        capture_output=True, check=True,
    ).stdout
    samples = array.array("h", pcm)
    hop = 48000 // 30
    env = []
    for k in range(len(samples) // hop):
        chunk = samples[k * hop : (k + 1) * hop]
        rms = math.sqrt(sum(s * s for s in chunk) / len(chunk)) / 32768
        db = 20 * math.log10(max(rms, 1e-5))
        env.append(round(min(1.0, max(0.0, (db + 50) / 38)), 3))
    out.write_text(json.dumps(env))


def main() -> None:
    ap = argparse.ArgumentParser(description="Prepare a clip for The Perfect Candidate")
    ap.add_argument("input")
    ap.add_argument("name")
    ap.add_argument("--audio", action="store_true")
    a = ap.parse_args()
    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg is needed: https://ffmpeg.org/download.html")
    src = Path(a.input)
    MEDIA.mkdir(parents=True, exist_ok=True)
    WAVES.mkdir(parents=True, exist_ok=True)
    audio = a.audio or not has_video(src)
    base = MEDIA / a.name
    if audio:
        ff("-i", str(src), "-vn", "-af", LEVEL, "-ar", "48000", "-c:a", "libopus", "-b:a", "96k", f"{base}.webm")
        ff("-i", str(src), "-vn", "-af", LEVEL, "-ar", "48000", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", f"{base}.m4a")
    else:
        # Longest side 1920 at most, rotation from the phone applied, even dimensions for the encoders.
        scale = "scale='if(gt(iw,ih),min(1920,iw),-2)':'if(gt(iw,ih),-2,min(1920,ih))',scale=trunc(iw/2)*2:trunc(ih/2)*2"
        ff("-i", str(src), "-vf", scale, "-af", LEVEL, "-ar", "48000",
           "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "33", "-row-mt", "1", "-deadline", "good", "-cpu-used", "3",
           "-pix_fmt", "yuv420p", "-c:a", "libopus", "-b:a", "96k", f"{base}.webm")
        ff("-i", str(src), "-vf", scale, "-af", LEVEL, "-ar", "48000",
           "-c:v", "libx264", "-crf", "21", "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
           "-c:a", "aac", "-b:a", "128k", f"{base}.mp4")
        ff("-ss", "1", "-i", f"{base}.mp4", "-frames:v", "1", "-q:v", "3", f"{base}-poster.jpg")
    waveform(src, WAVES / f"{a.name}.json")
    kind = "audio" if audio else "video"
    print(f"Done: {a.name} ({kind}). Now add app/subtitles/{a.name}.vtt and fill in app/content/experts.ts.")


if __name__ == "__main__":
    main()
