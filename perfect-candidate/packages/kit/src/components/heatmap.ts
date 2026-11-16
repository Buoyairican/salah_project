import { createBadge } from './badge'
import { stringsFor } from './strings'
import type { ComponentsOptions, HeatmapHandle, HeatmapOptions } from './types'

const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0)

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function channelLuminance(c: number): number {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

/** Linear interpolation across the brand's risk stops. `rgb` gives the channels for translucent fills. */
export function riskColor(stops: string[], value: number): { css: string; rgb: [number, number, number]; luminance: number } {
  const v = clamp01(value)
  const segments = stops.length - 1
  const pos = v * segments
  const i = Math.min(Math.floor(pos), segments - 1)
  const f = pos - i
  const a = hexToRgb(stops[i]!)
  const b = hexToRgb(stops[i + 1]!)
  const rgb = a.map((ch, k) => Math.round(ch + (b[k]! - ch) * f)) as [number, number, number]
  const [r, g, bl] = rgb
  const luminance = 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(bl)
  return { css: `rgb(${r}, ${g}, ${bl})`, rgb, luminance }
}

const STYLES: readonly NonNullable<HeatmapOptions['style']>[] = ['solid', 'glass']

export function heatmap(parent: HTMLElement, opts: HeatmapOptions, ctx: ComponentsOptions): HeatmapHandle {
  const { rows, cols, labels } = opts
  const total = rows * cols
  if (labels.length !== total) {
    throw new RangeError(`heatmap: ${labels.length} labels for a ${rows}×${cols} grid (${total} cells)`)
  }
  const style = opts.style ?? 'solid'
  if (!STYLES.includes(style)) throw new RangeError(`heatmap: style "${style}" must be one of ${STYLES.join(', ')}`)
  const strings = stringsFor(ctx.language)
  const doc = parent.ownerDocument
  const mk = (cls: string, tag = 'div') => {
    const el = doc.createElement(tag)
    el.className = cls
    return el
  }

  const wrap = mk(style === 'glass' ? 'hm-wrap hm--glass' : 'hm-wrap')
  const grid = mk('hm')
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`
  grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`

  const ids: string[] = []
  const cells: HTMLElement[] = []
  const values: HTMLElement[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c
      const id = opts.ids?.[i] ?? `r${r}c${c}`
      const cell = mk('hm-cell')
      cell.dataset.cellId = id
      const label = mk('hm-cell-label', 'span')
      label.textContent = labels[i]!
      const value = mk('hm-cell-value', 'span')
      value.textContent = '–'
      cell.append(label, value)
      grid.appendChild(cell)
      ids.push(id)
      cells.push(cell)
      values.push(value)
    }
  }

  const legend = mk('hm-legend')
  const low = mk('hm-legend-label', 'span')
  low.textContent = strings.low
  legend.appendChild(low)
  for (let i = 0; i < 5; i++) {
    const sw = mk('hm-swatch', 'span')
    sw.style.background = `var(--risk-${i})`
    legend.appendChild(sw)
  }
  const high = mk('hm-legend-label', 'span')
  high.textContent = strings.high
  legend.appendChild(high)

  let badge: HTMLElement | null = null
  if (opts.illustrative) badge = createBadge(doc, strings.badge, 'hm-badge', 'div')

  wrap.append(grid, legend)
  if (badge) wrap.appendChild(badge)
  parent.appendChild(wrap)

  return {
    el: wrap,
    ids,
    cells,
    values,
    legend,
    badge,
    cell(id: string) {
      const i = ids.indexOf(id)
      if (i < 0) throw new RangeError(`heatmap: no cell "${id}" (have ${ids.join(', ')})`)
      return cells[i]!
    },
  }
}
