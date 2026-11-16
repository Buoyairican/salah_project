import type { DeckConfig, SlideDefinition } from '@deck/kit'
import { experts } from './content/experts'
import { scenes } from './content/scenes'
import { theme } from './src/theme'
import preshow from './slides/preshow'
import title from './slides/title'
import part1 from './slides/part1'
import { freezeSlide } from './slides/freeze'
import { expertSlide } from './slides/expert'
import part2 from './slides/part2'
import final from './slides/final'
import credits from './slides/credits'

export const config: DeckConfig = {
  title: 'The Perfect Candidate',
  language: 'en',
  brand: theme,
}

/**
 * The show, in order. 20 screens, 19 presses, all on the Narrator's own words:
 *   pre-show → title → Part 1 → (Freeze · Expert) × 7 → Part 2 → final question → credits
 */
export const slides: SlideDefinition[] = [
  preshow,
  title,
  part1,
  ...scenes.flatMap((scene) => {
    const expert = experts.find((x) => x.scene === scene.n)
    if (!expert) throw new Error(`no expert for scene ${scene.n} in content/experts.ts`)
    return [freezeSlide(scene), expertSlide(scene, expert)]
  }),
  part2,
  final,
  credits,
]
