import type { gsap } from 'gsap'
import type { DurationToken, EaseToken, StaggerToken, TimingContext } from '../tokens/motion'
import type { Handle, HeatmapHandle, StatementHandle, TextHandle } from '../components/types'

/**
 * `lines` and `words` rise through masks (text handles only), `fade-up` rises and fades, `wipe` grows scaleX from
 * the left, `scale-in` grows from 0.6 on the brand emphasis ease, `soft` sharpens from a blur with a 0.98 settle.
 */
export type RevealVariant = 'lines' | 'words' | 'fade-up' | 'wipe' | 'scale-in' | 'soft'

/** What `reveal` and `exit` animate: a handle, an element, or several staggered together. */
export type RevealTarget = Handle | TextHandle | Element | Array<Handle | Element>

export interface MotionOpts {
  at?: gsap.Position
  duration?: DurationToken
  stagger?: StaggerToken
  ease?: EaseToken
}

export interface HeatOpts extends MotionOpts {
  /** 0..1. Fill each cell with its risk colour at this alpha and colour its top edge opaque; text stays as styled. */
  alpha?: number
}

export interface CountOpts extends MotionOpts {
  /** Appended after the number. Defaults to the statement's unit. */
  unit?: string
}

/** What `focus` spotlights: one element or handle, or several that share the spotlight. */
export type FocusTarget = Handle | HTMLElement | Array<Handle | HTMLElement>

/**
 * Ambient loops, for a slide that is held on screen. `float` bobs ± amplitude px vertically with a ± 0.4° tilt,
 * `breathe` scales 1 → 1 + amplitude, `drift` wanders through 3–4 seeded waypoints within ± amplitude px on both
 * axes, `pulse` swings opacity 1 → 1 − amplitude, `sweep` passes a soft white band across the target once per period.
 */
export type AmbientVariant = 'float' | 'breathe' | 'drift' | 'pulse' | 'sweep'

export interface AmbientOptions {
  /** px for float and drift (8, 80), a ratio for breathe (0.02), the opacity swing for pulse (0.25). Unused by sweep. */
  amplitude?: number
  /** Seconds for one full cycle. Defaults: float 7, breathe 6, drift 24, pulse 5, sweep 9. */
  period?: number
  /** An integer. Drift's waypoints and float's phase derive from it; each target adds its own offset. Default 1. */
  seed?: number
  /** Seconds between the starts of successive targets. Default period / number of targets. */
  stagger?: number
}

/** What `ambient` animates: a handle, an element, or several (each starts `stagger` seconds after the previous). */
export type AmbientTarget = Handle | HTMLElement | Array<Handle | HTMLElement>

export interface MotionContext extends TimingContext {
  risk: string[]
  emphasisEase: string
  /** Receives every ambient loop the slide creates; the deck plays them while the slide is on screen. */
  registerAmbient?: (tl: gsap.core.Timeline) => void
}

export interface Motion {
  reveal(tl: gsap.core.Timeline, target: RevealTarget, variant: RevealVariant, opts?: MotionOpts): gsap.core.Timeline
  exit(tl: gsap.core.Timeline, target: RevealTarget, variant: RevealVariant, opts?: MotionOpts): gsap.core.Timeline
  focus(tl: gsap.core.Timeline, handle: FocusTarget, others: Array<Handle | HTMLElement>, opts?: MotionOpts): gsap.core.Timeline
  heat(tl: gsap.core.Timeline, heatmap: HeatmapHandle, values: number[], opts?: HeatOpts): gsap.core.Timeline
  count(tl: gsap.core.Timeline, statement: StatementHandle, from: number, to: number, opts?: CountOpts): gsap.core.Timeline
  draw(tl: gsap.core.Timeline, path: SVGGeometryElement, opts?: MotionOpts): gsap.core.Timeline
  /**
   * A looping timeline of its own, outside the step timeline: paused, handed to the deck, which plays it while the
   * slide is on screen and holds it at its start (every target at rest) otherwise, in QA mode and in reduced mode.
   * It writes the CSS `translate`, `scale` and `rotate` properties, which compose with the `transform` that reveals,
   * focus and exits animate, so a target may be both revealed and floated. `pulse` writes `opacity`: use it only on
   * elements no step tween touches (a glow that is on screen from the start). Reduced mode returns an empty timeline.
   */
  ambient(target: AmbientTarget, variant: AmbientVariant, opts?: AmbientOptions): gsap.core.Timeline
}
