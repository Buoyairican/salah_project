export const typeScale = {
  hero: { size: 240, lineHeight: 1.0, tracking: -0.035 },
  'display-1': { size: 160, lineHeight: 1.04, tracking: -0.03 },
  'display-2': { size: 120, lineHeight: 1.08, tracking: -0.025 },
  h1: { size: 88, lineHeight: 1.12, tracking: -0.02 },
  h2: { size: 64, lineHeight: 1.18, tracking: -0.015 },
  h3: { size: 44, lineHeight: 1.24, tracking: -0.01 },
  body: { size: 32, lineHeight: 1.45, tracking: 0 },
  caption: { size: 24, lineHeight: 1.5, tracking: 0.01 },
} as const

export type TypeLevel = keyof typeof typeScale
export const MIN_TEXT_SIZE = 24
