import { describe, it, expect } from 'vitest'
import { tokensToCss } from './css'
import { space } from './space'
import { shadows } from './shadow'
import { t } from './index'

describe('tokensToCss', () => {
  const css = tokensToCss()
  it('emits stage, safe area, type, space and duration variables', () => {
    expect(css).toContain('--stage-w: 1920px')
    expect(css).toContain('--stage-h: 1080px')
    expect(css).toContain('--safe-x: 96px')
    expect(css).toContain('--safe-w: 1728px')
    expect(css).toContain('--type-h1-size: 88px')
    expect(css).toContain('--type-caption-size: 24px')
    expect(css).toContain('--space-4: 32px')
    expect(css).toContain('--radius-m: 16px')
    expect(css).toContain('--dur-m: 0.5s')
  })
  it('pins the type scale: hero level and one line-height progression', () => {
    expect(css).toContain('--type-hero-size: 240px')
    expect(css).toContain('--type-hero-lh: 1')
    const lh = { 'display-1': 1.04, 'display-2': 1.08, h1: 1.12, h2: 1.18, h3: 1.24, body: 1.45, caption: 1.5 }
    for (const [k, v] of Object.entries(lh)) expect(css).toContain(`--type-${k}-lh: ${v};`)
  })
  it('emits a --space-N variable for every space token, matching the names layout.ts reads', () => {
    for (const [k, v] of Object.entries(space)) expect(css).toContain(`--space-${k}: ${v}px`)
  })
  it('emits the soft and deep shadow tokens', () => {
    expect(css).toContain('--shadow-soft: 0 8px 24px rgba(15, 42, 25, 0.12)')
    expect(css).toContain('--shadow-deep: 0 24px 64px rgba(0, 0, 0, 0.35)')
    for (const k of Object.keys(shadows)) expect(css).toContain(`--shadow-${k}: `)
    expect(t.shadows).toBe(shadows)
  })
  it('is a single :root block', () => {
    expect(css.startsWith(':root {')).toBe(true)
    expect(css.trim().endsWith('}')).toBe(true)
  })
})
