// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { KIT_VERSION } from './index'

describe('kit', () => {
  it('exposes a version', () => {
    expect(KIT_VERSION).toBe('0.1.0')
  })
})
