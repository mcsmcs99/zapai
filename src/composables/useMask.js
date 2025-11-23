// src/composables/useMask.js
import { ref, watch, unref } from 'vue'
import { getMask } from 'src/utils/masks'

export function useMask(type, regionRef) {
  const mask = ref(getMask(type, unref(regionRef) || 'BR'))

  if (regionRef) {
    watch(
      regionRef,
      newRegion => {
        mask.value = getMask(type, newRegion || 'BR')
      },
      { immediate: true }
    )
  }

  return { mask }
}
