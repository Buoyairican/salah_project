import { pin } from './pin'
import type { ComponentsOptions, LogoHandle, LogoHeight, LogoOptions, LogoVariant } from './types'

export const LOGO_HEIGHTS: readonly LogoHeight[] = [48, 72, 96, 144, 240]
/** A lockup carries a wordmark, which stops being legible below this stage height. */
export const LOCKUP_MIN_HEIGHT = 72
const FILES: Record<LogoVariant, 'mark' | 'light' | 'stacked'> = { mark: 'mark', side: 'light', down: 'stacked' }
const DARK_FILES = { mark: 'markDark', light: 'dark', stacked: 'stackedDark' } as const
const TONES: readonly NonNullable<LogoOptions['tone']>[] = ['auto', 'light', 'dark']
/** Grounds that take the brand's dark (white) logo files. */
const DARK_GROUND = '.on-dark, .on-accent'

/**
 * The brand's logo as an image. On a dark or accent ground it uses the brand's dark (white) file, with no plate; a brand
 * without a dark file falls back to a kraft plate there.
 */
export function brandLogo(parent: HTMLElement, opts: LogoOptions, ctx: ComponentsOptions): LogoHandle {
  const brand = ctx.brand
  if (!brand) throw new RangeError('brand.logo: no brand was passed to createComponents')
  const file = FILES[opts.variant]
  if (!file) throw new RangeError(`brand.logo: variant "${opts.variant}" must be one of ${Object.keys(FILES).join(', ')}`)
  const tone = opts.tone ?? 'auto'
  if (!TONES.includes(tone)) throw new RangeError(`brand.logo: tone "${tone}" must be one of ${TONES.join(', ')}`)
  const onDark = parent.closest(DARK_GROUND) !== null
  const wantDark = tone === 'dark' || (tone === 'auto' && onDark)
  const darkSrc = brand.logo[DARK_FILES[file]]
  const lightSrc = brand.logo[file]
  const useDark = wantDark && darkSrc !== undefined
  const src = useDark ? darkSrc : lightSrc
  if (!src) throw new RangeError(`brand.logo: brand "${brand.name}" has no logo.${file} for the "${opts.variant}" variant`)
  if (!LOGO_HEIGHTS.includes(opts.height)) throw new RangeError(`brand.logo: height ${opts.height} must be one of ${LOGO_HEIGHTS.join(', ')}`)
  if (opts.variant !== 'mark' && opts.height < LOCKUP_MIN_HEIGHT) {
    throw new RangeError(`brand.logo: a lockup needs a height of at least ${LOCKUP_MIN_HEIGHT}, got ${opts.height}`)
  }
  // A dark ground without a dark file is the only case that needs a plate by default.
  const needsPlate = onDark && !useDark && tone !== 'dark'
  if (needsPlate && opts.plate === false) {
    throw new RangeError(`brand.logo: brand "${brand.name}" has no dark logo file, so on a dark or accent ground the logo sits on a kraft plate; drop plate: false`)
  }
  const plate = opts.plate ?? needsPlate

  const doc = parent.ownerDocument
  const el = doc.createElement('div')
  el.className = plate ? 'brand-logo brand-logo--plate' : 'brand-logo'
  const img = doc.createElement('img')
  img.src = src
  img.alt = brand.name
  img.style.height = `${opts.height}px`
  el.appendChild(img)
  pin(el, opts.corner)
  parent.appendChild(el)
  return { el, img }
}
