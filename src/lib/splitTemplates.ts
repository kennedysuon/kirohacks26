/**
 * Split templates define the session structure for each SplitType.
 * Each template specifies session names and the target muscle groups / movement
 * patterns for that day. The Program Generator uses these to select exercises.
 */

export interface SessionTemplate {
  sessionName: string
  dayOfWeek: number // 0 = Monday, 1 = Tuesday, etc.
  targetMuscles: string[]
  targetMovementPatterns: string[]
  isOptional?: boolean // true for accessory/active recovery days
}

export interface SplitTemplate {
  splitType: string
  sessionsPerWeek: number
  sessions: SessionTemplate[]
  minExperienceLevel?: string // INTERMEDIATE or ADVANCED for CUSTOM_HYBRID
}

export const SPLIT_TEMPLATES: Record<string, SplitTemplate> = {
  PPL: {
    splitType: 'PPL',
    sessionsPerWeek: 6,
    sessions: [
      {
        sessionName: 'Push A',
        dayOfWeek: 0,
        targetMuscles: ['chest', 'shoulders', 'triceps'],
        targetMovementPatterns: ['horizontal_push', 'vertical_push', 'isolation'],
      },
      {
        sessionName: 'Pull A',
        dayOfWeek: 1,
        targetMuscles: ['back', 'lats', 'biceps'],
        targetMovementPatterns: ['horizontal_pull', 'vertical_pull', 'isolation'],
      },
      {
        sessionName: 'Legs A',
        dayOfWeek: 2,
        targetMuscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
        targetMovementPatterns: ['squat', 'hip_hinge', 'lunge', 'isolation'],
      },
      {
        sessionName: 'Push B',
        dayOfWeek: 3,
        targetMuscles: ['chest', 'shoulders', 'triceps'],
        targetMovementPatterns: ['horizontal_push', 'vertical_push', 'isolation'],
      },
      {
        sessionName: 'Pull B',
        dayOfWeek: 4,
        targetMuscles: ['back', 'lats', 'biceps'],
        targetMovementPatterns: ['horizontal_pull', 'vertical_pull', 'isolation'],
      },
      {
        sessionName: 'Legs B',
        dayOfWeek: 5,
        targetMuscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
        targetMovementPatterns: ['squat', 'hip_hinge', 'lunge', 'isolation'],
      },
    ],
  },

  ARNOLD_SPLIT: {
    splitType: 'ARNOLD_SPLIT',
    sessionsPerWeek: 6,
    sessions: [
      {
        sessionName: 'Chest & Back A',
        dayOfWeek: 0,
        targetMuscles: ['chest', 'back', 'lats'],
        targetMovementPatterns: ['horizontal_push', 'horizontal_pull', 'vertical_pull'],
      },
      {
        sessionName: 'Shoulders & Arms A',
        dayOfWeek: 1,
        targetMuscles: ['shoulders', 'biceps', 'triceps'],
        targetMovementPatterns: ['vertical_push', 'isolation'],
      },
      {
        sessionName: 'Legs A',
        dayOfWeek: 2,
        targetMuscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
        targetMovementPatterns: ['squat', 'hip_hinge', 'lunge', 'isolation'],
      },
      {
        sessionName: 'Chest & Back B',
        dayOfWeek: 3,
        targetMuscles: ['chest', 'back', 'lats'],
        targetMovementPatterns: ['horizontal_push', 'horizontal_pull', 'vertical_pull'],
      },
      {
        sessionName: 'Shoulders & Arms B',
        dayOfWeek: 4,
        targetMuscles: ['shoulders', 'biceps', 'triceps'],
        targetMovementPatterns: ['vertical_push', 'isolation'],
      },
      {
        sessionName: 'Legs B',
        dayOfWeek: 5,
        targetMuscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
        targetMovementPatterns: ['squat', 'hip_hinge', 'lunge', 'isolation'],
      },
    ],
  },

  GLUTE_PROGRAM: {
    splitType: 'GLUTE_PROGRAM',
    sessionsPerWeek: 4,
    sessions: [
      {
        sessionName: 'Glutes & Hamstrings',
        dayOfWeek: 0,
        targetMuscles: ['glutes', 'hamstrings'],
        targetMovementPatterns: ['hip_hinge', 'isolation'],
      },
      {
        sessionName: 'Quads & Glutes',
        dayOfWeek: 1,
        targetMuscles: ['quadriceps', 'glutes'],
        targetMovementPatterns: ['squat', 'lunge', 'isolation'],
      },
      {
        sessionName: 'Upper Body',
        dayOfWeek: 3,
        targetMuscles: ['chest', 'back', 'shoulders'],
        targetMovementPatterns: ['horizontal_push', 'horizontal_pull', 'vertical_push'],
      },
      {
        sessionName: 'Full Body & Glutes',
        dayOfWeek: 4,
        targetMuscles: ['glutes', 'hamstrings', 'quadriceps', 'core'],
        targetMovementPatterns: ['hip_hinge', 'squat', 'lunge', 'isolation'],
      },
    ],
  },

  FULL_BODY: {
    splitType: 'FULL_BODY',
    sessionsPerWeek: 3,
    sessions: [
      {
        sessionName: 'Full Body A',
        dayOfWeek: 0,
        targetMuscles: ['chest', 'back', 'quadriceps', 'hamstrings', 'shoulders'],
        targetMovementPatterns: ['horizontal_push', 'horizontal_pull', 'squat', 'hip_hinge'],
      },
      {
        sessionName: 'Full Body B',
        dayOfWeek: 2,
        targetMuscles: ['chest', 'back', 'quadriceps', 'hamstrings', 'shoulders'],
        targetMovementPatterns: ['vertical_push', 'vertical_pull', 'lunge', 'hip_hinge'],
      },
      {
        sessionName: 'Full Body C',
        dayOfWeek: 4,
        targetMuscles: ['chest', 'back', 'glutes', 'hamstrings', 'biceps', 'triceps'],
        targetMovementPatterns: ['horizontal_push', 'horizontal_pull', 'squat', 'isolation'],
      },
    ],
  },

  UPPER_LOWER: {
    splitType: 'UPPER_LOWER',
    sessionsPerWeek: 4,
    sessions: [
      {
        sessionName: 'Upper A',
        dayOfWeek: 0,
        targetMuscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
        targetMovementPatterns: ['horizontal_push', 'horizontal_pull', 'vertical_push', 'isolation'],
      },
      {
        sessionName: 'Lower A',
        dayOfWeek: 1,
        targetMuscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
        targetMovementPatterns: ['squat', 'hip_hinge', 'lunge', 'isolation'],
      },
      {
        sessionName: 'Upper B',
        dayOfWeek: 3,
        targetMuscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
        targetMovementPatterns: ['vertical_push', 'vertical_pull', 'horizontal_push', 'isolation'],
      },
      {
        sessionName: 'Lower B',
        dayOfWeek: 4,
        targetMuscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
        targetMovementPatterns: ['hip_hinge', 'squat', 'lunge', 'isolation'],
      },
    ],
  },

  CUSTOM_HYBRID: {
    splitType: 'CUSTOM_HYBRID',
    sessionsPerWeek: 6,
    minExperienceLevel: 'INTERMEDIATE',
    // PPL x Arnold hybrid: chest+back on day 1, push on day 2, pull on day 3,
    // shoulders+arms on day 4, legs on day 5, full body accessory on day 6
    sessions: [
      {
        sessionName: 'Chest & Back',
        dayOfWeek: 0,
        targetMuscles: ['chest', 'back', 'lats'],
        targetMovementPatterns: ['horizontal_push', 'horizontal_pull', 'vertical_pull'],
      },
      {
        sessionName: 'Push',
        dayOfWeek: 1,
        targetMuscles: ['chest', 'shoulders', 'triceps'],
        targetMovementPatterns: ['horizontal_push', 'vertical_push', 'isolation'],
      },
      {
        sessionName: 'Pull',
        dayOfWeek: 2,
        targetMuscles: ['back', 'lats', 'biceps'],
        targetMovementPatterns: ['horizontal_pull', 'vertical_pull', 'isolation'],
      },
      {
        sessionName: 'Shoulders & Arms',
        dayOfWeek: 3,
        targetMuscles: ['shoulders', 'biceps', 'triceps'],
        targetMovementPatterns: ['vertical_push', 'isolation'],
      },
      {
        sessionName: 'Legs',
        dayOfWeek: 4,
        targetMuscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
        targetMovementPatterns: ['squat', 'hip_hinge', 'lunge', 'isolation'],
      },
      {
        sessionName: 'Full Body Accessory',
        dayOfWeek: 5,
        targetMuscles: ['glutes', 'core', 'shoulders', 'back'],
        targetMovementPatterns: ['hip_hinge', 'rotation', 'isolation', 'carry'],
        isOptional: true,
      },
    ],
  },
}

/**
 * Get a split template by SplitType string.
 * Falls back to FULL_BODY if the split type is not found.
 */
export function getSplitTemplate(splitType: string): SplitTemplate {
  return SPLIT_TEMPLATES[splitType] ?? SPLIT_TEMPLATES.FULL_BODY
}

/**
 * Get a compressed version of a split template for fewer available days.
 * Prioritizes sessions with compound movements and primary muscle groups.
 */
export function getCompressedSplit(splitType: string, availableDays: number): SplitTemplate {
  const template = getSplitTemplate(splitType)
  if (availableDays >= template.sessionsPerWeek) return template

  // Filter out optional sessions first, then take the first N required sessions
  const required = template.sessions.filter((s) => !s.isOptional)
  const compressed = required.slice(0, availableDays).map((s, i) => ({
    ...s,
    dayOfWeek: i,
  }))

  return {
    ...template,
    sessionsPerWeek: availableDays,
    sessions: compressed,
  }
}
