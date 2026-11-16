import { gsap } from 'gsap'
import { el } from '../dom'
import { Board, Clock, SceneBlock, part1Info, part2Info, type BoardMode } from './hud'
import { Dust, drawFrost, grainTile } from './textures'

/**
 * The world: everything that lives across slides. Under the slides, the room (night office, light through the
 * blinds, a passing car's headlights, dust in the light, and the ice of a freeze). Over them, the HUD (scene, clock,
 * lessons). Slides say which state the world must be in; the world knows how to get there from where it is.
 */
export type Mode = 'preshow' | 'title' | 'acting' | 'frozen' | 'media' | 'part2' | 'final' | 'credits'

export interface WorldState {
  mode: Mode
  /** The scene shown in the HUD (Part 1). */
  scene: number
  /** Lessons on the board. */
  filled: number
}

/** How to reach a state: animated (a press forward), soft (a quick cross-fade, going back) or at once. */
export type How = 'animate' | 'soft' | 'instant'

interface Look {
  world: number
  warm: number
  blindsNight: number
  blindsWarm: number
  sweep: number
  spot: number
  flood: number
  deep: number
  frost: number
  frostR: number
  scene: number
  clock: number
  board: number
  motion: boolean
  clockRuns: boolean
  frozenHud: boolean
  dust: [number, number, number]
  dustBoost: number
}

/** The scene block shrinks to this while a clip plays, so the picture has the top of the screen. */
const COMPACT = 0.6

const NIGHT_DUST: [number, number, number] = [205, 220, 255]
const ICE_DUST: [number, number, number] = [235, 248, 255]
const WARM_DUST: [number, number, number] = [255, 214, 160]

function look(mode: Mode): Look {
  const base: Look = {
    world: 1, warm: 0, blindsNight: 1, blindsWarm: 0, sweep: 1, spot: 0, flood: 0, deep: 0, frost: 0, frostR: 112,
    scene: 0, clock: 0, board: 0, motion: true, clockRuns: false, frozenHud: false, dust: NIGHT_DUST, dustBoost: 1,
  }
  switch (mode) {
    case 'preshow':
      return { ...base, world: 0 }
    case 'title':
      return base
    case 'acting':
      return { ...base, scene: 1, clock: 1, board: 1, clockRuns: true }
    case 'frozen':
      return { ...base, sweep: 1, flood: 0.9, frost: 1, frostR: 50, scene: 1, clock: 1, board: 0, motion: false, frozenHud: true, dust: ICE_DUST, dustBoost: 1.6 }
    case 'media':
      return { ...base, blindsNight: 0.35, flood: 0, deep: 1, frost: 0.85, frostR: 60, scene: 0.75, clock: 0.8, board: 0, motion: false, frozenHud: true, dust: ICE_DUST, dustBoost: 1.2 }
    case 'part2':
      return { ...base, warm: 1, blindsNight: 0, blindsWarm: 1, sweep: 0, scene: 1, clock: 1, board: 1, clockRuns: true, dust: WARM_DUST, dustBoost: 1.5 }
    case 'final':
      return { ...base, blindsNight: 0.25, sweep: 0, spot: 1, board: 1 }
    case 'credits':
      return { ...base, blindsNight: 0.7 }
  }
}

function boardMode(mode: Mode): BoardMode {
  return mode === 'part2' ? 'part2' : mode === 'final' ? 'final' : 'part1'
}

export class World {
  state: WorldState = { mode: 'preshow', scene: 1, filled: 0 }
  qa = false

  private root!: HTMLElement
  private night!: HTMLElement
  private warm!: HTMLElement
  private blindsBox!: HTMLElement
  private blindsNight!: HTMLElement
  private blindsWarm!: HTMLElement
  private sweepEl!: HTMLElement
  private spot!: HTMLElement
  private flood!: HTMLElement
  private deep!: HTMLElement
  private frost!: HTMLCanvasElement
  private grain!: HTMLElement
  private flash!: HTMLElement
  private dust!: Dust
  hud!: HTMLElement
  sceneBlock!: SceneBlock
  clock!: Clock
  board!: Board

  private loops: gsap.core.Timeline[] = []
  private moving = true
  private pending: gsap.core.Timeline | null = null
  private sceneTimer: gsap.core.Tween | null = null
  private time = 0
  private grainStep = 0

  mount(stage: HTMLElement, opts: { qa: boolean }): void {
    this.qa = opts.qa
    const doc = stage.ownerDocument
    this.root = el('div', 'world', stage)
    this.night = el('div', 'w-night', this.root)
    this.warm = el('div', 'w-warm', this.root)
    this.blindsBox = el('div', 'w-blinds', this.root)
    this.blindsNight = el('i', 'night', this.blindsBox)
    this.blindsWarm = el('i', 'warm', this.blindsBox)
    this.sweepEl = el('div', 'w-sweep', this.root)
    this.spot = el('div', 'w-spot', this.root)
    this.flood = el('div', 'w-flood', this.root)
    this.deep = el('div', 'w-flood-deep', this.root)
    const dustCanvas = el('canvas', 'w-dust', this.root)
    dustCanvas.width = 1920
    dustCanvas.height = 1080
    this.dust = new Dust(dustCanvas)
    this.frost = el('canvas', 'w-frost', this.root)
    this.frost.width = 1920
    this.frost.height = 1080
    drawFrost(this.frost)
    this.grain = el('div', 'w-grain', this.root)
    this.grain.style.backgroundImage = `url(${grainTile(doc)})`
    el('div', 'w-vignette', this.root)
    this.flash = el('div', 'w-flash', this.root)

    this.hud = el('div', 'hud', stage)
    this.sceneBlock = new SceneBlock(this.hud)
    this.clock = new Clock(this.hud)
    this.board = new Board(this.hud)

    // Ambient loops: the light patch breathes and drifts; a car passes now and then. They pause on a freeze, where
    // they are, so the room really stops.
    const drift = gsap.timeline({ repeat: -1, yoyo: true, paused: true })
    drift.to(this.blindsBox, { x: 26, y: 14, duration: 13, ease: 'sine.inOut' })
    drift.to(this.blindsBox, { opacity: 0.82, duration: 9, ease: 'sine.inOut' }, 0)
    const car = gsap.timeline({ repeat: -1, paused: true, delay: 0 })
    car.fromTo(this.sweepEl, { x: -900 }, { x: 2200, duration: 7.5, ease: 'sine.inOut' }, 6)
    car.to({}, { duration: 17 })
    this.loops = [drift, car]

    gsap.ticker.add(this.onTick)
    this.apply(this.state, 0)
  }

  private onTick = (_t: number, deltaMs: number): void => {
    const dt = Math.min(0.1, deltaMs / 1000)
    this.clock.tick(dt)
    if (!this.moving || this.qa) return
    this.time += dt
    this.dust.step(dt, this.time)
    this.dust.draw(this.time)
    // film grain shuffles at 12 frames a second
    const step = Math.floor(this.time * 12)
    if (step !== this.grainStep) {
      this.grainStep = step
      this.grain.style.backgroundPosition = `${(step * 97) % 256}px ${(step * 53) % 256}px`
    }
  }

  /** Start or stop everything that moves in the room. A freeze stops it mid-way. */
  private setMotion(on: boolean): void {
    this.moving = on
    for (const loop of this.loops) {
      if (on && !this.qa) loop.play()
      else loop.pause()
    }
    if (!on || this.qa) this.dust.draw(this.time)
  }

  private cancelPending(): void {
    this.pending?.progress(1).kill()
    this.pending = null
    this.sceneTimer?.kill()
    this.sceneTimer = null
  }

  /** Tween (or set, when d is 0) every layer to the look of `s`, and the HUD to its content. */
  private apply(s: WorldState, d: number): gsap.core.Timeline {
    const L = look(s.mode)
    const tl = gsap.timeline()
    const to = (target: gsap.TweenTarget, vars: gsap.TweenVars) =>
      d > 0 ? tl.to(target, { duration: d, ease: 'power2.inOut', ...vars }, 0) : tl.set(target, vars, 0)
    to(this.root, { opacity: L.world })
    to(this.warm, { opacity: L.warm })
    to(this.blindsNight, { opacity: L.blindsNight })
    to(this.blindsWarm, { opacity: L.blindsWarm })
    to(this.sweepEl, { opacity: L.sweep })
    to(this.spot, { opacity: L.spot })
    to(this.flood, { opacity: L.flood })
    to(this.deep, { opacity: L.deep, '--hole': '0%' })
    to(this.frost, { opacity: L.frost, '--frost': `${L.frostR}%` })
    to(this.flash, { opacity: 0 })
    to(this.sceneBlock.el, { opacity: L.scene, y: 0, scale: s.mode === 'media' ? COMPACT : 1 })
    to(this.clock.el, { opacity: L.clock })
    to(this.board.el, { opacity: L.board, x: 0, y: 0 })
    tl.add(() => {
      this.hud.classList.toggle('is-frozen', L.frozenHud)
      this.hud.classList.toggle('is-warm', s.mode === 'part2')
      this.clock.frozen(L.frozenHud)
      this.clock.running = L.clockRuns
      this.dust.tint = L.dust
      this.dust.boost = L.dustBoost
      this.setMotion(L.motion)
    }, 0)
    if (s.mode === 'acting' || s.mode === 'frozen' || s.mode === 'media') this.sceneBlock.set(part1Info(s.scene), false)
    if (s.mode === 'part2') this.sceneBlock.set(part2Info, false)
    this.board.render(s.filled, boardMode(s.mode))
    if (s.mode === 'final') this.lightJury(false)
    this.board.target(null)
    return tl
  }

  /** Go to `s`. Forward presses animate the known transitions; anything else cross-fades or cuts. */
  go(s: WorldState, how: How = 'animate'): gsap.core.Timeline {
    this.cancelPending()
    const from = this.state
    this.state = { ...s }
    let tl: gsap.core.Timeline
    if (how === 'instant') tl = this.apply(s, 0)
    else if (how === 'soft') tl = this.apply(s, 0.45)
    else if (from.mode === 'preshow' && s.mode === 'title') tl = this.toTitle()
    else if (from.mode === 'title' && s.mode === 'acting') tl = this.toActing(s)
    else if (from.mode === 'acting' && s.mode === 'frozen') tl = this.toFrozen(s)
    else if (from.mode === 'frozen' && s.mode === 'media') tl = this.toMedia()
    else if (from.mode === 'acting' && s.mode === 'part2') tl = this.toPart2(s)
    else if (from.mode === 'part2' && s.mode === 'final') tl = this.toFinal()
    else tl = this.apply(s, 0.9)
    this.pending = tl
    return tl
  }

  // ------------------------------------------------------------ transitions

  private toTitle(): gsap.core.Timeline {
    const tl = this.apply({ mode: 'title', scene: 1, filled: 0 }, 0)
    tl.fromTo(this.root, { opacity: 0 }, { opacity: 1, duration: 2.6, ease: 'power2.inOut' }, 0)
    tl.fromTo(this.blindsBox, { scale: 1.08 }, { scale: 1, duration: 4, ease: 'expo.out' }, 0)
    return tl
  }

  private toActing(s: WorldState): gsap.core.Timeline {
    const tl = this.apply(s, 0)
    gsap.set([this.sceneBlock.el, this.clock.el, this.board.el], { opacity: 0 })
    const at = 0.7
    tl.fromTo(this.sceneBlock.el, { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out' }, 4.9)
    tl.fromTo(this.clock.el, { opacity: 0 }, { opacity: 1, duration: 0.8 }, at + 0.3)
    tl.fromTo(this.board.el, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 1.1, ease: 'expo.out' }, at + 0.2)
    tl.from(this.board.slots.map((x) => x.li), { opacity: 0, x: 18, duration: 0.7, ease: 'expo.out', stagger: 0.06, clearProps: 'opacity,x' }, at + 0.35)
    return tl
  }

  /** The freeze: one white flash, the room turns to ice and stops, the HUD pauses. */
  private toFrozen(s: WorldState): gsap.core.Timeline {
    this.setMotion(false)
    const tl = gsap.timeline()
    const L = look('frozen')
    this.sceneBlock.set(part1Info(s.scene), false)
    this.board.render(s.filled, 'part1')
    tl.set(this.flash, { opacity: 0.92 }, 0)
    tl.set(this.flood, { opacity: L.flood }, 0)
    tl.to(this.flash, { opacity: 0, duration: 0.55, ease: 'power2.out' }, 0.04)
    tl.set(this.frost, { opacity: 1, '--frost': '96%' }, 0)
    tl.to(this.frost, { '--frost': `${L.frostR}%`, duration: 1.6, ease: 'expo.out' }, 0)
    tl.add(() => {
      this.hud.classList.add('is-frozen')
      this.clock.frozen(true)
      this.clock.running = false
      this.dust.tint = L.dust
      this.dust.boost = L.dustBoost
      this.dust.draw(this.time)
    }, 0)
    tl.to([this.sceneBlock.el, this.clock.el], { opacity: 1, scale: 1, duration: 0.2 }, 0)
    tl.to(this.board.el, { opacity: 0, x: 30, duration: 0.35, ease: 'power2.in' }, 0.05)
    return tl
  }

  /** From the freeze to the video: the blue deepens so the picture stands out; the lessons step aside. */
  private toMedia(): gsap.core.Timeline {
    const L = look('media')
    const tl = gsap.timeline()
    tl.to(this.deep, { opacity: 1, '--hole': '0%', duration: 1.1, ease: 'power2.inOut' }, 0)
    tl.to(this.flood, { opacity: 0, duration: 1.1, ease: 'power2.inOut' }, 0.1)
    tl.to(this.blindsNight, { opacity: L.blindsNight, duration: 1.1 }, 0)
    tl.to(this.frost, { opacity: L.frost, '--frost': `${L.frostR}%`, duration: 1.4, ease: 'power2.out' }, 0)
    tl.to(this.board.el, { opacity: 0, x: 30, duration: 0.5, ease: 'power2.in' }, 0)
    tl.to(this.sceneBlock.el, { opacity: L.scene, scale: COMPACT, duration: 0.9, ease: 'power3.inOut' }, 0.05)
    tl.to(this.clock.el, { opacity: L.clock, duration: 0.8 }, 0.1)
    tl.add(() => {
      this.dust.tint = L.dust
      this.dust.boost = L.dustBoost
      this.dust.draw(this.time)
    }, 0)
    return tl
  }

  /** Bring the board back during a lesson, with slot `n` marked as the one to fill. */
  showBoard(n: number): gsap.core.Timeline {
    this.board.target(n)
    const tl = gsap.timeline()
    tl.to(this.board.el, { opacity: 1, x: 0, duration: 0.8, ease: 'expo.out' })
    return tl
  }

  /**
   * The lesson chip flies from the centre into slot `n` and the slot fills. `chip` is in the slide; its flight is
   * measured in stage pixels so it lands exactly on the slot's label.
   */
  fillLesson(n: number, chip: HTMLElement, stageScale: () => number): gsap.core.Timeline {
    const slot = this.board.slots[n - 1]!
    const tl = gsap.timeline()
    tl.add(() => {
      const k = stageScale() || 1
      const a = chip.getBoundingClientRect()
      const b = slot.label.getBoundingClientRect()
      const dx = (b.left - a.left) / k
      const dy = (b.top + b.height / 2 - (a.top + a.height / 2)) / k
      const sc = Math.max(0.6, Math.min(1, (b.height * 1.9) / a.height))
      gsap.to(chip, { x: dx - 16, y: dy, scale: sc, transformOrigin: '0% 50%', duration: 0.95, ease: 'power3.inOut' })
      gsap.to(chip, { opacity: 0, duration: 0.25, delay: 0.82, ease: 'power1.in' })
    })
    tl.add(this.board.fill(n), 0.82)
    tl.add(() => void (this.state = { ...this.state, filled: n }), 0.82)
    return tl
  }

  /**
   * The thaw, with the unfreeze sound: the ice melts from the centre outwards, the frost leaves the edges, the room
   * starts moving again and the clock runs. About 1.9 s.
   */
  thaw(next: WorldState): gsap.core.Timeline {
    this.cancelPending()
    const L = look('acting')
    const tl = gsap.timeline()
    tl.add(() => {
      this.state = { ...next }
      this.hud.classList.remove('is-frozen')
      this.clock.frozen(false)
      this.dust.tint = L.dust
      this.dust.boost = L.dustBoost
      this.setMotion(true)
    }, 0.15)
    tl.to(this.deep, { '--hole': '190%', duration: 1.9, ease: 'power2.inOut' }, 0)
    tl.to(this.flood, { opacity: 0, duration: 0.6 }, 0)
    tl.to(this.frost, { '--frost': '112%', opacity: 0, duration: 1.9, ease: 'power2.inOut' }, 0)
    tl.to(this.blindsNight, { opacity: 1, duration: 1.6, ease: 'power2.inOut' }, 0.2)
    tl.to([this.clock.el, this.board.el], { opacity: 1, duration: 1.2 }, 0.3)
    tl.to(this.sceneBlock.el, { opacity: 1, scale: 1, duration: 1.2, ease: 'power3.inOut' }, 0.2)
    tl.add(() => {
      this.clock.running = true
      gsap.set(this.deep, { opacity: 0, '--hole': '0%' })
    }, 1.9)
    this.pending = tl
    return tl
  }

  /** After the last lines of a scene, the HUD moves on to the next scene. */
  nextSceneAfter(seconds: number, n: number): void {
    this.sceneTimer?.kill()
    this.sceneTimer = gsap.delayedCall(seconds, () => {
      if (this.state.mode !== 'acting') return
      this.state = { ...this.state, scene: n }
      this.sceneBlock.set(part1Info(n), true)
    })
  }

  /** Part 2: the sun comes up on the same room, the HUD turns to Aya, the candidate's lessons are checked. */
  private toPart2(s: WorldState): gsap.core.Timeline {
    const L = look('part2')
    const tl = gsap.timeline()
    this.board.render(s.filled, 'part1')
    tl.to(this.warm, { opacity: 1, duration: 3.2, ease: 'power2.inOut' }, 0)
    tl.to(this.blindsNight, { opacity: 0, duration: 2.4, ease: 'power2.inOut' }, 0)
    tl.to(this.blindsWarm, { opacity: 1, duration: 3.2, ease: 'power2.inOut' }, 0.3)
    tl.to(this.sweepEl, { opacity: 0, duration: 1 }, 0)
    tl.add(() => {
      this.dust.tint = L.dust
      this.dust.boost = L.dustBoost
    }, 0.8)
    tl.to(this.sceneBlock.el, { opacity: 0, y: -12, duration: 0.5, ease: 'power2.in' }, 0)
    tl.add(() => {
      this.sceneBlock.set(part2Info, false)
      this.hud.classList.add('is-warm')
    }, 0.55)
    tl.to(this.sceneBlock.el, { opacity: 1, y: 0, duration: 1, ease: 'expo.out' }, 4.4)
    // The board steps aside while the title holds the centre, then comes back and checks Aya's lessons.
    tl.to(this.board.el, { opacity: 0, x: 24, duration: 0.5, ease: 'power2.in' }, 0)
    tl.to(this.board.el, { opacity: 1, x: 0, duration: 1.1, ease: 'expo.out' }, 4.6)
    tl.add(this.board.checkCandidate(), 4.9)
    return tl
  }

  /** The final question: the warmth goes, one light from above, the lessons regroup and the jury's light up. */
  private toFinal(): gsap.core.Timeline {
    const L = look('final')
    const tl = gsap.timeline()
    tl.to(this.warm, { opacity: 0, duration: 1.6, ease: 'power2.inOut' }, 0)
    tl.to(this.blindsWarm, { opacity: 0, duration: 1.4 }, 0)
    tl.to(this.blindsNight, { opacity: L.blindsNight, duration: 1.6 }, 0.2)
    tl.to(this.spot, { opacity: 1, duration: 2.4, ease: 'power2.inOut' }, 0.4)
    tl.add(() => {
      this.dust.tint = L.dust
      this.dust.boost = L.dustBoost
      this.clock.running = false
    }, 0)
    tl.to([this.sceneBlock.el, this.clock.el], { opacity: 0, duration: 0.6 }, 0)
    tl.to(this.board.el, { opacity: 0, x: 24, duration: 0.6, ease: 'power2.in' }, 0)
    tl.add(() => this.hud.classList.remove('is-warm'), 0.65)
    tl.add(() => {
      this.board.render(this.state.filled, 'final')
      gsap.set(this.board.el, { opacity: 1, x: 0 })
      const chips = [...this.board.chips.candidate, ...this.board.chips.jury]
      gsap.set(chips, { opacity: 0 })
      gsap.set(this.board.groups.querySelectorAll('.fg-title'), { opacity: 0 })
    }, 0.65)
    tl.to(this.board.groups.querySelectorAll('.fg-title'), { opacity: 1, duration: 0.8, stagger: 0.2 }, 3.0)
    tl.fromTo(this.board.chips.candidate, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.12 }, 3.1)
    tl.fromTo(this.board.chips.jury, { opacity: 0, y: 16 }, { opacity: 0.4, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.12 }, 3.3)
    tl.add(this.lightJury(true), 4.8)
    return tl
  }

  /** Light the jury's three lessons in ice blue: they were the real lessons of the day. */
  private lightJury(animate: boolean): gsap.core.Timeline {
    const tl = gsap.timeline()
    const chips = this.board.chips.jury
    if (!animate) {
      chips.forEach((c) => c.classList.add('ice'))
      gsap.set(chips, { opacity: 1 })
      return tl
    }
    chips.forEach((c, i) => {
      tl.add(() => c.classList.add('ice'), i * 0.35)
      tl.to(c, { opacity: 1, duration: 0.5, ease: 'power2.out' }, i * 0.35)
      tl.fromTo(c, { scale: 1 }, { scale: 1.08, duration: 0.3, ease: 'power2.out', yoyo: true, repeat: 1 }, i * 0.35)
    })
    return tl
  }
}

export const world = new World()
