'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Ingredient {
  name: string
  amount: string
  unit: string
}

interface Meal {
  id: string
  name: string
  cuisine: string | null
  prepTimeMinutes: number
  estimatedCostUsd: number
  proteinG: number
  carbsG: number
  fatG: number
  calories: number
  ingredients: Ingredient[]
  instructions: string
}

interface MacroTargets {
  proteinG: number
  carbsG: number
  fatG: number
}

interface DailyTotals {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
}

interface NutritionPlan {
  id: string
  userId: string
  tdee: number
  calorieTarget: number
  macroTargets: MacroTargets
  meals: Meal[]
  dailyTotals: DailyTotals
}

// ─── Ingredient substitution lookup ──────────────────────────────────────────

const SUBSTITUTIONS: Record<string, string> = {
  'chicken breast': 'turkey breast',
  'chicken': 'turkey breast',
  'rice': 'quinoa',
  'white rice': 'quinoa',
  'brown rice': 'quinoa',
  'olive oil': 'avocado oil',
  'butter': 'coconut oil',
  'milk': 'almond milk',
  'whole milk': 'almond milk',
  'beef': 'bison',
  'ground beef': 'ground turkey',
  'pasta': 'zucchini noodles',
  'bread': 'lettuce wrap',
  'flour': 'almond flour',
  'sugar': 'stevia',
  'cream': 'coconut cream',
  'sour cream': 'greek yogurt',
  'mayonnaise': 'avocado',
  'peanut butter': 'almond butter',
  'soy sauce': 'coconut aminos',
  'cheese': 'nutritional yeast',
  'egg': 'flax egg',
  'eggs': 'flax egg',
  'salmon': 'tilapia',
  'tuna': 'sardines',
  'shrimp': 'tofu',
  'tofu': 'tempeh',
  'potato': 'sweet potato',
  'potatoes': 'sweet potato',
  'sweet potato': 'butternut squash',
  'oats': 'quinoa flakes',
  'yogurt': 'coconut yogurt',
  'greek yogurt': 'coconut yogurt',
}

function findSubstitute(ingredientName: string): string | null {
  const lower = ingredientName.toLowerCase().trim()
  if (SUBSTITUTIONS[lower]) return SUBSTITUTIONS[lower]
  // partial match
  for (const [key, value] of Object.entries(SUBSTITUTIONS)) {
    if (lower.includes(key)) return value
  }
  return null
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface MacroBarProps {
  label: string
  actual: number
  target: number
  color: string
  unit?: string
}

function MacroBar({ label, actual, target, color, unit = 'g' }: MacroBarProps) {
  const pct = Math.min(100, target > 0 ? (actual / target) * 100 : 0)
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.35rem',
          fontSize: '0.85rem',
        }}
      >
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ color: 'var(--muted)' }}>
          {actual}{unit} / {target}{unit}
        </span>
      </div>
      <div
        style={{
          height: '8px',
          borderRadius: '4px',
          backgroundColor: 'var(--border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            backgroundColor: color,
            borderRadius: '4px',
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  )
}

interface IngredientRowProps {
  ingredient: Ingredient
}

function IngredientRow({ ingredient }: IngredientRowProps) {
  const [unavailable, setUnavailable] = useState(false)
  const substitute = unavailable ? findSubstitute(ingredient.name) : null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.4rem 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ flex: 1 }}>
        <span
          style={{
            textDecoration: unavailable ? 'line-through' : 'none',
            color: unavailable ? 'var(--muted)' : 'var(--foreground)',
            fontSize: '0.9rem',
          }}
        >
          {ingredient.amount} {ingredient.unit} {ingredient.name}
        </span>
        {unavailable && (
          <div
            style={{
              marginTop: '0.25rem',
              fontSize: '0.82rem',
              color: substitute ? '#22c55e' : 'var(--muted)',
            }}
          >
            {substitute ? `→ Substitute: ${substitute}` : 'No substitute found'}
          </div>
        )}
      </div>
      <button
        onClick={() => setUnavailable((v) => !v)}
        style={{
          flexShrink: 0,
          fontSize: '0.75rem',
          padding: '0.2rem 0.5rem',
          borderRadius: '0.25rem',
          border: `1px solid ${unavailable ? '#22c55e' : 'var(--border)'}`,
          backgroundColor: 'transparent',
          color: unavailable ? '#22c55e' : 'var(--muted)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {unavailable ? 'Restore' : 'Mark unavailable'}
      </button>
    </div>
  )
}

interface MealCardProps {
  meal: Meal
}

function MealCard({ meal }: MealCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        marginBottom: '1rem',
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '0.75rem',
          marginBottom: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
          {meal.name}
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {meal.cuisine && (
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                backgroundColor: 'var(--border)',
                color: 'var(--foreground)',
              }}
            >
              {meal.cuisine}
            </span>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          fontSize: '0.85rem',
          color: 'var(--muted)',
          marginBottom: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <span>⏱ {meal.prepTimeMinutes} min</span>
        <span>💰 ${meal.estimatedCostUsd.toFixed(2)}</span>
      </div>

      {/* Macro row */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          fontSize: '0.85rem',
          flexWrap: 'wrap',
          padding: '0.6rem 0.75rem',
          backgroundColor: 'var(--background)',
          borderRadius: '0.5rem',
          marginBottom: '0.75rem',
        }}
      >
        <span>
          <span style={{ color: '#3b82f6', fontWeight: 600 }}>P:</span>{' '}
          {meal.proteinG}g
        </span>
        <span>
          <span style={{ color: '#22c55e', fontWeight: 600 }}>C:</span>{' '}
          {meal.carbsG}g
        </span>
        <span>
          <span style={{ color: '#f97316', fontWeight: 600 }}>F:</span>{' '}
          {meal.fatG}g
        </span>
        <span style={{ color: 'var(--muted)' }}>{meal.calories} kcal</span>
      </div>

      {/* Ingredients toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--accent)',
          cursor: 'pointer',
          fontSize: '0.85rem',
          padding: 0,
          marginBottom: expanded ? '0.75rem' : 0,
        }}
      >
        {expanded ? '▲ Hide ingredients' : '▼ Show ingredients'}
      </button>

      {expanded && (
        <div>
          {Array.isArray(meal.ingredients) && meal.ingredients.length > 0 ? (
            meal.ingredients.map((ing, idx) => (
              <IngredientRow key={`${ing.name}-${idx}`} ingredient={ing} />
            ))
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              No ingredient data available.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Totals footer ────────────────────────────────────────────────────────────

interface TotalsFooterProps {
  totals: DailyTotals
  targets: MacroTargets
  calorieTarget: number
}

function withinTen(actual: number, target: number): boolean {
  if (target === 0) return actual === 0
  return Math.abs(actual - target) / target <= 0.1
}

function TotalsFooter({ totals, targets, calorieTarget }: TotalsFooterProps) {
  const rows: Array<{ label: string; actual: number; target: number; unit: string }> = [
    { label: 'Calories', actual: totals.calories, target: calorieTarget, unit: 'kcal' },
    { label: 'Protein', actual: totals.proteinG, target: targets.proteinG, unit: 'g' },
    { label: 'Carbs', actual: totals.carbsG, target: targets.carbsG, unit: 'g' },
    { label: 'Fat', actual: totals.fatG, target: targets.fatG, unit: 'g' },
  ]

  return (
    <div
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        marginTop: '1.5rem',
      }}
    >
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
        Daily Totals
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.75rem',
        }}
      >
        {rows.map(({ label, actual, target, unit }) => {
          const ok = withinTen(actual, target)
          return (
            <div
              key={label}
              style={{
                backgroundColor: 'var(--background)',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
                {label}
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {actual}
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: '2px' }}>
                  {unit}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.15rem' }}>
                target: {target} {unit}
              </div>
              <div style={{ fontSize: '1rem', marginTop: '0.35rem' }}>
                {ok ? '✅' : '⚠️'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NutritionPage() {
  const [plan, setPlan] = useState<NutritionPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const userId =
      (typeof window !== 'undefined' && localStorage.getItem('userId')) ||
      'demo-user'

    fetch(`/api/nutrition-plan?userId=${encodeURIComponent(userId)}`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true)
          return
        }
        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`)
        }
        const data: NutritionPlan = await res.json()
        setPlan(data)
      })
      .catch((err: Error) => {
        setError(err.message || 'Failed to load nutrition plan.')
      })
      .finally(() => setLoading(false))
  }, [])

  // ── Loading ──
  if (loading) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: 'var(--muted)', fontSize: '1.1rem' }}>
          Loading your nutrition plan…
        </p>
      </main>
    )
  }

  // ── Error ──
  if (error) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '2rem',
        }}
      >
        <p style={{ color: '#ef4444', fontSize: '1.1rem' }}>⚠️ {error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.6rem 1.25rem',
            cursor: 'pointer',
            fontSize: '0.95rem',
          }}
        >
          Retry
        </button>
      </main>
    )
  }

  // ── Not found ──
  if (notFound || !plan) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '3rem' }}>🥗</div>
        <h1 style={{ fontSize: '1.5rem' }}>No nutrition plan found</h1>
        <p style={{ color: 'var(--muted)', maxWidth: '400px' }}>
          Complete onboarding to generate your plan.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            backgroundColor: 'var(--accent)',
            color: '#fff',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            fontWeight: 600,
            marginTop: '0.5rem',
          }}
        >
          Go to Home
        </Link>
      </main>
    )
  }

  const { calorieTarget, macroTargets, meals, dailyTotals } = plan

  return (
    <main
      style={{
        maxWidth: '760px',
        margin: '0 auto',
        padding: '2rem 1rem',
      }}
    >
      {/* Page title */}
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        🥗 Nutrition Plan
      </h1>

      {/* ── Macro targets header card ── */}
      <div
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
            Daily Calorie Target
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>
            {calorieTarget}
            <span style={{ fontSize: '1rem', color: 'var(--muted)', marginLeft: '0.4rem', fontWeight: 400 }}>
              kcal
            </span>
          </div>
          {plan.tdee > 0 && (
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
              TDEE: {plan.tdee} kcal
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
          <MacroBar
            label="Protein"
            actual={dailyTotals.proteinG}
            target={macroTargets.proteinG}
            color="#3b82f6"
          />
          <MacroBar
            label="Carbs"
            actual={dailyTotals.carbsG}
            target={macroTargets.carbsG}
            color="#22c55e"
          />
          <MacroBar
            label="Fat"
            actual={dailyTotals.fatG}
            target={macroTargets.fatG}
            color="#f97316"
          />
        </div>
      </div>

      {/* ── Meal list ── */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>
        Today&apos;s Meals
      </h2>

      {meals.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>No meals in your plan yet.</p>
      ) : (
        meals.map((meal) => <MealCard key={meal.id} meal={meal} />)
      )}

      {/* ── Daily totals footer ── */}
      <TotalsFooter
        totals={dailyTotals}
        targets={macroTargets}
        calorieTarget={calorieTarget}
      />
    </main>
  )
}
