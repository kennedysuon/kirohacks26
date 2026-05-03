'use client'

import { useEffect, useState } from 'react'
import BottomNav from '@/components/BottomNav'

interface Meal {
  id: string
  name: string
  cuisine?: string
  prepTimeMinutes: number
  estimatedCostUsd: number
  proteinG: number
  carbsG: number
  fatG: number
  calories: number
  ingredients: string
}

interface NutritionPlan {
  id: string
  tdee: number
  calorieTarget: number
  proteinG: number
  carbsG: number
  fatG: number
  meals: Meal[]
}

const MEAL_LABELS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

const BUDGET_LABEL: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

function getBudgetLabel(cost: number): string {
  if (cost < 5) return 'Low'
  if (cost < 12) return 'Medium'
  return 'High'
}

export default function NutritionPage() {
  const [plan, setPlan] = useState<NutritionPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [substituting, setSubstituting] = useState<string | null>(null)

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    if (!userId) { setLoading(false); return }
    fetch(`/api/nutrition-plan?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => { if (!data.error) setPlan(data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="text-[#737373] text-sm">Loading nutrition plan...</div>
      </div>
    )
  }

  // Macro percentages for the bar
  const totalKcal = plan ? plan.proteinG * 4 + plan.carbsG * 4 + plan.fatG * 9 : 1
  const proteinPct = plan ? Math.round((plan.proteinG * 4 / totalKcal) * 100) : 30
  const carbsPct = plan ? Math.round((plan.carbsG * 4 / totalKcal) * 100) : 45
  const fatPct = plan ? Math.round((plan.fatG * 9 / totalKcal) * 100) : 25

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="min-h-screen bg-[#111111] pb-20">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-xl font-bold text-white">Nutrition Plan</h1>
        <p className="text-sm text-[#737373] mt-0.5">Daily targets • {today}</p>
      </div>

      {plan ? (
        <>
          {/* Calorie target */}
          <div className="px-6 mb-5">
            <div className="text-5xl font-bold text-white mb-1">
              {plan.calorieTarget.toLocaleString()}
            </div>
            <div className="text-sm text-[#737373] mb-4">calories / day</div>

            {/* Macro bar */}
            <div className="h-2 rounded-full overflow-hidden flex mb-3">
              <div className="bg-[#3b82f6]" style={{ width: `${proteinPct}%` }} />
              <div className="bg-[#eab308]" style={{ width: `${carbsPct}%` }} />
              <div className="bg-[#ef4444]" style={{ width: `${fatPct}%` }} />
            </div>

            {/* Macro legend */}
            <div className="flex items-center gap-4 text-xs text-[#737373]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                P: {plan.proteinG}g ({proteinPct}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#eab308]" />
                C: {plan.carbsG}g ({carbsPct}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
                F: {plan.fatG}g ({fatPct}%)
              </span>
            </div>
          </div>

          {/* Meals */}
          <div className="px-6 space-y-3">
            {plan.meals.map((meal, i) => {
              let ingredients: Array<{ name: string }> = []
              try { ingredients = JSON.parse(meal.ingredients) } catch {}

              return (
                <div
                  key={meal.id}
                  className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-2xl overflow-hidden"
                >
                  <div className="px-5 py-4">
                    <div className="text-xs text-[#737373] mb-1">{MEAL_LABELS[i] || 'Meal'}</div>
                    <h3 className="font-bold text-white text-base mb-2">{meal.name}</h3>

                    {/* Tags */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {meal.cuisine && (
                        <span className="text-xs text-[#a3a3a3] bg-[#2a2a2a] px-2.5 py-1 rounded-full">
                          {meal.cuisine}
                        </span>
                      )}
                      <span className="text-xs text-[#a3a3a3] bg-[#2a2a2a] px-2.5 py-1 rounded-full">
                        {meal.prepTimeMinutes} min
                      </span>
                      <span className="text-xs text-[#a3a3a3] bg-[#2a2a2a] px-2.5 py-1 rounded-full">
                        {getBudgetLabel(meal.estimatedCostUsd)}
                      </span>
                    </div>

                    {/* Macros */}
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-xs text-[#737373]">P</div>
                        <div className="text-sm font-semibold text-white">{meal.proteinG}g</div>
                      </div>
                      <div>
                        <div className="text-xs text-[#737373]">C</div>
                        <div className="text-sm font-semibold text-white">{meal.carbsG}g</div>
                      </div>
                      <div>
                        <div className="text-xs text-[#737373]">F</div>
                        <div className="text-sm font-semibold text-white">{meal.fatG}g</div>
                      </div>
                    </div>
                  </div>

                  {/* Ingredient substitution rows */}
                  {ingredients.slice(0, 1).map((ing, j) => (
                    <div
                      key={j}
                      className="border-t border-[#f59e0b]/20 bg-[#f59e0b]/5 px-5 py-3 flex items-center justify-between"
                    >
                      <span className="text-xs text-[#f59e0b]">{ing.name} unavailable</span>
                      <button
                        onClick={() => setSubstituting(meal.id)}
                        className="text-xs font-semibold text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/30 px-3 py-1.5 rounded-lg hover:bg-[#f59e0b]/20 transition-colors"
                      >
                        Substitute
                      </button>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <div className="px-6 py-16 text-center">
          <p className="text-[#737373] text-sm">No nutrition plan found.</p>
          <p className="text-[#525252] text-xs mt-1">Complete onboarding to generate your plan.</p>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
