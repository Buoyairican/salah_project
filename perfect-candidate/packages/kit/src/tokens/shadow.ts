/** Elevation shadows. `soft` lifts a card off a light ground; `deep` sits a glass panel on a dark one. */
export const shadows = {
  soft: '0 8px 24px rgba(15, 42, 25, 0.12)',
  deep: '0 24px 64px rgba(0, 0, 0, 0.35)',
} as const
export type ShadowToken = keyof typeof shadows
