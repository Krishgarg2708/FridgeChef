import React, { useState, useEffect } from "react";
import {
  ChefHat,
  Plus,
  X,
  Search,
  Sparkles,
  Heart,
  History,
  User,
  BarChart3,
  Calendar,
  ArrowRight,
  TrendingUp,
  Clock,
  Loader2,
  Utensils,
  Maximize2,
  AlertCircle
} from "lucide-react";
import { Recipe, UserProfile, SearchHistoryEntry, AnalyticsData } from "./types";
import UserProfileSection from "./components/UserProfileSection";
import DashboardAnalytics from "./components/DashboardAnalytics";
import MealPlannerSection from "./components/MealPlannerSection";
import RecipeDetailModal from "./components/RecipeDetailModal";

const POPULAR_INGREDIENTS = [
  "Chicken", "Beef", "Pork", "Tofu", "Broccoli", "Tomato", "Onion", "Garlic", 
  "Ginger", "Potato", "Carrot", "Eggs", "Cheese", "Butter", "Milk", "Pasta", 
  "Rice", "Soy Sauce", "Sesame Oil", "Mushrooms", "Spinach", "Lemon", "Olive Oil",
  "Coriander", "Cumin", "Bell Pepper", "Bacon", "Yogurt", "Flour", "Honey", "Cheddar"
];

export default function App() {
  // Page routing state ('landing' or 'app')
  const [viewMode, setViewMode] = useState<"landing" | "app">("landing");

  // App Core States
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [searched, setSearched] = useState(false);
  
  const [matchedRecipes, setMatchedRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  
  const [activeTab, setActiveTab] = useState<"recipes" | "mealplan" | "analytics" | "profile" | "favorites">("recipes");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [errorString, setErrorString] = useState<string | null>(null);

  // Load User, Favorites, Search History and Analytics metadata
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const uRes = await fetch("/api/user");
      if (uRes.ok) {
        const uData = await uRes.json();
        setUserProfile(uData);
      }

      // Sync Favorites
      syncFavorites();

      // Sync History & Analytics
      syncHistoryAndAnalytics();
    } catch (err) {
      console.error("Failed to load backend initial state:", err);
    }
  };

  const syncFavorites = async () => {
    try {
      const fRes = await fetch("/api/favorites");
      if (fRes.ok) {
        const fData = await fRes.json();
        setFavorites(fData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const syncHistoryAndAnalytics = async () => {
    try {
      const hRes = await fetch("/api/history");
      if (hRes.ok) {
        const hData = await hRes.json();
        setSearchHistory(hData);
      }

      const aRes = await fetch("/api/analytics");
      if (aRes.ok) {
        const aData = await aRes.json();
        setAnalytics(aData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Autocomplete Suggestions logic
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCurrentInput(val);
    if (!val.trim()) {
      setSuggestions([]);
      return;
    }
    const filtered = POPULAR_INGREDIENTS.filter(item =>
      item.toLowerCase().includes(val.toLowerCase()) && !ingredients.some(i => i.toLowerCase() === item.toLowerCase())
    );
    setSuggestions(filtered.slice(0, 5));
  };

  // Add ingredient tag
  const addIngredient = (item: string) => {
    const cleaned = item.trim();
    if (!cleaned) return;
    if (ingredients.some(i => i.toLowerCase() === cleaned.toLowerCase())) {
      setCurrentInput("");
      setSuggestions([]);
      return;
    }
    setIngredients([...ingredients, cleaned]);
    setCurrentInput("");
    setSuggestions([]);
  };

  const removeIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  // Search recipes using exact/partial algorithmic matcher in backend
  const executeInstantSearch = async () => {
    if (ingredients.length === 0) {
      setErrorString("Please enter at least one kitchen ingredient tag first!");
      return;
    }
    setErrorString(null);
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients })
      });
      if (res.ok) {
        const data = await res.json();
        setMatchedRecipes(data.recipes);
        syncHistoryAndAnalytics();
        setActiveTab("recipes");
      } else {
        throw new Error("Instant recommendation query failed.");
      }
    } catch (err: any) {
      setErrorString(err.message || "An issue occurred executing search.");
    } finally {
      setLoading(false);
    }
  };

  // Search and formulate custom recipes using Gemini Generative AI routes
  const executeAISearch = async () => {
    if (ingredients.length === 0) {
      setErrorString("Please enter at least one kitchen ingredient tag first to query the AI chef!");
      return;
    }
    setErrorString(null);
    setIsAiGenerating(true);
    setSearched(true);
    try {
      const res = await fetch("/api/search/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients })
      });
      if (res.ok) {
        const data = await res.json();
        setMatchedRecipes(data.recipes);
        syncHistoryAndAnalytics();
        setActiveTab("recipes");
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Bespoke AI recipe generation failed. Is your GEMINI_API_KEY entered?");
      }
    } catch (err: any) {
      setErrorString(err.message || "Could not generate AI recipes at this time.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Update user profile properties
  const handleUpdateProfile = async (updated: UserProfile) => {
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
        syncHistoryAndAnalytics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Star / Favorite toggle handler
  const handleToggleFavorite = async (recipeId: string) => {
    const isFav = favorites.some(f => f.id === recipeId);
    try {
      if (isFav) {
        const res = await fetch(`/api/favorites/${recipeId}`, {
          method: "DELETE"
        });
        if (res.ok) {
          syncFavorites();
          syncHistoryAndAnalytics();
        }
      } else {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipeId })
        });
        if (res.ok) {
          syncFavorites();
          syncHistoryAndAnalytics();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Quick reload ingredients from preselected lists
  const loadPresetSelection = (presetList: string[]) => {
    setIngredients(presetList);
    setErrorString(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900 transition-colors duration-300">
      
      {/* --- SITE HEADER --- */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-150 py-4 px-4 sm:px-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setViewMode("landing")}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <ChefHat className="w-5 h-5 text-glow" />
          </div>
          <span className="font-display font-extrabold text-xlTracking text-gray-900 tracking-tight text-glow">
            Fridge<span className="text-emerald-600 font-semibold">Chef</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          {viewMode === "landing" ? (
            <button
              id="header-launch-btn"
              onClick={() => setViewMode("app")}
              className="flex items-center gap-1 bg-emerald-600 text-white font-semibold text-xs tracking-wide px-5 py-2.5 rounded-xl hover:bg-emerald-700 hover:shadow-lg transition-all cursor-pointer shadow-md"
            >
              Start Cooking Free <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              id="header-exit-btn"
              onClick={() => setViewMode("landing")}
              className="flex items-center gap-1 bg-gray-50 border border-gray-205 text-gray-650 font-semibold text-xs tracking-wide px-4 py-2 rounded-xl hover:bg-gray-100 transition-all cursor-pointer"
            >
              Back to Overview
            </button>
          )}
        </div>
      </header>

      {/* --- LANDING PAGE SECTION --- */}
      {viewMode === "landing" ? (
        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative overflow-hidden py-16 sm:py-24 px-6 md:px-12 max-w-7xl mx-auto text-center space-y-8">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-100/30 rounded-full blur-3xl -z-10"></div>
            
            <div className="inline-flex items-center gap-2 bg-emerald-100/60 text-emerald-800 font-mono text-xs font-bold px-3.5 py-1.5 rounded-full select-none shadow-sm uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" /> reduce waste, eat healthy
            </div>
            
            <h1 className="font-display text-4.5xl sm:text-6xl md:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight max-w-4xl mx-auto">
              Sauté Your Available Ingredients into <span className="text-emerald-600 underline decoration-wavy decoration-emerald-500/30">Bespoke Gourmet</span> Feast
            </h1>
            
            <p className="text-gray-500 font-sans text-base sm:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
               FridgeChef calculates ingredient proximity combinations instantly to discover delicious waste-free meals hiding inside your refrigerator.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                id="hero-primary-btn"
                onClick={() => setViewMode("app")}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white font-bold text-sm tracking-wide px-8 py-4.5 rounded-2.5xl hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/10 transition-all cursor-pointer text-glow shadow-md"
              >
                Launch Chef Cabinet <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto text-center font-bold text-xs font-mono uppercase tracking-wider text-gray-500 hover:text-gray-950 px-6 py-3.5 hover:underline"
              >
                See how it works
              </a>
            </div>

            {/* Micro mock preview graphic */}
            <div className="pt-10 max-w-4xl mx-auto z-10 relative">
              <div className="glass-panel rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 border-white/60">
                <div className="flex flex-wrap gap-2 max-w-md">
                  <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-850 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm">🍗 Chicken <X className="w-3 h-3 text-emerald-600" /></span>
                  <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-850 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm">🧅 Onion <X className="w-3 h-3 text-emerald-600" /></span>
                  <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-850 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm">🍅 Tomato <X className="w-3 h-3 text-emerald-600" /></span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-bold font-mono text-gray-400">Yielding AI recipes</span>
                  <div className="h-10 w-28 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center shadow-md select-none text-glow">
                    Chicken Curry 🍛
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works & Ingredients Recommendation Steps */}
          <section id="how-it-works" className="bg-white py-16 px-6 md:px-12 scroll-mt-20 border-t border-gray-150">
            <div className="max-w-6xl mx-auto space-y-12">
              <div className="text-center space-y-2">
                <h2 className="font-display text-2.5xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">How FridgeChef Works</h2>
                <p className="text-gray-500 text-xs sm:text-sm font-mono uppercase font-semibold">from fridge to table in minutes</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-slate-50 border border-gray-100 rounded-3xl p-6 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-750 font-display font-black text-xl flex items-center justify-center shadow-inner">1</div>
                  <h3 className="font-display font-extrabold text-lg text-gray-950">Add Available Items</h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-sans font-medium">Tag whatever proteins, greens, or pantry staples you have in your cupboards using our responsive tagging dashboard.</p>
                </div>

                <div className="bg-slate-50 border border-gray-100 rounded-3xl p-6 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-750 font-display font-black text-xl flex items-center justify-center shadow-inner">2</div>
                  <h3 className="font-display font-extrabold text-lg text-gray-950">Intelligent Matching</h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-sans font-medium">Our NLP-synonyms algorithm compares inputs against our seed catalogs, calculate spelling, and substitute closest components.</p>
                </div>

                <div className="bg-slate-50 border border-gray-100 rounded-3xl p-6 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-750 font-display font-black text-xl flex items-center justify-center shadow-inner">3</div>
                  <h3 className="font-display font-extrabold text-lg text-gray-950">Bespoke Recipes Sauté</h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-sans font-medium">Toggle AI modes to query Gemini. Instant gourmet recipes with steps, substitutions and full micro nutrient breakdowns are produced.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="py-16 px-6 md:px-12 max-w-6xl mx-auto space-y-8">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-center text-gray-900 tracking-tight">Active Home Chefs Love FridgeChef</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <blockquote className="glass-panel border-white rounded-3xl p-6 shadow-md space-y-3">
                <p className="text-xs text-gray-600 leading-relaxed font-sans italic font-medium">
                  "I was down to chicken thighs, half a tomato, and an onion. Instantly, FridgeChef recommended Golden Sauté Stir-Fry. Sautéed it in ten minutes and it tasted like a restaurant meal. Reduced my waste completely!"
                </p>
                <footer className="text-xs font-bold text-gray-900 font-display">— Sarah T., San Jose Chef</footer>
              </blockquote>

              <blockquote className="glass-panel border-white rounded-3xl p-6 shadow-md space-y-3">
                <p className="text-xs text-gray-600 leading-relaxed font-sans italic font-medium">
                  "The nutrition gauges and substitute cheat sheets are superb! If I'm low on certain pantry items, the recommendation system tells me what standard spices can replicate the exact flavor bounds."
                </p>
                <footer className="text-xs font-bold text-gray-900 font-display">— David K., Portland Gourmet</footer>
              </blockquote>
            </div>
          </section>

          {/* CTA Banner */}
          <section className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white rounded-none py-16 text-center space-y-6">
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight leading-none text-glow">Start Your Sustainable Culinary Sauté Today</h2>
            <p className="max-w-xl mx-auto text-xs sm:text-sm text-emerald-100 font-sans font-medium">Join thousands of home cook superstars preventing waste, optimizing ingredients, and enjoying five-star customized nutrition.</p>
            <button
              id="cta-bottom-btn"
              onClick={() => setViewMode("app")}
              className="px-8 py-4 bg-white text-emerald-900 font-bold text-xs sm:text-sm tracking-wider uppercase rounded-2xl hover:bg-emerald-50 hover:shadow-xl transition-all cursor-pointer shadow-md"
            >
              Access Your Cabinet
            </button>
          </section>
        </main>
      ) : (
        /* --- APPLICATION CONSOLE SECTION --- */
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT UTILITY SIDEBAR: Cabinet Input, Suggestions & History (Cols Span 4) */}
          <div className="lg:col-span-4 space-y-6">
            {/* INGREDIENT TAGGING CABINET */}
            <div className="glass-panel rounded-3xl p-6 shadow-xl border border-white/50 space-y-5">
              <div>
                <h3 className="font-display text-lg font-bold text-gray-900 tracking-tight flex items-center gap-1.5">
                  🧊 Kitchen Cabinet Input
                </h3>
                <p className="text-[11px] text-gray-500 font-sans font-medium mt-0.5">
                  Enter ingredients you have in your fridge. Let AI match or substitute!
                </p>
              </div>

              {/* Tagging field */}
              <div className="space-y-2 relative">
                <div className="flex gap-2 relative">
                  <input
                    id="ingredient-cabinet-input"
                    type="text"
                    value={currentInput}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addIngredient(currentInput);
                      }
                    }}
                    placeholder="Enter e.g. Chicken, Onion, Beef..."
                    className="w-full text-xs px-3.5 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-sans shadow-inner transition-all"
                  />
                  <button
                    id="add-ingredient-btn"
                    onClick={() => addIngredient(currentInput)}
                    className="aspect-square bg-emerald-600 text-white rounded-xl flex items-center justify-center p-3 hover:bg-emerald-700 transition-all cursor-pointer shadow-md"
                  >
                    <Plus className="w-5 h-5 text-glow" />
                  </button>
                </div>

                {/* Autocomplete Droplist overlay wrapper */}
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 max-h-48 overflow-y-auto bg-white/95 border border-gray-150 rounded-2xl shadow-xl z-20 overflow-hidden divide-y divide-gray-50 animate-scale-up backdrop-blur-md">
                    {suggestions.map((item) => (
                      <button
                        key={item}
                        onClick={() => addIngredient(item)}
                        className="w-full text-left font-sans text-xs px-4 py-2.5 text-gray-700 bg-transparent hover:bg-emerald-50 hover:text-emerald-900 transition-all font-semibold cursor-pointer block select-none"
                      >
                        🌟 Add <span className="font-bold underline">{item}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dynamic Tag list block */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-gray-400 block">Available Tags ({ingredients.length})</span>
                {ingredients.length === 0 ? (
                  <div className="p-6 bg-slate-50 border border-dashed border-gray-200 rounded-2xl text-center">
                    <p className="text-xs text-gray-400 italic">No ingredients inside cabinet. Sauté some tags!</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {ingredients.map((item, idx) => (
                      <span
                        key={idx}
                        className="group inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all animate-scale-up"
                      >
                        {item}
                        <X
                          className="w-3.5 h-3.5 text-emerald-600 hover:text-red-700 cursor-pointer p-0.5 hover:bg-red-50 rounded"
                          onClick={() => removeIngredient(idx)}
                        />
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Load presets helpers */}
              <div className="space-y-1.5 pt-2 border-t border-gray-100">
                <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-gray-400 block">Quick Demo Stock Kits</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => loadPresetSelection(["Chicken", "Onion", "Tomato", "Garlic"])}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-lg text-[10px] font-semibold font-mono cursor-pointer"
                  >
                    🍗 Curry Combo
                  </button>
                  <button
                    onClick={() => loadPresetSelection(["Beef", "Potatoes", "Carrots", "Garlic"])}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-lg text-[10px] font-semibold font-mono cursor-pointer"
                  >
                    🥩 Steak Roast
                  </button>
                  <button
                    onClick={() => loadPresetSelection(["Pasta", "Tomato", "Garlic", "Basil"])}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-lg text-[10px] font-semibold font-mono cursor-pointer"
                  >
                    🍝 Tuscan Pasta
                  </button>
                </div>
              </div>

              {/* Execution Actions buttons */}
              <div className="space-y-2 pt-3">
                {/* Instant matched search */}
                <button
                  id="instant-search-btn"
                  onClick={executeInstantSearch}
                  disabled={loading || isAiGenerating}
                  className="w-full text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-200 hover:border-emerald-300 disabled:opacity-50 transition-all cursor-pointer shadow-sm select-none font-sans"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Scanning Seed matches...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Calculate Seed Matches
                    </>
                  )}
                </button>

                {/* Generative AI dynamic chef */}
                <button
                  id="ai-generate-btn"
                  onClick={executeAISearch}
                  disabled={loading || isAiGenerating}
                  className="w-full text-xs font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 transition-all cursor-pointer shadow-md select-none font-sans text-glow"
                >
                  {isAiGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Chef Formulating Recipes...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 animate-bounce" />
                      Bespoke Search with AI
                    </>
                  )}
                </button>
              </div>

              {errorString && (
                <div className="p-3 bg-red-50 border border-red-100 text-[11px] font-medium font-sans text-red-800 rounded-xl flex items-start gap-1.5 animate-scale-up">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Execution Error</p>
                    <p className="mt-0.5 leading-relaxed">{errorString}</p>
                    <p className="mt-1 text-[10px] text-gray-500 font-mono">Verify secrets configuration in the Secrets panel panel.</p>
                  </div>
                </div>
              )}
            </div>

            {/* RECENT SEARCHES HISTORY PANEL */}
            <div className="glass-panel rounded-3xl p-6 shadow-md border border-white/50 space-y-4">
              <h3 className="font-display font-bold text-sm tracking-tight text-gray-900 flex items-center gap-2">
                <History className="w-4 h-4 text-gray-500" /> Sauté History Logs
              </h3>

              {searchHistory.length === 0 ? (
                <p className="text-[11px] text-gray-400 italic">No search logs registered.</p>
              ) : (
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {searchHistory.slice(0, 5).map((entry, eIdx) => (
                    <div
                      key={eIdx}
                      onClick={() => setIngredients(entry.ingredients)}
                      className="bg-white/50 border border-gray-100 hover:border-emerald-200 rounded-xl p-3 text-xs flex flex-col justify-between cursor-pointer transition-all hover:bg-emerald-50/20"
                    >
                      <div className="flex flex-wrap gap-1">
                        {entry.ingredients.map((ing, iIdx) => (
                          <span key={iIdx} className="bg-gray-100 border text-[10px] font-semibold px-1.5 py-0.5 rounded text-gray-650 uppercase">
                            {ing}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-50 text-[10px] text-gray-400 font-mono">
                        <span>🍳 {entry.recipeCount} Matches</span>
                        <span>{new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT TABS CONTENT PANEL: Recommendations, Meal planner, Analytics & Profile (Cols Span 8) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Nav Tabs Selector */}
            <nav className="flex items-center bg-white border border-gray-150 p-1.5 rounded-2xl shadow-sm overflow-x-auto divide-x divide-gray-100">
              <button
                id="tab-recipes"
                onClick={() => setActiveTab("recipes")}
                className={`flex-1 min-w-[94px] text-center flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap select-none ${
                  activeTab === "recipes"
                    ? "bg-slate-900 text-white shadow-md font-sans"
                    : "text-gray-500 hover:text-gray-950 hover:bg-slate-50 font-sans"
                }`}
              >
                <Utensils className="w-4 h-4" /> Recommended
              </button>
              
              <button
                id="tab-mealplan"
                onClick={() => setActiveTab("mealplan")}
                className={`flex-1 min-w-[94px] text-center flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap select-none ${
                  activeTab === "mealplan"
                    ? "bg-slate-900 text-white shadow-md font-sans"
                    : "text-gray-500 hover:text-gray-950 hover:bg-slate-50 font-sans"
                }`}
              >
                <Calendar className="w-4 h-4" /> AI Meal Scheduler
              </button>

              <button
                id="tab-analytics"
                onClick={() => setActiveTab("analytics")}
                className={`flex-1 min-w-[94px] text-center flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap select-none ${
                  activeTab === "analytics"
                    ? "bg-slate-900 text-white shadow-md font-sans"
                    : "text-gray-500 hover:text-gray-950 hover:bg-slate-50 font-sans"
                }`}
              >
                <BarChart3 className="w-4 h-4" /> Analytics
              </button>

              <button
                id="tab-favorites"
                onClick={() => setActiveTab("favorites")}
                className={`flex-1 min-w-[94px] text-center flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap select-none ${
                  activeTab === "favorites"
                    ? "bg-slate-900 text-white shadow-md font-sans"
                    : "text-gray-500 hover:text-gray-950 hover:bg-slate-50 font-sans"
                }`}
              >
                <Heart className="w-4 h-4" /> Favorites
              </button>

              <button
                id="tab-profile"
                onClick={() => setActiveTab("profile")}
                className={`flex-1 min-w-[98px] text-center flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap select-none ${
                  activeTab === "profile"
                    ? "bg-slate-900 text-white shadow-md font-sans"
                    : "text-gray-500 hover:text-gray-950 hover:bg-slate-50 font-sans"
                }`}
              >
                <User className="w-4 h-4" /> Preferences
              </button>
            </nav>

            {/* Tab Container Core Body */}
            <div className="z-10 relative">

              {/* RECIPES LIST TAB */}
              {activeTab === "recipes" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-1.5xl font-extrabold text-gray-900 tracking-tight">
                      🍳 Discovery Kitchen Feed
                    </h3>
                    <span className="text-xs text-gray-400 font-mono">{matchedRecipes.length} recipes loaded</span>
                  </div>

                  {!searched ? (
                    <div className="glass-panel rounded-3xl p-10 py-16 text-center space-y-4">
                      <div className="w-16 h-16 bg-emerald-55/40 text-emerald-600 rounded-2.5xl flex items-center justify-center mx-auto shadow-inner select-none font-sans text-3xl">🍲</div>
                      <h4 className="font-display font-extrabold text-xl text-gray-900">Your Shelf is Untouched</h4>
                      <p className="text-xs sm:text-sm text-gray-400 max-w-sm mx-auto font-sans leading-relaxed">
                        Tag your available ingredients on the Left panel and trigger search to fetch exact matches with micro nutrient stats.
                      </p>
                    </div>
                  ) : matchedRecipes.length === 0 ? (
                    <div className="glass-panel rounded-3xl p-8 py-14 text-center space-y-4">
                      <div className="w-16 h-16 bg-red-100 rounded-2.5xl flex items-center justify-center mx-auto shadow-inner text-red-500 text-xl font-sans">✕</div>
                      <h4 className="font-display font-bold text-lg text-gray-900">No Seed Match Recipes Sautéed</h4>
                      <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                        We couldn't locate preselected combinations in our library.
                      </p>
                      <button
                        onClick={executeAISearch}
                        className="inline-flex items-center gap-1.5 px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold text-xs rounded-xl hover:from-emerald-700 hover:to-emerald-800 hover:shadow-lg transition-all cursor-pointer text-glow"
                      >
                        <Sparkles className="w-4 h-4" /> Formulate Recipe with Gemini AI
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {matchedRecipes.map((recipe) => (
                        <div
                          key={recipe.id}
                          className="group bg-white rounded-3xl overflow-hidden border border-gray-150 hover:border-emerald-200 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                        >
                          <div className="relative h-44 w-full overflow-hidden">
                            <img
                              src={recipe.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80"}
                              alt={recipe.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                            {/* Overlay Percentage */}
                            <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-bold font-mono tracking-wider px-2.5 py-1 rounded-lg uppercase shadow-md text-glow">
                              {recipe.matchPercentage}% Proximity Match
                            </div>

                            {/* Bookmarks Toggle inside Card image overlay */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(recipe.id);
                              }}
                              className={`absolute top-3 right-3 p-2 rounded-full border shadow-md transition-all cursor-pointer backdrop-blur-md ${
                                favorites.some(f => f.id === recipe.id)
                                  ? "bg-red-500 text-color-white border-red-500 text-white"
                                  : "bg-black/50 text-white border-white/10 hover:bg-black/70"
                              }`}
                            >
                              ❤️
                            </button>
                          </div>

                          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                            <div>
                              <div className="flex items-center gap-2 text-[10px] font-bold font-mono text-gray-400 uppercase tracking-wider">
                                <span>{recipe.cuisineType}</span>
                                <span>•</span>
                                <span className="bg-gray-100 text-gray-650 px-1.5 py-0.5 rounded uppercase font-semibold">{recipe.difficulty}</span>
                              </div>
                              <h4 className="font-display font-bold text-gray-900 border-none select-text text-base mt-1 group-hover:text-emerald-700 transition-colors line-clamp-1">
                                {recipe.name}
                              </h4>
                              <p className="text-gray-500 text-xs mt-1.5 leading-relaxed font-sans font-medium line-clamp-2">
                                {recipe.description}
                              </p>
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-50 pt-3 text-[11px] text-gray-400 font-mono">
                              <span className="flex items-center gap-1 font-semibold text-gray-600 font-sans">
                                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                {recipe.prepTime + recipe.cookTime} Mins
                              </span>
                              
                              <button
                                onClick={() => setSelectedRecipe(recipe)}
                                className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-bold font-mono group-hover:translate-x-1 transition-transform cursor-pointer"
                              >
                                View Recipe <Maximize2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* MEAL SCHEDULER PLAN TAB */}
              {activeTab === "mealplan" && (
                <div className="animate-fade-in">
                  <MealPlannerSection ingredients={ingredients} userId="usr_1" />
                </div>
              )}

              {/* ANALYTICS HEATMAPS TAB */}
              {activeTab === "analytics" && (
                <div className="animate-fade-in">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display text-1.5xl font-extrabold text-gray-900 tracking-tight">
                      📊 Cabinet Food Analytics
                    </h3>
                  </div>
                  <DashboardAnalytics analytics={analytics} />
                </div>
              )}

              {/* FAVORITES BOOKSHELF TAB */}
              {activeTab === "favorites" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-1.5xl font-extrabold text-gray-900 tracking-tight">
                      ❤️ Your Favorite Bookshelf
                    </h3>
                    <span className="text-xs text-gray-400 font-mono">{favorites.length} saved recipes</span>
                  </div>

                  {favorites.length === 0 ? (
                    <div className="glass-panel rounded-3xl p-10 text-center space-y-4">
                      <div className="w-16 h-16 bg-red-50/50 rounded-2.5xl flex items-center justify-center mx-auto text-xl font-sans text-red-500 shadow-inner select-none">❤️</div>
                      <h4 className="font-display font-medium text-gray-900 text-sm">Your Bookshelf is Clean and Empty</h4>
                      <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                        Star recipes inside the Recommended Feed to keep an instant quick-access list of five-star favorites!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {favorites.map((recipe) => (
                        <div
                          key={recipe.id}
                          className="bg-white rounded-3xl overflow-hidden border border-gray-150 flex flex-col justify-between hover:shadow-lg transition-all"
                        >
                          <div className="relative h-40 w-full overflow-hidden">
                            <img
                              src={recipe.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80"}
                              alt={recipe.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-bold font-mono px-2 rounded-md">
                              {recipe.cuisineType}
                            </div>
                            <button
                              onClick={() => handleToggleFavorite(recipe.id)}
                              className="absolute top-3 right-3 p-2 rounded-full bg-red-500 text-white shadow-md cursor-pointer"
                            >
                              ❤️
                            </button>
                          </div>

                          <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                            <div>
                              <h4 className="font-display font-bold text-gray-900 text-sm truncate">{recipe.name}</h4>
                              <p className="text-gray-500 text-[11px] leading-relaxed line-clamp-2">{recipe.description}</p>
                            </div>
                            <div className="flex items-center justify-between border-t border-gray-50 pt-3 text-[10px] text-gray-450 font-mono">
                              <span>⏱️ {recipe.prepTime + recipe.cookTime} Mins</span>
                              <button
                                onClick={() => setSelectedRecipe(recipe)}
                                className="text-emerald-600 font-semibold hover:underline cursor-pointer"
                              >
                                Cook Now →
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* DIETARY PREFERENCES TAB */}
              {activeTab === "profile" && userProfile && (
                <div className="animate-fade-in">
                  <UserProfileSection user={userProfile} onUpdate={handleUpdateProfile} />
                </div>
              )}

            </div>
          </div>
        </main>
      )}

      {/* --- INLINE RECIPE DETAIL MODAL --- */}
      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onToggleFavorite={handleToggleFavorite}
          isFavorite={favorites.some(f => f.id === selectedRecipe.id)}
        />
      )}

      {/* --- FOOTER SECTION --- */}
      <footer className="bg-white border-t border-gray-150 py-8 px-6 text-center text-xs text-gray-400 tracking-tight font-sans mt-12 shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-extrabold text-sm text-gray-900">
              Fridge<span className="text-emerald-600 font-semibold">Chef</span>
            </span>
            <span className="text-[10px] text-gray-300">|</span>
            <span>AI Sustainable Meal Recommender</span>
          </div>
          <p className="text-gray-400 font-medium">© 2026 FridgeChef Startup, Inc. Eat safe. Save food.</p>
        </div>
      </footer>

    </div>
  );
}
