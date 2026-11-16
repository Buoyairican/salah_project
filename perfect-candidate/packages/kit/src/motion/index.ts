import type { Motion, MotionContext } from './types'
import { reveal, exit } from './reveal'
import { focus } from './focus'
import { heat } from './heat'
import { count } from './count'
import { draw } from './draw'
import { ambient } from './ambient'

export function createMotion(ctx: MotionContext): Motion {
  return {
    reveal: (tl, h, v, o) => reveal(ctx, tl, h, v, o),
    exit: (tl, h, v, o) => exit(ctx, tl, h, v, o),
    focus: (tl, h, others, o) => focus(ctx, tl, h, others, o),
    heat: (tl, hm, values, o) => heat(ctx, tl, hm, values, o),
    count: (tl, s, from, to, o) => count(ctx, tl, s, from, to, o),
    draw: (tl, path, o) => draw(ctx, tl, path, o),
    ambient: (target, v, o) => ambient(ctx, target, v, o),
  }
}

export { reveal, exit, focus, heat, count, draw, ambient }
export { AMBIENT_CLASS, AMBIENT_PERIODS, AMBIENT_AMPLITUDES, AMBIENT_LIMITS, SWEEP_CLASS, SWEEP_BAND_CLASS } from './ambient'
