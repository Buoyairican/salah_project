import { gsap } from 'gsap'
import { eases, EXIT_RATIO, resolveDuration, resolveStagger, type DurationToken } from '../tokens/motion'
import { space } from '../tokens/space'
import type { Handle, TextHandle } from '../components/types'
import type { MotionContext, MotionOpts, RevealTarget, RevealVariant } from './types'

const DEFAULT_DURATION: Record<RevealVariant, DurationToken> = { lines: 'm', words: 'm', 'fade-up': 'm', wipe: 'm', 'scale-in': 'm', soft: 'l' }
const SCALE_IN_FROM = 0.6
const SOFT_SCALE = 0.98
const SOFT_BLUR = 'blur(16px)'
const SHARP = 'blur(0px)'
const LEFT = '0% 50%'
const RIGHT = '100% 50%'
const CENTRE = '50% 50%'

function isText(h: RevealTarget): h is TextHandle {
  return Array.isArray((h as TextHandle).words) && Array.isArray((h as TextHandle).lines)
}

const toEl = (h: Handle | Element): Element => (h instanceof Element ? h : h.el)

/** Targets and the variant that applies: `lines` and `words` need a text handle, anything else falls back to fade-up. */
function pick(target: RevealTarget, variant: RevealVariant): { targets: Element[]; variant: RevealVariant } {
  const textVariant = variant === 'lines' || variant === 'words'
  if (Array.isArray(target)) return { targets: target.map(toEl), variant: textVariant ? 'fade-up' : variant }
  if (target instanceof Element) return { targets: [target], variant: textVariant ? 'fade-up' : variant }
  if (variant === 'lines' && isText(target) && target.lines.length) return { targets: target.lines, variant }
  if (variant === 'words' && isText(target) && target.words.length) return { targets: target.words, variant }
  return { targets: [target.el], variant: textVariant ? 'fade-up' : variant }
}

export function reveal(ctx: MotionContext, tl: gsap.core.Timeline, target: RevealTarget, variant: RevealVariant, opts: MotionOpts = {}): gsap.core.Timeline {
  const { targets, variant: v } = pick(target, variant)
  const duration = resolveDuration(opts.duration ?? DEFAULT_DURATION[v], ctx)
  const ease = eases[opts.ease ?? 'enter']
  const stagger = resolveStagger(opts.stagger ?? (v === 'words' ? 'tight' : 'normal'), ctx)
  const child = gsap.timeline()

  if (ctx.reduced) {
    child.from(targets, { opacity: 0, duration, ease: eases.soft })
  } else if (v === 'lines') {
    child.from(targets, { yPercent: 105, duration, ease, stagger })
  } else if (v === 'words') {
    child.from(targets, { yPercent: 105, opacity: 0, rotation: 2, transformOrigin: '0% 100%', duration, ease, stagger })
  } else if (v === 'wipe') {
    // fromTo keeps the origin on the left for the whole tween instead of easing it back to the centre.
    child.fromTo(targets, { scaleX: 0, transformOrigin: LEFT }, { scaleX: 1, transformOrigin: LEFT, duration, ease, stagger })
  } else if (v === 'scale-in') {
    const emphasis = opts.ease ? eases[opts.ease] : ctx.emphasisEase
    child.from(targets, { scale: SCALE_IN_FROM, opacity: 0, transformOrigin: CENTRE, duration, ease: emphasis, stagger })
  } else if (v === 'soft') {
    // Opacity and scale end at their styled values; the filter needs explicit ends, as its computed "none" does not tween.
    child.from(targets, { opacity: 0, scale: SOFT_SCALE, transformOrigin: CENTRE, duration, ease, stagger }, 0)
    child.fromTo(targets, { filter: SOFT_BLUR }, { filter: SHARP, duration, ease, stagger }, 0)
  } else {
    child.from(targets, { y: space[3], opacity: 0, duration, ease, stagger })
  }

  tl.add(child, opts.at)
  return child
}

export function exit(ctx: MotionContext, tl: gsap.core.Timeline, target: RevealTarget, variant: RevealVariant, opts: MotionOpts = {}): gsap.core.Timeline {
  const { targets, variant: v } = pick(target, variant)
  const duration = resolveDuration(opts.duration ?? DEFAULT_DURATION[v], ctx) * EXIT_RATIO
  const ease = eases[opts.ease ?? 'exit']
  const stagger = resolveStagger(opts.stagger ?? (v === 'words' ? 'tight' : 'normal'), ctx)
  const child = gsap.timeline()

  if (ctx.reduced) {
    child.to(targets, { opacity: 0, duration, ease: eases.soft })
  } else if (v === 'lines') {
    child.to(targets, { yPercent: -105, duration, ease, stagger })
  } else if (v === 'words') {
    child.to(targets, { yPercent: -105, opacity: 0, duration, ease, stagger })
  } else if (v === 'wipe') {
    child.fromTo(targets, { scaleX: 1, transformOrigin: RIGHT }, { scaleX: 0, transformOrigin: RIGHT, duration, ease, stagger, immediateRender: false })
  } else if (v === 'scale-in') {
    child.to(targets, { scale: SCALE_IN_FROM, opacity: 0, transformOrigin: CENTRE, duration, ease, stagger })
  } else if (v === 'soft') {
    child.to(targets, { opacity: 0, scale: SOFT_SCALE, transformOrigin: CENTRE, duration, ease, stagger }, 0)
    child.fromTo(targets, { filter: SHARP }, { filter: SOFT_BLUR, duration, ease, stagger, immediateRender: false }, 0)
  } else {
    child.to(targets, { y: -space[3], opacity: 0, duration, ease, stagger })
  }

  tl.add(child, opts.at)
  return child
}
