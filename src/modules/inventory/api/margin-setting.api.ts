import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type { MarginSetting } from '../types/margin-setting'

// Field numerik (kolom `numeric` di Postgres) dikirim sebagai string, mis. "20.00".
interface ApiMarginSetting {
  marginOtcPercentage?: number | string | null
  marginResepPercentage?: number | string | null
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  return Number(value)
}

function fromApi(raw: ApiMarginSetting): MarginSetting {
  return {
    marginOtcPercentage: toNumber(raw.marginOtcPercentage),
    marginResepPercentage: toNumber(raw.marginResepPercentage),
  }
}

export const marginSettingApi = {
  async get(): Promise<MarginSetting> {
    const res = await apiClient.get<ApiResponse<ApiMarginSetting>>(
      '/inventory/master/margin-settings',
    )
    return fromApi(res.data.data)
  },

  async update(input: MarginSetting): Promise<MarginSetting> {
    const res = await apiClient.put<ApiResponse<ApiMarginSetting>>(
      '/inventory/master/margin-settings',
      input,
    )
    return fromApi(res.data.data)
  },
}
