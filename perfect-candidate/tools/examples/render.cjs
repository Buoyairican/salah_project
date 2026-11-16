/*
 * Example clips, step 2 of 3: the pictures. Renders, with headless Chromium, the example speaker photos and every
 * frame of the example videos (25 fps), from scene.html and the timing manifests written by make_audio.py.
 *   node render.cjs <work folder>
 */
const { chromium } = require('playwright')
const fs = require('node:fs')
const path = require('node:path')

const HERE = __dirname
const APP = path.join(HERE, '..', '..', 'app')
const FPS = 25

async function main() {
  const work = process.argv[2]
  if (!work) throw new Error('usage: node render.cjs <work folder>')
  const spec = JSON.parse(fs.readFileSync(path.join(HERE, 'clips.json'), 'utf8'))
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto('file://' + path.join(HERE, 'scene.html'))
  const media = path.join(APP, 'public', 'media')
  fs.mkdirSync(media, { recursive: true })

  for (const clip of spec.clips) {
    const manifest = JSON.parse(fs.readFileSync(path.join(work, `${clip.id}.json`), 'utf8'))
    const envelope = JSON.parse(fs.readFileSync(path.join(APP, 'content', 'waveforms', `${clip.id}.json`), 'utf8'))

    // The speaker photo (every clip has one; the card decides whether to show it).
    await page.setViewportSize({ width: 640, height: 640 })
    await page.evaluate((p) => window.setup(p), { w: 640, h: 640, hue: clip.hue, mode: 'photo', env: [] })
    await page.evaluate(() => window.frame(3))
    await page.locator('canvas').screenshot({ path: path.join(media, `${clip.id}-photo.jpg`), type: 'jpeg', quality: 88 })

    if (clip.kind !== 'video') continue
    const [w, h] = clip.orientation === 'portrait' ? [720, 1280] : [1280, 720]
    await page.setViewportSize({ width: w, height: h })
    await page.evaluate((p) => window.setup(p), { w, h, hue: clip.hue, mode: 'video', orientation: clip.orientation, env: envelope })
    const dir = path.join(work, clip.id)
    fs.rmSync(dir, { recursive: true, force: true })
    fs.mkdirSync(dir, { recursive: true })
    const frames = Math.ceil(manifest.duration * FPS)
    for (let i = 0; i < frames; i++) {
      await page.evaluate((t) => window.frame(t), i / FPS)
      await page.locator('canvas').screenshot({ path: path.join(dir, `${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 90 })
    }
    console.log(`${clip.id}: ${frames} frames ${w}x${h}`)
  }
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
