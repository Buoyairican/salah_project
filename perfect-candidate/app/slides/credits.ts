import { defineSlide } from '@deck/kit'
import { gsap } from 'gsap'
import { cast, credits } from '../content/cast'
import { experts } from '../content/experts'
import { el } from '../src/dom'
import { world } from '../src/world/world'
import { howFrom } from './common'

/** After the bow: the cast, and thanks to the professionals who answered. */
export default defineSlide({
  id: 'credits',
  claim: 'Credits: the cast and the professionals who answered.',
  notes: 'After the bow. The end.',
  transition: 'fade',
  build({ stage, tl }) {
    const box = el('div', 'cr', stage)
    const title = el('div', 'cr-title', box)
    title.textContent = 'The Perfect Candidate'
    const cols = el('div', 'cr-cols', box)
    const castCol = el('div', 'cr-col', cols)
    el('h3', '', castCol).textContent = 'Cast'
    const rows: HTMLElement[] = []
    for (const c of cast) {
      const row = el('div', 'cr-row', castCol)
      el('span', 'cr-role', row).textContent = c.role
      el('span', 'cr-actor', row).textContent = c.actor
      rows.push(row)
    }
    const script = el('div', 'cr-row', castCol)
    el('span', 'cr-role', script).textContent = 'Script'
    el('span', 'cr-actor', script).textContent = credits.script
    rows.push(script)
    const thanks = el('div', 'cr-col cr-thanks', cols)
    el('h3', '', thanks).textContent = 'With thanks to'
    for (const x of experts) {
      const row = el('div', 'cr-row', thanks)
      const who = x.person.name ? `${x.person.name}` : x.person.jobTitle
      el('span', 'cr-actor', row).textContent = who + (x.example ? ' (example)' : '')
      el('span', 'cr-role', row).textContent = x.person.name ? `${x.person.jobTitle} · ${x.person.company}` : x.person.company
      ;(row.firstChild as HTMLElement).style.textAlign = 'left'
      rows.push(row)
    }
    const foot = el('div', 'cr-foot', box)
    foot.textContent = credits.school
    tl.fromTo(title, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.4, ease: 'expo.out' }, 0.3)
    tl.fromTo(cols.querySelectorAll('h3'), { opacity: 0 }, { opacity: 1, duration: 0.8, stagger: 0.1 }, 0.6)
    tl.fromTo(rows, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.05 }, 0.7)
    tl.fromTo(foot, { opacity: 0 }, { opacity: 1, duration: 1 }, 1.6)
    gsap.set(foot, { opacity: 0 })
    tl.addLabel('step-0')
  },
  enter({ direction }) {
    world.go({ mode: 'credits', scene: 7, filled: 7 }, howFrom(direction))
  },
})
