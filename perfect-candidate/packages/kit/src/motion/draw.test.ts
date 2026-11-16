// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { gsap } from 'gsap'
import { draw } from './draw'
import { circuit } from '../components/circuit'
import type { MotionContext } from './types'

const ctx: MotionContext = { brandTempo: 1, slideTempo: 'normal', reduced: false, risk: [], emphasisEase: 'back.out(1.2)' }
const offset = (el: Element) => Number(el.getAttribute('stroke-dashoffset'))

describe('draw', () => {
  it('draws a path on by its normalised length over l on the enter ease, and undraws when scrubbed back', () => {
    const c = circuit(document.body, { width: 960, nodes: 2 })
    const tl = gsap.timeline({ paused: true })
    const child = draw(ctx, tl, c.path)
    expect(child.duration()).toBeCloseTo(0.8, 5)
    expect(child.getChildren()[0]!.vars.ease).toBe('expo.out')
    expect(c.path.getAttribute('stroke-dasharray')).toBe('1 2')
    tl.progress(1)
    expect(offset(c.path)).toBe(0)
    tl.progress(0)
    expect(offset(c.path)).toBe(1)
  })
  it('normalises a path without pathLength, and respects one that has it', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const bare = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    const sized = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    sized.setAttribute('pathLength', '100')
    svg.append(bare, sized)
    document.body.appendChild(svg)
    const tl = gsap.timeline({ paused: true })
    draw(ctx, tl, bare)
    draw(ctx, tl, sized)
    expect(bare.getAttribute('pathLength')).toBe('1')
    expect(sized.getAttribute('stroke-dasharray')).toBe('100 200')
    tl.progress(1)
    tl.progress(0)
    expect(offset(sized)).toBe(100)
  })
  it('fades the whole path in over xs when reduced, without dashing it', () => {
    const c = circuit(document.body, { width: 480, nodes: 2 })
    const tl = gsap.timeline({ paused: true })
    const child = draw({ ...ctx, reduced: true }, tl, c.path, { at: 0 })
    expect(child.duration()).toBeCloseTo(0.15, 5)
    expect(c.path.hasAttribute('stroke-dasharray')).toBe(false)
    tl.progress(1)
    tl.progress(0)
    expect(Number(gsap.getProperty(c.path, 'opacity'))).toBe(0)
    tl.progress(1)
    expect(Number(gsap.getProperty(c.path, 'opacity'))).toBe(1)
  })
})
