import { gsap } from 'gsap'
import type { EnterDirection } from '@deck/kit'
import type { How } from '../src/world/world'

/** The scale of the stage on screen, read from a slide (1 when the window is exactly 1920 wide). */
export function stageScale(slide: HTMLElement): number {
  return slide.getBoundingClientRect().width / 1920 || 1
}

/** How the world should reach a slide's state, from how the slide was reached. */
export function howFrom(direction: EnterDirection): How {
  return direction === 'forward' ? 'animate' : direction === 'backward' ? 'soft' : 'instant'
}

/** Words rise through their masks, one after another. */
export function rise(tl: gsap.core.Timeline, words: HTMLElement[], at: gsap.Position, opts: { duration?: number; stagger?: number } = {}) {
  tl.fromTo(
    words,
    { yPercent: 115, opacity: 0 },
    { yPercent: 0, opacity: 1, duration: opts.duration ?? 1.2, ease: 'expo.out', stagger: opts.stagger ?? 0.08 },
    at,
  )
}

/** Fade up from a little below. */
export function fadeUp(tl: gsap.core.Timeline, target: gsap.TweenTarget, at: gsap.Position, y = 18, duration = 1) {
  tl.fromTo(target, { opacity: 0, y }, { opacity: 1, y: 0, duration, ease: 'expo.out' }, at)
}
