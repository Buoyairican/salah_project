import { mulberry32 } from '../engine/prng'
import { STAGE } from '../tokens/stage'
import type { MeshHandle, MeshOptions, MeshTone } from './types'

const TONES: readonly MeshTone[] = ['deep', 'kraft']
const BLOBS_MIN = 3
const BLOBS_MAX = 6
const BLOBS_DEFAULT = 5
const SIZE_MIN = 900
const SIZE_MAX = 1400
/** Colour roles per tone, in components.css (`.mesh--<tone> .mesh-blob--1..5`), cycled over the blobs. */
const ROLES = 5

/** The leading backdrop of `host`: a mesh painted first, or nothing. Glows go after it so the mesh does not hide them. */
export function leadingMesh(host: Element): Element | null {
  const first = host.firstElementChild
  return first?.classList.contains('mesh') ? first : null
}

/**
 * A mesh backdrop: the ground colour of the tone with soft, blurred colour fields over it, for `ambient` to drift.
 * Inserted as the parent's first child, so everything else there paints above it; given a stage that holds a
 * fullBleed, it goes inside that ground (as a glow does), since the opaque ground would otherwise cover it. It adds
 * no context class: pair `fullBleed({ ground: 'deep' })` with tone `deep`, `fullBleed({ ground: 'bg' })` with `kraft`.
 *
 * Blobs are circles of 900–1400 stage px with a radial gradient and a static blur. Each owns a seeded column of the
 * stage, alternating between its upper and lower half, so the colour covers the stage instead of pooling.
 */
export function mesh(parent: HTMLElement, opts: MeshOptions = {}): MeshHandle {
  const tone = opts.tone ?? 'deep'
  if (!TONES.includes(tone)) throw new RangeError(`mesh: tone "${tone}" must be one of ${TONES.join(', ')}`)
  const count = opts.blobs ?? BLOBS_DEFAULT
  if (!(Number.isInteger(count) && count >= BLOBS_MIN && count <= BLOBS_MAX)) {
    throw new RangeError(`mesh: blobs ${count} must be an integer within ${BLOBS_MIN}..${BLOBS_MAX}`)
  }
  const seed = opts.seed ?? 1
  if (!Number.isInteger(seed)) throw new RangeError(`mesh: seed ${seed} must be an integer`)

  const doc = parent.ownerDocument
  const el = doc.createElement('div')
  el.className = `mesh mesh--${tone}`
  el.setAttribute('aria-hidden', 'true')

  const rng = mulberry32(seed)
  const columns = Array.from({ length: count }, (_, k) => k)
  for (let k = count - 1; k > 0; k--) {
    const j = Math.floor(rng() * (k + 1))
    ;[columns[k], columns[j]] = [columns[j]!, columns[k]!]
  }
  const upperFirst = rng() < 0.5
  const blobs = columns.map((column, k) => {
    const size = Math.round(SIZE_MIN + rng() * (SIZE_MAX - SIZE_MIN))
    const cx = ((column + 0.5 + (rng() - 0.5) * 0.5) / count) * STAGE.width
    const upper = (column % 2 === 0) === upperFirst
    const cy = ((upper ? 0.28 : 0.72) + (rng() - 0.5) * 0.24) * STAGE.height
    const blob = doc.createElement('div')
    blob.className = `mesh-blob mesh-blob--${(k % ROLES) + 1}`
    blob.style.width = `${size}px`
    blob.style.height = `${size}px`
    blob.style.left = `${Math.round(cx - size / 2)}px`
    blob.style.top = `${Math.round(cy - size / 2)}px`
    el.appendChild(blob)
    return blob
  })

  const ground = Array.from(parent.children).find((c) => c.classList.contains('layout-fullbleed'))
  const host = ground ?? parent
  host.insertBefore(el, host.firstChild)
  return { el, blobs }
}
