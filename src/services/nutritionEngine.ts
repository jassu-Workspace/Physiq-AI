// Nutrition Intelligence Engine
// BMR, TDEE, macro targets, supplement-aware meal plans with hyperlocal food

import { type UserProfile, type DietPlan, type PlannedMeal, getSupplementProtein, getSupplementCalories, getTodaySchedule } from './store';
import { combinedFoods, getMealPlanFoods, type FoodItem } from '../data/combinedFoods';

// Mifflin-St Jeor BMR
export function calculateBMR(weight: number, height: number, age: number, gender: string): number {
    if (gender === 'male') {
        return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
    }
    return Math.round(10 * weight + 6.25 * height - 5 * age - 161);
}

// Activity multiplier
const activityMultipliers: Record<number, number> = {
    1: 1.2,
    2: 1.375,
    3: 1.55,
    4: 1.65,
    5: 1.725,
    6: 1.9,
    7: 1.9,
};

export function calculateTDEE(bmr: number, daysPerWeek: number): number {
    const multiplier = activityMultipliers[Math.min(daysPerWeek, 7)] || 1.55;
    return Math.round(bmr * multiplier);
}

// Macro targets based on goal
interface MacroTargets {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
}

export function calculateMacroTargets(
    tdee: number,
    weight: number,
    goal: UserProfile['goal']
): MacroTargets {
    let calories: number;
    let proteinPerKg: number;
    let fatPercent: number;

    switch (goal) {
        case 'muscle_gain':
            calories = tdee + 300;
            proteinPerKg = 2.0;
            fatPercent = 0.25;
            break;
        case 'fat_loss':
            calories = tdee - 400;
            proteinPerKg = 2.2;
            fatPercent = 0.25;
            break;
        case 'strength':
            calories = tdee + 200;
            proteinPerKg = 1.8;
            fatPercent = 0.30;
            break;
        case 'maintenance':
            calories = tdee;
            proteinPerKg = 1.6;
            fatPercent = 0.28;
            break;
        case 'endurance':
            calories = tdee + 100;
            proteinPerKg = 1.4;
            fatPercent = 0.22;
            break;
        default:
            calories = tdee;
            proteinPerKg = 1.8;
            fatPercent = 0.25;
    }

    const protein = Math.round(weight * proteinPerKg);
    const fats = Math.round((calories * fatPercent) / 9);
    const remainingCals = calories - (protein * 4 + fats * 9);
    const carbs = Math.round(remainingCals / 4);

    return { calories, protein, carbs: Math.max(carbs, 50), fats };
}

// Carb cycling — now uses customSchedule to determine training day
export function getCarbCycleDay(
    user: UserProfile
): 'high' | 'medium' | 'low' {
    const { schedule: todaySchedule } = getTodaySchedule(user.customSchedule);
    const isTrainingDay = !todaySchedule.isRestDay && todaySchedule.sessions.length > 0;

    if (user.goal === 'fat_loss') {
        return isTrainingDay ? 'medium' : 'low';
    }
    if (user.goal === 'muscle_gain') {
        return isTrainingDay ? 'high' : 'medium';
    }
    return isTrainingDay ? 'high' : 'medium';
}

type MealMacroTarget = {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
};

type MealFood = { foodId: string; name: string; servings: number; calories: number; protein: number; carbs: number; fats: number };

const personalityTuning: Record<UserProfile['userType'], { varietyBoost: number; densityBias: number; cleanFoodBias: number; prepBias: number }> = {
    disciplined: { varietyBoost: 0.8, densityBias: 1.1, cleanFoodBias: 1.2, prepBias: 0.8 },
    struggler: { varietyBoost: 1.3, densityBias: 0.9, cleanFoodBias: 1.0, prepBias: 1.3 },
    analytical: { varietyBoost: 1.1, densityBias: 1.15, cleanFoodBias: 1.25, prepBias: 0.9 },
    competitive: { varietyBoost: 1.0, densityBias: 1.25, cleanFoodBias: 1.0, prepBias: 0.9 },
    unknown: { varietyBoost: 1.0, densityBias: 1.0, cleanFoodBias: 1.0, prepBias: 1.0 },
};

function hashString(input: string): number {
    let h = 2166136261;
    for (let i = 0; i < input.length; i++) {
        h ^= input.charCodeAt(i);
        h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return Math.abs(h >>> 0);
}

function seededUnit(seed: string, salt: string): number {
    return (hashString(`${seed}:${salt}`) % 10000) / 10000;
}

function getDateSeed(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function mealDistributionForUser(user: UserProfile, carbDay: 'high' | 'medium' | 'low'): Record<PlannedMeal['type'], number> {
    const base: Record<PlannedMeal['type'], number> = {
        breakfast: 0.24,
        pre_workout: 0.12,
        lunch: 0.30,
        post_workout: 0.12,
        dinner: 0.18,
        snack: 0.04,
    };

    if (user.goal === 'fat_loss') {
        base.snack = 0.03;
        base.dinner = 0.16;
        base.lunch = 0.33;
    }

    if (carbDay === 'low') {
        base.pre_workout = 0.09;
        base.post_workout = 0.08;
        base.dinner = 0.22;
    }

    if (user.userType === 'struggler') {
        // Slightly larger breakfast and dinner helps adherence.
        base.breakfast += 0.03;
        base.dinner += 0.03;
        base.snack = Math.max(0.02, base.snack - 0.02);
        base.pre_workout = Math.max(0.08, base.pre_workout - 0.02);
    }

    const total = Object.values(base).reduce((a, b) => a + b, 0);
    (Object.keys(base) as PlannedMeal['type'][]).forEach((k) => {
        base[k] = base[k] / total;
    });
    return base;
}

function macroGapScore(food: FoodItem, target: MealMacroTarget): number {
    const proteinGap = Math.abs(target.protein - food.protein);
    const carbsGap = Math.abs(target.carbs - food.carbs);
    const fatsGap = Math.abs(target.fats - food.fats);
    const calsGap = Math.abs(target.calories - food.calories);
    return proteinGap * 1.9 + carbsGap * 1.1 + fatsGap * 1.0 + calsGap * 0.22;
}

function profileFoodScore(food: FoodItem, user: UserProfile, target: MealMacroTarget, seedKey: string, usedIds: Set<string>): number {
    const tuning = personalityTuning[user.userType ?? 'unknown'];
    const proteinDensity = food.protein / Math.max(food.calories, 1);
    const cleanFood = food.healthRating + Math.min(food.fiber / 3, 2);

    const prepPenalty = (food.prepTime || 0) * 0.08 * tuning.prepBias;
    const noveltyPenalty = usedIds.has(food.id) ? 16 * tuning.varietyBoost : 0;
    const streetPenalty = food.isStreetFood ? 3 : 0;
    const densityReward = proteinDensity * 35 * tuning.densityBias;
    const cleanReward = cleanFood * 3.5 * tuning.cleanFoodBias;
    const seededNudge = seededUnit(seedKey, food.id) * 5;

    let goalAdjustment = 0;
    if (user.goal === 'fat_loss') {
        goalAdjustment += food.calories <= 250 ? 6 : -4;
    }
    if (user.goal === 'muscle_gain') {
        goalAdjustment += food.protein >= 12 ? 5 : -2;
    }
    if (user.goal === 'endurance') {
        goalAdjustment += food.carbs >= 20 ? 4 : -2;
    }

    return macroGapScore(food, target) + prepPenalty + streetPenalty + noveltyPenalty - densityReward - cleanReward - goalAdjustment - seededNudge;
}

function toMealFood(food: FoodItem, servings: number): MealFood {
    const s = Math.max(1, Math.min(3, Math.round(servings)));
    return {
        foodId: food.id,
        name: food.name,
        servings: s,
        calories: Math.round(food.calories * s),
        protein: Math.round(food.protein * s),
        carbs: Math.round(food.carbs * s),
        fats: Math.round(food.fats * s),
    };
}

function chooseServing(food: FoodItem, target: MealMacroTarget, candidateIndex: number): number {
    const calsBased = target.calories / Math.max(food.calories, 1);
    const proteinBased = target.protein > 0 ? target.protein / Math.max(food.protein, 1) : 1;
    const blended = candidateIndex === 0 ? (calsBased * 0.4 + proteinBased * 0.6) : calsBased * 0.6;
    return Math.max(1, Math.min(3, Math.round(blended * (candidateIndex === 0 ? 0.8 : 0.45))));
}

function buildTargetForMeal(total: MacroTargets, ratio: number): MealMacroTarget {
    return {
        calories: Math.round(total.calories * ratio),
        protein: Math.round(total.protein * ratio),
        carbs: Math.round(total.carbs * ratio),
        fats: Math.round(total.fats * ratio),
    };
}

function adjustMacrosForCarbCycle(
    macros: MacroTargets,
    carbDay: 'high' | 'medium' | 'low'
): MacroTargets {
    const multiplier = carbDay === 'high' ? 1.2 : carbDay === 'low' ? 0.7 : 1.0;
    const newCarbs = Math.round(macros.carbs * multiplier);
    const carbCalDiff = (newCarbs - macros.carbs) * 4;
    const newFats = Math.round(macros.fats - carbCalDiff / 9);

    return {
        calories: macros.calories,
        protein: macros.protein,
        carbs: newCarbs,
        fats: Math.max(newFats, 30),
    };
}

// Select foods for a meal with personality + day-based diversity
function selectFoodsForMeal(
    category: FoodItem['category'],
    user: UserProfile,
    target: MealMacroTarget,
    usedIds: Set<string>,
): MealFood[] {
    const type = user.dietType === 'non_vegetarian' ? 'any' : user.dietType;
    const available = getMealPlanFoods(type as any, category)
        .filter((food) => food.calories > 0 && food.protein >= 0);

    if (available.length === 0) return [];

    const seedKey = `${user.id}:${getDateSeed()}:${category}`;
    const sorted = [...available].sort((a, b) => {
        const scoreA = profileFoodScore(a, user, target, seedKey, usedIds);
        const scoreB = profileFoodScore(b, user, target, seedKey, usedIds);
        return scoreA - scoreB;
    });

    const selectionCount = user.userType === 'struggler' ? 2 : user.userType === 'analytical' ? 4 : 3;
    const selected: MealFood[] = [];
    const tokens = new Set<string>();

    for (const food of sorted) {
        if (selected.length >= selectionCount) break;
        const token = food.name.toLowerCase().split(' ')[0];
        if (tokens.has(token) && selected.length > 0) continue;

        const servings = chooseServing(food, target, selected.length);
        const mealFood = toMealFood(food, servings);
        selected.push(mealFood);
        usedIds.add(food.id);
        tokens.add(token);
    }

    if (selected.length === 0) {
        const fallback = sorted[0];
        if (fallback) {
            selected.push(toMealFood(fallback, chooseServing(fallback, target, 0)));
            usedIds.add(fallback.id);
        }
    }

    return selected;
}

// Generate meal plan — now supplement-aware
export function generateMealPlan(user: UserProfile): DietPlan {
    const bmr = calculateBMR(user.weight, user.height, user.age, user.gender);
    const tdee = calculateTDEE(bmr, user.daysPerWeek);
    const macros = calculateMacroTargets(tdee, user.weight, user.goal);

    const carbDay = getCarbCycleDay(user);
    const adjustedMacros = adjustMacrosForCarbCycle(macros, carbDay);

    // Subtract supplement protein & calories from food targets
    const supplementProtein = getSupplementProtein(user.supplements);
    const supplementCalories = getSupplementCalories(user.supplements);
    const foodProteinTarget = Math.max(adjustedMacros.protein - supplementProtein, 50);
    const foodCalorieTarget = adjustedMacros.calories - supplementCalories;

    const mealDistribution = mealDistributionForUser(user, carbDay);
    const usedIds = new Set<string>();

    const foodTargets: MacroTargets = {
        calories: foodCalorieTarget,
        protein: foodProteinTarget,
        carbs: adjustedMacros.carbs,
        fats: adjustedMacros.fats,
    };

    const meals: PlannedMeal[] = (Object.entries(mealDistribution) as [PlannedMeal['type'], number][]).map(([type, ratio]) => {
        const mealTarget = buildTargetForMeal(foodTargets, ratio);
        const foods = selectFoodsForMeal(
            type,
            user,
            mealTarget,
            usedIds,
        );

        return {
            type,
            foods,
            totalCalories: foods.reduce((s, f) => s + f.calories, 0),
            totalProtein: foods.reduce((s, f) => s + f.protein, 0),
        };
    });

    return {
        id: 'diet_' + Date.now(),
        userId: user.id,
        date: Date.now(),
        targetCalories: adjustedMacros.calories,
        targetProtein: adjustedMacros.protein,
        targetCarbs: adjustedMacros.carbs,
        targetFats: adjustedMacros.fats,
        supplementProtein,
        foodProteinTarget,
        carbCycleDay: carbDay,
        meals,
    };
}

// Nutrition summary with supplement awareness
export function getNutritionSummary(user: UserProfile) {
    const bmr = calculateBMR(user.weight, user.height, user.age, user.gender);
    const tdee = calculateTDEE(bmr, user.daysPerWeek);
    const macros = calculateMacroTargets(tdee, user.weight, user.goal);
    const supplementProtein = getSupplementProtein(user.supplements);
    const supplementCalories = getSupplementCalories(user.supplements);

    return {
        bmr,
        tdee,
        ...macros,
        proteinPerKg: Math.round(macros.protein / user.weight * 10) / 10,
        supplementProtein,
        supplementCalories,
        foodProteinTarget: macros.protein - supplementProtein,
    };
}

// Supplement timing summary
export function getSupplementSchedule(user: UserProfile): { time: string; supplements: string[] }[] {
    const schedule: { time: string; supplements: string[] }[] = [];
    const sups = user.supplements;

    // Morning
    const morning: string[] = [];
    if (sups.creatine.takes) morning.push(`Creatine ${sups.creatine.dailyGrams}g`);
    if (sups.multivitamin.takes) morning.push('Multivitamin');
    if (sups.fishOil.takes) morning.push('Fish Oil / Omega-3');
    if (morning.length > 0) schedule.push({ time: '🌅 Morning', supplements: morning });

    // Pre-workout
    const preWorkout: string[] = [];
    if (sups.preWorkout.takes) preWorkout.push('Pre-Workout');
    if (sups.bcaa.takes) preWorkout.push('BCAAs');
    if (preWorkout.length > 0) schedule.push({ time: '⚡ Pre-Workout', supplements: preWorkout });

    // Post-workout
    const postWorkout: string[] = [];
    if (sups.wheyProtein.takes) {
        postWorkout.push(`Whey Protein ${sups.wheyProtein.servingsPerDay} scoop(s) (${sups.wheyProtein.proteinPerServing * sups.wheyProtein.servingsPerDay}g protein)`);
    }
    if (postWorkout.length > 0) schedule.push({ time: '💪 Post-Workout', supplements: postWorkout });

    return schedule;
}

export function suggestNextMealFoods(
    user: UserProfile,
    remaining: { calories: number; protein: number; carbs: number; fats: number },
    category: FoodItem['category'] = 'dinner'
): FoodItem[] {
    const type = user.dietType === 'non_vegetarian' ? 'any' : user.dietType;
    const options = getMealPlanFoods(type as any, category);

    const target: MealMacroTarget = {
        calories: Math.max(150, remaining.calories / 2),
        protein: Math.max(8, remaining.protein / 2),
        carbs: Math.max(8, remaining.carbs / 2),
        fats: Math.max(3, remaining.fats / 2),
    };

    const seedKey = `${user.id}:${getDateSeed()}:next:${category}`;
    const sorted = [...options].sort((a, b) => {
        const scoreA = profileFoodScore(a, user, target, seedKey, new Set());
        const scoreB = profileFoodScore(b, user, target, seedKey, new Set());
        return scoreA - scoreB;
    });

    const picked: FoodItem[] = [];
    const seen = new Set<string>();
    for (const food of sorted) {
        if (picked.length >= 6) break;
        const token = food.name.toLowerCase().split(' ')[0];
        if (seen.has(token)) continue;
        picked.push(food);
        seen.add(token);
    }

    return picked;
}
