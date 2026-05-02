# Requirements Document

## Introduction

A curated fitness app that generates personalized workout programs and nutrition plans tailored to each user's lifestyle, goals, physical limitations, and other physical activities. The app lowers the barrier to entry for fitness by providing a guided, beginner-friendly experience while remaining useful to more advanced users with specific constraints or goals. Programs adapt dynamically to injuries, schedule changes, and user feedback.

## Glossary

- **User**: A person using the app to receive a personalized fitness program.
- **Onboarding_Flow**: The initial setup sequence that collects user profile data to generate a program.
- **Program_Generator**: The system component that creates personalized workout and nutrition plans from user profile data.
- **Workout_Plan**: A structured weekly schedule of exercise sessions assigned to the User.
- **Nutrition_Plan**: A structured meal plan with recipes and macronutrient targets assigned to the User.
- **TDEE**: Total Daily Energy Expenditure — the estimated number of calories a User burns per day.
- **Split**: A workout structure that divides training across days by muscle group or movement pattern (e.g., PPL, Arnold Split, Glute Program).
- **Sport_Activity**: A recreational or competitive sport the User participates in that affects programming (e.g., pickleball, basketball, volleyball).
- **Physical_Impediment**: A chronic or structural limitation (e.g., stiff ankles, limited shoulder mobility) that requires exercise substitutions.
- **Injury_Log**: A record of acute pain or injury reported by the User that triggers dynamic program adjustments.
- **Substitution_Engine**: The system component that replaces exercises incompatible with a User's impediments or injuries.
- **Exercise**: A single movement or drill within a workout session, including sets, reps, and load guidance.
- **Macro_Target**: The daily protein, carbohydrate, and fat targets derived from the User's TDEE and goals.

---

## Requirements

### Requirement 1: User Onboarding and Profile Creation

**User Story:** As a new user, I want to complete a guided onboarding flow, so that the app can generate a program tailored to my specific goals and lifestyle.

#### Acceptance Criteria

1. THE Onboarding_Flow SHALL collect the User's primary fitness goal (e.g., muscle gain, fat loss, strength, general fitness, sport performance).
2. THE Onboarding_Flow SHALL collect the User's training style preference from the following options: bodybuilding, powerlifting, pilates/yoga, and body-goal programs for women.
3. THE Onboarding_Flow SHALL collect the User's preferred workout split (e.g., PPL, Arnold Split, Glute Program, full-body, upper/lower).
4. THE Onboarding_Flow SHALL collect the User's current physical impediments, if any, via a structured selection or free-text entry.
5. THE Onboarding_Flow SHALL collect the User's Sport_Activity participation, including sport type and approximate weekly hours.
6. THE Onboarding_Flow SHALL collect the User's biometric data: age, sex, height, weight, and activity level, for TDEE calculation.
7. THE Onboarding_Flow SHALL collect the User's nutrition preferences: preferred cuisine, budget level, available cooking time per meal, and ingredient flexibility.
8. WHEN the User completes all required onboarding steps, THE Onboarding_Flow SHALL pass the collected profile to the Program_Generator.
9. IF the User skips an optional onboarding field, THEN THE Onboarding_Flow SHALL apply a sensible default value for that field and notify the User of the default applied.

---

### Requirement 2: TDEE Calculation and Macro Targeting

**User Story:** As a user, I want the app to calculate my daily calorie and macronutrient targets, so that my nutrition plan supports my fitness goals.

#### Acceptance Criteria

1. WHEN the User's biometric data and activity level are provided, THE Program_Generator SHALL calculate the User's TDEE using the Mifflin-St Jeor equation.
2. WHEN the User's TDEE and primary fitness goal are known, THE Program_Generator SHALL derive daily Macro_Targets (protein, carbohydrates, fat) aligned with that goal.
3. THE Nutrition_Plan SHALL display the User's daily calorie target and Macro_Targets in grams.
4. WHEN the User updates their weight or activity level, THE Program_Generator SHALL recalculate the TDEE and Macro_Targets and update the Nutrition_Plan accordingly.

---

### Requirement 3: Personalized Workout Program Generation

**User Story:** As a user, I want a workout program generated from my profile, so that I receive a structured plan that matches my goals, training style, and schedule.

#### Acceptance Criteria

1. WHEN the User's profile is complete, THE Program_Generator SHALL produce a Workout_Plan that matches the User's selected training style and Split.
2. THE Workout_Plan SHALL specify the number of training days per week consistent with the User's selected Split and available schedule.
3. THE Workout_Plan SHALL include, for each session, a list of Exercises with prescribed sets, reps or duration, and relative intensity guidance (e.g., RPE or % of 1RM).
4. WHERE the User has selected a Sport_Activity, THE Program_Generator SHALL reduce or redistribute training volume on days adjacent to sport sessions to manage fatigue.
5. WHERE the User has selected a Sport_Activity, THE Program_Generator SHALL include sport-specific accessory work (e.g., lateral agility drills for basketball, rotational stability for pickleball) within the Workout_Plan.
6. THE Program_Generator SHALL generate a Workout_Plan that is distinct from a generic template — each plan SHALL reflect at least the User's training style, Split, and Physical_Impediments.

---

### Requirement 4: Physical Impediment Handling and Exercise Substitution

**User Story:** As a user with physical limitations, I want the app to substitute exercises I cannot safely perform, so that I can still follow a complete program without risking injury.

#### Acceptance Criteria

1. WHEN the User has declared a Physical_Impediment, THE Substitution_Engine SHALL replace any Exercise that is contraindicated by that impediment with a biomechanically equivalent alternative.
2. THE Substitution_Engine SHALL provide at least one alternative Exercise for every contraindicated movement in the Workout_Plan.
3. WHEN a Physical_Impediment affects lower-body mechanics (e.g., stiff ankles), THE Substitution_Engine SHALL apply positional or equipment modifications (e.g., heel-raised squats, box squats) before removing the movement category entirely.
4. THE Substitution_Engine SHALL display a brief explanation to the User for each substitution, stating the impediment addressed and the rationale for the alternative.
5. WHEN the User marks a Physical_Impediment as resolved, THE Substitution_Engine SHALL restore the original Exercise to the Workout_Plan on the next program refresh.

---

### Requirement 5: Dynamic Injury Logging and Program Adjustment

**User Story:** As a user who experiences unexpected pain or injury, I want to log it and have my program adjust automatically, so that I can continue training safely without manually redesigning my plan.

#### Acceptance Criteria

1. WHEN the User logs an injury or pain area via the Injury_Log, THE Substitution_Engine SHALL identify all Exercises in the current Workout_Plan that load the affected area.
2. WHEN affected Exercises are identified, THE Substitution_Engine SHALL replace them with alternatives that avoid the injured area for the duration of the logged injury.
3. WHEN the User logs an injury, THE Program_Generator SHALL reduce the total weekly training volume by a percentage proportional to the number of affected muscle groups, not to exceed a 40% reduction in total weekly sets.
4. WHEN the User marks an injury as recovered in the Injury_Log, THE Program_Generator SHALL restore the original Exercises and volume over a 1-week gradual return-to-training period.
5. THE Injury_Log SHALL allow the User to specify the affected body area, pain severity on a 1–10 scale, and the date of onset.
6. WHILE an injury is active in the Injury_Log, THE Workout_Plan SHALL display a visible indicator on each modified session noting that adjustments are in effect.

---

### Requirement 6: Personalized Nutrition Plan Generation

**User Story:** As a user, I want a meal plan that fits my food preferences, budget, and schedule, so that I can meet my nutrition targets without spending excessive time or money.

#### Acceptance Criteria

1. WHEN the User's Macro_Targets and nutrition preferences are known, THE Program_Generator SHALL produce a Nutrition_Plan containing daily meal suggestions.
2. THE Nutrition_Plan SHALL include recipes or meal options that align with the User's preferred cuisine type.
3. THE Nutrition_Plan SHALL include estimated cost per meal consistent with the User's selected budget level (low, medium, high).
4. THE Nutrition_Plan SHALL include estimated preparation time per meal consistent with the User's available cooking time preference.
5. THE Nutrition_Plan SHALL allow flexible ingredient substitution — WHEN the User marks an ingredient as unavailable, THE Nutrition_Plan SHALL suggest a nutritionally equivalent substitute.
6. THE Nutrition_Plan SHALL display the macronutrient breakdown (protein, carbohydrates, fat, calories) for each meal.
7. THE Nutrition_Plan SHALL aggregate daily totals for calories and each macronutrient and display them alongside the User's Macro_Targets.

---

### Requirement 7: Program Flexibility and Weekly Adjustment

**User Story:** As a user with a variable schedule, I want my program to adapt to how many days I can train each week, so that I make consistent progress even when life gets in the way.

#### Acceptance Criteria

1. WHEN the User indicates they can train fewer days than the standard Split requires in a given week, THE Program_Generator SHALL compress the Workout_Plan into the available days by prioritizing compound movements and primary muscle groups.
2. WHEN the User indicates they have more available training days than the standard Split requires, THE Program_Generator SHALL suggest optional accessory or active recovery sessions to fill the additional days.
3. THE Workout_Plan SHALL allow the User to mark individual sessions as skipped, and THE Program_Generator SHALL not penalize the overall program progression for a single skipped session.
4. WHEN the User skips two or more consecutive sessions, THE Program_Generator SHALL notify the User and offer to adjust the program's weekly structure.

---

### Requirement 8: Beginner Guidance and Exercise Education

**User Story:** As a beginner, I want clear instructions and context for each exercise, so that I can perform movements safely and understand why they are in my program.

#### Acceptance Criteria

1. THE Workout_Plan SHALL include, for each Exercise, a brief description of the movement pattern and the primary muscles targeted.
2. THE Workout_Plan SHALL include, for each Exercise, a cue list of 3–5 form coaching points.
3. WHERE the User's profile indicates beginner experience level, THE Program_Generator SHALL select Exercises with lower technical complexity and include additional safety notes.
4. WHERE the User's profile indicates beginner experience level, THE Workout_Plan SHALL include a warm-up routine at the start of each session.
5. WHEN the User requests more detail on an Exercise, THE Workout_Plan SHALL display an expanded view with step-by-step instructions.
