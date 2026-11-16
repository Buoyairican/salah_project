import { describe, it, expect } from 'vitest'
import { defineBrand, brandToCss, type BrandTheme } from './types'

const ok: BrandTheme = {
  name: 'test',
  colors: { bg: '#ffffff', surface: '#fafafa', ink: '#111111', inkMuted: '#555555', line: '#dddddd', accent: '#1f6f4a', accentSoft: '#dcefe4' },
  data: { risk: ['#2e8b57', '#9acd32', '#f4c542', '#f08a24', '#d7263d'], categorical: ['#111111', '#222222', '#333333', '#444444', '#555555', '#666666'] },
  fonts: { display: 'Instrument Serif', text: 'Geist Variable' },
  tempo: 1,
  emphasisEase: 'back.out(1.2)',
  logo: { light: '/logo.svg' },
}

describe('defineBrand', () => {
  it('returns the theme unchanged when valid', () => {
    expect(defineBrand(ok)).toEqual(ok)
  })
  it('rejects tempo outside 0.8..1.25', () => {
    expect(() => defineBrand({ ...ok, tempo: 0.5 })).toThrow(RangeError)
    expect(() => defineBrand({ ...ok, tempo: 1.3 })).toThrow(RangeError)
    expect(() => defineBrand({ ...ok, tempo: NaN })).toThrow(RangeError)
  })
  it('rejects wrong palette sizes and non-hex colours', () => {
    expect(() => defineBrand({ ...ok, data: { ...ok.data, categorical: ['#111111'] } })).toThrow(RangeError)
    expect(() => defineBrand({ ...ok, colors: { ...ok.colors, accent: 'red' } })).toThrow(RangeError)
  })
  it('accepts the optional highlight and deep colours, and validates them as hex when present', () => {
    const rich = { ...ok, colors: { ...ok.colors, highlight: '#79B82D', deep: '#0F2A19' } }
    expect(defineBrand(rich)).toEqual(rich)
    expect(() => defineBrand({ ...ok, colors: { ...ok.colors, highlight: 'lime' } })).toThrow(RangeError)
    expect(() => defineBrand({ ...ok, colors: { ...ok.colors, deep: '#0F2A1' } })).toThrow(RangeError)
  })
  it('accepts display and text weights within 100..900 and rejects others', () => {
    const weighted = { ...ok, fonts: { ...ok.fonts, displayWeight: 700, textWeight: 400 } }
    expect(defineBrand(weighted)).toEqual(weighted)
    expect(defineBrand({ ...ok, fonts: { ...ok.fonts, displayWeight: 100, textWeight: 900 } }).fonts.textWeight).toBe(900)
    expect(() => defineBrand({ ...ok, fonts: { ...ok.fonts, displayWeight: 950 } })).toThrow(RangeError)
    expect(() => defineBrand({ ...ok, fonts: { ...ok.fonts, textWeight: 50 } })).toThrow(RangeError)
    expect(() => defineBrand({ ...ok, fonts: { ...ok.fonts, textWeight: NaN } })).toThrow(RangeError)
  })
  it('accepts the optional mark and stacked logo URLs', () => {
    const logos = { ...ok, logo: { light: '/side.svg', mark: '/mark.svg', stacked: '/down.svg' } }
    expect(defineBrand(logos).logo).toEqual({ light: '/side.svg', mark: '/mark.svg', stacked: '/down.svg' })
    const dark = { ...ok, logo: { light: '/s.svg', dark: '/sw.svg', markDark: '/mw.svg', stackedDark: '/dw.svg' } }
    expect(defineBrand(dark).logo.markDark).toBe('/mw.svg')
  })
})

describe('brandToCss', () => {
  it('emits every colour variable that base.css consumes', () => {
    const css = brandToCss(ok)
    expect(css).toMatch(/--color-bg: #[0-9a-f]{6}/i)
    expect(css).toMatch(/--color-ink: #[0-9a-f]{6}/i)
    expect(css).toMatch(/--color-ink-muted: #[0-9a-f]{6}/i)
  })
  it('emits colour roles, risk stops, fonts and tempo', () => {
    const css = brandToCss(ok)
    expect(css).toContain('--color-bg: #ffffff')
    expect(css).toContain('--color-accent-soft: #dcefe4')
    expect(css).toContain('--risk-0: #2e8b57')
    expect(css).toContain('--risk-4: #d7263d')
    expect(css).toContain('--cat-5: #666666')
    expect(css).toContain(`--font-display: 'Instrument Serif'`)
    expect(css).toContain(`--font-text: 'Geist Variable'`)
    expect(css).toContain('--brand-tempo: 1')
  })
  it('emits the font weights, defaulting both to 400', () => {
    const css = brandToCss(ok)
    expect(css).toContain('--font-display-weight: 400')
    expect(css).toContain('--font-text-weight: 400')
    const bold = brandToCss({ ...ok, fonts: { ...ok.fonts, displayWeight: 700, textWeight: 600 } })
    expect(bold).toContain('--font-display-weight: 700')
    expect(bold).toContain('--font-text-weight: 600')
  })
  it('emits highlight and deep only when the brand sets them', () => {
    expect(brandToCss(ok)).not.toContain('--color-highlight')
    expect(brandToCss(ok)).not.toContain('--color-deep')
    expect(brandToCss(ok)).not.toContain('undefined')
    const css = brandToCss({ ...ok, colors: { ...ok.colors, highlight: '#79B82D', deep: '#0F2A19' } })
    expect(css).toContain('--color-highlight: #79B82D')
    expect(css).toContain('--color-deep: #0F2A19')
  })
})
