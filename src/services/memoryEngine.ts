/**
 * Memory Engine — Milestones, PRs, and Contextual Recall
 * Level 3 (Personal Memory) of the Personalization Pyramid
 */

import { type WorkoutLog, type UserProfile } from './store';

export interface Milestone {
    id: string;
    type: 'streak' | 'workout_count' | 'volume' | 'pr' | 'consistency';
    label: string;
    date: number;
    value?: number;
}

export interface BestLift {
    exerciseId: string;
    exerciseName: string;
    weight: number;
    reps: number;
    date: number;
}

/**
 * Extracts all Personal Records (PRs) from the workout history
 */
export function getBestLifts(history: WorkoutLog[]): BestLift[] {
    const bests: Record<string, BestLift> = {};

    history.forEach(workout => {
        workout.exercises.forEach(ex => {
            ex.sets.forEach(set => {
                const currentBest = bests[ex.exerciseId];
                // Comparison: Higher weight first, then higher reps if weight is same
                if (!currentBest || set.weight > currentBest.weight || (set.weight === currentBest.weight && set.reps > currentBest.reps)) {
                    bests[ex.exerciseId] = {
                        exerciseId: ex.exerciseId,
                        exerciseName: ex.exerciseName,
                        weight: set.weight,
                        reps: set.reps,
                        date: workout.date
                    };
                }
            });
        });
    });

    return Object.values(bests);
}

/**
 * Detects significant milestones reached by the user
 */
export function detectMilestones(user: UserProfile, history: WorkoutLog[]): Milestone[] {
    const milestones: Milestone[] = [];
    const totalWorkouts = history.length;

    // 1. Workout Count Milestones
    const counts = [1, 10, 25, 50, 100];
    counts.forEach(count => {
        if (totalWorkouts >= count) {
            milestones.push({
                id: `workout_count_${count}`,
                type: 'workout_count',
                label: count === 1 ? 'First Workout' : `${count}th Workout logged`,
                date: history[count - 1]?.date || Date.now(),
                value: count
            });
        }
    });

    // 2. Streak Milestones
    const streak = user.psychState.consistencyStreak;
    const streakMilestones = [3, 7, 14, 30];
    streakMilestones.forEach(s => {
        if (streak >= s) {
            milestones.push({
                id: `streak_${s}`,
                type: 'streak',
                label: `${s}-day Unstoppable Streak`,
                date: Date.now(),
                value: s
            });
        }
    });

    // 3. Weight Milestones (Approximate volume milestones)
    const totalVolume = history.reduce((acc, w) =>
        acc + w.exercises.reduce((exAcc, ex) =>
            exAcc + ex.sets.reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0), 0), 0);

    if (totalVolume > 10000) {
        milestones.push({
            id: 'volume_10k',
            type: 'volume',
            label: '10,000kg Total Volume Moved',
            date: Date.now(),
            value: 10000
        });
    }

    return milestones;
}

/**
 * Identifies "Favorite" exercises (most frequently trained)
 */
export function getFavorites(history: WorkoutLog[]): { name: string; count: number }[] {
    const counts: Record<string, number> = {};
    history.forEach(w => {
        w.exercises.forEach(e => {
            counts[e.exerciseName] = (counts[e.exerciseName] || 0) + 1;
        });
    });

    return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
}

/**
 * Calculates the average mood over the last 30 days
 */
export function getAverageMood(history: WorkoutLog[]): number {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const relevant = history.filter(w => w.date >= thirtyDaysAgo);

    if (relevant.length === 0) return 3; // Baseline 'neutral'

    const sum = relevant.reduce((s, w) => s + w.moodAfter, 0);
    return Number((sum / relevant.length).toFixed(1));
}

/**
 * Generate memory-driven references 
 */
export function generateMemoryReferences(user: UserProfile, recentWorkouts: WorkoutLog[], history: WorkoutLog[]): string[] {
    const seeds = getMemorySeeds(user, history);

    // Supplement with volume analysis if sufficient data
    const refs: string[] = [...seeds];

    if (recentWorkouts.length >= 2) {
        const oldWorkout = recentWorkouts[0];
        const newWorkout = recentWorkouts[recentWorkouts.length - 1];

        const oldVolume = oldWorkout.exercises.reduce((s, e) =>
            s + e.sets.reduce((ss, set) => ss + set.weight * set.reps, 0), 0);
        const newVolume = newWorkout.exercises.reduce((s, e) =>
            s + e.sets.reduce((ss, set) => ss + set.weight * set.reps, 0), 0);

        if (newVolume > oldVolume) {
            const pct = Math.round(((newVolume - oldVolume) / Math.max(oldVolume, 1)) * 100);
            refs.push(`Your volume today is up ${pct}% compared to your earlier session.`);
        }
    }

    return refs;
}

/**
 * Finds the "Toughest Week" for empathetic referencing
 */
export function getToughestPeriod(history: WorkoutLog[]): { date: number; reason: string } | null {
    if (history.length < 5) return null;

    // Simplistic: Find the workout with lowest mood + energy combo
    const lowPoint = history.sort((a, b) => (a.moodAfter + a.energyLevel) - (b.moodAfter + b.energyLevel))[0];

    if (lowPoint.moodAfter + lowPoint.energyLevel <= 4) {
        return {
            date: lowPoint.date,
            reason: 'low mental and physical energy'
        };
    }

    return null;
}

/**
 * Returns a list of "Memory Seeds" for Coach Arjun to use in conversation
 */
export function getMemorySeeds(user: UserProfile, history: WorkoutLog[]): string[] {
    const seeds: string[] = [];
    const bests = getBestLifts(history);
    const favorites = getFavorites(history);
    const milestones = detectMilestones(user, history);
    const tough = getToughestPeriod(history);

    // Seed best lift
    if (bests.length > 0) {
        const topLift = bests.sort((a, b) => b.weight - a.weight)[0];
        seeds.push(`Your strongest lift is currently ${topLift.exerciseName} at ${topLift.weight}kg.`);
    }

    // Seed favorites
    if (favorites.length > 0) {
        seeds.push(`You clearly enjoy ${favorites[0].name} — you've logged it ${favorites[0].count} times.`);
    }

    // Seed milestones
    if (milestones.length > 0) {
        const latest = milestones[milestones.length - 1];
        seeds.push(`Recently hit a major milestone: ${latest.label}.`);
    }

    // Seed tough period
    if (tough) {
        const dateStr = new Date(tough.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        seeds.push(`I remember ${dateStr} was a tough day for you. You fought through it anyway.`);
    }

    return seeds;
}
