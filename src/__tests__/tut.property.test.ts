// Feature: curated-fitness-app, Property 7: Tempo TUT Calculation Correctness

import * as fc from 'fast-check'
import { calculateTUT, validateTUTRange } from '@/lib/tut'

/**
 * Property 7: Tempo TUT Calculation Correctness
 *
 * For any tempo prescription (e, p1, c, p2) and rep count r,
 * calculateTUT must equal (e + p1 + c + p2) * r exactly.
 */
describe('Property 7: Tempo TUT Calculation Correctness', () => {
  it('TUT equals (e+p1+c+p2)*reps for all valid inputs (100 iterations)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5 }), // eccentric
        fc.integer({ min: 0, max: 5 }), // pause1
        fc.integer({ min: 0, max: 5 }), // concentric
        fc.integer({ min: 0, max: 5 }), // pause2
        fc.integer({ min: 1, max: 20 }), // reps
        (eccentric, pause1, concentric, pause2, reps) => {
          const result = calculateTUT(eccentric, pause1, concentric, pause2, reps)
          const expected = (eccentric + pause1 + concentric + pause2) * reps
          expect(result).toBe(expected)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('TUT is always non-negative', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5 }),
        fc.integer({ min: 0, max: 5 }),
        fc.integer({ min: 0, max: 5 }),
        fc.integer({ min: 0, max: 5 }),
        fc.integer({ min: 1, max: 20 }),
        (e, p1, c, p2, reps) => {
          expect(calculateTUT(e, p1, c, p2, reps)).toBeGreaterThanOrEqual(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('validateTUTRange returns true for 40-70s range', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 40, max: 70 }),
        (tut) => {
          expect(validateTUTRange(tut)).toBe(true)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('validateTUTRange returns false outside 40-70s range', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ min: 0, max: 39 }),
          fc.integer({ min: 71, max: 200 })
        ),
        (tut) => {
          expect(validateTUTRange(tut)).toBe(false)
        }
      ),
      { numRuns: 50 }
    )
  })
})
