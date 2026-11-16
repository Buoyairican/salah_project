import { leadingMesh } from './mesh'
import type { GlowOptions, Handle } from './types'

const COLORS: readonly NonNullable<GlowOptions['color']>[] = ['highlight', 'accent']

/**
 * A soft radial glow (a shape, never text). Positioned in stage px relative to its parent and inserted as the
 * parent's first child, so it paints behind everything else there. When the parent already holds a fullBleed
 * ground, the glow goes inside that ground's element instead, because an opaque ground painted after it
 * would hide it; the ground covers the stage, so the coordinates are unchanged. A mesh backdrop stays first: the
 * glow goes right after it, whichever of the two the slide creates first.
 */
export function glow(parent: HTMLElement, opts: GlowOptions): Handle {
  const color = opts.color ?? 'highlight'
  if (!COLORS.includes(color)) throw new RangeError(`glow: color "${color}" must be one of ${COLORS.join(', ')}`)
  const { x, y, size } = opts
  if (![x, y, size].every(Number.isFinite) || !(size > 0)) throw new RangeError(`glow: x ${x}, y ${y} and size ${size} must be finite, size positive`)
  const el = parent.ownerDocument.createElement('div')
  el.className = `glow glow--${color}`
  el.setAttribute('aria-hidden', 'true')
  el.style.left = `${x - size / 2}px`
  el.style.top = `${y - size / 2}px`
  el.style.width = `${size}px`
  el.style.height = `${size}px`
  const ground = Array.from(parent.children).find((c) => c.classList.contains('layout-fullbleed'))
  const host = ground ?? parent
  const backdrop = leadingMesh(host)
  host.insertBefore(el, backdrop ? backdrop.nextSibling : host.firstChild)
  return { el }
}
