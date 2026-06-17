import { ref, watch, type Ref } from 'vue'

/**
 * Mengembalikan ref yang merupakan versi debounce dari `source`.
 * Default 300ms sesuai standar search (docs/06-ui-ux-standard.md).
 */
export function useDebounce<T>(source: Ref<T>, delay = 300): Ref<T> {
  const debounced = ref(source.value) as Ref<T>
  let timer: ReturnType<typeof setTimeout> | undefined

  watch(source, (value) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = value
    }, delay)
  })

  return debounced
}
