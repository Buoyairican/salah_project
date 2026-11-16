import { defineSlide } from '@deck/kit'
import { el } from '../src/dom'
import { world } from '../src/world/world'
import { howFrom } from './common'

const SPEAKER =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'

/**
 * Before the audience comes in. One press here turns the sound on (browsers need a press first) and opens the
 * title with a soft whoosh: if you hear it, the sound works.
 */
export default defineSlide({
  id: 'preshow',
  claim: 'Before the show: press once, the sound check plays and the title opens.',
  notes: 'Before the audience comes in. Press once: you should hear a soft whoosh as the title appears.',
  transition: 'fade',
  build({ stage, tl }) {
    const box = el('div', 'center-stack pre', stage)
    el('div', 'pre-title', box).textContent = 'The Perfect Candidate'
    const hint = el('div', 'pre-hint', box)
    hint.innerHTML = SPEAKER
    el('span', '', hint).textContent = 'Sound check · press once to begin'
    tl.fromTo(box, { opacity: 0 }, { opacity: 1, duration: 1.2 })
    tl.addLabel('step-0')
  },
  enter({ direction }) {
    world.go({ mode: 'preshow', scene: 1, filled: 0 }, howFrom(direction))
  },
})
