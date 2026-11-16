import { defineSlide, type SlideDefinition } from '@deck/kit'
import { gsap } from 'gsap'
import { subtitlesFor, waveformFor, type Expert } from '../content/experts'
import { scenes, type Scene } from '../content/scenes'
import { buildCard, type CardParts } from '../src/card'
import { anySignal, el, maskedWords, run, wait } from '../src/dom'
import { Player, setSkipHandler } from '../src/media/player'
import { sound } from '../src/sound'
import { world, type WorldState } from '../src/world/world'
import { CHECK_SVG } from '../src/world/hud'
import { howFrom, rise, stageScale } from './common'

/** Seconds the introduction card stays alone before the clip starts: time to read who is speaking. */
const INTRO_HOLD = 2.6
/** Seconds the lesson sentence stays on screen before it goes into the board. */
const LESSON_HOLD = 2.3

/**
 * The professional's answer, then the lesson, then the thaw. One press (on the Narrator's last words) starts it all;
 * presses are ignored until the room has thawed, so a double press can never skip the video. Back stops it and
 * returns to the freeze.
 *
 *   card ─▶ clip with subtitles ─▶ lesson ─▶ lesson flies into the board ─▶ unfreeze sound + thaw ─▶ acting
 */
export function expertSlide(scene: Scene, expert: Expert): SlideDefinition {
  let slideEl: HTMLElement | null = null
  let hero: CardParts
  let panel: CardParts
  let media: HTMLElement
  let player: Player
  let lessonBox: HTMLElement
  let lessonWords: HTMLElement[]
  let lessonEyebrow: HTMLElement
  let chipBox: HTMLElement
  let chip: HTMLElement
  let notice: HTMLElement
  let panelEl: HTMLElement

  const layout = expert.media.kind === 'video' && expert.media.orientation !== 'portrait' ? 'wide' : 'side'
  const settled: WorldState = { mode: 'acting', scene: Math.min(scene.n + 1, scenes.length), filled: scene.n }

  /** Everything off screen, the clip at its start. */
  const hideAll = () => {
    if (!slideEl) return
    gsap.killTweensOf(slideEl.querySelectorAll('*'))
    gsap.set([hero.root, media, panelEl, lessonBox, chipBox, notice], { opacity: 0, clearProps: 'transform,filter,clipPath' })
    gsap.set(chip, { clearProps: 'all' })
    player.reset()
  }

  async function sequence(signal: AbortSignal, release: () => void): Promise<void> {
    const ok = (p: Promise<boolean>) => p.then((v) => v && !signal.aborted)
    world.go({ mode: 'media', scene: scene.n, filled: scene.n - 1 }, 'animate')
    // S during the introduction skips straight to the lesson, like S during the clip.
    const skip = new AbortController()
    const introSignal = anySignal(signal, skip.signal)
    setSkipHandler(() => skip.abort())
    signal.addEventListener('abort', () => setSkipHandler(null), { once: true })

    // 1. Who is speaking.
    const intro = gsap.timeline({ paused: true })
    intro.set(hero.root, { opacity: 1 }, 0)
    intro.fromTo(hero.photo, { opacity: 0, scale: 0.86 }, { opacity: 1, scale: 1, duration: 1.2, ease: 'expo.out' }, 0.25)
    rise(intro, hero.name, 0.45, { duration: 1.1, stagger: 0.07 })
    intro.fromTo([hero.job, hero.company], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08 }, 0.7)
    intro.fromTo(hero.tags.children, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.07 }, 0.9)
    if (hero.link) intro.fromTo(hero.link, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' }, 1.05)
    await run(intro, introSignal)
    if (signal.aborted) return
    if (!skip.signal.aborted) await wait(INTRO_HOLD - 0.6, introSignal)
    if (signal.aborted) return
    const skipped = skip.signal.aborted

    // 2. The clip: the card steps aside, the picture opens from the centre.
    const open = gsap.timeline({ paused: true })
    open.to(hero.root, { opacity: 0, scale: 0.97, filter: 'blur(6px)', duration: 0.5, ease: 'power2.in' }, 0)
    open.set(media, { opacity: 1 }, 0.3)
    if (expert.media.kind === 'video') {
      open.fromTo(player.frame, { clipPath: 'inset(48% 48% 48% 48% round 22px)' }, { clipPath: 'inset(0% 0% 0% 0% round 22px)', duration: 1.0, ease: 'expo.inOut' }, 0.3)
    } else {
      open.fromTo(player.frame, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1.0, ease: 'expo.out' }, 0.3)
    }
    open.fromTo([player.progress, player.time], { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.9)
    open.set(panelEl, { opacity: 1 }, 0.5)
    open.fromTo(panel.root, { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.9, ease: 'expo.out' }, 0.55)
    if (!skipped && !(await ok(run(open, signal)))) return
    setSkipHandler(null)
    const result = skipped ? 'skipped' : await player.play(signal)
    if (signal.aborted || result === 'aborted') return
    if (result === 'error') {
      const n = gsap.timeline({ paused: true })
      n.to(notice, { opacity: 1, duration: 0.3 }).to(notice, { opacity: 0, duration: 0.4 }, '+=1.6')
      if (!(await ok(run(n, signal)))) return
    }

    // 3. The lesson, word for word from the script.
    const lesson = gsap.timeline({ paused: true })
    lesson.to([media, panelEl, hero.root], { opacity: 0, scale: 0.97, duration: 0.6, ease: 'power2.in' }, 0)
    lesson.set(lessonBox, { opacity: 1 }, 0.5)
    lesson.fromTo(lessonEyebrow, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' }, 0.55)
    rise(lesson, lessonWords, 0.65, { duration: 1.2, stagger: 0.06 })
    if (!(await ok(run(lesson, signal)))) return
    if (!(await ok(wait(LESSON_HOLD, signal)))) return

    // 4. The lesson becomes its short label and flies into its place on the board.
    const toBoard = gsap.timeline({ paused: true })
    toBoard.to(lessonBox, { opacity: 0, y: -20, filter: 'blur(8px)', duration: 0.5, ease: 'power2.in' }, 0)
    toBoard.add(world.showBoard(scene.n), 0.15)
    toBoard.set(chipBox, { opacity: 1 }, 0.3)
    toBoard.fromTo(chip, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.8)' }, 0.3)
    toBoard.add(world.fillLesson(scene.n, chip, () => stageScale(slideEl!)), 1.05)
    toBoard.to({}, { duration: 0.25 })
    if (!(await ok(run(toBoard, signal)))) return

    // 5. Unfreeze: the sound is the actors' cue; when it has faded, the scene goes on.
    sound.play('unfreeze')
    const thaw = world.thaw({ mode: 'acting', scene: scene.n, filled: scene.n })
    thaw.pause()
    if (!(await ok(run(thaw, signal)))) return
    hideAll()
    release()
    if (scene.n < scenes.length) world.nextSceneAfter(scene.tailSeconds, scene.n + 1)
  }

  return defineSlide({
    id: `scene-${scene.n}-expert`,
    claim: `Scene ${scene.n}: a professional answers, then the lesson: ${scene.lesson}`,
    notes: `Scene ${scene.n}. The clip plays by itself, then the lesson, then the unfreeze sound. Lower your hand when the sound starts; actors go on when it has faded. Next PRESS: “Freeze!” in scene ${scene.n + 1 <= 7 ? scene.n + 1 : '—'}.`,
    transition: 'fade',
    tempo: 'slow',
    build({ stage, tl }) {
      tl.addLabel('step-0')
      slideEl = stage
      const box = el('div', 'xp', stage)
      box.dataset.layout = layout
      box.dataset.kind = expert.media.kind

      const heroBox = el('div', 'xp-hero', box)
      hero = buildCard(heroBox, expert, 'hero')

      media = el('div', 'xp-media', box)
      panelEl = el('div', 'xp-panel', box)
      panel = buildCard(panelEl, expert, 'panel')
      player = new Player(media, layout === 'side' ? panelEl : null, expert, subtitlesFor(expert.media.file), waveformFor(expert.media.file))

      lessonBox = el('div', 'xp-lesson', box)
      lessonEyebrow = el('div', 'eyebrow-mono', lessonBox)
      lessonEyebrow.textContent = `Lesson ${scene.n} of 7`
      const text = el('div', 'xp-lesson-text', lessonBox)
      lessonWords = maskedWords(text, scene.lesson)

      chipBox = el('div', 'xp-chip', box)
      chip = el('span', 'chip', chipBox)
      el('span', 'dot', chip).innerHTML = CHECK_SVG
      el('span', '', chip).textContent = scene.label

      notice = el('div', 'xp-notice', box)
      notice.textContent = 'The clip could not play · the show goes on'

      gsap.set(heroBox, { opacity: 1 })
      gsap.set([hero.root, media, panelEl, lessonBox, chipBox, notice], { opacity: 0 })
    },
    enter({ direction, signal, hold }) {
      hideAll()
      if (direction !== 'forward') {
        // Going back to this slide undoes a too-early « Freeze! »: the room is acting again, nothing replays.
        sound.stopAll()
        world.go(settled, howFrom(direction))
        return
      }
      const release = hold()
      signal.addEventListener('abort', () => hideAll(), { once: true })
      sequence(signal, release).catch((err: unknown) => {
        // Never leave the room frozen with the presses held: thaw and give the Narrator the control back.
        console.error(err)
        if (signal.aborted) return
        hideAll()
        world.go(settled, 'soft')
        release()
      })
    },
  })
}
