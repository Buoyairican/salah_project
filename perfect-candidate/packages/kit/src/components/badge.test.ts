// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { badge } from './badge'
import { heatmap } from './heatmap'

describe('badge', () => {
  it('appends a dashed pill with the text', () => {
    const parent = document.createElement('div')
    const b = badge(parent, 'Exemple de données')
    expect(b.el.tagName).toBe('SPAN')
    expect(b.el.className).toBe('badge')
    expect(b.el.textContent).toBe('Exemple de données')
    expect(b.el.parentElement).toBe(parent)
  })
  it('is the same pill the heatmap uses, which keeps its own class', () => {
    const hm = heatmap(document.body, { rows: 1, cols: 1, labels: ['a'], illustrative: true }, { language: 'fr' })
    expect(hm.badge!.tagName).toBe('DIV')
    expect(hm.badge!.className).toBe('hm-badge')
    expect(hm.el.lastElementChild).toBe(hm.badge)
  })
})
