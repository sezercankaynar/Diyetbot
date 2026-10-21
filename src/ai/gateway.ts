// Connection to the Claude gateway (github.com/sezercankaynar/claude-gateway-backend): POST /v1/chat
// with the user's gateway token. The token is entered in the app and kept only on this device
// (localStorage, not in backups); the Claude API key itself stays in the gateway.

export interface AiSettings {
  token: string
  url: string
  /** Model for turning written text into foods (cheap is enough). */
  logModel: string
  /** Model for the coach chat. */
  coachModel: string
}

export const AI_MODELS = [
  { id: 'claude-haiku-5-5', label: 'Haiku 5.5 · en ucuz, hızlı' },
  { id: 'claude-sonnet-5-5', label: 'Sonnet 5.5 · dengeli' },
  { id: 'claude-opus-5-5', label: 'Opus 5.5 · en güçlü, pahalı' },
] as const

export const DEFAULT_AI: AiSettings = {
  token: '',
  url: 'https://claude-gateway-backend.vercel.app',
  logModel: 'claude-haiku-5-5',
  coachModel: 'claude-sonnet-5-5',
}

const KEY = 'diyetbot.ai'

export function loadAi(): AiSettings {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULT_AI, ...JSON.parse(raw) } : { ...DEFAULT_AI }
  } catch {
    return { ...DEFAULT_AI }
  }
}
export function saveAi(s: AiSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // Storage unavailable: settings last for this session only.
  }
}

/** Anthropic content block as the gateway passes it through. */
export type Block = { type: string; [k: string]: unknown }
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string | Block[]
}
export interface ChatRequest {
  model: string
  system?: string
  messages: ChatMessage[]
  max_tokens?: number
  tools?: { name: string; description: string; input_schema: Record<string, unknown> }[]
  tool_choice?: { type: 'auto' | 'none' }
  format?: { type: 'json_schema'; schema: Record<string, unknown> }
}
export interface ChatResponse {
  id: string
  model: string
  content: string
  content_blocks: Block[]
  tool_calls: { id: string; name: string; input: unknown }[]
  stop_reason: string
  usage: { input_tokens: number; output_tokens: number }
}

export class AiError extends Error {
  constructor(public type: string, message: string) {
    super(message)
  }
}

const MESSAGES: Record<string, string> = {
  unauthorized: 'Token geçersiz. Ben → Yapay zekâ bölümünden token\'ı kontrol et.',
  token_disabled: 'Bu token gateway panelinde kapatılmış.',
  token_expired: 'Token\'ın süresi dolmuş; gateway panelinden yenisini oluştur.',
  model_not_allowed: 'Seçili model bu token için izinli değil; ayarlardan başka model seç.',
  model_not_found: 'Seçili model bulunamadı; ayarlardan başka model seç.',
  rate_limited: 'Çok sık istek gönderildi; bir dakika sonra tekrar dene.',
  upstream_rate_limited: 'Claude şu an yoğun; biraz sonra tekrar dene.',
  upstream_auth_error: 'Gateway\'deki Claude API anahtarı Anthropic tarafından reddediliyor. Gateway panelinde Claude Anahtarları → "Test et" ile kontrol et; gerekirse yeni anahtar gir (sk-ant-api…, tür: API anahtarı).',
  upstream_key_disabled: 'Gateway\'deki Claude anahtarı pasif.',
}

/** One request to the gateway; errors come back as AiError with a Turkish message. */
export async function gatewayChat(s: AiSettings, req: ChatRequest, signal?: AbortSignal): Promise<ChatResponse> {
  if (!s.token) throw new AiError('no_token', 'Önce Ben → Yapay zekâ bölümüne gateway token\'ını gir.')
  let res: Response
  try {
    res = await fetch(`${s.url.replace(/\/+$/, '')}/v1/chat`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${s.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal,
    })
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') throw new AiError('aborted', 'İptal edildi.')
    throw new AiError('network', 'Gateway\'e ulaşılamadı; internet bağlantını kontrol et.')
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const type: string = data?.error?.type ?? `http_${res.status}`
    throw new AiError(type, MESSAGES[type] ?? `Yapay zekâ isteği başarısız (${data?.error?.message ?? res.status}).`)
  }
  if (data?.stop_reason === 'refusal') throw new AiError('refusal', 'Bu isteğe yanıt verilemedi.')
  return data as ChatResponse
}

/** Checks the token: lists the models it may use. */
export async function testGateway(s: AiSettings): Promise<{ ok: true; models: string[] } | { ok: false; message: string }> {
  try {
    const res = await fetch(`${s.url.replace(/\/+$/, '')}/v1/models`, { headers: { Authorization: `Bearer ${s.token}` } })
    const data = await res.json().catch(() => null)
    if (!res.ok) return { ok: false, message: MESSAGES[data?.error?.type] ?? data?.error?.message ?? `HTTP ${res.status}` }
    return { ok: true, models: (data?.allowed_models ?? []) as string[] }
  } catch {
    return { ok: false, message: 'Gateway\'e ulaşılamadı; adresi ve internet bağlantını kontrol et.' }
  }
}
