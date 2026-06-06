/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { db } from "./src/server/db";
import { matchSeedRecipes } from "./src/server/recommender";
import { generateRecipesFromAI, generateAIMealPlanner } from "./src/server/gemini";

// Load environment variables
dotenv.config();

const defaultsUserId = "usr_1";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON body parser
  app.use(express.json());

  // --- API Routes ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Get current user profile
  app.get("/api/user", (req, res) => {
    const user = db.getUser(defaultsUserId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  });

  // Update user profile
  app.put("/api/user", (req, res) => {
    const { name, dietaryPreferences, allergies } = req.body;
    const user = db.getUser(defaultsUserId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.name = name || user.name;
    user.dietaryPreferences = dietaryPreferences || user.dietaryPreferences;
    user.allergies = allergies || user.allergies;
    
    db.updateUser(user);
    res.json(user);
  });

  // Get Favorites
  app.get("/api/favorites", (req, res) => {
    const favs = db.getFavorites(defaultsUserId);
    const resolvedRecipes = favs
      .map(f => db.getRecipe(f.recipeId))
      .filter(Boolean);
    res.json(resolvedRecipes);
  });

  // Add Favorite
  app.post("/api/favorites", (req, res) => {
    const { recipeId } = req.body;
    if (!recipeId) {
      return res.status(400).json({ error: "recipeId is required" });
    }
    const recipe = db.getRecipe(recipeId);
    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    const fav = db.addFavorite(defaultsUserId, recipeId);
    res.json(fav);
  });

  // Remove Favorite
  app.delete("/api/favorites/:recipeId", (req, res) => {
    const { recipeId } = req.params;
    const removed = db.removeFavorite(defaultsUserId, recipeId);
    res.json({ success: removedState => removed });
  });

  // Search Recommendation Route (Algorithmic Local Matcher)
  app.post("/api/search", (req, res) => {
    const { ingredients } = req.body;
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: "A list of ingredients is required" });
    }

    const user = db.getUser(defaultsUserId);
    const allRecipes = db.getRecipes();

    // Match algorithmic recipes and compute dynamic similarity states
    const matched = matchSeedRecipes(ingredients, allRecipes, user);

    // Save search history
    const historyEntry = db.addSearchHistory(defaultsUserId, ingredients, matched.length);

    res.json({
      recipes: matched,
      historyEntry
    });
  });

  // AI-Powered Recommendation Route (Uses Gemini to formulate recipes dynamically)
  app.post("/api/search/ai", async (req, res) => {
    const { ingredients } = req.body;
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: "A list of ingredients is required" });
    }

    const user = db.getUser(defaultsUserId);

    try {
      // Formulate unique AI generated recipes
      const aiRecipes = await generateRecipesFromAI(ingredients, user);

      // Add generated recipes to the cached list in DB so users can view details or star them
      aiRecipes.forEach(recipe => {
        db.addRecipe(recipe);
      });

      // Save search history entry specifically for this AI search
      const historyEntry = db.addSearchHistory(defaultsUserId, ingredients, aiRecipes.length);

      res.json({
        recipes: aiRecipes,
        historyEntry
      });
    } catch (err: any) {
      console.error("Express AI Route Failed:", err);
      res.status(500).json({
        error: "AI Recipe Engine is momentarily busy. Please verify your GEMINI_API_KEY inside Settings > Secrets.",
        details: err.message
      });
    }
  });

  // Meal planning scheduler API
  app.post("/api/meal-plan", async (req, res) => {
    const { ingredients } = req.body;
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: "Ingredients list is required to formulate meal plan context." });
    }

    const user = db.getUser(defaultsUserId);

    try {
      const plan = await generateAIMealPlanner(ingredients, user);
      res.json(plan);
    } catch (err: any) {
      console.error("Express Meal Plan Route Failed:", err);
      res.status(500).json({
        error: "Could not generate AI meal scheduler. Please check your Gemini key.",
        details: err.message
      });
    }
  });

  // Get Search History records
  app.get("/api/history", (req, res) => {
    const history = db.getSearchHistory(defaultsUserId);
    res.json(history);
  });

  // Get Analytics and Dashboard charts data
  app.get("/api/analytics", (req, res) => {
    const analytics = db.getAnalytics(defaultsUserId);
    res.json(analytics);
  });

  // Serve static UI assets or set up live reload via Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FridgeChef backend running securely on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Server startup aborted:", err);
});
