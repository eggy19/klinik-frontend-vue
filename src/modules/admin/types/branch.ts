import type { EntityStatus } from './common'

export interface Branch {
  id: string
  tenantId: string
  name: string
  code: string
  status: EntityStatus
  createdAt: string
  updatedAt: string
}

/** Payload form. `tenantId` dan `code` hanya dikirim saat create. */
export interface BranchInput {
  tenantId: string
  name: string
  code: string
  status: EntityStatus
}

export function emptyBranch(): BranchInput {
  return {
    tenantId: '',
    name: '',
    code: '',
    status: 'active',
  }
}
