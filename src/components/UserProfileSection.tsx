/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { UserProfile } from "../types";
import { User, ShieldAlert, Sparkles, Check, Edit2 } from "lucide-react";

interface UserProfileSectionProps {
  user: UserProfile;
  onUpdate: (updated: UserProfile) => void;
}

const DIETARY_OPTIONS = ["Vegetarian", "Vegan", "Gluten-Free", "Keto", "High-Protein", "Low-Carb"];
const ALLERGY_OPTIONS = ["Peanuts", "Tree Nuts", "Dairy", "Gluten", "Shellfish", "Soy", "Eggs"];

export default function UserProfileSection({ user, onUpdate }: UserProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [dietary, setDietary] = useState<string[]>(user.dietaryPreferences);
  const [allergies, setAllergies] = useState<string[]>(user.allergies);

  const toggleDietary = (pref: string) => {
    if (dietary.includes(pref)) {
      setDietary(dietary.filter(p => p !== pref));
    } else {
      setDietary([...dietary, pref]);
    }
  };

  const toggleAllergy = (allergy: string) => {
    if (allergies.includes(allergy)) {
      setAllergies(allergies.filter(a => a !== allergy));
    } else {
      setAllergies([...allergies, allergy]);
    }
  };

  const handleSave = () => {
    onUpdate({
      ...user,
      name,
      dietaryPreferences: dietary,
      allergies
    });
    setIsEditing(false);
  };

  return (
    <div id="user-profile-section" className="glass-panel rounded-3xl p-6 md:p-8 shadow-xl border border-white/40 transition-all duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-3xl shadow-inner select-none font-sans">
            {user.avatar || "🧑‍🍳"}
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              {user.name}
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium font-sans">Kitchen Chef</span>
            </h3>
            <p className="text-xs text-gray-500 font-mono">{user.email}</p>
          </div>
        </div>

        {!isEditing ? (
          <button
            id="edit-profile-btn"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 transition-all cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit Preferences
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              id="cancel-profile-btn"
              onClick={() => {
                setName(user.name);
                setDietary(user.dietaryPreferences);
                setAllergies(user.allergies);
                setIsEditing(false);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="save-profile-btn"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Save Changes
            </button>
          </div>
        )}
      </div>

      {!isEditing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-800 font-mono mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Dietary Filters
            </h4>
            {user.dietaryPreferences.length === 0 ? (
              <p className="text-xs text-emerald-700/70 italic">No restriction filters active. Suggesting all gourmet recipes.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {user.dietaryPreferences.map(pref => (
                  <span key={pref} className="px-2.5 py-1 bg-white text-emerald-800 border border-emerald-200 rounded-lg text-xs font-medium shadow-sm">
                    {pref}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="bg-orange-50/50 rounded-2xl p-4 border border-orange-100/50">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-orange-800 font-mono mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-orange-600" />
              Food Allergy Guard
            </h4>
            {user.allergies.length === 0 ? (
              <p className="text-xs text-orange-700/70 italic">No food safety overrides enabled. Eat safe, eat happy!</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {user.allergies.map(allergy => (
                  <span key={allergy} className="px-2.5 py-1 bg-white text-orange-800 border border-orange-200 rounded-lg text-xs font-medium shadow-sm">
                    {allergy}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in-down">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-mono mb-1.5">Chef Handle / Name</label>
            <input
              id="chef-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-sans shadow-sm transition-all"
              placeholder="Your Name"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-mono mb-2">Dietary Lifestyle</label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map(pref => {
                const active = dietary.includes(pref);
                return (
                  <button
                    key={pref}
                    onClick={() => toggleDietary(pref)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all border cursor-pointer select-none ${
                      active
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/10"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {pref}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-mono mb-2">Allergy Protections</label>
            <div className="flex flex-wrap gap-2">
              {ALLERGY_OPTIONS.map(allergy => {
                const active = allergies.includes(allergy);
                return (
                  <button
                    key={allergy}
                    onClick={() => toggleAllergy(allergy)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all border cursor-pointer select-none ${
                      active
                        ? "bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-600/10"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {allergy}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
