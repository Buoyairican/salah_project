import { defineSlide } from '@deck/kit'
import { el, maskedWords } from '../src/dom'
import { world } from '../src/world/world'
import { fadeUp, howFrom, rise } from './common'

/** The last question, for the bow. The board regroups: the candidate's lessons, then the jury's, which light up. */
export default defineSlide({
  id: 'final',
  claim: 'Who is really being interviewed?',
  notes: 'PRESS on your last words: “…not the only ones being interviewed.” Stays up for the bow.',
  transition: 'fade',
  build({ stage, tl }) {
    const box = el('div', 'center-stack fin', stage)
    const kicker = el('div', 'eyebrow-mono fin-kicker', box)
    kicker.textContent = 'Two candidates · the same jury'
    const q = el('div', 'fin-q', box)
    const l1 = el('div', '', q)
    const l2 = el('div', '', q)
    const w1 = maskedWords(l1, 'Who is really')
    const em = el('em', '', l2)
    const w2 = maskedWords(em, 'being interviewed?')
    fadeUp(tl, kicker, 0.9, 10, 1.2)
    rise(tl, [...w1, ...w2], 1.2, { duration: 1.6, stagger: 0.13 })
    tl.addLabel('step-0')
  },
  enter({ direction }) {
    world.go({ mode: 'final', scene: 7, filled: 7 }, howFrom(direction))
  },
})
