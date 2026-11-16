import type { Deck, SlideMeta } from './deck'
import type { DeckPosition } from './position'

export interface DeckTestApi {
  ready: Promise<void>
  goTo(slide: number, step: number): Promise<void>
  seekWithin(slide: number, step: number, progress: number): Promise<void>
  play(slide: number, step: number): Promise<number[]>
  next(): Promise<void>
  prev(): Promise<void>
  state(): DeckPosition
  stepCount(slide: number): number
  stepCounts(): number[]
  slideMeta(slide: number): SlideMeta
  setAmbient(on: boolean): void
  setSpeed(x: number): void
}

declare global {
  interface Window {
    __deck?: DeckTestApi
  }
}

export function installTestApi(deck: Deck, win: Window = window): DeckTestApi {
  const api: DeckTestApi = {
    ready: deck.ready,
    goTo: (slide, step) => deck.goTo({ slide, step }),
    seekWithin: (slide, step, progress) => deck.seekWithin({ slide, step }, progress),
    play: (slide, step) => deck.play({ slide, step }),
    next: () => deck.next(),
    prev: () => deck.prev(),
    state: () => ({ ...deck.position }),
    stepCount: (slide) => deck.stepCounts[slide] ?? 0,
    stepCounts: () => [...deck.stepCounts],
    slideMeta: (slide) => deck.slideMeta(slide),
    setAmbient: (on) => deck.setAmbient(on),
    setSpeed: (x) => deck.setSpeed(x),
  }
  win.__deck = api
  return api
}
