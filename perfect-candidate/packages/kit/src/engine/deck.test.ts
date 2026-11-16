// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { gsap } from 'gsap'
import { createDeck, sortSlides, type Deck } from './deck'
import { defineSlide, type SlideDefinition } from '../define-slide'
import { LabelError } from './labels'
import { testBrand } from '../test/brand-fixture'

// Test fixtures may drive `tl` directly; real slides go through motion helpers.
function slide(id: string, steps: number, extra: Partial<SlideDefinition> = {}): SlideDefinition {
  return defineSlide({
    id,
    claim: `claim ${id}`,
    ...extra,
    build({ stage, tl }) {
      const box = stage.ownerDocument.createElement('div')
      box.className = 'box'
      stage.appendChild(box)
      tl.to(box, { x: 10, duration: 0.2, ease: 'none' }) // entry segment
      tl.addLabel('step-0')
      for (let k = 1; k < steps; k++) {
        tl.to(box, { x: 10 * (k + 1), duration: 0.2, ease: 'none' })
        tl.addLabel(`step-${k}`)
      }
    },
  })
}

function makeDeck(slides: SlideDefinition[], extra: Record<string, unknown> = {}) {
  const root = document.createElement('div')
  document.body.appendChild(root)
  return createDeck({ config: { title: 'Test deck', language: 'fr', brand: testBrand }, slides, root, fontTimeoutMs: 10, ...extra })
}

const boxX = (i = 0) => Number(gsap.getProperty(document.querySelectorAll('.box')[i]!, 'x'))
const activeId = () => (document.querySelector('.slide.is-active') as HTMLElement | null)?.dataset.slideId

// Braces: timeScale returns the root timeline, which is thenable and, with ambient loops on it, never completes.
beforeAll(() => {
  gsap.globalTimeline.timeScale(20)
})
afterAll(() => {
  gsap.globalTimeline.timeScale(1)
})
beforeEach(() => {
  document.body.innerHTML = ''
  document.head.querySelectorAll('style[data-deck-tokens]').forEach((s) => s.remove())
  window.history.replaceState(null, '', '#')
})

describe('mount', () => {
  it('hands slides components that know the brand, so brand.logo works', async () => {
    const withLogo = defineSlide({
      id: 'logo',
      claim: 'claim logo',
      build({ stage, tl, c }) {
        c.brand.logo(stage, { variant: 'side', height: 72 })
        tl.addLabel('step-0')
      },
    })
    const deck = makeDeck([withLogo])
    await deck.mount()
    const img = document.querySelector('.slide[data-slide-id="logo"] .brand-logo img')
    expect(img?.getAttribute('src')).toBe(testBrand.logo.light)
  })
  it('waits for slide images within the guard before it is ready', async () => {
    const decodes: string[] = []
    const withImage = defineSlide({
      id: 'img',
      claim: 'claim img',
      build({ stage, tl }) {
        const pic = stage.ownerDocument.createElement('img')
        Object.defineProperty(pic, 'complete', { value: true })
        Object.defineProperty(pic, 'decode', { value: () => new Promise<void>((r) => setTimeout(() => (decodes.push('done'), r()), 5)) })
        stage.appendChild(pic)
        tl.addLabel('step-0')
      },
    })
    const deck = makeDeck([withImage], { fontTimeoutMs: 200 })
    await deck.mount()
    expect(decodes).toEqual(['done'])
  })
  it('injects tokens and brand CSS, builds every slide, computes step counts, resolves ready', async () => {
    const deck = makeDeck([slide('a', 2), slide('b', 3)])
    await deck.mount()
    await deck.ready
    expect(deck.stepCounts).toEqual([2, 3])
    const css = document.head.querySelector('style[data-deck-tokens]')?.textContent ?? ''
    expect(css).toContain('--stage-w: 1920px')
    expect(css).toContain('--color-bg: #ffffff')
    expect(document.documentElement.lang).toBe('fr')
    expect(document.querySelectorAll('.deck-stage .slide')).toHaveLength(2)
    expect(activeId()).toBe('a')
    expect(window.location.hash).toBe('#/1/0')
    expect(boxX(0)).toBeCloseTo(10) // entry segment completed at step-0
    expect(boxX(1)).toBe(0)         // later slide sits at time 0
  })
  it('starts from a valid hash', async () => {
    window.location.hash = '#/2/1'
    const deck = makeDeck([slide('a', 2), slide('b', 3)])
    await deck.mount()
    expect(deck.position).toEqual({ slide: 1, step: 1 })
    expect(activeId()).toBe('b')
    expect(boxX(0)).toBeCloseTo(20) // earlier slide parked at its end
  })
  it('clamps an out-of-range hash and ignores garbage', async () => {
    window.location.hash = '#/9/9'
    let deck = makeDeck([slide('a', 2), slide('b', 3)])
    await deck.mount()
    expect(deck.position).toEqual({ slide: 1, step: 2 })
    document.body.innerHTML = ''
    window.location.hash = '#/abc'
    deck = makeDeck([slide('a', 2)])
    await deck.mount()
    expect(deck.position).toEqual({ slide: 0, step: 0 })
    expect(window.location.hash).toBe('#/1/0')
  })
  it('rejects a slide with bad labels and names it', async () => {
    const broken = defineSlide({
      id: 'broken',
      claim: 'x',
      build({ stage, tl }) {
        const b = stage.ownerDocument.createElement('div')
        stage.appendChild(b)
        tl.to(b, { x: 1, duration: 0.1 })
        tl.addLabel('step-1')
      },
    })
    const first = makeDeck([broken])
    await expect(first.mount()).rejects.toThrow(LabelError)
    await expect(first.ready).rejects.toThrow(LabelError) // a failed mount fails `ready` instead of leaving it pending
    document.body.innerHTML = ''
    await expect(makeDeck([broken]).mount()).rejects.toThrow(/broken/)
  })
  it('reduced mode keeps the same step counts and is read from the URL', async () => {
    const deck = makeDeck([slide('a', 3)], { reduced: true })
    await deck.mount()
    expect(deck.reduced).toBe(true)
    expect(deck.stepCounts).toEqual([3])

    document.body.innerHTML = ''
    window.history.replaceState(null, '', '?reduced=1#')
    try {
      const fromUrl = makeDeck([slide('a', 3)])
      expect(fromUrl.reduced).toBe(true)
      await fromUrl.mount()
      expect(fromUrl.stepCounts).toEqual([3])
    } finally {
      window.history.replaceState(null, '', `${window.location.pathname}#`)
    }
  })
})

describe('URL switches', () => {
  // Construction reads the URL and the OS setting; nothing is mounted, so a stub window is enough.
  const stubWin = (search: string, osReduced: boolean) =>
    ({
      location: { search },
      matchMedia: (q: string) => ({ matches: osReduced && q === '(prefers-reduced-motion: reduce)' }),
    }) as unknown as Window
  const deckAt = (search: string, osReduced = false, extra: Record<string, unknown> = {}) =>
    createDeck({ config: { title: 't', language: 'fr', brand: testBrand }, slides: [], root: document.createElement('div'), win: stubWin(search, osReduced), ...extra })

  it('reduced: a URL value wins over the OS setting, an absent one falls back to it', () => {
    expect(deckAt('?reduced=0', true).reduced).toBe(false) // forces full motion with OS Reduce Motion on
    for (const v of ['false', 'off', 'OFF']) expect(deckAt(`?reduced=${v}`, true).reduced).toBe(false)
    expect(deckAt('', true).reduced).toBe(true)
    expect(deckAt('', false).reduced).toBe(false)
    for (const q of ['?reduced', '?reduced=', '?reduced=1', '?reduced=yes']) expect(deckAt(q, false).reduced).toBe(true)
    expect(deckAt('?reduced=1', true, { reduced: false }).reduced).toBe(false) // an explicit option beats both
  })
  it('qa: turns ambient off unless its value is off', () => {
    expect(deckAt('').ambientEnabled).toBe(true)
    expect(deckAt('?qa=0').ambientEnabled).toBe(true)
    expect(deckAt('?qa=false').ambientEnabled).toBe(true)
    expect(deckAt('?qa').ambientEnabled).toBe(false)
    expect(deckAt('?qa=1').ambientEnabled).toBe(false)
    expect(deckAt('?qa=1', false, { qa: false }).ambientEnabled).toBe(true)
  })
})

describe('navigation', () => {
  it('steps forward and backward inside a slide and writes the hash', async () => {
    const deck = makeDeck([slide('a', 3)])
    await deck.mount()
    await deck.next()
    expect(deck.position).toEqual({ slide: 0, step: 1 })
    expect(window.location.hash).toBe('#/1/1')
    expect(boxX()).toBeCloseTo(20)
    await deck.prev()
    expect(deck.position.step).toBe(0)
    expect(boxX()).toBeCloseTo(10)
  })
  it('serialises rapid presses so N presses move N steps', async () => {
    const deck = makeDeck([slide('a', 4)])
    await deck.mount()
    void deck.next()
    void deck.next()
    await deck.next()
    expect(deck.position.step).toBe(3)
    expect(boxX()).toBeCloseTo(40)
  })
  it('crosses slides forward with a fade and backward onto the last step', async () => {
    const deck = makeDeck([slide('a', 1), slide('b', 2, { transition: 'fade' })])
    await deck.mount()
    await deck.next()
    expect(deck.position).toEqual({ slide: 1, step: 0 })
    expect(activeId()).toBe('b')
    expect(document.querySelectorAll('.slide.is-active')).toHaveLength(1)
    expect(Number(gsap.getProperty(document.querySelector('[data-slide-id="b"]')!, 'opacity'))).toBe(1)
    expect(boxX(1)).toBeCloseTo(10) // entry segment played
    await deck.prev()
    expect(deck.position).toEqual({ slide: 0, step: 0 })
    expect(activeId()).toBe('a')
    expect(boxX(1)).toBe(0) // slide left behind reset to time 0
  })
  it('plays the outgoing exit segment to the end before a cut, and steps back onto the last step', async () => {
    const seen: number[] = []
    const withExit = defineSlide({
      id: 'a',
      claim: 'claim a',
      build({ stage, tl }) {
        const box = stage.ownerDocument.createElement('div')
        box.className = 'box'
        stage.appendChild(box)
        tl.to(box, { x: 10, duration: 0.2, ease: 'none' })
        tl.addLabel('step-0')
        tl.addLabel('exit')
        tl.to(box, {
          x: -50,
          duration: 0.2,
          ease: 'none',
          // Records the incoming slide's opacity on every render of the exit segment.
          onUpdate: () => seen.push(Number(gsap.getProperty(document.querySelector('[data-slide-id="b"]')!, 'opacity'))),
        })
      },
    })
    const deck = makeDeck([withExit, slide('b', 1, { transition: 'cut' })])
    await deck.mount()
    seen.length = 0
    await deck.next()
    expect(deck.position).toEqual({ slide: 1, step: 0 })
    expect(boxX(0)).toBeCloseTo(-50) // exit segment played to the end of the timeline
    expect(seen.length).toBeGreaterThan(0)
    expect(seen.every((o) => o === 0)).toBe(true) // incoming slide stays hidden until the cut
    expect(activeId()).toBe('b')
    expect(boxX(1)).toBeCloseTo(10)
    await deck.prev()
    expect(deck.position).toEqual({ slide: 0, step: 0 })
    expect(boxX(0)).toBeCloseTo(10) // back on the last step, before the exit
  })
  it('uses a cut when asked and stops at both ends', async () => {
    const deck = makeDeck([slide('a', 1), slide('b', 1, { transition: 'cut' })])
    await deck.mount()
    await deck.prev()
    expect(deck.position).toEqual({ slide: 0, step: 0 })
    await deck.next()
    expect(activeId()).toBe('b')
    await deck.next()
    expect(deck.position).toEqual({ slide: 1, step: 0 })
  })
})

describe('seeking and inspection', () => {
  it('goTo seeks without animating and seekWithin lands mid-transition', async () => {
    const deck = makeDeck([slide('a', 3)])
    await deck.mount()
    await deck.goTo({ slide: 0, step: 2 })
    expect(boxX()).toBeCloseTo(30)
    expect(window.location.hash).toBe('#/1/2')
    await deck.seekWithin({ slide: 0, step: 2 }, 0.5)
    expect(boxX()).toBeCloseTo(25, 0)
    await deck.seekWithin({ slide: 0, step: 0 }, 0.5) // entry segment, 0 → 10
    expect(boxX()).toBeCloseTo(5, 0)
  })
  it('play returns frame samples and ends on the target step', async () => {
    gsap.globalTimeline.timeScale(1)
    try {
      const deck = makeDeck([slide('a', 2)])
      await deck.mount()
      const samples = await deck.play({ slide: 0, step: 1 })
      expect(samples.length).toBeGreaterThan(0)
      expect(deck.position.step).toBe(1)
      expect(boxX()).toBeCloseTo(20)
    } finally {
      gsap.globalTimeline.timeScale(20)
    }
  })
  it('exposes slide metadata, speed and the black screen', async () => {
    const deck = makeDeck([slide('a', 2, { notes: 'n', illustrative: true })])
    await deck.mount()
    expect(deck.slideMeta(0)).toEqual({ id: 'a', claim: 'claim a', notes: 'n', transition: 'fade', fullBleed: false, illustrative: true, tempo: 'normal', stepCount: 2 })
    deck.setSpeed(2)
    expect(gsap.globalTimeline.timeScale()).toBe(2)
    gsap.globalTimeline.timeScale(20)
    expect(deck.isBlack()).toBe(false)
    deck.toggleBlack()
    expect(document.querySelector('.deck-black')?.classList.contains('is-on')).toBe(true)
    expect(deck.isBlack()).toBe(true)
    deck.toggleBlack()
    expect(document.querySelector('.deck-black')?.classList.contains('is-on')).toBe(false)
    expect(deck.isBlack()).toBe(false)
  })
})

describe('ambient', () => {
  /** A one-step slide that floats its box; the loop is kept in `made` under the slide id. */
  function floating(id: string, made: Record<string, gsap.core.Timeline>, extra: Partial<SlideDefinition> = {}): SlideDefinition {
    return defineSlide({
      id,
      claim: `claim ${id}`,
      ...extra,
      build({ stage, tl, m }) {
        const box = stage.ownerDocument.createElement('div')
        box.className = 'box'
        stage.appendChild(box)
        made[id] = m.ambient(box, 'float')
        tl.to(box, { x: 10, duration: 0.2, ease: 'none' })
        tl.addLabel('step-0')
      },
    })
  }
  const opened: Deck[] = []
  const open = (slides: SlideDefinition[], extra: Record<string, unknown>) => {
    const deck = makeDeck(slides, extra)
    opened.push(deck)
    return deck
  }
  afterEach(() => {
    for (const deck of opened.splice(0)) deck.destroy() // no loop keeps playing into the next test
  })
  const playing = (loop: gsap.core.Timeline) => !loop.paused()
  const atRest = (loop: gsap.core.Timeline) => loop.paused() && loop.time() === 0

  it('holds every loop at rest in QA mode', async () => {
    const made: Record<string, gsap.core.Timeline> = {}
    const deck = open([floating('a', made), floating('b', made)], { qa: true })
    await deck.mount()
    expect(atRest(made.a!)).toBe(true)
    expect(atRest(made.b!)).toBe(true)
    await deck.next()
    expect(atRest(made.a!)).toBe(true)
    expect(atRest(made.b!)).toBe(true)
  })
  it('plays the active slide only, and moves with goTo', async () => {
    const made: Record<string, gsap.core.Timeline> = {}
    const deck = open([floating('a', made), floating('b', made)], { qa: false })
    await deck.mount()
    expect(playing(made.a!)).toBe(true)
    expect(atRest(made.b!)).toBe(true)
    await deck.goTo({ slide: 1, step: 0 })
    expect(atRest(made.a!)).toBe(true)
    expect(playing(made.b!)).toBe(true)
  })
  it('starts the incoming loops with the fade and rests the outgoing ones only once the slide is hidden', async () => {
    const made: Record<string, gsap.core.Timeline> = {}
    const deck = open([floating('a', made), floating('b', made, { transition: 'fade' })], { qa: false })
    await deck.mount()
    gsap.globalTimeline.timeScale(0.05) // a 6 s fade, to look inside it
    try {
      const going = deck.next()
      await new Promise((r) => setTimeout(r, 40))
      expect(document.querySelectorAll('.slide.is-active')).toHaveLength(2) // mid-transition
      expect(playing(made.b!)).toBe(true)
      expect(playing(made.a!)).toBe(true) // still moving while it fades out
      gsap.globalTimeline.timeScale(20)
      await going
    } finally {
      gsap.globalTimeline.timeScale(20)
    }
    expect(atRest(made.a!)).toBe(true)
    expect(playing(made.b!)).toBe(true)
    await deck.prev()
    expect(playing(made.a!)).toBe(true)
    expect(atRest(made.b!)).toBe(true)
  })
  it('setAmbient turns the loops off at rest and back on, live', async () => {
    const made: Record<string, gsap.core.Timeline> = {}
    const deck = open([floating('a', made)], { qa: false })
    await deck.mount()
    made.a!.time(3)
    deck.setAmbient(false)
    expect(deck.ambientEnabled).toBe(false)
    expect(atRest(made.a!)).toBe(true)
    deck.setAmbient(true)
    expect(playing(made.a!)).toBe(true)
  })
  it('registers nothing in reduced mode, and destroy kills the loops', async () => {
    const made: Record<string, gsap.core.Timeline> = {}
    const reduced = open([floating('a', made)], { qa: false, reduced: true })
    await reduced.mount()
    expect(made.a!.duration()).toBe(0)
    expect(made.a!.paused()).toBe(true) // the deck never played it
    document.body.innerHTML = ''
    const deck = open([floating('b', made)], { qa: false })
    await deck.mount()
    expect(playing(made.b!)).toBe(true)
    deck.destroy()
    expect(made.b!.isActive()).toBe(false)
    expect(made.b!.parent).toBeFalsy()
  })
})

describe('sortSlides', () => {
  it('orders by path and unwraps default exports', () => {
    const a = slide('a', 1), b = slide('b', 1)
    const out = sortSlides({ './slides/02-b/slide.ts': { default: b }, './slides/01-a/slide.ts': a })
    expect(out.map((s) => s.id)).toEqual(['a', 'b'])
  })
})

describe('live hooks (enter, hold, onStage)', () => {
  it('runs enter as a jump on mount, forward on a press, backward on Back, and aborts the left slide', async () => {
    const log: string[] = []
    const signals: AbortSignal[] = []
    const live = (id: string) =>
      slide(id, 1, {
        enter({ direction, signal }) {
          log.push(`${id}:${direction}`)
          signals.push(signal)
        },
      })
    const deck = makeDeck([live('a'), live('b')])
    await deck.mount()
    expect(log).toEqual(['a:jump'])
    await deck.next()
    expect(log).toEqual(['a:jump', 'b:forward'])
    expect(signals[0]!.aborted).toBe(true)
    expect(signals[1]!.aborted).toBe(false)
    await deck.prev()
    expect(log).toEqual(['a:jump', 'b:forward', 'a:backward'])
    expect(signals[1]!.aborted).toBe(true)
  })

  it('ignores forward presses while held, keeps Back working, and accepts them again after release', async () => {
    let release: (() => void) | undefined
    const holder = slide('holder', 1, {
      enter({ hold, direction }) {
        if (direction === 'forward') release = hold()
      },
    })
    const deck = makeDeck([slide('a', 1), holder, slide('c', 1)])
    await deck.mount()
    await deck.next()
    expect(activeId()).toBe('holder')
    expect(deck.isHeld()).toBe(true)
    await deck.next()
    expect(activeId()).toBe('holder')
    release!()
    await deck.next()
    expect(activeId()).toBe('c')
    await deck.prev()
    await deck.prev()
    expect(activeId()).toBe('a')
    expect(deck.isHeld()).toBe(false)
  })

  it('drops holds when the slide is left with Back', async () => {
    const holder = slide('holder', 1, {
      enter({ hold }) {
        hold()
      },
    })
    const deck = makeDeck([slide('a', 1), holder])
    await deck.mount()
    await deck.next()
    expect(deck.isHeld()).toBe(true)
    await deck.prev()
    expect(deck.isHeld()).toBe(false)
  })

  it('keeps the show running when an enter hook throws', async () => {
    const errors: unknown[] = []
    const original = console.error
    console.error = (...args: unknown[]) => void errors.push(args)
    const broken = slide('broken', 1, {
      enter({ hold }) {
        hold()
        throw new Error('boom')
      },
    })
    const deck = makeDeck([slide('a', 1), broken, slide('c', 1)])
    await deck.mount()
    await deck.next()
    expect(deck.isHeld()).toBe(false)
    await deck.next()
    expect(activeId()).toBe('c')
    console.error = original
    expect(errors).toHaveLength(1)
  })

  it('calls onStage with the stage before slides are built, so its layers sit under them', async () => {
    let seen: HTMLElement | null = null
    const deck = makeDeck([slide('a', 1)], {
      onStage: (stage: HTMLElement) => {
        seen = stage
        const under = stage.ownerDocument.createElement('div')
        under.className = 'under'
        stage.appendChild(under)
      },
    })
    await deck.mount()
    const stage = document.querySelector('.deck-stage')!
    expect(seen).toBe(stage)
    expect(stage.firstElementChild?.className).toBe('under')
  })
})
