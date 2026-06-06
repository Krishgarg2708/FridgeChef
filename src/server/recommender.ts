/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Recipe, UserProfile } from "../types";

// Standard ingredient substitution suggestions list for fast algorithmic fallbacks
const COMMON_SUBSTITUTIONS: { [ingredient: string]: { substitute: string; reason: string } } = {
  "chicken": { substitute: "tofu, turkey, or chickpeas", reason: "Excellent alternative proteins that soak up marinades." },
  "beef": { substitute: "mushrooms, ground turkey, or lentils", reason: "Gives a rich, earthy flavor and textured chew." },
  "pork": { substitute: "chicken thighs or firm tofu", reason: "Keeps the juicy, savory texture in quick stir-fries." },
  "milk": { substitute: "almond milk, oat milk, or soy milk", reason: "Perfect dairy-free cooking liquids." },
  "butter": { substitute: "olive oil, coconut oil, or margarine", reason: "Great fats for searing and baking." },
  "cheese": { substitute: "nutritional yeast or vegan cheese", reason: "Replicates cheesy, nutty richness." },
  "onion": { substitute: "shallots, leeks, or green onions", reason: "Provides a sweet, aromatic garlic-onion base flavor." },
  "garlic": { substitute: "shallots or garlic powder", reason: "Keeps the sharp scent and depth in cooking." },
  "tomato": { substitute: "tomato paste, ketchup, or red bell peppers", reason: "Retains zesty acidity and crimson color." },
  "pasta": { substitute: "zucchini noodles, rice, or quinoa", reason: "Lighter, gluten-free starches." },
  "rice": { substitute: "cauliflower rice or quinoa", reason: "Healthy, fiber-rich alternatives." },
  "soy sauce": { substitute: "tamari, coconut aminos, or salt broth", reason: "Stays deeply savory and salty." },
  "spinach": { substitute: "kale or swiss chard", reason: "Sturdy greens that wilt beautifully in pans." },
  "broccoli": { substitute: "cauliflower or brussels sprouts", reason: "Maintains crunchy, roasted brassica textures." },
  "egg": { substitute: "chia seed egg, flax seed egg, or applesauce", reason: "Binds mixtures smoothly without dairy." }
};

// Simple Jaro-Winkler or Levenshtein distance for spelling correction and similarity scoring
function getLevenshteinDistance(s1: string, s2: string): number {
  const t1 = s1.toLowerCase().trim();
  const t2 = s2.toLowerCase().trim();
  if (t1 === t2) return 0;
  if (t1.length === 0) return t2.length;
  if (t2.length === 0) return t1.length;

  const matrix = Array(t2.length + 1).fill(null).map(() => Array(t1.length + 1).fill(0));

  for (let i = 0; i <= t1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= t2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= t2.length; j++) {
    for (let i = 1; i <= t1.length; i++) {
      const indicator = t1[i - 1] === t2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  return matrix[t2.length][t1.length];
}

function getWordSimilarity(w1: string, w2: string): number {
  const clean1 = w1.toLowerCase().trim().replace(/s$/, ""); // very primitive plural removal
  const clean2 = w2.toLowerCase().trim().replace(/s$/, "");
  
  if (clean1.includes(clean2) || clean2.includes(clean1)) return 1.0;
  
  const distance = getLevenshteinDistance(clean1, clean2);
  const maxLength = Math.max(clean1.length, clean2.length);
  if (maxLength === 0) return 1.0;
  return 1.0 - distance / maxLength;
}

// Check if two ingredients match (either directly, via spelling similarity, or via known substitution lists)
export interface MatchDetail {
  matched: boolean;
  isSubstitution: boolean;
  substituteName?: string;
  substituteReason?: string;
  similarityScore: number;
}

export function checkIngredientMatch(userIng: string, recipeIng: string): MatchDetail {
  const uPart = userIng.toLowerCase().trim();
  const rPart = recipeIng.toLowerCase().trim();

  // 1. Direct or partial word matches
  const sim = getWordSimilarity(uPart, rPart);
  if (sim >= 0.8) {
    return { matched: true, isSubstitution: false, similarityScore: sim };
  }

  // 2. Check standard substitutions lists
  for (const [key, val] of Object.entries(COMMON_SUBSTITUTIONS)) {
    const isUserKey = getWordSimilarity(uPart, key) >= 0.85;
    const isRecipeVal = getWordSimilarity(rPart, key) >= 0.85;

    if (isUserKey && isRecipeVal) {
      return { matched: true, isSubstitution: false, similarityScore: 0.9 };
    }

    if (isRecipeVal) {
      // Recipe wants the key, user doesn't have it but what if the user has the substitute?
      const subWords = val.substitute.split(/,|\bor\b/);
      for (const sw of subWords) {
        if (getWordSimilarity(uPart, sw) >= 0.8) {
          return {
            matched: true,
            isSubstitution: true,
            substituteName: uPart.charAt(0).toUpperCase() + uPart.slice(1),
            substituteReason: val.reason,
            similarityScore: 0.75
          };
        }
      }
    }
  }

  return { matched: false, isSubstitution: false, similarityScore: 0 };
}

// Algorithmic ranker of seed recipes based on a list of input ingredients
export function matchSeedRecipes(
  userIngredients: string[],
  recipes: Recipe[],
  userProfile?: UserProfile
): Recipe[] {
  if (userIngredients.length === 0) return [];

  // Parse each recipe and calculate match scores
  const scoredRecipes = recipes.map(recipe => {
    let matchedCount = 0;
    let substitutionCount = 0;
    const matchedIngredientsState = recipe.ingredients.map(ri => {
      // Find the best match in user input
      let bestMatch: MatchDetail = { matched: false, isSubstitution: false, similarityScore: 0 };
      
      for (const ui of userIngredients) {
        const match = checkIngredientMatch(ui, ri.name);
        if (match.matched && match.similarityScore > bestMatch.similarityScore) {
          bestMatch = match;
        }
      }

      if (bestMatch.matched) {
        matchedCount++;
        if (bestMatch.isSubstitution) {
          substitutionCount++;
          return {
            ...ri,
            isMissing: false,
            isSubstitution: true,
            substituteFor: ri.name,
            name: `${bestMatch.substituteName} (for ${ri.name})`
          };
        } else {
          return { ...ri, isMissing: false, isSubstitution: false };
        }
      } else {
        return { ...ri, isMissing: true };
      }
    });

    const totalRequiredIngredients = recipe.ingredients.length;
    
    // Core formula: 
    // exact matches count as 1.0, substitutions as 0.75, missing count as 0.
    const scoreSum = matchedIngredientsState.reduce((sum, item) => {
      if (item.isMissing) return sum;
      return sum + (item.isSubstitution ? 0.75 : 1.0);
    }, 0);

    let matchPercentage = Math.round((scoreSum / totalRequiredIngredients) * 100);
    if (matchPercentage > 100) matchPercentage = 100;

    // Apply personal weights to dynamically prioritize preferred cuisines or allergen warnings
    let preferenceBonus = 0;
    if (userProfile) {
      // Check dietary preference (e.g. Vegetarian, Gluten-Free)
      const matchesPreferences = userProfile.dietaryPreferences.every(pref => {
        const p = pref.toLowerCase();
        if (p === "vegetarian") {
          // No chicken, beef, pork
          return !recipe.ingredients.some(ri => {
            const n = ri.name.toLowerCase();
            return n.includes("chicken") || n.includes("beef") || n.includes("pork") || n.includes("meat");
          });
        }
        if (p === "vegan") {
          return !recipe.ingredients.some(ri => {
            const n = ri.name.toLowerCase();
            return n.includes("chicken") || n.includes("beef") || n.includes("pork") || n.includes("meat") || n.includes("egg") || n.includes("milk") || n.includes("butter") || n.includes("cheese");
          });
        }
        if (p === "gluten-free") {
          return !recipe.ingredients.some(ri => ri.name.toLowerCase().includes("pasta") || ri.name.toLowerCase().includes("bread") || ri.name.toLowerCase().includes("all-purpose flour"));
        }
        return true;
      });

      if (!matchesPreferences) {
        matchPercentage = Math.max(0, matchPercentage - 40); // heavily penalize mismatching preferences
      }

      // Boost favorite user cuisines
      const isFavCuisine = userProfile.dietaryPreferences.some(pref => 
        recipe.cuisineType.toLowerCase().includes(pref.toLowerCase())
      );
      if (isFavCuisine) {
        preferenceBonus += 5;
      }
    }

    // Add automatic substitution suggestions based on calculations
    const generatedSubstitutionSuggestions = matchedIngredientsState
      .filter(item => item.isMissing)
      .map(item => {
        const sub = COMMON_SUBSTITUTIONS[item.name.toLowerCase()];
        if (sub) {
          return {
            missingIngredient: item.name,
            suggestion: sub.substitute,
            reason: sub.reason
          };
        }
        return null;
      })
      .filter((item): item is { missingIngredient: string; suggestion: string; reason: string } => item !== null);

    return {
      ...recipe,
      matchPercentage: Math.max(0, matchPercentage + preferenceBonus),
      ingredients: matchedIngredientsState,
      substitutionSuggestions: [
        ...(recipe.substitutionSuggestions || []),
        ...generatedSubstitutionSuggestions
      ]
    };
  });

  // Filter out completely irrelevant recipes (score < 15%) and sort in descending order
  return scoredRecipes
    .filter(r => r.matchPercentage >= 20)
    .sort((a, b) => b.matchPercentage - a.matchPercentage);
}
