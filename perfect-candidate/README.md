# The Perfect Candidate · stage screen

The screen behind the actors for *The Perfect Candidate* (ENSA Kénitra, English class). While you act, it is a calm
night-office backdrop that shows the scene. When the Narrator says **“Freeze!”**, the screen turns to ice with a sound,
a professional answers in a video or voice note with subtitles, the lesson goes on the board, and the room thaws.

All seven clips in it today are **examples** (synthetic voices, drawn silhouettes) so you can rehearse now. Swap
them for the real ones when they arrive (see [Adding a real clip](#adding-a-real-clip)).

## Run the show

1. Open **`presentation/index.html`** in **Google Chrome** (double click; no internet, no install, no server).
2. Press **F** for full screen. Put the window on the projector.
3. Before the audience comes in, press once: you hear a soft whoosh (sound check) and the title appears.
4. Give the Narrator the clicker and **[PRESS-SHEET.pdf](PRESS-SHEET.pdf)** for the clipboard.

Keep the folder together: `index.html` needs the `media/` folder next to it. Copy the whole `presentation/` folder to
the USB key and the second device.

### The 19 presses (all on the Narrator's own words)

| # | The Narrator… | The screen |
|---|---|---|
| 1 | presses once before the audience comes in | sound check, then the title (stays during the prologue) |
| 2 | ends the prologue: “…not the one on the chair.” | “Candidate 1 — Ayoub”, then Scene 1 in the corner, clock at 9:15 |
| 3, 5 … 15 | says **“Freeze!”** (scenes 1–7) | flash, cold blue, freeze sound, everything stops |
| 4, 6 … 16 | says the last words before the video (“Here is the right way to arrive.”) | who is speaking → clip with subtitles → the lesson → it flies onto the board → **unfreeze sound, the room thaws by itself** |
| 17 | “Same jury. Same chaos. Now, a new candidate: Aya.” | **The Perfect Candidate**: morning light, Aya's four lessons checked |
| 18 | “…not the only ones being interviewed.” | “Who is really being interviewed?”, the jury's three lessons light up |
| 19 | after the bow | credits |

The unfreeze sound is the actors' cue: lower the hand when it starts, act again when it fades. The scene name in the
corner moves to the next scene by itself after the last lines of each scene.

### Keys

| Key | What it does |
|---|---|
| → Space Enter PageDown (clicker forward) | next |
| ← Backspace PageUp (clicker back) | **undo** the last press. Back during a clip stops it; back after a too-early “Freeze!” brings the room back |
| S | skip the clip now (emergency) |
| B or . (clicker blank button) | black screen; any press brings the picture back |
| F | full screen |
| number, then Enter | jump to that screen (1 = pre-show) |
| H | help: where the show is, the next cue, the keys (for rehearsals, not during the show) |

Safety built in: presses are ignored while a clip plays; a double press within ¾ s counts once; a held key does not
repeat; F5 (sent by some clickers) does not reload; after a reload the show reopens where it was; a clip that cannot
play is skipped after a few seconds and the show goes on.

## Adding a real clip

You need [ffmpeg](https://ffmpeg.org/download.html) and Python 3 for step 1, and Node 22 with pnpm for step 4. Or send
the files and the person's details and it can be done for you.

1. **Convert and level it** (any phone video or voice note: .mp4, .mov, .ogg, .opus, .m4a…):

   ```bash
   python3 tools/media/prepare.py ~/Downloads/video-from-whatsapp.mp4 scene-1-hr-manager
   ```

   This writes the clip to `app/public/media/` (WebM + MP4, max 1080p, phone rotation kept, same loudness as every
   other clip) with its poster picture and the voice waveform.
2. **Subtitles**: write `app/subtitles/scene-1-hr-manager.vtt`. If they speak English, write what they say; if they
   speak French, write the English translation. Two lines at most per subtitle:

   ```text
   WEBVTT

   00:00:00.500 --> 00:00:04.000
   When a candidate walks in late, the jury notices.

   00:00:04.100 --> 00:00:07.800
   Call before the interview if you will be late.
   ```

3. **The person**: in `app/content/experts.ts`, edit the entry of that scene: `file`, `kind` (video or audio),
   `orientation` (portrait for a phone held upright), `language`, and the person (name, job title, company, field,
   photo file, LinkedIn). Set `example: false`. **Show only what they agreed to**: `name: null` shows the job title
   only, `photo: null` shows an icon, `linkedin: null` hides the LinkedIn line and the QR code.
4. **Rebuild** the folder you present from:

   ```bash
   pnpm install
   pnpm release
   ```

To rehearse with live changes instead: `pnpm dev` and open http://127.0.0.1:5190.

## Tuning for the room

- **Scene timing**: `tailSeconds` in `app/content/scenes.ts` is how long after the thaw the corner moves to the next
  scene. Film a rehearsal and set each one to the time the actors need for the lines left in that scene.
- **Text too low** (the jury table hides the bottom of the screen): everything important sits in the top two thirds.
  The final question's lesson row can be raised with `--lift` in `app/src/styles.css`.
- **Sound volume**: set the laptop volume during the sound check; clips are levelled to the same loudness as each
  other.
- **Lessons**: the words on the board are the script's “Lesson on screen” sentences; the short labels are `label` in
  `app/content/scenes.ts`.

## How it is made

Built on the motion-deck engine of [samouraifox/school-innovation-project](https://github.com/samouraifox/school-innovation-project)
(`packages/kit`: the 1920 × 1080 stage, one press per screen, transitions, reload resume, black screen, keyboard). Added
to the engine for this show: slide enter hooks (to start media and sounds), a press hold while a clip plays, a
double-press guard and a stage hook for layers that live across slides. Everything else is in `app/`:

| Where | What |
|---|---|
| `app/content/` | the script's scenes and lessons, the seven professionals, the cast, the voice waveforms |
| `app/slides/` | the 20 screens: pre-show, title, Part 1, freeze ×7, professional ×7, Part 2, final question, credits |
| `app/src/world/` | the room (night, ice, morning light, dust, frost) and the HUD (scene, clock, lesson board) |
| `app/src/media/` | the clip player and the subtitles |
| `app/src/sound.ts` | the freeze and unfreeze sounds, made in code |
| `tools/media/` | prepares a real clip |
| `tools/examples/` | how the example clips were made (Piper voices, drawn placeholders) |
| `tools/press-sheet/` | makes PRESS-SHEET.pdf from the script |
| `presentation/` | the built show to present from |

Checks: `pnpm check` (types and the engine's unit tests).

Design decisions and why: [DECISIONS.md](DECISIONS.md).
