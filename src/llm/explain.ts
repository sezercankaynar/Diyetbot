import type { Plan } from '@/engine'
import { chatCompletion } from './client'
import type { ChatMessage, LlmConfig } from './types'

/**
 * The LLM layer may only explain / personalise wording.
 * It receives the engine's finished output as read-only facts and must not
 * compute or change calories, macros or safety decisions. The UI always shows
 * the engine numbers; LLM text is rendered only as an extra explanation.
 */
export const SYSTEM_PROMPT = [
  'Sen bir beslenme planını sade Türkçe ile açıklayan bir asistansın.',
  'Sana verilen sayıları ve güvenlik kararlarını OLDUĞU GİBİ kabul et.',
  'Kalori, makro, hedef veya güvenlik kararı hesaplama, değiştirme ya da yeni sayı önerme.',
  'Tıbbi teşhis koyma; ilaç veya hastalık konusunda doktora yönlendir.',
].join(' ')

/** Builds the messages without calling anything – unit-testable. */
export function buildExplainMessages(plan: Plan): ChatMessage[] | null {
  if (plan.safety.stop || !plan.energy || !plan.macros || !plan.recommendedDiet) return null
  const facts = {
    hedefKcal: plan.energy.target,
    proteinG: plan.macros.proteinG,
    yagG: plan.macros.fatG,
    karbonhidratG: plan.macros.carbG,
    diyet: plan.recommendedDiet.name,
    diyetGerekceleri: plan.recommendedDiet.reasons,
    uyarilar: plan.safety.warnings.map((w) => w.title),
    antrenman: plan.training?.split,
  }
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Bu planı 4-5 cümleyle, motive edici ama abartısız açıkla:\n${JSON.stringify(facts, null, 2)}`,
    },
  ]
}

export async function explainPlan(cfg: LlmConfig, plan: Plan, signal?: AbortSignal): Promise<string | null> {
  const messages = buildExplainMessages(plan)
  if (!messages) return null
  return chatCompletion(cfg, messages, signal)
}
