import { ref, watch, type Ref } from 'vue'
import { branchApi } from '../api/branch.api'
import type { Branch } from '../types/branch'

/**
 * Cascade Tenant → Cabang: saat tenant berganti, opsi cabang di-fetch ulang
 * (`/branches?tenantId=`) dan pilihan cabang direset. Dipakai form user,
 * filter riwayat login, dsb.
 */
export function useTenantBranchCascade(tenantId: Ref<string | null>) {
  const branchId = ref<string | null>(null)
  const branchOptions = ref<Branch[]>([])
  const loadingBranches = ref(false)

  watch(
    tenantId,
    async (next) => {
      branchId.value = null
      branchOptions.value = []
      if (!next) return
      loadingBranches.value = true
      try {
        branchOptions.value = await branchApi.getBranches(next)
      } finally {
        loadingBranches.value = false
      }
    },
    { immediate: true },
  )

  return { branchId, branchOptions, loadingBranches }
}
