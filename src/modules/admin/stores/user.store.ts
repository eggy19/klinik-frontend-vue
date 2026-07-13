import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userApi } from '../api/user.api'
import type { EntityStatus } from '../types/common'
import type { AdminUser, CreateUserInput, UpdateUserInput } from '../types/user'

/** Store data master pengguna (admin). */
export const useAdminUserStore = defineStore('admin-user', () => {
  const items = ref<AdminUser[]>([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try {
      items.value = await userApi.getUsers()
    } finally {
      loading.value = false
    }
  }

  async function create(input: CreateUserInput) {
    await userApi.createUser(input)
    await fetchAll()
  }

  async function update(id: string, input: UpdateUserInput) {
    await userApi.updateUser(id, input)
    await fetchAll()
  }

  async function updateStatus(id: string, status: EntityStatus) {
    await userApi.updateStatus(id, status)
    await fetchAll()
  }

  async function unlock(id: string) {
    await userApi.unlockUser(id)
    await fetchAll()
  }

  return { items, loading, fetchAll, create, update, updateStatus, unlock }
})
