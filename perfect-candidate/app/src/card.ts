import { encode } from 'uqr'
import type { Expert, Field } from '../content/experts'
import { el, maskedWords } from './dom'

const FIELD_COLOR: Record<Field, string> = {
  'Human Resources': '#ffb36b',
  Engineering: '#6cc0ff',
  Cybersecurity: '#a08cff',
  Recruitment: '#ff8fb3',
  Management: '#5fd3a8',
  Academia: '#ffe08a',
  'Panel interview': '#eef2fa',
}

export const LINKEDIN_SVG =
  '<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#0a66c2"/><path fill="#fff" d="M9.2 12.6h3.6V24H9.2zM11 7a2.1 2.1 0 1 1 0 4.2A2.1 2.1 0 0 1 11 7zm4.1 5.6h3.4v1.6h.1c.5-.9 1.6-1.9 3.4-1.9 3.6 0 4.3 2.4 4.3 5.5V24h-3.6v-5.5c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V24h-3.6z"/></svg>'

const PERSON_SVG =
  '<svg viewBox="0 0 64 64" width="44%" height="44%" aria-hidden="true"><circle cx="32" cy="22" r="11" fill="none" stroke="currentColor" stroke-width="3"/><path d="M12 54c2.5-11 10.5-17 20-17s17.5 6 20 17" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>'

/** A QR code as an SVG, drawn from the module grid with softly rounded modules (still scannable). */
export function qrSvg(text: string): string {
  const q = encode(text, { ecc: 'M', border: 0 })
  const n = q.size
  const cells: string[] = []
  q.data.forEach((row, y) =>
    row.forEach((on, x) => {
      if (on) cells.push(`<rect x="${x + 0.06}" y="${y + 0.06}" width="0.88" height="0.88" rx="0.22"/>`)
    }),
  )
  return `<svg viewBox="0 0 ${n} ${n}" shape-rendering="geometricPrecision"><g fill="#04060c">${cells.join('')}</g></svg>`
}

/** `https://www.linkedin.com/in/someone/` → `linkedin.com/in/someone` */
export function shortUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
}

export interface CardParts {
  root: HTMLElement
  photo: HTMLElement
  ring: HTMLElement
  /** Pieces that enter one after another. */
  name: HTMLElement[]
  job: HTMLElement
  company: HTMLElement
  tags: HTMLElement
  link: HTMLElement | null
  rule: HTMLElement | null
}

export function photoEl(parent: HTMLElement, expert: Expert): HTMLElement {
  const photo = el('div', 'card-photo', parent)
  if (expert.person.photo) {
    const img = el('img', '', photo)
    img.src = `media/${expert.person.photo}`
    img.alt = ''
    img.decoding = 'async'
  } else {
    const icon = el('span', 'mono-icon', photo)
    icon.innerHTML = PERSON_SVG
  }
  return photo
}

/**
 * The card that introduces a professional. `hero` is the large centred version shown first; `panel` is the
 * compact one that stays beside the video. Only what the person agreed to is shown (see content/experts.ts).
 */
export function buildCard(parent: HTMLElement, expert: Expert, variant: 'hero' | 'panel'): CardParts {
  const p = expert.person
  const root = el('div', 'card', parent)
  const head = variant === 'panel' ? el('div', 'card-head', root) : root
  const photo = photoEl(head, expert)
  const ring = el('span', 'card-ring', photo.parentElement!)
  ring.style.display = 'none'
  const meta = el('div', 'card-meta', head)

  const nameBox = el('div', 'card-name', meta)
  const title = p.name ?? p.jobTitle
  const name = maskedWords(nameBox, title)
  const job = el('div', 'card-job', meta)
  job.textContent = p.name ? p.jobTitle : ''
  if (!p.name) job.style.display = 'none'
  const company = el('div', 'card-company', meta)
  company.textContent = p.company

  const body = variant === 'panel' ? root : meta
  const rule = variant === 'panel' ? el('div', 'card-rule', body) : null
  const tags = el('div', 'card-tags', body)
  const field = el('span', 'tag', tags)
  const sw = el('span', 'swatch', field)
  sw.style.background = FIELD_COLOR[p.field]
  el('span', '', field).textContent = p.field
  const lang = el('span', 'tag lang', tags)
  lang.textContent = expert.media.language === 'fr' ? 'Speaks French · English subtitles' : 'Speaks English'
  if (expert.example) el('span', 'tag example', tags).textContent = 'Example'

  let link: HTMLElement | null = null
  if (p.linkedin) {
    link = el('div', 'card-link', body)
    const qr = el('div', 'card-qr', link)
    qr.innerHTML = qrSvg(p.linkedin)
    const li = el('div', 'card-li', link)
    const row = el('div', 'card-li-row', li)
    row.insertAdjacentHTML('beforeend', LINKEDIN_SVG)
    el('span', '', row).textContent = 'LinkedIn'
    el('div', 'card-li-url', li).textContent = shortUrl(p.linkedin)
    el('div', 'card-li-hint', li).textContent = 'Scan to connect'
  }
  return { root, photo, ring, name, job, company, tags, link, rule }
}
