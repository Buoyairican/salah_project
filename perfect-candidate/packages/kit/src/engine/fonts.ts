/**
 * Wait for the given font families. Resolves true when all loaded, false on timeout,
 * rejection or when the Font Loading API is unavailable. Never rejects, so a missing
 * font can never block a deck from mounting.
 */
export async function fontsReady(families: string[], doc: Document = document, timeoutMs = 3000): Promise<boolean> {
  const fonts = (doc as Document & { fonts?: FontFaceSet }).fonts
  if (!fonts) return false
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => resolve(false), timeoutMs)
  })
  const all = Promise.all([...families.map((f) => fonts.load(`1em "${f}"`)), fonts.ready])
    .then(() => true)
    .catch(() => false)
  const result = await Promise.race([all, timeout])
  if (timer) clearTimeout(timer)
  return result
}
