import type { Handle, RuleColor } from './types'

const COLORS: readonly RuleColor[] = ['highlight', 'accent', 'line']

/** A short 4 px bar, 96 px wide, growing from the left: reveal it with `wipe`. */
export function rule(parent: HTMLElement, opts: { color?: RuleColor } = {}): Handle {
  const color = opts.color ?? 'highlight'
  if (!COLORS.includes(color)) throw new RangeError(`rule: color "${color}" must be one of ${COLORS.join(', ')}`)
  const el = parent.ownerDocument.createElement('div')
  el.className = `rule rule--${color}`
  el.setAttribute('aria-hidden', 'true')
  parent.appendChild(el)
  return { el }
}
