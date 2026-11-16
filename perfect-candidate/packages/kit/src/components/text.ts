import { SplitText } from 'gsap/SplitText'
import type { TypeLevel } from '../tokens/type'
import type { TextHandle } from './types'

/**
 * Splits into masked lines and word boxes. Only ordinary white space separates words: no-break spaces
 * (U+00A0, U+202F, as French typography puts in « 40 % » or « pourquoi ? ») stay inside their word box,
 * so a line never breaks there. GSAP's default `reduceWhiteSpace` treats them as word gaps, so the kit
 * collapses ordinary white space itself, as the browser would, and turns that option off.
 */
function splitInto(el: HTMLElement, level: TypeLevel): TextHandle {
  el.textContent = (el.textContent ?? '').replace(/[ \t\n\r\f]+/g, ' ')
  const split = SplitText.create(el, {
    type: 'lines,words',
    linesClass: 'line',
    wordsClass: 'word',
    mask: 'lines',
    autoSplit: false,
    reduceWhiteSpace: false,
  })
  return { el, lines: split.lines as HTMLElement[], words: split.words as HTMLElement[], level }
}

export function heading(parent: HTMLElement, content: string, opts: { level?: TypeLevel } = {}): TextHandle {
  const level = opts.level ?? 'h1'
  const tag = level === 'h2' || level === 'h3' ? level : 'h1'
  const el = parent.ownerDocument.createElement(tag)
  el.className = `type-${level}`
  el.textContent = content
  parent.appendChild(el)
  return splitInto(el, level)
}

export function text(parent: HTMLElement, content: string, opts: { size?: 'body' | 'caption'; muted?: boolean } = {}): TextHandle {
  const size = opts.size ?? 'body'
  const el = parent.ownerDocument.createElement('p')
  el.className = `type-${size}${opts.muted ? ' text-muted' : ''}`
  el.textContent = content
  parent.appendChild(el)
  return splitInto(el, size)
}

/** A small uppercase label above a title. Its colours follow the ground (see `.on-accent` and `.on-dark`). */
export function eyebrow(parent: HTMLElement, content: string): TextHandle {
  const el = parent.ownerDocument.createElement('p')
  el.className = 'eyebrow'
  el.textContent = content
  parent.appendChild(el)
  return splitInto(el, 'caption')
}
