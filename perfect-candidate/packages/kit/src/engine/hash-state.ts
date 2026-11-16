import type { DeckPosition } from './position'

const HASH = /^#\/(\d+)\/(\d+)$/

export function parseHash(hash: string): DeckPosition | null {
  const m = HASH.exec(hash)
  if (!m) return null
  const slide1 = Number(m[1])
  const step = Number(m[2])
  if (slide1 < 1) return null
  return { slide: slide1 - 1, step }
}

export function formatHash(pos: DeckPosition): string {
  return `#/${pos.slide + 1}/${pos.step}`
}

export function readHash(win: Window = window): DeckPosition | null {
  return parseHash(win.location.hash)
}

export function writeHash(pos: DeckPosition, win: Window = window): void {
  const next = formatHash(pos)
  if (win.location.hash === next) return
  win.history.replaceState(null, '', next)
}
