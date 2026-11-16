// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { rule } from './rule'
import type { RuleColor } from './types'

describe('rule', () => {
  it('appends a highlight rule by default', () => {
    const parent = document.createElement('div')
    const r = rule(parent)
    expect(r.el.className).toBe('rule rule--highlight')
    expect(r.el.parentElement).toBe(parent)
    expect(r.el.getAttribute('aria-hidden')).toBe('true')
  })
  it('takes the accent and line colours and rejects others', () => {
    expect(rule(document.body, { color: 'accent' }).el.className).toBe('rule rule--accent')
    expect(rule(document.body, { color: 'line' }).el.className).toBe('rule rule--line')
    expect(() => rule(document.body, { color: 'lime' as RuleColor })).toThrow(RangeError)
  })
})
