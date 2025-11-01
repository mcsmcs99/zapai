// src/utils/masks.js
import { getRegion } from './region'

export function getMask(type) {
  const region = getRegion()?.toUpperCase() || 'BR'

  switch (type) {
    case 'document':
      if (region === 'BR') return '##.###.###/####-##' // CNPJ
      if (region === 'US') return '##-#######'         // EIN (exemplo EUA)
      return '##############'

    case 'phone':
      if (region === 'BR') return '(##) ####-####'
      if (region === 'US') return '(###) ###-####'
      return '#############'

    case 'whatsapp':
      if (region === 'BR') return '(##) #####-####'
      if (region === 'US') return '+1 (###) ###-####'
      return '#############'

    default:
      return ''
  }
}
