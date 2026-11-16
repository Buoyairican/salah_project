"""
Example clips, step 1 of 3: the voices.

For every clip in clips.json: speak each cue with a Piper neural voice, join the cues with natural pauses, level the
loudness (EBU R128, -16 LUFS, the same target as the real clips), and write:
  - work/<id>.wav               the levelled voice, 48 kHz
  - app/subtitles/<id>.vtt      English subtitles timed on the voice (French clips: the English translation)
  - app/content/waveforms/<id>.json   loudness envelope, 30 values per second, 0..1 (drives the voice-note visual)
  - work/<id>.json              timing manifest for the frame renderer

Run with the Python that has piper-tts installed:
  python make_audio.py --voices <folder with *.onnx voices> --work <scratch folder>
"""
import argparse
import json
import subprocess
import wave
from pathlib import Path

import numpy as np
from piper import PiperVoice

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
APP = ROOT / "app"

LEAD = 0.55  # silence before the first word
GAP = 0.42  # pause between two cues
TAIL = 0.9  # silence after the last word
FPS = 30  # envelope resolution
RATE = 48000


def stamp(t: float) -> str:
    t = max(0.0, t)
    h, rem = divmod(t, 3600)
    m, s = divmod(rem, 60)
    return f"{int(h):02d}:{int(m):02d}:{s:06.3f}"


def speak(voice: PiperVoice, text: str, path: Path) -> np.ndarray:
    with wave.open(str(path), "wb") as w:
        voice.synthesize_wav(text, w)
    with wave.open(str(path), "rb") as r:
        rate = r.getframerate()
        pcm = np.frombuffer(r.readframes(r.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
    # Trim the voice's own leading and trailing silence so our pauses are the real pauses.
    loud = np.where(np.abs(pcm) > 0.01)[0]
    if len(loud):
        pcm = pcm[max(0, loud[0] - int(0.02 * rate)) : loud[-1] + int(0.05 * rate)]
    return pcm, rate


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--voices", required=True)
    ap.add_argument("--work", required=True)
    args = ap.parse_args()
    voices_dir = Path(args.voices)
    work = Path(args.work)
    work.mkdir(parents=True, exist_ok=True)
    (APP / "subtitles").mkdir(parents=True, exist_ok=True)
    (APP / "content" / "waveforms").mkdir(parents=True, exist_ok=True)

    spec = json.loads((HERE / "clips.json").read_text())
    loaded: dict[str, PiperVoice] = {}

    for clip in spec["clips"]:
        cid = clip["id"]
        name = clip["voice"]
        if name not in loaded:
            loaded[name] = PiperVoice.load(str(voices_dir / f"{name}.onnx"))
        voice = loaded[name]

        parts: list[np.ndarray] = []
        cues = []
        t = LEAD
        rate = None
        for i, cue in enumerate(clip["cues"]):
            pcm, rate = speak(voice, cue["text"], work / f"{cid}-cue{i}.wav")
            dur = len(pcm) / rate
            cues.append({"start": t, "end": t + dur, "text": cue.get("en", cue["text"]), "spoken": cue["text"]})
            parts.append(pcm)
            t += dur + GAP
        total = t - GAP + TAIL

        audio = np.zeros(int(total * rate) + 1, dtype=np.float32)
        for cue, pcm in zip(cues, parts):
            i0 = int(cue["start"] * rate)
            audio[i0 : i0 + len(pcm)] += pcm
        raw = work / f"{cid}-raw.wav"
        with wave.open(str(raw), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(rate)
            w.writeframes((np.clip(audio, -1, 1) * 32767).astype(np.int16).tobytes())

        # Level the loudness like a real clip would be, at 48 kHz.
        out = work / f"{cid}.wav"
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw),
             "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", str(RATE), "-ac", "1", str(out)],
            check=True,
        )
        with wave.open(str(out), "rb") as r:
            pcm = np.frombuffer(r.readframes(r.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
        duration = len(pcm) / RATE

        # Envelope: RMS per frame, mapped so speech sits around 0.4-0.9 and silence at 0.
        hop = RATE // FPS
        frames = len(pcm) // hop
        rms = np.array([np.sqrt(np.mean(pcm[k * hop : (k + 1) * hop] ** 2)) for k in range(frames)])
        db = 20 * np.log10(np.maximum(rms, 1e-5))
        env = np.clip((db + 50) / 38, 0, 1)
        (APP / "content" / "waveforms" / f"{cid}.json").write_text(json.dumps([round(float(v), 3) for v in env]))

        # Subtitles: each cue stays up through the pause that follows it, so the text never blinks between lines.
        lines = ["WEBVTT", ""]
        for i, cue in enumerate(cues):
            start = cue["start"] - 0.08
            end = cues[i + 1]["start"] - 0.12 if i + 1 < len(cues) else min(duration, cue["end"] + 0.7)
            lines += [str(i + 1), f"{stamp(start)} --> {stamp(end)}", cue["text"], ""]
        (APP / "subtitles" / f"{cid}.vtt").write_text("\n".join(lines))

        (work / f"{cid}.json").write_text(json.dumps({**clip, "duration": duration, "timed": cues}, ensure_ascii=False))
        print(f"{cid}: {duration:.1f}s, {len(cues)} cues, voice {name}")


if __name__ == "__main__":
    main()
