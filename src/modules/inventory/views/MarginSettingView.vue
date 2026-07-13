<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { useToastFeedback } from '@/composables/useToastFeedback'
import { useMarginSettingStore } from '../stores/margin-setting.store'
import { emptyMarginSetting, type MarginSetting } from '../types/margin-setting'

const store = useMarginSettingStore()
const toast = useToastFeedback()

const form = reactive<MarginSetting>(emptyMarginSetting())
const submitting = ref(false)

const previewOtc = computed(() => 1000 * (1 + Number(form.marginOtcPercentage || 0) / 100))
const previewResep = computed(() => 1000 * (1 + Number(form.marginResepPercentage || 0) / 100))

watch(
  () => store.setting,
  (value) => Object.assign(form, value),
  { deep: true },
)

async function onSubmit() {
  submitting.value = true
  try {
    await store.save({
      marginOtcPercentage: Number(form.marginOtcPercentage) || 0,
      marginResepPercentage: Number(form.marginResepPercentage) || 0,
    })
    toast.success()
  } catch {
    toast.error()
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  store.fetch()
})
</script>

<template>
  <div class="margin-setting">
    <div class="margin-setting__head">
      <h1 class="margin-setting__title">Pengaturan Margin</h1>
    </div>

    <BaseCard>
      <form class="margin-setting__form" @submit.prevent="onSubmit">
        <p class="margin-setting__hint">
          Harga jual dihitung otomatis dari harga beli dikali margin ini. Item tanpa resep (OTC)
          memakai Margin OTC, item wajib resep memakai Margin Resep — ditentukan dari golongan obat
          yang dipilih pada data item.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <BaseInput
              v-model="form.marginOtcPercentage"
              label="Margin OTC (%)"
              type="number"
              placeholder="mis. 20"
            />
            <p class="margin-setting__preview">
              Contoh: harga beli Rp1.000 → harga jual Rp{{ previewOtc.toLocaleString('id-ID') }}
            </p>
          </div>
          <div>
            <BaseInput
              v-model="form.marginResepPercentage"
              label="Margin Resep (%)"
              type="number"
              placeholder="mis. 15"
            />
            <p class="margin-setting__preview">
              Contoh: harga beli Rp1.000 → harga jual Rp{{ previewResep.toLocaleString('id-ID') }}
            </p>
          </div>
        </div>

        <div class="margin-setting__actions">
          <BaseButton label="Simpan" type="submit" :loading="submitting" />
        </div>
      </form>
    </BaseCard>
  </div>
</template>

<style scoped>
.margin-setting {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.margin-setting__title {
  font-size: var(--font-2xl);
  color: var(--text);
}

.margin-setting__hint {
  font-size: var(--font-sm);
  color: var(--text-muted);
  margin-bottom: var(--space-4);
}

.margin-setting__preview {
  font-size: var(--font-xs);
  color: var(--text-muted);
  margin-top: var(--space-1);
}

.margin-setting__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-6);
}
</style>
