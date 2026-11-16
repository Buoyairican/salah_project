import { defineBrand } from '@deck/kit'

/**
 * The show's brand for the kit. The kit needs hex colours and two font families; the show's own palette and type
 * live in styles.css as CSS variables (night, ice, warm), which is where the design is tuned.
 */
export const theme = defineBrand({
  name: 'perfect-candidate',
  colors: {
    bg: '#04060c',
    surface: '#0f1830',
    ink: '#eef2fa',
    inkMuted: '#a8b3c9',
    line: '#26304a',
    accent: '#5fb6ff',
    accentSoft: '#1f5bff',
    deep: '#04060c',
  },
  data: {
    risk: ['#1f5bff', '#5fb6ff', '#dff2ff', '#ffd29a', '#ff9f43'],
    categorical: ['#5fb6ff', '#ff9f43', '#9d8cff', '#5fd3a8', '#ff7aa8', '#eef2fa'],
  },
  fonts: { display: 'Instrument Serif', text: 'Inter Variable' },
  tempo: 1,
  emphasisEase: 'expo.out',
  logo: { light: '' },
})
