import { describe, it, expect } from 'vitest'
import { imagesReady } from './media'

type Listener = () => void
interface FakeImg {
  complete: boolean
  naturalWidth: number
  decode?: () => Promise<void>
  addEventListener(type: string, fn: Listener): void
  fire(type: 'load' | 'error'): void
}

function img(state: Partial<Pick<FakeImg, 'complete' | 'naturalWidth' | 'decode'>> = {}): FakeImg {
  const listeners: Record<string, Listener[]> = {}
  return {
    complete: false,
    naturalWidth: 0,
    ...state,
    addEventListener(type, fn) {
      ;(listeners[type] ??= []).push(fn)
    },
    fire(type) {
      for (const fn of listeners[type] ?? []) fn()
    },
  }
}
const root = (...imgs: FakeImg[]) => ({ querySelectorAll: () => imgs }) as unknown as ParentNode

describe('imagesReady', () => {
  it('resolves true at once when there are no images', async () => {
    expect(await imagesReady(root(), 50)).toBe(true)
  })
  it('waits for loading images and decodes them', async () => {
    const decoded: string[] = []
    const a = img({ complete: true, naturalWidth: 10, decode: async () => void decoded.push('a') })
    const b = img({ decode: async () => void decoded.push('b') })
    const done = imagesReady(root(a, b), 500)
    b.fire('load')
    expect(await done).toBe(true)
    expect(decoded.sort()).toEqual(['a', 'b'])
  })
  it('falls back to naturalWidth when decode is missing', async () => {
    expect(await imagesReady(root(img({ complete: true, naturalWidth: 10 })), 50)).toBe(true)
    expect(await imagesReady(root(img({ complete: true, naturalWidth: 0 })), 50)).toBe(false)
  })
  it('resolves false on an error, a failed decode, or within the guard, and never rejects', async () => {
    const broken = img()
    const done = imagesReady(root(broken), 500)
    broken.fire('error')
    expect(await done).toBe(false)
    expect(await imagesReady(root(img({ complete: true, decode: () => Promise.reject(new Error('bad')) })), 50)).toBe(false)
    const started = performance.now()
    expect(await imagesReady(root(img()), 30)).toBe(false)
    expect(performance.now() - started).toBeLessThan(500)
  })
})
