import type { gsap } from 'gsap'

export class LabelError extends Error {
  constructor(public readonly slideId: string, message: string) {
    super(`slide "${slideId}": ${message}`)
    this.name = 'LabelError'
  }
}

const STEP = /^step-(\d+)$/

export function stepLabels(tl: gsap.core.Timeline, slideId: string): string[] {
  const entries = Object.entries(tl.labels)
    .map(([name, time]) => ({ name, time, m: STEP.exec(name) }))
    .filter((e) => e.m !== null)
    .map((e) => ({ name: e.name, time: e.time, index: Number(e.m![1]) }))
    .sort((a, b) => a.index - b.index)

  if (entries.length === 0 || entries[0]!.index !== 0) {
    throw new LabelError(slideId, 'missing label "step-0"')
  }
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!
    if (e.index !== i) throw new LabelError(slideId, `missing label "step-${i}" (found "${e.name}")`)
    const prev = entries[i - 1]
    if (prev && e.time < prev.time) {
      throw new LabelError(slideId, `label "${e.name}" (${e.time}s) is before "${prev.name}" (${prev.time}s)`)
    }
  }
  return entries.map((e) => e.name)
}

export function stepTimes(tl: gsap.core.Timeline, slideId: string): number[] {
  return stepLabels(tl, slideId).map((name) => tl.labels[name]!)
}

export function hasExit(tl: gsap.core.Timeline): boolean {
  return Object.prototype.hasOwnProperty.call(tl.labels, 'exit')
}

/** Seek with a forced redraw: GSAP skips rendering when asked for the time it is already at. */
export function seekExact(tl: gsap.core.Timeline, time: number): void {
  tl.pause()
  const d = tl.duration()
  const nudge = time + 0.001 <= d ? time + 0.001 : Math.max(0, time - 0.001)
  tl.totalTime(nudge, false)
  tl.totalTime(time, false)
}
