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
- **Equipment_Profile**: The set of equipment the User has declared as available for training (e.g., full gym, home gym with dumbbells, resistance bands, bodyweight only).
- **Equipment_Tier**: A predefined category of equipment availability used to filter eligible exercises (e.g., Full_Gym, Home_Gym, Dumbbells_Only, Resistance_Bands, Bodyweight_Only).
- **Tempo_Prescription**: A four-digit notation (eccentric–pause–concentric–pause) specifying the speed of each phase of an Exercise repetition (e.g., 3-1-2-0).
- **TUT**: Time Under Tension — the total duration in seconds a muscle is under load during a set, used as a training stimulus parameter for hypertrophy-focused programming.

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
10. THE Onboarding_Flow SHALL prompt the User to select their Equipment_Tier from the following options: Full_Gym, Home_Gym, Dumbbells_Only, Resistance_Bands, and Bodyweight_Only.
11. WHEN the User selects an Equipment_Tier, THE Onboarding_Flow SHALL pass the Equipment_Profile to the Program_Generator for use in exercise selection.

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
7. WHERE the User's primary fitness goal is muscle gain, THE Program_Generator SHALL assign a Tempo_Prescription to each Exercise in the Workout_Plan to emphasize time under tension.
8. WHERE the User's primary fitness goal is muscle gain, THE Program_Generator SHALL target a TUT of 40–70 seconds per set for primary compound and isolation Exercises.
9. WHERE the User's primary fitness goal is muscle gain, THE Program_Generator SHALL include at least one Exercise per session with an eccentric phase of 3 seconds or longer to maximize mechanical tension.

---

### Requirement 4: Physical Impediment Handling and Exercise Substitution

**User Story:** As a user with physical limitations, I want the app to substitute exercises I cannot safely perform, so that I can still follow a complete program without risking injury.

#### Acceptance Criteria

1. WHEN the User has declared a Physical_Impediment, THE Substitution_Engine SHALL replace any Exercise that is contraindicated by that impediment with a biomechanically equivalent alternative.
2. THE Substitution_Engine SHALL provide at least one alternative Exercise for every contraindicated movement in the Workout_Plan.
3. WHEN a Physical_Impediment affects lower-body mechanics (e.g., stiff ankles), THE Substitution_Engine SHALL apply positional or equipment modifications (e.g., heel-raised squats, box squats) before removing the movement category entirely.
4. THE Substitution_Engine SHALL display a brief explanation to the User for each substitution, stating the impediment addressed and the rationale for the alternative.
5. WHEN the User marks a Physical_Impediment as resolved, THE Substitution_Engine SHALL restore the original Exercise to the Workout_Plan on the next program refresh.
6. WHEN providing an alternative Exercise, THE Substitution_Engine SHALL only select alternatives that are performable within the User's Equipment_Profile.

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

---

### Requirement 9: Equipment Availability and Exercise Filtering

**User Story:** As a user who trains at home or in a gym with limited equipment, I want the app to know what equipment I have available, so that every exercise in my program is one I can actually perform.

#### Acceptance Criteria

1. WHEN the User's Equipment_Profile is provided, THE Program_Generator SHALL only include Exercises that are executable with the equipment in that Equipment_Profile.
2. THE Program_Generator SHALL maintain an exercise library in which each Exercise is tagged with one or more Equipment_Tiers required to perform it.
3. WHEN the User's Equipment_Tier is Bodyweight_Only, THE Program_Generator SHALL construct a complete Workout_Plan using only bodyweight Exercises and SHALL not reference any equipment-dependent movements.
4. WHEN the User's Equipment_Tier is Resistance_Bands, THE Program_Generator SHALL include Exercises compatible with resistance bands and bodyweight, and SHALL not include barbell, dumbbell, or machine-dependent movements.
5. WHEN the User's Equipment_Tier is Dumbbells_Only, THE Program_Generator SHALL include Exercises compatible with dumbbells, resistance bands, and bodyweight, and SHALL not include barbell or machine-dependent movements.
6. WHEN the User's Equipment_Tier is Home_Gym, THE Program_Generator SHALL include Exercises compatible with the equipment commonly found in a home gym (e.g., barbell, dumbbells, pull-up bar, bench) and SHALL not include cable machine or plate-loaded machine movements.
7. WHEN the User's Equipment_Tier is Full_Gym, THE Program_Generator SHALL have access to the full exercise library with no equipment-based restrictions.
8. WHEN the User updates their Equipment_Profile after program creation, THE Program_Generator SHALL regenerate the Workout_Plan to replace any Exercises that are no longer compatible with the updated Equipment_Profile.
9. IF no Equipment_Profile has been collected, THEN THE Program_Generator SHALL default to Bodyweight_Only and notify the User that equipment preferences have not been set.

---

### Requirement 10: Hypertrophy-Focused Training and Time Under Tension

**User Story:** As a user focused on muscle growth, I want my program to incorporate hypertrophy-specific techniques like tempo control and time under tension, so that my training is optimized for maximizing muscle development.

#### Acceptance Criteria

1. WHERE the User's primary fitness goal is muscle gain, THE Program_Generator SHALL assign a Tempo_Prescription in eccentric–pause–concentric–pause format to each Exercise in the Workout_Plan.
2. WHERE the User's primary fitness goal is muscle gain, THE Workout_Plan SHALL display the Tempo_Prescription alongside the sets and reps for each Exercise.
3. WHERE the User's primary fitness goal is muscle gain, THE Program_Generator SHALL select Exercises that permit controlled eccentric loading (e.g., Romanian deadlifts, incline curls, Nordic curls) as primary hypertrophy movements.
4. WHERE the User's primary fitness goal is muscle gain, THE Program_Generator SHALL include at least one Exercise per muscle group per week with an eccentric phase of 3 seconds or longer.
5. WHEN the User's primary fitness goal is muscle gain and the User's experience level is intermediate or advanced, THE Program_Generator SHALL include intensification techniques (e.g., drop sets, rest-pause sets, mechanical drop sets) in at least one Exercise per session.
6. THE Workout_Plan SHALL display the estimated TUT per set for each Exercise where a Tempo_Prescription is assigned, calculated as the sum of all four tempo phases multiplied by the prescribed rep count.
7. IF the User's Equipment_Profile does not support the prescribed Tempo_Prescription for a given Exercise, THEN THE Substitution_Engine SHALL select an equipment-compatible alternative that preserves the intended TUT range.
8. WHEN the User's primary fitness goal changes from muscle gain to another goal, THE Program_Generator SHALL remove Tempo_Prescriptions and TUT targets from the Workout_Plan on the next program refresh.
