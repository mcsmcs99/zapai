// src/utils/validators/cnpj.js

function onlyAlnumUpper (value = '') {
  return String(value)
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
}

/**
 * Converte caractere para valor de cálculo do DV do CNPJ alfanumérico.
 * Regra do manual: pode usar (ASCII - 48). Ex:
 * '0'..'9' => 0..9
 * 'A'..'Z' => 17..42
 */
function charToDvValue (ch) {
  const code = ch.charCodeAt(0)
  // '0'..'9'
  if (code >= 48 && code <= 57) return code - 48
  // 'A'..'Z'
  if (code >= 65 && code <= 90) return code - 48
  return NaN
}

function calcDvMod11 (values, weights) {
  let sum = 0
  for (let i = 0; i < values.length; i++) {
    sum += values[i] * weights[i]
  }
  const rest = sum % 11
  return rest < 2 ? 0 : 11 - rest
}

function isValidCnpjNumeric (cnpj14digits) {
  if (!/^\d{14}$/.test(cnpj14digits)) return false
  if (/^(\d)\1{13}$/.test(cnpj14digits)) return false

  const base = cnpj14digits.slice(0, 12)
  const dv = cnpj14digits.slice(12)

  const w1 = [5,4,3,2,9,8,7,6,5,4,3,2]
  const w2 = [6,5,4,3,2,9,8,7,6,5,4,3,2]

  const v1 = base.split('').map(Number)
  const d1 = calcDvMod11(v1, w1)

  const v2 = (base + String(d1)).split('').map(Number)
  const d2 = calcDvMod11(v2, w2)

  return dv === `${d1}${d2}`
}

/**
 * CNPJ alfanumérico:
 * - 14 chars (alnum), sendo os 2 últimos OBRIGATORIAMENTE dígitos (DV numérico)
 * - primeiros 12: alfanuméricos
 */
function isValidCnpjAlphanumeric (cnpj14alnum) {
  if (!/^[0-9A-Z]{14}$/.test(cnpj14alnum)) return false

  const base12 = cnpj14alnum.slice(0, 12)
  const dv2 = cnpj14alnum.slice(12)

  // DVs são numéricos (manual fala “dois dígitos verificadores numéricos”)
  if (!/^\d{2}$/.test(dv2)) return false

  // converte base12 em valores
  const values12 = []
  for (const ch of base12) {
    const v = charToDvValue(ch)
    if (!Number.isFinite(v)) return false
    values12.push(v)
  }

  const w1 = [5,4,3,2,9,8,7,6,5,4,3,2]
  const w2 = [6,5,4,3,2,9,8,7,6,5,4,3,2]

  const d1 = calcDvMod11(values12, w1)

  const values13 = values12.concat([d1])
  const d2 = calcDvMod11(values13, w2)

  return dv2 === `${d1}${d2}`
}

export function isValidCnpj (value) {
  const clean = onlyAlnumUpper(value)

  // Aceita somente 14 chars no total (sem pontuação)
  if (clean.length !== 14) return false

  // Se for só dígitos -> validação clássica
  if (/^\d{14}$/.test(clean)) return isValidCnpjNumeric(clean)

  // Caso contrário -> tenta alfanumérico (2026+)
  return isValidCnpjAlphanumeric(clean)
}

/**
 * Rule pronta pro Quasar:
 * - retorna true ou mensagem
 */
export function cnpjRule (value) {
  if (!value) return 'Obrigatório'
  return isValidCnpj(value) || 'CNPJ inválido'
}
