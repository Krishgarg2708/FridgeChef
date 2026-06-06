/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Sparkles, Calendar, ClipboardList, Loader2, ArrowRight } from "lucide-react";

interface MealPlannerProps {
  ingredients: string[];
  userId: string;
}

interface MealItem {
  name: string;
  time: string;
  ingredientsNeeded?: string[];
}

interface DayPlan {
  day: string;
  breakfast: MealItem;
  lunch: MealItem;
  dinner: MealItem;
}

interface ShoppingListItem {
  name: string;
  category: string;
}

interface MealPlanResponse {
  schedule: DayPlan[];
  shoppingList: ShoppingListItem[];
}

export default function MealPlannerSection({ ingredients, userId }: MealPlannerProps) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<MealPlanResponse | null>(null);
  const [errorString, setErrorString] = useState<string | null>(null);
  const [checkedGroc, setCheckedGroc] = useState<{ [name: string]: boolean }>({});

  const generatePlan = async () => {
    if (ingredients.length === 0) {
      setErrorString("Please enter some ingredients first to generate a contextual meal plan!");
      return;
    }
    setErrorString(null);
    setLoading(true);
    try {
      const res = await fetch("/api/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients })
      });
      if (!res.ok) {
        throw new Error("Could not process AI meal schedule. Is your Gemini key config completed?");
      }
      const data = await res.json();
      setPlan(data);
    } catch (err: any) {
      console.error(err);
      setErrorString(err.message || "An error occurred compiling the schedule.");
    } finally {
      setLoading(false);
    }
  };

  const toggleGroc = (name: string) => {
    setCheckedGroc(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div id="meal-planner-container" className="space-y-6">
      <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        {/* Background ambient light */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-orange-400/5 rounded-full blur-2xl"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" /> AI 3-Day Meal Scheduler
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xl font-sans font-medium">
              Formulate a structured breakfast-lunch-dinner calendar centered on your ingredients and compile an automated shopping/grocery cart.
            </p>
          </div>

          <button
            id="trigger-meal-plan-btn"
            onClick={generatePlan}
            disabled={loading}
            className="shrink-0 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer shadow-md text-glow"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Formulating Menu...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Meal Schedule
              </>
            )}
          </button>
        </div>

        {errorString && (
          <div className="mt-4 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-2.5">
            <span className="text-orange-500 text-sm">⚠️</span>
            <p className="text-xs text-orange-850 font-sans font-medium">{errorString}</p>
          </div>
        )}
      </div>

      {plan && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in">
          {/* Schedule Calendar columns */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            {plan.schedule.map((dayData, idx) => (
              <div key={idx} className="glass-panel rounded-3xl p-5 shadow-md flex flex-col justify-between border-t-4 border-t-emerald-600">
                <div>
                  <h4 className="font-display text-lg font-extrabold text-emerald-800 tracking-tight mb-4 flex items-center gap-1.5">
                    🗓️ {dayData.day}
                  </h4>

                  <div className="space-y-4">
                    {/* Breakfast */}
                    <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 space-y-1">
                      <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-gray-400">Breakfast</span>
                      <p className="text-xs font-bold text-gray-800 font-sans leading-tight mt-0.5">{dayData.breakfast.name}</p>
                      <span className="text-[10px] text-emerald-700 font-semibold font-mono bg-emerald-50 px-1.5 py-0.5 rounded">
                        ⏱️ {dayData.breakfast.time}
                      </span>
                    </div>

                    {/* Lunch */}
                    <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 space-y-1">
                      <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-gray-400">Lunch</span>
                      <p className="text-xs font-bold text-gray-800 font-sans leading-tight mt-0.5">{dayData.lunch.name}</p>
                      <span className="text-[10px] text-emerald-700 font-semibold font-mono bg-emerald-50 px-1.5 py-0.5 rounded">
                        ⏱️ {dayData.lunch.time}
                      </span>
                    </div>

                    {/* Dinner */}
                    <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 space-y-1">
                      <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-gray-400">Dinner</span>
                      <p className="text-xs font-bold text-gray-800 font-sans leading-tight mt-0.5">{dayData.dinner.name}</p>
                      <span className="text-[10px] text-emerald-700 font-semibold font-mono bg-emerald-50 px-1.5 py-0.5 rounded">
                        ⏱️ {dayData.dinner.time}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-500 font-sans italic">
                  Complete balanced macro estimates sourced for nutrition tracking.
                </div>
              </div>
            ))}
          </div>

          {/* Unified Shopping Checklist */}
          <div className="glass-panel rounded-3xl p-5 shadow-lg border-t-4 border-t-orange-500 flex flex-col justify-between">
            <div>
              <h4 className="font-display text-lg font-extrabold text-orange-850 tracking-tight mb-4 flex items-center gap-1.5">
                <ClipboardList className="w-5 h-5 text-orange-600" /> Shopping List
              </h4>

              {plan.shoppingList.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-6 text-center">Your kitchen is fully stocked! No extra ingredients to buy.</p>
              ) : (
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {plan.shoppingList.map((item, idx) => {
                    const isChecked = checkedGroc[item.name];
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleGroc(item.name)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-sans cursor-pointer transition-all ${
                          isChecked
                            ? "bg-gray-50 border-gray-200 opacity-60 text-gray-400"
                            : "bg-white border-orange-100 text-gray-700 hover:border-orange-200"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] font-bold ${
                            isChecked ? "bg-orange-600 border-orange-600 text-white" : "border-gray-300"
                          }`}
                        >
                          {isChecked && "✓"}
                        </div>
                        <div className="flex-1">
                          <p className={`font-semibold leading-tight ${isChecked ? "line-through text-gray-400" : ""}`}>
                            {item.name}
                          </p>
                          <span className="text-[9px] font-mono opacity-50 block">{item.category}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-sans">
              <span>{Object.values(checkedGroc).filter(Boolean).length} / {plan.shoppingList.length} purchased</span>
              <button
                onClick={() => setCheckedGroc({})}
                className="text-orange-600 font-semibold hover:underline cursor-pointer"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
