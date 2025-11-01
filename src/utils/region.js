// src/utils/region.js
let cachedRegion = null

/**
 * Detecta o país do usuário com fallback seguro.
 */
export async function detectRegion() {
  if (cachedRegion) return cachedRegion
  const cached = sessionStorage.getItem('user_region')
  if (cached) {
    cachedRegion = cached
    return cached
  }

  try {
    // Cloudflare devolve dados simples de rede
    const res = await fetch('https://www.cloudflare.com/cdn-cgi/trace')
    const text = await res.text()
    console.log(text)
    const match = text.match(/loc=([A-Z]{2})/)
    cachedRegion = match ? match[1] : 'BR'
    sessionStorage.setItem('user_region', cachedRegion)
    return cachedRegion
  } catch (e) {
    console.warn('🌐 Falha ao detectar país via Cloudflare, fallback para BR', e)
    cachedRegion = 'BR'
    return 'BR'
  }
}

/**
 * Retorna o país armazenado localmente (sem nova chamada)
 */
export function getRegion() {
  return cachedRegion || sessionStorage.getItem('user_region') || 'BR'
}
