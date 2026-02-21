// Workout Intelligence Engine
// Uses custom per-day schedule for workout generation with recovery awareness

import { type UserProfile, type WorkoutLog, type DayName, getTodaySchedule } from './store';
import { exercises, type Exercise, type MuscleGroup } from '../data/exercises';
import { muscleRecoveryMap, calculateRecoveryScore, isOvertrained } from '../data/muscleRecovery';

export interface GeneratedWorkout {
    splitDay: string;
    muscleGroups: string[];
    focus: string;
    exercises: WorkoutExercise[];
    estimatedDuration: number;
    intensity: 'light' | 'moderate' | 'intense';
    coachNote: string;
    sessionIndex: number;
}

export interface WorkoutExercise {
    exercise: Exercise;
    sets: number;
    reps: string;
    restSeconds: number;
    notes: string;
    isWarmup: boolean;
}

export interface SetPrescription {
    setNumber: number;
    targetReps: number;
    targetWeightKg: number;
    note: string;
}

function parseRepTarget(reps: string): number {
    if (reps.includes('-')) {
        const first = parseInt(reps.split('-')[0], 10);
        return Number.isFinite(first) ? first : 10;
    }
    const parsed = parseInt(reps, 10);
    return Number.isFinite(parsed) ? parsed : 10;
}

function inferBaseWeight(user: UserProfile, exercise: Exercise, history: WorkoutLog[]): number {
    const historicalLoads = history
        .flatMap(w => w.exercises)
        .filter(ex => ex.exerciseName.toLowerCase() === exercise.name.toLowerCase())
        .flatMap(ex => ex.sets)
        .map(s => s.weight)
        .filter(w => w > 0);

    if (historicalLoads.length > 0) {
        const avg = historicalLoads.reduce((sum, load) => sum + load, 0) / historicalLoads.length;
        return Math.max(5, Math.round(avg));
    }

    const bodyweightFactor = exercise.category === 'compound' ? 0.45 : 0.25;
    const levelMultiplier = user.fitnessLevel === 'advanced' ? 1.25 : user.fitnessLevel === 'intermediate' ? 1.0 : 0.75;
    return Math.max(5, Math.round(user.weight * bodyweightFactor * levelMultiplier));
}

export function getSetPrescriptionsForExercise(
    user: UserProfile,
    workoutExercise: WorkoutExercise,
    history: WorkoutLog[]
): SetPrescription[] {
    const base = inferBaseWeight(user, workoutExercise.exercise, history);
    const repTarget = parseRepTarget(workoutExercise.reps);

    return Array.from({ length: workoutExercise.sets }).map((_, index) => {
        const setNumber = index + 1;
        const progressionMultiplier = setNumber === 1
            ? 0.7
            : setNumber === 2
                ? 0.85
                : Math.min(1.15, 0.95 + index * 0.05);

        const targetWeightKg = Math.max(5, Math.round(base * progressionMultiplier / 2.5) * 2.5);
        const note = setNumber <= 2
            ? 'Warm-up / groove technique'
            : setNumber === workoutExercise.sets
                ? 'Top set — controlled effort'
                : 'Working set';

        return {
            setNumber,
            targetReps: repTarget,
            targetWeightKg,
            note,
        };
    });
}

// Select exercises for muscle groups with recovery + goal adaptation
function selectExercisesForMuscle(
    muscle: string,
    level: UserProfile['fitnessLevel'],
    goal: UserProfile['goal'],
    recoveryScore: number
): WorkoutExercise[] {
    // Only use exercises where this is the PRIMARY muscle group — prevents
    // cross-contamination between sections (e.g. Pull-Ups bleeding into biceps)
    const available = exercises.filter(e => e.muscleGroup === (muscle as MuscleGroup));
    if (available.length === 0) return [];

    let filtered = available.filter(e => {
        if (level === 'beginner') return e.level !== 'advanced';
        return true;
    });

    // Prioritize compounds
    filtered.sort((a, b) => {
        if (a.category === 'compound' && b.category !== 'compound') return -1;
        if (b.category === 'compound' && a.category !== 'compound') return 1;
        return 0;
    });

    // Return all available exercises — UI will handle minimum display count
    const selected = filtered;

    return selected.map((exercise, idx) => {
        let sets = exercise.defaultSets;
        let reps = exercise.defaultReps;
        let restSeconds = 90;
        const notes: string[] = [];

        if (goal === 'strength') {
            sets = Math.max(sets, 4);
            reps = exercise.category === 'compound' ? '3-6' : '6-8';
            restSeconds = 180;
            notes.push('Focus on heavy weight, full recovery between sets');
        } else if (goal === 'fat_loss') {
            sets = 3;
            restSeconds = 45;
            notes.push('Keep rest short for metabolic effect');
        } else if (goal === 'muscle_gain') {
            reps = exercise.category === 'compound' ? '6-10' : '10-15';
            restSeconds = 90;
            notes.push('Control the eccentric phase — 3 seconds down');
        }

        if (recoveryScore < 40) {
            sets = Math.max(2, sets - 1);
            notes.push('Reduced volume due to recovery needs');
        }

        return {
            exercise, sets, reps, restSeconds,
            notes: notes.join('. '),
            isWarmup: idx === 0 && exercise.category === 'compound',
        };
    });
}

// Calculate per-muscle recovery scores
export function getMuscleRecoveryScores(user: UserProfile, history: WorkoutLog[]): Record<string, number> {
    const workouts = history.filter(w => w.date >= Date.now() - 7 * 24 * 60 * 60 * 1000);
    const scores: Record<string, number> = {};

    for (const muscle of Object.keys(muscleRecoveryMap)) {
        let lastTrained = 0;
        let lastSets = 0;

        for (const workout of workouts) {
            for (const ex of workout.exercises) {
                if (ex.muscleGroup === muscle) {
                    if (workout.date > lastTrained) {
                        lastTrained = workout.date;
                        lastSets = ex.sets.length;
                    }
                }
            }
        }

        if (lastTrained === 0) {
            scores[muscle] = 100;
        } else {
            const hoursSince = (Date.now() - lastTrained) / (1000 * 60 * 60);
            scores[muscle] = calculateRecoveryScore(muscle, hoursSince, lastSets);
        }
    }

    return scores;
}

// detect overtraining risk based on frequency + volume trends
export function getOvertrainingWarnings(user: UserProfile, history: WorkoutLog[]): string[] {
    const last30Days = history.filter(w => w.date >= Date.now() - 30 * 24 * 60 * 60 * 1000);
    const warnings: string[] = [];

    const weeklyVolume: Record<string, number> = {};
    const weeklyFrequency: Record<string, number> = {};

    // Calculate weekly volume and frequency for the last 7 days within the 30-day window
    const last7Days = last30Days.filter(w => w.date >= Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (const workout of last7Days) {
        const musclesHit = new Set<string>();
        for (const ex of workout.exercises) {
            weeklyVolume[ex.muscleGroup] = (weeklyVolume[ex.muscleGroup] || 0) + ex.sets.length;
            musclesHit.add(ex.muscleGroup);
        }
        for (const m of musclesHit) {
            weeklyFrequency[m] = (weeklyFrequency[m] || 0) + 1;
        }
    }

    for (const [muscle, volume] of Object.entries(weeklyVolume)) {
        const freq = weeklyFrequency[muscle] || 0;
        const result = isOvertrained(muscle, volume, freq);
        if (result.overtrained) {
            warnings.push(`⚠️ ${muscle.charAt(0).toUpperCase() + muscle.slice(1)}: ${result.reason} `);
        }
    }

    return warnings;
}

// Main generation function
export function generateWorkout(user: UserProfile, history: WorkoutLog[], sessionIndex: number = 0): GeneratedWorkout {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as DayName;
    const { dayName, schedule: todaySchedule } = getTodaySchedule(user.customSchedule, today);
    const dayLabel = dayName.charAt(0).toUpperCase() + dayName.slice(1);

    // Rest day
    if (todaySchedule.isRestDay || todaySchedule.sessions.length === 0) {
        return {
            splitDay: `${dayLabel} — Rest Day`,
            muscleGroups: [],
            focus: 'Recovery & Regeneration',
            exercises: [],
            estimatedDuration: 0,
            intensity: 'light',
            coachNote: 'Today is a recovery day. Rest is where the magic happens — your muscles grow OUTSIDE the gym. Focus on sleep, nutrition, and light stretching.',
            sessionIndex: 0,
        };
    }

    // Get the specific session (supports multi-session days)
    const session = todaySchedule.sessions[sessionIndex] || todaySchedule.sessions[0];
    const muscleGroups = session.muscleGroups;

    if (muscleGroups.length === 0) {
        return {
            splitDay: session.label || `${dayLabel} Session`,
            muscleGroups: [],
            focus: 'No muscles assigned',
            exercises: [],
            estimatedDuration: 0,
            intensity: 'light',
            coachNote: 'No muscle groups configured for this session. Edit your schedule to add muscles.',
            sessionIndex,
        };
    }

    const recoveryScores = getMuscleRecoveryScores(user, history);
    const allExercises: WorkoutExercise[] = [];

    for (const muscle of muscleGroups) {
        const muscleRecovery = recoveryScores[muscle] || 100;
        const muscleExercises = selectExercisesForMuscle(muscle, user.fitnessLevel, user.goal, muscleRecovery);
        allExercises.push(...muscleExercises);
    }

    const totalSets = allExercises.reduce((s, e) => s + e.sets, 0);
    const avgRest = allExercises.reduce((s, e) => s + e.restSeconds, 0) / Math.max(allExercises.length, 1);
    const estimatedDuration = Math.round((totalSets * (45 + avgRest)) / 60);

    const avgRecovery = muscleGroups.reduce((s, m) => s + (recoveryScores[m] || 100), 0) / muscleGroups.length;
    const intensity = avgRecovery >= 80 ? 'intense' : avgRecovery >= 50 ? 'moderate' : 'light';

    const notes: string[] = [];
    if (intensity === 'light') notes.push("Some muscles are still recovering — I've adjusted the intensity.");
    if (user.goal === 'strength') notes.push('Focus on heavy compounds with full rest between sets.');
    if (user.goal === 'muscle_gain') notes.push('Chase the pump — controlled tempo and mind-muscle connection.');
    if (user.goal === 'fat_loss') notes.push('Keep rest periods short and supersets where possible.');

    const sessionLabel = todaySchedule.sessions.length > 1
        ? `${dayLabel} — ${session.label} (${session.timeSlot})`
        : `${dayLabel} — ${session.label} `;

    return {
        splitDay: sessionLabel,
        muscleGroups: muscleGroups as string[],
        focus: session.label,
        exercises: allExercises,
        estimatedDuration: Math.max(30, estimatedDuration),
        intensity,
        coachNote: notes.join(' ') || `Today is ${session.label} day.Let's make every rep count!`,
        sessionIndex,
    };
}

// Get all sessions for today (for multi-session days)
export function getTodaySessions(user: UserProfile, history: WorkoutLog[]): GeneratedWorkout[] {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as DayName;
    const { schedule: todaySchedule } = getTodaySchedule(user.customSchedule, today);
    if (todaySchedule.isRestDay || todaySchedule.sessions.length === 0) {
        return [generateWorkout(user, history, 0)];
    }
    return todaySchedule.sessions.map((_, i) => generateWorkout(user, history, i));
}

// Get weekly workout overview from CUSTOM SCHEDULE
export function getWeeklyPlan(user: UserProfile): { day: string; label: string; muscles: string[]; isToday: boolean; isRest: boolean; sessionCount: number }[] {
    const dayOrder: DayName[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const shortNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayOfWeek = new Date().getDay();
    const todayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert 0=Sun to 6, 1=Mon to 0

    return dayOrder.map((dayKey, idx) => {
        const daySchedule = user.customSchedule[dayKey];
        const allMuscles = daySchedule.sessions.flatMap(s => s.muscleGroups);
        const labels = daySchedule.sessions.map(s => s.label).filter(Boolean);

        return {
            day: shortNames[idx],
            label: labels.join(' + ') || (daySchedule.isRestDay ? 'Rest' : 'Rest'),
            muscles: allMuscles as string[],
            isToday: idx === todayIdx,
            isRest: daySchedule.isRestDay || daySchedule.sessions.length === 0,
            sessionCount: daySchedule.sessions.length,
        };
    });
}
