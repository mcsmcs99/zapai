import { boot } from 'quasar/wrappers'
import { detectRegion } from 'src/utils/region'

export default boot(async () => {
  await detectRegion()
})
