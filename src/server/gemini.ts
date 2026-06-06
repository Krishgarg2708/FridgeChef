/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { Recipe, UserProfile, SubstitutionSuggestion } from "../types";

let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please configure it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Generates highly tailored, authentic, custom recipes from raw kitchen ingredients using Gemini
export async function generateRecipesFromAI(
  ingredients: string[],
  userProfile?: UserProfile
): Promise<Recipe[]> {
  try {
    const ai = getAI();
    const joinedIngredients = ingredients.join(", ");
    
    let dietaryPrompt = "";
    if (userProfile) {
      if (userProfile.dietaryPreferences.length > 0) {
        dietaryPrompt += ` The user has strict dietary preferences: ${userProfile.dietaryPreferences.join(", ")}.`;
      }
      if (userProfile.allergies.length > 0) {
        dietaryPrompt += ` VERY IMPORTANT: Do not include any ingredients that trigger these allergies: ${userProfile.allergies.join(", ")}.`;
      }
    }

    const prompt = `You are a professional chef. Formulate 3 distinct, creative, and delicious recipes that can be made using some or all of these available ingredients: ${joinedIngredients}.${dietaryPrompt}
    For each recipe:
    - Rate how well the available ingredients match the recipe needs (matchPercentage 50-100%).
    - Map each ingredient and specify if it is missing (isMissing: true/false. If they included it, isMissing should be false).
    - Suggest alternative ingredients lists (substitutionSuggestions) if they have missing items.
    - Keep recipes realistic, appetizing, and complete with cooking times, nutrition estimates, and clear instructions.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are FridgeChef's core culinary recommendation engine. You return precise, structurally conforming JSON representations of gourmet cooking recipes based strictly on user ingredient lists, dietary rules, and allergy overrides.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of recommended recipes",
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "A unique random string ID for this recipe starting with 'rec_ai_'" },
              name: { type: Type.STRING, description: "Elegant, appetizing name of the recipe" },
              description: { type: Type.STRING, description: "A highly appetizing, mouth-watering description explaining why this is a great dish." },
              imageUrl: { type: Type.STRING, description: "Use a high-quality free Unsplash food food photo url matching this recipe or a general high-quality fallback image." },
              prepTime: { type: Type.INTEGER, description: "Preparation time in minutes" },
              cookTime: { type: Type.INTEGER, description: "Cooking time in minutes" },
              difficulty: { type: Type.STRING, description: "Easy, Medium or Hard" },
              cuisineType: { type: Type.STRING, description: "Region or subcategory of cuisine (e.g. Italian, Mexican, Fusion)" },
              matchPercentage: { type: Type.INTEGER, description: "Calculate match score 50 to 100 based on available ingredients" },
              servings: { type: Type.INTEGER, description: "Default portion size or serving count" },
              ingredients: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Name of the ingredient" },
                    amount: { type: Type.STRING, description: "Quantity needed (e.g. 200g, 1 tbsp)" },
                    category: { type: Type.STRING, description: "Produce, Meat, Dairy, Bakery, Pantry etc." },
                    isMissing: { type: Type.BOOLEAN, description: "Whether this ingredient is not in the user's available ingredients list" },
                    isSubstitution: { type: Type.BOOLEAN, description: "Default false. If user provided a substitute, set to true." }
                  },
                  required: ["name", "amount", "isMissing"]
                }
              },
              instructions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Step-by-step cooking steps in clear culinary style."
              },
              nutrition: {
                type: Type.OBJECT,
                properties: {
                  calories: { type: Type.INTEGER },
                  protein: { type: Type.INTEGER },
                  carbs: { type: Type.INTEGER },
                  fats: { type: Type.INTEGER }
                },
                required: ["calories", "protein", "carbs", "fats"]
              },
              substitutionSuggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    missingIngredient: { type: Type.STRING },
                    suggestion: { type: Type.STRING, description: "Immediate replacement recommendation" },
                    reason: { type: Type.STRING, description: "Culinary reason for this choice" }
                  },
                  required: ["missingIngredient", "suggestion", "reason"]
                }
              }
            },
            required: [
              "id",
              "name",
              "description",
              "imageUrl",
              "prepTime",
              "cookTime",
              "difficulty",
              "cuisineType",
              "matchPercentage",
              "servings",
              "ingredients",
              "instructions",
              "nutrition"
            ]
          }
        }
      }
    });

    const parsedRecipes: Recipe[] = JSON.parse(response.text || "[]");
    return parsedRecipes;
  } catch (err) {
    console.error("Gemini AI Recipe Generation Failed:", err);
    throw err;
  }
}

// Generates a fully structure, highly professional meal schedule and grocery list via AI
export async function generateAIMealPlanner(
  ingredients: string[],
  userProfile?: UserProfile
) {
  try {
    const ai = getAI();
    const joinedIngredients = ingredients.join(", ");
    
    let preferences = "";
    if (userProfile) {
      preferences = `Dietary rules: ${userProfile.dietaryPreferences.join(", ")}. Allergies (exclude completely): ${userProfile.allergies.join(", ")}.`;
    }

    const prompt = `Formulate a 3-day premium meal scheduler (Breakfast, Lunch, Dinner for each day) prioritizing these available ingredients: ${joinedIngredients}. ${preferences}
    List matching meals and compile a unified Shopping List of items to purchase for the rest of the schedule.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are FridgeChef's high-performance AI meal calendar planer.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            schedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING, description: "Day 1, Day 2, Day 3" },
                  breakfast: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      time: { type: Type.STRING, description: "Estimated time to cook (e.g. 15 mins)" },
                      ingredientsNeeded: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["name", "time"]
                  },
                  lunch: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      time: { type: Type.STRING },
                      ingredientsNeeded: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["name", "time"]
                  },
                  dinner: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      time: { type: Type.STRING },
                      ingredientsNeeded: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["name", "time"]
                  }
                },
                required: ["day", "breakfast", "lunch", "dinner"]
              }
            },
            shoppingList: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  category: { type: Type.STRING, description: "Produce, Dairy, Pantry, etc." }
                },
                required: ["name", "category"]
              },
              description: "Consolidated grocery list of ingredients to buy that the user doesn't already have."
            }
          },
          required: ["schedule", "shoppingList"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (err) {
    console.error("Gemini AI Meal Planner Failed:", err);
    throw err;
  }
}
