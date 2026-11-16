# Decisions

What was decided, why, and what it costs if it is wrong.

| Decision | Why | Cost if wrong |
|---|---|---|
| Every press is on the Narrator's own words (19 presses) | Non-professional actors; the Narrator never has to watch the others for a cue | The corner shows the next scene a few lines early or late (timed by `tailSeconds`) |
| The unfreeze plays by itself after the lesson, with its sound | The sound becomes the actors' cue to move again; one press fewer | If a room needs a manual unfreeze, it is one change in `slides/expert.ts` |
| Presses are ignored while a clip plays; Back always works | A nervous double press cannot skip a professional's answer; any press can be undone | None known; S skips a clip if really needed |
| Night (Part 1), ice (freeze), morning (Part 2), one light from above (final) | The screen lights the room: the projector itself becomes the cold blue light the script asks for | Colours are CSS variables in `styles.css` |
| Dark backdrop while acting | A bright screen lights the actors from behind and pulls the eye from them | Raise `.w-blinds` opacity for a brighter room |
| Everything important in the top two thirds | The jury table hides the bottom of the projection | `--lift` and the layout values in `styles.css` |
| Only two sounds (freeze, unfreeze), made in code | The team asked for no music; code sounds cannot go missing or break copyright | Real recordings can replace them in `sound.ts` |
| Subtitles drawn by the show, not by the browser | Same large, boxed, balanced style on every clip; works the same for video and voice notes | Needs a .vtt file per clip |
| French clips get English subtitles; English clips get English subtitles | The team's rule; the audience follows in English | — |
| The card shows only what each person agreed to | Consent: name, photo and LinkedIn are optional, job title is not | Fields in `experts.ts` |
| Clips are WebM with an MP4 fallback, loudness levelled to −16 LUFS | Plays in every browser; no clip is too loud or too quiet in the room | `tools/media/prepare.py` does it |
| One self-contained `index.html` + `media/` | Opens by double click, offline, from a USB key | Must keep `media/` next to it |
| The lesson board's twist: in Part 2 the jury's three lessons stay dim; the final lights them | Carries the play's question, “who is really being interviewed?”, with no extra press | Remove `lightJury` and the dim class to show all seven as equal |
| The Part 2 title holds the centre for 4 s, then sits in the corner | One slide says “The Perfect Candidate”, but the centre stays free for Aya and the jury | Increase the hold in `slides/part2.ts` |
