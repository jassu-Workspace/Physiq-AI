// Convex Store Adapter — Bridge between frontend and Convex backend
// Maintains same interfaces for system-wide compatibility

import { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabase';
import { ensureUserProfileExists, syncUserToBackend } from './authSync';
import { type MuscleGroup } from '../data/exercises';

// === WEEKLY SCHEDULE TYPES ===
export interface WorkoutSession {
    timeSlot: 'morning' | 'afternoon' | 'evening';
    muscleGroups: MuscleGroup[];
    label: string;
}

export interface DaySchedule {
    sessions: WorkoutSession[];
    isRestDay: boolean;
}

export type DayName = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface WeeklySchedule {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
}

// === SUPPLEMENT TYPES ===
export interface SupplementItem {
    takes: boolean;
    brand?: string;
    timing?: 'pre_workout' | 'post_workout' | 'morning' | 'anytime';
}

export interface SupplementProfile {
    wheyProtein: SupplementItem & { servingsPerDay: number; proteinPerServing: number; caloriesPerServing: number };
    creatine: SupplementItem & { dailyGrams: number };
    preWorkout: SupplementItem;
    bcaa: SupplementItem;
    multivitamin: SupplementItem;
    fishOil: SupplementItem;
    other: string[];
}

// === USER PROFILE ===
export interface UserProfile {
    id: string; // UUID from Supabase Auth
    name: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    weight: number;
    height: number;
    bodyFat?: number;
    gymExperience: 'newbie' | 'casual' | 'consistent' | 'veteran'; // How long training
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
    goal: 'muscle_gain' | 'fat_loss' | 'strength' | 'maintenance' | 'endurance';
    trainingStyle: 'bodybuilding' | 'powerlifting' | 'functional' | 'calisthenics' | 'mixed';
    customSchedule: WeeklySchedule;
    daysPerWeek: number;
    dietType: 'vegetarian' | 'non_vegetarian' | 'vegan' | 'eggetarian';
    mealsPerDay: number;
    city: string;
    supplements: SupplementProfile;
    wakeUpTime: string;
    sleepTime: string;
    waterIntakeGoal: number;
    createdAt: number;
    updatedAt: number;
    psychState: PsychologyState;

    // Identity-Based Fields (Level 5)
    userType: 'disciplined' | 'struggler' | 'analytical' | 'competitive' | 'unknown';
    coachStyle: 'performance' | 'supportive' | 'detailed' | 'challenge';
    motivationTrigger: 'achievement' | 'consistency' | 'data' | 'competition';
    responsePreference: 'short' | 'medium' | 'detailed';
    profileCompleted?: boolean;
}

export interface PsychologyState {
    motivationLevel: 'high' | 'medium' | 'low';
    consistencyStreak: number;
    totalSkippedWorkouts: number;
    recentSkipCount: number;
    lastMoodRating: number;
    emotionalMemory: EmotionalMemory[];
    preferredTone: 'energetic' | 'calm' | 'analytical' | 'supportive';
}

export interface EmotionalMemory {
    date: number;
    type: 'positive' | 'negative' | 'neutral';
    context: string;
}

export interface WorkoutLog {
    id: string;
    userId: string;
    date: number;
    splitDay: string;
    sessionIndex: number;
    exercises: LoggedExercise[];
    moodBefore: number;
    moodAfter: number;
    energyLevel: number;
    notes: string;
    duration: number;
    completed: boolean;
}

export interface LoggedExercise {
    exerciseId: string;
    exerciseName: string;
    muscleGroup: string;
    sets: LoggedSet[];
}

export interface LoggedSet {
    weight: number;
    reps: number;
    completed: boolean;
}

export interface DietPlan {
    id: string;
    userId: string;
    date: number;
    targetCalories: number;
    targetProtein: number;
    targetCarbs: number;
    targetFats: number;
    supplementProtein: number;
    foodProteinTarget: number;
    carbCycleDay: 'high' | 'medium' | 'low';
    meals: PlannedMeal[];
}

export interface PlannedMeal {
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout';
    foods: { foodId: string; name: string; servings: number; calories: number; protein: number; carbs: number; fats: number }[];
    totalCalories: number;
    totalProtein: number;
}

export interface AIMessage {
    id: string;
    userId: string;
    timestamp: number;
    type: 'greeting' | 'motivation' | 'plan_explanation' | 'progress_review' | 'adjustment' | 'narrative';
    content: string;
    context: string;
}

export interface DailyCheckin {
    id: string;
    userId: string;
    date: number;
    weight?: number;
    height?: number;
    gymTiming?: string;
    plannedMeals?: string;
    eatenMeals?: string;
    supplementsTaken?: string;
    preWorkoutMeal?: string;
    distanceHomeToGymKm?: number;
    distanceGymToHomeKm?: number;
    transportMode?: 'walk' | 'bike' | 'car' | 'public_transport' | 'other';
    mood?: number;
    energy?: number;
    notes?: string;
}

const aiMessageCache: AIMessage[] = [];

export const store = {
    getLastAIMessage(type: AIMessage['type']): AIMessage | null {
        for (let index = aiMessageCache.length - 1; index >= 0; index--) {
            const message = aiMessageCache[index];
            if (message.type === type) {
                return message;
            }
        }
        return null;
    },
    saveAIMessage(message: AIMessage): void {
        aiMessageCache.push(message);
        if (aiMessageCache.length > 100) {
            aiMessageCache.shift();
        }
    }
};

// === SUPABASE ADAPTER HOOKS ===

export function useUser() {
    const [user, setUser] = useState<UserProfile | null | undefined>(undefined);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setUser(null);
                return;
            }

            try {
                await ensureUserProfileExists(session);
                await syncUserToBackend(session);
            } catch (syncError) {
                console.warn('User bootstrap sync failed:', syncError);
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') { // Single row not found
                    // User has a session but no profile yet (e.g. first social login)
                    setUser({ id: session.user.id } as UserProfile);
                } else {
                    console.error('Error fetching user profile:', error);
                    setUser(null);
                }
            } else {
                setUser(normalizeUserProfile(data));
            }
        };

        fetchUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                fetchUser();
            } else {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return user;
}

export function useNormalizedUser() {
    const user = useUser();
    return user; // Already normalized in useUser
}

export function useWorkoutHistory(userId?: string) {
    const [history, setHistory] = useState<WorkoutLog[] | undefined>(undefined);

    useEffect(() => {
        if (!userId) return;

        const fetchHistory = async () => {
            const { data, error } = await supabase
                .from('workout_logs')
                .select('*')
                .eq('user_id', userId)
                .order('date', { ascending: false });

            if (error) {
                console.error('Error fetching workout history:', error);
            } else {
                setHistory(data.map(normalizeWorkoutLog));
            }
        };

        fetchHistory();
    }, [userId]);

    return history;
}

export function useRecentWorkouts(userId?: string, days: number = 7) {
    const history = useWorkoutHistory(userId);
    return useMemo(() => {
        if (!history) return undefined;
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        return history.filter(w => w.date >= cutoff);
    }, [history, days]);
}

export function useEmotions(userId?: string, limit: number = 30) {
    const [emotions, setEmotions] = useState<any[] | undefined>(undefined);

    useEffect(() => {
        if (!userId) return;

        const fetchEmotions = async () => {
            const { data, error } = await supabase
                .from('emotional_logs')
                .select('*')
                .eq('user_id', userId)
                .order('date', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Error fetching emotions:', error);
            } else {
                setEmotions(data);
            }
        };

        fetchEmotions();
    }, [userId, limit]);

    return emotions;
}

export function useAIMessages(userId?: string, limit: number = 20) {
    const [messages, setMessages] = useState<AIMessage[] | undefined>(undefined);

    useEffect(() => {
        if (!userId) return;

        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('ai_messages')
                .select('*')
                .eq('user_id', userId)
                .order('timestamp', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Error fetching AI messages:', error);
            } else {
                // Ensure correct field mapping if necessary, otherwise use as is
                setMessages(data.map(m => ({
                    id: m.id,
                    userId: m.user_id,
                    timestamp: m.timestamp,
                    type: m.type,
                    content: m.content,
                    context: m.context
                })));
            }
        };

        fetchMessages();
    }, [userId, limit]);

    return messages;
}

export function useDailyCheckins(userId?: string, limit: number = 7) {
    const [checkins, setCheckins] = useState<DailyCheckin[] | undefined>(undefined);

    useEffect(() => {
        if (!userId) return;

        const fetchCheckins = async () => {
            const { data, error } = await supabase
                .from('daily_checkins')
                .select('*')
                .eq('user_id', userId)
                .order('date', { ascending: false })
                .limit(limit);

            if (error) {
                console.warn('Daily checkins unavailable. Did you run latest SQL setup?', error.message);
                setCheckins([]);
            } else {
                setCheckins((data || []).map((row: any) => ({
                    id: row.id,
                    userId: row.user_id,
                    date: row.date,
                    weight: row.weight,
                    height: row.height,
                    gymTiming: row.gym_timing,
                    plannedMeals: row.planned_meals,
                    eatenMeals: row.eaten_meals,
                    supplementsTaken: row.supplements_taken,
                    preWorkoutMeal: row.pre_workout_meal,
                    distanceHomeToGymKm: row.distance_home_to_gym_km,
                    distanceGymToHomeKm: row.distance_gym_to_home_km,
                    transportMode: row.transport_mode,
                    mood: row.mood,
                    energy: row.energy,
                    notes: row.notes,
                })));
            }
        };

        fetchCheckins();
    }, [userId, limit]);

    return checkins;
}

export function useLogDailyCheckin() {
    return async (payload: {
        userId: string;
        date: number;
        weight?: number;
        height?: number;
        gymTiming?: string;
        plannedMeals?: string;
        eatenMeals?: string;
        supplementsTaken?: string;
        preWorkoutMeal?: string;
        distanceHomeToGymKm?: number;
        distanceGymToHomeKm?: number;
        transportMode?: DailyCheckin['transportMode'];
        mood?: number;
        energy?: number;
        notes?: string;
    }) => {
        const { error } = await supabase
            .from('daily_checkins')
            .insert([{
                user_id: payload.userId,
                date: payload.date,
                weight: payload.weight,
                height: payload.height,
                gym_timing: payload.gymTiming,
                planned_meals: payload.plannedMeals,
                eaten_meals: payload.eatenMeals,
                supplements_taken: payload.supplementsTaken,
                pre_workout_meal: payload.preWorkoutMeal,
                distance_home_to_gym_km: payload.distanceHomeToGymKm,
                distance_gym_to_home_km: payload.distanceGymToHomeKm,
                transport_mode: payload.transportMode,
                mood: payload.mood,
                energy: payload.energy,
                notes: payload.notes,
            }]);

        if (error) {
            console.error('Error saving daily checkin:', error);
            throw error;
        }
    };
}

export function useLogEmotion() {
    return async (payload: any) => {
        const { error } = await supabase
            .from('emotional_logs')
            .insert([{
                user_id: payload.userId,
                date: payload.date,
                mood: payload.mood,
                energy: payload.energy,
                stress: payload.stress,
                feeling: payload.feeling,
                context: payload.context
            }]);

        if (error) {
            console.error('Error logging emotion:', error);
            throw error;
        }
    };
}

/**
 * Normalizes a user profile by parsing JSON strings for complex fields
 */
export function normalizeUserProfile(user: any): UserProfile {
    if (!user) return user;

    const normalized = { ...user };

    // Handle legacy id vs Convex _id
    if (user._id && !user.id) {
        normalized.id = user._id;
    }

    // Parse JSON strings if they haven't been parsed yet
    const rawCustomSchedule = user.customSchedule ?? user.custom_schedule;
    if (typeof rawCustomSchedule === 'string') {
        try {
            normalized.customSchedule = JSON.parse(rawCustomSchedule);
        } catch (e) {
            console.error("Failed to parse customSchedule:", e);
        }
    } else if (rawCustomSchedule) {
        normalized.customSchedule = rawCustomSchedule;
    }

    const rawSupplements = user.supplements;
    if (typeof rawSupplements === 'string') {
        try {
            normalized.supplements = JSON.parse(rawSupplements);
        } catch (e) {
            console.error("Failed to parse supplements:", e);
        }
    } else if (rawSupplements) {
        normalized.supplements = rawSupplements;
    }

    const rawPsychState = user.psychState ?? user.psych_state;
    if (typeof rawPsychState === 'string') {
        try {
            normalized.psychState = JSON.parse(rawPsychState);
        } catch (e) {
            console.error("Failed to parse psychState:", e);
        }
    } else if (rawPsychState) {
        normalized.psychState = rawPsychState;
    }

    const defaultPsychState: PsychologyState = {
        motivationLevel: 'medium',
        consistencyStreak: 0,
        totalSkippedWorkouts: 0,
        recentSkipCount: 0,
        lastMoodRating: 3,
        emotionalMemory: [],
        preferredTone: 'supportive',
    };

    const customSchedule = normalized.customSchedule || createEmptySchedule();
    const supplements = normalized.supplements || createDefaultSupplements();
    const psychState = normalized.psychState || defaultPsychState;

    const profileCompleted = Boolean(
        user.goal &&
        (user.fitness_level || user.fitnessLevel) &&
        (user.custom_schedule || user.customSchedule) &&
        (user.diet_type || user.dietType) &&
        (user.gym_experience || user.gymExperience) &&
        user.age &&
        user.weight &&
        user.height
    );

    return {
        id: user.id,
        name: user.name || 'Athlete',
        age: user.age ?? 22,
        gender: user.gender ?? 'other',
        gymExperience: user.gymExperience ?? user.gym_experience ?? 'casual',
        weight: user.weight ?? 70,
        height: user.height ?? 170,
        bodyFat: user.bodyFat ?? user.body_fat,
        fitnessLevel: user.fitnessLevel ?? user.fitness_level ?? 'beginner',
        goal: user.goal ?? 'maintenance',
        trainingStyle: user.trainingStyle ?? user.training_style ?? 'mixed',
        customSchedule: customSchedule,
        daysPerWeek: user.daysPerWeek ?? user.days_per_week ?? countTrainingDays(customSchedule),
        dietType: user.dietType ?? user.diet_type ?? 'non_vegetarian',
        mealsPerDay: user.mealsPerDay ?? user.meals_per_day ?? 4,
        city: user.city ?? 'Visakhapatnam',
        supplements: supplements,
        wakeUpTime: user.wakeUpTime ?? user.wake_up_time ?? '06:00',
        sleepTime: user.sleepTime ?? user.sleep_time ?? '22:00',
        waterIntakeGoal: user.waterIntakeGoal ?? user.water_intake_goal ?? 3,
        createdAt: user.createdAt ?? (user.created_at ? new Date(user.created_at).getTime() : Date.now()),
        updatedAt: user.updatedAt ?? (user.updated_at ? new Date(user.updated_at).getTime() : Date.now()),
        psychState,
        userType: user.userType ?? user.user_type ?? 'unknown',
        coachStyle: user.coachStyle ?? user.coach_style ?? 'supportive',
        motivationTrigger: user.motivationTrigger ?? user.motivation_trigger ?? 'consistency',
        responsePreference: user.responsePreference ?? user.response_preference ?? 'medium',
        profileCompleted,
    };
}


/**
 * Normalizes a workout log by parsing JSON strings for complex fields
 */
export function normalizeWorkoutLog(log: any): WorkoutLog {
    if (!log) return log;
    return {
        ...log,
        exercises: typeof log.exercises === 'string' ? JSON.parse(log.exercises) : (log.exercises || [])
    };
}

// === UTILS ===
export function createEmptySchedule(): WeeklySchedule {
    const emptyDay: DaySchedule = { sessions: [], isRestDay: true };
    return {
        monday: { ...emptyDay }, tuesday: { ...emptyDay }, wednesday: { ...emptyDay },
        thursday: { ...emptyDay }, friday: { ...emptyDay }, saturday: { ...emptyDay },
        sunday: { ...emptyDay },
    };
}

export function createDefaultSupplements(): SupplementProfile {
    return {
        wheyProtein: { takes: false, servingsPerDay: 1, proteinPerServing: 24, caloriesPerServing: 120, timing: 'post_workout' },
        creatine: { takes: false, dailyGrams: 5, timing: 'morning' },
        preWorkout: { takes: false, timing: 'pre_workout' },
        bcaa: { takes: false, timing: 'pre_workout' },
        multivitamin: { takes: false, timing: 'morning' },
        fishOil: { takes: false, timing: 'morning' },
        other: [],
    };
}

// Generate label from muscle groups
export function generateSessionLabel(muscles: MuscleGroup[]): string {
    if (muscles.length === 0) return 'Rest';
    const names: Record<string, string> = {
        chest: 'Chest', back: 'Back', shoulders: 'Shoulders', biceps: 'Biceps',
        triceps: 'Triceps', quadriceps: 'Quads', hamstrings: 'Hamstrings',
        glutes: 'Glutes', calves: 'Calves', core: 'Core', forearms: 'Forearms',
        traps: 'Traps', lats: 'Lats', full_body: 'Full Body',
    };
    return muscles.map(m => names[m] || m).join(' & ');
}

export function countTrainingDays(schedule: WeeklySchedule): number {
    return Object.values(schedule).filter(d => !d.isRestDay && d.sessions.length > 0).length;
}

export function getTodaySchedule(schedule: WeeklySchedule, overrideDay?: DayName): { dayName: DayName; schedule: DaySchedule } {
    const days: DayName[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = overrideDay || days[new Date().getDay()];
    return { dayName, schedule: schedule[dayName] };
}

export function getSupplementProtein(supplements: SupplementProfile): number {
    let total = 0;
    if (supplements.wheyProtein.takes) {
        total += supplements.wheyProtein.proteinPerServing * supplements.wheyProtein.servingsPerDay;
    }
    return total;
}

export function getSupplementCalories(supplements: SupplementProfile): number {
    let total = 0;
    if (supplements.wheyProtein.takes) {
        total += supplements.wheyProtein.caloriesPerServing * supplements.wheyProtein.servingsPerDay;
    }
    return total;
}
