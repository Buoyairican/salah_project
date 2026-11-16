import { typeScale } from './type'
import { space, radius } from './space'
import { durations, eases, staggers, tempos } from './motion'
import { STAGE, SAFE, GRID } from './stage'
import { shadows } from './shadow'

export const t = {
  type: typeScale,
  space,
  radius,
  shadows,
  motion: { durations, eases, staggers, tempos },
  stage: STAGE,
  safe: SAFE,
  grid: GRID,
} as const
export type Tokens = typeof t

export * from './type'
export * from './space'
export * from './motion'
export * from './stage'
export * from './shadow'
export { tokensToCss } from './css'
