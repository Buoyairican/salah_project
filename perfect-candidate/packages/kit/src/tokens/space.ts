export const space = { 1: 8, 2: 16, 3: 24, 4: 32, 6: 48, 8: 64, 12: 96, 16: 128, 24: 192 } as const
export type SpaceToken = keyof typeof space

export const radius = { s: 8, m: 16, l: 24, pill: 999 } as const
export type RadiusToken = keyof typeof radius
