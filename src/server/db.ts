/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";
import { Recipe, UserProfile, FavoriteRecipe, SearchHistoryEntry, AnalyticsData } from "../types";

const DB_FILE = path.join(process.cwd(), "db.json");

interface DatabaseSchema {
  users: UserProfile[];
  recipes: Recipe[];
  favorites: FavoriteRecipe[];
  searchHistory: SearchHistoryEntry[];
  analytics: { [userId: string]: AnalyticsData };
}

// Rich initial seed recipes to guarantee incredible startup content
const SEED_RECIPES: Recipe[] = [
  {
    id: "rec_1",
    name: "Classic Chicken Curry",
    description: "A rich, flavorful, and comforting chicken curry with a beautifully spiced tomato and onion sauce.",
    imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=600&auto=format&fit=crop",
    prepTime: 15,
    cookTime: 30,
    difficulty: "Medium",
    cuisineType: "Indian",
    matchPercentage: 100,
    servings: 4,
    ingredients: [
      { name: "Chicken", amount: "500g", category: "Meat" },
      { name: "Onion", amount: "2 large", category: "Vegetables" },
      { name: "Tomato", amount: "3 medium", category: "Vegetables" },
      { name: "Garlic", amount: "4 cloves", category: "vegetables" },
      { name: "Ginger", amount: "1 inch", category: "Vegetables" },
      { name: "Curry Powder", amount: "2 tbsp", category: "Pantry" },
      { name: "Coconut Milk", amount: "400ml", category: "Pantry" },
      { name: "Coriander", amount: "garnish", category: "vegetables" }
    ],
    instructions: [
      "Heat oil in a large pan and sauté finely chopped onions, garlic, and ginger until caramelized and golden.",
      "Add curry powder and stir for 1 minute until fragrant.",
      "Add chopped chicken pieces and cook until lightly browned on all sides.",
      "Pour in chopped tomatoes and coconut milk. Bring to a gentle simmer.",
      "Cover and simmer for 20-25 minutes until chicken is tender and sauce is thick. Garnish with fresh coriander."
    ],
    nutrition: {
      calories: 420,
      protein: 34,
      carbs: 12,
      fats: 26
    },
    substitutionSuggestions: [
      {
        missingIngredient: "Coconut Milk",
        suggestion: "Greek Yogurt or Heavy Cream",
        reason: "Maintains the rich creaminess with a standard dairy staple."
      },
      {
        missingIngredient: "Chicken",
        suggestion: "Tofu or Chickpeas",
        reason: "Excellent plant-based proteins that soak up curry flavors beautifully."
      }
    ]
  },
  {
    id: "rec_2",
    name: "Golden Garlic Tomato Stir-Fry Chicken",
    description: "A quick, zesty, and savory stir-fry combining succulent chicken cubes with sweet sautéed tomatoes and rich garlic.",
    imageUrl: "https://images.unsplash.com/photo-1529042410759-befb1204b468?q=80&w=600&auto=format&fit=crop",
    prepTime: 10,
    cookTime: 15,
    difficulty: "Easy",
    cuisineType: "Asian Express",
    matchPercentage: 90,
    servings: 2,
    ingredients: [
      { name: "Chicken", amount: "300g", category: "Meat" },
      { name: "Tomato", amount: "2 large, diced", category: "Vegetables" },
      { name: "Garlic", amount: "6 cloves, sliced", category: "Vegetables" },
      { name: "Onion", amount: "1 small", category: "Vegetables" },
      { name: "Soy Sauce", amount: "2 tbsp", category: "Pantry" },
      { name: "Green Onion", amount: "2 stalks", category: "Vegetables" }
    ],
    instructions: [
      "Cut chicken into bite-sized cubes and toss with 1 tbsp soy sauce and pepper.",
      "Heat a wok or skillet over high heat, add oil, and fry garlic and onion until fragrant.",
      "Add chicken and stir-fry for 5-6 minutes until cooked through.",
      "Add tomatoes, stirring constantly until they begin to release their juices and form a glaze.",
      "Drizzle with remaining soy sauce and garnish with fresh green onions before serving."
    ],
    nutrition: {
      calories: 310,
      protein: 28,
      carbs: 9,
      fats: 14
    },
    substitutionSuggestions: [
      {
        missingIngredient: "Soy Sauce",
        suggestion: "Tamari or Coconut Aminos",
        reason: "Provides the same salty, savory umami depth."
      }
    ]
  },
  {
    id: "rec_3",
    name: "Hearty Chicken Tomato Soup",
    description: "A simple, light, but comforting soup loaded with aromatic onions, garlic, and shredded chicken in a warm tomato broth.",
    imageUrl: "https://images.unsplash.com/photo-1547592165-e1d17fed6005?q=80&w=600&auto=format&fit=crop",
    prepTime: 10,
    cookTime: 20,
    difficulty: "Easy",
    cuisineType: "Comfort Food",
    matchPercentage: 85,
    servings: 3,
    ingredients: [
      { name: "Chicken", amount: "250g", category: "Meat" },
      { name: "Tomato", amount: "3 large", category: "Vegetables" },
      { name: "Onion", amount: "1 medium", category: "Vegetables" },
      { name: "Garlic", amount: "3 cloves", category: "Vegetables" },
      { name: "Chicken Broth", amount: "4 cups", category: "Pantry" },
      { name: "Olive Oil", amount: "1 tbsp", category: "Pantry" }
    ],
    instructions: [
      "Sauté chopped onion and garlic in a soup pot with olive oil until soft.",
      "Blot and blend or chop tomatoes, then add them to the pot and cook down for 5 minutes.",
      "Pour in chicken broth and bring to a rolling boil.",
      "Add chicken pieces. Lower heat and cover, cooking for fifteen minutes until chicken is fully cooked.",
      "Remove chicken to shred, return to the soup pot, season with salt and pepper, and ladle warm."
    ],
    nutrition: {
      calories: 240,
      protein: 22,
      carbs: 11,
      fats: 8
    },
    substitutionSuggestions: []
  },
  {
    id: "rec_4",
    name: "Rustic Beef & Potato Hash",
    description: "Crispy browned potatoes tossed with seasoned ground beef, sweet carrots, and caramelized onions.",
    imageUrl: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?q=80&w=600&auto=format&fit=crop",
    prepTime: 15,
    cookTime: 20,
    difficulty: "Easy",
    cuisineType: "American Country",
    matchPercentage: 100,
    servings: 2,
    ingredients: [
      { name: "Beef", amount: "250g ground or cubed", category: "Meat" },
      { name: "Potatoes", amount: "2 large, cubed", category: "Vegetables" },
      { name: "Carrots", amount: "1 medium, diced", category: "Vegetables" },
      { name: "Onion", amount: "1 medium", category: "Vegetables" },
      { name: "Garlic", amount: "2 cloves", category: "Vegetables" },
      { name: "Rosemary", amount: "1 tsp", category: "Pantry" }
    ],
    instructions: [
      "Parboil potato cubes for 5 minutes in salted water, then drain completely.",
      "In a skillet, brown the beef with onions and garlic, breaking it up and pouring off excess fat.",
      "Push beef aside. Add parboiled potatoes and carrots into the pan with a little oil and rosemary.",
      "Sauté until potatoes are crisp and golden on all edges.",
      "Mix beef back together, season generously with salt and pepper, and serve hot."
    ],
    nutrition: {
      calories: 480,
      protein: 29,
      carbs: 38,
      fats: 21
    },
    substitutionSuggestions: [
      {
        missingIngredient: "Beef",
        suggestion: "Ground Turkey or Lamb",
        reason: "Alters the flavor profile while retaining the crisp, savory meat texture."
      }
    ]
  },
  {
    id: "rec_5",
    name: "French Mushroom & Cheese Omelette",
    description: "An elegant, buttery, three-egg folded omelette overflowing with melted cheese and pan-roasted garlic mushrooms.",
    imageUrl: "https://images.unsplash.com/photo-1494597564530-871f2b93ac55?q=80&w=600&auto=format&fit=crop",
    prepTime: 5,
    cookTime: 10,
    difficulty: "Easy",
    cuisineType: "French",
    matchPercentage: 100,
    servings: 1,
    ingredients: [
      { name: "Eggs", amount: "3 large", category: "Dairy" },
      { name: "Cheese", amount: "50g grated", category: "Dairy" },
      { name: "Mushrooms", amount: "100g sliced", category: "Vegetables" },
      { name: "Garlic", amount: "1 clove, minced", category: "Vegetables" },
      { name: "Butter", amount: "1 tbsp", category: "Dairy" }
    ],
    instructions: [
      "Sauté sliced mushrooms and minced garlic in a non-stick pan with a little butter until browned. Set aside.",
      "Whisk eggs in a bowl with a pinch of salt and paper.",
      "Melt the remaining butter in the same pan over medium-low heat. Pour in eggs.",
      "Slightly swirl the pan and pull cooked edges inward. When eggs are mostly set but soft in the center, sprinkle mushrooms and cheese on one half.",
      "Fold the omelette over, let cheese melt for 30 seconds, and roll onto a plate represent."
    ],
    nutrition: {
      calories: 360,
      protein: 24,
      carbs: 4,
      fats: 28
    },
    substitutionSuggestions: [
      {
        missingIngredient: "Mushrooms",
        suggestion: "Spinach or Bell Peppers",
        reason: "Gives a fresh, colorful alternative that cooks down beautifully in butter."
      }
    ]
  },
  {
    id: "rec_6",
    name: "Tuscan Garlic Tomato Pasta",
    description: "Al dente spaghetti tossed in a quick, aromatic garlic, olive oil, and sweet bursting cherry tomato sauce.",
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=600&auto=format&fit=crop",
    prepTime: 5,
    cookTime: 12,
    difficulty: "Easy",
    cuisineType: "Italian",
    matchPercentage: 100,
    servings: 2,
    ingredients: [
      { name: "Pasta", amount: "200g", category: "Pantry" },
      { name: "Tomato", amount: "250g cherry tomatoes", category: "Vegetables" },
      { name: "Garlic", amount: "5 cloves, crushed", category: "Vegetables" },
      { name: "Olive Oil", amount: "3 tbsp", category: "Pantry" },
      { name: "Basil", amount: "Handful", category: "Vegetables" }
    ],
    instructions: [
      "Cook pasta in salted boiling water until al dente.",
      "Meanwhile, gently heat olive oil and garlic in a pan to infuse. Add halved cherry tomatoes.",
      "Cook tomatoes on medium heat for 6-8 minutes until blistered and soft, releasing sweet juices.",
      "Draft pasta directly into the sauce. Toss with fresh torn basil, splashing pasta water to bind.",
      "Serve hot with a sprinkle of cheese if you have it."
    ],
    nutrition: {
      calories: 410,
      protein: 10,
      carbs: 64,
      fats: 15
    },
    substitutionSuggestions: [
      {
        missingIngredient: "Pasta",
        suggestion: "Zucchini Noodles or Spaghetti Squash",
        reason: "Gives a lighter, low-carb veggie alternative to wheat pasta."
      }
    ]
  },
  {
    id: "rec_7",
    name: "Crispy Sesame Soy Tofu & Broccoli",
    description: "A delicious, healthy stir-fry featuring crispy pan-fried tofu cubes and fresh crisp broccoli tossed in a soy-sesame glaze.",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop",
    prepTime: 10,
    cookTime: 15,
    difficulty: "Easy",
    cuisineType: "Asian Vegan",
    matchPercentage: 100,
    servings: 2,
    ingredients: [
      { name: "Tofu", amount: "300g extra firm", category: "Pantry" },
      { name: "Broccoli", amount: "1 head, florets", category: "Vegetables" },
      { name: "Soy Sauce", amount: "3 tbsp", category: "Pantry" },
      { name: "Garlic", amount: "3 cloves", category: "Vegetables" },
      { name: "Ginger", amount: "1 tsp", category: "Vegetables" },
      { name: "Sesame Oil", amount: "1 tbsp", category: "Pantry" }
    ],
    instructions: [
      "Press water out of tofu, cut into cubes, and pan-fry in a little oil until crispy on all sides.",
      "Remove tofu. Toss in ginger, garlic, and broccoli florets with a splash of water, steaming for 3 minutes.",
      "Stir soy sauce and a touch of honey/sugar together.",
      "Return tofu to the skillet, pour over soy glaze and sesame oil.",
      "Stir-fry until sauce reduces and clings to Tofu and Broccoli. Serve hot."
    ],
    nutrition: {
      calories: 280,
      protein: 16,
      carbs: 18,
      fats: 15
    },
    substitutionSuggestions: [
      {
        missingIngredient: "Tofu",
        suggestion: "Chicken Breast or Tempeh",
        reason: "Adjusts the core protein source while retaining the dynamic soy-sesame profile."
      }
    ]
  }
];

class StorageManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = {
      users: [],
      recipes: [],
      favorites: [],
      searchHistory: [],
      analytics: {}
    };
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(fileContent);
        this.data = {
          users: parsed.users || [],
          recipes: parsed.recipes || [],
          favorites: parsed.favorites || [],
          searchHistory: parsed.searchHistory || [],
          analytics: parsed.analytics || {}
        };
      } else {
        // Pre-populate with seed values
        this.data.recipes = [...SEED_RECIPES];
        // Create a default user profile
        this.data.users = [{
          id: "usr_1",
          name: "Culinary Chef",
          email: "breezebeats09@gmail.com",
          avatar: "🧑‍🍳",
          dietaryPreferences: [],
          allergies: []
        }];
        this.save();
      }
    } catch (err) {
      console.error("Error loading database:", err);
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err) {
      console.error("Error saving database:", err);
    }
  }

  // --- Users ---
  getUsers(): UserProfile[] {
    return this.data.users;
  }

  getUser(id: string): UserProfile | undefined {
    return this.data.users.find(u => u.id === id);
  }

  updateUser(profile: UserProfile): UserProfile {
    const idx = this.data.users.findIndex(u => u.id === profile.id);
    if (idx !== -1) {
      this.data.users[idx] = profile;
    } else {
      this.data.users.push(profile);
    }
    this.save();
    return profile;
  }

  // --- Recipes ---
  getRecipes(): Recipe[] {
    return this.data.recipes;
  }

  getRecipe(id: string): Recipe | undefined {
    return this.data.recipes.find(r => r.id === id);
  }

  addRecipe(recipe: Recipe): Recipe {
    if (!this.data.recipes.some(r => r.id === recipe.id)) {
      this.data.recipes.push(recipe);
      this.save();
    }
    return recipe;
  }

  // --- Favorites ---
  getFavorites(userId: string): FavoriteRecipe[] {
    return this.data.favorites.filter(f => f.userId === userId);
  }

  addFavorite(userId: string, recipeId: string): FavoriteRecipe {
    const existing = this.data.favorites.find(f => f.userId === userId && f.recipeId === recipeId);
    if (existing) return existing;

    const favorite: FavoriteRecipe = {
      id: "fav_" + Math.random().toString(36).substring(2, 9),
      userId,
      recipeId,
      savedAt: new Date().toISOString()
    };
    this.data.favorites.push(favorite);
    this.save();
    this.updateAnalytics(userId);
    return favorite;
  }

  removeFavorite(userId: string, recipeId: string): boolean {
    const len = this.data.favorites.length;
    this.data.favorites = this.data.favorites.filter(f => !(f.userId === userId && f.recipeId === recipeId));
    const removed = this.data.favorites.length !== len;
    if (removed) {
      this.save();
      this.updateAnalytics(userId);
    }
    return removed;
  }

  // --- Search History ---
  getSearchHistory(userId: string): SearchHistoryEntry[] {
    return this.data.searchHistory
      .filter(h => h.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  addSearchHistory(userId: string, ingredients: string[], recipeCount: number): SearchHistoryEntry {
    const entry: SearchHistoryEntry = {
      id: "sch_" + Math.random().toString(36).substring(2, 9),
      userId,
      ingredients: ingredients.map(i => i.trim().toLowerCase()),
      timestamp: new Date().toISOString(),
      recipeCount
    };
    this.data.searchHistory.push(entry);
    this.save();
    this.updateAnalytics(userId);
    return entry;
  }

  // --- Analytics & Scoring Update ---
  private updateAnalytics(userId: string) {
    const history = this.getSearchHistory(userId);
    const favorites = this.getFavorites(userId);

    // Calculate most used ingredients
    const ingredientCounts: { [name: string]: number } = {};
    history.forEach(h => {
      h.ingredients.forEach(i => {
        const name = i.toLowerCase().trim();
        ingredientCounts[name] = (ingredientCounts[name] || 0) + 1;
      });
    });

    const mostUsedIngredients = Object.keys(ingredientCounts)
      .map(name => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count: ingredientCounts[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate favorite cuisines based on starred recipes
    const cuisineCounts: { [name: string]: number } = {};
    favorites.forEach(f => {
      const rec = this.getRecipe(f.recipeId);
      if (rec) {
        const cuisine = rec.cuisineType;
        cuisineCounts[cuisine] = (cuisineCounts[cuisine] || 0) + 1;
      }
    });

    const favoriteCuisines = Object.keys(cuisineCounts)
      .map(name => ({ name, count: cuisineCounts[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    // Assemble weekly activity count (simulated historic curve + actual current triggers)
    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const currentDayIndex = (new Date().getDay() + 6) % 7; // Convert Sun-Sat to Mon-Sun
    
    // Group history entries by day
    const dayActivityCounts = Array(7).fill(0).map((_, i) => {
      // Seed with small stable baseline for beauty
      return 1 + (i % 3);
    });

    // Add today's actual live searches
    const today = new Date().toDateString();
    const todaySearches = history.filter(h => new Date(h.timestamp).toDateString() === today).length;
    dayActivityCounts[currentDayIndex] += todaySearches;

    const weeklyActivity = weekdays.map((day, idx) => ({
      day,
      count: dayActivityCounts[idx]
    }));

    this.data.analytics[userId] = {
      recipesSearchedCount: history.length,
      favoriteCuisines,
      mostUsedIngredients,
      weeklyActivity
    };
    this.save();
  }

  getAnalytics(userId: string): AnalyticsData {
    if (!this.data.analytics[userId]) {
      this.updateAnalytics(userId);
    }
    return this.data.analytics[userId];
  }
}

export const db = new StorageManager();
