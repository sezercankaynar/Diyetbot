import type { ChatMessage, LlmConfig } from './types'

/** Minimal OpenAI-compatible /chat/completions call. No SDK dependency. */
export async function chatCompletion(
  cfg: LlmConfig,
  messages: ChatMessage[],
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(`${cfg.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({ model: cfg.model, messages, temperature: 0.4 }),
    signal,
  })
  if (!res.ok) throw new Error(`LLM isteği başarısız: ${res.status}`)
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  return data.choices?.[0]?.message?.content?.trim() ?? ''
}
