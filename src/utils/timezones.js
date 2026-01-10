import ct from 'countries-and-timezones'

/**
 * Retorna timezones IANA válidas para um país (ISO alpha2: BR, US, PT, etc).
 * Se não achar, retorna [].
 */
export function getTimezonesByCountry (countryCode = 'BR') {
  const code = String(countryCode || 'BR').toUpperCase()

  // countries-and-timezones usa alpha2 (BR, US...)
  const country = ct.getCountry(code)
  if (!country || !Array.isArray(country.timezones)) return []

  // country.timezones já vem como IANA strings
  return country.timezones
}

/**
 * Normaliza para o formato usado no QSelect: { label, value }
 */
export function buildTimezoneOptions (countryCode = 'BR') {
  const list = getTimezonesByCountry(countryCode)

  // fallback se o país não tiver tz cadastrado na lib (raro)
  const safe = list.length ? list : ['UTC']

  return safe.map(tz => ({
    label: tz,
    value: tz
  }))
}
