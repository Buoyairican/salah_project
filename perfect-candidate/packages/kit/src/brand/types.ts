import { BRAND_TEMPO_MAX, BRAND_TEMPO_MIN } from '../tokens/motion'

export interface BrandColors {
  bg: string
  surface: string
  ink: string
  inkMuted: string
  line: string
  accent: string
  accentSoft: string
  /** Shapes only (rules, chips, tags, glows, circuit strokes), never a text colour. Emitted as `--color-highlight`. */
  highlight?: string
  /** The near-black ground for dark slides and gradients. Emitted as `--color-deep`. */
  deep?: string
}

export interface BrandFonts {
  display: string
  text: string
  /** Weight of the display face for display and heading levels, 100..900. Default 400. */
  displayWeight?: number
  /** Weight of the text face for body and caption, 100..900. Default 400. */
  textWeight?: number
}

export interface BrandLogo {
  /** The horizontal lockup for light grounds (the `side` variant of `brand.logo`). */
  light: string
  /** The horizontal lockup for dark and accent grounds (a white variant). */
  dark?: string
  /** The mark alone (the `mark` variant). */
  mark?: string
  /** The mark for dark and accent grounds. */
  markDark?: string
  /** The stacked lockup (the `down` variant). */
  stacked?: string
  /** The stacked lockup for dark and accent grounds. */
  stackedDark?: string
}

export interface BrandTheme {
  name: string
  colors: BrandColors
  data: { risk: [string, string, string, string, string]; categorical: string[] }
  fonts: BrandFonts
  tempo: number
  emphasisEase: 'back.out(1.2)' | 'expo.out'
  logo: BrandLogo
}

const HEX = /^#[0-9a-fA-F]{6}$/
const WEIGHT_MIN = 100
const WEIGHT_MAX = 900
const DEFAULT_WEIGHT = 400

export function defineBrand(theme: BrandTheme): BrandTheme {
  if (!(theme.tempo >= BRAND_TEMPO_MIN && theme.tempo <= BRAND_TEMPO_MAX)) {
    throw new RangeError(`brand "${theme.name}": tempo ${theme.tempo} must be within ${BRAND_TEMPO_MIN}..${BRAND_TEMPO_MAX}`)
  }
  if (theme.data.risk.length !== 5) throw new RangeError(`brand "${theme.name}": data.risk needs 5 stops`)
  if (theme.data.categorical.length !== 6) throw new RangeError(`brand "${theme.name}": data.categorical needs 6 colours`)
  const all = [...Object.values(theme.colors), ...theme.data.risk, ...theme.data.categorical]
  for (const c of all) {
    if (c === undefined) continue // the optional roles (highlight, deep) may be absent
    if (!HEX.test(c)) throw new RangeError(`brand "${theme.name}": colour "${c}" must be a 6-digit hex`)
  }
  for (const key of ['displayWeight', 'textWeight'] as const) {
    const w = theme.fonts[key]
    if (w !== undefined && !(w >= WEIGHT_MIN && w <= WEIGHT_MAX)) {
      throw new RangeError(`brand "${theme.name}": fonts.${key} ${w} must be within ${WEIGHT_MIN}..${WEIGHT_MAX}`)
    }
  }
  return theme
}

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)

export function brandToCss(theme: BrandTheme): string {
  const lines: string[] = []
  for (const [k, v] of Object.entries(theme.colors)) if (v !== undefined) lines.push(`--color-${kebab(k)}: ${v}`)
  theme.data.risk.forEach((c, i) => lines.push(`--risk-${i}: ${c}`))
  theme.data.categorical.forEach((c, i) => lines.push(`--cat-${i}: ${c}`))
  lines.push(`--font-display: '${theme.fonts.display}'`, `--font-text: '${theme.fonts.text}'`)
  lines.push(
    `--font-display-weight: ${theme.fonts.displayWeight ?? DEFAULT_WEIGHT}`,
    `--font-text-weight: ${theme.fonts.textWeight ?? DEFAULT_WEIGHT}`,
  )
  lines.push(`--brand-tempo: ${theme.tempo}`)
  return `:root {\n  ${lines.join(';\n  ')};\n}\n`
}
