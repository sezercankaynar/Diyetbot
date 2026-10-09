/** Configuration for an OpenAI-compatible endpoint (e.g. a LiteLLM proxy). */
export interface LlmConfig {
  /** e.g. https://litellm.example.com/v1 */
  baseUrl: string
  apiKey: string
  model: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}
