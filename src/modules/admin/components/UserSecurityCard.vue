<script setup lang="ts">
import BaseTag from '@/components/base/BaseTag.vue'
import type { UserSecurityInfo } from '../types/user'
import { formatDateTime, formatRelative } from '@/utils/format'
import { formatUserAgent } from '@/utils/user-agent'

defineProps<{
  security: UserSecurityInfo | null
}>()
</script>

<template>
  <div v-if="security" class="security">
    <dl class="security__grid">
      <div class="security__item">
        <dt>Gagal Login Berturut-turut</dt>
        <dd>{{ security.failedLoginCount }}</dd>
      </div>
      <div class="security__item">
        <dt>Status Kunci</dt>
        <dd>
          <BaseTag v-if="security.isLocked" variant="danger" value="Terkunci" />
          <BaseTag v-else variant="success" value="Tidak Terkunci" />
        </dd>
      </div>
      <div class="security__item">
        <dt>Terkunci Sampai</dt>
        <dd>
          <span v-if="security.blockUntil" :title="formatRelative(security.blockUntil)">
            {{ formatDateTime(security.blockUntil) }}
          </span>
          <span v-else>-</span>
        </dd>
      </div>
      <div class="security__item">
        <dt>Alasan Kunci</dt>
        <dd>{{ security.lockReason ?? '-' }}</dd>
      </div>
      <div class="security__item">
        <dt>Login Terakhir</dt>
        <dd>
          <span v-if="security.lastLoginAt" :title="formatRelative(security.lastLoginAt)">
            {{ formatDateTime(security.lastLoginAt) }}
          </span>
          <span v-else>-</span>
        </dd>
      </div>
      <div class="security__item">
        <dt>IP Login Terakhir</dt>
        <dd>{{ security.lastLoginIp ?? '-' }}</dd>
      </div>
      <div class="security__item">
        <dt>Perangkat Terakhir</dt>
        <dd :title="security.lastLoginDevice ?? undefined">
          {{ formatUserAgent(security.lastLoginDevice) }}
        </dd>
      </div>
      <div class="security__item">
        <dt>Wajib Ganti Password</dt>
        <dd>
          <BaseTag v-if="security.forceChangePassword" variant="warning" value="Ya" />
          <span v-else>Tidak</span>
        </dd>
      </div>
    </dl>
  </div>
  <p v-else class="security__empty">Data keamanan tidak tersedia untuk pengguna ini.</p>
</template>

<style scoped>
.security__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--space-4) var(--space-6);
}

.security__item dt {
  font-size: var(--font-xs);
  color: var(--text-muted, #6b7280);
  margin-bottom: var(--space-1);
}

.security__item dd {
  font-size: var(--font-sm);
  color: var(--text);
}

.security__empty {
  color: var(--text-muted, #6b7280);
  font-size: var(--font-sm);
}
</style>
