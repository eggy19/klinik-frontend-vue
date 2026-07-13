import { defineStore } from 'pinia'
import { ref } from 'vue'
import { marginSettingApi } from '../api/margin-setting.api'
import { emptyMarginSetting, type MarginSetting } from '../types/margin-setting'

/** Store pengaturan margin OTC/Resep (satu baris per branch). */
export const useMarginSettingStore = defineStore('marginSetting', () => {
  const setting = ref<MarginSetting>(emptyMarginSetting())
  const loading = ref(false)

  async function fetch() {
    loading.value = true
    try {
      setting.value = await marginSettingApi.get()
    } finally {
      loading.value = false
    }
  }

  async function save(input: MarginSetting) {
    setting.value = await marginSettingApi.update(input)
    return setting.value
  }

  return { setting, loading, fetch, save }
})
