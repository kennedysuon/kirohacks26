'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ─── Step Data ────────────────────────────────────────────────────────────────

const GOALS = [
  {
    value: 'MUSCLE_GAIN',
    label: 'Muscle Gain',
    desc: 'Build lean muscle mass and size',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-[#a3a3a3]" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    value: 'FAT_LOSS',
    label: 'Fat Loss',
    desc: 'Reduce body fat while preserving muscle',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-[#a3a3a3]" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
  {
    value: 'STRENGTH',
    label: 'Strength',
    desc: 'Increase your overall power and strength',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-[#a3a3a3]" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    value: 'GENERAL_FITNESS',
    label: 'General Fitness',
    desc: 'Improve overall health and conditioning',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-[#a3a3a3]" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
  },
  {
    value: 'SPORT_PERFORMANCE',
    label: 'Sport Performance',
    desc: 'Enhance athletic performance and skills',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-[#a3a3a3]" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
      </svg>
    ),
  },
]

const TRAINING_STYLES = [
  { value: 'BODYBUILDING', label: 'Bodybuilding', desc: 'Hypertrophy-focused training for muscle size' },
  { value: 'POWERLIFTING', label: 'Powerlifting', desc: 'Strength-focused: squat, bench, deadlift' },
  { value: 'PILATES_YOGA', label: 'Pilates / Yoga', desc: 'Flexibility, mobility, and mind-body connection' },
]

const SPLITS = [
  { value: 'PPL', label: 'Push / Pull / Legs', desc: '6 days/week' },
  { value: 'ARNOLD_SPLIT', label: 'Arnold Split', desc: '6 days/week' },
  { value: 'UPPER_LOWER', label: 'Upper / Lower', desc: '4 days/week' },
  { value: 'FULL_BODY', label: 'Full Body', desc: '3 days/week' },
  { value: 'GLUTE_PROGRAM', label: 'Glute Program', desc: '4 days/week' },
]

const EXPERIENCE_LEVELS = [
  { value: 'BEGINNER', label: 'Beginner', desc: 'Less than 1 year of consistent training' },
  { value: 'INTERMEDIATE', label: 'Intermediate', desc: '1–3 years of consistent training' },
  { value: 'ADVANCED', label: 'Advanced', desc: '3+ years of consistent training' },
]

const EQUIPMENT_TIERS = [
  { value: 'FULL_GYM', label: 'Full Gym', desc: 'Access to all machines and free weights' },
  { value: 'HOME_GYM', label: 'Home Gym', desc: 'Barbell, dumbbells, pull-up bar, bench' },
  { value: 'DUMBBELLS_ONLY', label: 'Dumbbells Only', desc: 'Dumbbells and bodyweight exercises' },
  { value: 'RESISTANCE_BANDS', label: 'Resistance Bands', desc: 'Bands and bodyweight exercises' },
  { value: 'BODYWEIGHT_ONLY', label: 'Bodyweight Only', desc: 'No equipment needed' },
]

const ACTIVITY_LEVELS = [
  { value: 'SEDENTARY', label: 'Sedentary', desc: 'Little to no exercise' },
  { value: 'LIGHTLY_ACTIVE', label: 'Lightly Active', desc: '1–3 days/week light activity' },
  { value: 'MODERATELY_ACTIVE', label: 'Moderately Active', desc: '3–5 days/week moderate activity' },
  { value: 'VERY_ACTIVE', label: 'Very Active', desc: '6–7 days/week hard exercise' },
  { value: 'EXTRA_ACTIVE', label: 'Extra Active', desc: 'Physical job + hard training' },
]

const CUISINES = ['Any', 'American', 'Mediterranean', 'Asian', 'Mexican', 'Italian', 'Indian']
const BUDGET_LEVELS = [
  { value: 'LOW', label: 'Budget', desc: 'Under $50/week' },
  { value: 'MEDIUM', label: 'Medium', desc: '$50–100/week' },
  { value: 'HIGH', label: 'Premium', desc: '$100+/week' },
]

const STEPS = [
  'Primary Goal',
  'Training Style',
  'Workout Split',
  'Experience Level',
  'Equipment',
  'About You',
  'Activity Level',
  'Nutrition',
  'Review',
]

interface FormData {
  primaryGoal: string
  trainingStyle: string
  splitPreference: string
  experienceLevel: string
  equipmentTier: string
  age: string
  sex: string
  heightFt: string
  heightIn: string
  weightLbs: string
  activityLevel: string
  cuisinePreference: string
  budgetLevel: string
  cookingTimeMinutes: string
  ingredientFlexible: boolean
  sportActivity: string
}

const INITIAL_FORM: FormData = {
  primaryGoal: '',
  trainingStyle: '',
  splitPreference: '',
  experienceLevel: '',
  equipmentTier: '',
  age: '',
  sex: '',
  heightFt: '',
  heightIn: '',
  weightLbs: '',
  activityLevel: '',
  cuisinePreference: 'Any',
  budgetLevel: 'MEDIUM',
  cookingTimeMinutes: '30',
  ingredientFlexible: true,
  sportActivity: '',
}

function OptionCard({
  selected,
  onClick,
  icon,
  label,
  desc,
  right,
}: {
  selected: boolean
  onClick: () => void
  icon?: React.ReactNode
  label: string
  desc?: string
  right?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-4 rounded-xl border transition-all ${
        selected
          ? 'border-[#a3e635] bg-[#a3e635]/5'
          : 'border-[#2a2a2a] bg-[#1c1c1c] hover:border-[#3a3a3a]'
      }`}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-[#2a2a2a] flex items-center justify-center shrink-0 mt-0.5">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className={`font-semibold text-sm ${selected ? 'text-[#f5f5f5]' : 'text-[#e5e5e5]'}`}>
              {label}
            </span>
            {right && <span className="text-xs text-[#525252] ml-2 shrink-0">{right}</span>}
          </div>
          {desc && (
            <p className="text-xs text-[#737373] mt-0.5 leading-relaxed">{desc}</p>
          )}
        </div>
      </div>
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
      case 5: return !!form.age && !!form.sex && !!form.heightFt && !!form.weightLbs
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
          // Convert feet+inches → cm
          heightCm: (parseInt(form.heightFt || '0') * 12 + parseInt(form.heightIn || '0')) * 2.54,
          // Convert lbs → kg (API handles final conversion, send as lbs with unit flag)
          weightKg: parseFloat(form.weightLbs),
          weightUnit: 'lbs',
          cookingTimeMinutes: parseInt(form.cookingTimeMinutes) || 30,
          sportActivity: form.sportActivity || null,
          impediments: [],
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

  // Review step defaults
  const reviewItems = [
    { label: 'Budget', value: BUDGET_LEVELS.find(b => b.value === form.budgetLevel)?.label || 'Medium' },
    { label: 'Equipment', value: EQUIPMENT_TIERS.find(e => e.value === form.equipmentTier)?.label || 'Bodyweight Only' },
    { label: 'Cooking time', value: `${form.cookingTimeMinutes} min` },
    { label: 'Workout frequency', value: SPLITS.find(s => s.value === form.splitPreference)?.desc || '—' },
    { label: 'Session duration', value: '45–60 min' },
    { label: 'Experience level', value: EXPERIENCE_LEVELS.find(e => e.value === form.experienceLevel)?.label || '—' },
  ]

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col max-w-2xl mx-auto">
      {/* Green top bar */}
      <div className="h-1 bg-[#1a1a1a]">
        <div
          className="h-1 bg-[#a3e635] transition-all duration-300"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pt-8 pb-4 overflow-y-auto">
        <p className="text-sm text-[#737373] mb-2">Step {step + 1} of {STEPS.length}</p>

        {/* Step 0: Goal */}
        {step === 0 && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-6">What&apos;s your primary goal?</h1>
            <div className="space-y-3">
              {GOALS.map((g) => (
                <OptionCard
                  key={g.value}
                  selected={form.primaryGoal === g.value}
                  onClick={() => set('primaryGoal', g.value)}
                  icon={g.icon}
                  label={g.label}
                  desc={g.desc}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Training Style */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-6">Training style</h1>
            <div className="space-y-3">
              {TRAINING_STYLES.map((s) => (
                <OptionCard
                  key={s.value}
                  selected={form.trainingStyle === s.value}
                  onClick={() => set('trainingStyle', s.value)}
                  label={s.label}
                  desc={s.desc}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Split */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-6">Workout split</h1>
            <div className="space-y-3">
              {SPLITS.map((s) => (
                <OptionCard
                  key={s.value}
                  selected={form.splitPreference === s.value}
                  onClick={() => set('splitPreference', s.value)}
                  label={s.label}
                  right={s.desc}
                />
              ))}
              {(form.experienceLevel === 'INTERMEDIATE' || form.experienceLevel === 'ADVANCED') && (
                <OptionCard
                  selected={form.splitPreference === 'CUSTOM_HYBRID'}
                  onClick={() => set('splitPreference', 'CUSTOM_HYBRID')}
                  label="Custom Hybrid"
                  right="Intermediate+"
                />
              )}
            </div>
          </div>
        )}

        {/* Step 3: Experience */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-6">Experience level</h1>
            <div className="space-y-3">
              {EXPERIENCE_LEVELS.map((e) => (
                <OptionCard
                  key={e.value}
                  selected={form.experienceLevel === e.value}
                  onClick={() => set('experienceLevel', e.value)}
                  label={e.label}
                  desc={e.desc}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Equipment */}
        {step === 4 && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-6">Equipment access</h1>
            <div className="space-y-3">
              {EQUIPMENT_TIERS.map((e) => (
                <OptionCard
                  key={e.value}
                  selected={form.equipmentTier === e.value}
                  onClick={() => set('equipmentTier', e.value)}
                  label={e.label}
                  desc={e.desc}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Biometrics */}
        {step === 5 && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-6">About you</h1>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#737373] mb-1.5 block">Age</label>
                  <input
                    type="number"
                    value={form.age}
                    onChange={(e) => set('age', e.target.value)}
                    placeholder="25"
                    className="w-full bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#a3e635]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#737373] mb-1.5 block">Sex</label>
                  <select
                    value={form.sex}
                    onChange={(e) => set('sex', e.target.value)}
                    className="w-full bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#a3e635]"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#737373] mb-1.5 block">Height</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        value={form.heightFt}
                        onChange={(e) => set('heightFt', e.target.value)}
                        placeholder="5"
                        className="w-full bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#a3e635] pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#525252]">ft</span>
                    </div>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        value={form.heightIn}
                        onChange={(e) => set('heightIn', e.target.value)}
                        placeholder="9"
                        min="0"
                        max="11"
                        className="w-full bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#a3e635] pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#525252]">in</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#737373] mb-1.5 block">Weight</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={form.weightLbs}
                      onChange={(e) => set('weightLbs', e.target.value)}
                      placeholder="175"
                      className="w-full bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#a3e635] pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#525252]">lbs</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs text-[#737373] mb-1.5 block">Sport activity (optional)</label>
                <input
                  type="text"
                  value={form.sportActivity}
                  onChange={(e) => set('sportActivity', e.target.value)}
                  placeholder="e.g. basketball, pickleball"
                  className="w-full bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#a3e635]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Activity Level */}
        {step === 6 && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-6">Activity level</h1>
            <div className="space-y-3">
              {ACTIVITY_LEVELS.map((a) => (
                <OptionCard
                  key={a.value}
                  selected={form.activityLevel === a.value}
                  onClick={() => set('activityLevel', a.value)}
                  label={a.label}
                  desc={a.desc}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 7: Nutrition */}
        {step === 7 && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-6">Nutrition preferences</h1>
            <div className="space-y-5">
              <div>
                <label className="text-xs text-[#737373] mb-2 block">Preferred cuisine</label>
                <div className="flex flex-wrap gap-2">
                  {CUISINES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set('cuisinePreference', c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        form.cuisinePreference === c
                          ? 'border-[#a3e635] bg-[#a3e635]/10 text-[#a3e635]'
                          : 'border-[#2a2a2a] bg-[#1c1c1c] text-[#737373] hover:border-[#3a3a3a]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#737373] mb-2 block">Budget</label>
                <div className="space-y-2">
                  {BUDGET_LEVELS.map((b) => (
                    <OptionCard
                      key={b.value}
                      selected={form.budgetLevel === b.value}
                      onClick={() => set('budgetLevel', b.value)}
                      label={b.label}
                      right={b.desc}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#737373] mb-1.5 block">Max cooking time (min)</label>
                <input
                  type="number"
                  value={form.cookingTimeMinutes}
                  onChange={(e) => set('cookingTimeMinutes', e.target.value)}
                  placeholder="30"
                  className="w-full bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#a3e635]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 8: Review */}
        {step === 8 && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Here&apos;s what we filled in for you.</h1>
            <p className="text-sm text-[#737373] mb-6">These defaults help us create your personalized plan. You can adjust them anytime.</p>
            <div className="space-y-3">
              {reviewItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl px-4 py-3.5"
                >
                  <div>
                    <div className="text-xs text-[#737373]">{item.label}</div>
                    <div className="text-sm font-semibold text-white mt-0.5">{item.value}</div>
                  </div>
                  <button className="w-7 h-7 rounded-lg bg-[#2a2a2a] flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-[#a3e635]" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            {error && (
              <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-8 pt-4 space-y-3">
        {step === STEPS.length - 1 ? (
          <>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#a3e635] text-black font-bold py-4 rounded-xl text-base hover:bg-[#84cc16] transition-colors disabled:opacity-50"
            >
              {loading ? 'Building your program...' : 'Looks good — Generate my plan'}
            </button>
            <button
              onClick={back}
              className="w-full text-[#a3e635] text-sm py-2 hover:opacity-80 transition-opacity"
            >
              Go back and edit
            </button>
          </>
        ) : (
          <>
            <button
              onClick={next}
              disabled={!canProceed()}
              className="w-full bg-[#a3e635] text-black font-bold py-4 rounded-xl text-base hover:bg-[#84cc16] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Continue
            </button>
            {step > 0 && (
              <button
                onClick={back}
                className="w-full text-[#737373] text-sm py-2 hover:text-[#a3a3a3] transition-colors"
              >
                Back
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
