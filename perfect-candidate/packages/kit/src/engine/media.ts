/** One image: settled once it has loaded (or was already complete) and decoded. True when it can be painted. */
function imageReady(img: HTMLImageElement): Promise<boolean> {
  const decoded = (): Promise<boolean> =>
    typeof img.decode === 'function' ? img.decode().then(() => true, () => false) : Promise.resolve(img.naturalWidth > 0)
  if (img.complete) return decoded()
  return new Promise<boolean>((resolve) => {
    img.addEventListener('load', () => resolve(decoded()), { once: true })
    img.addEventListener('error', () => resolve(false), { once: true })
  })
}

/**
 * Wait for every image under `root` (the brand logo, slide media) to load and decode. Resolves true when all can
 * be painted, false on an error, a failed decode or the timeout. Never rejects, so a missing image can never block
 * a deck from mounting, and snapshots taken after `ready` never catch a logo mid-load.
 */
export async function imagesReady(root: ParentNode, timeoutMs = 3000): Promise<boolean> {
  const imgs = Array.from(root.querySelectorAll('img'))
  if (!imgs.length) return true
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => resolve(false), timeoutMs)
  })
  const all = Promise.all(imgs.map(imageReady)).then((oks) => oks.every(Boolean))
  const result = await Promise.race([all, timeout])
  if (timer) clearTimeout(timer)
  return result
}
