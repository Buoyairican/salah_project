export const durations = { xs: 0.15, s: 0.3, m: 0.5, l: 0.8, xl: 1.2 } as const
export type DurationToken = keyof typeof durations

export const eases = {
  enter: 'expo.out',
  exit: 'power2.in',
  move: 'power3.inOut',
  emphasis: 'back.out(1.2)',
  soft: 'sine.inOut',
} as const
export type EaseToken = keyof typeof eases

export const staggers = { tight: 0.04, normal: 0.08, loose: 0.15 } as const
export type StaggerToken = keyof typeof staggers

export const tempos = { slow: 1.25, normal: 1, brisk: 0.8 } as const
export type SlideTempo = keyof typeof tempos

export const EXIT_RATIO = 0.6
export const BRAND_TEMPO_MIN = 0.8
export const BRAND_TEMPO_MAX = 1.25

export interface TimingContext {
  brandTempo: number
  slideTempo: SlideTempo
  reduced: boolean
}

export function resolveDuration(token: DurationToken, ctx: TimingContext): number {
  if (ctx.reduced) return durations.xs
  return durations[token] * ctx.brandTempo * tempos[ctx.slideTempo]
}

export function resolveStagger(token: StaggerToken, ctx: TimingContext): number {
  if (ctx.reduced) return 0
  return staggers[token]
}
