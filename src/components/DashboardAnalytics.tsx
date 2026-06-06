/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AnalyticsData } from "../types";
import { BarChart3, TrendingUp, Sparkles, Award } from "lucide-react";

interface DashboardAnalyticsProps {
  analytics: AnalyticsData | null;
}

export default function DashboardAnalytics({ analytics }: DashboardAnalyticsProps) {
  if (!analytics) {
    return (
      <div className="glass-panel rounded-3xl p-8 flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-12 h-12 bg-emerald-100/50 rounded-2xl flex items-center justify-center text-emerald-600 mb-3 animate-pulse">
          <BarChart3 className="w-6 h-6" />
        </div>
        <p className="text-gray-500 text-sm font-sans">No search trace available yet. Sauté some ingredients to view your cooking logs!</p>
      </div>
    );
  }

  // Calculate coordinates for a responsive SVG Bar Chart
  const weekly = analytics.weeklyActivity || [];
  const maxIntensity = Math.max(...weekly.map(w => w.count), 1);
  const chartHeight = 110;
  const colWidth = 28;
  const colGap = 16;
  const totalWidth = weekly.length * (colWidth + colGap) - colGap;

  return (
    <div id="analytics-section" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Search Overview Metric Card */}
      <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500"></div>
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold font-mono tracking-wider text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-full uppercase">
              Searches Trace
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-sm text-gray-500 font-sans font-medium">Accumulated Cook Searches</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-5xl font-display font-extrabold text-gray-900 tracking-tight">
              {analytics.recipesSearchedCount}
            </span>
            <span className="text-xs text-emerald-600 font-semibold font-sans">Queries</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-sans text-xs font-bold">
            💡
          </div>
          <p className="text-xs text-gray-600 font-sans leading-snug">
            Each lookup updates your flavor preferences to fine-tune FridgeChef's algorithm.
          </p>
        </div>
      </div>

      {/* Favorite Cuisines Bento */}
      <div className="glass-panel rounded-3xl p-6 shadow-lg">
        <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-800 mb-4 flex items-center gap-2">
          <Award className="w-4 h-4" /> Favorite Cuisines
        </h4>

        {analytics.favoriteCuisines.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-gray-400 italic py-6">
            Bookmark/star recipes to discover your map of flavor regions!
          </div>
        ) : (
          <div className="space-y-3.5">
            {analytics.favoriteCuisines.map((cuisine, idx) => {
              const maxCount = analytics.favoriteCuisines[0]?.count || 1;
              const widthPct = Math.round((cuisine.count / maxCount) * 100);
              return (
                <div key={cuisine.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-sans">
                    <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                      <span className="text-xs opacity-60">#{idx + 1}</span>
                      {cuisine.name}
                    </span>
                    <span className="font-mono text-gray-500 font-medium">{cuisine.count} saved</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-700"
                      style={{ width: `${widthPct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Weekly Activity & Ingredients */}
      <div className="glass-panel rounded-3xl p-6 shadow-lg flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-800 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-500" /> Kitchen Heatmap (Weekly Activity)
          </h4>

          {/* SVG-Based column chart */}
          <div className="flex justify-center py-2 h-36">
            <svg
              viewBox={`0 0 ${totalWidth} ${chartHeight + 24}`}
              width="100%"
              height="100%"
              className="overflow-visible"
            >
              {weekly.map((entry, idx) => {
                const barHeight = (entry.count / maxIntensity) * chartHeight;
                const xCoord = idx * (colWidth + colGap);
                const yCoord = chartHeight - barHeight;

                return (
                  <g key={entry.day} className="group/bar cursor-pointer">
                    {/* Background Bar */}
                    <rect
                      x={xCoord}
                      y={0}
                      width={colWidth}
                      height={chartHeight}
                      fill="rgba(16,185,129,0.03)"
                      rx={4}
                    />
                    {/* Actual Bar Column */}
                    <rect
                      x={xCoord}
                      y={yCoord}
                      width={colWidth}
                      height={Math.max(barHeight, 4)} // Ensure at least a line is visible
                      fill="url(#column-gradient)"
                      rx={6}
                      className="transition-all duration-500 group-hover/bar:fill-emerald-400"
                    />
                    {/* Tooltip Counter */}
                    <text
                      x={xCoord + colWidth / 2}
                      y={yCoord - 8}
                      textAnchor="middle"
                      fill="#047857"
                      fontSize={10}
                      fontWeight="bold"
                      fontFamily="monospace"
                      opacity={0}
                      className="transition-opacity duration-300 group-hover/bar:opacity-100"
                    >
                      {entry.count}
                    </text>
                    {/* Day label */}
                    <text
                      x={xCoord + colWidth / 2}
                      y={chartHeight + 16}
                      textAnchor="middle"
                      fill="#6b7280"
                      fontSize={10}
                      fontFamily="sans-serif"
                    >
                      {entry.day}
                    </text>
                  </g>
                );
              })}
              <defs>
                <linearGradient id="column-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Most used ingredients list spanning bottom */}
      <div className="lg:col-span-3 glass-panel rounded-3xl p-6 shadow-lg mt-2">
        <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-800 mb-4 flex items-center gap-2">
          🍽️ Top Sautéed Ingredients
        </h4>
        {analytics.mostUsedIngredients.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No ingredient statistics recorded yet. Fill your fridge to start tracking!</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {analytics.mostUsedIngredients.map((ing, idx) => (
              <div key={ing.name} className="bg-emerald-50/40 border border-emerald-100/50 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-800 font-mono font-medium">#{idx + 1}</p>
                  <p className="font-semibold text-gray-800 text-sm font-sans mt-0.5">{ing.name}</p>
                </div>
                <div className="bg-white px-2.5 py-1.5 rounded-lg border border-emerald-100 text-xs font-bold text-emerald-700 shadow-sm">
                  {ing.count}x
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
