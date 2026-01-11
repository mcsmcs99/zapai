import { ref, watch, unref } from 'vue'
import { countries as COUNTRIES } from 'countries-list'
import { match } from '@formatjs/intl-localematcher'

/**
 * Sugere locale e moeda com base no ISO2 (BR/US/PT...)
 * - regionRef: ref/computed com ISO2
 * - supportedLocales: array com os locales suportados pelo app (ex: ['pt-BR','en-US',...])
 * - defaults: { locale: 'pt-BR', currency: 'BRL', region: 'BR' }
 */
export function useLocaleCurrency (regionRef, supportedLocales = [], defaults = {}) {
  const suggestedLocale = ref(defaults.locale || 'pt-BR')
  const suggestedCurrency = ref(defaults.currency || 'BRL')

  function compute (region) {
    const r = String(region || defaults.region || 'BR').toUpperCase()
    const data = COUNTRIES[r] || null

    // moeda ISO-4217 (ex: BRL)
    const currency = data?.currency || defaults.currency || null

    // languages do país em ISO 639-1 (ex: ['pt'])
    const langs = Array.isArray(data?.languages) ? data.languages : []

    // candidatos: pt-BR, en-BR, pt, en...
    const candidates = [
      ...langs.map(l => `${l}-${r}`),
      `en-${r}`,
      ...langs,
      'en'
    ]

    const fallbackLocale = defaults.locale || (supportedLocales[0] || 'pt-BR')

    const locale =
      supportedLocales?.length
        ? match(candidates, supportedLocales, fallbackLocale)
        : fallbackLocale

    return { locale, currency }
  }

  watch(
    regionRef,
    (newRegion) => {
      const { locale, currency } = compute(unref(newRegion))
      suggestedLocale.value = locale
      suggestedCurrency.value = currency
    },
    { immediate: true }
  )

  return { suggestedLocale, suggestedCurrency }
}
