import type { TypeLevel } from '../tokens/type'
import type { RadiusToken, SpaceToken } from '../tokens/space'
import type { BrandTheme } from '../brand/types'

export interface Handle {
  el: HTMLElement
}
export interface TextHandle extends Handle {
  lines: HTMLElement[]
  words: HTMLElement[]
  level: TypeLevel
}
export interface SplitHandle extends Handle {
  left: HTMLElement
  right: HTMLElement
}
export interface HeatmapHandle extends Handle {
  ids: string[]
  cells: HTMLElement[]
  values: HTMLElement[]
  cell(id: string): HTMLElement
  legend: HTMLElement
  badge: HTMLElement | null
}
export interface HeatmapOptions {
  rows: number
  cols: number
  labels: string[]
  ids?: string[]
  illustrative?: boolean
  /** `glass` adds `hm--glass`: translucent cells with kraft text and a top edge that `heat` colours, for dark grounds. */
  style?: 'solid' | 'glass'
}

/** Stage-filling grounds. `accent` gets `on-accent`, `deep` and `gradient` get `on-dark`; all three set kraft text. */
export type Ground = 'bg' | 'surface' | 'accent' | 'deep' | 'gradient'
export interface FullBleedHandle extends Handle {
  /** A `.safe` child: the safe area of the stage, where layouts and text go. */
  content: HTMLElement
  ground: Ground
}

/** A corner of the safe area. Pinned components sit there whether their parent is the stage, a fullBleed or a `.safe` region. */
export type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export type RuleColor = 'highlight' | 'accent' | 'line'

export interface StatementOptions {
  /** The number the statement stands for. The visible value starts at "–"; `count` writes the numbers. */
  value: number
  unit?: string
  caption: string
  illustrative?: boolean
}
export interface StatementHandle extends Handle {
  /** The visible number, "–" until `count` writes it. */
  value: HTMLElement
  caption: TextHandle
  badge: HTMLElement | null
  /** The unit `count` appends by default, or null. */
  unit: string | null
}

export interface FlowStep {
  n: string
  label: string
  tag?: string
  /** `accent` makes this step a forest card with kraft text and a highlight chip (card style). Default `surface`. */
  ground?: 'surface' | 'accent'
}
export interface FlowOptions {
  steps: FlowStep[]
  /** `card` (default): surface cards. `plain`: no card, a hairline above each step, colours inherited from the ground. */
  style?: 'card' | 'plain'
}
export interface FlowHandle extends Handle {
  steps: HTMLElement[]
  step(i: number): HTMLElement
  chips: HTMLElement[]
  labels: HTMLElement[]
  tags: (HTMLElement | null)[]
}

export type LogoVariant = 'mark' | 'side' | 'down'
export type LogoHeight = 48 | 72 | 96 | 144 | 240
export interface LogoOptions {
  /** `mark` uses logo.mark, `side` logo.light (the horizontal lockup), `down` logo.stacked. */
  variant: LogoVariant
  /** Stage px. Lockups (`side`, `down`) start at 72. */
  height: LogoHeight
  /** Which file to use. `auto` (default) picks the dark file on an `on-dark` or `on-accent` ground and the light file elsewhere. */
  tone?: 'auto' | 'light' | 'dark'
  /** A kraft plate behind the logo. Opt-in anywhere; applied by default only on a dark ground when the brand ships no dark file, where `false` is then refused. */
  plate?: boolean
  corner?: Corner
}
export interface LogoHandle extends Handle {
  img: HTMLImageElement
}

export interface CircuitOptions {
  /** Stage px, at least 192. */
  width: number
  nodes: 2 | 3
  corner?: Corner
}
export interface CircuitHandle extends Handle {
  svg: SVGSVGElement
  /** The trace, with pathLength 1, for `draw`. */
  path: SVGPathElement
  nodes: SVGCircleElement[]
}

export interface GlowOptions {
  /** Centre and diameter in stage px, relative to the parent (use a fullBleed's el, or the stage when the slide has no ground; given a stage that holds a fullBleed, the glow is placed inside that ground). */
  x: number
  y: number
  size: number
  color?: 'highlight' | 'accent'
}

export type MeshTone = 'deep' | 'kraft'
export interface MeshOptions {
  /** `deep` (default): forest-led fields over `--color-deep`, for a `deep` fullBleed. `kraft`: soft fields over `--color-bg`, for a `bg` fullBleed with ink text. */
  tone?: MeshTone
  /** An integer: blob sizes, places and colour order derive from it. Default 1. Give every slide its own. */
  seed?: number
  /** 3..6, default 5. */
  blobs?: number
}
export interface MeshHandle extends Handle {
  /** The colour fields, for `m.ambient(mesh.blobs, 'drift', ...)`. */
  blobs: HTMLElement[]
}

export interface PanelOptions {
  /** Glass: translucent white, backdrop blur, white hairline, top highlight and deep shadow, radius l. For dark grounds. */
  glass?: boolean
  padding?: SpaceToken
  radius?: RadiusToken
  /** The solid panel carries --shadow-soft unless this is false. Ignored for glass. */
  shadow?: boolean
}

export interface ComponentsOptions {
  language: string
  /** Needed by `brand.logo` only. */
  brand?: Pick<BrandTheme, 'name' | 'logo'>
}

export interface Components {
  layout: {
    split(parent: HTMLElement, opts?: { ratio?: number; gap?: SpaceToken }): SplitHandle
    center(parent: HTMLElement): Handle
    fullBleed(parent: HTMLElement, opts: { ground: Ground }): FullBleedHandle
  }
  heading(parent: HTMLElement, text: string, opts?: { level?: TypeLevel }): TextHandle
  text(parent: HTMLElement, text: string, opts?: { size?: 'body' | 'caption'; muted?: boolean }): TextHandle
  eyebrow(parent: HTMLElement, text: string): TextHandle
  heatmap(parent: HTMLElement, opts: HeatmapOptions): HeatmapHandle
  statement(parent: HTMLElement, opts: StatementOptions): StatementHandle
  flow(parent: HTMLElement, opts: FlowOptions): FlowHandle
  badge(parent: HTMLElement, text: string): Handle
  rule(parent: HTMLElement, opts?: { color?: RuleColor }): Handle
  footer(parent: HTMLElement, text: string, opts?: { corner?: 'bottom-left' | 'bottom-right' }): Handle
  circuit(parent: HTMLElement, opts: CircuitOptions): CircuitHandle
  glow(parent: HTMLElement, opts: GlowOptions): Handle
  mesh(parent: HTMLElement, opts?: MeshOptions): MeshHandle
  panel(parent: HTMLElement, opts?: PanelOptions): Handle
  brand: {
    logo(parent: HTMLElement, opts: LogoOptions): LogoHandle
  }
}
