import serif from '@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2?url'
import serifItalic from '@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2?url'
import inter from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url'
import mono from '@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2?url'

/**
 * The three faces, registered with the Font Loading API so the offline build can inline them (no network, no
 * server). Instrument Serif for titles and lessons, Inter for everything read at a glance, JetBrains Mono for
 * numbers, scene counters and the clock.
 */
const faces: Array<[string, string, FontFaceDescriptors]> = [
  ['Instrument Serif', serif, { style: 'normal', weight: '400' }],
  ['Instrument Serif', serifItalic, { style: 'italic', weight: '400' }],
  ['Inter Variable', inter, { style: 'normal', weight: '100 900' }],
  ['JetBrains Mono Variable', mono, { style: 'normal', weight: '100 800' }],
]

export function registerFonts(doc: Document = document): Promise<unknown> {
  const loads = faces.map(([family, url, desc]) => {
    const face = new FontFace(family, `url(${url}) format('woff2')`, desc)
    doc.fonts.add(face)
    return face.load().catch(() => undefined)
  })
  return Promise.all(loads)
}
