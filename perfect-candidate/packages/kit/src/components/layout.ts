import type { SpaceToken } from '../tokens/space'
import type { FullBleedHandle, Ground, Handle, SplitHandle } from './types'

function div(doc: Document, className: string): HTMLElement {
  const el = doc.createElement('div')
  el.className = className
  return el
}

export function split(parent: HTMLElement, opts: { ratio?: number; gap?: SpaceToken } = {}): SplitHandle {
  const ratio = opts.ratio ?? 0.5
  const gap = opts.gap ?? 8
  const doc = parent.ownerDocument
  const el = div(doc, 'safe layout-split')
  el.style.gridTemplateColumns = `${ratio}fr ${+(1 - ratio).toFixed(4)}fr`
  el.style.columnGap = `var(--space-${gap})`
  const left = div(doc, 'layout-split-left')
  const right = div(doc, 'layout-split-right')
  el.append(left, right)
  parent.appendChild(el)
  return { el, left, right }
}

export function center(parent: HTMLElement): Handle {
  const el = div(parent.ownerDocument, 'safe layout-center')
  parent.appendChild(el)
  return { el }
}

const GROUNDS: readonly Ground[] = ['bg', 'surface', 'accent', 'deep', 'gradient']
const GROUND_CONTEXT: Partial<Record<Ground, string>> = { accent: 'on-accent', deep: 'on-dark', gradient: 'on-dark' }

/**
 * A ground that covers the whole stage, with a `.safe` content region inside. The accent ground is marked
 * `on-accent`, the deep and gradient grounds `on-dark`; those three set kraft text so descendants restyle.
 */
export function fullBleed(parent: HTMLElement, opts: { ground: Ground }): FullBleedHandle {
  const { ground } = opts
  if (!GROUNDS.includes(ground)) throw new RangeError(`fullBleed: ground "${ground}" must be one of ${GROUNDS.join(', ')}`)
  const doc = parent.ownerDocument
  const context = GROUND_CONTEXT[ground]
  const el = div(doc, `layout-fullbleed ground-${ground}${context ? ` ${context}` : ''}`)
  const content = div(doc, 'safe layout-fullbleed-content')
  el.appendChild(content)
  parent.appendChild(el)
  return { el, content, ground }
}
