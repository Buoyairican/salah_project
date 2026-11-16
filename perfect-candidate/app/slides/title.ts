import { defineSlide } from '@deck/kit'
import { el } from '../src/dom'
import { sound } from '../src/sound'
import { world } from '../src/world/world'
import { credits } from '../content/cast'
import { fadeUp, howFrom } from './common'

/** The title, on screen during the prologue. Arrives with the sound check; leaves with the Narrator's first press. */
export default defineSlide({
  id: 'title',
  claim: 'The Perfect Candidate: who is really being interviewed?',
  notes: 'Prologue. Stays up while the jury enters and the Narrator speaks. PRESS at the end of the Narrator’s sentence: “…not the one on the chair.”',
  transition: 'fade',
  build({ stage, tl }) {
    const box = el('div', 'center-stack title-wrap', stage)
    const eyebrow = el('div', 'eyebrow-mono title-eyebrow', box)
    const parts = [credits.company, 'Panel interview', 'Junior Network Technician']
    parts.forEach((p, i) => {
      if (i) el('b', '', eyebrow)
      el('span', '', eyebrow).textContent = p
    })
    const h = el('h1', 'title-main', box)
    const l1 = el('span', 'mask l1', h)
    const w1 = el('span', '', l1)
    w1.textContent = 'The Perfect'
    const l2 = el('span', 'mask l2', h)
    const w2 = el('em', '', l2)
    w2.textContent = 'Candidate'
    const sub = el('div', 'title-sub', box)
    sub.textContent = 'Who is really being interviewed?'
    const rule = el('div', 'title-rule', box)
    const foot = el('div', 'title-foot', box)
    foot.textContent = credits.school.replace(' · 2026', '')

    tl.fromTo([w1, w2], { yPercent: 105 }, { yPercent: 0, duration: 1.8, ease: 'expo.out', stagger: 0.22 }, 0.9)
    tl.fromTo([w1, w2], { opacity: 0 }, { opacity: 1, duration: 0.8, stagger: 0.22 }, 0.9)
    fadeUp(tl, eyebrow, 0.5, 10, 1.4)
    fadeUp(tl, sub, 1.9, 14, 1.4)
    tl.fromTo(rule, { scaleY: 0, transformOrigin: '50% 0%' }, { scaleY: 1, duration: 1.2, ease: 'expo.out' }, 2.3)
    fadeUp(tl, foot, 2.5, 8, 1.2)
    tl.addLabel('step-0')
    // Leaving: the title lifts away before the HUD takes the stage.
    tl.addLabel('exit')
    tl.to([eyebrow, sub, rule, foot], { opacity: 0, y: -16, duration: 0.5, ease: 'power2.in', stagger: 0.04 })
    tl.to(h, { opacity: 0, y: -30, filter: 'blur(8px)', duration: 0.6, ease: 'power2.in' }, '<0.05')
  },
  enter({ direction }) {
    if (direction === 'forward') sound.play('unfreeze', 0.8)
    world.go({ mode: 'title', scene: 1, filled: 0 }, howFrom(direction))
  },
})
