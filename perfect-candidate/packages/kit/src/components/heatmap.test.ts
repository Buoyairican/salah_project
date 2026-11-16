// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { heatmap, riskColor } from './heatmap'
import { createComponents } from './index'

const stops = ['#000000', '#808080', '#ffffff', '#ff0000', '#0000ff']

describe('riskColor', () => {
  it('hits the stops exactly at 0, 0.5 and 1', () => {
    expect(riskColor(stops, 0).css).toBe('rgb(0, 0, 0)')
    expect(riskColor(stops, 0.5).css).toBe('rgb(255, 255, 255)')
    expect(riskColor(stops, 1).css).toBe('rgb(0, 0, 255)')
  })
  it('interpolates between stops and clamps', () => {
    expect(riskColor(stops, 0.125).css).toBe('rgb(64, 64, 64)')
    expect(riskColor(stops, -1).css).toBe('rgb(0, 0, 0)')
    expect(riskColor(stops, 2).css).toBe('rgb(0, 0, 255)')
  })
  it('returns the rgb channels for translucent fills', () => {
    expect(riskColor(stops, 0.125).rgb).toEqual([64, 64, 64])
  })
  it('reports luminance so text colour can flip', () => {
    expect(riskColor(stops, 0).luminance).toBe(0)
    expect(riskColor(stops, 0.5).luminance).toBeCloseTo(1)
  })
})

describe('heatmap', () => {
  const labels = ['NO', 'N', 'NE', 'SO', 'S', 'SE']
  it('builds rows × cols cells with labels, ids, values and a legend', () => {
    const h = heatmap(document.body, { rows: 2, cols: 3, labels }, { language: 'fr' })
    expect(h.cells).toHaveLength(6)
    expect(h.ids).toEqual(['r0c0', 'r0c1', 'r0c2', 'r1c0', 'r1c1', 'r1c2'])
    expect(h.cell('r1c2').querySelector('.hm-cell-label')?.textContent).toBe('SE')
    expect(h.values[0]!.textContent).toBe('–')
    expect(h.el.querySelector('.hm')!.getAttribute('style')).toContain('repeat(3, 1fr)')
    expect(h.legend.textContent).toContain('faible')
    expect(h.legend.textContent).toContain('élevé')
    expect(h.badge).toBeNull()
  })
  it('accepts custom ids and shows the illustrative badge in the deck language', () => {
    const h = heatmap(document.body, { rows: 1, cols: 2, labels: ['a', 'b'], ids: ['left', 'right'], illustrative: true }, { language: 'fr' })
    expect(h.cell('right').dataset.cellId).toBe('right')
    expect(h.badge?.textContent).toBe('Exemple de données')
    const en = heatmap(document.body, { rows: 1, cols: 1, labels: ['a'], illustrative: true }, { language: 'en' })
    expect(en.badge?.textContent).toBe('Example data')
  })
  it('keeps the default DOM and adds hm--glass on the wrapper for the glass style', () => {
    const solid = heatmap(document.body, { rows: 1, cols: 2, labels: ['a', 'b'], illustrative: true }, { language: 'fr' })
    expect(solid.el.className).toBe('hm-wrap')
    expect(Array.from(solid.el.children).map((c) => c.className)).toEqual(['hm', 'hm-legend', 'hm-badge'])
    expect(solid.badge!.className).toBe('hm-badge')
    const explicit = heatmap(document.body, { rows: 1, cols: 1, labels: ['a'], style: 'solid' }, { language: 'fr' })
    expect(explicit.el.className).toBe('hm-wrap')
    const glass = heatmap(document.body, { rows: 1, cols: 2, labels: ['a', 'b'], illustrative: true, style: 'glass' }, { language: 'fr' })
    expect(glass.el.className).toBe('hm-wrap hm--glass')
    expect(Array.from(glass.el.children).map((c) => c.className)).toEqual(['hm', 'hm-legend', 'hm-badge'])
    expect(glass.cells[0]!.className).toBe('hm-cell')
    expect(() => heatmap(document.body, { rows: 1, cols: 1, labels: ['a'], style: 'frosted' as 'glass' }, { language: 'fr' })).toThrow(RangeError)
  })
  it('rejects a label count that does not match the grid', () => {
    expect(() => heatmap(document.body, { rows: 2, cols: 2, labels: ['a'] }, { language: 'fr' })).toThrow(RangeError)
    expect(() => heatmap(document.body, { rows: 1, cols: 1, labels: ['a'] }, { language: 'fr' }).cell('nope')).toThrow(RangeError)
  })
})

describe('createComponents', () => {
  it('exposes layout, heading, text and heatmap bound to the language', () => {
    const c = createComponents({ language: 'fr' })
    const parent = document.createElement('div')
    document.body.appendChild(parent)
    const s = c.layout.split(parent)
    const h = c.heading(s.left, 'Titre')
    const p = c.text(s.right, 'Texte')
    const hm = c.heatmap(s.right, { rows: 1, cols: 1, labels: ['x'], illustrative: true })
    expect(h.el.tagName).toBe('H1')
    expect(p.el.tagName).toBe('P')
    expect(hm.badge?.textContent).toBe('Exemple de données')
  })
  it('exposes every addition, binds statement to the language and brand.logo to the brand', () => {
    const c = createComponents({ language: 'en', brand: { name: 'acme', logo: { light: '/side.svg', mark: '/mark.svg' } } })
    const stage = document.createElement('div')
    document.body.appendChild(stage)
    const fb = c.layout.fullBleed(stage, { ground: 'gradient' })
    expect(c.eyebrow(fb.content, 'Un').el.className).toBe('eyebrow')
    expect(c.statement(fb.content, { value: 3, caption: 'x', illustrative: true }).badge?.textContent).toBe('Example data')
    expect(c.flow(fb.content, { steps: [{ n: '1', label: 'a' }] }).steps).toHaveLength(1)
    expect(c.badge(fb.content, 'b').el.className).toBe('badge')
    expect(c.rule(fb.content).el.className).toBe('rule rule--highlight')
    expect(c.footer(fb.content, 'f').el.classList.contains('footer')).toBe(true)
    expect(c.circuit(fb.el, { width: 480, nodes: 2 }).nodes).toHaveLength(2)
    expect(c.glow(fb.el, { x: 0, y: 0, size: 10 }).el.className).toBe('glow glow--highlight')
    expect(c.panel(fb.content, { glass: true }).el.className).toBe('panel panel--glass')
    const logo = c.brand.logo(fb.content, { variant: 'mark', height: 48 })
    expect(logo.img.getAttribute('src')).toBe('/mark.svg')
    expect(logo.el.classList.contains('brand-logo--plate')).toBe(true)
  })
})
