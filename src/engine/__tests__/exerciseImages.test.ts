import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { EXERCISE_GUIDES, type ExerciseSlot } from '../../content/exercises'
import { exerciseImages } from '../../content/exerciseImages'

describe('exercise photos', () => {
  it('every exercise has both photos, for gym and home', () => {
    for (const slot of Object.keys(EXERCISE_GUIDES) as ExerciseSlot[]) {
      for (const eq of ['gym', 'home'] as const) {
        for (const src of exerciseImages(slot, eq).src) expect(existsSync(`public${src.replace(/^\//, '/')}`), `${slot}-${eq} ${src}`).toBe(true)
      }
    }
  })
})
