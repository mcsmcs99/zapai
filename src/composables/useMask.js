// src/composables/useMask.js
import { computed } from 'vue'
import { getMask } from 'src/utils/masks'

export function useMask(type) {
  const mask = computed(() => getMask(type))
  return { mask }
}
