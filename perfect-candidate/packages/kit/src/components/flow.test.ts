// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { flow } from './flow'
import type { FlowStep } from './types'

const steps: FlowStep[] = [
  { n: '01', label: 'Préparation des caisses' },
  { n: '02', label: 'Chargement' },
  { n: '03', label: 'Transport', tag: 'Choc' },
  { n: '04', label: 'Réception' },
]

describe('flow', () => {
  it('builds a row of step cards, each with a chip, a label and an optional tag', () => {
    const parent = document.createElement('div')
    const f = flow(parent, { steps })
    expect(f.el.className).toBe('flow flow--card')
    expect(f.el.parentElement).toBe(parent)
    expect(f.steps).toHaveLength(4)
    for (const s of f.steps) {
      expect(s.className).toBe('flow-step')
      expect(s.parentElement).toBe(f.el)
    }
    expect(f.chips.map((c) => c.textContent)).toEqual(['01', '02', '03', '04'])
    expect(f.chips[0]!.className).toBe('flow-chip')
    expect(f.labels.map((l) => l.textContent)).toEqual(steps.map((s) => s.label))
    expect(f.labels[0]!.className).toBe('flow-label')
    expect(f.tags.map((t) => t?.textContent ?? null)).toEqual([null, null, 'Choc', null])
    expect(f.tags[2]!.className).toBe('flow-tag')
    expect(f.tags[2]!.parentElement).toBe(f.chips[2]!.parentElement) // chip and tag share the step's head row
    expect(f.step(2)).toBe(f.steps[2])
  })
  it('marks accent steps and supports the plain style', () => {
    const f = flow(document.body, { steps: steps.map((s, i) => ({ ...s, ground: i % 2 ? 'accent' : 'surface' })), style: 'plain' })
    expect(f.el.className).toBe('flow flow--plain')
    expect(f.steps.map((s) => s.classList.contains('flow-step--accent'))).toEqual([false, true, false, true])
  })
  it('rejects an empty flow, an unknown style or ground, and an out-of-range step', () => {
    expect(() => flow(document.body, { steps: [] })).toThrow(RangeError)
    expect(() => flow(document.body, { steps, style: 'grid' as 'plain' })).toThrow(RangeError)
    expect(() => flow(document.body, { steps: [{ n: '1', label: 'a', ground: 'lime' as 'accent' }] })).toThrow(RangeError)
    expect(() => flow(document.body, { steps }).step(4)).toThrow(RangeError)
  })
})
