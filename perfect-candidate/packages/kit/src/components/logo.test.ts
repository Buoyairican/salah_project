// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { brandLogo, LOGO_HEIGHTS } from './logo'
import { fullBleed } from './layout'
import type { ComponentsOptions, LogoHeight, LogoVariant } from './types'

const ctx: ComponentsOptions = { language: 'fr', brand: { name: 'igravia', logo: { light: '/side.svg', mark: '/mark.svg', stacked: '/down.svg' } } }

describe('brand.logo', () => {
  it('appends an image of the variant at the requested stage height', () => {
    const parent = document.createElement('div')
    const side = brandLogo(parent, { variant: 'side', height: 72 }, ctx)
    expect(side.el.className).toBe('brand-logo')
    expect(side.el.parentElement).toBe(parent)
    expect(side.img.parentElement).toBe(side.el)
    expect(side.img.getAttribute('src')).toBe('/side.svg')
    expect(side.img.alt).toBe('igravia')
    expect(side.img.style.height).toBe('72px')
    expect(brandLogo(parent, { variant: 'mark', height: 48 }, ctx).img.getAttribute('src')).toBe('/mark.svg')
    expect(brandLogo(parent, { variant: 'down', height: 144 }, ctx).img.getAttribute('src')).toBe('/down.svg')
  })
  it('sits on a kraft plate on request', () => {
    const h = brandLogo(document.body, { variant: 'side', height: 96, plate: true }, ctx)
    expect(h.el.className).toBe('brand-logo brand-logo--plate')
  })
  const ctxDark: ComponentsOptions = {
    language: 'fr',
    brand: { name: 'igravia', logo: { light: '/side.svg', dark: '/side-w.svg', mark: '/mark.svg', markDark: '/mark-w.svg', stacked: '/down.svg', stackedDark: '/down-w.svg' } },
  }
  it('uses the dark file with no plate on dark and accent grounds', () => {
    for (const ground of ['deep', 'gradient', 'accent'] as const) {
      const fb = fullBleed(document.createElement('div'), { ground })
      const mark = brandLogo(fb.content, { variant: 'mark', height: 72 }, ctxDark)
      expect(mark.el.className).toBe('brand-logo')
      expect(mark.img.getAttribute('src')).toBe('/mark-w.svg')
      expect(brandLogo(fb.el, { variant: 'side', height: 96 }, ctxDark).img.getAttribute('src')).toBe('/side-w.svg')
      expect(brandLogo(fb.el, { variant: 'down', height: 144 }, ctxDark).img.getAttribute('src')).toBe('/down-w.svg')
      expect(() => brandLogo(fb.content, { variant: 'mark', height: 72, plate: false }, ctxDark)).not.toThrow()
    }
  })
  it('uses the light file on light grounds, and honours an explicit tone', () => {
    const light = fullBleed(document.createElement('div'), { ground: 'surface' })
    const h = brandLogo(light.content, { variant: 'mark', height: 72 }, ctxDark)
    expect(h.el.className).toBe('brand-logo')
    expect(h.img.getAttribute('src')).toBe('/mark.svg')
    expect(brandLogo(light.content, { variant: 'mark', height: 72, tone: 'dark' }, ctxDark).img.getAttribute('src')).toBe('/mark-w.svg')
    const deep = fullBleed(document.createElement('div'), { ground: 'deep' })
    expect(brandLogo(deep.content, { variant: 'mark', height: 72, tone: 'light' }, ctxDark).img.getAttribute('src')).toBe('/mark.svg')
    expect(() => brandLogo(deep.content, { variant: 'mark', height: 72, tone: 'x' as 'auto' }, ctxDark)).toThrow(RangeError)
  })
  it('falls back to a kraft plate on dark grounds when the brand has no dark file, and refuses plate: false there', () => {
    for (const ground of ['deep', 'gradient', 'accent'] as const) {
      const fb = fullBleed(document.createElement('div'), { ground })
      expect(brandLogo(fb.content, { variant: 'mark', height: 48 }, ctx).el.classList.contains('brand-logo--plate')).toBe(true)
      expect(brandLogo(fb.el, { variant: 'side', height: 72 }, ctx).el.classList.contains('brand-logo--plate')).toBe(true)
      expect(() => brandLogo(fb.content, { variant: 'mark', height: 48, plate: false }, ctx)).toThrow(RangeError)
    }
    const light = fullBleed(document.createElement('div'), { ground: 'surface' })
    expect(brandLogo(light.content, { variant: 'mark', height: 48 }, ctx).el.className).toBe('brand-logo')
  })
  it('pins to a corner of the safe area', () => {
    const h = brandLogo(document.body, { variant: 'mark', height: 48, corner: 'bottom-right' }, ctx)
    expect(h.el.className).toBe('brand-logo pin pin--bottom-right')
  })
  it('allows only the listed heights, and lockups from 72', () => {
    expect(LOGO_HEIGHTS).toEqual([48, 72, 96, 144, 240])
    expect(() => brandLogo(document.body, { variant: 'mark', height: 50 as LogoHeight }, ctx)).toThrow(RangeError)
    expect(() => brandLogo(document.body, { variant: 'side', height: 48 }, ctx)).toThrow(RangeError)
    expect(() => brandLogo(document.body, { variant: 'down', height: 48 }, ctx)).toThrow(RangeError)
  })
  it('names what is missing: the brand, the variant file, or the variant', () => {
    expect(() => brandLogo(document.body, { variant: 'mark', height: 48 }, { language: 'fr' })).toThrow(/brand/)
    const sideOnly: ComponentsOptions = { language: 'fr', brand: { name: 'n', logo: { light: '/l.svg' } } }
    expect(() => brandLogo(document.body, { variant: 'down', height: 72 }, sideOnly)).toThrow(/stacked/)
    expect(() => brandLogo(document.body, { variant: 'wide' as LogoVariant, height: 72 }, ctx)).toThrow(RangeError)
  })
})
