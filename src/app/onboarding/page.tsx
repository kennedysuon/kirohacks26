'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ─── Step Data ────────────────────────────────────────────────────────────────

const GOALS = [
  { value: 'MUSCLE_GAIN', label: 'Build Muscle', icon: '💪' },
  { value: 'FAT_LOSS', label: 'Lose Fat', icon: '🔥' },
  { value: 'STRENGTH', label: 'Get Stronger', icon: '🏋️' },
  { value: 'GENERAL_FITNESS', label: 'General Fitness', icon: '⚡' },
  { value: 'SPORT_PERFORMANCE', label: 'Sport Performance', icon: '🏃' },
]

const TRAINING_STYLES = [
  { value: 'BODYBUILDING', label: 'Bodybuilding', icon: '🏆' },
  { value: 'POWERLIFTING', label: 'Powerlifting', icon: '🔩' },
  { value: 'PILATES_YOGA', label: 'Pilates / Yoga', icon: '🧘' },
]

const SPLITS = [
  { value: 'PPL', label: 'Push / Pull / Legs', desc: '6 days/week' },
  { value: 'ARNOLD_SPLIT', label: 'Arnold Split', desc: '6 days/week' },
  { value: 'UPPER_LOWER', label: 'Upper / Lower', desc: '4 days/week' },
  { value: 'FULL_BODY', label: 'Full Body', desc: '3 days/week' },
  { value: 'GLUTE_PROGRAM', label: 'Glute Program', desc: '4 days/week' },
]

const EXPERIENCE_LEVELS = [
  { value: 'BEGINNER', label: 'Beginner', desc: '< 1 year training' },
  { value: 'INTERMEDIATE', label: 'Intermediate', desc: '1–3 years training' },
  { value: 'ADVANCED', label: 'Advanced', desc: '3+ years training' },
]

const EQUIPMENT_TIERS = [
  { value: 'FULL_GYM', label: 'Full Gym', icon: '🏢' },
  { value: 'HOME_GYM', label: 'Home Gym', icon: '🏠' },
  { value: 'DUMBBELLS_ONLY', label: 'Dumbbells Only', icon: '🏋️' },
  { value: 'RESISTANCE_BANDS', label: 'Resistance Bands', icon: '🔗' },
  { value: 'BODYWEIGHT_ONLY', label: 'Bodyweight Only', icon: '🤸' },
]

const ACTIVITY_LEVELS = [
  { value: 'SEDENTARY', label: 'Sedentary', desc: 'Little to no exercise' },
  { value: 'LIGHTLY_ACTIVE', label: 'Lightly Active', desc: '1–3 days/week' },
  { value: 'MODERATELY_ACTIVE', label: 'Moderately Active', desc: '3–5 days/week' },
  { value: 'VERY_ACTIVE', label: 'Very Active', desc: '6–7 days/week' },
  { value: 'EXTRA_ACTIVE', label: 'Extra Active', desc: 'Physical job + training' },
]

const CUISINES = ['American', 'Mediterranean', 'Asian', 'Mexican', 'Italian', 'Indian', 'Any']
const BUDGET_LEVELS = [
  { value: 'LOW', label: 'Budget', desc: '< $50/week' },
  { value: 'MEDIUM', label: 'Moderate', desc: '$50–100/week' },
  { value: 'HIGH', label: 'Premium', desc: '$100+/week' },
]

// ─── Component ────────────────────────────────────────────────────────────────

interface FormData {
  primaryGoal: string
  trainingStyle: string
  splitPreference: string
  experienceLevel: string
  equipmentTier: string
  age: string
  sex: string
  heightCm: string
  weightKg: string
  activityLevel: string
  cuisinePreference: string
  budgetLevel: string
  cookingTimeMinutes: string
  ingredientFlexible: boolean
  sportActivity: string
  impediments: string[]
}

const INITIAL_FORM: FormData = {
  primaryGoal: '',
  trainingStyle: '',
  splitPreference: '',
  experienceLevel: '',
  equipmentTier: '',
  age: '',
  sex: '',
  heightCm: '',
  weightKg: '',
  activityLevel: '',
  cuisinePreference: 'Any',
  budgetLevel: 'MEDIUM',
  cookingTimeMinutes: '30',
  ingredientFlexible: true,
  sportActivity: '',
  impediments: [],
}

const STEPS = [
  'Goal',
  'Style',
  'Split',
  'Experience',
  'Equipment',
  'Biometrics',
  'Activity',
  'Nutrition',
  'Review',
]

function SelectCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        selected
          ? 'border-[#a3e635] bg-[#a3e635]/10 text-[#f5f5f5]'
          : 'border-[#2a2a2a] bg-[#1a1a1a] text-[#a3a3a3] hover:border-[#3a3a3a] hover:text-[#f5f5f5]'
      }`}
    >
      {children}
    </button>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (key: keyof FormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))
  const back = () => setStep((s) => Math.max(s - 1, 0))

  const canProceed = () => {
    switch (step) {
      case 0: return !!form.primaryGoal
      case 1: return !!form.trainingStyle
      case 2: return !!form.splitPreference
      case 3: return !!form.experienceLevel
      case 4: return !!form.equipmentTier
      case 5: return !!form.age && !!form.sex && !!form.heightCm && !!form.weightKg
      case 6: return !!form.activityLevel
      case 7: return true
      default: return true
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          age: parseInt(form.age),
          heightCm: parseFloat(form.heightCm),
          weightKg: parseFloat(form.weightKg),
          cookingTimeMinutes: parseInt(form.cookingTimeMinutes) || 30,
          impediments: form.impediments,
          sportActivity: form.sportActivity || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create program')
      localStorage.setItem('userId', data.userId)
      router.push('/workout')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-[#a3a3a3]">
            Step {step + 1} of {STEPS.length}
          </span>
          <span className="text-sm font-medium text-[#a3e635]">{STEPS[step]}</span>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-[#1a1a1a] rounded-full">
          <div
            className="h-1 bg-[#a3e635] rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-4 overflow-y-auto">
        {/* Step 0: Goal */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">What's your main goal?</h2>
            <p className="text-[#a3a3a3]">This shapes your entire program.</p>
            <div className="space-y-3 mt-6">
              {GOALS.map((g) => (
                <SelectCard
                  key={g.value}
                  selected={form.primaryGoal === g.value}
                  onClick={() => set('primaryGoal', g.value)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{g.icon}</span>
                    <span className="font-medium">{g.label}</span>
                  </div>
                </SelectCard>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Training Style */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Training style</h2>
            <p className="text-[#a3a3a3]">How do you like to train?</p>
            <div className="space-y-3 mt-6">
              {TRAINING_STYLES.map((s) => (
                <SelectCard
                  key={s.value}
                  selected={form.trainingStyle === s.value}
                  onClick={() => set('trainingStyle', s.value)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{s.icon}</span>
                    <span className="font-medium">{s.label}</span>
                  </div>
                </SelectCard>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Split */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Workout split</h2>
            <p className="text-[#a3a3a3]">How do you want to structure your week?</p>
            <div className="space-y-3 mt-6">
              {SPLITS.map((s) => (
                <SelectCard
                  key={s.value}
                  selected={form.splitPreference === s.value}
                  onClick={() => set('splitPreference', s.value)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{s.label}</span>
                    <span className="text-sm text-[#a3a3a3]">{s.desc}</span>
                  </div>
                </SelectCard>
              ))}
              {(form.experienceLevel === 'INTERMEDIATE' || form.experienceLevel === 'ADVANCED') && (
                <SelectCard
                  selected={form.splitPreference === 'CUSTOM_HYBRID'}
                  onClick={() => set('splitPreference', 'CUSTOM_HYBRID')}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Custom Hybrid</span>
                    <span className="text-sm text-[#a3e635]">Intermediate+</span>
                  </div>
                </SelectCard>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Experience */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Experience level</h2>
            <p className="text-[#a3a3a3]">Be honest — this affects exercise selection.</p>
            <div className="space-y-3 mt-6">
              {EXPERIENCE_LEVELS.map((e) => (
                <SelectCard
                  key={e.value}
                  selected={form.experienceLevel === e.value}
                  onClick={() => set('experienceLevel', e.value)}
                >
                  <div>
                    <div className="font-medium">{e.label}</div>
                    <div className="text-sm text-[#a3a3a3] mt-0.5">{e.desc}</div>
                  </div>
                </SelectCard>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Equipment */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Equipment access</h2>
            <p className="text-[#a3a3a3]">Only exercises you can actually do.</p>
            <div className="space-y-3 mt-6">
              {EQUIPMENT_TIERS.map((e) => (
                <SelectCard
                  key={e.value}
                  selected={form.equipmentTier === e.value}
                  onClick={() => set('equipmentTier', e.value)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{e.icon}</span>
                    <span className="font-medium">{e.label}</span>
                  </div>
                </SelectCard>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Biometrics */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">About you</h2>
            <p className="text-[#a3a3a3]">Used to calculate your calorie targets.</p>
            <div className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-[#a3a3a3] mb-1 block">Age</label>
                  <input
                    type="number"
                    value={form.age}
                    onChange={(e) => set('age', e.target.value)}
                    placeholder="25"
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-[#f5f5f5] focus:outline-none focus:border-[#a3e635]"
                  />
                </div>
                <div>
                  <label className="text-sm text-[#a3a3a3] mb-1 block">Sex</label>
                  <select
                    value={form.sex}
                    onChange={(e) => set('sex', e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-[#f5f5f5] focus:outline-none focus:border-[#a3e635]"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-[#a3a3a3] mb-1 block">Height (cm)</label>
                  <input
                    type="number"
                    value={form.heightCm}
                    onChange={(e) => set('heightCm', e.target.value)}
                    placeholder="175"
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-[#f5f5f5] focus:outline-none focus:border-[#a3e635]"
                  />
                </div>
                <div>
                  <label className="text-sm text-[#a3a3a3] mb-1 block">Weight (kg)</label>
                  <input
                    type="number"
                    value={form.weightKg}
                    onChange={(e) => set('weightKg', e.target.value)}
                    placeholder="75"
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-[#f5f5f5] focus:outline-none focus:border-[#a3e635]"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-[#a3a3a3] mb-1 block">Sport activity (optional)</label>
                <input
                  type="text"
                  value={form.sportActivity}
                  onChange={(e) => set('sportActivity', e.target.value)}
                  placeholder="e.g. basketball, pickleball"
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-[#f5f5f5] focus:outline-none focus:border-[#a3e635]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Activity Level */}
        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Activity level</h2>
            <p className="text-[#a3a3a3]">Outside of your workouts.</p>
            <div className="space-y-3 mt-6">
              {ACTIVITY_LEVELS.map((a) => (
                <SelectCard
                  key={a.value}
                  selected={form.activityLevel === a.value}
                  onClick={() => set('activityLevel', a.value)}
                >
                  <div>
                    <div className="font-medium">{a.label}</div>
                    <div className="text-sm text-[#a3a3a3] mt-0.5">{a.desc}</div>
                  </div>
                </SelectCard>
              ))}
            </div>
          </div>
        )}

        {/* Step 7: Nutrition */}
        {step === 7 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Nutrition preferences</h2>
            <p className="text-[#a3a3a3]">We'll build meals around your lifestyle.</p>
            <div className="space-y-4 mt-6">
              <div>
                <label className="text-sm text-[#a3a3a3] mb-2 block">Preferred cuisine</label>
                <div className="flex flex-wrap gap-2">
                  {CUISINES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set('cuisinePreference', c)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                        form.cuisinePreference === c
                          ? 'border-[#a3e635] bg-[#a3e635]/10 text-[#a3e635]'
                          : 'border-[#2a2a2a] bg-[#1a1a1a] text-[#a3a3a3] hover:border-[#3a3a3a]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-[#a3a3a3] mb-2 block">Budget</label>
                <div className="space-y-2">
                  {BUDGET_LEVELS.map((b) => (
                    <SelectCard
                      key={b.value}
                      selected={form.budgetLevel === b.value}
                      onClick={() => set('budgetLevel', b.value)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{b.label}</span>
                        <span className="text-sm text-[#a3a3a3]">{b.desc}</span>
                      </div>
                    </SelectCard>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-[#a3a3a3] mb-1 block">
                  Max cooking time (minutes)
                </label>
                <input
                  type="number"
                  value={form.cookingTimeMinutes}
                  onChange={(e) => set('cookingTimeMinutes', e.target.value)}
                  placeholder="30"
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-[#f5f5f5] focus:outline-none focus:border-[#a3e635]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 8: Review */}
        {step === 8 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Ready to build your program</h2>
            <p className="text-[#a3a3a3]">Here's what we'll create for you.</p>
            <div className="space-y-3 mt-6">
              {[
                { label: 'Goal', value: GOALS.find((g) => g.value === form.primaryGoal)?.label },
                { label: 'Style', value: TRAINING_STYLES.find((s) => s.value === form.trainingStyle)?.label },
                { label: 'Split', value: SPLITS.find((s) => s.value === form.splitPreference)?.label || form.splitPreference },
                { label: 'Experience', value: EXPERIENCE_LEVELS.find((e) => e.value === form.experienceLevel)?.label },
                { label: 'Equipment', value: EQUIPMENT_TIERS.find((e) => e.value === form.equipmentTier)?.label },
                { label: 'Activity', value: ACTIVITY_LEVELS.find((a) => a.value === form.activityLevel)?.label },
                { label: 'Cuisine', value: form.cuisinePreference },
                { label: 'Budget', value: BUDGET_LEVELS.find((b) => b.value === form.budgetLevel)?.label },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3"
                >
                  <span className="text-[#a3a3a3] text-sm">{item.label}</span>
                  <span className="font-medium text-sm">{item.value || '—'}</span>
                </div>
              ))}
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-8 pt-4 space-y-3">
        {step === STEPS.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#a3e635] text-black font-bold py-4 rounded-xl text-lg hover:bg-[#84cc16] transition-colors disabled:opacity-50"
          >
            {loading ? 'Building your program...' : 'Build My Program 🚀'}
          </button>
        ) : (
          <button
            onClick={next}
            disabled={!canProceed()}
            className="w-full bg-[#a3e635] text-black font-bold py-4 rounded-xl text-lg hover:bg-[#84cc16] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        )}
        {step > 0 && (
          <button
            onClick={back}
            className="w-full text-[#a3a3a3] py-2 text-sm hover:text-[#f5f5f5] transition-colors"
          >
            Back
          </button>
        )}
      </div>
    </div>
  )
}
