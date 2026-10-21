// The tool loop: Claude may call the app's own functions (food search, the day's numbers …); the app
// runs them and sends the results back until Claude answers. Numbers always come from the app.
import { gatewayChat, type AiSettings, type Block, type ChatMessage, type ChatRequest } from './gateway'

export interface AiTool {
  name: string
  description: string
  input_schema: Record<string, unknown>
  run: (input: Record<string, unknown>) => unknown | Promise<unknown>
}

export interface AgentResult {
  text: string
  /** The whole conversation including tool rounds (to continue a chat). */
  messages: ChatMessage[]
  usage: { input: number; output: number }
}

const MAX_RESULT = 6000

export async function runAgent(
  s: AiSettings,
  o: {
    model: string; system: string; messages: ChatMessage[]; tools: AiTool[]
    format?: ChatRequest['format']; maxTokens?: number; maxRounds?: number; signal?: AbortSignal
    onTool?: (name: string) => void
  },
): Promise<AgentResult> {
  const messages = [...o.messages]
  const usage = { input: 0, output: 0 }
  const defs = o.tools.map(({ name, description, input_schema }) => ({ name, description, input_schema }))
  for (let round = 0; round < (o.maxRounds ?? 6); round++) {
    const res = await gatewayChat(s, {
      model: o.model, system: o.system, messages, max_tokens: o.maxTokens ?? 2000,
      ...(defs.length ? { tools: defs, tool_choice: { type: 'auto' as const } } : {}),
      ...(o.format ? { format: o.format } : {}),
    }, o.signal)
    usage.input += res.usage?.input_tokens ?? 0
    usage.output += res.usage?.output_tokens ?? 0
    if (res.stop_reason !== 'tool_use' || !res.tool_calls?.length) {
      messages.push({ role: 'assistant', content: res.content_blocks?.length ? res.content_blocks : res.content || '…' })
      return { text: res.content, messages, usage }
    }
    // The assistant turn goes back unchanged (thinking blocks included), then all results in one message.
    messages.push({ role: 'assistant', content: res.content_blocks })
    // In order (a dish created by one call can be used by the next).
    const results: Block[] = []
    for (const call of res.tool_calls) {
      const tool = o.tools.find((t) => t.name === call.name)
      o.onTool?.(call.name)
      try {
        if (!tool) throw new Error(`unknown tool ${call.name}`)
        const out = JSON.stringify(await tool.run((call.input ?? {}) as Record<string, unknown>))
        results.push({ type: 'tool_result', tool_use_id: call.id, content: out.length > MAX_RESULT ? `${out.slice(0, MAX_RESULT)}…` : out })
      } catch (e) {
        results.push({ type: 'tool_result', tool_use_id: call.id, content: String((e as Error).message ?? e), is_error: true })
      }
    }
    messages.push({ role: 'user', content: results })
  }
  throw new Error('Yapay zekâ yanıtı tamamlanamadı (çok fazla adım).')
}
