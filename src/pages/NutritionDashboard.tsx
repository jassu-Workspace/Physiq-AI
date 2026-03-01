import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Utensils, Flame, Droplets, Zap, Clock, Target, Apple, Coffee, Sun, Moon, MapPin, Leaf, X } from 'lucide-react';
import { type UserProfile } from '../services/store';
import { generateMealPlan, getNutritionSummary, suggestNextMealFoods } from '../services/nutritionEngine';
import { combinedFoods, type FoodItem } from '../data/combinedFoods';
import { addDoc, collection, deleteDoc, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from '../services/firebase';

interface NutritionDashboardProps {
  user: UserProfile;
}

interface FoodLogEntry {
  id: string;
  userId: string;
  foodId: string;
  name: string;
  quantityUnits: number;
  unitGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  createdAt: number;
  dateKey: string;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
  expiresAt: number;
}

function getLocalDateKey(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function NutritionDashboard({ user }: NutritionDashboardProps) {
  const nutritionSummary = getNutritionSummary(user);
  const mealPlan = useMemo(() => generateMealPlan(user), [user]);
  const [foodSearch, setFoodSearch] = useState('');
  const [quantityUnits, setQuantityUnits] = useState(1);
  const [selectedFoodId, setSelectedFoodId] = useState<string>('');
  const [consumedFoods, setConsumedFoods] = useState<FoodLogEntry[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [browseCategory, setBrowseCategory] = useState<FoodItem['category']>('breakfast');
  const [showBrowse, setShowBrowse] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; triggerKey: number }>({ open: false, message: '', triggerKey: 0 });
  const [hydrationDocId, setHydrationDocId] = useState<string | null>(null);
  const [hydrationMl, setHydrationMl] = useState(0);
  const hydrationGoalMl = Math.max(1000, (user.waterIntakeGoal || 3) * 1000);
  const hydrationPct = Math.min(100, Math.round((hydrationMl / hydrationGoalMl) * 100));

  const selectedFood = useMemo(() => combinedFoods.find(f => f.id === selectedFoodId) || null, [selectedFoodId]);

  const triggerSnackbar = (message: string) => {
    setSnackbar((prev) => ({ open: true, message, triggerKey: prev.triggerKey + 1 }));
  };

  useEffect(() => {
    if (!snackbar.open) return;
    const timer = window.setTimeout(() => {
      setSnackbar((prev) => ({ ...prev, open: false }));
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [snackbar.open, snackbar.triggerKey]);

  useEffect(() => {
    let shownByScroll = false;
    const onScroll = () => {
      const scrolledTop = window.scrollY || document.documentElement.scrollTop || 0;
      if (scrolledTop > 80 && !shownByScroll) {
        shownByScroll = true;
        triggerSnackbar('Tip: Add foods with quantity (1 unit = 100g).');
      }
    };
    document.addEventListener('scroll', onScroll, true);
    return () => document.removeEventListener('scroll', onScroll, true);
  }, []);

  useEffect(() => {
    const loadFoodLogs = async () => {
      if (!user.id) return;
      try {
        const now = Date.now();
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        const snapshots = await getDocs(query(collection(db, 'food_intake_logs'), where('user_id', '==', user.id)));

        const rows = snapshots.docs.map((item) => ({ id: item.id, ...(item.data() as any) }));
        const expiredRows = rows.filter(row => Number(row.expires_at || 0) > 0 && Number(row.expires_at) <= now);

        if (expiredRows.length > 0) {
          await Promise.all(expiredRows.map((row) => deleteDoc(doc(db, 'food_intake_logs', row.id)).catch(() => undefined)));
        }

        const validRows = rows
          .filter(row => Number(row.created_at || 0) >= sevenDaysAgo && Number(row.expires_at || now + 1) > now)
          .sort((a, b) => Number(b.created_at || 0) - Number(a.created_at || 0));

        setConsumedFoods(validRows.map((row) => ({
          id: row.id,
          userId: String(row.user_id || user.id),
          foodId: String(row.food_id || ''),
          name: String(row.name || 'Food'),
          quantityUnits: Number(row.quantity_units ?? row.servings ?? 1) || 1,
          unitGrams: Number(row.unit_grams ?? 100) || 100,
          calories: Number(row.calories ?? 0) || 0,
          protein: Number(row.protein ?? 0) || 0,
          carbs: Number(row.carbs ?? 0) || 0,
          fats: Number(row.fats ?? 0) || 0,
          createdAt: Number(row.created_at ?? now) || now,
          dateKey: String(row.date_key || getLocalDateKey(Number(row.created_at ?? now) || now)),
          targetCalories: Number(row.target_calories ?? mealPlan.targetCalories) || mealPlan.targetCalories,
          targetProtein: Number(row.target_protein ?? mealPlan.targetProtein) || mealPlan.targetProtein,
          targetCarbs: Number(row.target_carbs ?? mealPlan.targetCarbs) || mealPlan.targetCarbs,
          targetFats: Number(row.target_fats ?? mealPlan.targetFats) || mealPlan.targetFats,
          expiresAt: Number(row.expires_at ?? now + 7 * 24 * 60 * 60 * 1000) || (now + 7 * 24 * 60 * 60 * 1000),
        })));
      } catch (error) {
        console.error('Failed to load food history:', error);
      }
    };

    void loadFoodLogs();
  }, [user.id]);

  useEffect(() => {
    const loadHydration = async () => {
      if (!user.id) return;
      const dateKey = getLocalDateKey(Date.now());

      try {
        const rows = await getDocs(query(
          collection(db, 'daily_checkins'),
          where('user_id', '==', user.id),
          where('date_key', '==', dateKey)
        ));

        if (rows.empty) {
          setHydrationDocId(null);
          setHydrationMl(0);
          return;
        }

        const first = rows.docs[0];
        setHydrationDocId(first.id);
        setHydrationMl(Number(first.data().hydration_ml ?? first.data().total_ml ?? 0));
      } catch (error) {
        console.error('Failed to load hydration:', error);
      }
    };

    void loadHydration();
  }, [user.id]);

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

  const todayKey = getLocalDateKey(Date.now());
  const todayFoods = consumedFoods.filter((entry) => entry.dateKey === todayKey);

  const consumedTotals = todayFoods.reduce((acc, item) => {
    acc.calories += item.calories;
    acc.protein += item.protein;
    acc.carbs += item.carbs;
    acc.fats += item.fats;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const historyByDay = useMemo(() => {
    const grouped = new Map<string, FoodLogEntry[]>();
    consumedFoods.forEach((entry) => {
      const existing = grouped.get(entry.dateKey) || [];
      existing.push(entry);
      grouped.set(entry.dateKey, existing);
    });
    return Array.from(grouped.entries())
      .sort((a, b) => (a[0] > b[0] ? -1 : 1))
      .slice(0, 7)
      .map(([dateKey, entries]) => {
        const totals = entries.reduce((acc, item) => {
          acc.calories += item.calories;
          acc.protein += item.protein;
          acc.carbs += item.carbs;
          acc.fats += item.fats;
          return acc;
        }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
        const sample = entries[0];
        return {
          dateKey,
          entries,
          totals,
          goals: {
            calories: sample?.targetCalories ?? mealPlan.targetCalories,
            protein: sample?.targetProtein ?? mealPlan.targetProtein,
            carbs: sample?.targetCarbs ?? mealPlan.targetCarbs,
            fats: sample?.targetFats ?? mealPlan.targetFats,
          }
        };
      });
  }, [consumedFoods, mealPlan.targetCalories, mealPlan.targetProtein, mealPlan.targetCarbs, mealPlan.targetFats]);

  const remaining = {
    calories: Math.max(0, mealPlan.targetCalories - consumedTotals.calories),
    protein: Math.max(0, mealPlan.targetProtein - consumedTotals.protein),
    carbs: Math.max(0, mealPlan.targetCarbs - consumedTotals.carbs),
    fats: Math.max(0, mealPlan.targetFats - consumedTotals.fats),
  };

  const suggestions = useMemo(() => suggestNextMealFoods(user, remaining, 'dinner'), [user, remaining.calories, remaining.protein, remaining.carbs, remaining.fats]);

  useEffect(() => {
    const applySearch = (queryText: string) => {
      const value = queryText.trim();
      if (!value) return;

      setFoodSearch(value);
      setShowSuggestions(true);

      const exactMatch = combinedFoods.find(
        (food) =>
          food.name.toLowerCase() === value.toLowerCase() ||
          food.nameLocal?.toLowerCase() === value.toLowerCase()
      );

      setSelectedFoodId(exactMatch?.id || '');
    };

    const onGlobalSearch = (event: Event) => {
      const custom = event as CustomEvent<{ query?: string; targetTab?: string; timestamp?: number }>;
      const targetTab = custom.detail?.targetTab;
      const queryText = custom.detail?.query;
      if (!queryText) return;
      if (targetTab && targetTab !== 'nutrition') return;
      applySearch(queryText);
    };

    window.addEventListener('app:global-search', onGlobalSearch as EventListener);

    try {
      const stored = window.localStorage.getItem('app:global-search:last');
      if (stored) {
        const parsed = JSON.parse(stored) as { query?: string; targetTab?: string; timestamp?: number };
        const isFresh = typeof parsed.timestamp === 'number' && Date.now() - parsed.timestamp < 15000;
        if (isFresh && parsed.query && (!parsed.targetTab || parsed.targetTab === 'nutrition')) {
          applySearch(parsed.query);
        }
      }
    } catch {
      // Ignore malformed or unavailable storage.
    }

    return () => {
      window.removeEventListener('app:global-search', onGlobalSearch as EventListener);
    };
  }, []);

  const handleSelectFood = (foodId: string) => {
    const food = combinedFoods.find(f => f.id === foodId);
    if (!food) return;
    setSelectedFoodId(food.id);
    setFoodSearch(food.name);
    setShowSuggestions(false);
  };

  const handleAddConsumedFood = async (foodId: string) => {
    const food = combinedFoods.find(f => f.id === foodId);
    if (!food) return;
    if (!user.id) return;

    const qty = Math.max(1, Math.floor(quantityUnits));
    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000;
    const entryPayload = {
      user_id: user.id,
      food_id: food.id,
      name: food.name,
      quantity_units: qty,
      unit_grams: 100,
      calories: Math.round(food.calories * qty),
      protein: Math.round(food.protein * qty),
      carbs: Math.round(food.carbs * qty),
      fats: Math.round(food.fats * qty),
      created_at: now,
      date_key: getLocalDateKey(now),
      target_calories: mealPlan.targetCalories,
      target_protein: mealPlan.targetProtein,
      target_carbs: mealPlan.targetCarbs,
      target_fats: mealPlan.targetFats,
      expires_at: expiresAt,
    };

    try {
      const added = await addDoc(collection(db, 'food_intake_logs'), entryPayload);
      const newEntry: FoodLogEntry = {
        id: added.id,
        userId: entryPayload.user_id,
        foodId: entryPayload.food_id,
        name: entryPayload.name,
        quantityUnits: entryPayload.quantity_units,
        unitGrams: entryPayload.unit_grams,
        calories: entryPayload.calories,
        protein: entryPayload.protein,
        carbs: entryPayload.carbs,
        fats: entryPayload.fats,
        createdAt: entryPayload.created_at,
        dateKey: entryPayload.date_key,
        targetCalories: entryPayload.target_calories,
        targetProtein: entryPayload.target_protein,
        targetCarbs: entryPayload.target_carbs,
        targetFats: entryPayload.target_fats,
        expiresAt: entryPayload.expires_at,
      };
      setConsumedFoods(prev => [newEntry, ...prev]);
      setFoodSearch('');
      setSelectedFoodId('');
      setShowSuggestions(false);
      triggerSnackbar(`${food.name} added (${qty} x 100g).`);
    } catch (error) {
      console.error('Failed to save consumed food:', error);
      triggerSnackbar('Could not save food. Please try again.');
    }
  };

  const handleRemoveFood = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'food_intake_logs', id));
      setConsumedFoods(prev => prev.filter(f => f.id !== id));
      triggerSnackbar('Food entry removed.');
    } catch (error) {
      console.error('Failed to remove food entry:', error);
      triggerSnackbar('Could not remove entry.');
    }
  };

  const updateHydration = async (deltaMl: number) => {
    if (!user.id) return;

    const nextMl = Math.max(0, hydrationMl + deltaMl);
    const now = Date.now();
    const dateKey = getLocalDateKey(now);

    try {
      if (hydrationDocId) {
        await setDoc(doc(db, 'daily_checkins', hydrationDocId), {
          hydration_ml: nextMl,
          total_ml: nextMl,
          hydration_goal_ml: hydrationGoalMl,
          updated_at: now,
        }, { merge: true });
      } else {
        const newRef = doc(collection(db, 'daily_checkins'));
        await setDoc(newRef, {
          user_id: user.id,
          date_key: dateKey,
          date: now,
          hydration_ml: nextMl,
          total_ml: nextMl,
          hydration_goal_ml: hydrationGoalMl,
          created_at: now,
          updated_at: now,
        });
        setHydrationDocId(newRef.id);
      }

      setHydrationMl(nextMl);
      triggerSnackbar(`Hydration updated: ${nextMl} ml`);
    } catch (error) {
      console.error('Failed to update hydration:', error);
      triggerSnackbar('Could not update hydration.');
    }
  };

  const pct = (current: number, target: number) => Math.min(100, Math.round((current / Math.max(target, 1)) * 100));
  const caloriesPct = pct(consumedTotals.calories, mealPlan.targetCalories);
  const proteinPct = pct(consumedTotals.protein, mealPlan.targetProtein);
  const carbsPct = pct(consumedTotals.carbs, mealPlan.targetCarbs);
  const fatsPct = pct(consumedTotals.fats, mealPlan.targetFats);

  const recentToday = [...todayFoods].sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dailyMap = new Map<string, number>();
  historyByDay.forEach((d) => dailyMap.set(d.dateKey, d.totals.calories));
  const maxDaily = Math.max(1, ...historyByDay.map((d) => d.totals.calories));
  const bars = weekDays.map((label, idx) => {
    const date = new Date();
    const mondayOffset = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - mondayOffset + idx);
    const key = getLocalDateKey(date.getTime());
    const kcal = dailyMap.get(key) || 0;
    return { label, kcal, height: Math.max(10, Math.round((kcal / maxDaily) * 100)) };
  });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <div className="mb-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900">
            <Utensils className="text-blue-600" size={28} /> Nutrition Tracker
          </h1>
          <p className="mt-1 text-sm text-slate-500">Track your daily fuel and hit your macro goals.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHistory((prev) => !prev)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Recent Meals
          </button>
          <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">Add Food</button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_180px_auto] md:items-end">
          <div className="relative">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Food Item</label>
            <input
              type="text"
              value={foodSearch}
              onChange={(e) => {
                setFoodSearch(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="e.g. Grilled Chicken Breast"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
            />
            {showSuggestions && filteredFoods.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                {filteredFoods.map((food) => (
                  <button
                    key={food.id}
                    onClick={() => handleSelectFood(food.id)}
                    className="w-full border-b border-slate-100 px-4 py-2.5 text-left last:border-b-0 hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{food.name}</p>
                        {food.nameLocal && <p className="text-xs text-slate-500">{food.nameLocal}</p>}
                      </div>
                      <p className="text-xs text-slate-500">{food.calories} kcal</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Quantity</label>
            <div className="flex rounded-lg border border-slate-200 bg-slate-50">
              <input
                type="number"
                min={1}
                value={quantityUnits}
                onChange={(e) => setQuantityUnits(Math.max(1, Number(e.target.value)))}
                className="w-full border-none bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none"
              />
              <span className="border-l border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-500">100g</span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Meal Type</label>
            <select
              value={browseCategory}
              onChange={(e) => setBrowseCategory(e.target.value as FoodItem['category'])}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
              <option value="pre_workout">Pre-Workout</option>
              <option value="post_workout">Post-Workout</option>
            </select>
          </div>

          <button
            onClick={() => {
              if (selectedFoodId) {
                void handleAddConsumedFood(selectedFoodId);
                return;
              }
              if (foodSearch.trim() && filteredFoods.length > 0) {
                void handleAddConsumedFood(filteredFoods[0].id);
              }
            }}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700"
          >
            Log
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Calories', current: consumedTotals.calories, target: mealPlan.targetCalories, color: 'text-blue-600', note: `${remaining.calories} left` },
              { label: 'Protein', current: consumedTotals.protein, target: mealPlan.targetProtein, color: 'text-purple-600', note: proteinPct >= 90 ? 'On Target' : 'Keep Going' },
              { label: 'Carbs', current: consumedTotals.carbs, target: mealPlan.targetCarbs, color: 'text-orange-500', note: carbsPct < 60 ? 'Low Intake' : 'On Track' },
              { label: 'Fats', current: consumedTotals.fats, target: mealPlan.targetFats, color: 'text-amber-500', note: fatsPct > 100 ? 'Over Target' : 'Moderate' },
            ].map((item) => {
              const progress = pct(item.current, item.target);
              return (
                <div key={item.label} className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-slate-500">{item.label}</h3>
                  <div className="relative h-24 w-24">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={`${progress}, 100`} className={item.color} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-sm font-bold text-slate-900">{item.current}{item.label === 'Calories' ? '' : 'g'}</span>
                      <span className="text-[10px] text-slate-500">of {item.target}{item.label === 'Calories' ? '' : 'g'}</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs font-medium text-slate-600">{item.note}</p>
                </div>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <h2 className="text-lg font-bold text-slate-900">Daily Log</h2>
              <button className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">•••</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">Food Item</th>
                    <th className="px-4 py-3 font-medium">Qty</th>
                    <th className="px-4 py-3 font-medium">Prot</th>
                    <th className="px-4 py-3 font-medium">Carb</th>
                    <th className="px-4 py-3 font-medium">Fat</th>
                    <th className="px-4 py-3 font-medium">Kcal</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {recentToday.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">No foods logged today.</td>
                    </tr>
                  )}
                  {recentToday.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500">{new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-4 py-3 font-medium">{entry.name}</td>
                      <td className="px-4 py-3">{entry.quantityUnits} unit</td>
                      <td className="px-4 py-3 font-medium text-purple-600">{entry.protein}g</td>
                      <td className="px-4 py-3 font-medium text-orange-500">{entry.carbs}g</td>
                      <td className="px-4 py-3 font-medium text-amber-500">{entry.fats}g</td>
                      <td className="px-4 py-3 font-bold">{entry.calories}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => void handleRemoveFood(entry.id)} className="text-slate-400 hover:text-red-500">
                          <X size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {showHistory && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Recent Meals (7 days)</h3>
              <div className="space-y-2">
                {historyByDay.map((day) => (
                  <div key={day.dateKey} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                    <span className="font-semibold">{day.dateKey}</span> • {day.entries.length} entries • {day.totals.calories} kcal • {day.totals.protein}P/{day.totals.carbs}C/{day.totals.fats}F
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">7-Day History</h3>
            </div>
            <div className="flex h-44 items-end justify-between gap-2 px-1">
              {bars.map((bar) => (
                <div key={bar.label} className="flex w-full flex-col items-center gap-2">
                  <div className="relative flex h-32 w-full items-end overflow-hidden rounded-t-sm bg-blue-100">
                    <div className="w-full rounded-t-sm bg-blue-600" style={{ height: `${bar.height}%` }} />
                  </div>
                  <span className="text-xs text-slate-500">{bar.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
            <div className="relative z-10">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">Hydration</h3>
                  <p className="text-sm text-blue-100">Daily Goal: {hydrationGoalMl}ml</p>
                </div>
                <div className="rounded-lg bg-white/20 p-2">
                  <Droplets size={16} />
                </div>
              </div>
              <div className="mb-3 flex items-end gap-2">
                <span className="text-4xl font-bold">{hydrationMl}</span>
                <span className="mb-1 text-blue-100">ml consumed</span>
              </div>
              <div className="mb-4 h-2 w-full rounded-full bg-blue-800/30">
                <div className="h-2 rounded-full bg-white" style={{ width: `${hydrationPct}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => void updateHydration(250)}
                  className="rounded-lg bg-white/20 py-2 text-xs font-semibold hover:bg-white/30"
                >
                  +250ml
                </button>
                <button
                  onClick={() => void updateHydration(500)}
                  className="rounded-lg bg-white/20 py-2 text-xs font-semibold hover:bg-white/30"
                >
                  +500ml
                </button>
                <button
                  onClick={() => void updateHydration(-250)}
                  className="rounded-lg bg-white/20 py-2 text-xs font-semibold hover:bg-white/30"
                >
                  -250ml
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-bold text-slate-900">Recommended Dinner</h3>
            {suggestions[0] ? (
              <div className="flex items-start gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Apple size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">{suggestions[0].name}</h4>
                  <div className="mt-1 mb-2 flex gap-2">
                    <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] text-green-700">High Protein</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">{suggestions[0].calories} kcal</span>
                  </div>
                  <button className="text-xs font-semibold text-blue-600 hover:underline">View Recipe</button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No recommendation available yet.</p>
            )}
          </div>
        </div>
      </div>

      {snackbar.open && (
        <motion.div
          key={snackbar.triggerKey}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-xl"
        >
          {snackbar.message}
        </motion.div>
      )}
    </div>
  );
}
