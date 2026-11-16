import { gsap } from 'gsap'
import { scenes } from '../../content/scenes'
import { el } from '../dom'

export const CHECK_SVG =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.6l3.2 3.1L13 4.6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'

export interface SceneInfo {
  eyebrow: string
  num: string | null
  kicker: string
  title: string
  /** The current scene (1..7) for the progress ticks, or null to hide them. */
  tick: number | null
}

export function part1Info(n: number): SceneInfo {
  const s = scenes[n - 1]!
  return {
    eyebrow: 'Part 1 · Candidate 1 — Ayoub',
    num: String(n).padStart(2, '0'),
    kicker: `Scene ${n} of 7`,
    title: s.title,
    tick: n,
  }
}

export const part2Info: SceneInfo = {
  eyebrow: 'Part 2 · Candidate 2 — Aya',
  num: null,
  kicker: 'No freezes · just watch',
  title: 'The Perfect Candidate',
  tick: null,
}

/** Top left: which part, which scene. Text changes roll through masks, like a departure board. */
export class SceneBlock {
  readonly el: HTMLElement
  private eyebrow: HTMLElement
  private numBox: HTMLElement
  private kicker: HTMLElement
  private titleBox: HTMLElement
  private ticks: HTMLElement[]
  private info: SceneInfo | null = null

  constructor(parent: HTMLElement) {
    this.el = el('div', 'scene-block', parent)
    this.eyebrow = el('div', 'sb-eyebrow', this.el)
    const row = el('div', 'sb-row', this.el)
    this.numBox = el('div', 'sb-num', row)
    const text = el('div', 'sb-text', row)
    this.kicker = el('div', 'sb-kicker', text)
    this.titleBox = el('div', 'sb-title', text)
    const ticks = el('div', 'sb-ticks', text)
    this.ticks = scenes.map(() => el('i', '', ticks))
  }

  get title(): HTMLElement {
    return this.titleBox
  }

  /** Put `info` on screen. Animated: the number and title roll, the eyebrow and kicker cross-fade. */
  set(info: SceneInfo, animate: boolean): gsap.core.Timeline {
    const tl = gsap.timeline()
    const prev = this.info
    this.info = info
    const roll = (box: HTMLElement, value: string, stagger: number) => {
      const old = Array.from(box.children) as HTMLElement[]
      const span = el('span', '', box)
      span.textContent = value
      if (!animate || !prev) {
        old.forEach((o) => o.remove())
        gsap.set(span, { yPercent: 0, opacity: 1, position: 'relative' })
        return
      }
      gsap.set(span, { position: 'absolute', left: 0, top: 0, yPercent: 105, opacity: 0 })
      tl.to(old, { yPercent: -105, opacity: 0, duration: 0.55, ease: 'power3.in', onComplete: () => old.forEach((o) => o.remove()) }, stagger)
      tl.to(span, { yPercent: 0, opacity: 1, duration: 0.8, ease: 'expo.out', onComplete: () => void gsap.set(span, { position: 'relative' }) }, stagger + 0.38)
    }
    const fade = (node: HTMLElement, value: string, at: number) => {
      if (node.textContent === value) return
      if (!animate || !prev) {
        node.textContent = value
        return
      }
      tl.to(node, { opacity: 0, duration: 0.3, ease: 'power2.in' }, at)
      tl.add(() => void (node.textContent = value))
      tl.to(node, { opacity: 1, duration: 0.6, ease: 'power2.out' })
    }
    fade(this.eyebrow, info.eyebrow, 0)
    fade(this.kicker, info.kicker, 0.05)
    gsap.set(this.numBox, { display: info.num === null ? 'none' : 'block' })
    if (info.num !== null && (!prev || prev.num !== info.num)) roll(this.numBox, info.num, 0)
    if (!prev || prev.title !== info.title) roll(this.titleBox, info.title, 0.08)
    gsap.set(this.ticks[0]!.parentElement!, { display: info.tick === null ? 'none' : 'flex' })
    const apply = () =>
      this.ticks.forEach((t, i) => {
        t.className = info.tick === null ? '' : i + 1 < info.tick ? 'done' : i + 1 === info.tick ? 'now' : ''
      })
    if (animate && prev) tl.add(apply, 0.5)
    else apply()
    return tl
  }
}

/** Top right: a recording light and a clock that starts at 9:15, the hour of the interview. It stops on a freeze. */
export class Clock {
  readonly el: HTMLElement
  private time: HTMLElement
  private label: HTMLElement
  private shown = -1
  elapsed = 0
  running = false

  constructor(parent: HTMLElement) {
    this.el = el('div', 'rec', parent)
    el('span', 'rec-dot', this.el)
    const pause = el('span', 'rec-pause', this.el)
    el('i', '', pause)
    el('i', '', pause)
    this.label = el('span', 'rec-label', this.el)
    this.label.textContent = 'REC'
    this.time = el('span', 'rec-time', this.el)
    this.render()
  }

  frozen(on: boolean): void {
    this.el.classList.toggle('is-frozen', on)
    this.label.textContent = on ? 'PAUSE' : 'REC'
  }

  tick(dt: number): void {
    if (this.running) this.elapsed += dt
    this.render()
  }

  private render(): void {
    const s = Math.floor(9 * 3600 + 15 * 60 + this.elapsed)
    if (s === this.shown) return
    this.shown = s
    const hh = String(Math.floor(s / 3600)).padStart(2, '0')
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
    const ss = String(s % 60).padStart(2, '0')
    this.time.textContent = `${hh}:${mm}:${ss}`
  }
}

interface Slot {
  li: HTMLElement
  label: HTMLElement
  mark: HTMLElement
  glow: HTMLElement
  empty: HTMLElement
}

export type BoardMode = 'part1' | 'part2' | 'final'

/**
 * Right column: the seven lessons. Part 1 fills a slot after each video. Part 2 checks the candidate's four lessons
 * in warm light and leaves the jury's three dim. The final regroups them under the question and lights the jury's.
 */
export class Board {
  readonly el: HTMLElement
  readonly slots: Slot[]
  private count: HTMLElement
  private headLabel: HTMLElement
  readonly groups: HTMLElement
  readonly chips: { candidate: HTMLElement[]; jury: HTMLElement[] }
  filled = 0
  mode: BoardMode = 'part1'

  constructor(parent: HTMLElement) {
    this.el = el('div', 'board', parent)
    const head = el('div', 'board-head', this.el)
    this.headLabel = el('span', '', head)
    this.headLabel.textContent = 'Lessons'
    this.count = el('span', 'board-count', head)
    const list = el('ol', 'board-list', this.el)
    this.slots = scenes.map((s) => {
      const li = el('li', 'slot', list)
      const glow = el('span', 'slot-glow', li)
      el('span', 'slot-n', li).textContent = String(s.n).padStart(2, '0')
      const label = el('span', 'slot-label', li)
      label.textContent = s.label
      const empty = el('span', 'slot-empty', li)
      const mark = el('span', 'slot-mark', li)
      mark.innerHTML = CHECK_SVG
      return { li, label, mark, glow, empty }
    })
    this.groups = el('div', 'final-groups', this.el)
    const group = (title: string, audience: 'candidate' | 'jury') => {
      const g = el('div', 'fg', this.groups)
      el('div', 'fg-title', g).textContent = title
      const row = el('div', 'fg-row', g)
      return scenes
        .filter((s) => s.audience === audience)
        .map((s) => {
          const chip = el('span', `chip ${audience === 'candidate' ? 'warm' : ''}`, row)
          const dot = el('span', 'dot', chip)
          dot.innerHTML = CHECK_SVG
          el('span', '', chip).textContent = s.label
          return chip
        })
    }
    this.chips = { candidate: group('For the candidate', 'candidate'), jury: group('For the jury', 'jury') }
    this.render(0, 'part1')
  }

  /** Show `filled` lessons in `mode`, with no animation. */
  render(filled: number, mode: BoardMode): void {
    this.filled = filled
    this.mode = mode
    this.el.classList.toggle('is-final', mode === 'final')
    this.headLabel.textContent = mode === 'part1' ? 'Lessons' : 'The perfect candidate'
    this.slots.forEach((s, i) => {
      const n = i + 1
      const has = n <= filled
      const jury = scenes[i]!.audience === 'jury'
      s.li.className = 'slot'
      if (has) s.li.classList.add('is-filled')
      if (mode !== 'part1' && has) s.li.classList.add(jury ? 'is-dim' : 'is-checked')
      gsap.set(s.label, { opacity: has ? 1 : 0, x: 0 })
      gsap.set(s.empty, { opacity: has ? 0 : 1 })
      gsap.set(s.glow, { opacity: 0 })
      gsap.set(s.li, { clearProps: 'opacity' })
    })
    const checked = scenes.filter((s, i) => i < filled && s.audience === 'candidate').length
    this.count.textContent = mode === 'part1' ? `${filled} / 7` : `${checked} / 7`
    for (const c of this.chips.jury) c.classList.remove('ice')
    gsap.set([...this.chips.candidate, ...this.chips.jury], { clearProps: 'all' })
  }

  /** Mark slot `n` (1..7) as the one about to be filled, or clear the mark. */
  target(n: number | null): void {
    this.slots.forEach((s, i) => s.li.classList.toggle('is-target', n === i + 1))
  }

  /** Fill slot `n`: the label settles in, the mark lights up, a glow passes. */
  fill(n: number): gsap.core.Timeline {
    const s = this.slots[n - 1]!
    const tl = gsap.timeline()
    tl.add(() => {
      s.li.classList.remove('is-target')
      s.li.classList.add('is-filled')
      this.filled = Math.max(this.filled, n)
      this.count.textContent = `${this.filled} / 7`
    })
    tl.to(s.empty, { opacity: 0, duration: 0.2 }, 0)
    tl.fromTo(s.label, { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.6, ease: 'expo.out' }, 0)
    tl.fromTo(s.glow, { opacity: 0.9 }, { opacity: 0, duration: 1.4, ease: 'power2.out' }, 0)
    tl.fromTo(s.mark, { scale: 1.6 }, { scale: 1, duration: 0.7, ease: 'back.out(2)' }, 0)
    return tl
  }

  /** Part 2: check the candidate's lessons one by one, dim the jury's. */
  checkCandidate(delay = 0): gsap.core.Timeline {
    const tl = gsap.timeline({ delay })
    this.mode = 'part2'
    tl.add(() => void (this.headLabel.textContent = 'The perfect candidate'), 0)
    tl.fromTo(this.headLabel, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0)
    let k = 0
    let checked = 0
    this.slots.forEach((s, i) => {
      const jury = scenes[i]!.audience === 'jury'
      if (jury) {
        tl.add(() => s.li.classList.add('is-dim'), 0.3)
        tl.fromTo(s.li, { opacity: 1 }, { opacity: 0.32, duration: 0.9, ease: 'power2.inOut', clearProps: 'opacity' }, 0.3)
        return
      }
      const at = 0.6 + k++ * 0.42
      tl.add(() => {
        s.li.classList.add('is-checked')
        this.count.textContent = `${++checked} / 7`
      }, at)
      tl.fromTo(s.mark, { scale: 0.4 }, { scale: 1, duration: 0.7, ease: 'back.out(2.4)' }, at)
      tl.fromTo(s.glow, { opacity: 0.55, background: 'rgba(255, 154, 61, 0.2)' }, { opacity: 0, duration: 1.3, clearProps: 'background' }, at)
    })
    return tl
  }
}
