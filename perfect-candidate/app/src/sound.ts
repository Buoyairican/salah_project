/**
 * The two sounds of the show, made in code (no file to lose, no copyright), rendered once at start-up into audio
 * buffers so they play the very instant the Narrator presses.
 *
 *  FREEZE   a hard stop: a deep impact, a sharp snap, a short "tape stop" fall, then a crystalline ring of ice.
 *  UNFREEZE a breath of air that rises and opens into a soft warm chord, then fades out (about 2.2 s). Actors
 *           start again when it has faded.
 *
 * Browsers only allow sound after a first key press; `unlock()` runs on every key press (the pre-show press does it).
 */
type Name = 'freeze' | 'unfreeze'

const RATE = 48000

function rand(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function noiseBuffer(ctx: BaseAudioContext, seconds: number, seed: number, pink = false): AudioBuffer {
  const len = Math.floor(seconds * ctx.sampleRate)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  const r = rand(seed)
  let b0 = 0, b1 = 0, b2 = 0
  for (let i = 0; i < len; i++) {
    const w = r() * 2 - 1
    if (!pink) {
      d[i] = w
      continue
    }
    b0 = 0.99765 * b0 + w * 0.099046
    b1 = 0.963 * b1 + w * 0.2965164
    b2 = 0.57 * b2 + w * 1.0526913
    d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2
  }
  return buf
}

/** A small hall: exponentially decaying stereo noise. */
function impulse(ctx: BaseAudioContext, seconds: number, decay: number, seed: number): AudioBuffer {
  const len = Math.floor(seconds * ctx.sampleRate)
  const buf = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    const r = rand(seed + ch * 101)
    for (let i = 0; i < len; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / len, decay)
  }
  return buf
}

function env(param: AudioParam, points: Array<[number, number]>, curve: 'lin' | 'exp' = 'exp') {
  const [t0, v0] = points[0]!
  param.setValueAtTime(Math.max(v0, 0.0001), t0)
  for (const [t, v] of points.slice(1)) {
    if (curve === 'exp') param.exponentialRampToValueAtTime(Math.max(v, 0.0001), t)
    else param.linearRampToValueAtTime(v, t)
  }
}

async function renderFreeze(): Promise<AudioBuffer> {
  const dur = 2.6
  const ctx = new OfflineAudioContext(2, Math.ceil(dur * RATE), RATE)
  const master = ctx.createGain()
  master.gain.value = 0.9
  const verb = ctx.createConvolver()
  verb.buffer = impulse(ctx, 2.2, 3.2, 7)
  const wet = ctx.createGain()
  wet.gain.value = 0.32
  verb.connect(wet).connect(master)
  master.connect(ctx.destination)
  const bus = ctx.createGain()
  bus.connect(master)
  bus.connect(verb)

  // 1. impact: a sine that falls from 120 Hz to 38 Hz
  const sub = ctx.createOscillator()
  sub.type = 'sine'
  env(sub.frequency, [[0, 120], [0.32, 38]])
  const subG = ctx.createGain()
  env(subG.gain, [[0, 0.0001], [0.004, 1.0], [0.9, 0.0001]])
  sub.connect(subG).connect(master)
  sub.start(0)
  sub.stop(1)

  // 2. snap: a 30 ms burst of bright noise
  const snap = ctx.createBufferSource()
  snap.buffer = noiseBuffer(ctx, 0.2, 3)
  const snapF = ctx.createBiquadFilter()
  snapF.type = 'highpass'
  snapF.frequency.value = 1800
  const snapG = ctx.createGain()
  env(snapG.gain, [[0, 0.0001], [0.002, 0.9], [0.06, 0.0001]])
  snap.connect(snapF).connect(snapG).connect(bus)
  snap.start(0)

  // 3. tape stop: a buzzy tone dropping in pitch, as if time itself slowed down
  const tape = ctx.createOscillator()
  tape.type = 'sawtooth'
  env(tape.frequency, [[0, 330], [0.42, 46]])
  const tapeF = ctx.createBiquadFilter()
  tapeF.type = 'lowpass'
  env(tapeF.frequency, [[0, 2600], [0.42, 220]])
  const tapeG = ctx.createGain()
  env(tapeG.gain, [[0, 0.0001], [0.01, 0.16], [0.36, 0.08], [0.46, 0.0001]])
  tape.connect(tapeF).connect(tapeG).connect(bus)
  tape.start(0)
  tape.stop(0.5)

  // 4. ice: inharmonic bell partials ringing out, plus a fine crackle
  const partials = [1975, 2637, 3322, 4186, 5274, 6645]
  partials.forEach((f, i) => {
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = f * (1 + (i % 2 ? 0.003 : -0.002))
    const g = ctx.createGain()
    const peak = 0.11 / (1 + i * 0.35)
    const end = 1.2 + (partials.length - i) * 0.18
    env(g.gain, [[0.03, 0.0001], [0.045, peak], [end, 0.0001]])
    o.connect(g).connect(bus)
    o.start(0.03)
    o.stop(end + 0.05)
  })
  const crackle = ctx.createBufferSource()
  crackle.buffer = noiseBuffer(ctx, 0.9, 11)
  const crF = ctx.createBiquadFilter()
  crF.type = 'bandpass'
  crF.frequency.value = 7500
  crF.Q.value = 1.4
  const crG = ctx.createGain()
  env(crG.gain, [[0.02, 0.0001], [0.04, 0.22], [0.7, 0.0001]])
  crackle.connect(crF).connect(crG).connect(bus)
  crackle.start(0.02)

  return normalize(await ctx.startRendering(), 0.89)
}

async function renderUnfreeze(): Promise<AudioBuffer> {
  const dur = 2.9
  const ctx = new OfflineAudioContext(2, Math.ceil(dur * RATE), RATE)
  const master = ctx.createGain()
  master.gain.value = 0.85
  const verb = ctx.createConvolver()
  verb.buffer = impulse(ctx, 2.4, 2.6, 19)
  const wet = ctx.createGain()
  wet.gain.value = 0.35
  verb.connect(wet).connect(master)
  master.connect(ctx.destination)
  const bus = ctx.createGain()
  bus.connect(master)
  bus.connect(verb)

  // 1. the breath: pink noise through a band that opens upwards
  const air = ctx.createBufferSource()
  air.buffer = noiseBuffer(ctx, 2.4, 23, true)
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.Q.value = 0.9
  env(bp.frequency, [[0, 280], [1.15, 3600], [2.2, 5200]])
  const airG = ctx.createGain()
  env(airG.gain, [[0, 0.0001], [0.95, 0.85], [2.15, 0.0001]])
  const pan = ctx.createStereoPanner()
  env(pan.pan, [[0, -0.6], [2.2, 0.6]], 'lin')
  air.connect(bp).connect(airG).connect(pan).connect(bus)
  air.start(0)

  // 2. the thaw: a soft A major chord that swells and lifts slightly in pitch
  const chord = [220, 277.18, 329.63, 440, 554.37]
  chord.forEach((f, i) => {
    const o = ctx.createOscillator()
    o.type = i < 2 ? 'triangle' : 'sine'
    env(o.frequency, [[0.35, f * 0.985], [1.6, f]])
    const g = ctx.createGain()
    const peak = 0.075 / (1 + i * 0.25)
    env(g.gain, [[0.35, 0.0001], [1.25, peak], [2.6, 0.0001]])
    o.connect(g).connect(bus)
    o.start(0.35)
    o.stop(2.7)
  })

  // 3. a light shimmer on top, as the ice lets go
  const sh = ctx.createBufferSource()
  sh.buffer = noiseBuffer(ctx, 1.6, 29)
  const shF = ctx.createBiquadFilter()
  shF.type = 'highpass'
  shF.frequency.value = 6000
  const shG = ctx.createGain()
  env(shG.gain, [[0.6, 0.0001], [1.2, 0.07], [2.1, 0.0001]])
  sh.connect(shF).connect(shG).connect(bus)
  sh.start(0.6)

  return normalize(await ctx.startRendering(), 0.7)
}

function normalize(buf: AudioBuffer, peak: number): AudioBuffer {
  let max = 0
  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < d.length; i++) max = Math.max(max, Math.abs(d[i]!))
  }
  if (max > 0) {
    const k = peak / max
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      const d = buf.getChannelData(ch)
      for (let i = 0; i < d.length; i++) d[i] = d[i]! * k
    }
  }
  return buf
}

class SoundBank {
  private ctx: AudioContext | null = null
  private buffers = new Map<Name, AudioBuffer>()
  private ready: Promise<void> | null = null
  private playing = new Set<AudioBufferSourceNode>()
  volume = 1

  /** Render both sounds (no sound plays; allowed before any key press). */
  load(): Promise<void> {
    if (!this.ready) {
      this.ready = Promise.all([renderFreeze(), renderUnfreeze()])
        .then(([f, u]) => {
          this.buffers.set('freeze', f)
          this.buffers.set('unfreeze', u)
        })
        .catch((err) => console.error('sounds could not be prepared', err))
    }
    return this.ready
  }

  /** Create or wake the audio output. Call from a key press: browsers only allow sound after one. */
  unlock(): void {
    try {
      if (!this.ctx) this.ctx = new AudioContext({ latencyHint: 'interactive' })
      if (this.ctx.state === 'suspended') void this.ctx.resume()
    } catch (err) {
      console.error('audio unavailable', err)
    }
  }

  play(name: Name, gain = 1): void {
    const buf = this.buffers.get(name)
    if (!this.ctx || !buf) return
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    const g = this.ctx.createGain()
    g.gain.value = gain * this.volume
    src.connect(g).connect(this.ctx.destination)
    src.onended = () => this.playing.delete(src)
    this.playing.add(src)
    src.start()
  }

  /** Length, peak and loudness of each prepared sound (rehearsal checks). */
  info(): Record<string, { seconds: number; peak: number; rms: number }> {
    const out: Record<string, { seconds: number; peak: number; rms: number }> = {}
    for (const [name, buf] of this.buffers) {
      const d = buf.getChannelData(0)
      let peak = 0
      let sum = 0
      for (let i = 0; i < d.length; i++) {
        peak = Math.max(peak, Math.abs(d[i]!))
        sum += d[i]! * d[i]!
      }
      out[name] = { seconds: +buf.duration.toFixed(2), peak: +peak.toFixed(3), rms: +Math.sqrt(sum / d.length).toFixed(4) }
    }
    return out
  }

  /** Cut any sound still ringing (used when the presenter goes back). */
  stopAll(): void {
    for (const s of this.playing) {
      try {
        s.stop()
      } catch {
        /* already stopped */
      }
    }
    this.playing.clear()
  }
}

export const sound = new SoundBank()
