/** One subtitle: shown from `start` to `end`, in seconds of the clip. */
export interface Cue {
  start: number
  end: number
  text: string
}

const TIME = /(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})/

function seconds(stamp: string): number {
  const m = TIME.exec(stamp)
  if (!m) return NaN
  const [, h, mm, ss, ms] = m
  return Number(h ?? 0) * 3600 + Number(mm) * 60 + Number(ss) + Number(ms!.padEnd(3, '0')) / 1000
}

/**
 * Parse WebVTT (or SRT, which differs only by its comma and missing header) into cues sorted by start. Identifiers,
 * notes, styles and cue settings are skipped; inline tags (<i>, <b>, <v Name>) are removed; line breaks inside a cue
 * are kept as spaces, because the screen balances the lines itself.
 */
export function parseVtt(source: string): Cue[] {
  const blocks = source.replace(/\r\n?/g, '\n').replace(/^﻿/, '').split(/\n{2,}/)
  const cues: Cue[] = []
  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.trim() !== '')
    const at = lines.findIndex((l) => l.includes('-->'))
    if (at < 0) continue
    const [a, b] = lines[at]!.split('-->')
    const start = seconds(a!)
    const end = seconds(b!)
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue
    const text = lines
      .slice(at + 1)
      .join(' ')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (text) cues.push({ start, end, text })
  }
  return cues.sort((x, y) => x.start - y.start)
}

/** The cue on screen at time `t`, or null between cues. */
export function cueAt(cues: Cue[], t: number): Cue | null {
  for (const c of cues) {
    if (t < c.start) return null
    if (t < c.end) return c
  }
  return null
}
