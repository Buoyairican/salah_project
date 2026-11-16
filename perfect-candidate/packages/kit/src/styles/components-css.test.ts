import { describe, it, expect } from 'vitest'

// Vitest blanks CSS imports (even ?raw), so read the sheets from disk. The kit has no Node types, hence the local typing.
const nodeFs = (globalThis as unknown as { process: { getBuiltinModule(id: string): unknown } }).process.getBuiltinModule('node:fs') as {
  readFileSync(path: URL, encoding: 'utf8'): string
}
const read = (name: string) => nodeFs.readFileSync(new URL(`./${name}`, import.meta.url), 'utf8')
const css = read('components.css')
const base = read('base.css')

/** The declarations of the first rule whose selector list is exactly `selector`. */
function rule(sheet: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
  const m = sheet.match(new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`, 'm'))
  if (!m) throw new Error(`no rule for "${selector}"`)
  return m[1]!
}

describe('components.css', () => {
  it('uses tokens only: no hex colours, and the glass whites are the only rgba literals', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    const literals = css.match(/rgba?\([^)]*\)/g) ?? []
    expect(literals.length).toBeGreaterThan(0)
    for (const l of literals) expect(l).toMatch(/^rgba\(255, 255, 255, 0\.\d+\)$/)
  })
  it('keeps the heatmap badge as it was, sharing the pill with .badge', () => {
    expect(rule(css, '.badge, .hm-badge')).toContain('border: 1px dashed var(--color-line)')
    expect(rule(css, '.hm-badge')).toContain('justify-self: start')
  })
  it('paints the five grounds from brand variables, the gradient from deep to accent at 160deg', () => {
    expect(rule(css, '.ground-bg')).toContain('background: var(--color-bg)')
    expect(rule(css, '.ground-surface')).toContain('background: var(--color-surface)')
    expect(rule(css, '.ground-accent')).toContain('background: var(--color-accent)')
    expect(rule(css, '.ground-deep')).toContain('background: var(--color-deep')
    expect(rule(css, '.ground-gradient')).toContain('linear-gradient(160deg, var(--color-deep')
    for (const g of ['accent', 'deep', 'gradient']) expect(rule(css, `.ground-${g}`)).toContain('color: var(--color-bg)')
  })
  it('turns eyebrows kraft on the accent ground and kraft at 60 % on dark grounds, never highlight', () => {
    expect(rule(css, '.eyebrow')).toContain('color: var(--color-accent)')
    expect(rule(css, '.on-accent .eyebrow')).toContain('color: var(--color-bg)')
    expect(rule(css, '.on-dark .eyebrow')).toMatch(/color: var\(--color-bg\);\s*opacity: 0\.6/)
    expect(css).not.toMatch(/eyebrow[^{]*\{[^}]*color: var\(--color-highlight/)
  })
  it('uses the highlight colour for shapes only, never as a text colour', () => {
    expect(css).not.toMatch(/(^|[\s;{])color: var\(--color-highlight/m)
  })
  it('builds the glass panel and the glass heatmap from the brief values', () => {
    const glass = rule(css, '.panel--glass')
    expect(glass).toContain('background: rgba(255, 255, 255, 0.08)')
    expect(glass).toContain('backdrop-filter: blur(24px) saturate(1.2)')
    expect(glass).toContain('-webkit-backdrop-filter: blur(24px) saturate(1.2)')
    expect(glass).toContain('border: 1px solid rgba(255, 255, 255, 0.18)')
    expect(glass).toContain('box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25), var(--shadow-deep)')
    expect(glass).toContain('border-radius: var(--radius-l)')
    expect(rule(css, '.panel--solid')).toContain('box-shadow: var(--shadow-soft)')
    const cell = rule(css, '.hm--glass .hm-cell')
    expect(cell).toContain('background: rgba(255, 255, 255, 0.06)')
    expect(cell).toContain('border-top-width: 2px')
    expect(cell).toContain('color: var(--color-bg)')
  })
  it('builds the mesh tones from brand roles at the brief mixes, with a static blur within 48 px', () => {
    const mixes = (tone: string) =>
      [1, 2, 3, 4, 5].map((k) => /--mesh-color: color-mix\(in srgb, (.+) (\d+)%, transparent\)/.exec(rule(css, `.mesh--${tone} .mesh-blob--${k}`))!.slice(1).join(' '))
    expect(mixes('deep')).toEqual([
      'var(--color-accent) 55',
      'var(--color-highlight, var(--color-accent)) 22',
      'var(--risk-3) 12',
      'var(--color-surface) 10',
      'var(--color-accent) 40',
    ])
    expect(mixes('kraft')).toEqual([
      'var(--color-accent-soft) 80',
      'var(--color-highlight, var(--color-accent)) 18',
      'var(--risk-3) 16',
      'var(--color-surface) 60',
      'var(--color-accent) 10',
    ])
    expect(rule(css, '.mesh--deep')).toContain('background: var(--color-deep')
    expect(rule(css, '.mesh--kraft')).toContain('background: var(--color-bg)')
    const blob = rule(css, '.mesh-blob')
    expect(blob).toContain('radial-gradient(closest-side, var(--mesh-color, transparent), transparent)')
    expect(Number(/filter: blur\((\d+)px\)/.exec(blob)![1])).toBeLessThanOrEqual(48)
    expect(blob).toContain('will-change: translate')
  })
  it('draws the sweep band in white at 0.12 and clips it to its target', () => {
    expect(rule(css, '.ambient-sweep-band')).toContain('rgba(255, 255, 255, 0.12) 50%')
    expect(rule(css, '.ambient-sweep')).toMatch(/inset: 0;\s*overflow: hidden;\s*border-radius: inherit;\s*pointer-events: none/)
  })
})

describe('base.css', () => {
  it('gives ambient targets their own layer for translate', () => {
    expect(rule(base, '.ambient')).toContain('will-change: translate')
  })
  it('reads the brand weights with 400 fallbacks', () => {
    expect(base).toContain('font-weight: var(--font-display-weight, 400)')
    expect(base).toContain('font-weight: var(--font-text-weight, 400)')
  })
  it('lets a safe region nested in another fill it instead of offsetting twice', () => {
    expect(rule(base, '.safe .safe')).toMatch(/left: 0;\s*top: 0;\s*width: 100%;\s*height: 100%/)
  })
})
