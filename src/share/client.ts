// Partner sharing through the diyetbot-share service (github.com/sezercankaynar/diyetbot-share, /v1/share):
// pairing with an invite code, each day's summary, the partner's days and cheers. The device key is kept only on this phone (localStorage, not in backups).
import { DEFAULT_SHARE_PREFS, type ShareDayData, type SharePrefs } from '@/engine'

export interface ShareSettings {
  /** Device key ("shr_…"); empty = not sharing. */
  key: string
  me: string
  url: string
  prefs: SharePrefs
}
export interface PartnerDay {
  day: string
  data: ShareDayData
  updated_at: string
}
export interface Reaction {
  id: string
  day: string
  emoji: string
  message: string | null
  seen: boolean
  created_at: string
  mine: boolean
}
export interface PartnerView {
  partner: { name: string; last_seen_at: string } | null
  days: PartnerDay[]
  reactions: Reaction[]
}

const KEY = 'diyetbot.share'
export const SHARE_URL = 'https://diyetbot-share.vercel.app'
export const DEFAULT_SHARE: ShareSettings = { key: '', me: '', url: SHARE_URL, prefs: { ...DEFAULT_SHARE_PREFS } }

export function loadShare(): ShareSettings {
  try {
    const raw = localStorage.getItem(KEY)
    const s = raw ? { ...DEFAULT_SHARE, ...JSON.parse(raw) } : { ...DEFAULT_SHARE }
    // Sharing first lived on the Claude gateway; it has its own service now.
    if (!s.url || s.url.includes('claude-gateway')) s.url = SHARE_URL
    return { ...s, prefs: { ...DEFAULT_SHARE_PREFS, ...s.prefs } }
  } catch {
    return { ...DEFAULT_SHARE }
  }
}
export function saveShare(s: ShareSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // Storage unavailable: lasts for this session.
  }
}

export class ShareError extends Error {
  constructor(public type: string, message: string) {
    super(message)
  }
}

const MESSAGES: Record<string, string> = {
  invite_invalid: 'Kod yanlış ya da süresi dolmuş (24 saat geçerli). Partnerinden yeni kod iste.',
  pair_full: 'Bu eşleşme dolu ya da artık yok.',
  already_paired: 'Zaten eşleştiniz.',
  share_unauthorized: 'Eşleşme bitmiş. İstersen yeniden eşleşebilirsin.',
  no_partner: 'Partnerin henüz katılmadı.',
  rate_limited: 'Çok sık deneme yapıldı; biraz sonra tekrar dene.',
  not_found: 'Paylaşım servisine ulaşılamadı (adres yanlış ya da servis kurulmamış).',
}

async function call<T>(s: Pick<ShareSettings, 'url' | 'key'>, method: string, path: string, body?: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${s.url.replace(/\/+$/, '')}/v1/share${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(s.key ? { 'X-Share-Key': s.key } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
  } catch {
    throw new ShareError('network', 'Sunucuya ulaşılamadı; internet bağlantını kontrol et.')
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const type: string = data?.error?.type ?? `http_${res.status}`
    throw new ShareError(type, MESSAGES[type] ?? `İşlem başarısız (${data?.error?.message ?? res.status}).`)
  }
  return data as T
}

export const shareApi = {
  /** Starts sharing or, with a key, a new code for the pair. */
  invite: (s: ShareSettings, name: string) =>
    call<{ member_key?: string; code: string; expires_at: string }>(s, 'POST', '/invite', s.key ? {} : { name }),
  join: (s: ShareSettings, code: string, name: string) =>
    call<{ member_key: string; partner: { name: string } }>({ url: s.url, key: '' }, 'POST', '/join', { code, name }),
  me: (s: ShareSettings) => call<{ me: { name: string }; partner: { name: string; last_seen_at: string } | null }>(s, 'GET', '/me'),
  putDay: (s: ShareSettings, day: string, data: ShareDayData) => call<{ ok: true }>(s, 'PUT', '/day', { day, data }),
  partner: (s: ShareSettings, days = 7) => call<PartnerView>(s, 'GET', `/partner?days=${days}`),
  react: (s: ShareSettings, day: string, emoji: string, message?: string) =>
    call<{ reaction: Reaction }>(s, 'POST', '/react', { day, emoji, ...(message ? { message } : {}) }),
  seen: (s: ShareSettings, ids: string[]) => call<{ ok: true }>(s, 'POST', '/seen', { ids }),
  leave: (s: ShareSettings) => call<{ ok: true }>(s, 'DELETE', '/me'),
}
