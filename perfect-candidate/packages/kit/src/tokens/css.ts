import { typeScale } from './type'
import { space, radius } from './space'
import { durations } from './motion'
import { shadows } from './shadow'
import { STAGE, SAFE } from './stage'

export function tokensToCss(): string {
  const lines: string[] = []
  lines.push(`--stage-w: ${STAGE.width}px`, `--stage-h: ${STAGE.height}px`)
  lines.push(`--safe-x: ${SAFE.x}px`, `--safe-y: ${SAFE.y}px`, `--safe-w: ${SAFE.width}px`, `--safe-h: ${SAFE.height}px`)
  for (const [level, v] of Object.entries(typeScale)) {
    lines.push(`--type-${level}-size: ${v.size}px`, `--type-${level}-lh: ${v.lineHeight}`, `--type-${level}-ls: ${v.tracking}em`)
  }
  for (const [k, v] of Object.entries(space)) lines.push(`--space-${k}: ${v}px`)
  for (const [k, v] of Object.entries(radius)) lines.push(`--radius-${k}: ${v}px`)
  for (const [k, v] of Object.entries(durations)) lines.push(`--dur-${k}: ${v}s`)
  for (const [k, v] of Object.entries(shadows)) lines.push(`--shadow-${k}: ${v}`)
  return `:root {\n  ${lines.join(';\n  ')};\n}\n`
}
