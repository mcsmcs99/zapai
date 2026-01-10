import { ref, watch, unref } from 'vue'
import { buildTimezoneOptions } from 'src/utils/timezones'

export function useTimezones (countryCodeRef) {
  const options = ref(buildTimezoneOptions(unref(countryCodeRef) || 'BR'))

  if (countryCodeRef) {
    watch(
      countryCodeRef,
      (newCode) => {
        options.value = buildTimezoneOptions(newCode || 'BR')
      },
      { immediate: true }
    )
  }

  return { options }
}
