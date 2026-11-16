import { pin } from './pin'
import type { Corner, Handle } from './types'

const FOOTER_CORNERS: readonly Corner[] = ['bottom-left', 'bottom-right']

/** A muted caption pinned to the bottom of the safe area, left by default. */
export function footer(parent: HTMLElement, content: string, opts: { corner?: 'bottom-left' | 'bottom-right' } = {}): Handle {
  const el = parent.ownerDocument.createElement('p')
  el.className = 'footer type-caption text-muted'
  el.textContent = content
  pin(el, opts.corner ?? 'bottom-left', FOOTER_CORNERS)
  parent.appendChild(el)
  return { el }
}
