/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Recipe } from "../types";
import { X, Clock, HelpCircle, Flame, Beef, Brain, Salad, AlertCircle, UtensilsCrossed, Sparkles } from "lucide-react";

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  onClose: () => void;
  onToggleFavorite: (recipeId: string) => void;
  isFavorite: boolean;
}

export default function RecipeDetailModal({
  recipe,
  onClose,
  onToggleFavorite,
  isFavorite
}: RecipeDetailModalProps) {
  if (!recipe) return null;

  const [checkedSteps, setCheckedSteps] = useState<{ [index: number]: boolean }>({});

  const toggleStep = (idx: number) => {
    setCheckedSteps(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Nutrition helper values
  const nutritionFields = [
    { label: "Calories", value: `${recipe.nutrition.calories} kcal`, icon: <Flame className="w-4 h-4 text-orange-500" />, color: "bg-orange-50 text-orange-800 border-orange-100" },
    { label: "Protein", value: `${recipe.nutrition.protein}g`, icon: <Beef className="w-4 h-4 text-blue-500" />, color: "bg-blue-50 text-blue-800 border-blue-100" },
    { label: "Carbs", value: `${recipe.nutrition.carbs}g`, icon: <Brain className="w-4 h-4 text-purple-500" />, color: "bg-purple-50 text-purple-800 border-purple-100" },
    { label: "Fats", value: `${recipe.nutrition.fats}g`, icon: <Salad className="w-4 h-4 text-yellow-500" />, color: "bg-yellow-50 text-yellow-800 border-yellow-100" }
  ];

  return (
    <div
      id="recipe-detail-backdrop"
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        id="recipe-detail-dialog"
        className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden border border-gray-100 animate-scale-up max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner Section */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden shrink-0">
          <img
            src={recipe.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80"}
            alt={recipe.name}
            className="w-full h-full object-cover select-none"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent"></div>

          {/* Action Header on Banner */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <span className="bg-emerald-600 text-white font-mono text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-lg border border-emerald-500/20 uppercase tracking-wider backdrop-blur-md">
              {recipe.cuisineType} • {recipe.matchPercentage}% Match
            </span>

            <div className="flex gap-2">
              <button
                id="modal-fav-btn"
                onClick={() => onToggleFavorite(recipe.id)}
                className={`p-2.5 rounded-full shadow-lg border transition-all cursor-pointer backdrop-blur-md ${
                  isFavorite
                    ? "bg-red-500 text-white border-red-500 hover:bg-red-600"
                    : "bg-black/50 text-white border-white/10 hover:bg-black/70"
                }`}
              >
                ❤️
              </button>
              <button
                id="modal-close-btn"
                onClick={onClose}
                className="p-2.5 rounded-full bg-black/50 text-white border border-white/10 hover:bg-black/70 shadow-lg transition-all cursor-pointer backdrop-blur-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="absolute bottom-6 left-6 right-6">
            <h2 className="font-display text-2xl sm:text-3.5xl font-extrabold text-white tracking-tight text-glow">
              {recipe.name}
            </h2>
            <p className="text-gray-200 text-xs sm:text-sm mt-1 max-w-2xl font-sans font-medium line-clamp-2">
              {recipe.description}
            </p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 md:p-8 space-y-8 flex-1">
          {/* Quick Cooking Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 flex items-center gap-3">
              <Clock className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-[10px] text-gray-400 font-mono font-semibold uppercase">Prep Time</p>
                <p className="text-sm font-bold text-gray-800 font-sans">{recipe.prepTime} Mins</p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 flex items-center gap-3">
              <Clock className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-[10px] text-gray-400 font-mono font-semibold uppercase">Cook Time</p>
                <p className="text-sm font-bold text-gray-800 font-sans">{recipe.cookTime} Mins</p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 flex items-center gap-3">
              <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-[10px] text-gray-400 font-mono font-semibold uppercase">Servings</p>
                <p className="text-sm font-bold text-gray-800 font-sans">{recipe.servings} Portions</p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-[10px] text-gray-400 font-mono font-semibold uppercase">Difficulty</p>
                <p className="text-sm font-bold text-gray-800 font-sans">{recipe.difficulty}</p>
              </div>
            </div>
          </div>

          {/* Core Content Split Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {/* Ingredients Check-off Panel */}
            <div className="md:col-span-2 space-y-5">
              <h3 className="font-display text-lg font-bold text-gray-900 tracking-tight border-b pb-2 flex items-center gap-2">
                🍳 Ingredients Required
              </h3>
              <div className="space-y-2.5">
                {recipe.ingredients.map((ing, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-sans transition-all ${
                      ing.isMissing
                        ? "bg-red-50/50 border-red-100 text-gray-700"
                        : "bg-emerald-50/50 border-emerald-100 text-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border font-sans text-xs ${
                          ing.isMissing
                            ? "bg-red-100 border-red-200 text-red-600"
                            : "bg-emerald-100 border-emerald-200 text-emerald-700"
                        }`}
                      >
                        {ing.isMissing ? "✕" : "✓"}
                      </div>
                      <span className={ing.isMissing ? "line-through text-gray-400" : "font-medium"}>
                        {ing.name}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] font-semibold opacity-70 bg-white/70 px-2 py-0.5 rounded-md border border-black/5">
                      {ing.amount}
                    </span>
                  </div>
                ))}
              </div>

              {/* Substitution Recommendations Panel */}
              {recipe.substitutionSuggestions && recipe.substitutionSuggestions.length > 0 && (
                <div className="bg-orange-50/30 border border-orange-100 rounded-2xl p-4 space-y-3.5 mt-4">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-orange-900 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-orange-600" /> substitution cheats
                  </h4>
                  <div className="space-y-3">
                    {recipe.substitutionSuggestions.map((sub, sidx) => (
                      <div key={sidx} className="bg-white/80 border border-orange-100/50 rounded-xl p-3 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-800 font-sans">Instead of {sub.missingIngredient}:</span>
                        </div>
                        <p className="text-emerald-700 font-semibold font-sans">💡 Use: {sub.suggestion}</p>
                        <p className="text-[11px] text-gray-500 font-medium leading-relaxed font-sans">{sub.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step-by-Step Instructions Panel */}
            <div className="md:col-span-3 space-y-5">
              <h3 className="font-display text-lg font-bold text-gray-900 tracking-tight border-b pb-2 flex items-center gap-2">
                📋 Cooking Directions
              </h3>
              <div className="space-y-4">
                {recipe.instructions.map((step, idx) => {
                  const isChecked = checkedSteps[idx];
                  return (
                    <div
                      key={idx}
                      className={`flex gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                        isChecked
                          ? "bg-gray-50 border-gray-200 opacity-60"
                          : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
                      }`}
                      onClick={() => toggleStep(idx)}
                    >
                      <div className="shrink-0">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold border transition-all ${
                            isChecked
                              ? "bg-gray-300 border-gray-300 text-white"
                              : "bg-emerald-100 border-emerald-200 text-emerald-800"
                          }`}
                        >
                          {isChecked ? "✓" : idx + 1}
                        </div>
                      </div>
                      <p className={`text-xs font-sans font-medium leading-relaxed flex-1 ${isChecked ? "line-through text-gray-400" : "text-gray-700"}`}>
                        {step}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Nutritional Dashboard Stats Panel */}
          <div className="bg-gray-50/50 border border-gray-100 rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-bold font-mono tracking-wider text-gray-700 uppercase">
              🧪 Approximate Nutritional Breakdown (Per Portion)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {nutritionFields.map((field) => (
                <div
                  key={field.label}
                  className={`border rounded-2xl p-4 flex items-center justify-between ${field.color}`}
                >
                  <div>
                    <p className="text-[10px] uppercase font-mono font-bold tracking-wider opacity-60">
                      {field.label}
                    </p>
                    <p className="text-xl font-display font-extrabold tracking-tight mt-1">
                      {field.value}
                    </p>
                  </div>
                  <div className="p-2.5 bg-white/80 rounded-xl border border-black/5 shadow-inner">
                    {field.icon}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
