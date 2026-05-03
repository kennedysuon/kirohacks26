/**
 * Time Under Tension (TUT) calculator.
 *
 * TUT is the total duration in seconds a muscle is under load during a set.
 * Formula: (eccentric + pause1 + concentric + pause2) × reps
 */

/**
 * Calculate TUT per set from a tempo prescription and rep count.
 *
 * @param eccentric  - Duration of the lowering phase in seconds
 * @param pause1     - Pause at the bottom of the movement in seconds
 * @param concentric - Duration of the lifting phase in seconds
 * @param pause2     - Pause at the top of the movement in seconds
 * @param reps       - Number of repetitions
 * @returns Total time under tension in seconds
 */
export function calculateTUT(
  eccentric: number,
  pause1: number,
  concentric: number,
  pause2: number,
  reps: number
): number {
  return (eccentric + pause1 + concentric + pause2) * reps
}

/**
 * Validate whether a TUT value falls within the hypertrophy target range.
 * The optimal hypertrophy TUT range per set is 40–70 seconds.
 *
 * @param tut - Time under tension in seconds
 * @returns true if TUT is within the 40–70 second hypertrophy range
 */
export function validateTUTRange(tut: number): boolean {
  return tut >= 40 && tut <= 70
}
