// Feature: curated-fitness-app, Property 6: Volume Reduction Bound

import * as fc from 'fast-check'
import { generateWorkoutPlan } from '@/lib/programGenerator'
import { applyInjuryAdjustments, getTotalWeeklySets } from '@/lib/injuryAdjustment'

const EQUIPMENT_TIERS = ['BODYWEIGHT_ONLY', 'DUMBBELLS_ONLY', 'HOME_GYM', 'FULL_GYM'] as const
const BODY_AREAS = ['lower_back', 'knee', 'shoulder', 'wrist', 'ankle'] as const

/**
 * Property 6: Volume Reduction Bound
 *
 * For any injury log, the adjusted weekly set count must be no less than
 * 60% of the pre-injury weekly set count (max 40% reduction).
 */
describe('Property 6: Volume Reduction Bound', () => {
  it('adjusted set count is always >= 60% of original (100 iterations)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EQUIPMENT_TIERS),
        fc.constantFrom(...BODY_AREAS),
        fc.integer({ min: 1, max: 10 }),
        (equipmentTier, bodyArea, severity) => {
          const plan = generateWorkoutPlan({
            primaryGoal: 'GENERAL_FITNESS',
            trainingStyle: 'BODYBUILDING',
            splitPreference: 'FULL_BODY',
            experienceLevel: 'INTERMEDIATE',
            impediments: [],
            equipmentTier,
          })

          const setsBefore = getTotalWeeklySets(plan)
          if (setsBefore === 0) return true

          const adjustedPlan = applyInjuryAdjustments(
            plan,
            [{ bodyArea, severity, onsetDate: new Date() }],
            equipmentTier
          )

          const setsAfter = getTotalWeeklySets(adjustedPlan)
          const minAllowed = Math.ceil(setsBefore * 0.6)

          expect(setsAfter).toBeGreaterThanOrEqual(minAllowed)
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('injury adjustment never increases total set count', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EQUIPMENT_TIERS),
        fc.constantFrom(...BODY_AREAS),
        (equipmentTier, bodyArea) => {
          const plan = generateWorkoutPlan({
            primaryGoal: 'STRENGTH',
            trainingStyle: 'POWERLIFTING',
            splitPreference: 'UPPER_LOWER',
            experienceLevel: 'ADVANCED',
            impediments: [],
            equipmentTier,
          })

          const setsBefore = getTotalWeeklySets(plan)

          const adjustedPlan = applyInjuryAdjustments(
            plan,
            [{ bodyArea, severity: 7, onsetDate: new Date() }],
            equipmentTier
          )

          const setsAfter = getTotalWeeklySets(adjustedPlan)
          expect(setsAfter).toBeLessThanOrEqual(setsBefore)
          return true
        }
      ),
      { numRuns: 50 }
    )
  })

  it('unaffected plan (no matching injuries) has same set count', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EQUIPMENT_TIERS),
        (equipmentTier) => {
          const plan = generateWorkoutPlan({
            primaryGoal: 'GENERAL_FITNESS',
            trainingStyle: 'BODYBUILDING',
            splitPreference: 'FULL_BODY',
            experienceLevel: 'BEGINNER',
            impediments: [],
            equipmentTier,
          })

          const setsBefore = getTotalWeeklySets(plan)

          // Use a body area that won't match any exercise contraindications
          const adjustedPlan = applyInjuryAdjustments(
            plan,
            [{ bodyArea: 'pinky_toe', severity: 1, onsetDate: new Date() }],
            equipmentTier
          )

          const setsAfter = getTotalWeeklySets(adjustedPlan)
          expect(setsAfter).toBe(setsBefore)
          return true
        }
      ),
      { numRuns: 50 }
    )
  })
})
