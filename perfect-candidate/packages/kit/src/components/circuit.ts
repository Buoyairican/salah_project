import { pin } from './pin'
import type { CircuitHandle, CircuitOptions } from './types'

const SVG_NS = 'http://www.w3.org/2000/svg'
/** Height of the motif in stage px. */
export const CIRCUIT_HEIGHT = 64
export const CIRCUIT_MIN_WIDTH = 192
const NODE_R = 12
/** Node radius plus half the 6 px stroke: how far a node centre sits from the box edge. */
const INSET = NODE_R + 3

/**
 * The circuit motif from the logo: a trace that runs low, bends up at 45°, then runs high, with a node
 * circle at each end and, with three nodes, one on the upper bend. `draw` animates `path`.
 */
export function circuit(parent: HTMLElement, opts: CircuitOptions): CircuitHandle {
  const { width, nodes } = opts
  if (nodes !== 2 && nodes !== 3) throw new RangeError(`circuit: nodes must be 2 or 3, got ${nodes}`)
  if (!(width >= CIRCUIT_MIN_WIDTH)) throw new RangeError(`circuit: width ${width} must be at least ${CIRCUIT_MIN_WIDTH}`)
  const doc = parent.ownerDocument
  const svgEl = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>) => {
    const node = doc.createElementNS(SVG_NS, tag)
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v))
    return node
  }

  const low = CIRCUIT_HEIGHT - INSET
  const high = INSET
  const rise = low - high
  const bendStart = Math.round(width * 0.45)
  const vertices: Array<[number, number]> = [
    [INSET, low],
    [bendStart, low],
    [bendStart + rise, high],
    [width - INSET, high],
  ]

  const el = doc.createElement('div')
  el.className = 'circuit'
  el.setAttribute('aria-hidden', 'true')
  const svg = svgEl('svg', { width, height: CIRCUIT_HEIGHT, viewBox: `0 0 ${width} ${CIRCUIT_HEIGHT}` })
  const d = vertices.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')
  const path = svgEl('path', { class: 'circuit-path', d, pathLength: 1 })
  svg.appendChild(path)
  const centres = nodes === 3 ? [vertices[0]!, vertices[2]!, vertices[3]!] : [vertices[0]!, vertices[3]!]
  const circles = centres.map(([cx, cy]) => svgEl('circle', { class: 'circuit-node', cx, cy, r: NODE_R }))
  svg.append(...circles)
  el.appendChild(svg)
  pin(el, opts.corner)
  parent.appendChild(el)
  return { el, svg, path, nodes: circles }
}
