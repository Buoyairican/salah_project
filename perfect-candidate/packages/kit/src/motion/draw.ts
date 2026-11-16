import { gsap } from 'gsap'
import { eases, resolveDuration } from '../tokens/motion'
import type { MotionContext, MotionOpts } from './types'

/**
 * Draw an SVG path on from its start. The dash maths runs on the path's `pathLength` (set to 1 when absent), so
 * it needs no layout. The dash period is three lengths long, so the hidden state leaves no cap at the far end.
 * Reduced mode fades the whole path in instead.
 */
export function draw(ctx: MotionContext, tl: gsap.core.Timeline, path: SVGGeometryElement, opts: MotionOpts = {}): gsap.core.Timeline {
  const duration = resolveDuration(opts.duration ?? 'l', ctx)
  const child = gsap.timeline()
  if (ctx.reduced) {
    child.from(path, { opacity: 0, duration, ease: eases.soft })
  } else {
    let length = Number(path.getAttribute('pathLength'))
    if (!(length > 0)) {
      length = 1
      path.setAttribute('pathLength', '1')
    }
    path.setAttribute('stroke-dasharray', `${length} ${length * 2}`)
    child.fromTo(
      path,
      { attr: { 'stroke-dashoffset': length } },
      { attr: { 'stroke-dashoffset': 0 }, duration, ease: eases[opts.ease ?? 'enter'] },
    )
  }
  tl.add(child, opts.at)
  return child
}
