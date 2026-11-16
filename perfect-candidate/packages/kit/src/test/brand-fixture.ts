import { defineBrand } from '../brand/types'

export const testBrand = defineBrand({
  name: 'test',
  colors: { bg: '#ffffff', surface: '#fafafa', ink: '#111111', inkMuted: '#555555', line: '#dddddd', accent: '#1f6f4a', accentSoft: '#dcefe4' },
  data: { risk: ['#2e8b57', '#9acd32', '#f4c542', '#f08a24', '#d7263d'], categorical: ['#111111', '#222222', '#333333', '#444444', '#555555', '#666666'] },
  fonts: { display: 'serif', text: 'sans-serif' },
  tempo: 1,
  emphasisEase: 'back.out(1.2)',
  logo: { light: '/logo.svg' },
})
