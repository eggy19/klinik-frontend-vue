import { defineStore } from 'pinia'
import { ref } from 'vue'
import { branchApi } from '../api/branch.api'
import type { Branch, BranchInput } from '../types/branch'

/** Store data master cabang (admin). Id berbeda dari context store 'branch'. */
export const useAdminBranchStore = defineStore('admin-branch', () => {
  const items = ref<Branch[]>([])
  const loading = ref(false)
  const tenantFilter = ref<string | null>(null)

  async function fetchAll() {
    loading.value = true
    try {
      items.value = await branchApi.getBranches(tenantFilter.value ?? undefined)
    } finally {
      loading.value = false
    }
  }

  async function setTenantFilter(tenantId: string | null) {
    tenantFilter.value = tenantId
    await fetchAll()
  }

  async function create(input: BranchInput) {
    const created = await branchApi.createBranch(input)
    items.value = [created, ...items.value]
    return created
  }

  async function update(id: string, input: BranchInput) {
    const updated = await branchApi.updateBranch(id, input)
    items.value = items.value.map((b) => (b.id === id ? updated : b))
    return updated
  }

  return { items, loading, tenantFilter, fetchAll, setTenantFilter, create, update }
})
