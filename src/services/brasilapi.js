// src/services/brasilapi.js
import axios from 'axios'

const brasilApi = axios.create({
  baseURL: 'https://brasilapi.com.br/api',
  timeout: 10000
})

/**
 * Busca dados de CNPJ na BrasilAPI
 * @param {string} cnpj - CNPJ com ou sem máscara
 * @returns {Promise<object>} - Dados retornados pela API
 */
export async function fetchCnpj (cnpj) {
  const clean = (cnpj || '').replace(/\D/g, '')

  if (!clean || clean.length !== 14) {
    const err = new Error('CNPJ inválido')
    err.code = 'INVALID_CNPJ'
    throw err
  }

  try {
    const { data } = await brasilApi.get(`/cnpj/v1/${clean}`)
    return data
  } catch (error) {
    if (error.response && error.response.status === 404) {
      const err = new Error('CNPJ não encontrado na BrasilAPI')
      err.code = 'CNPJ_NOT_FOUND'
      throw err
    }

    const err = new Error('Erro ao consultar BrasilAPI')
    err.code = 'BRASILAPI_ERROR'
    throw err
  }
}

export default {
  fetchCnpj
}
