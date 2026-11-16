import { gsap } from 'gsap'
import { eases, resolveDuration } from '../tokens/motion'
import type { Handle } from '../components/types'
import type { FocusTarget, MotionContext, MotionOpts } from './types'

const DIM_OPACITY = 0.25
const DIM_FILTER = 'saturate(0.3)'
const FOCUS_SCALE = 1.06
/** Set on every dimmed element while dimmed, so components can restyle it (dimmed heatmap cells drop on-dark text). */
export const DIMMED_CLASS = 'is-dimmed'

/** Elements that must stay legible whatever is focused (the illustrative badges, spec section 11). */
const KEEP_VISIBLE = ['hm-badge', 'badge']

const toEl = (h: Handle | HTMLElement): HTMLElement => (h instanceof Element ? h : h.el)

/**
 * Elements to dim. An "other" that is a target is skipped. An "other" that contains no target is
 * dimmed whole. An "other" that contains targets is walked from each target up to that other, and
 * every sibling met on the way is dimmed unless it is or contains a target, so the targets'
 * ancestors stay untouched and every target keeps full opacity.
 */
function dimTargets(targets: HTMLElement[], others: Array<Handle | HTMLElement>): Element[] {
  const out = new Set<Element>()
  const holdsTarget = (el: Element) => targets.some((t) => el === t || el.contains(t))
  for (const o of others) {
    const el = toEl(o)
    if (targets.includes(el)) continue
    if (!holdsTarget(el)) {
      out.add(el)
      continue
    }
    for (const target of targets) {
      if (!el.contains(target)) continue
      let node: Element = target
      while (node !== el && node.parentElement) {
        const parent: Element = node.parentElement
        for (const sib of Array.from(parent.children)) {
          if (!holdsTarget(sib) && !KEEP_VISIBLE.some((c) => sib.classList.contains(c))) out.add(sib)
        }
        node = parent
      }
    }
  }
  return Array.from(out)
}

export function focus(
  ctx: MotionContext,
  tl: gsap.core.Timeline,
  handle: FocusTarget,
  others: Array<Handle | HTMLElement>,
  opts: MotionOpts = {},
): gsap.core.Timeline {
  const targets = (Array.isArray(handle) ? handle : [handle]).map(toEl)
  const duration = resolveDuration(opts.duration ?? 'm', ctx)
  const child = gsap.timeline()
  const dims = dimTargets(targets, others)
  if (dims.length) {
    // The computed filter is "none", which GSAP would read as saturate(0); start from saturate(1) explicitly.
    const dim = gsap.fromTo(
      dims,
      { filter: 'saturate(1)' },
      {
        opacity: DIM_OPACITY,
        filter: DIM_FILTER,
        duration,
        ease: eases.soft,
        immediateRender: false,
        // GSAP 3 has no className tweens, so the class follows the tween's own render and seeks reverse it.
        onUpdate() {
          const on = dim.progress() > 0
          for (const el of dims) el.classList.toggle(DIMMED_CLASS, on)
        },
      },
    )
    child.add(dim, 0)
  }
  if (!ctx.reduced) {
    child.to(targets, { scale: FOCUS_SCALE, transformOrigin: 'center center', duration, ease: ctx.emphasisEase }, 0)
  }
  tl.add(child, opts.at)
  return child
}
