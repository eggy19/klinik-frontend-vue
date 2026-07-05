<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { useToastFeedback } from '@/composables/useToastFeedback'
import { useAuthStore } from '../stores/auth.store'
import type { ApiErrorResponse } from '@/api/types'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToastFeedback()

const form = reactive({ email: '', password: '' })

type ErrorMap = Partial<Record<'email' | 'password', string>>
const errors = ref<ErrorMap>({})
const formError = ref('')
const submitting = ref(false)

function validate(): boolean {
  const e: ErrorMap = {}
  if (!form.email.trim()) {
    e.email = 'Email wajib diisi.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    e.email = 'Format email tidak valid.'
  }
  if (!form.password) e.password = 'Password wajib diisi.'
  errors.value = e
  return Object.keys(e).length === 0
}

function messageForStatus(status: number | undefined, backendMessage: string | undefined): string {
  switch (status) {
    case 401:
      return 'Email atau password tidak valid.'
    case 403:
      return backendMessage || 'Akun Anda tidak aktif, hubungi administrator.'
    case 422:
      return backendMessage || 'Periksa kembali email dan password Anda.'
    case 429:
      return 'Terlalu banyak percobaan, coba lagi nanti.'
    case 503:
      return 'Layanan sedang mengalami gangguan. Coba lagi nanti.'
    default:
      return backendMessage || 'Login gagal. Silakan coba lagi.'
  }
}

async function onSubmit() {
  formError.value = ''
  if (!validate()) return

  submitting.value = true
  try {
    await authStore.login({ email: form.email, password: form.password })

    const redirectTo = sessionStorage.getItem('redirectAfterLogin')
    sessionStorage.removeItem('redirectAfterLogin')
    router.push(redirectTo || '/')
  } catch (err) {
    let status: number | undefined
    let backendMessage: string | undefined
    if (axios.isAxiosError<ApiErrorResponse>(err)) {
      status = err.response?.status
      backendMessage = err.response?.data?.message
    }
    formError.value = messageForStatus(status, backendMessage)
    toast.error(formError.value, 'Login Gagal')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <BaseCard title="Masuk ke Klinik SaaS" class="login-card">
    <form class="login-form" @submit.prevent="onSubmit">
      <p v-if="formError" class="login-form__error">{{ formError }}</p>

      <BaseInput
        v-model="form.email"
        label="Email"
        type="email"
        required
        placeholder="nama@klinik.test"
        :error="errors.email"
      />
      <BaseInput
        v-model="form.password"
        label="Password"
        type="password"
        required
        :error="errors.password"
      />

      <BaseButton
        label="Masuk"
        type="submit"
        :loading="submitting"
        class="login-form__submit"
      />
    </form>
  </BaseCard>
</template>

<style scoped>
.login-card {
  width: 100%;
  max-width: 400px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.login-form__error {
  color: var(--color-danger);
  font-size: var(--font-sm);
}

.login-form__submit {
  width: 100%;
  margin-top: var(--space-2);
}
</style>
