export interface MarginSetting {
  marginOtcPercentage: number
  marginResepPercentage: number
}

export function emptyMarginSetting(): MarginSetting {
  return { marginOtcPercentage: 0, marginResepPercentage: 0 }
}
