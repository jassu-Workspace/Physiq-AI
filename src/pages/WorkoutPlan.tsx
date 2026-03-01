import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Dumbbell, Clock, Zap, ChevronDown, ChevronUp, Check,
    RotateCcw, Info, AlertTriangle, Trophy, Target, Star,
    ChevronRight, Flame, Activity
} from 'lucide-react';
import { type UserProfile, type WorkoutLog, normalizeWorkoutLog, useWorkoutHistory } from '../services/store';
import { generateWorkout, getMuscleRecoveryScores, getOvertrainingWarnings, getSetPrescriptionsForExercise } from '../services/workoutEngine';
import { addDoc, collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useExerciseDB, findMatchingFreeExercise, getExerciseImageUrl, type FreeExercise } from '../services/exerciseDB';
import { ExerciseCard, ExerciseDetail, MUSCLE_LABEL, LEVEL_COLOR } from './ExerciseLibrary';

interface WorkoutPlanProps {
    user: UserProfile;
}

function getLocalDateKey(timestamp: number): string {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ─── Workout category definitions ──────────────────────────────────────────
const WORKOUT_CATEGORIES = [
    {
        id: 'legs',
        label: 'Legs Day',
        emoji: '🦵',
        color: 'from-blue-500/20 to-cyan-500/10',
        border: 'border-blue-500/20',
        accent: 'text-blue-400',
        muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors'],
        description: 'Squats, lunges, leg press & more',
    },
    {
        id: 'chest',
        label: 'Chest Day',
        emoji: '💪',
        color: 'from-rose-500/20 to-pink-500/10',
        border: 'border-rose-500/20',
        accent: 'text-rose-400',
        muscles: ['chest'],
        description: 'Bench press, flies & push variations',
    },
    {
        id: 'back',
        label: 'Back Day',
        emoji: '🔙',
        color: 'from-purple-500/20 to-violet-500/10',
        border: 'border-purple-500/20',
        accent: 'text-purple-400',
        muscles: ['lats', 'middle back', 'lower back', 'traps'],
        description: 'Rows, pull-ups, deadlifts & more',
    },
    {
        id: 'shoulders',
        label: 'Shoulders',
        emoji: '🏋️',
        color: 'from-amber-500/20 to-yellow-500/10',
        border: 'border-amber-500/20',
        accent: 'text-amber-400',
        muscles: ['shoulders', 'traps'],
        description: 'Press, lateral raises & rear delts',
    },
    {
        id: 'arms',
        label: 'Arms Day',
        emoji: '💥',
        color: 'from-orange-500/20 to-amber-500/10',
        border: 'border-orange-500/20',
        accent: 'text-orange-400',
        muscles: ['biceps', 'triceps', 'forearms'],
        description: 'Curls, extensions & grip work',
    },
    {
        id: 'core',
        label: 'Core & Abs',
        emoji: '🔥',
        color: 'from-red-500/20 to-orange-500/10',
        border: 'border-red-500/20',
        accent: 'text-red-400',
        muscles: ['abdominals'],
        description: 'Planks, crunches & rotational work',
    },
    {
        id: 'cardio',
        label: 'Cardio',
        emoji: '🏃',
        color: 'from-green-500/20 to-emerald-500/10',
        border: 'border-green-500/20',
        accent: 'text-green-400',
        muscles: [],
        category: 'cardio' as const,
        description: 'HIIT, running & conditioning',
    },
    {
        id: 'plyometrics',
        label: 'Plyometrics',
        emoji: '⚡',
        color: 'from-cyan-500/20 to-teal-500/10',
        border: 'border-cyan-500/20',
        accent: 'text-cyan-400',
        muscles: [],
        category: 'plyometrics' as const,
        description: 'Jumps, explosive power & athleticism',
    },
    {
        id: 'powerlifting',
        label: 'Powerlifting',
        emoji: '🏆',
        color: 'from-yellow-500/20 to-amber-500/10',
        border: 'border-yellow-500/20',
        accent: 'text-yellow-400',
        muscles: [],
        category: 'powerlifting' as const,
        description: 'Squat, bench, deadlift & variations',
    },
] as const;

// ─── Internal muscle group → free-exercise-db primary muscle names ───────────
const MUSCLE_TO_FREE: Record<string, string[]> = {
    chest: ['chest'],
    back: ['lats', 'middle back', 'lower back', 'traps'],
    shoulders: ['shoulders'],
    biceps: ['biceps'],
    triceps: ['triceps'],
    quadriceps: ['quadriceps'],
    core: ['abdominals'],
    forearms: ['forearms'],
    full_body: [],
};

// ─── Category section component ─────────────────────────────────────────────
function CategorySection({
    cat, exercises, onSelect,
}: {
    cat: typeof WORKOUT_CATEGORIES[number];
    exercises: FreeExercise[];
    onSelect: (ex: FreeExercise) => void;
}) {
    const [open, setOpen] = useState(false);

    // Filter exercises for this category
    const catExercises = useMemo(() => {
        let list = exercises;
        if ('category' in cat && cat.category) {
            list = list.filter(e => e.category === cat.category);
        } else if (cat.muscles.length > 0) {
            list = list.filter(e =>
                e.primaryMuscles.some(m => (cat.muscles as readonly string[]).includes(m))
            );
        }
        // Sort by level: beginner first
        const order: Record<string, number> = { beginner: 0, intermediate: 1, expert: 2 };
        return list.sort((a, b) => (order[a.level] ?? 1) - (order[b.level] ?? 1));
    }, [exercises, cat]);

    if (catExercises.length === 0) return null;

    return (
        <div className={`bg-gradient-to-br ${cat.color} border ${cat.border} rounded-2xl overflow-hidden`}>
            {/* Header */}
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.emoji}</span>
                    <div className="text-left">
                        <p className="text-sm font-bold text-white">{cat.label}</p>
                        <p className="text-[11px] text-slate-400">{cat.description} · {catExercises.length} exercises</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Muscle tags */}
                    <div className="hidden sm:flex gap-1">
                        {cat.muscles.slice(0, 3).map(m => (
                            <span key={m} className={`text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 ${cat.accent} capitalize`}>
                                {MUSCLE_LABEL[m] ?? m}
                            </span>
                        ))}
                    </div>
                    {open
                        ? <ChevronUp size={16} className="text-slate-400" />
                        : <ChevronRight size={16} className="text-slate-400" />
                    }
                </div>
            </button>

            {/* Exercise horizontal scroll */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div
                            className="flex gap-3 overflow-x-auto px-4 pb-4 pt-1"
                            style={{ scrollbarWidth: 'none' }}
                        >
                            {catExercises.map(ex => (
                                <div key={ex.id} className="shrink-0 w-44">
                                    <ExerciseCard ex={ex} onSelect={() => onSelect(ex)} />
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function WorkoutPlan({ user }: WorkoutPlanProps) {
    const historyData = useWorkoutHistory(user.id);
    const history = (historyData || []).map(normalizeWorkoutLog);
    const { exercises: freeExercises } = useExerciseDB();

    const workout = useMemo(() => generateWorkout(user, history), [user, historyData]);
    const recoveryScores = getMuscleRecoveryScores(user, history);
    const warnings = getOvertrainingWarnings(user, history);

    const [activeTab, setActiveTab] = useState<'today' | 'browse'>('today');
    const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
    const [completedSets, setCompletedSets] = useState<Record<string, boolean[]>>({});
    const [selectedWeights, setSelectedWeights] = useState<Record<string, number>>({});
    const [workoutStarted, setWorkoutStarted] = useState(false);
    const [workoutComplete, setWorkoutComplete] = useState(false);
    const [moodRating, setMoodRating] = useState(4);
    const [energyLevel, setEnergyLevel] = useState(3);
    const [detailEx, setDetailEx] = useState<FreeExercise | null>(null);
    const [suppCompletedSets, setSuppCompletedSets] = useState<Record<string, boolean[]>>({});
    const [suppWeights, setSuppWeights] = useState<Record<string, number>>({});
    const [expandedSupp, setExpandedSupp] = useState<string | null>(null);
    const [hydrationDocId, setHydrationDocId] = useState<string | null>(null);
    const [hydrationMl, setHydrationMl] = useState(0);
    const hydrationGoalMl = Math.max(1000, (user.waterIntakeGoal || 3) * 1000);
    const hydrationPct = Math.min(100, Math.round((hydrationMl / hydrationGoalMl) * 100));

    React.useEffect(() => {
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

    React.useEffect(() => {
        const applySearch = (queryText: string) => {
            const value = queryText.trim().toLowerCase();
            if (!value) return;

            setActiveTab('browse');

            if (freeExercises.length === 0) return;
            const matched = freeExercises.find((exercise) => {
                const nameMatch = exercise.name.toLowerCase().includes(value);
                const muscleMatch = exercise.primaryMuscles.some((muscle) => muscle.toLowerCase().includes(value));
                const equipmentMatch = (exercise.equipment ?? '').toLowerCase().includes(value);
                return nameMatch || muscleMatch || equipmentMatch;
            });

            if (matched) {
                setDetailEx(matched);
            }
        };

        const onGlobalSearch = (event: Event) => {
            const custom = event as CustomEvent<{ query?: string; targetTab?: string }>;
            const targetTab = custom.detail?.targetTab;
            const queryText = custom.detail?.query;
            if (!queryText) return;
            if (targetTab && targetTab !== 'workouts' && targetTab !== 'exercises') return;
            applySearch(queryText);
        };

        window.addEventListener('app:global-search', onGlobalSearch as EventListener);

        try {
            const stored = window.localStorage.getItem('app:global-search:last');
            if (stored) {
                const parsed = JSON.parse(stored) as { query?: string; targetTab?: string; timestamp?: number };
                const isFresh = typeof parsed.timestamp === 'number' && Date.now() - parsed.timestamp < 15000;
                if (isFresh && parsed.query && (parsed.targetTab === 'workouts' || parsed.targetTab === 'exercises')) {
                    applySearch(parsed.query);
                }
            }
        } catch {
            // Ignore malformed or unavailable storage.
        }

        return () => {
            window.removeEventListener('app:global-search', onGlobalSearch as EventListener);
        };
    }, [freeExercises]);

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
                const createdRef = doc(collection(db, 'daily_checkins'));
                await setDoc(createdRef, {
                    user_id: user.id,
                    date_key: dateKey,
                    date: now,
                    hydration_ml: nextMl,
                    total_ml: nextMl,
                    hydration_goal_ml: hydrationGoalMl,
                    created_at: now,
                    updated_at: now,
                });
                setHydrationDocId(createdRef.id);
            }

            setHydrationMl(nextMl);
        } catch (error) {
            console.error('Failed to update hydration:', error);
        }
    };

    const setPlans = useMemo(() =>
        workout.exercises.map(ex => getSetPrescriptionsForExercise(user, ex, history)),
        [user, historyData, workout]
    );

    const totalSets = workout.exercises.reduce((s, e) => s + e.sets, 0);
    const completedCount = (Object.values(completedSets) as boolean[][])
        .reduce((s, sets) => s + sets.filter(Boolean).length, 0);
    const progress = totalSets > 0 ? Math.round((completedCount / totalSets) * 100) : 0;

    const toggleSet = (exerciseIdx: number, setIdx: number) => {
        const key = `${exerciseIdx}`;
        setCompletedSets(prev => {
            const sets = prev[key] ? [...prev[key]] : new Array(workout.exercises[exerciseIdx]?.sets ?? 0).fill(false);
            sets[setIdx] = !sets[setIdx];
            return { ...prev, [key]: sets };
        });
    };

    const updateSetWeight = (exerciseIdx: number, setIdx: number, weight: number) => {
        setSelectedWeights(prev => ({ ...prev, [`${exerciseIdx}_${setIdx}`]: weight }));
    };

    // ── Supplemental exercise helpers ──
    const suppDefaults = useMemo(() => {
        const sets = user.goal === 'strength' ? 4 : 3;
        const reps = user.goal === 'strength' ? '5-8'
            : user.goal === 'muscle_gain' ? '8-12'
            : user.goal === 'fat_loss' ? '12-15'
            : '10-12';
        const restSeconds = user.goal === 'strength' ? 180 : user.goal === 'fat_loss' ? 45 : 90;
        return { sets, reps, restSeconds };
    }, [user.goal]);

    const getSuppDefaultWeight = (freeEx: FreeExercise): number => {
        const isBW = freeEx.equipment === 'body only' || !freeEx.equipment;
        if (isBW) return 0;
        const isCompound = freeEx.mechanic === 'compound';
        const factor = isCompound ? 0.45 : 0.25;
        const lvlMult = user.fitnessLevel === 'advanced' ? 1.25 : user.fitnessLevel === 'intermediate' ? 1.0 : 0.75;
        return Math.max(5, Math.round(user.weight * factor * lvlMult / 2.5) * 2.5);
    };

    const toggleSuppSet = (exId: string, setIdx: number, totalSets: number) => {
        if (!workoutStarted) setWorkoutStarted(true);
        setSuppCompletedSets(prev => {
            const sets = prev[exId] ? [...prev[exId]] : new Array(totalSets).fill(false);
            sets[setIdx] = !sets[setIdx];
            return { ...prev, [exId]: sets };
        });
    };

    const handleCompleteWorkout = async () => {
        if (!user.id) return;
        const exercises = workout.exercises.map((ex, idx) => ({
            exerciseId: ex.exercise.id,
            exerciseName: ex.exercise.name,
            muscleGroup: ex.exercise.muscleGroup,
            sets: Array.from({ length: ex.sets }, (_, i) => ({
                weight: selectedWeights[`${idx}_${i}`] ?? setPlans[idx]?.[i]?.targetWeightKg ?? 0,
                reps: setPlans[idx]?.[i]?.targetReps ?? (parseInt(ex.reps) || 10),
                completed: completedSets[`${idx}`]?.[i] || false,
            })),
        }));
        try {
            await addDoc(collection(db, 'workout_logs'), {
                user_id: user.id,
                date: Date.now(),
                split_day: workout.splitDay,
                session_index: workout.sessionIndex || 0,
                exercises,
                mood_before: 3,
                mood_after: moodRating,
                energy_level: energyLevel,
                notes: '',
                duration: workout.estimatedDuration,
                completed: true,
            });
            setWorkoutComplete(true);
        } catch (e) {
            console.error('Failed to log workout:', e);
        }
    };

    // ── Rest day ──
    if (workout.exercises.length === 0) {
        return (
            <div className="max-w-4xl mx-auto p-4 lg:p-8">
                <div className="text-center py-20">
                    <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                        <RotateCcw className="text-green-400" size={36} />
                    </div>
                    <h2 className="text-3xl font-extrabold text-white mb-3">Recovery Day</h2>
                    <p className="text-slate-400 text-lg max-w-md mx-auto mb-6">{workout.coachNote}</p>
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 max-w-md mx-auto">
                        <h3 className="text-sm font-bold text-[#6C63FF] mb-3">Recovery Checklist</h3>
                        <div className="space-y-3 text-left">
                            {['Get 7-9 hours of sleep', 'Eat at maintenance calories', 'Light stretching or yoga', 'Stay hydrated (2.5L+)', 'Foam roll tight muscles'].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                                    <div className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center">
                                        <Check size={12} className="text-slate-600" />
                                    </div>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Workout complete ──
    if (workoutComplete) {
        return (
            <div className="max-w-4xl mx-auto p-4 lg:p-8">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-[#6C63FF]/20 flex items-center justify-center mx-auto mb-6">
                        <Trophy className="text-[#6C63FF]" size={36} />
                    </div>
                    <h2 className="text-3xl font-extrabold text-white mb-3">Workout Complete!</h2>
                    <p className="text-slate-400 max-w-md mx-auto mb-4">{completedCount}/{totalSets} sets completed. Another investment in your future self.</p>
                    <div className="flex justify-center gap-4 mt-6">
                        {[
                            { val: workout.estimatedDuration, label: 'minutes' },
                            { val: workout.exercises.length, label: 'exercises' },
                            { val: completedCount, label: 'sets done' },
                        ].map(({ val, label }) => (
                            <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 text-center">
                                <p className="text-2xl font-bold text-white">{val}</p>
                                <p className="text-xs text-slate-400">{label}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 lg:p-8">

            {/* Header */}
            <div>
                <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 flex items-center gap-3">
                    <Dumbbell className="text-blue-600" size={32} />
                    Workouts
                </h1>
                <p className="text-slate-500 mt-1 text-sm">{workout.focus}</p>
            </div>

            {/* Tab switcher */}
            <div className="flex rounded-xl border border-slate-200 bg-white p-1 gap-1 shadow-sm">
                {([
                    { id: 'today', label: "Today's Workout", icon: <Flame size={14} /> },
                    { id: 'browse', label: 'Browse by Category', icon: <Activity size={14} /> },
                ] as const).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* ── TAB: TODAY'S WORKOUT ── */}
            {activeTab === 'today' && (
                <>
                    {/* Workout meta row */}
                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1"><Clock size={12} /> {workout.estimatedDuration} min</span>
                        <span className="flex items-center gap-1"><Dumbbell size={12} /> {workout.exercises.length} exercises</span>
                        <span className={`px-2 py-1 rounded-full ${workout.intensity === 'intense' ? 'bg-red-500/10 text-red-400' :
                            workout.intensity === 'moderate' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-green-500/10 text-green-400'}`}>
                            {workout.intensity} intensity
                        </span>
                    </div>

                    <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-500 to-blue-600 p-5 text-white shadow-lg shadow-blue-500/20">
                        <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-bold">Hydration</h3>
                                <p className="text-sm text-blue-100">Daily Goal: {hydrationGoalMl} ml</p>
                            </div>
                            <div className="rounded-lg bg-white/20 p-2">
                                <Zap size={16} />
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

                    {/* Overtraining warnings */}
                    {warnings.length > 0 && (
                        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
                            <div className="flex items-center gap-2 mb-2 text-orange-400">
                                <AlertTriangle size={16} />
                                <span className="text-sm font-semibold">Overtraining Alerts</span>
                            </div>
                            {warnings.map((w, i) => <p key={i} className="text-xs text-orange-300/70">{w}</p>)}
                        </div>
                    )}

                    {/* Progress bar */}
                    {workoutStarted && (
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-semibold text-slate-900">Workout Progress</span>
                                <span className="text-sm font-bold text-blue-600">{progress}%</span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                <motion.div className="h-full rounded-full bg-blue-600"
                                    animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{completedCount} of {totalSets} sets</p>
                        </div>
                    )}

                    {/* Recovery status */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wide">Muscle Recovery Status</h3>
                        <div className="flex flex-wrap gap-2">
                            {workout.muscleGroups.map(muscle => {
                                const score = recoveryScores[muscle] || 100;
                                const color = score >= 80 ? 'bg-green-400' : score >= 50 ? 'bg-yellow-400' : 'bg-red-400';
                                return (
                                    <div key={muscle} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 border border-slate-200">
                                        <div className={`w-2 h-2 rounded-full ${color}`} />
                                        <span className="text-xs font-medium text-slate-700 capitalize">{muscle}</span>
                                        <span className="text-[10px] text-slate-500">{score}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Exercise list — grouped by muscle, min 7 per group */}
                    {(() => {
                        const groups: Record<string, typeof workout.exercises> = {};
                        workout.exercises.forEach(ex => {
                            const mg = ex.exercise.muscleGroup;
                            if (!groups[mg]) groups[mg] = [];
                            groups[mg].push(ex);
                        });

                        return Object.entries(groups).map(([muscle, exList]) => {
                            // Compute supplemental exercises from freeExercises to reach min 7
                            const freeMuscles = MUSCLE_TO_FREE[muscle] || [];
                            const usedNames = new Set(exList.map(e => e.exercise.name.toLowerCase().replace(/[^a-z0-9]/g, '')));
                            const needed = Math.max(0, 7 - exList.length);
                            const suppList = freeMuscles.length > 0
                                ? freeExercises
                                    .filter(fe => fe.primaryMuscles.some(m => freeMuscles.includes(m)))
                                    .filter(fe => !usedNames.has(fe.name.toLowerCase().replace(/[^a-z0-9]/g, '')))
                                    .slice(0, needed)
                                : [];

                            return (
                                <div key={muscle}>
                                    <div className="flex items-center gap-2 mb-2 px-1">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest capitalize">{muscle}</h3>
                                        <span className="text-[10px] text-slate-600">{exList.length + suppList.length} exercises</span>
                                    </div>
                                    <div className="space-y-2">
                                        {/* ── Generated exercises (with weight prescription) ── */}
                                        {exList.map((ex) => {
                                            const idx = workout.exercises.indexOf(ex);
                                            const isExpanded = expandedExercise === idx;
                                            const sets = completedSets[`${idx}`] || new Array(ex.sets).fill(false);
                                            const allDone = sets.every(Boolean);
                                            const freeEx = freeExercises.length > 0 ? findMatchingFreeExercise(ex.exercise.name, freeExercises) : null;

                                            return (
                                                <motion.div key={idx} layout
                                                    className={`border rounded-2xl overflow-hidden transition-all ${allDone ? 'border-green-200 bg-green-50' : 'bg-white border-slate-200 shadow-sm'}`}
                                                >
                                                    <button
                                                        onClick={() => setExpandedExercise(isExpanded ? null : idx)}
                                                        className="w-full p-4 flex items-center gap-3 text-left"
                                                    >
                                                        {freeEx?.images[0] ? (
                                                            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-black/20">
                                                                <img
                                                                    src={getExerciseImageUrl(freeEx.images[0])}
                                                                    alt={ex.exercise.name}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${allDone ? 'bg-green-500/20 text-green-400' : 'bg-[#6C63FF]/10 text-[#6C63FF]'}`}>
                                                                {allDone ? <Check size={18} /> : idx + 1}
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm font-semibold truncate ${allDone ? 'text-green-700' : 'text-slate-900'}`}>{ex.exercise.name}</p>
                                                            <p className="text-xs text-slate-500 capitalize">{ex.exercise.equipment}</p>
                                                        </div>
                                                        <div className="text-right mr-1 shrink-0">
                                                            <p className="text-sm font-bold text-slate-900">{ex.sets} × {ex.reps}</p>
                                                            <p className="text-[10px] text-slate-500">{ex.restSeconds}s rest</p>
                                                        </div>
                                                        {isExpanded ? <ChevronUp size={15} className="text-slate-400 shrink-0" /> : <ChevronDown size={15} className="text-slate-400 shrink-0" />}
                                                    </button>

                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                                                <div className="px-4 pb-4 space-y-3">
                                                                    {freeEx && freeEx.images.length > 0 && (
                                                                        <div className="flex gap-2">
                                                                            {freeEx.images.map((img, i) => (
                                                                                <div key={i} className="flex-1 h-32 bg-black/20 rounded-xl overflow-hidden">
                                                                                    <img src={getExerciseImageUrl(img)} alt={`${ex.exercise.name} step ${i + 1}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }} />
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    <div className="bg-white/[0.02] rounded-xl p-3 space-y-2">
                                                                        {freeEx && freeEx.instructions.length > 0 ? (
                                                                            <>
                                                                                <p className="text-[10px] text-[#6C63FF] font-semibold uppercase tracking-wide">Step-by-step</p>
                                                                                <ol className="space-y-1.5">
                                                                                    {freeEx.instructions.map((step, si) => (
                                                                                        <li key={si} className="flex gap-2 text-xs text-slate-300">
                                                                                            <span className="shrink-0 w-4 h-4 rounded-full bg-[#6C63FF]/15 text-[#6C63FF] flex items-center justify-center text-[9px] font-bold mt-0.5">{si + 1}</span>
                                                                                            {step}
                                                                                        </li>
                                                                                    ))}
                                                                                </ol>
                                                                            </>
                                                                        ) : (
                                                                            <p className="text-xs text-slate-400 flex items-start gap-2"><Info size={12} className="shrink-0 mt-0.5 text-[#6C63FF]" />{ex.exercise.instructions}</p>
                                                                        )}
                                                                        {ex.exercise.tips && (
                                                                            <p className="text-xs text-[#6C63FF]/70 flex items-start gap-2 pt-1"><Star size={12} className="shrink-0 mt-0.5" />{ex.exercise.tips}</p>
                                                                        )}
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        {Array.from({ length: ex.sets }).map((_, setIdx) => {
                                                                            const suggestedWeight = setPlans[idx]?.[setIdx]?.targetWeightKg ?? 0;
                                                                            const selected = selectedWeights[`${idx}_${setIdx}`] ?? suggestedWeight;
                                                                            const options = [Math.max(2.5, suggestedWeight - 5), suggestedWeight, suggestedWeight + 5];
                                                                            return (
                                                                                <React.Fragment key={setIdx}>
                                                                                    <button onClick={() => { if (!workoutStarted) setWorkoutStarted(true); toggleSet(idx, setIdx); }}
                                                                                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${sets[setIdx] ? 'bg-green-500/10 border border-green-500/20' : 'bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05]'}`}>
                                                                                        <span className="text-xs text-slate-400">Set {setIdx + 1}</span>
                                                                                        <span className="text-sm font-semibold text-white">{setPlans[idx]?.[setIdx]?.targetReps ?? ex.reps} reps</span>
                                                                                        <span className="text-xs font-semibold text-[#6C63FF]">{selected} kg</span>
                                                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${sets[setIdx] ? 'border-green-400 bg-green-400' : 'border-slate-600'}`}>
                                                                                            {sets[setIdx] && <Check size={12} className="text-white" />}
                                                                                        </div>
                                                                                    </button>
                                                                                    <div className="flex items-center gap-2 pl-1">
                                                                                        {options.map((w, oi) => (
                                                                                            <button key={oi} onClick={() => updateSetWeight(idx, setIdx, w)}
                                                                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${selected === w ? 'bg-[#6C63FF] text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>{w}kg</button>
                                                                                        ))}
                                                                                    </div>
                                                                                </React.Fragment>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                    <div className="bg-[#6C63FF]/5 border border-[#6C63FF]/10 rounded-xl p-3">
                                                                        <p className="text-[11px] text-[#6C63FF] font-semibold mb-2">Suggested loading progression</p>
                                                                        <div className="space-y-1">
                                                                            {(setPlans[idx] || []).map(plan => (
                                                                                <p key={plan.setNumber} className="text-[11px] text-slate-300">
                                                                                    Set {plan.setNumber}: {plan.targetWeightKg} kg × {plan.targetReps} reps — {plan.note}
                                                                                </p>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            );
                                        })}

                                        {/* ── Supplemental exercises from free-exercise-db ── */}
                                        {suppList.map((fe) => {
                                            const isExpSup = expandedSupp === fe.id;
                                            const suppSets = suppCompletedSets[fe.id] || new Array(suppDefaults.sets).fill(false);
                                            const suppAllDone = suppSets.every(Boolean);
                                            const suppBaseW = getSuppDefaultWeight(fe);
                                            const suppOptions = suppBaseW > 0
                                                ? [Math.max(2.5, suppBaseW - 5), suppBaseW, suppBaseW + 5]
                                                : [];

                                            return (
                                                <motion.div key={fe.id} layout
                                                    className={`border rounded-2xl overflow-hidden transition-all ${suppAllDone ? 'border-green-500/30 bg-green-500/[0.02]' : 'bg-white/[0.02] border-white/[0.04]'}`}
                                                >
                                                    <button
                                                        onClick={() => setExpandedSupp(isExpSup ? null : fe.id)}
                                                        className="w-full p-4 flex items-center gap-3 text-left"
                                                    >
                                                        {fe.images[0] ? (
                                                            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-black/20">
                                                                <img src={getExerciseImageUrl(fe.images[0])} alt={fe.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                            </div>
                                                        ) : (
                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${suppAllDone ? 'bg-green-500/20' : 'bg-white/[0.04]'}`}>
                                                                {suppAllDone ? <Check size={18} className="text-green-400" /> : <Dumbbell size={16} className="text-slate-500" />}
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <p className={`text-sm font-semibold truncate ${suppAllDone ? 'text-green-400' : 'text-slate-200'}`}>{fe.name}</p>
                                                                <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-medium">Variation</span>
                                                            </div>
                                                            <p className="text-xs text-slate-500 capitalize">{fe.equipment ?? 'bodyweight'}</p>
                                                        </div>
                                                        <div className="text-right mr-1 shrink-0">
                                                            <p className="text-sm font-bold text-slate-300">{suppDefaults.sets} × {suppDefaults.reps}</p>
                                                            <p className="text-[10px] text-slate-500">{suppDefaults.restSeconds}s rest</p>
                                                        </div>
                                                        {isExpSup ? <ChevronUp size={15} className="text-slate-400 shrink-0" /> : <ChevronDown size={15} className="text-slate-400 shrink-0" />}
                                                    </button>

                                                    <AnimatePresence>
                                                        {isExpSup && (
                                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                                                <div className="px-4 pb-4 space-y-3">
                                                                    {fe.images.length > 0 && (
                                                                        <div className="flex gap-2">
                                                                            {fe.images.map((img, i) => (
                                                                                <div key={i} className="flex-1 h-32 bg-black/20 rounded-xl overflow-hidden">
                                                                                    <img src={getExerciseImageUrl(img)} alt={`${fe.name} step ${i + 1}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }} />
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    {fe.instructions.length > 0 && (
                                                                        <div className="bg-white/[0.02] rounded-xl p-3 space-y-2">
                                                                            <p className="text-[10px] text-purple-400 font-semibold uppercase tracking-wide">Step-by-step</p>
                                                                            <ol className="space-y-1.5">
                                                                                {fe.instructions.map((step, si) => (
                                                                                    <li key={si} className="flex gap-2 text-xs text-slate-300">
                                                                                        <span className="shrink-0 w-4 h-4 rounded-full bg-purple-500/15 text-purple-400 flex items-center justify-center text-[9px] font-bold mt-0.5">{si + 1}</span>
                                                                                        {step}
                                                                                    </li>
                                                                                ))}
                                                                            </ol>
                                                                        </div>
                                                                    )}
                                                                    <div className="space-y-2">
                                                                        {Array.from({ length: suppDefaults.sets }).map((_, setIdx) => {
                                                                            const selW = suppWeights[`${fe.id}_${setIdx}`] ?? suppBaseW;
                                                                            return (
                                                                                <React.Fragment key={setIdx}>
                                                                                    <button onClick={() => toggleSuppSet(fe.id, setIdx, suppDefaults.sets)}
                                                                                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${suppSets[setIdx] ? 'bg-green-500/10 border border-green-500/20' : 'bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05]'}`}>
                                                                                        <span className="text-xs text-slate-400">Set {setIdx + 1}</span>
                                                                                        <span className="text-sm font-semibold text-white">{suppDefaults.reps} reps</span>
                                                                                        {suppBaseW > 0 && <span className="text-xs font-semibold text-purple-400">{selW} kg</span>}
                                                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${suppSets[setIdx] ? 'border-green-400 bg-green-400' : 'border-slate-600'}`}>
                                                                                            {suppSets[setIdx] && <Check size={12} className="text-white" />}
                                                                                        </div>
                                                                                    </button>
                                                                                    {suppOptions.length > 0 && (
                                                                                        <div className="flex items-center gap-2 pl-1">
                                                                                            {suppOptions.map((w, oi) => (
                                                                                                <button key={oi} onClick={() => setSuppWeights(prev => ({ ...prev, [`${fe.id}_${setIdx}`]: w }))}
                                                                                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${selW === w ? 'bg-purple-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>{w}kg</button>
                                                                                            ))}
                                                                                        </div>
                                                                                    )}
                                                                                </React.Fragment>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        });
                    })()}

                    {/* Complete workout */}
                    {workoutStarted && (
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 space-y-4">
                            <h3 className="text-sm font-bold text-white">How was your workout?</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-400 mb-2">Mood Rating</p>
                                    <div className="flex gap-1.5">
                                        {[1, 2, 3, 4, 5].map(r => (
                                            <button key={r} onClick={() => setMoodRating(r)}
                                                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${moodRating === r ? 'bg-[#6C63FF] text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>{r}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 mb-2">Energy Level</p>
                                    <div className="flex gap-1.5">
                                        {[1, 2, 3, 4, 5].map(r => (
                                            <button key={r} onClick={() => setEnergyLevel(r)}
                                                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${energyLevel === r ? 'bg-yellow-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>{r}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleCompleteWorkout}
                                className="w-full py-3.5 bg-gradient-to-r from-[#6C63FF] to-purple-500 text-white rounded-2xl font-bold text-sm shadow-[0_0_25px_rgba(108,99,255,0.5)] hover:shadow-[0_0_35px_rgba(108,99,255,0.7)] transition-all">
                                Complete Workout ({completedCount}/{totalSets} sets)
                            </button>
                        </div>
                    )}

                    {/* Coach note */}
                    {workout.coachNote && !workoutStarted && (
                        <div className="bg-[#6C63FF]/5 border border-[#6C63FF]/10 rounded-2xl p-5">
                            <p className="text-xs text-[#6C63FF] font-semibold mb-2">Coach Arjun says...</p>
                            <p className="text-sm text-slate-300 leading-relaxed">{workout.coachNote}</p>
                        </div>
                    )}
                </>
            )}

            {/* ── TAB: BROWSE BY CATEGORY ── */}
            {activeTab === 'browse' && (
                <div className="space-y-3">
                    <p className="text-xs text-slate-500">
                        {freeExercises.length > 0
                            ? `${freeExercises.length} exercises across all categories — click a section to expand`
                            : 'Loading exercise database...'
                        }
                    </p>

                    {freeExercises.length === 0 && (
                        <div className="grid grid-cols-1 gap-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="animate-pulse bg-white/[0.03] rounded-2xl h-16" />
                            ))}
                        </div>
                    )}

                    {freeExercises.length > 0 && WORKOUT_CATEGORIES.map(cat => (
                        <CategorySection
                            key={cat.id}
                            cat={cat}
                            exercises={freeExercises}
                            onSelect={setDetailEx}
                        />
                    ))}
                </div>
            )}

            {/* Exercise detail modal (from browse) */}
            <AnimatePresence>
                {detailEx && <ExerciseDetail ex={detailEx} onClose={() => setDetailEx(null)} />}
            </AnimatePresence>
        </div>
    );
}
