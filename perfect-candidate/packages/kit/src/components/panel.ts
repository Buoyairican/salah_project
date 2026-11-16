import { radius, space } from '../tokens/space'
import type { Handle, PanelOptions } from './types'

/** A card. Solid: surface, line border, radius m, soft shadow. Glass: for dark grounds, text colour inherited. */
export function panel(parent: HTMLElement, opts: PanelOptions = {}): Handle {
  if (opts.padding !== undefined && !(opts.padding in space)) throw new RangeError(`panel: padding ${opts.padding} is not a space token`)
  if (opts.radius !== undefined && !(opts.radius in radius)) throw new RangeError(`panel: radius "${opts.radius}" is not a radius token`)
  const el = parent.ownerDocument.createElement('div')
  if (opts.glass) el.className = 'panel panel--glass'
  else el.className = opts.shadow === false ? 'panel panel--solid panel--flat' : 'panel panel--solid'
  if (opts.padding !== undefined) el.style.padding = `var(--space-${opts.padding})`
  if (opts.radius !== undefined) el.style.borderRadius = `var(--radius-${opts.radius})`
  parent.appendChild(el)
  return { el }
}
