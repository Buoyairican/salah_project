// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { gsap } from 'gsap'
import { createDeck } from './deck'
import { installTestApi } from './test-api'
import { defineSlide } from '../define-slide'
import { testBrand } from '../test/brand-fixture'

beforeAll(() => gsap.globalTimeline.timeScale(20))
afterAll(() => gsap.globalTimeline.timeScale(1))

const s = (id: string, steps: number) =>
  defineSlide({
    id,
    claim: id,
    build({ stage, tl }) {
      const b = stage.ownerDocument.createElement('div')
      stage.appendChild(b)
      tl.to(b, { x: 5, duration: 0.1 })
      tl.addLabel('step-0')
      for (let k = 1; k < steps; k++) {
        tl.to(b, { x: 5 * (k + 1), duration: 0.1 })
        tl.addLabel(`step-${k}`)
      }
    },
  })

describe('installTestApi', () => {
  it('exposes a window.__deck that drives the deck', async () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    const deck = createDeck({ config: { title: 't', language: 'fr', brand: testBrand }, slides: [s('a', 2), s('b', 1)], root, fontTimeoutMs: 10 })
    const api = installTestApi(deck)
    expect(window.__deck).toBe(api)
    await deck.mount()
    await api.ready
    expect(api.stepCounts()).toEqual([2, 1])
    expect(api.stepCount(0)).toBe(2)
    await api.goTo(0, 1)
    expect(api.state()).toEqual({ slide: 0, step: 1 })
    await api.next()
    expect(api.state()).toEqual({ slide: 1, step: 0 })
    await api.prev()
    expect(api.state()).toEqual({ slide: 0, step: 1 })
    expect(api.slideMeta(1).id).toBe('b')
    api.setAmbient(false)
    expect(deck.ambientEnabled).toBe(false)
    api.setAmbient(true)
    expect(deck.ambientEnabled).toBe(true)
    api.setSpeed(20)
    expect(gsap.globalTimeline.timeScale()).toBe(20)
  })
})
