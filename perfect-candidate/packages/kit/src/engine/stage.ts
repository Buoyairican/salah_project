import { STAGE } from '../tokens/stage'

export function computeScale(vw: number, vh: number): number {
  if (vw <= 0 || vh <= 0) return 0
  return Math.min(vw / STAGE.width, vh / STAGE.height)
}

export interface Stage {
  viewport: HTMLElement
  el: HTMLElement
  readonly scale: number
  fit(): void
  destroy(): void
}

export function createStage(root: HTMLElement, win: Window = window): Stage {
  const doc = root.ownerDocument
  const viewport = doc.createElement('div')
  viewport.className = 'deck-viewport'
  const el = doc.createElement('div')
  el.className = 'deck-stage'
  viewport.appendChild(el)
  root.appendChild(viewport)

  let scale = 1
  const fit = () => {
    scale = computeScale(win.innerWidth, win.innerHeight)
    el.style.transform = `scale(${scale})`
  }
  fit()
  win.addEventListener('resize', fit)

  return {
    viewport,
    el,
    get scale() {
      return scale
    },
    fit,
    destroy() {
      win.removeEventListener('resize', fit)
      viewport.remove()
    },
  }
}
