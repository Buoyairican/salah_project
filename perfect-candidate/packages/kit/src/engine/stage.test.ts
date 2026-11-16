// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { computeScale, createStage } from './stage'

describe('computeScale', () => {
  it('fits width-limited and height-limited viewports', () => {
    expect(computeScale(1920, 1080)).toBe(1)
    expect(computeScale(1280, 720)).toBeCloseTo(2 / 3)
    expect(computeScale(800, 1000)).toBeCloseTo(800 / 1920)   // portrait: width limits
    expect(computeScale(3000, 1080)).toBe(1)                    // wide: height limits
    expect(computeScale(400, 300)).toBeCloseTo(400 / 1920)
  })
  it('returns 0 for degenerate sizes', () => {
    expect(computeScale(0, 1080)).toBe(0)
    expect(computeScale(1920, -5)).toBe(0)
  })
})

describe('createStage', () => {
  it('mounts viewport and stage and scales to the window', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 720, configurable: true })
    const root = document.createElement('div')
    document.body.appendChild(root)
    const stage = createStage(root)
    expect(root.querySelector('.deck-viewport > .deck-stage')).toBe(stage.el)
    expect(stage.scale).toBeCloseTo(2 / 3)
    expect(stage.el.style.transform).toMatch(/^scale\(0\.666/)

    Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 1080, configurable: true })
    window.dispatchEvent(new Event('resize'))
    expect(stage.scale).toBe(1)
    stage.destroy()
    expect(root.querySelector('.deck-viewport')).toBeNull()
  })
})
