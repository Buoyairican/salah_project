import type { Deck } from '@deck/kit'

/** H shows the keys and where the show is, for whoever sets up or rehearses. Hidden during the show. */
export function mountHelp(deck: Deck): void {
  const box = document.createElement('div')
  box.className = 'help'
  document.body.appendChild(box)
  const render = () => {
    const i = deck.position.slide
    const meta = deck.slideMeta(i)
    box.innerHTML = [
      `<b>Screen ${i + 1} / ${deck.stepCounts.length}</b> · ${meta.id}${deck.isHeld() ? ' · clip playing' : ''}`,
      `<span style="color:#9fb0cc">${meta.notes}</span>`,
      '',
      '<b>→ Space Enter PageDown</b> next · <b>← Backspace PageUp</b> back',
      '<b>S</b> skip the clip · <b>B</b> or <b>.</b> black screen · <b>F</b> full screen',
      '<b>number + Enter</b> jump to a screen · <b>H</b> hide this',
    ].join('<br>')
  }
  let timer = 0
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'h' && e.key !== 'H') return
    box.classList.toggle('is-on')
    window.clearInterval(timer)
    if (box.classList.contains('is-on')) {
      render()
      timer = window.setInterval(render, 400)
    }
  })
}
