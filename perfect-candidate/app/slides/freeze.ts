import { defineSlide, type SlideDefinition } from '@deck/kit'
import type { Scene } from '../content/scenes'
import { el, maskedWords } from '../src/dom'
import { sound } from '../src/sound'
import { world } from '../src/world/world'
import { howFrom, rise } from './common'

/**
 * « Freeze! »: the press lands on the word. In the same instant the freeze sound hits, the screen flashes and turns
 * to ice, everything in the room stops (dust, light, clock), and FREEZE stamps itself in the middle, with the line
 * that caused it, held like a paused frame.
 */
export function freezeSlide(scene: Scene): SlideDefinition {
  return defineSlide({
    id: `scene-${scene.n}-freeze`,
    claim: `Freeze on scene ${scene.n}, ${scene.title}: “${scene.moment.line}”`,
    notes: `Scene ${scene.n}. You just said “Freeze!”. Now say: “${scene.narrator}” PRESS on the last words: “${scene.videoCue}”`,
    transition: 'cut',
    build({ stage, tl }) {
      const box = el('div', 'fz', stage)
      const corners = el('div', 'fz-corners', box)
      for (let i = 0; i < 4; i++) el('i', '', corners)
      const ghostA = el('div', 'fz-word fz-ghost', box)
      const ghostB = el('div', 'fz-word fz-ghost', box)
      const word = el('div', 'fz-word', box)
      ghostA.textContent = ghostB.textContent = word.textContent = 'FREEZE'
      const quote = el('div', 'fz-quote', box)
      const line = el('div', 'fz-line', quote)
      const words = maskedWords(line, `“${scene.moment.line}”`)
      const who = el('div', 'fz-who', quote)
      who.textContent = `— ${scene.moment.who}`

      // The stamp: the word lands from slightly too big, its two ghosts snap in from the sides (a camera shake
      // caught at the moment of the pause), the viewfinder closes around it.
      tl.fromTo(word, { opacity: 0 }, { opacity: 1, duration: 0.04 }, 0)
      tl.fromTo(word, { scale: 1.28, letterSpacing: '0.34em' }, { scale: 1, letterSpacing: '0.1em', duration: 0.7, ease: 'expo.out' }, 0)
      tl.fromTo(ghostA, { opacity: 0.9, x: -46, scale: 1.28, letterSpacing: '0.34em' }, { opacity: 0, x: 0, scale: 1, letterSpacing: '0.1em', duration: 0.6, ease: 'expo.out' }, 0)
      tl.fromTo(ghostB, { opacity: 0.9, x: 46, scale: 1.28, letterSpacing: '0.34em' }, { opacity: 0, x: 0, scale: 1, letterSpacing: '0.1em', duration: 0.6, ease: 'expo.out' }, 0)
      tl.fromTo(corners, { opacity: 0, scale: 1.14 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'expo.out' }, 0.04)
      rise(tl, words, 0.45, { duration: 1.1, stagger: 0.05 })
      tl.fromTo(who, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' }, 0.85)
      tl.addLabel('step-0')
    },
    enter({ direction }) {
      if (direction === 'forward') sound.play('freeze')
      else sound.stopAll()
      world.go({ mode: 'frozen', scene: scene.n, filled: scene.n - 1 }, howFrom(direction))
    },
  })
}
