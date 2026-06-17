import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Branch {
  id: string
  name: string
}

/**
 * Cabang aktif dalam tenant. Placeholder MVP — diisi dummy,
 * nantinya diisi dari API per tenant.
 */
export const useBranchStore = defineStore('branch', () => {
  const list = ref<Branch[]>([
    { id: 'b-001', name: 'Cabang Pusat' },
    { id: 'b-002', name: 'Cabang Kedua' },
  ])
  const current = ref<Branch>(list.value[0])

  function setBranch(branch: Branch) {
    current.value = branch
  }

  return { list, current, setBranch }
})
