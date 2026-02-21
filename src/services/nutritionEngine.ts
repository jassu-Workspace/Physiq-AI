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

// Select foods for a meal
function selectFoodsForMeal(
    category: FoodItem['category'],
    dietType: UserProfile['dietType'],
    targetCalories: number,
    targetProtein: number,
): { foodId: string; name: string; servings: number; calories: number; protein: number; carbs: number; fats: number }[] {
    const type = dietType === 'non_vegetarian' ? 'any' : dietType;
    const available = getMealPlanFoods(type as any, category);

    if (available.length === 0) return [];

    const sorted = [...available].sort((a, b) => {
        const scoreA = a.healthRating * 2 + (a.protein / Math.max(a.calories, 1)) * 100;
        const scoreB = b.healthRating * 2 + (b.protein / Math.max(b.calories, 1)) * 100;
        return scoreB - scoreA;
    });

    const selected: { foodId: string; name: string; servings: number; calories: number; protein: number; carbs: number; fats: number }[] = [];
    let remainingCals = targetCalories;

    const count = Math.min(3, sorted.length);
    for (let i = 0; i < count && remainingCals > 50; i++) {
        const food = sorted[i % sorted.length];
        const servings = Math.max(1, Math.round(remainingCals / food.calories * 0.6));
        const actualServings = Math.min(servings, 2);

        selected.push({
            foodId: food.id,
            name: food.name,
            servings: actualServings,
            calories: Math.round(food.calories * actualServings),
            protein: Math.round(food.protein * actualServings),
            carbs: Math.round(food.carbs * actualServings),
            fats: Math.round(food.fats * actualServings),
        });

        remainingCals -= food.calories * actualServings;
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

    // Distribute food calories across meals (adjusted for supplement intake)
    const mealDistribution = {
        breakfast: 0.25,
        pre_workout: 0.10,
        lunch: 0.30,
        post_workout: 0.10,
        dinner: 0.20,
        snack: 0.05,
    };

    const meals: PlannedMeal[] = Object.entries(mealDistribution).map(([type, ratio]) => {
        const targetCals = Math.round(foodCalorieTarget * ratio);
        const targetProtein = Math.round(foodProteinTarget * ratio);
        const foods = selectFoodsForMeal(
            type as FoodItem['category'],
            user.dietType,
            targetCals,
            targetProtein,
        );

        return {
            type: type as PlannedMeal['type'],
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

    return [...options]
        .sort((a, b) => {
            const scoreA =
                Math.abs(remaining.protein - a.protein) * 2 +
                Math.abs(remaining.carbs - a.carbs) +
                Math.abs(remaining.fats - a.fats) +
                Math.abs(remaining.calories - a.calories) * 0.3 -
                a.healthRating * 3;

            const scoreB =
                Math.abs(remaining.protein - b.protein) * 2 +
                Math.abs(remaining.carbs - b.carbs) +
                Math.abs(remaining.fats - b.fats) +
                Math.abs(remaining.calories - b.calories) * 0.3 -
                b.healthRating * 3;

            return scoreA - scoreB;
        })
        .slice(0, 3);
}
