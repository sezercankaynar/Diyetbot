import { computeEnergy, round5 } from './energy'
import { computeMacros } from './macros'
import { evaluateSafety } from './safety'
import { scoreDiets, scoreIntermittentFasting } from './diets'
import { mealGuide } from './meals'
import { generateTraining } from './training'
import type { Callout, DietId, Plan, Profile } from './types'

export interface PlanOptions {
  /** User-chosen diet; ignored if it is excluded for safety. */
  diet?: DietId
  /** Sum of accepted weekly adjustments (kcal). */
  kcalOffset?: number
}

export function buildPlan(p: Profile, opts: PlanOptions = {}): Plan {
  const safety = evaluateSafety(p)
  if (safety.stop) return { safety, notes: [] }

  const notes: Callout[] = []
  const energy = computeEnergy(p)

  const offset = opts.kcalOffset ?? 0
  if (offset !== 0) {
    const adjusted = round5(Math.max(energy.floor, energy.target + offset))
    notes.push({
      level: 'info',
      code: 'offset',
      title: 'Haftalık düzeltme uygulandı',
      text: `Hesaplanan hedef ${energy.target} kcal; kabul ettiğiniz düzeltmelerle ${adjusted} kcal.`,
    })
    energy.target = adjusted
  }

  if (energy.clamped) {
    notes.push({
      level: 'warn',
      code: 'floor',
      title: 'Alt sınır uygulandı',
      text: `Hesaplanan hedef (${energy.unclampedTarget} kcal) güvenli alt sınırın altında kaldığı için ${energy.floor} kcal'ye yükseltildi. İlerleme daha yavaş olacak.`,
    })
  }
  if (energy.deficitCapped) {
    notes.push({
      level: 'info',
      code: 'deficit-cap',
      title: 'Açık sınırlandı',
      text: 'İstenen hız, TDEE\'nin %25\'ini aşan bir açık gerektiriyordu; açık %25 ile sınırlandı.',
    })
  }
  if (energy.whtrFlag) {
    notes.push({
      level: 'warn',
      code: 'whtr',
      title: 'Bel/boy oranı yüksek',
      text: `Bel/boy oranı ${energy.whtr.toFixed(2)} (≥ 0,50). Karın bölgesi yağlanması kardiyometabolik riskle ilişkilidir.`,
    })
  }

  const diets = scoreDiets(p, safety.excludedDiets)
  const chosen =
    (opts.diet && diets.find((d) => d.id === opts.diet && !d.excluded)) || diets[0]
  const macros = computeMacros(p, energy.target, chosen.id)

  const ifScore = scoreIntermittentFasting(p)
  if (!safety.ifAllowed) {
    ifScore.disabled = true
    ifScore.recommended = false
  }

  return {
    safety,
    energy,
    macros,
    diets,
    recommendedDiet: chosen,
    intermittentFasting: ifScore,
    meals: mealGuide(p, chosen.id, macros.proteinG),
    training: generateTraining(p),
    notes,
  }
}
