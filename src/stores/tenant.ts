import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Tenant {
  id: string
  name: string
}

/**
 * Tenant aktif (SaaS multi-tenant). Placeholder MVP — diisi dummy,
 * nantinya diisi dari sesi login / API.
 */
export const useTenantStore = defineStore('tenant', () => {
  const current = ref<Tenant>({ id: 't-001', name: 'Apotek Sehat Sentosa' })

  function setTenant(tenant: Tenant) {
    current.value = tenant
  }

  return { current, setTenant }
})
