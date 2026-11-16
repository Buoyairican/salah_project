import type { gsap } from 'gsap'

/** Create an element with a class, appended to `parent`. */
export function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, parent?: HTMLElement): HTMLElementTagNameMap[K] {
  const doc = parent?.ownerDocument ?? document
  const node = doc.createElement(tag)
  if (className) node.className = className
  parent?.appendChild(node)
  return node
}

/** Wrap each word of `text` in a masked span, for word-by-word rises. Returns the inner spans. */
export function maskedWords(parent: HTMLElement, text: string): HTMLElement[] {
  parent.textContent = ''
  const words = text.split(/\s+/).filter(Boolean)
  return words.map((w, i) => {
    const outer = el('span', 'mask', parent)
    outer.style.display = 'inline-block'
    outer.style.verticalAlign = 'top'
    const inner = el('span', '', outer)
    inner.textContent = w
    if (i < words.length - 1) parent.appendChild(parent.ownerDocument.createTextNode(' '))
    return inner
  })
}

/** A signal that aborts when any of `signals` does (AbortSignal.any, for older browsers too). */
export function anySignal(...signals: AbortSignal[]): AbortSignal {
  const ctl = new AbortController()
  for (const s of signals) {
    if (s.aborted) {
      ctl.abort()
      break
    }
    s.addEventListener('abort', () => ctl.abort(), { once: true })
  }
  return ctl.signal
}

/** Abortable wait. Resolves false when aborted. */
export function wait(seconds: number, signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve(false)
    const id = setTimeout(() => resolve(true), seconds * 1000)
    signal.addEventListener('abort', () => {
      clearTimeout(id)
      resolve(false)
    }, { once: true })
  })
}

/** Play a GSAP timeline to its end, or kill it when aborted. Resolves false when aborted. */
export function run(tl: gsap.core.Timeline, signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      tl.kill()
      return resolve(false)
    }
    tl.eventCallback('onComplete', () => resolve(true))
    signal.addEventListener('abort', () => {
      tl.kill()
      resolve(false)
    }, { once: true })
    tl.play()
  })
}
