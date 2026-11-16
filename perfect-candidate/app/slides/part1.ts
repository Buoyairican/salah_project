import { defineSlide } from '@deck/kit'
import { gsap } from 'gsap'
import { el, run } from '../src/dom'
import { world } from '../src/world/world'
import { fadeUp, howFrom } from './common'

/**
 * Part 1 begins: a chapter card for a few seconds, then the stage is the actors'. The HUD shows Scene 1, the clock
 * starts at 9:15 and the lesson board waits, empty.
 */
let chapter: HTMLElement | null = null

export default defineSlide({
  id: 'part-1',
  claim: 'Part 1: Candidate 1, Ayoub. Scene 1, The Late Candidate.',
  notes: 'Prologue continues (Asmae: “It’s nine fifteen…”), then Scene 1. Next PRESS: when you say “Freeze!”.',
  transition: 'cut',
  build({ stage, tl }) {
    const box = el('div', 'center-stack chapter', stage)
    chapter = box
    el('div', 'eyebrow-mono chapter-kicker', box).textContent = 'Part 1'
    const main = el('div', 'chapter-main', box)
    main.innerHTML = 'Candidate <em>1</em>'
    el('div', 'chapter-sub', box).textContent = 'Ayoub'
    gsap.set(box, { opacity: 0 })
    tl.addLabel('step-0')
  },
  enter({ direction, signal }) {
    world.go({ mode: 'acting', scene: 1, filled: 0 }, howFrom(direction))
    const box = chapter
    if (!box) return
    gsap.set(box, { opacity: 0 })
    if (direction !== 'forward') return
    const [kicker, main, sub] = Array.from(box.children) as HTMLElement[]
    const tl = gsap.timeline({ paused: true })
    tl.set(box, { opacity: 1 }, 0.55)
    fadeUp(tl, kicker!, 0.6, 10, 1)
    fadeUp(tl, main!, 0.7, 30, 1.4)
    fadeUp(tl, sub!, 0.95, 20, 1.4)
    tl.to(box, { opacity: 0, y: -24, filter: 'blur(6px)', duration: 0.8, ease: 'power2.in' }, 4.4)
    tl.set(box, { y: 0, filter: 'none' })
    void run(tl, signal).then((done) => {
      if (!done) gsap.set(box, { opacity: 0, y: 0, filter: 'none' })
    })
  },
})
