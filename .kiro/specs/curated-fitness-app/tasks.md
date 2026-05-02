# Implementation Plan: Curated Fitness App

## Overview

Hackathon-scoped implementation (~12 hours) of a Next.js full-stack fitness app. Tasks are ordered for maximum forward momentum: data foundation first, then core engines, then UI views, then wiring and polish. Each task builds directly on the previous ones so there is no orphaned code.

TypeScript throughout. Prisma + SQLite for dev. fast-check for property-based tests.

---

## Tasks

- [ ] 1. Project scaffold and data foundation
  - Initialise a Next.js 14 project with TypeScript (`npx create-next-app@latest --typescript`)
  - Install dependencies: `prisma`, `@prisma/client`, `recharts`, `fast-check`, `zod`, `@hookform/resolvers`, `react-hook-form`
  - Create `prisma/schema.prisma` with all models and enums from the design document: `User`, `UserProfile`, `WorkoutPlan`, `Session`, `SessionExercise`, `NutritionPlan`, `Meal`, `SessionLog`, `SetLog`, `BodyMetricsLog`, `InjuryLog`, and all enums (`FitnessGoal`, `TrainingStyle`, `SplitType`, `ExperienceLevel`, `Sex`, `ActivityLevel`, `BudgetLevel`, `EquipmentTier`)
  - Run `prisma migrate dev --name init` to create the SQLite dev database
  - Create `src/lib/prisma.ts` singleton client
  - Create `src/types/index.ts` exporting all shared TypeScript interfaces (`ExerciseDefinition`, `ProgramGeneratorInput`, `ProgramGeneratorOutput`, `SubstitutionRequest`, `SubstitutionResult`, `OverloadAnalysis`, `OverloadRecommendation`, `BiometricInput`, `MacroTargets`, `ProgressionData`)
  - _Requirements: 1.1–1.11, 2.1, 3.1, 9.1–9.9, 11.1–11.6, 12.1–12.6_

- [ ] 2. Exercise library JSON
  - [ ] 2.1 Create `src/data/exercises.json` with at least 60 exercise definitions covering all muscle groups
    - Each entry must include: `id`, `name`, `primaryMuscles`, `secondaryMuscles`, `movementPattern`, `equipmentTiers` (array of `EquipmentTier` values), `contraindications`, `substitutes` (ordered list of exercise IDs), `technicalComplexity`, `supportsEccentricControl`, `cues` (3–5 points), `description`, `stepByStep`
    - Cover all equipment tiers: at least 12 bodyweight-only, 10 resistance-bands, 12 dumbbells-only, 12 home-gym, 14 full-gym exercises
    - Cover all movement patterns: horizontal push/pull, vertical push/pull, hip hinge, squat, lunge, carry, rotation, isolation
    - Tag contraindications for common impediments: `stiff_ankles`, `shoulder_impingement`, `lower_back_pain`, `knee_pain`, `wrist_pain`
    - Populate `substitutes` chains so every exercise has at least one substitute at the same or lower equipment tier
    - _Requirements: 8.1, 8.2, 9.2, 4.1, 4.2_
  - [ ] 2.2 Create `src/lib/exerciseLibrary.ts` with typed loader and lookup helpers
    - `getExerciseById(id: string): ExerciseDefinition`
    - `filterByEquipmentTier(tier: EquipmentTier): ExerciseDefinition[]`
    - `filterByMuscleGroup(muscle: string): ExerciseDefinition[]`
    - _Requirements: 9.1, 9.2_

- [ ] 3. TDEE Calculator and Macro Derivation
  - [ ] 3.1 Implement `src/lib/tdee.ts`
    - `calculateTDEE(input: BiometricInput): number` using Mifflin-St Jeor equation with activity multipliers (sedentary 1.2, lightly active 1.375, moderately active 1.55, very active 1.725, extra active 1.9)
    - Clamp age to [15, 100] and emit a warning for out-of-range inputs
    - _Requirements: 2.1_
  - [ ]* 3.2 Write property test for TDEE determinism (Property 1)
    - **Property 1: TDEE Calculation Determinism**
    - **Validates: Requirements 2.1**
    - Use `fc.record` to generate valid `BiometricInput` values; assert `calculateTDEE(x) === calculateTDEE(x)` across 100 iterations
    - Tag: `// Feature: curated-fitness-app, Property 1: TDEE Calculation Determinism`
  - [ ] 3.3 Implement `src/lib/macros.ts`
    - `deriveMacroTargets(tdee: number, goal: FitnessGoal): MacroTargets` returning `{ proteinG, carbsG, fatG, calorieTarget }`
    - Goal-specific ratios: muscle gain (protein 2.2 g/kg bodyweight, fat 25%, remainder carbs), fat loss (protein 2.4 g/kg, fat 30%, remainder carbs), strength (protein 2.0 g/kg, fat 30%, remainder carbs), general fitness / sport performance (protein 1.8 g/kg, fat 30%, remainder carbs)
    - _Requirements: 2.2, 2.3_
  - [ ]* 3.4 Write property test for macro calorie sum (Property 2)
    - **Property 2: Macro Targets Sum to TDEE Calories**
    - **Validates: Requirements 2.2, 2.3**
    - Generate random TDEE values and goals; assert `protein*4 + carbs*4 + fat*9` is within ±5 kcal of `calorieTarget`
    - Tag: `// Feature: curated-fitness-app, Property 2: Macro Targets Sum to TDEE Calories`

- [ ] 4. Checkpoint — core math verified
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Substitution Engine
  - [ ] 5.1 Implement `src/lib/substitutionEngine.ts`
    - `findSubstitute(req: SubstitutionRequest): SubstitutionResult | null`
    - Walk the `substitutes` chain of the contraindicated exercise; filter candidates by `equipmentTiers` containment and absence of the active impediment/injury tags
    - Apply positional modifications (heel-raised, box variant) before removing a movement category entirely for lower-body impediments
    - Return `{ replacement, rationale }` where `rationale` names the impediment and explains the alternative
    - Return `null` and log a gap when no valid substitute exists within the equipment tier
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 5.1, 5.2_
  - [ ]* 5.2 Write property test for substitution equipment safety (Property 4)
    - **Property 4: Substitution Preserves Equipment Compatibility**
    - **Validates: Requirements 4.1, 4.6, 10.7**
    - Generate random `SubstitutionRequest` values; assert the returned replacement exercise's `equipmentTiers` is a subset of or equal to the user's tier
    - Tag: `// Feature: curated-fitness-app, Property 4: Substitution Preserves Equipment Compatibility`
  - [ ]* 5.3 Write property test for injury area avoidance (Property 5)
    - **Property 5: Injury Substitution Avoids Affected Area**
    - **Validates: Requirements 5.1, 5.2**
    - Generate random active injury logs and exercise lists; assert no exercise in the adjusted plan loads the injured body area
    - Tag: `// Feature: curated-fitness-app, Property 5: Injury Substitution Avoids Affected Area`

- [ ] 6. Program Generator — workout plan engine
  - [ ] 6.1 Implement `src/lib/splitTemplates.ts`
    - Define session templates for each `SplitType`: PPL (3 or 6 days), Arnold Split (6 days), Glute Program (3–4 days), Full Body (3 days), Upper/Lower (4 days), Custom_Hybrid (user-defined combination, intermediate/advanced only)
    - Each template specifies session names and target muscle groups per day
    - _Requirements: 1.3, 3.1, 3.2_
  - [ ] 6.2 Implement `src/lib/programGenerator.ts` — core workout plan generation
    - `generateWorkoutPlan(input: ProgramGeneratorInput): WorkoutPlan`
    - Steps: select split template → filter exercise library by `EquipmentTier` → assign exercises per session (respecting `technicalComplexity` for beginners) → apply `SubstitutionEngine` for impediments → apply tempo prescriptions when goal is `MUSCLE_GAIN` → reduce volume on sport-adjacent days → add warm-up for beginners
    - For `MUSCLE_GAIN`: assign `Tempo_Prescription` (e.g., 3-1-2-0) to each exercise; calculate `tutPerSet = (e+p1+c+p2) * repsMin`; ensure at least one exercise per session has eccentric ≥ 3 s; include at least one exercise per muscle group per week with eccentric ≥ 3 s
    - For intermediate/advanced `MUSCLE_GAIN`: include intensification techniques (drop sets, rest-pause) in at least one exercise per session
    - Include sport-specific accessory work when `sportActivity` is set
    - _Requirements: 3.1–3.9, 8.3, 8.4, 9.1–9.9, 10.1–10.5_
  - [ ]* 6.3 Write property test for equipment tier containment (Property 3)
    - **Property 3: Equipment Tier Containment**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7**
    - Generate random user profiles with varying equipment tiers; assert every exercise in the generated plan has an `equipmentTiers` value ≤ the user's declared tier
    - Tag: `// Feature: curated-fitness-app, Property 3: Equipment Tier Containment`

- [ ] 7. TUT Calculator and tempo helpers
  - [ ] 7.1 Implement `src/lib/tut.ts`
    - `calculateTUT(eccentric: number, pause1: number, concentric: number, pause2: number, reps: number): number` — returns `(e+p1+c+p2) * reps`
    - `validateTUTRange(tut: number): boolean` — returns true if 40 ≤ tut ≤ 70 (hypertrophy target range)
    - _Requirements: 3.7, 3.8, 10.6_
  - [ ]* 7.2 Write property test for TUT formula correctness (Property 7)
    - **Property 7: Tempo TUT Calculation Correctness**
    - **Validates: Requirements 10.6**
    - Generate random tempo values (e, p1, c, p2 each 0–5 s) and rep counts (1–20); assert `calculateTUT(e,p1,c,p2,r) === (e+p1+c+p2)*r`
    - Tag: `// Feature: curated-fitness-app, Property 7: Tempo TUT Calculation Correctness`

- [ ] 8. Nutrition Planner
  - [ ] 8.1 Implement `src/lib/nutritionPlanner.ts`
    - `generateNutritionPlan(macros: MacroTargets, preferences: NutritionPreferences): NutritionPlan`
    - Produce daily meal suggestions (breakfast, lunch, dinner, optional snack) that sum to the calorie and macro targets
    - Filter meals by `cuisinePreference`, `budgetLevel`, and `cookingTimeMinutes`
    - Each meal includes `proteinG`, `carbsG`, `fatG`, `calories`, `ingredients`, `instructions`, `prepTimeMinutes`, `estimatedCostUsd`
    - _Requirements: 6.1–6.7_
  - [ ] 8.2 Create `src/data/meals.json` with at least 30 meal templates covering low/medium/high budget and multiple cuisine types
    - Each entry must include all fields from the `Meal` model
    - _Requirements: 6.2, 6.3, 6.4_
  - [ ]* 8.3 Write property test for meal macro aggregation (Property 10)
    - **Property 10: Meal Macros Aggregate Correctly**
    - **Validates: Requirements 6.6, 6.7**
    - Generate random sets of meals with arbitrary macro values; assert daily totals match the sum of individual meals within ±1 g per macro and ±5 kcal
    - Tag: `// Feature: curated-fitness-app, Property 10: Meal Macros Aggregate Correctly`

- [ ] 9. Full Program Generator — wiring TDEE + workout + nutrition
  - [ ] 9.1 Implement `generateProgram(input: ProgramGeneratorInput): ProgramGeneratorOutput` in `src/lib/programGenerator.ts`
    - Orchestrate: `calculateTDEE` → `deriveMacroTargets` → `generateWorkoutPlan` → `generateNutritionPlan`
    - Return `{ workoutPlan, nutritionPlan, tdee, macroTargets }`
    - _Requirements: 1.8, 2.1, 2.2, 3.1, 6.1_
  - [ ] 9.2 Implement volume reduction for injury logs in `src/lib/injuryAdjustment.ts`
    - `applyInjuryAdjustments(plan: WorkoutPlan, injuries: InjuryLog[]): WorkoutPlan`
    - Identify all exercises loading the injured body area; replace via `SubstitutionEngine`; reduce total weekly sets proportionally, capped at 40% reduction
    - Mark each modified session with `injuryAdjustmentActive: true`
    - _Requirements: 5.1–5.6_
  - [ ]* 9.3 Write property test for volume reduction bound (Property 6)
    - **Property 6: Volume Reduction Bound**
    - **Validates: Requirements 5.3**
    - Generate random workout plans and injury logs; assert adjusted weekly set count ≥ 60% of original
    - Tag: `// Feature: curated-fitness-app, Property 6: Volume Reduction Bound`

- [ ] 10. Checkpoint — engines complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. API routes — onboarding and program
  - [ ] 11.1 Create `src/app/api/onboarding/route.ts`
    - `POST /api/onboarding`: validate body with Zod against `UserProfile` shape; upsert `User` + `UserProfile`; call `generateProgram`; persist `WorkoutPlan` + `NutritionPlan`; return `{ userId, workoutPlanId, nutritionPlanId }`
    - Apply defaults for skipped optional fields; include `appliedDefaults` array in response
    - _Requirements: 1.8, 1.9_
  - [ ] 11.2 Create `src/app/api/workout-plan/route.ts` and `src/app/api/workout-plan/session/[id]/route.ts`
    - `GET /api/workout-plan`: return full `WorkoutPlan` with sessions and exercises for the authenticated user
    - `GET /api/workout-plan/session/:id`: return single session with `OverloadRecommendation` for each exercise (from `Progressive_Overload_Engine`)
    - _Requirements: 3.1, 14.4_
  - [ ] 11.3 Create `src/app/api/nutrition-plan/route.ts`
    - `GET /api/nutrition-plan`: return stored `NutritionPlan` with meals and daily totals
    - _Requirements: 6.1–6.7_

- [ ] 12. Progressive Overload Engine
  - [ ] 12.1 Implement `src/lib/progressiveOverloadEngine.ts`
    - `analyseOverload(analysis: OverloadAnalysis): OverloadRecommendation`
    - Trigger `increase_load` when all prescribed sets and reps completed at current load in 2 consecutive sessions
    - Trigger `deload` when logged performance decreases across 2 consecutive sessions
    - Trigger `plateau_flag` when no load or volume increase across 3 or more consecutive sessions
    - Trigger `increase_reps` or `add_set` as alternatives to load increase based on rep range headroom
    - _Requirements: 14.1–14.7, 15.5_
  - [ ]* 12.2 Write property test for overload trigger consistency (Property 8)
    - **Property 8: Overload Recommendation Trigger Consistency**
    - **Validates: Requirements 14.1, 14.2**
    - Generate random session histories where the last 2 sessions show full completion at current load; assert `analyseOverload` returns a non-null recommendation
    - Tag: `// Feature: curated-fitness-app, Property 8: Overload Recommendation Trigger Consistency`
  - [ ]* 12.3 Write property test for overload round-trip (Property 9)
    - **Property 9: Overload Recommendation Round-Trip**
    - **Validates: Requirements 14.5**
    - Generate random `OverloadRecommendation` values; accept them via the acceptance handler; assert the stored prescription matches the recommendation
    - Tag: `// Feature: curated-fitness-app, Property 9: Overload Recommendation Round-Trip`

- [ ] 13. API routes — session logging and body metrics
  - [ ] 13.1 Create `src/app/api/session-log/route.ts`
    - `POST /api/session-log`: validate body; persist `SessionLog` + `SetLog` entries; set `lockedAt = createdAt + 24h`
    - `PATCH /api/session-log/:id/set/:setId`: accept edit only if `Date.now() < sessionLog.lockedAt`; return 403 with lock timestamp if window has closed
    - _Requirements: 11.1–11.6_
  - [ ]* 13.2 Write property test for session log edit window (Property 12)
    - **Property 12: Session Log Edit Window**
    - **Validates: Requirements 11.3**
    - Generate random `SessionLog` creation times and edit attempt times; assert edits within 24 h are accepted and edits after 24 h are rejected
    - Tag: `// Feature: curated-fitness-app, Property 12: Session Log Edit Window`
  - [ ] 13.3 Create `src/app/api/body-metrics/route.ts`
    - `POST /api/body-metrics`: validate and persist `BodyMetricsLog` entry; recalculate TDEE and `MacroTargets` using new weight; update `NutritionPlan` if calorie target changes by more than 50 kcal
    - _Requirements: 12.1–12.6, 2.4_
  - [ ] 13.4 Create `src/app/api/injury-log/route.ts`
    - `POST /api/injury-log`: persist `InjuryLog`; call `applyInjuryAdjustments`; persist updated `WorkoutPlan`
    - `PATCH /api/injury-log/:id/resolve`: set `resolvedDate` and `active = false`; trigger 1-week gradual return-to-training restoration of original exercises
    - _Requirements: 5.1–5.6_

- [ ] 14. API routes — progress data
  - Create `src/app/api/progress/route.ts`
  - `GET /api/progress?from=&to=&exerciseIds=`: return aggregated `ProgressionData` — max load per exercise per session date, bodyweight entries, measurement entries, all filtered to the requested date range
  - Calculate `Weight_Trend` (kg/week linear regression over the period) and include in response
  - Notify user when 2-week weight trend deviates from goal expectation (flag in response)
  - _Requirements: 13.1–13.8, 15.1–15.8_

- [ ] 15. Checkpoint — API layer complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Onboarding_Flow UI
  - [ ] 16.1 Create `src/components/onboarding/OnboardingWizard.tsx` — multi-step wizard shell
    - Manage step index state; render step components; show progress indicator (step N of 9)
    - Collect and accumulate form data across steps using `react-hook-form`
    - On final step, display defaults summary before submission
    - On submit, `POST /api/onboarding` and redirect to `/dashboard`
    - _Requirements: 1.1–1.11_
  - [ ] 16.2 Create individual step components in `src/components/onboarding/steps/`
    - `GoalStep.tsx` — goal selection (muscle gain, fat loss, strength, general fitness, sport performance)
    - `TrainingStyleStep.tsx` — bodybuilding, powerlifting, pilates/yoga
    - `SplitStep.tsx` — PPL, Arnold Split, Glute Program, Full Body, Upper/Lower; show Custom_Hybrid only for intermediate/advanced
    - `ExperienceStep.tsx` — beginner, intermediate, advanced
    - `ImpedimentsStep.tsx` — multi-select common list + free-text entry
    - `SportActivityStep.tsx` — sport type + weekly hours (optional)
    - `BiometricsStep.tsx` — age, sex, height, weight, activity level
    - `NutritionPrefsStep.tsx` — cuisine, budget, cooking time, ingredient flexibility
    - `EquipmentStep.tsx` — Full_Gym, Home_Gym, Dumbbells_Only, Resistance_Bands, Bodyweight_Only
    - _Requirements: 1.1–1.11_

- [ ] 17. Workout Plan and Session views
  - [ ] 17.1 Create `src/app/workout/page.tsx` — Workout_Plan overview
    - Fetch and display the weekly session schedule
    - Show injury adjustment indicator on modified sessions
    - _Requirements: 3.1, 3.2, 5.6_
  - [ ] 17.2 Create `src/app/workout/session/[id]/page.tsx` — active session view
    - Display session exercises with sets, reps, RPE, tempo prescription, and TUT per set
    - Show `OverloadRecommendation` banner per exercise when present
    - Include warm-up section for beginner profiles
    - Show exercise description, cues, and expandable step-by-step instructions
    - _Requirements: 3.3, 3.7, 8.1, 8.2, 8.4, 8.5, 10.2, 10.6, 14.4_
  - [ ] 17.3 Create `src/components/session/SessionLogger.tsx`
    - Inline set logging: exercise name, set number, reps performed, load (kg/lb toggle)
    - Prompt "completed or skipped?" when user navigates away without logging a set
    - Accept/decline overload recommendation buttons
    - _Requirements: 11.1, 11.4, 14.4, 14.5, 14.6_

- [ ] 18. Session_Log View
  - Create `src/app/logs/page.tsx` and `src/app/logs/[sessionLogId]/page.tsx`
  - List view: chronological list of past sessions with date and session name
  - Detail view: all recorded sets, reps, and loads alongside originally prescribed values; show edit button (disabled with lock message after 24 h)
  - _Requirements: 11.2, 11.3, 11.6_

- [ ] 19. Body_Metrics_Log View
  - Create `src/app/metrics/page.tsx`
  - Form to log bodyweight + optional measurements + optional photo upload
  - List of past entries with edit and delete controls
  - Show 7-day reminder prompt if last entry is ≥ 7 days ago
  - Handle photo upload with 3-attempt retry and graceful fallback
  - _Requirements: 12.1–12.6_

- [ ] 20. Nutrition_Plan View
  - Create `src/app/nutrition/page.tsx`
  - Display daily calorie target and macro targets (protein, carbs, fat in grams)
  - List meals with name, cuisine, prep time, cost, macro breakdown
  - Daily aggregate totals alongside targets
  - Ingredient substitution: mark ingredient as unavailable → suggest nutritionally equivalent substitute
  - _Requirements: 6.1–6.7, 2.3_

- [ ] 21. Progress_Dashboard
  - [ ] 21.1 Create `src/app/dashboard/page.tsx` with `SummaryCard`
    - Display Weight_Trend (kg/week), top 3 exercises by recent load increase, measurement deltas
    - _Requirements: 13.8, 15.8_
  - [ ] 21.2 Create `src/components/dashboard/StrengthChart.tsx`
    - Recharts `LineChart` of max load per session for a selected exercise
    - Exercise selector dropdown populated from `Performance_History`
    - Show "Log more data to see your trend" when fewer than 2 data points
    - _Requirements: 13.1, 13.5, 13.6_
  - [ ] 21.3 Create `src/components/dashboard/BodyweightChart.tsx`
    - Recharts `LineChart` of bodyweight over time with linear trend line overlay
    - Show "Log more data to see your trend" when fewer than 2 data points
    - _Requirements: 13.2, 13.6_
  - [ ] 21.4 Create `src/components/dashboard/MeasurementChart.tsx`
    - Recharts `LineChart` per measurement site; show rate of change annotation when ≥ 4 entries
    - _Requirements: 13.3, 15.4_
  - [ ] 21.5 Create `src/components/dashboard/PhotoGallery.tsx`
    - Chronological grid of progress photos; click any two to open side-by-side comparison modal
    - _Requirements: 13.7_
  - [ ] 21.6 Implement date range filter on `src/app/dashboard/page.tsx`
    - Date picker (from / to); on change, re-fetch `GET /api/progress?from=&to=` and update all charts
    - _Requirements: 13.4_
  - [ ]* 21.7 Write property test for progress chart data completeness (Property 11)
    - **Property 11: Progress Chart Data Completeness**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4**
    - Generate random session logs and date ranges; assert every data point returned by `GET /api/progress` falls within the requested date range
    - Tag: `// Feature: curated-fitness-app, Property 11: Progress Chart Data Completeness`

- [ ] 22. Checkpoint — UI complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 23. Program adjustment and recalculation wiring
  - [ ] 23.1 Wire TDEE recalculation on body metrics submission
    - In `POST /api/body-metrics` handler: after persisting entry, call `calculateTDEE` with new weight, call `deriveMacroTargets`, update `NutritionPlan` in DB
    - _Requirements: 2.4_
  - [ ] 23.2 Wire activity level update to TDEE recalculation
    - `PATCH /api/profile`: accept `activityLevel` update; recalculate TDEE and macros; update `NutritionPlan`
    - _Requirements: 2.5_
  - [ ] 23.3 Wire equipment profile update to workout plan regeneration
    - `PATCH /api/profile`: accept `equipmentTier` update; call `generateWorkoutPlan` with new tier; replace incompatible exercises; persist updated plan
    - _Requirements: 9.8_
  - [ ] 23.4 Wire injury resolution to gradual return-to-training
    - In `PATCH /api/injury-log/:id/resolve`: over 7 days, restore original exercises one session at a time; persist restoration schedule
    - _Requirements: 5.5, 5.6_
  - [ ] 23.5 Wire weight trend deviation notification
    - In `GET /api/progress`: compute 2-week weight trend; compare to goal expectation; include `{ trendAlert: string | null }` in response; surface alert in `SummaryCard`
    - _Requirements: 15.2, 15.3_
  - [ ] 23.6 Wire overload acceptance and declination
    - `POST /api/workout-plan/session/:id/overload`: accept `{ exerciseId, action: 'accept' | 'decline', recommendation }`; on accept, update `SessionExercise` prescription and record change in `SetLog`; on decline, retain current prescription
    - _Requirements: 14.5, 14.6_

- [ ] 24. Progression data deletion flow
  - Add "Delete my data" option in user settings page (`src/app/settings/page.tsx`)
  - Require user to type "DELETE" to confirm
  - `DELETE /api/user/progression-data`: permanently delete all `BodyMetricsLog` and `SessionLog` records for the user; notify user that program will revert to profile-only defaults
  - _Requirements: 15.6, 15.7_

- [ ] 25. Final checkpoint — full integration
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP build
- Each task references specific requirements for traceability
- Checkpoints at tasks 4, 10, 15, 22, and 25 ensure incremental validation
- Property tests (Properties 1–12) validate universal correctness guarantees using fast-check with ≥ 100 iterations each
- Unit tests and property tests are complementary — both should be present for core engine functions
- The exercise library JSON (task 2) is the single most important data asset; invest time in making it comprehensive
- For the hackathon, prioritise tasks 1–15 (foundation + engines + API) before UI tasks 16–21
