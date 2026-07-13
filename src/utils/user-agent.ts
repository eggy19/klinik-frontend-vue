export interface ParsedUserAgent {
  browser: string
  os: string
}

/**
 * Parser user-agent ringan untuk tampilan ("Chrome · Windows") tanpa
 * dependency tambahan. String mentah tetap ditampilkan lewat tooltip.
 */
export function parseUserAgent(ua: string | null | undefined): ParsedUserAgent | null {
  if (!ua) return null

  let browser = 'Browser lain'
  if (/edg(a|ios)?\//i.test(ua)) browser = 'Edge'
  else if (/opr\/|opera/i.test(ua)) browser = 'Opera'
  else if (/firefox\//i.test(ua)) browser = 'Firefox'
  else if (/chrome\/|crios\//i.test(ua)) browser = 'Chrome'
  else if (/safari\//i.test(ua)) browser = 'Safari'

  let os = 'OS lain'
  if (/windows/i.test(ua)) os = 'Windows'
  else if (/android/i.test(ua)) os = 'Android'
  else if (/iphone|ipad|ios/i.test(ua)) os = 'iOS'
  else if (/mac os|macintosh/i.test(ua)) os = 'macOS'
  else if (/linux/i.test(ua)) os = 'Linux'

  return { browser, os }
}

/** Label singkat "Chrome · Windows"; fallback "-" bila UA kosong. */
export function formatUserAgent(ua: string | null | undefined): string {
  const parsed = parseUserAgent(ua)
  if (!parsed) return '-'
  return `${parsed.browser} · ${parsed.os}`
}
