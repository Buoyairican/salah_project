// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { statement, formatValue, EMPTY_VALUE } from './statement'

describe('statement', () => {
  it('shows the value as a dash in display-1, reserves the final width, and adds a muted caption', () => {
    const parent = document.createElement('div')
    document.body.appendChild(parent)
    const s = statement(parent, { value: 87, unit: '%', caption: 'des chocs mesurés' }, { language: 'fr' })
    expect(s.el.className).toBe('statement')
    expect(s.el.parentElement).toBe(parent)
    expect(s.value.textContent).toBe(EMPTY_VALUE)
    expect(s.value.className).toBe('statement-value-live')
    const box = s.value.parentElement!
    expect(box.className).toBe('type-display-1 statement-value')
    expect(box.dataset.ghost).toBe('87 %') // drawn by ::before, invisible, so the layout never shifts while counting
    expect(box.textContent).toBe(EMPTY_VALUE)
    expect(s.caption.el.classList.contains('type-body')).toBe(true)
    expect(s.caption.el.classList.contains('text-muted')).toBe(true)
    expect(s.caption.words).toHaveLength(3)
    expect(s.badge).toBeNull()
    expect(s.unit).toBe('%')
    expect(Array.from(s.el.children)).toEqual([box, s.caption.el])
  })
  it('adds the illustrative badge last, in the deck language', () => {
    const fr = statement(document.body, { value: 87, unit: '%', caption: 'x', illustrative: true }, { language: 'fr' })
    expect(fr.badge?.textContent).toBe('Exemple de données')
    expect(fr.badge?.className).toBe('badge')
    expect(fr.el.lastElementChild).toBe(fr.badge)
    const en = statement(document.body, { value: 2, caption: 'x', illustrative: true }, { language: 'en' })
    expect(en.badge?.textContent).toBe('Example data')
    expect(en.unit).toBeNull()
  })
  it('rejects a value that is not a finite number', () => {
    expect(() => statement(document.body, { value: NaN, caption: 'x' }, { language: 'fr' })).toThrow(RangeError)
  })
})

describe('formatValue', () => {
  it('joins the number and the unit with a space, or shows the number alone', () => {
    expect(formatValue(87, '%')).toBe('87 %')
    expect(formatValue(12, null)).toBe('12')
    expect(formatValue(12, '')).toBe('12')
  })
})
