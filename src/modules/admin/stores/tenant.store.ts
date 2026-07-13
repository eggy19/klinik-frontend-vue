import { defineStore } from 'pinia'
import { ref } from 'vue'
import { tenantApi } from '../api/tenant.api'
import type { Tenant, TenantInput } from '../types/tenant'

/** Store data master tenant (admin). Id berbeda dari context store 'tenant'. */
export const useAdminTenantStore = defineStore('admin-tenant', () => {
  const items = ref<Tenant[]>([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try {
      items.value = await tenantApi.getTenants()
    } finally {
      loading.value = false
    }
  }

  async function create(input: TenantInput) {
    const created = await tenantApi.createTenant(input)
    items.value = [created, ...items.value]
    return created
  }

  async function update(id: string, input: TenantInput) {
    const updated = await tenantApi.updateTenant(id, input)
    items.value = items.value.map((t) => (t.id === id ? updated : t))
    return updated
  }

  return { items, loading, fetchAll, create, update }
})
