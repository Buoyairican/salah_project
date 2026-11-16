// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { bindKeyboard, type KeyboardTarget } from './keyboard'
import type { Deck } from './deck'

// Compile-time guarantee that the real Deck satisfies the keyboard contract.
export type DeckIsKeyboardTarget = Deck extends KeyboardTarget ? true : never
const deckOk: DeckIsKeyboardTarget = true
void deckOk

function target(): KeyboardTarget {
  let black = false
  return {
    next: vi.fn(async () => {}),
    prev: vi.fn(async () => {}),
    goTo: vi.fn(async () => {}),
    stepCounts: [2, 3, 1],
    toggleBlack: vi.fn(() => {
      black = !black
    }),
    isBlack: () => black,
  }
}
const press = (key: string, init: KeyboardEventInit = {}) => {
  const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  window.dispatchEvent(e)
  return e
}

describe('bindKeyboard', () => {
  it('maps forward and backward keys and prevents default', () => {
    const d = target()
    const unbind = bindKeyboard(d)
    for (const k of ['Enter', ' ', 'ArrowRight', 'PageDown']) expect(press(k).defaultPrevented).toBe(true)
    for (const k of ['Backspace', 'ArrowLeft', 'PageUp']) expect(press(k).defaultPrevented).toBe(true)
    expect(d.next).toHaveBeenCalledTimes(4)
    expect(d.prev).toHaveBeenCalledTimes(3)
    unbind()
    press('Enter')
    expect(d.next).toHaveBeenCalledTimes(4)
  })
  it('Home and End jump to the ends', () => {
    const d = target()
    const unbind = bindKeyboard(d)
    press('Home')
    expect(d.goTo).toHaveBeenLastCalledWith({ slide: 0, step: 0 })
    press('End')
    expect(d.goTo).toHaveBeenLastCalledWith({ slide: 2, step: 0 })
    unbind()
  })
  it('digits then Enter jump to a 1-based slide', () => {
    const d = target()
    const unbind = bindKeyboard(d)
    press('1')
    press('2')
    press('Enter')
    expect(d.goTo).toHaveBeenLastCalledWith({ slide: 11, step: 0 })
    expect(d.next).not.toHaveBeenCalled()
    unbind()
  })
  it('forgets digits after the timeout', () => {
    vi.useFakeTimers()
    const d = target()
    const unbind = bindKeyboard(d, { digitTimeoutMs: 100 })
    press('3')
    vi.advanceTimersByTime(150)
    press('Enter')
    expect(d.goTo).not.toHaveBeenCalled()
    expect(d.next).toHaveBeenCalledTimes(1)
    unbind()
    vi.useRealTimers()
  })
  it('B toggles black and modified keys pass through', () => {
    const d = target()
    const unbind = bindKeyboard(d)
    press('b')
    press('B')
    expect(d.toggleBlack).toHaveBeenCalledTimes(2)
    expect(press('Enter', { ctrlKey: true }).defaultPrevented).toBe(false)
    expect(d.next).not.toHaveBeenCalled()
    unbind()
  })
  it('an advance or back key on the black screen lifts the black without moving', () => {
    const d = target()
    const unbind = bindKeyboard(d)
    for (const k of ['Enter', ' ', 'ArrowRight', 'PageDown', 'Backspace', 'ArrowLeft', 'PageUp']) {
      press('b')
      expect(d.isBlack()).toBe(true)
      expect(press(k).defaultPrevented).toBe(true)
      expect(d.isBlack()).toBe(false)
    }
    expect(d.next).not.toHaveBeenCalled()
    expect(d.prev).not.toHaveBeenCalled()
    press('Enter')
    press('Backspace')
    expect(d.next).toHaveBeenCalledTimes(1) // once the black is off, keys move again
    expect(d.prev).toHaveBeenCalledTimes(1)
    unbind()
  })
  it('F requests fullscreen, and exits it when already fullscreen', () => {
    const d = target()
    const request = vi.fn(async () => {})
    const exit = vi.fn(async () => {})
    const el = document.documentElement as HTMLElement & { requestFullscreen: () => Promise<void> }
    el.requestFullscreen = request
    ;(document as unknown as { exitFullscreen: () => Promise<void> }).exitFullscreen = exit
    const unbind = bindKeyboard(d)
    expect(press('f').defaultPrevented).toBe(true)
    expect(request).toHaveBeenCalledTimes(1)
    Object.defineProperty(document, 'fullscreenElement', { value: el, configurable: true })
    press('F')
    expect(exit).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledTimes(1)
    Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true })
    unbind()
  })
})

describe('bindKeyboard guards', () => {
  it('counts a quick second advance once, then accepts the next after the guard', () => {
    const d = target()
    let t = 1000
    const unbind = bindKeyboard(d, { advanceGuardMs: 700, now: () => t })
    press('PageDown')
    t += 200
    press('PageDown')
    expect(d.next).toHaveBeenCalledTimes(1)
    t += 600
    press('PageDown')
    expect(d.next).toHaveBeenCalledTimes(2)
    press('PageUp')
    press('PageUp')
    expect(d.prev).toHaveBeenCalledTimes(2)
    unbind()
  })

  it('ignores auto-repeat from a held key', () => {
    const d = target()
    const unbind = bindKeyboard(d)
    press('ArrowRight')
    press('ArrowRight', { repeat: true })
    press('ArrowLeft', { repeat: true })
    expect(d.next).toHaveBeenCalledTimes(1)
    expect(d.prev).toHaveBeenCalledTimes(0)
    unbind()
  })

  it('swallows F5 when asked, and lets the clicker blank key black the screen', () => {
    const d = target()
    const unbind = bindKeyboard(d, { blockReloadKey: true })
    expect(press('F5').defaultPrevented).toBe(true)
    press('.')
    expect(d.isBlack()).toBe(true)
    unbind()
  })
})
