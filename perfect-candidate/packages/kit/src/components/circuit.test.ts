// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { circuit, CIRCUIT_HEIGHT } from './circuit'

const points = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)

describe('circuit', () => {
  it('draws a trace across the width with a node circle at each end', () => {
    const parent = document.createElement('div')
    const c = circuit(parent, { width: 960, nodes: 2 })
    expect(c.el.className).toBe('circuit')
    expect(c.el.parentElement).toBe(parent)
    expect(c.el.getAttribute('aria-hidden')).toBe('true')
    expect(c.svg.parentElement).toBe(c.el)
    expect(c.svg.getAttribute('width')).toBe('960')
    expect(c.svg.getAttribute('height')).toBe(String(CIRCUIT_HEIGHT))
    expect(c.svg.getAttribute('viewBox')).toBe(`0 0 960 ${CIRCUIT_HEIGHT}`)
    expect(c.path.tagName).toBe('path')
    expect(c.path.getAttribute('class')).toBe('circuit-path')
    expect(c.path.getAttribute('pathLength')).toBe('1')
    expect(c.nodes).toHaveLength(2)
    const d = points(c.path.getAttribute('d')!)
    const [first, last] = [c.nodes[0]!, c.nodes[1]!]
    expect(first.getAttribute('class')).toBe('circuit-node')
    expect([Number(first.getAttribute('cx')), Number(first.getAttribute('cy'))]).toEqual(d.slice(0, 2))
    expect([Number(last.getAttribute('cx')), Number(last.getAttribute('cy'))]).toEqual(d.slice(-2))
    for (const v of d) expect(v).toBeGreaterThanOrEqual(0)
    for (let i = 0; i < d.length; i += 2) {
      expect(d[i]!).toBeLessThanOrEqual(960)
      expect(d[i + 1]!).toBeLessThanOrEqual(CIRCUIT_HEIGHT)
    }
    expect(c.svg.lastElementChild).toBe(last) // nodes paint over the trace
  })
  it('puts a third node on the bend of the trace', () => {
    const c = circuit(document.body, { width: 960, nodes: 3 })
    expect(c.nodes).toHaveLength(3)
    const d = points(c.path.getAttribute('d')!)
    const mid = [Number(c.nodes[1]!.getAttribute('cx')), Number(c.nodes[1]!.getAttribute('cy'))]
    const vertices = Array.from({ length: d.length / 2 }, (_, i) => [d[2 * i], d[2 * i + 1]])
    expect(vertices.slice(1, -1)).toContainEqual(mid)
  })
  it('pins to a corner and rejects other node counts and narrow widths', () => {
    expect(circuit(document.body, { width: 480, nodes: 2, corner: 'bottom-left' }).el.className).toBe('circuit pin pin--bottom-left')
    expect(() => circuit(document.body, { width: 960, nodes: 4 as 3 })).toThrow(RangeError)
    expect(() => circuit(document.body, { width: 100, nodes: 2 })).toThrow(RangeError)
  })
})
