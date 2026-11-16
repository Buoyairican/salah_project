import { text } from './text'
import { createBadge } from './badge'
import { stringsFor } from './strings'
import type { ComponentsOptions, StatementHandle, StatementOptions } from './types'

/** What the value shows before `count` writes a number, and again when scrubbed back to the start. */
export const EMPTY_VALUE = '–'

/** The statement's number with its unit, as `statement` reserves it and `count` writes it. */
export function formatValue(n: number, unit: string | null | undefined): string {
  return unit ? `${n} ${unit}` : `${n}`
}

/**
 * One large number with a caption. The number starts as a dash; `count` writes it. The box reserves the
 * width of the final value (drawn invisibly by `::before` from `data-ghost`), so nothing shifts while counting.
 */
export function statement(parent: HTMLElement, opts: StatementOptions, ctx: ComponentsOptions): StatementHandle {
  if (!Number.isFinite(opts.value)) throw new RangeError(`statement: value ${opts.value} must be a finite number`)
  const doc = parent.ownerDocument
  const unit = opts.unit ? opts.unit : null

  const el = doc.createElement('div')
  el.className = 'statement'
  parent.appendChild(el)

  const box = doc.createElement('p')
  box.className = 'type-display-1 statement-value'
  box.dataset.ghost = formatValue(opts.value, unit)
  const value = doc.createElement('span')
  value.className = 'statement-value-live'
  value.textContent = EMPTY_VALUE
  box.appendChild(value)
  el.appendChild(box)

  const caption = text(el, opts.caption, { size: 'body', muted: true })

  let badge: HTMLElement | null = null
  if (opts.illustrative) {
    badge = createBadge(doc, stringsFor(ctx.language).badge)
    el.appendChild(badge)
  }
  return { el, value, caption, badge, unit }
}
