/** Procedural textures, drawn once at start-up: film grain, frost and the dust in the light. */

export function rand(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A 256 px tile of monochrome noise, as a data URL, for the grain layer. */
export function grainTile(doc: Document): string {
  const c = doc.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  if (!g) return ''
  const img = g.createImageData(256, 256)
  const r = rand(5)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(r() * 255)
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 255
  }
  g.putImageData(img, 0, 0)
  return c.toDataURL('image/png')
}

/** Frost: a haze of ice and branching crystals over the whole frame; a radial mask shows it at the edges only. */
export function drawFrost(canvas: HTMLCanvasElement): void {
  const g = canvas.getContext('2d')
  if (!g) return
  const W = canvas.width, H = canvas.height
  const r = rand(41)
  g.clearRect(0, 0, W, H)
  const haze = g.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, W * 0.62)
  haze.addColorStop(0, 'rgba(225, 242, 255, 0.05)')
  haze.addColorStop(1, 'rgba(225, 242, 255, 0.34)')
  g.fillStyle = haze
  g.fillRect(0, 0, W, H)
  g.lineCap = 'round'
  const branch = (x: number, y: number, a: number, len: number, depth: number) => {
    const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len
    g.lineWidth = 0.5 + depth * 0.35
    g.strokeStyle = `rgba(232, 246, 255, ${0.12 + depth * 0.09})`
    g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke()
    if (depth <= 0) return
    const n = 2 + Math.floor(r() * 3)
    for (let k = 1; k <= n; k++) {
      const t = k / (n + 1)
      const bx = x + (x2 - x) * t, by = y + (y2 - y) * t
      const side = r() < 0.5 ? -1 : 1
      branch(bx, by, a + side * (0.95 + r() * 0.25), len * (0.32 + r() * 0.22), depth - 1)
    }
    branch(x2, y2, a + (r() - 0.5) * 0.5, len * 0.6, depth - 1)
  }
  for (let i = 0; i < 1400; i++) {
    // crystals grow from the edges inwards: many small feathers, denser near the frame
    const side = Math.floor(r() * 4)
    const along = r()
    const depthIn = Math.pow(r(), 2.6) * 0.3
    let x = 0, y = 0, a = 0
    if (side === 0) { x = along * W; y = depthIn * H; a = Math.PI / 2 }
    else if (side === 1) { x = W - depthIn * W; y = along * H; a = Math.PI }
    else if (side === 2) { x = along * W; y = H - depthIn * H; a = -Math.PI / 2 }
    else { x = depthIn * W; y = along * H; a = 0 }
    branch(x, y, a + (r() - 0.5) * 2.2, 10 + r() * 46 * (1 - depthIn), 2 + Math.floor(r() * 2))
  }
  // sparkles
  for (let i = 0; i < 900; i++) {
    const x = r() * W, y = r() * H
    g.fillStyle = `rgba(255, 255, 255, ${0.1 + r() * 0.5})`
    g.fillRect(x, y, 1.4, 1.4)
  }
}

interface Mote {
  x: number; y: number; z: number; vx: number; vy: number; ph: number; tw: number
}

/** Dust floating in the light. `step` moves it, `draw` paints it; a frozen world just stops stepping. */
export class Dust {
  private motes: Mote[] = []
  private g: CanvasRenderingContext2D | null
  tint: [number, number, number] = [210, 225, 255]
  boost = 1

  constructor(private canvas: HTMLCanvasElement, count = 90) {
    this.g = canvas.getContext('2d')
    const r = rand(77)
    for (let i = 0; i < count; i++) {
      const inLight = r() < 0.72
      this.motes.push({
        x: inLight ? 820 + r() * 1100 : r() * 1920,
        y: inLight ? r() * 820 : r() * 1080,
        z: 0.3 + r() * 0.7,
        vx: (r() - 0.5) * 6,
        vy: -2 - r() * 7,
        ph: r() * Math.PI * 2,
        tw: 0.4 + r() * 1.2,
      })
    }
  }

  step(dt: number, t: number): void {
    for (const m of this.motes) {
      m.x += (m.vx + Math.sin(t * 0.3 + m.ph) * 4) * dt * m.z
      m.y += m.vy * dt * m.z
      if (m.y < -10) { m.y = 1090; m.x = 820 + ((m.x * 7.31) % 1100) }
      if (m.x < -10) m.x = 1930
      if (m.x > 1930) m.x = -10
    }
  }

  draw(t: number): void {
    const g = this.g
    if (!g) return
    g.clearRect(0, 0, this.canvas.width, this.canvas.height)
    const [cr, cg, cb] = this.tint
    for (const m of this.motes) {
      // brighter inside the patch of light (upper right), as real dust only shows in a beam
      const light = Math.max(0, 1 - Math.hypot((m.x - 1380) / 760, (m.y - 360) / 560))
      const a = (0.08 + light * 0.5) * (0.55 + 0.45 * Math.sin(t * m.tw + m.ph)) * m.z * this.boost
      if (a < 0.02) continue
      g.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${Math.min(1, a)})`
      g.beginPath()
      g.arc(m.x, m.y, 0.8 + m.z * 1.9, 0, Math.PI * 2)
      g.fill()
    }
  }
}
