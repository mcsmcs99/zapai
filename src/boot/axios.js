import { boot } from 'quasar/wrappers'
import axios from 'axios'
import { useAuthStore } from 'src/stores/auth'

const api = axios.create({
  baseURL: import.meta.env.API_BASE_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' }
})

export default boot(({ store }) => {
  // Anexa token se existir
  api.interceptors.request.use((config) => {
    const auth = useAuthStore(store)
    if (auth.token) {
      config.headers.Authorization = `Bearer ${auth.token}`
    }
    return config
  })

  // (opcional) trata 401 global
  api.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err?.response?.status === 401) {
        const auth = useAuthStore(store)
        auth.logout(true) // true = silencioso para não notificar 2x
      }
      return Promise.reject(err)
    }
  )
})

export { api }  // para importar e usar no store
