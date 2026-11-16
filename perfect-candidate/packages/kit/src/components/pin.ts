import type { Corner } from './types'

export const CORNERS: readonly Corner[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right']

/** Pin an element to a corner of the safe area (CSS `.pin--<corner>`). No corner leaves it in the flow. */
export function pin(el: Element, corner: Corner | undefined, allowed: readonly Corner[] = CORNERS): void {
  if (corner === undefined) return
  if (!allowed.includes(corner)) throw new RangeError(`corner "${corner}" must be one of ${allowed.join(', ')}`)
  el.classList.add('pin', `pin--${corner}`)
}
