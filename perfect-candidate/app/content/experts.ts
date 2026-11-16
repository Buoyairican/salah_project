/**
 * The seven professionals, one per scene. THIS IS THE FILE TO EDIT when a real video arrives:
 *   1. put the files in app/public/media/ (see README: the media script converts and levels them),
 *   2. put the subtitles in app/subtitles/<file>.vtt,
 *   3. fill in the person below and set `example: false`.
 * Show only what each person agreed to: `name: null` shows the job title only, `photo: null` shows an icon,
 * `linkedin: null` hides the LinkedIn line and the QR code.
 */
export type Field = 'Human Resources' | 'Engineering' | 'Cybersecurity' | 'Recruitment' | 'Management' | 'Academia' | 'Panel interview'

export interface Expert {
  scene: number
  /** True for the stand-in clips made for rehearsals: shows an EXAMPLE tag. */
  example: boolean
  media: {
    kind: 'video' | 'audio'
    /** Base name in app/public/media/: <file>.webm and <file>.mp4 (video) or <file>.webm and <file>.m4a (voice note). */
    file: string
    /** Video only: phone videos are 'portrait'. */
    orientation?: 'landscape' | 'portrait'
    /** What the person speaks. French gets English subtitles; English gets English subtitles. */
    language: 'en' | 'fr'
  }
  person: {
    name: string | null
    jobTitle: string
    company: string
    field: Field
    /** File in app/public/media/, or null. */
    photo: string | null
    linkedin: string | null
  }
}

export const experts: Expert[] = [
  {
    scene: 1,
    example: true,
    media: { kind: 'video', file: 'example-1', orientation: 'landscape', language: 'en' },
    person: {
      name: 'Firstname Lastname',
      jobTitle: 'HR Manager',
      company: 'Telecom operator',
      field: 'Human Resources',
      photo: 'example-1-photo.jpg',
      linkedin: 'https://www.linkedin.com/in/firstname-lastname',
    },
  },
  {
    scene: 2,
    example: true,
    media: { kind: 'video', file: 'example-2', orientation: 'landscape', language: 'fr' },
    person: {
      name: 'Firstname Lastname',
      jobTitle: 'Network Engineer',
      company: 'Internet service provider',
      field: 'Engineering',
      photo: 'example-2-photo.jpg',
      linkedin: 'https://www.linkedin.com/in/firstname-lastname',
    },
  },
  {
    scene: 3,
    example: true,
    media: { kind: 'audio', file: 'example-3', language: 'en' },
    person: {
      name: 'Firstname Lastname',
      jobTitle: 'Senior Recruiter',
      company: 'IT consulting firm',
      field: 'Recruitment',
      photo: 'example-3-photo.jpg',
      linkedin: 'https://www.linkedin.com/in/firstname-lastname',
    },
  },
  {
    scene: 4,
    example: true,
    media: { kind: 'video', file: 'example-4', orientation: 'portrait', language: 'en' },
    person: {
      name: 'Firstname Lastname',
      jobTitle: 'SOC Analyst',
      company: 'Cybersecurity company',
      field: 'Cybersecurity',
      photo: 'example-4-photo.jpg',
      linkedin: 'https://www.linkedin.com/in/firstname-lastname',
    },
  },
  {
    scene: 5,
    example: true,
    // The "job title only" case: no name, no photo, no LinkedIn.
    media: { kind: 'audio', file: 'example-5', language: 'fr' },
    person: {
      name: null,
      jobTitle: 'Professor and jury member',
      company: 'Engineering school',
      field: 'Academia',
      photo: null,
      linkedin: null,
    },
  },
  {
    scene: 6,
    example: true,
    media: { kind: 'video', file: 'example-6', orientation: 'landscape', language: 'en' },
    person: {
      name: 'Firstname Lastname',
      jobTitle: 'IT Manager',
      company: 'Bank',
      field: 'Management',
      photo: 'example-6-photo.jpg',
      linkedin: 'https://www.linkedin.com/in/firstname-lastname',
    },
  },
  {
    scene: 7,
    example: true,
    media: { kind: 'video', file: 'example-7', orientation: 'portrait', language: 'fr' },
    person: {
      name: 'Firstname Lastname',
      jobTitle: 'HR Director',
      company: 'Industrial group',
      field: 'Human Resources',
      photo: 'example-7-photo.jpg',
      linkedin: 'https://www.linkedin.com/in/firstname-lastname',
    },
  },
]

const subtitleFiles = import.meta.glob<string>('../subtitles/*.vtt', { query: '?raw', import: 'default', eager: true })
const waveformFiles = import.meta.glob<number[]>('./waveforms/*.json', { import: 'default', eager: true })

/** The subtitles of a clip (empty when the file is missing: the clip still plays). */
export function subtitlesFor(file: string): string {
  return subtitleFiles[`../subtitles/${file}.vtt`] ?? ''
}

/** The loudness envelope of a voice note, 30 values a second (empty when missing: the ring then breathes gently). */
export function waveformFor(file: string): number[] {
  return waveformFiles[`./waveforms/${file}.json`] ?? []
}
