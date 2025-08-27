import { boot } from 'quasar/wrappers'
import { setCssVar } from 'quasar'   // <-- use isto

export default boot(() => {
  // define as cores do tema em runtime
  setCssVar('primary',  '#23B573')  // verde
  setCssVar('secondary','#455CE9')  // azul
  setCssVar('positive', '#23B573')
  // (opcional)
  // setCssVar('negative', '#D21B3C')
  // setCssVar('warning',  '#F5A524')
  // setCssVar('info',     '#2E43B5')
})
