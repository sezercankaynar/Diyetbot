import { describe, expect, it } from 'vitest'
import { buildPlan, defaultProfile } from '@/engine'
import { buildExplainMessages, SYSTEM_PROMPT } from './explain'

describe('LLM seam', () => {
  it('passes engine numbers as read-only facts', () => {
    const plan = buildPlan(defaultProfile())
    const msgs = buildExplainMessages(plan)!
    expect(msgs[0].content).toBe(SYSTEM_PROMPT)
    expect(msgs[1].content).toContain(String(plan.energy!.target))
  })
  it('returns nothing on a safety stop', () => {
    expect(buildExplainMessages(buildPlan({ ...defaultProfile(), age: 16 }))).toBeNull()
  })
})
