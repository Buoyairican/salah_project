import { gsap } from 'gsap'
import { eases, resolveDuration } from '../tokens/motion'
import { EMPTY_VALUE, formatValue } from '../components/statement'
import type { StatementHandle } from '../components/types'
import type { CountOpts, MotionContext } from './types'

/** Counters are linear by design (spec 5.4): the one place a linear ease is allowed. */
const COUNT_EASE = 'none'

/**
 * Count the statement's value from `from` to `to`, writing whole numbers with the unit. At the very start
 * (progress 0, including when scrubbed back) the value shows the dash again.
 */
export function count(ctx: MotionContext, tl: gsap.core.Timeline, statement: StatementHandle, from: number, to: number, opts: CountOpts = {}): gsap.core.Timeline {
  if (!Number.isFinite(from) || !Number.isFinite(to)) throw new RangeError(`count: from ${from} and to ${to} must be finite numbers`)
  const duration = resolveDuration(opts.duration ?? 'l', ctx)
  const ease = opts.ease ? eases[opts.ease] : COUNT_EASE
  const unit = opts.unit ?? statement.unit
  const counter = { v: from }
  const child = gsap.timeline()
  const tween = gsap.to(counter, {
    v: to,
    duration,
    ease,
    onUpdate() {
      statement.value.textContent = tween.progress() > 0 ? formatValue(Math.round(counter.v), unit) : EMPTY_VALUE
    },
  })
  child.add(tween, 0)
  tl.add(child, opts.at)
  return child
}
