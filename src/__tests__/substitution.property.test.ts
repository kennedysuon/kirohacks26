// Feature: curated-fitness-app, Property 4: Substitution Preserves Equipment Compatibility
// Feature: curated-fitness-app, Property 5: Injury Substitution Avoids Affected Area

import * as fc from 'fast-check'
import { findSubstitute } from '@/lib/substitutionEngine'
import { getAllExercises } from '@/lib/exerciseLibrary'
import type { ExerciseDefinition } from '@/types'

const EQUIPMENT_TIERS = [
  'BODYWEIGHT_ONLY',
  'RESISTANCE_BANDS',
  'DUMBBELLS_ONLY',
  'HOME_GYM',
  'FULL_GYM',
] as const

const TIER_RANK: Record<string, number> = {
  BODYWEIGHT_ONLY: 0,
  RESISTANCE_BANDS: 1,
  DUMBBELLS_ONLY: 2,
  HOME_GYM: 3,
  FULL_GYM: 4,
}

const COMMON_IMPEDIMENTS = [
  'stiff_ankles',
  'knee_pain',
  'lower_back_pain',
  'shoulder_impingement',
  'wrist_pain',
]

const BODY_AREAS = [
  'lower_back',
  'knee',
  'shoulder',
  'wrist',
  'ankle',
  'hip',
  'elbow',
]

// Load exercises once
let exercises: ExerciseDefinition[] = []
beforeAll(() => {
  exercises = getAllExercises()
})

/**
 * Property 4: Substitution Preserves Equipment Compatibility
 *
 * For any substitution result, the replacement exercise must be executable
 * within the user's declared equipment tier.
 */
describe('Property 4: Substitution Preserves Equipment Compatibility', () => {
  it('replacement exercise is always within the user equipment tier (100 iterations)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EQUIPMENT_TIERS),
        fc.constantFrom(...COMMON_IMPEDIMENTS),
        fc.integer({ min: 0, max: 99 }),
        (equipmentTier, impediment, exerciseIndex) => {
          if (exercises.length === 0) return true

          const exercise = exercises[exerciseIndex % exercises.length]

          // Only test exercises that are actually contraindicated
          if (!exercise.contraindications.includes(impediment)) return true

          const result = findSubstitute({
            exercise,
            impediments: [impediment],
            injuries: [],
            equipmentTier,
          })

          // If a substitute was found, it must be within the equipment tier
          if (result) {
            const userRank = TIER_RANK[equipmentTier] ?? 0
            const replacementCompatible = result.replacement.equipmentTiers.some(
              (t) => (TIER_RANK[t] ?? 0) <= userRank
            )
            expect(replacementCompatible).toBe(true)
          }

          // null result is acceptable (no substitute available)
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('replacement exercise is never the same as the original', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EQUIPMENT_TIERS),
        fc.constantFrom(...COMMON_IMPEDIMENTS),
        fc.integer({ min: 0, max: 99 }),
        (equipmentTier, impediment, exerciseIndex) => {
          if (exercises.length === 0) return true

          const exercise = exercises[exerciseIndex % exercises.length]
          if (!exercise.contraindications.includes(impediment)) return true

          const result = findSubstitute({
            exercise,
            impediments: [impediment],
            injuries: [],
            equipmentTier,
          })

          if (result) {
            expect(result.replacement.id).not.toBe(exercise.id)
          }

          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * Property 5: Injury Substitution Avoids Affected Area
 *
 * For any active injury, the replacement exercise must not have the injured
 * body area in its contraindications.
 */
describe('Property 5: Injury Substitution Avoids Affected Area', () => {
  it('replacement exercise does not load the injured body area (100 iterations)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EQUIPMENT_TIERS),
        fc.constantFrom(...BODY_AREAS),
        fc.integer({ min: 0, max: 99 }),
        (equipmentTier, bodyArea, exerciseIndex) => {
          if (exercises.length === 0) return true

          const exercise = exercises[exerciseIndex % exercises.length]
          const injuryTag = bodyArea.replace(/\s+/g, '_')

          // Only test if the exercise is contraindicated for this area
          if (!exercise.contraindications.includes(injuryTag)) return true

          const result = findSubstitute({
            exercise,
            impediments: [],
            injuries: [{ bodyArea, severity: 5, onsetDate: new Date() }],
            equipmentTier,
          })

          if (result) {
            // The replacement must not be contraindicated for the same area
            expect(result.replacement.contraindications).not.toContain(injuryTag)
          }

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('substitution result always includes a rationale string', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EQUIPMENT_TIERS),
        fc.constantFrom(...COMMON_IMPEDIMENTS),
        fc.integer({ min: 0, max: 99 }),
        (equipmentTier, impediment, exerciseIndex) => {
          if (exercises.length === 0) return true

          const exercise = exercises[exerciseIndex % exercises.length]
          if (!exercise.contraindications.includes(impediment)) return true

          const result = findSubstitute({
            exercise,
            impediments: [impediment],
            injuries: [],
            equipmentTier,
          })

          if (result) {
            expect(typeof result.rationale).toBe('string')
            expect(result.rationale.length).toBeGreaterThan(0)
          }

          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})
