import { describe, it, expect } from 'vitest'
import { fontsReady } from './fonts'

function fakeDoc(load: () => Promise<unknown>, ready: Promise<unknown>) {
  return { fonts: { load, ready } } as unknown as Document
}

describe('fontsReady', () => {
  it('resolves true when every family loads', async () => {
    const doc = fakeDoc(() => Promise.resolve([{}]), Promise.resolve())
    expect(await fontsReady(['A', 'B'], doc, 100)).toBe(true)
  })
  it('resolves false within the guard when fonts never load', async () => {
    const never = new Promise(() => {})
    const doc = fakeDoc(() => never, never)
    const started = performance.now()
    expect(await fontsReady(['A'], doc, 30)).toBe(false)
    expect(performance.now() - started).toBeLessThan(500)
  })
  it('resolves false when load rejects or document.fonts is missing', async () => {
    const doc = fakeDoc(() => Promise.reject(new Error('404')), Promise.resolve())
    expect(await fontsReady(['A'], doc, 100)).toBe(false)
    expect(await fontsReady(['A'], {} as Document, 100)).toBe(false)
  })
})
