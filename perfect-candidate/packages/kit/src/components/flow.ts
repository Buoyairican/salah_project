import type { FlowHandle, FlowOptions, FlowStep } from './types'

const STYLES: readonly NonNullable<FlowOptions['style']>[] = ['card', 'plain']
const GROUNDS: readonly NonNullable<FlowStep['ground']>[] = ['surface', 'accent']

/** A row of numbered steps: each has a chip with its number, a label and an optional tag pill. */
export function flow(parent: HTMLElement, opts: FlowOptions): FlowHandle {
  const style = opts.style ?? 'card'
  if (!STYLES.includes(style)) throw new RangeError(`flow: style "${style}" must be one of ${STYLES.join(', ')}`)
  if (!opts.steps.length) throw new RangeError('flow: needs at least one step')
  const doc = parent.ownerDocument
  const mk = (cls: string, tag = 'div') => {
    const el = doc.createElement(tag)
    el.className = cls
    return el
  }

  const el = mk(`flow flow--${style}`)
  const steps: HTMLElement[] = []
  const chips: HTMLElement[] = []
  const labels: HTMLElement[] = []
  const tags: (HTMLElement | null)[] = []
  for (const s of opts.steps) {
    const ground = s.ground ?? 'surface'
    if (!GROUNDS.includes(ground)) throw new RangeError(`flow: step "${s.n}" ground "${ground}" must be one of ${GROUNDS.join(', ')}`)
    const step = mk(ground === 'accent' ? 'flow-step flow-step--accent' : 'flow-step')
    const head = mk('flow-step-head')
    const chip = mk('flow-chip', 'span')
    chip.textContent = s.n
    head.appendChild(chip)
    let tag: HTMLElement | null = null
    if (s.tag) {
      tag = mk('flow-tag', 'span')
      tag.textContent = s.tag
      head.appendChild(tag)
    }
    const label = mk('flow-label', 'p')
    label.textContent = s.label
    step.append(head, label)
    el.appendChild(step)
    steps.push(step)
    chips.push(chip)
    labels.push(label)
    tags.push(tag)
  }
  parent.appendChild(el)

  return {
    el,
    steps,
    chips,
    labels,
    tags,
    step(i: number) {
      const s = steps[i]
      if (!s) throw new RangeError(`flow: no step ${i} (have 0..${steps.length - 1})`)
      return s
    },
  }
}
