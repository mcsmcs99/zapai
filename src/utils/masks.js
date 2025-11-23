// src/utils/masks.js

export function getMask(type, region = 'BR') {
  const r = (region || 'BR').toUpperCase()

  switch (type) {
    case 'document':
      // específicos
      if (r === 'BR') return '##.###.###/####-##' // CNPJ
      if (r === 'US') return '##-#######'         // EIN (exemplo EUA)

      // genérico para qualquer outro país (até 20 dígitos)
      return '####################'

    case 'phone':
      // específicos
      if (r === 'BR') return '(##) ####-####'
      if (r === 'US') return '(###) ###-####'

      // genérico internacional: + e até 15 dígitos (E.164)
      // usuário digita o código do país e o número
      return '+###############'

    case 'whatsapp':
      // específicos
      if (r === 'BR') return '(##) #####-####'
      if (r === 'US') return '+1 (###) ###-####'

      // genérico internacional (mesma lógica do phone)
      return '+###############'

    default:
      return ''
  }
}
