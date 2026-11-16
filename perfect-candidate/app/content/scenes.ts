/**
 * The seven scenes of Part 1, from « The Perfect Candidate — Full Script ». Every text here is the script's own:
 * scene titles, the « Lesson on screen » sentences, and the Narrator's lines. `label` is the short form shown on
 * the lesson board; `audience` says who the lesson is for (the twist of the finale: three lessons are the jury's).
 */
export interface Scene {
  n: number
  title: string
  /** « Lesson on screen », word for word. */
  lesson: string
  /** The lesson in two or three words, for the lesson board. */
  label: string
  audience: 'candidate' | 'jury'
  /** The line that sums up the mistake, shown as a frozen quote on the freeze screen. */
  moment: { who: string; line: string }
  /** The Narrator's words after « Freeze! »; the press for the video comes on the last sentence. */
  narrator: string
  /** The last sentence of `narrator`: the cue for the video press. */
  videoCue: string
  /**
   * Seconds between the end of the unfreeze and the moment the scene tag shows the next scene: the time the
   * actors need for the lines left in this scene. Estimated from the script; set them from a rehearsal video.
   */
  tailSeconds: number
}

export const scenes: Scene[] = [
  {
    n: 1,
    title: 'The Late Candidate',
    lesson: 'Punctuality shows respect and professionalism.',
    label: 'Be on time',
    audience: 'candidate',
    moment: { who: 'Ayoub', line: 'Okay. Let’s start.' },
    narrator:
      'Fifteen minutes late. No “hello”. No “sorry”. A late arrival is the first thing a jury notices. Here is the right way to arrive.',
    videoCue: 'Here is the right way to arrive.',
    tailSeconds: 24,
  },
  {
    n: 2,
    title: 'The Interviewer Who Interrupts',
    lesson: 'Active listening is a professional skill.',
    label: 'Listen fully',
    audience: 'jury',
    moment: { who: 'Aya, Director', line: 'Then say it!' },
    narrator:
      'This time, the mistake is not only the candidate’s. The interviewer cuts every answer. Here is how to listen.',
    videoCue: 'Here is how to listen.',
    tailSeconds: 14,
  },
  {
    n: 3,
    title: 'The Weak Answer',
    lesson: 'Show your skills through evidence, not just adjectives.',
    label: 'Give evidence',
    audience: 'candidate',
    moment: { who: 'Ayoub', line: 'I am hardworking, motivated, and a good team player.' },
    narrator:
      'Three adjectives. Anyone can say them. An employer needs proof, not words. Here is how to answer with an example.',
    videoCue: 'Here is how to answer with an example.',
    tailSeconds: 14,
  },
  {
    n: 4,
    title: 'The Angry Reaction',
    lesson: 'Respond to criticism with calmness and evidence.',
    label: 'Stay calm',
    audience: 'candidate',
    moment: { who: 'Ayoub', line: 'You didn’t understand my answer!' },
    narrator: 'Ayoub is partly right. But he answered criticism with anger. Here is a calmer way to react.',
    videoCue: 'Here is a calmer way to react.',
    tailSeconds: 14,
  },
  {
    n: 5,
    title: 'Judging Without Evidence',
    lesson: 'Evaluate evidence, not assumptions.',
    label: 'Judge facts',
    audience: 'jury',
    moment: { who: 'Nora', line: 'I decided in the first minute: not him.' },
    narrator:
      'Three people just decided. A tie. A voice. A feeling. No facts. Here is how a good recruiter judges a candidate.',
    videoCue: 'Here is how a good recruiter judges a candidate.',
    tailSeconds: 7,
  },
  {
    n: 6,
    title: 'The Candidate Has No Questions',
    lesson: 'An interview is a two-way conversation.',
    label: 'Ask questions',
    audience: 'candidate',
    moment: { who: 'Ayoub', line: 'No, thank you. Everything is clear.' },
    narrator:
      'Ayoub has no questions. For a jury, this often means “I am not interested”. Here is what a candidate can ask.',
    videoCue: 'Here is what a candidate can ask.',
    tailSeconds: 22,
  },
  {
    n: 7,
    title: 'The Quick Decision',
    lesson: 'A fast decision is not always a fair decision.',
    label: 'Decide fairly',
    audience: 'jury',
    moment: { who: 'Asmae', line: 'Then it’s a no. Three minutes. Good.' },
    narrator:
      'Five people. Three minutes. One decision. No facts, no score sheet. Here is a real reaction to this decision.',
    videoCue: 'Here is a real reaction to this decision.',
    tailSeconds: 0,
  },
]

/** The Narrator's other press cues, for the press sheet. */
export const narratorCues = {
  prologueEnd: 'Maybe the most important person in this room is not the one on the chair.',
  part2: 'Same jury. Same chaos. Now, a new candidate: Aya.',
  finale: 'Today, the candidates were not the only ones being interviewed.',
}
