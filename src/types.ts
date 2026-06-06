/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Ingredient {
  name: string;
  category?: string; // e.g. Vegetables, Meat, Dairy, Pantry
}

export interface RecipeIngredient {
  name: string;
  amount: string;
  category?: string;
  isMissing?: boolean;
  isSubstitution?: boolean;
  substituteFor?: string; // If this is a replacement, what does it replace?
}

export interface SubstitutionSuggestion {
  missingIngredient: string;
  suggestion: string;
  reason: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number; // in grams
  carbs: number; // in grams
  fats: number; // in grams
}

export interface Recipe {
  id: string;
  name: string;
  imageUrl: string;
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  difficulty: "Easy" | "Medium" | "Hard";
  cuisineType: string;
  matchPercentage: number; // Calculated dynamically base on available ingredients
  ingredients: RecipeIngredient[];
  instructions: string[];
  nutrition: NutritionInfo;
  servings: number;
  description: string;
  substitutionSuggestions?: SubstitutionSuggestion[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  dietaryPreferences: string[];
  allergies: string[];
}

export interface FavoriteRecipe {
  id: string;
  userId: string;
  recipeId: string;
  savedAt: string;
}

export interface SearchHistoryEntry {
  id: string;
  userId: string;
  ingredients: string[];
  timestamp: string;
  recipeCount: number;
}

export interface RecommendationHistoryEntry {
  id: string;
  userId: string;
  recipeId: string;
  timestamp: string;
  matchScore: number;
}

export interface CookingActivity {
  day: string; // e.g. "Mon", "Tue"
  count: number;
}

export interface AnalyticsData {
  recipesSearchedCount: number;
  favoriteCuisines: { name: string; count: number }[];
  mostUsedIngredients: { name: string; count: number }[];
  weeklyActivity: CookingActivity[];
}
