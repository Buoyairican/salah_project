import { defineSlide } from '@deck/kit'
import { gsap } from 'gsap'
import { el, run } from '../src/dom'
import { world } from '../src/world/world'
import { fadeUp, howFrom } from './common'

let chapter: HTMLElement | null = null

/**
 * Part 2, one slide for all of it: morning light on the same room, « The Perfect Candidate » for a few seconds in
 * the middle, then in the corner for the rest of the part. The board checks the candidate's four lessons and leaves
 * the jury's three dim.
 */
export default defineSlide({
  id: 'part-2',
  claim: 'Part 2: The Perfect Candidate. Same jury, no freezes.',
  notes: 'PRESS on “Now, a new candidate: Aya.” Then say: “No freezes this time. No videos. Just watch.” No more presses until your very last sentence.',
  transition: 'fade',
  build({ stage, tl }) {
    const box = el('div', 'center-stack chapter warm', stage)
    chapter = box
    el('div', 'eyebrow-mono chapter-kicker', box).textContent = 'Part 2 · Candidate 2 — Aya'
    const main = el('div', 'chapter-main', box)
    main.innerHTML = 'The Perfect <em>Candidate</em>'
    el('div', 'chapter-sub', box).textContent = 'Same jury. No freezes.'
    gsap.set(box, { opacity: 0 })
    tl.addLabel('step-0')
  },
  enter({ direction, signal }) {
    world.go({ mode: 'part2', scene: 7, filled: 7 }, howFrom(direction))
    const box = chapter
    if (!box) return
    gsap.set(box, { opacity: 0 })
    if (direction !== 'forward') return
    const [kicker, main, sub] = Array.from(box.children) as HTMLElement[]
    const tl = gsap.timeline({ paused: true })
    tl.set(box, { opacity: 1 }, 0.4)
    fadeUp(tl, kicker!, 0.5, 10, 1.2)
    fadeUp(tl, main!, 0.7, 34, 1.8)
    fadeUp(tl, sub!, 1.3, 16, 1.4)
    tl.to(box, { opacity: 0, y: -26, filter: 'blur(6px)', duration: 0.9, ease: 'power2.in' }, 4.0)
    tl.set(box, { y: 0, filter: 'none' })
    void run(tl, signal).then((done) => {
      if (!done) gsap.set(box, { opacity: 0, y: 0, filter: 'none' })
    })
  },
})
