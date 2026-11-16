import type { Handle } from './types'

/** The dashed pill. Shared by `badge`, `statement` and `heatmap`, which keeps its own `hm-badge` div. */
export function createBadge(doc: Document, content: string, className = 'badge', tag = 'span'): HTMLElement {
  const el = doc.createElement(tag)
  el.className = className
  el.textContent = content
  return el
}

export function badge(parent: HTMLElement, content: string): Handle {
  const el = createBadge(parent.ownerDocument, content)
  parent.appendChild(el)
  return { el }
}
