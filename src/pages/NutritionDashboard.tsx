import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Utensils, Flame, Droplets, Zap, Clock, Target, Apple, Coffee, Sun, Moon, MapPin, Leaf, X } from 'lucide-react';
import { type UserProfile } from '../services/store';
import { generateMealPlan, getNutritionSummary, suggestNextMealFoods } from '../services/nutritionEngine';
import { combinedFoods, type FoodItem } from '../data/combinedFoods';

interface NutritionDashboardProps {
  user: UserProfile;
}

export default function NutritionDashboard({ user }: NutritionDashboardProps) {
  const nutritionSummary = getNutritionSummary(user);
  const mealPlan = useMemo(() => generateMealPlan(user), [user]);
  const [foodSearch, setFoodSearch] = useState('');
  const [servings, setServings] = useState(1);
  const [consumedFoods, setConsumedFoods] = useState<{ id: string; name: string; calories: number; protein: number; carbs: number; fats: number; servings: number }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [browseCategory, setBrowseCategory] = useState<FoodItem['category']>('breakfast');
  const [showBrowse, setShowBrowse] = useState(false);

  // Filter foods based on search
  const filteredFoods = useMemo(() => {
    if (!foodSearch.trim()) return [];
    const query = foodSearch.toLowerCase();
    return combinedFoods.filter(f => f.name.toLowerCase().includes(query) || f.nameLocal?.toLowerCase().includes(query)).slice(0, 8);
  }, [foodSearch]);

  const mealIcons: Record<string, React.ReactNode> = {
    breakfast: <Coffee size={16} className="text-orange-400" />,
    pre_workout: <Zap size={16} className="text-yellow-400" />,
    lunch: <Sun size={16} className="text-amber-400" />,
    post_workout: <Flame size={16} className="text-red-400" />,
    dinner: <Moon size={16} className="text-indigo-400" />,
    snack: <Apple size={16} className="text-green-400" />,
  };

  const mealLabels: Record<string, string> = {
    breakfast: 'Breakfast',
    pre_workout: 'Pre-Workout',
    lunch: 'Lunch',
    post_workout: 'Post-Workout',
    dinner: 'Dinner',
    snack: 'Snacks',
  };

  const macroRing = (label: string, current: number, target: number, color: string) => {
    const pct = Math.min((current / Math.max(target, 1)) * 100, 100);
    return (
      <div className="flex flex-col items-center">
        <div className="relative w-20 h-20">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
            <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 264} 264`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm font-bold text-white">{current}<span className="text-[10px] text-slate-500">g</span></p>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2">{label}</p>
        <p className="text-[10px] text-slate-600">of {target}g</p>
      </div>
    );
  };

  const totalMealCalories = mealPlan.meals.reduce((s, m) => s + m.totalCalories, 0);

  const consumedTotals = consumedFoods.reduce((acc, item) => {
    acc.calories += item.calories;
    acc.protein += item.protein;
    acc.carbs += item.carbs;
    acc.fats += item.fats;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const remaining = {
    calories: Math.max(0, mealPlan.targetCalories - consumedTotals.calories),
    protein: Math.max(0, mealPlan.targetProtein - consumedTotals.protein),
    carbs: Math.max(0, mealPlan.targetCarbs - consumedTotals.carbs),
    fats: Math.max(0, mealPlan.targetFats - consumedTotals.fats),
  };

  const suggestions = useMemo(() => suggestNextMealFoods(user, remaining, 'dinner'), [user, remaining.calories, remaining.protein, remaining.carbs, remaining.fats]);

  const handleAddConsumedFood = (foodId: string) => {
    const food = combinedFoods.find(f => f.id === foodId);
    if (!food) return;
    const qty = Math.max(1, servings);
    setConsumedFoods(prev => [
      {
        id: `${food.id}_${Date.now()}`,
        name: food.name,
        servings: qty,
        calories: Math.round(food.calories * qty),
        protein: Math.round(food.protein * qty),
        carbs: Math.round(food.carbs * qty),
        fats: Math.round(food.fats * qty),
      },
      ...prev,
    ]);
    setFoodSearch('');
    setShowSuggestions(false);
  };

  const handleRemoveFood = (id: string) => {
    setConsumedFoods(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 p-4 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl lg:text-4xl font-extrabold text-white flex items-center gap-3">
          <Utensils className="text-[#6C63FF]" size={32} />
          Nutrition Plan
        </h1>
        <p className="text-slate-400 mt-1 flex items-center gap-2">
          <MapPin size={14} />
          Food recommendations
          <span className={`text-xs px-2 py-0.5 rounded-full ${mealPlan.carbCycleDay === 'high' ? 'bg-green-500/10 text-green-400' :
            mealPlan.carbCycleDay === 'low' ? 'bg-red-500/10 text-red-400' :
              'bg-yellow-500/10 text-yellow-400'
            }`}>
            {mealPlan.carbCycleDay} carb day
          </span>
        </p>
      </div>

      {/* Food Logger - Moved to Top */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#6C63FF]/10 to-purple-500/10 border border-[#6C63FF]/20 rounded-3xl p-6"
      >
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Apple size={20} className="text-green-400" />
          What did you eat today?
        </h2>

        {/* Search-based food selection */}
        <div className="relative mb-4">
          <input
            type="text"
            value={foodSearch}
            onChange={(e) => {
              setFoodSearch(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Type food name... (search enabled)"
            className="w-full bg-white/5 border border-white/20 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#6C63FF]/50 focus:ring-1 focus:ring-[#6C63FF]/30"
          />
          
          {/* Autocomplete dropdown */}
          {showSuggestions && filteredFoods.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-950 border border-white/10 rounded-2xl max-h-64 overflow-y-auto z-10">
              {filteredFoods.map((food) => (
                <button
                  key={food.id}
                  onClick={() => handleAddConsumedFood(food.id)}
                  className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-b-0 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{food.name}</p>
                      {food.nameLocal && (
                        <p className="text-xs text-slate-400">{food.nameLocal}</p>
                      )}
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p>{food.calories} kcal</p>
                      <p className="text-[#6C63FF]">{food.protein}P/{food.carbs}C/{food.fats}F</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Servings input */}
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-slate-400 block mb-1">Servings</label>
            <input
              type="number"
              min={1}
              value={servings}
              onChange={(e) => setServings(Math.max(1, Number(e.target.value)))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6C63FF]/50"
              placeholder="1"
            />
          </div>
          <button
            onClick={() => {
              if (foodSearch.trim() && filteredFoods.length > 0) {
                handleAddConsumedFood(filteredFoods[0].id);
              }
            }}
            className="bg-gradient-to-r from-[#6C63FF] to-purple-500 hover:from-[#5B54DD] hover:to-purple-600 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-all"
          >
            Add Food
          </button>
        </div>

        {/* Browse all foods */}
        <div className="mt-4">
          <button
            onClick={() => setShowBrowse(prev => !prev)}
            className="text-xs text-[#6C63FF] hover:text-purple-400 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>{showBrowse ? '▲' : '▼'}</span>
            {showBrowse ? 'Hide' : 'Browse'} all food sources
          </button>

          {showBrowse && (
            <div className="mt-3">
              {/* Category tabs */}
              <div className="flex flex-wrap gap-2 mb-3">
                {(['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'] as FoodItem['category'][]).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setBrowseCategory(cat)}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                      browseCategory === cat
                        ? 'bg-[#6C63FF] text-white'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {cat === 'pre_workout' ? 'Pre-Workout' : cat === 'post_workout' ? 'Post-Workout' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>

              {/* Food items for selected category */}
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {combinedFoods.filter(f => f.category === browseCategory).map(food => (
                  <button
                    key={food.id}
                    onClick={() => handleAddConsumedFood(food.id)}
                    className="w-full text-left px-3 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] hover:border-[#6C63FF]/30 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 group-hover:text-white truncate">{food.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {food.nameLocal && (
                            <p className="text-[10px] text-slate-500">{food.nameLocal}</p>
                          )}
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                            food.type === 'vegan' ? 'bg-green-500/10 text-green-400' :
                            food.type === 'vegetarian' ? 'bg-emerald-500/10 text-emerald-400' :
                            food.type === 'eggetarian' ? 'bg-yellow-500/10 text-yellow-400' :
                            'bg-red-500/10 text-red-400'
                          }`}>
                            {food.type.replace('_', ' ')}
                          </span>
                          <span className="text-[9px] text-slate-600">{food.servingSize}</span>
                        </div>
                      </div>
                      <div className="text-right ml-3 shrink-0">
                        <p className="text-xs font-semibold text-white">{food.calories} kcal</p>
                        <p className="text-[10px] text-slate-500">{food.protein}P / {food.carbs}C / {food.fats}F</p>
                        <div className="flex gap-0.5 justify-end mt-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < food.healthRating ? 'bg-green-400' : 'bg-white/10'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Consumed totals */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xs text-slate-500">Calories</p>
            <p className="text-lg font-bold text-white">{consumedTotals.calories}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xs text-slate-500">Protein</p>
            <p className="text-lg font-bold text-[#6C63FF]">{consumedTotals.protein}g</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xs text-slate-500">Carbs</p>
            <p className="text-lg font-bold text-green-400">{consumedTotals.carbs}g</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xs text-slate-500">Fats</p>
            <p className="text-lg font-bold text-yellow-400">{consumedTotals.fats}g</p>
          </div>
        </div>

        {/* Remaining macros */}
        <div className="rounded-xl bg-[#6C63FF]/6 border border-[#6C63FF]/15 p-3 mt-4">
          <p className="text-xs text-[#6C63FF] font-semibold mb-1">🎯 Remaining for today</p>
          <p className="text-xs text-slate-300">{remaining.calories} kcal • {remaining.protein}g protein • {remaining.carbs}g carbs • {remaining.fats}g fats</p>
        </div>

        {/* Consumed foods list */}
        {consumedFoods.length > 0 && (
          <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
            <p className="text-xs text-slate-400 font-semibold mb-2">Your meals today</p>
            {consumedFoods.map((entry) => (
              <div key={entry.id} className="text-xs text-slate-300 flex justify-between bg-white/[0.05] rounded-lg px-3 py-2.5 items-center group">
                <div>
                  <span className="font-medium">{entry.name}</span>
                  <span className="text-slate-500"> × {entry.servings}</span>
                  <span className="text-slate-600 ml-2">{entry.calories} kcal</span>
                </div>
                <button
                  onClick={() => handleRemoveFood(entry.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} className="text-slate-400 hover:text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Stats Overview - Quick Check */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-3xl p-6"
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Target size={20} className="text-emerald-400" />
          Today's Summary
        </h3>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl bg-white/5 p-3 border border-white/10">
            <p className="text-xs text-slate-500 mb-1">Consumed</p>
            <p className="text-sm font-bold text-white">{consumedTotals.calories}/{mealPlan.targetCalories}</p>
            <p className="text-xs text-slate-600 mt-1">kcal</p>
          </div>
          <div className={`rounded-xl p-3 border ${
            consumedTotals.protein > mealPlan.targetProtein 
              ? 'bg-red-500/10 border-red-500/20' 
              : 'bg-white/5 border-white/10'
          }`}>
            <p className="text-xs text-slate-500 mb-1">Protein</p>
            <p className={`text-sm font-bold ${
              consumedTotals.protein > mealPlan.targetProtein ? 'text-red-400' : 'text-[#6C63FF]'
            }`}>
              {consumedTotals.protein}/{mealPlan.targetProtein}g
            </p>
            {consumedTotals.protein > mealPlan.targetProtein && (
              <p className="text-xs text-red-400 mt-1">+{consumedTotals.protein - mealPlan.targetProtein}g over</p>
            )}
          </div>
          <div className={`rounded-xl p-3 border ${
            consumedTotals.carbs > mealPlan.targetCarbs 
              ? 'bg-red-500/10 border-red-500/20' 
              : 'bg-white/5 border-white/10'
          }`}>
            <p className="text-xs text-slate-500 mb-1">Carbs</p>
            <p className={`text-sm font-bold ${
              consumedTotals.carbs > mealPlan.targetCarbs ? 'text-red-400' : 'text-green-400'
            }`}>
              {consumedTotals.carbs}/{mealPlan.targetCarbs}g
            </p>
            {consumedTotals.carbs > mealPlan.targetCarbs && (
              <p className="text-xs text-red-400 mt-1">+{consumedTotals.carbs - mealPlan.targetCarbs}g over</p>
            )}
          </div>
          <div className={`rounded-xl p-3 border ${
            consumedTotals.fats > mealPlan.targetFats 
              ? 'bg-red-500/10 border-red-500/20' 
              : 'bg-white/5 border-white/10'
          }`}>
            <p className="text-xs text-slate-500 mb-1">Fats</p>
            <p className={`text-sm font-bold ${
              consumedTotals.fats > mealPlan.targetFats ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {consumedTotals.fats}/{mealPlan.targetFats}g
            </p>
            {consumedTotals.fats > mealPlan.targetFats && (
              <p className="text-xs text-red-400 mt-1">+{consumedTotals.fats - mealPlan.targetFats}g over</p>
            )}
          </div>
        </div>

        {/* Exceeded Targets Alert */}
        {(consumedTotals.calories > mealPlan.targetCalories || 
          consumedTotals.protein > mealPlan.targetProtein || 
          consumedTotals.carbs > mealPlan.targetCarbs || 
          consumedTotals.fats > mealPlan.targetFats) && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 mt-4 flex items-start gap-2">
            <Zap size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-red-400">⚠️ You've exceeded your daily targets!</p>
              <p className="text-xs text-red-300/80 mt-1">
                {consumedTotals.calories > mealPlan.targetCalories && `+${consumedTotals.calories - mealPlan.targetCalories} kcal • `}
                {consumedTotals.protein > mealPlan.targetProtein && `Protein +${(consumedTotals.protein - mealPlan.targetProtein).toFixed(1)}g • `}
                {consumedTotals.carbs > mealPlan.targetCarbs && `Carbs +${(consumedTotals.carbs - mealPlan.targetCarbs).toFixed(1)}g • `}
                {consumedTotals.fats > mealPlan.targetFats && `Fats +${(consumedTotals.fats - mealPlan.targetFats).toFixed(1)}g`}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Macro Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Daily Targets</h2>
            <p className="text-xs text-slate-400">BMR: {nutritionSummary.bmr} • TDEE: {nutritionSummary.tdee}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-extrabold text-white">{mealPlan.targetCalories}</p>
            <p className="text-xs text-slate-400">target kcal</p>
          </div>
        </div>

        <div className="flex justify-around">
          {macroRing('Protein', mealPlan.targetProtein, mealPlan.targetProtein, '#6C63FF')}
          {macroRing('Carbs', mealPlan.targetCarbs, mealPlan.targetCarbs, '#22c55e')}
          {macroRing('Fats', mealPlan.targetFats, mealPlan.targetFats, '#f59e0b')}
        </div>

        <div className="mt-5 p-3 bg-[#6C63FF]/5 border border-[#6C63FF]/10 rounded-xl">
          <p className="text-xs text-slate-300 flex items-center gap-2">
            <Target size={12} className="text-[#6C63FF]" />
            Protein target: {nutritionSummary.proteinPerKg}g/kg — optimized for {user.goal.replace('_', ' ')}
          </p>
        </div>
      </motion.div>

      {/* Meal Plan */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Today's Meal Plan</h2>

        {mealPlan.meals.map((meal, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * idx }}
            className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.05] transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  {mealIcons[meal.type]}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{mealLabels[meal.type]}</h3>
                  <p className="text-[10px] text-slate-500">{meal.foods.length} items</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-white">{meal.totalCalories}</p>
                <p className="text-[10px] text-slate-500">kcal</p>
              </div>
            </div>

            {meal.foods.length > 0 ? (
              <div className="space-y-2">
                {meal.foods.map((food, fi) => (
                  <div key={fi} className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                      <Leaf size={10} className="text-green-400" />
                      <span className="text-sm text-slate-300">{food.name}</span>
                      {food.servings > 1 && (
                        <span className="text-[10px] text-slate-500">×{food.servings}</span>
                      )}
                    </div>
                    <div className="flex gap-4 text-[10px] text-slate-500">
                      <span>{food.calories} kcal</span>
                      <span className="text-[#6C63FF]">{food.protein}g P</span>
                      <span className="text-green-400">{food.carbs}g C</span>
                      <span className="text-yellow-400">{food.fats}g F</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No foods assigned — add your own!</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">Meal Plan Total</h3>
        <div className="flex justify-around text-center">
          <div>
            <p className="text-xl font-bold text-white">{totalMealCalories}</p>
            <p className="text-xs text-slate-500">Calories</p>
          </div>
          <div>
            <p className="text-xl font-bold text-[#6C63FF]">
              {mealPlan.meals.reduce((s, m) => s + m.totalProtein, 0)}g
            </p>
            <p className="text-xs text-slate-500">Protein</p>
          </div>
          <div>
            <p className="text-xl font-bold text-green-400">
              {mealPlan.meals.reduce((s, m) => s + m.foods.reduce((fs, f) => fs + f.carbs, 0), 0)}g
            </p>
            <p className="text-xs text-slate-500">Carbs</p>
          </div>
          <div>
            <p className="text-xl font-bold text-yellow-400">
              {mealPlan.meals.reduce((s, m) => s + m.foods.reduce((fs, f) => fs + f.fats, 0), 0)}g
            </p>
            <p className="text-xs text-slate-500">Fats</p>
          </div>
        </div>
      </div>

      {/* Next meal suggestions */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">Next meal suggestions</h3>
        <div className="space-y-2">
          {suggestions.map((food) => (
            <div key={food.id} className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.05] px-3 py-2">
              <p className="text-sm text-slate-200">{food.name}</p>
              <p className="text-[11px] text-slate-500">{food.calories} kcal • {food.protein}P/{food.carbs}C/{food.fats}F</p>
            </div>
          ))}
        </div>
      </div>

      {/* Diet Info */}
      <div className="bg-[#6C63FF]/5 border border-[#6C63FF]/10 rounded-2xl p-5">
        <p className="text-xs text-[#6C63FF] font-semibold mb-2">📋 About Your Plan</p>
        <p className="text-sm text-slate-300 leading-relaxed">
          Your nutrition plan uses <strong>carb cycling</strong> — higher carbs on training days for performance,
          lower carbs on rest days for fat burning. All food recommendations are sourced from
          <strong> {user.city}</strong> with local options you can actually find.
          Protein is set at <strong>{nutritionSummary.proteinPerKg}g/kg</strong>, optimized for {user.goal.replace('_', ' ')}.
        </p>
      </div>

    </div>
  );
}
