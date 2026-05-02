-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "primaryGoal" TEXT NOT NULL,
    "trainingStyle" TEXT NOT NULL,
    "splitPreference" TEXT NOT NULL,
    "experienceLevel" TEXT NOT NULL,
    "impediments" TEXT NOT NULL,
    "sportActivity" TEXT,
    "sportHoursPerWeek" REAL,
    "age" INTEGER NOT NULL,
    "sex" TEXT NOT NULL,
    "heightCm" REAL NOT NULL,
    "weightKg" REAL NOT NULL,
    "activityLevel" TEXT NOT NULL,
    "cuisinePreference" TEXT,
    "budgetLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "cookingTimeMinutes" INTEGER,
    "ingredientFlexible" BOOLEAN NOT NULL DEFAULT true,
    "equipmentTier" TEXT NOT NULL DEFAULT 'BODYWEIGHT_ONLY',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkoutPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkoutPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workoutPlanId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "sessionName" TEXT NOT NULL,
    "warmupIncluded" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Session_workoutPlanId_fkey" FOREIGN KEY ("workoutPlanId") REFERENCES "WorkoutPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionExercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "repsMin" INTEGER NOT NULL,
    "repsMax" INTEGER NOT NULL,
    "rpe" REAL,
    "tempoEccentric" INTEGER,
    "tempoPause1" INTEGER,
    "tempoConcentric" INTEGER,
    "tempoPause2" INTEGER,
    "tutPerSet" INTEGER,
    "notes" TEXT,
    "orderIndex" INTEGER NOT NULL,
    CONSTRAINT "SessionExercise_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NutritionPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tdee" REAL NOT NULL,
    "calorieTarget" REAL NOT NULL,
    "proteinG" REAL NOT NULL,
    "carbsG" REAL NOT NULL,
    "fatG" REAL NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NutritionPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nutritionPlanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cuisine" TEXT,
    "prepTimeMinutes" INTEGER NOT NULL,
    "estimatedCostUsd" REAL NOT NULL,
    "proteinG" REAL NOT NULL,
    "carbsG" REAL NOT NULL,
    "fatG" REAL NOT NULL,
    "calories" REAL NOT NULL,
    "ingredients" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    CONSTRAINT "Meal_nutritionPlanId_fkey" FOREIGN KEY ("nutritionPlanId") REFERENCES "NutritionPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sessionDate" DATETIME NOT NULL,
    "sessionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" DATETIME,
    CONSTRAINT "SessionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SetLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionLogId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "repsPerformed" INTEGER NOT NULL,
    "loadKg" REAL NOT NULL,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "SetLog_sessionLogId_fkey" FOREIGN KEY ("sessionLogId") REFERENCES "SessionLog" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BodyMetricsLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weightKg" REAL,
    "waistCm" REAL,
    "hipsCm" REAL,
    "chestCm" REAL,
    "leftArmCm" REAL,
    "rightArmCm" REAL,
    "leftThighCm" REAL,
    "rightThighCm" REAL,
    "photoUrl" TEXT,
    CONSTRAINT "BodyMetricsLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InjuryLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "bodyArea" TEXT NOT NULL,
    "severity" INTEGER NOT NULL,
    "onsetDate" DATETIME NOT NULL,
    "resolvedDate" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "InjuryLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutPlan_userId_key" ON "WorkoutPlan"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionPlan_userId_key" ON "NutritionPlan"("userId");
