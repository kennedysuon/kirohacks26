/**
 * Transforms raw-exercises.json (free-exercise-db format) into our app's
 * ExerciseDefinition schema format.
 */

const fs = require('fs')
const path = require('path')

const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/raw-exercises.json'), 'utf-8'))

// Map free-exercise-db equipment strings to our EquipmentTier values
function mapEquipmentTier(equipment) {
  if (!equipment || equipment === 'body only' || equipment === 'none') return ['BODYWEIGHT_ONLY', 'RESISTANCE_BANDS', 'DUMBBELLS_ONLY', 'HOME_GYM', 'FULL_GYM']
  if (equipment === 'bands') return ['RESISTANCE_BANDS', 'DUMBBELLS_ONLY', 'HOME_GYM', 'FULL_GYM']
  if (equipment === 'dumbbell') return ['DUMBBELLS_ONLY', 'HOME_GYM', 'FULL_GYM']
  if (equipment === 'barbell' || equipment === 'e-z curl bar') return ['HOME_GYM', 'FULL_GYM']
  if (equipment === 'cable' || equipment === 'machine') return ['FULL_GYM']
  if (equipment === 'kettlebells') return ['DUMBBELLS_ONLY', 'HOME_GYM', 'FULL_GYM']
  if (equipment === 'medicine ball' || equipment === 'exercise ball') return ['HOME_GYM', 'FULL_GYM']
  if (equipment === 'foam roll') return ['HOME_GYM', 'FULL_GYM']
  if (equipment === 'other') return ['HOME_GYM', 'FULL_GYM']
  return ['FULL_GYM']
}

// Map muscle names to movement patterns
function mapMovementPattern(exercise) {
  const muscles = [...(exercise.primaryMuscles || []), ...(exercise.secondaryMuscles || [])].map(m => m.toLowerCase())
  const name = exercise.name.toLowerCase()
  const force = exercise.force || ''

  if (name.includes('squat') || name.includes('lunge') || name.includes('leg press')) return 'squat'
  if (name.includes('deadlift') || name.includes('hip thrust') || name.includes('romanian') || name.includes('rdl')) return 'hip_hinge'
  if (name.includes('bench press') || name.includes('push-up') || name.includes('pushup') || name.includes('chest press') || name.includes('fly')) return 'horizontal_push'
  if (name.includes('row') && !name.includes('cable row')) return 'horizontal_pull'
  if (name.includes('pull-up') || name.includes('pullup') || name.includes('chin-up') || name.includes('lat pulldown')) return 'vertical_pull'
  if (name.includes('overhead press') || name.includes('shoulder press') || name.includes('military press')) return 'vertical_push'
  if (name.includes('curl')) return 'isolation'
  if (name.includes('extension') || name.includes('tricep')) return 'isolation'
  if (name.includes('raise') || name.includes('lateral')) return 'isolation'
  if (name.includes('carry') || name.includes('farmer')) return 'carry'
  if (name.includes('twist') || name.includes('rotation') || name.includes('woodchop')) return 'rotation'
  if (name.includes('lunge') || name.includes('step-up') || name.includes('split squat')) return 'lunge'
  if (muscles.includes('chest') && force === 'push') return 'horizontal_push'
  if (muscles.includes('lats') && force === 'pull') return 'vertical_pull'
  if (muscles.includes('quadriceps')) return 'squat'
  if (muscles.includes('hamstrings') || muscles.includes('glutes')) return 'hip_hinge'
  if (muscles.includes('shoulders') && force === 'push') return 'vertical_push'
  return 'isolation'
}

// Determine if exercise supports eccentric control
function supportsEccentricControl(exercise) {
  const eq = exercise.equipment || ''
  const name = exercise.name.toLowerCase()
  // Machine-only exercises have less eccentric control
  if (eq === 'machine') return false
  // Stretching/cardio don't apply
  if (exercise.category === 'stretching' || exercise.category === 'cardio') return false
  // Most free weight and bodyweight exercises support eccentric control
  return true
}

// Map experience level to technical complexity
function mapComplexity(exercise) {
  if (exercise.level === 'beginner') return 'low'
  if (exercise.level === 'expert') return 'high'
  return 'medium'
}

// Generate basic contraindications based on muscle groups and movement
function mapContraindications(exercise) {
  const muscles = [...(exercise.primaryMuscles || [])].map(m => m.toLowerCase())
  const name = exercise.name.toLowerCase()
  const tags = []

  if (name.includes('squat') || name.includes('lunge') || muscles.includes('quadriceps')) {
    tags.push('knee_pain')
  }
  if (name.includes('squat') || name.includes('deadlift') || name.includes('rdl')) {
    tags.push('stiff_ankles')
    tags.push('lower_back_pain')
  }
  if (name.includes('overhead') || name.includes('shoulder press') || name.includes('upright row') || muscles.includes('shoulders')) {
    tags.push('shoulder_impingement')
  }
  if (name.includes('bench press') || name.includes('push-up') || name.includes('dip') || name.includes('curl')) {
    tags.push('wrist_pain')
  }
  if (name.includes('deadlift') || name.includes('row') || name.includes('good morning')) {
    tags.push('lower_back_pain')
  }

  return [...new Set(tags)]
}

// Generate cues from instructions (take first 3-5 as cues)
function generateCues(instructions) {
  if (!instructions || instructions.length === 0) return ['Maintain proper form throughout', 'Control the movement', 'Breathe steadily']
  // Take up to 5 instructions as cues, shortened
  return instructions.slice(0, Math.min(5, instructions.length)).map(i => {
    // Truncate long instructions to ~80 chars for cues
    return i.length > 80 ? i.substring(0, 77) + '...' : i
  })
}

// Filter to only strength/powerlifting/olympic_weightlifting/plyometrics categories
// Skip stretching, cardio as they don't fit our workout plan model well
const VALID_CATEGORIES = ['strength', 'powerlifting', 'olympic_weightlifting', 'plyometrics', 'strongman']

const transformed = raw
  .filter(ex => VALID_CATEGORIES.includes(ex.category))
  .map(ex => ({
    id: ex.id,
    name: ex.name,
    primaryMuscles: ex.primaryMuscles || [],
    secondaryMuscles: ex.secondaryMuscles || [],
    movementPattern: mapMovementPattern(ex),
    equipmentTiers: mapEquipmentTier(ex.equipment),
    contraindications: mapContraindications(ex),
    substitutes: [], // will be populated in a second pass
    technicalComplexity: mapComplexity(ex),
    supportsEccentricControl: supportsEccentricControl(ex),
    cues: generateCues(ex.instructions),
    description: ex.instructions && ex.instructions.length > 0
      ? ex.instructions[0]
      : `${ex.name} targeting ${(ex.primaryMuscles || []).join(', ')}.`,
    stepByStep: ex.instructions || []
  }))

// Second pass: populate substitutes based on same movement pattern + compatible equipment tier
const byPattern = {}
transformed.forEach(ex => {
  if (!byPattern[ex.movementPattern]) byPattern[ex.movementPattern] = []
  byPattern[ex.movementPattern].push(ex.id)
})

transformed.forEach(ex => {
  const samePattern = (byPattern[ex.movementPattern] || []).filter(id => id !== ex.id)
  // Pick up to 4 substitutes from same movement pattern
  ex.substitutes = samePattern.slice(0, 4)
})

console.log(`Transformed ${transformed.length} exercises`)

fs.writeFileSync(
  path.join(__dirname, '../src/data/exercises.json'),
  JSON.stringify(transformed, null, 2),
  'utf-8'
)

console.log('Written to src/data/exercises.json')
