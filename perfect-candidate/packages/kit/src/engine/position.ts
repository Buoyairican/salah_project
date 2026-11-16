export interface DeckPosition {
  slide: number
  step: number
}

export function nextPosition(pos: DeckPosition, stepCounts: number[]): DeckPosition | null {
  const count = stepCounts[pos.slide]
  if (count === undefined) return null
  if (pos.step < count - 1) return { slide: pos.slide, step: pos.step + 1 }
  if (pos.slide < stepCounts.length - 1) return { slide: pos.slide + 1, step: 0 }
  return null
}

export function prevPosition(pos: DeckPosition, stepCounts: number[]): DeckPosition | null {
  if (pos.step > 0) return { slide: pos.slide, step: pos.step - 1 }
  if (pos.slide > 0) {
    const prevCount = stepCounts[pos.slide - 1] ?? 1
    return { slide: pos.slide - 1, step: prevCount - 1 }
  }
  return null
}

const toInt = (n: number) => (Number.isFinite(n) ? Math.floor(n) : 0)

export function clampPosition(pos: DeckPosition, stepCounts: number[]): DeckPosition {
  if (stepCounts.length === 0) return { slide: 0, step: 0 }
  const slide = Math.min(Math.max(0, toInt(pos.slide)), stepCounts.length - 1)
  const count = stepCounts[slide] ?? 1
  const step = Math.min(Math.max(0, toInt(pos.step)), count - 1)
  return { slide, step }
}
