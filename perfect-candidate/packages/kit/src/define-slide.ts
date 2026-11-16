import type { gsap } from 'gsap'
import type { Components } from './components/types'
import type { Motion } from './motion/types'
import type { Tokens } from './tokens'
import type { SlideTempo } from './tokens/motion'

export interface SlideBuildContext {
  /** The slide's own container. It fills the stage. */
  stage: HTMLElement
  /** The slide's paused master timeline. Labels `step-0`..`step-N` are the Enter presses. */
  tl: gsap.core.Timeline
  c: Components
  m: Motion
  t: Tokens
  data: Record<string, unknown>
}

/** How a slide was reached: a forward press, a backward press, or a jump (first load, reload, typed number). */
export type EnterDirection = 'forward' | 'backward' | 'jump'

/**
 * Handed to a slide's `enter` hook, for what a timeline cannot hold: media playback, sounds, waits of unknown
 * length. Everything started here must stop when `signal` aborts (the slide was left, in either direction).
 */
export interface SlideLiveContext {
  direction: EnterDirection
  /** Aborted the moment the slide is left. */
  signal: AbortSignal
  /**
   * Ignore forward presses until the returned release is called, or the slide is left. Back presses still work, so
   * the presenter can always undo. Used while a video plays, so a nervous double press cannot skip it.
   */
  hold(): () => void
}

export interface SlideDefinition {
  id: string
  claim: string
  notes?: string
  transition?: 'cut' | 'fade'
  fullBleed?: boolean
  tempo?: SlideTempo
  illustrative?: boolean
  data?: Record<string, unknown>
  build(ctx: SlideBuildContext): void
  /** Called the instant the slide is reached (at the press, before any transition), with how it was reached. */
  enter?(ctx: SlideLiveContext): void
}

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/

export function defineSlide(def: SlideDefinition): SlideDefinition {
  if (!KEBAB.test(def.id)) throw new TypeError(`slide id "${def.id}" must be kebab-case`)
  if (!def.claim || !def.claim.trim()) throw new TypeError(`slide "${def.id}" needs a claim`)
  return def
}
