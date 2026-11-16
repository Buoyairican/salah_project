import type { Components, ComponentsOptions } from './types'
import { split, center, fullBleed } from './layout'
import { heading, text, eyebrow } from './text'
import { heatmap } from './heatmap'
import { statement } from './statement'
import { flow } from './flow'
import { badge } from './badge'
import { rule } from './rule'
import { footer } from './footer'
import { circuit } from './circuit'
import { glow } from './glow'
import { mesh } from './mesh'
import { panel } from './panel'
import { brandLogo } from './logo'

export function createComponents(opts: ComponentsOptions): Components {
  return {
    layout: { split, center, fullBleed },
    heading,
    text,
    eyebrow,
    heatmap: (parent, o) => heatmap(parent, o, opts),
    statement: (parent, o) => statement(parent, o, opts),
    flow,
    badge,
    rule,
    footer,
    circuit,
    glow,
    mesh,
    panel,
    brand: { logo: (parent, o) => brandLogo(parent, o, opts) },
  }
}

export { split, center, fullBleed, heading, text, eyebrow, heatmap, statement, flow, badge, rule, footer, circuit, glow, mesh, panel, brandLogo }
export { riskColor } from './heatmap'
export { formatValue, EMPTY_VALUE } from './statement'
export { LOGO_HEIGHTS, LOCKUP_MIN_HEIGHT } from './logo'
export { CIRCUIT_HEIGHT, CIRCUIT_MIN_WIDTH } from './circuit'
export { CORNERS } from './pin'
