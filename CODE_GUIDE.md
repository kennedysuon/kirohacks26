# Code Guide — Curated Fitness App

This document explains what each task builds, what files it creates, and how the code works.
Update the status of each task as it is completed: change `[ ]` to `[x]`.

---

## Task 1 — Project Scaffold and Data Foundation `[x]`

**Files created:**
- `prisma/schema.prisma` — database schema
- `src/lib/prisma.ts` — Prisma client singleton
- `src/types/index.ts` — shared TypeScript types

**How it works:**

The project runs on **Next.js 14** with TypeScript. Data is stored in a local **SQLite** file (`prisma/dev.db`) managed by **Prisma ORM**.

`prisma/schema.prisma` defines every table (called a *model* in Prisma). Because SQLite does not support native enums, all enum-like fields (e.g. `primaryGoal`, `equipmentTier`) are stored as plain `String` columns. The valid string values are documented in comments directly above each field.

`src/lib/prisma.ts` exports a single shared `PrismaClient` instance. In Next.js development mode the server hot-reloads frequently, which would create many redundant database connections. The singleton pattern stores the client on the Node.js `global` object so it is reused across reloads.

`src/types/index.ts` defines TypeScript types for the whole app. Because Prisma no longer generates enum types (they were removed from the schema), this file manually declares equivalent string-literal union types (`FitnessGoal`, `EquipmentTier`, etc.). It also re-exports Prisma's auto-generated model types (`UserProfile`, `WorkoutPlan`, etc.) so the rest of the codebase imports everything from one place.

---

## Task 2 — Exercise Library `[ ]`

**Files created:**
- `src/data/exercises.json` — raw exercise data (≥ 60 entries)
- `src/lib/exerciseLibrary.ts` — typed loader and lookup helpers

**How it works:**

`exercises.json` is a static JSON array. Each object matches the `ExerciseDefinition` interface from `src/types/index.ts`. Key fields:

| Field | Purpose |
|---|---|
| `equipmentTiers` | Which equipment levels can perform this exercise |
| `contraindications` | Injury/impediment tags that rule this exercise out |
| `substitutes` | Ordered list of exercise IDs to try when this one is ruled out |
| `cues` | 3–5 coaching points shown to the user during a session |

`exerciseLibrary.ts` loads the JSON once and exposes three helper functions:
- `getExerciseById` — direct lookup by ID, throws if not found
- `filterByEquipmentTier` — returns all exercises the user's equipment can support
- `filterByMuscleGroup` — returns exercises that train a given muscle (checks both primary and secondary)

---

## Task 3 — TDEE Calculator and Macro Derivation `[ ]`

**Files created:**
- `src/lib/tdee.ts` — TDEE calculation
- `src/lib/macros.ts` — macro target derivation
- (optional) property tests for both

**How it works:**

`tdee.ts` implements the **Mifflin-St Jeor equation**:
- Men: `(10 × weight) + (6.25 × height) − (5 × age) + 5`
- Women: `(10 × weight) + (6.25 × height) − (5 × age) − 161`

The result (BMR) is multiplied by an activity factor to get TDEE (Total Daily Energy Expenditure). Age is clamped to [15, 100] and a console warning is emitted for out-of-range values.

`macros.ts` takes the TDEE and the user's goal and returns gram targets for protein, carbs, and fat. Each goal has a different protein-per-kg-bodyweight target and fat percentage; carbs fill the remaining calories. The math ensures `protein×4 + carbs×4 + fat×9 ≈ calorieTarget`.

The optional property tests use **fast-check** to generate hundreds of random inputs and assert mathematical invariants (e.g. TDEE is always the same for the same input; macros always sum to the calorie target within ±5 kcal).

---

## Task 4 — Checkpoint A `[ ]`

Run all Person A tests and confirm they pass before continuing. No new files.

---

## Task 5 — Substitution Engine `[ ]`

**Files created:**
- `src/lib/substitutionEngine.ts`
- (optional) property tests

**How it works:**

`findSubstitute` receives a `SubstitutionRequest` containing the exercise to replace, the user's active impediments, their injuries, and their equipment tier.

The algorithm walks the `substitutes` chain of the original exercise (an ordered list of fallback IDs). For each candidate it checks two conditions:
1. The candidate's `equipmentTiers` includes the user's tier (equipment compatibility).
2. The candidate's `contraindications` do not overlap with the user's impediments or injured body areas.

For lower-body impediments it first tries positional modifications (heel-raised squat, box squat) before removing the movement category entirely.

The function returns `{ replacement, rationale }` where `rationale` is a human-readable string explaining why the swap was made. It returns `null` and logs a gap if no valid substitute exists.

---

## Task 6 — Program Generator — Workout Plan Engine `[ ]`

**Files created:**
- `src/lib/splitTemplates.ts` — session templates per split type
- `src/lib/programGenerator.ts` — core workout plan generation
- (optional) property test for equipment tier containment

**How it works:**

`splitTemplates.ts` defines the weekly structure for each split (PPL, Arnold Split, Glute Program, Full Body, Upper/Lower, Custom Hybrid). Each template is an array of session objects with a name and target muscle groups. Custom Hybrid is only available to intermediate and advanced users.

`programGenerator.ts` builds a `WorkoutPlan` in several steps:
1. Select the split template matching the user's `splitPreference`.
2. Filter the exercise library to exercises the user's equipment supports.
3. Assign exercises to each session, respecting `technicalComplexity` (beginners get low/medium complexity only).
4. Run the Substitution Engine for any exercise that conflicts with the user's impediments.
5. For `MUSCLE_GAIN` goals: attach a tempo prescription (e.g. 3-1-2-0) to each exercise and calculate `tutPerSet`.
6. Reduce volume on days adjacent to the user's sport activity.
7. Add a warm-up block for beginner profiles.

---

## Task 7 — TUT Calculator and Tempo Helpers `[ ]`

**Files created:**
- `src/lib/tut.ts`
- (optional) property test

**How it works:**

TUT = Time Under Tension. For hypertrophy, the target range is 40–70 seconds per set.

`calculateTUT(eccentric, pause1, concentric, pause2, reps)` computes `(e + p1 + c + p2) × reps`. For example, a 3-1-2-0 tempo for 10 reps = `(3+1+2+0) × 10 = 60 s`.

`validateTUTRange(tut)` returns `true` if the value falls in the 40–70 s hypertrophy window.

These helpers are called by the program generator when assigning tempo prescriptions and displayed in the session view so the user knows how long each set should take.

---

## Task 8 — Full Program Generator Wiring + Injury Adjustment `[ ]`

**Files created:**
- `src/lib/programGenerator.ts` (extended with `generateProgram`)
- `src/lib/injuryAdjustment.ts`
- (optional) property test for volume reduction bound

**How it works:**

`generateProgram` is the top-level orchestrator. It calls:
1. `calculateTDEE` → gets the user's daily energy expenditure
2. `deriveMacroTargets` → gets protein/carb/fat gram targets
3. `generateWorkoutPlan` → builds the full workout plan

It returns a `ProgramGeneratorOutput` object. The `nutritionPlan` field is wired in Task 18 once Person B's nutrition planner is ready.

`injuryAdjustment.ts` modifies an existing plan when the user logs an injury:
- Identifies every exercise that loads the injured body area.
- Replaces each via the Substitution Engine.
- Reduces total weekly sets proportionally, capped at a 40% reduction (so the user always keeps at least 60% of their original volume).
- Marks each modified session with `injuryAdjustmentActive: true` so the UI can show an indicator.

---

## Task 9 — Progressive Overload Engine `[ ]`

**Files created:**
- `src/lib/progressiveOverloadEngine.ts`
- (optional) property tests

**How it works:**

`analyseOverload` looks at a user's recent session logs for a specific exercise and returns a recommendation:

| Condition | Recommendation |
|---|---|
| All sets/reps completed at current load in last 2 sessions | `increase_load` |
| Performance decreased across last 2 sessions | `deload` |
| No load or volume increase across last 3+ sessions | `plateau_flag` |
| Rep range has headroom before load increase | `increase_reps` or `add_set` |
| Not enough data | `null` |

The recommendation is surfaced in the session view as a banner. The user can accept or decline it. Accepting updates the `SessionExercise` prescription in the database.

---

## Task 10 — API Routes (Training Vertical) `[ ]`

**Files created:**
- `src/app/api/onboarding/route.ts`
- `src/app/api/workout-plan/route.ts`
- `src/app/api/workout-plan/session/[id]/route.ts`
- `src/app/api/session-log/route.ts`
- `src/app/api/injury-log/route.ts`
- `src/app/api/workout-plan/session/[id]/overload/route.ts`
- (optional) property test for session log edit window

**How it works:**

All routes are Next.js **Route Handlers** (the `app/` directory convention). Each file exports named functions (`GET`, `POST`, `PATCH`, `DELETE`) that Next.js maps to HTTP methods.

Input validation uses **Zod** schemas. If the request body fails validation, the route returns a `400` with the Zod error details.

Key behaviours:
- **`POST /api/onboarding`**: validates the full user profile, upserts the user and profile in the database, calls `generateProgram`, and persists both the workout and nutrition plans. Returns IDs for the client to navigate to.
- **`POST /api/session-log`**: persists the log and sets `lockedAt = createdAt + 24 hours`. After 24 hours, `PATCH` requests to edit sets return `403`.
- **`POST /api/injury-log`**: persists the injury and immediately calls `applyInjuryAdjustments` to update the workout plan.
- **`PATCH /api/injury-log/:id/resolve`**: marks the injury resolved and triggers a 7-day gradual restoration of original exercises.
- **`POST /api/workout-plan/session/:id/overload`**: accepts or declines an overload recommendation, updating the exercise prescription accordingly.

---

## Task 11 — Onboarding UI, Workout UI, Session Log UI `[ ]`

**Files created:**
- `src/components/onboarding/OnboardingWizard.tsx`
- `src/components/onboarding/steps/` (9 step components)
- `src/app/workout/page.tsx`
- `src/app/workout/session/[id]/page.tsx`
- `src/components/session/SessionLogger.tsx`
- `src/app/logs/page.tsx`
- `src/app/logs/[sessionLogId]/page.tsx`

**How it works:**

`OnboardingWizard.tsx` manages a step index in local state and renders one step component at a time. It uses **react-hook-form** to accumulate form data across steps without losing values when navigating back. A progress indicator shows "Step N of 9". On the final step it shows a summary of any defaults that were applied. On submit it `POST`s to `/api/onboarding` and redirects to `/dashboard`.

Each step component in `steps/` is a self-contained form section. They receive `register`, `errors`, and `watch` from the parent wizard via props.

`workout/page.tsx` fetches the weekly plan and renders a card per session. Sessions with `injuryAdjustmentActive` show a warning badge.

`workout/session/[id]/page.tsx` shows the full exercise list for a session. Each exercise card displays sets, reps, RPE, tempo (e.g. "3-1-2-0"), and TUT per set. If an overload recommendation exists for an exercise, a banner appears with accept/decline buttons.

`SessionLogger.tsx` is an inline logging widget embedded in the session view. It tracks which sets have been logged and prompts the user if they try to navigate away with unlogged sets.

`logs/page.tsx` lists past sessions chronologically. `logs/[sessionLogId]/page.tsx` shows the detail view with prescribed vs. actual values side by side. The edit button is disabled with a lock message once the 24-hour window has passed.

---

## Task 12 — Wiring (Training Vertical) `[ ]`

**Files modified:**
- `src/app/api/profile/route.ts` (new `PATCH` handler)
- `src/app/api/injury-log/route.ts` (extended resolve handler)

**How it works:**

`PATCH /api/profile` accepts an `equipmentTier` update. It calls `generateWorkoutPlan` with the new tier, identifies exercises that are no longer compatible, replaces them via the Substitution Engine, and persists the updated plan.

The injury resolution handler (`PATCH /api/injury-log/:id/resolve`) schedules a 7-day return-to-training restoration. Rather than swapping all exercises back at once, it restores one session at a time over the week to avoid re-injury from sudden load increases.

---

## Task 13 — Nutrition Planner `[x]`

**Files created:**
- `src/lib/nutritionPlanner.ts`
- `src/data/meals.json` (≥ 30 meal templates)
- (optional) property test for meal macro aggregation

**How it works:**

`meals.json` is a static array of meal templates. Each entry includes all fields from the `Meal` model: macros, calories, prep time, estimated cost, ingredients (as a JSON string array), and instructions.

`generateNutritionPlan` takes the user's `MacroTargets` and `NutritionPreferences` and builds a daily meal plan:
1. Filter `meals.json` by `cuisinePreference`, `budgetLevel`, and `cookingTimeMinutes`.
2. Select meals for breakfast, lunch, dinner, and an optional snack.
3. Verify the daily totals hit the calorie and macro targets (within tolerance).
4. Persist and return the `NutritionPlan`.

---

## Task 14 — Checkpoint B `[x]`

Run all Person B tests and confirm they pass before continuing. No new files.

---

## Task 15 — API Routes (Nutrition & Progress Vertical) `[x]`

**Files created:**
- `src/app/api/nutrition-plan/route.ts`
- `src/app/api/body-metrics/route.ts`
- `src/app/api/progress/route.ts`
- (optional) property test for progress chart data completeness

**How it works:**

- **`GET /api/nutrition-plan`**: returns the stored plan with meals and pre-computed daily totals.
- **`POST /api/body-metrics`**: persists a new `BodyMetricsLog` entry. If the new weight causes the TDEE to shift enough that the calorie target changes by more than 50 kcal, it recalculates macros and updates the `NutritionPlan` automatically.
- **`GET /api/progress`**: accepts `from`, `to`, and `exerciseIds` query params. Returns max load per exercise per session date, bodyweight entries, and measurement entries — all filtered to the date range. Also computes a linear regression over bodyweight to produce a `WeightTrend` (kg/week). If the 2-week trend deviates from the goal expectation, a `trendAlert` string is included.
- **`PATCH /api/profile`** (activity level): recalculates TDEE and macros and updates the nutrition plan.

---

## Task 16 — Nutrition UI, Body Metrics UI, Progress Dashboard `[x]`

**Files created:**
- `src/app/nutrition/page.tsx`
- `src/app/metrics/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/components/dashboard/StrengthChart.tsx`
- `src/components/dashboard/BodyweightChart.tsx`
- `src/components/dashboard/MeasurementChart.tsx`
- `src/components/dashboard/PhotoGallery.tsx`

**How it works:**

`nutrition/page.tsx` shows the daily calorie and macro targets at the top, then lists each meal with its macro breakdown. Daily aggregate totals are shown alongside targets so the user can see how close they are. Ingredients can be marked unavailable to trigger a nutritionally equivalent substitute suggestion.

`metrics/page.tsx` has a form for logging bodyweight and optional measurements (waist, hips, arms, thighs). It also supports photo upload with a 3-attempt retry and graceful fallback if the upload fails. A reminder prompt appears if the last entry is 7 or more days ago.

`dashboard/page.tsx` is the main progress hub. It shows a `SummaryCard` with weight trend, top 3 exercises by recent load increase, and measurement deltas. A date range picker re-fetches `GET /api/progress` on change and updates all charts. Any `trendAlert` from the API is surfaced in the summary card.

The four chart components all use **Recharts**:
- `StrengthChart` — line chart of max load per session for a selected exercise. Shows a placeholder message with fewer than 2 data points.
- `BodyweightChart` — line chart of bodyweight over time with a linear trend line overlay.
- `MeasurementChart` — one line per measurement site; shows rate-of-change annotation when ≥ 4 entries exist.
- `PhotoGallery` — chronological grid of progress photos; clicking any two opens a side-by-side comparison modal.

---

## Task 17 — Wiring (Nutrition & Progress Vertical) `[x]`

**Files modified/created:**
- `src/app/api/body-metrics/route.ts` (extended)
- `src/app/api/progress/route.ts` (extended)
- `src/app/settings/page.tsx` (new)
- `src/app/api/user/progression-data/route.ts` (new)

**How it works:**

### 17.1 — TDEE Recalculation on Body Metrics Submission

TDEE recalculation is triggered inside the `POST /api/body-metrics` handler after the entry is saved. The handler:
1. Persists the new `BodyMetricsLog` entry with the updated weight and optional measurements
2. Calls `calculateTDEE` with the new weight using the Mifflin-St Jeor equation
3. Calls `deriveMacroTargets` to compute new protein/carb/fat targets based on the user's fitness goal
4. Compares the new calorie target to the existing one
5. Updates the `NutritionPlan` in the database **only if** the calorie target shifts by more than 50 kcal (prevents unnecessary updates for minor fluctuations)
6. Returns the updated macros in the response so the UI can show immediate feedback

This ensures the nutrition plan stays aligned with the user's current bodyweight without requiring manual recalculation.

### 17.2 — Weight Trend Deviation Notification

Weight trend deviation is computed in `GET /api/progress`. The algorithm:
1. Filters bodyweight entries to the last 14 days (2-week window)
2. Computes a linear regression slope (kg/week) over the recent weight data
3. Compares the slope against goal-specific expected ranges:
   - `MUSCLE_GAIN`: +0.1 to +0.5 kg/week
   - `FAT_LOSS`: -1.0 to -0.2 kg/week
   - `STRENGTH`: 0.0 to +0.5 kg/week
   - `GENERAL_FITNESS` / `SPORT_PERFORMANCE`: -0.3 to +0.3 kg/week
4. Generates a plain-English `trendAlert` string when the trend is outside the expected range
5. Includes actionable recommendations (e.g., "Consider increasing your calorie intake by 100–200 kcal/day")

The `trendAlert` is surfaced prominently in the dashboard's `SummaryCard` component as a yellow warning banner, ensuring users see it immediately when their weight trend deviates from their goal.

### 17.3 — Progression Data Deletion Flow

The data deletion flow provides users with full control over their historical data:

**Settings Page** (`src/app/settings/page.tsx`):
- New dedicated settings page with account management options
- "Delete My Data" section with clear warnings about permanence
- Requires user to type "DELETE" in a confirmation input to prevent accidental deletion
- Shows success/error feedback after deletion attempt
- Disables the delete button until confirmation text matches exactly

**API Endpoint** (`DELETE /api/user/progression-data`):
- Accepts `userId` as a query parameter
- Uses a Prisma transaction to ensure atomic deletion:
  1. Finds all `SessionLog` IDs for the user
  2. Deletes all `SetLog` entries associated with those sessions
  3. Deletes all `SessionLog` entries for the user
  4. Deletes all `BodyMetricsLog` entries for the user
- Returns a confirmation message explaining that the program will revert to profile-only defaults
- Handles errors gracefully with detailed error messages

This satisfies the requirement that users can permanently delete their progression data while maintaining their profile and program structure. After deletion, the program generator will work from profile data only, without historical performance or body metrics to inform adjustments.

---

## Task 18 — Wire Nutrition Plan into Program Generator `[ ]`

**Files modified:**
- `src/lib/programGenerator.ts`
- `src/app/api/onboarding/route.ts`

**How it works:**

`generateProgram` is updated to call `generateNutritionPlan` (Person B's module) and include the result in the returned `ProgramGeneratorOutput`. The `POST /api/onboarding` handler is updated to persist both the `WorkoutPlan` and the `NutritionPlan` in the same database transaction so they are always created together.

---

## Task 19 — Final Integration Checkpoint `[ ]`

Run all tests end-to-end. Verify the full flow:

1. Onboarding form → `POST /api/onboarding` → program generated and persisted
2. Workout plan view → session view → session logging
3. Body metrics logging → TDEE recalculation → nutrition plan update
4. Progress dashboard → charts populated from session and metrics logs

Fix any integration issues at the seams between the two verticals. No new files expected.
