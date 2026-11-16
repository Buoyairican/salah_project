import { gsap } from 'gsap'
import { eases, resolveDuration, resolveStagger } from '../tokens/motion'
import { riskColor } from '../components/heatmap'
import type { HeatmapHandle } from '../components/types'
import type { HeatOpts, MotionContext } from './types'

const DARK_TEXT_THRESHOLD = 0.4
const EMPTY = '–'

/**
 * Colour each cell through the risk scale and count its value. With `alpha` (glass heatmaps) the fill is the risk
 * colour at that alpha with an opaque top edge, and the on-dark text class is never toggled: the text keeps the
 * colour the heatmap style gives it.
 */
export function heat(ctx: MotionContext, tl: gsap.core.Timeline, heatmap: HeatmapHandle, values: number[], opts: HeatOpts = {}): gsap.core.Timeline {
  if (values.length !== heatmap.cells.length) {
    throw new RangeError(`heat: ${values.length} values for ${heatmap.cells.length} cells`)
  }
  const { alpha } = opts
  if (alpha !== undefined && !(alpha >= 0 && alpha <= 1)) throw new RangeError(`heat: alpha ${alpha} must be within 0..1`)
  const duration = resolveDuration(opts.duration ?? 'l', ctx)
  const stagger = resolveStagger(opts.stagger ?? 'normal', ctx)
  const child = gsap.timeline()

  heatmap.cells.forEach((cell, i) => {
    const target = riskColor(ctx.risk, values[i]!)
    const at = i * stagger
    const percent = Math.round(Math.min(1, Math.max(0, values[i]!)) * 100)
    const counter = { v: 0 }
    const valueEl = heatmap.values[i]!

    const dark = alpha === undefined && target.luminance < DARK_TEXT_THRESHOLD
    if (alpha === undefined) {
      child.to(cell, { backgroundColor: target.css, duration, ease: eases.soft }, at)
    } else {
      const [r, g, b] = target.rgb
      child.to(cell, { backgroundColor: `rgba(${r}, ${g}, ${b}, ${alpha})`, borderTopColor: target.css, duration, ease: eases.soft }, at)
    }
    // GSAP 3 has no className tweens, so the class is toggled from the counter's own render.
    const count = gsap.to(counter, {
      v: percent,
      duration,
      ease: eases.soft,
      onUpdate() {
        const started = count.progress() > 0
        valueEl.textContent = started ? `${Math.round(counter.v)} %` : EMPTY
        if (alpha === undefined) cell.classList.toggle('hm-cell--on-dark', dark && started)
      },
    })
    child.add(count, at)
  })

  tl.add(child, opts.at)
  return child
}
