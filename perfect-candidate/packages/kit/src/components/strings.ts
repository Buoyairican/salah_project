/** Interface strings the components render, per deck language. Unknown languages fall back to English. */
export interface ComponentStrings {
  badge: string
  low: string
  high: string
}

const STRINGS: Record<string, ComponentStrings> = {
  fr: { badge: 'Exemple de données', low: 'faible', high: 'élevé' },
  en: { badge: 'Example data', low: 'low', high: 'high' },
}

export function stringsFor(language: string): ComponentStrings {
  return STRINGS[language] ?? STRINGS.en!
}
