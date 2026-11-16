import type { DeckPosition } from './position'

export interface KeyboardTarget {
  next(): Promise<void>
  prev(): Promise<void>
  goTo(pos: DeckPosition): Promise<void>
  stepCounts: number[]
  toggleBlack(): void
  isBlack(): boolean
}

const NEXT = new Set(['Enter', ' ', 'ArrowRight', 'PageDown'])
const PREV = new Set(['Backspace', 'ArrowLeft', 'PageUp'])

function toggleFullscreen(win: Window): void {
  const doc = win.document
  if (doc.fullscreenElement) void doc.exitFullscreen?.()
  else void doc.documentElement.requestFullscreen?.()
}

export interface KeyboardOptions {
  win?: Window
  digitTimeoutMs?: number
  /**
   * Milliseconds after an accepted advance during which another advance is ignored, so a clicker's double click
   * or a nervous second press counts once. 0 (the default) accepts every press.
   */
  advanceGuardMs?: number
  /** Swallow F5, which some presentation clickers send and which would reload the deck. Default false. */
  blockReloadKey?: boolean
  /** Clock for the advance guard (tests). Default `performance.now`. */
  now?: () => number
}

export function bindKeyboard(deck: KeyboardTarget, opts: KeyboardOptions = {}): () => void {
  const win = opts.win ?? window
  const digitTimeoutMs = opts.digitTimeoutMs ?? 1500
  const guardMs = opts.advanceGuardMs ?? 0
  const now = opts.now ?? (() => win.performance.now())
  let lastAdvance = -Infinity
  let digits = ''
  let timer: ReturnType<typeof setTimeout> | undefined

  const clearDigits = () => {
    digits = ''
    if (timer) clearTimeout(timer)
    timer = undefined
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    const key = e.key

    if (key === 'F5' && opts.blockReloadKey) {
      e.preventDefault()
      return
    }
    // A key held down repeats; only its first press counts, for moving through the deck.
    if (e.repeat && (NEXT.has(key) || PREV.has(key))) {
      e.preventDefault()
      return
    }

    if (/^\d$/.test(key)) {
      digits += key
      if (timer) clearTimeout(timer)
      timer = setTimeout(clearDigits, digitTimeoutMs)
      e.preventDefault()
      return
    }

    if (key === 'Enter' && digits) {
      const n = Number(digits)
      clearDigits()
      void deck.goTo({ slide: n - 1, step: 0 })
      e.preventDefault()
      return
    }

    // As in Keynote and PowerPoint, an advance key on the black screen only lifts it, so no beat plays unseen.
    if ((NEXT.has(key) || PREV.has(key)) && deck.isBlack()) deck.toggleBlack()
    else if (NEXT.has(key)) {
      const t = now()
      if (t - lastAdvance >= guardMs) {
        lastAdvance = t
        void deck.next()
      }
    }
    else if (PREV.has(key)) void deck.prev()
    else if (key === 'Home') void deck.goTo({ slide: 0, step: 0 })
    else if (key === 'End') {
      const last = deck.stepCounts.length - 1
      void deck.goTo({ slide: last, step: (deck.stepCounts[last] ?? 1) - 1 })
    } else if (key === 'f' || key === 'F') toggleFullscreen(win)
    else if (key === 'b' || key === 'B' || key === '.') deck.toggleBlack()
    else return

    e.preventDefault()
  }

  win.addEventListener('keydown', onKey)
  return () => {
    win.removeEventListener('keydown', onKey)
    clearDigits()
  }
}
