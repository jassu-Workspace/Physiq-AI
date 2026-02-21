import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
    Dumbbell, Flame, Trophy, TrendingUp, Clock, Zap, ChevronRight,
    Sun, Moon, Heart, Activity, Calendar, Loader2, MessageCircle, Target, UserCog, LogOut
} from 'lucide-react';
import { type UserProfile, useLogEmotion, useEmotions, useWorkoutHistory, normalizeWorkoutLog, useDailyCheckins, useLogDailyCheckin } from '../services/store';
import { getCoachGreeting } from '../services/coachAI';
import { generateWorkout, getWeeklyPlan, type GeneratedWorkout } from '../services/workoutEngine';
import { getNutritionSummary } from '../services/nutritionEngine';
import { getConsistencyScore, getRecoveryStatus } from '../services/psychologyEngine';
import { getBestLifts, detectMilestones, type BestLift, type Milestone } from '../services/memoryEngine';
import { getUIConfig, type UIConfig } from '../services/uiAdapter';
import { detectArchetype } from '../services/identityEngine';


interface DashboardProps {
    user: UserProfile;
    onNavigate: (tab: string) => void;
    onLogout?: () => Promise<void> | void;
    onEditProfile?: () => void;
}

export default function Dashboard({ user, onNavigate, onLogout, onEditProfile }: DashboardProps) {
    const [greeting, setGreeting] = useState('');
    const [coachMessage, setCoachMessage] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [references, setReferences] = useState<string[]>([]);
    const [todayWorkout, setTodayWorkout] = useState<GeneratedWorkout | null>(null);
    const [bestLifts, setBestLifts] = useState<BestLift[]>([]);
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [loading, setLoading] = useState(true);

    const [checkinForm, setCheckinForm] = useState({
        weight: user.weight,
        height: user.height,
        gymTiming: user.wakeUpTime,
        plannedMeals: '',
        eatenMeals: '',
        supplementsTaken: '',
        preWorkoutMeal: '',
        distanceHomeToGymKm: 1,
        distanceGymToHomeKm: 1,
        transportMode: 'walk' as 'walk' | 'bike' | 'car' | 'public_transport' | 'other',
        mood: 3,
        energy: 3,
        notes: '',
    });

    // Convex integrations
    // Supabase integrations
    const aiHistory = [] as any; // TODO: Implement Supabase AI history hook if needed
    const historyData = useWorkoutHistory(user.id);
    const history = (historyData || []).map(normalizeWorkoutLog);
    const uiConfig = getUIConfig(user);
    // Derived stats using history
    const consistencyScore = getConsistencyScore(user, history);
    const recoveryStatus = getRecoveryStatus(user, history);
    const nutritionSummary = getNutritionSummary(user);
    const weeklyPlan = getWeeklyPlan(user);
    const todayWorkoutLogs = history.filter(w => new Date(w.date).toDateString() === new Date().toDateString());
    const caloriesBurnedToday = todayWorkoutLogs.reduce((sum, workoutLog) => sum + Math.round((workoutLog.duration || 0) * 7), 0);

    const [showEmotionCheck, setShowEmotionCheck] = useState(true);
    const logEmotion = useLogEmotion();
    const emotionalLogs = useEmotions(user.id, 1);
    const dailyCheckins = useDailyCheckins(user.id, 3);
    const logDailyCheckin = useLogDailyCheckin();

    const hasCheckedInToday = emotionalLogs !== undefined && emotionalLogs !== null && emotionalLogs.length > 0 &&
        new Date(emotionalLogs[0].date).toDateString() === new Date().toDateString();

    const hasDailyCheckinToday = (dailyCheckins || []).some(c => new Date(c.date).toDateString() === new Date().toDateString());
    const latestDailyCheckin = dailyCheckins && dailyCheckins.length > 0 ? dailyCheckins[0] : null;
    const personalizationNudge = latestDailyCheckin
        ? `Mood ${latestDailyCheckin.mood || 3}/5 • Energy ${latestDailyCheckin.energy || 3}/5 • commute by ${latestDailyCheckin.transportMode || 'walk'}. Coach mode adjusted for today.`
        : `No daily check-in logged yet. Add today’s details so your workout, meals, and coaching tone adapt to you.`;

    useEffect(() => {
        if (hasCheckedInToday) {
            setShowEmotionCheck(false);
        }
    }, [hasCheckedInToday]);

    // Archetype Detection Effect
    useEffect(() => {
        if (user.id) {
            const profile = detectArchetype(user, history.filter(w => w.date >= Date.now() - 14 * 24 * 60 * 60 * 1000), aiHistory, history);
        }
    }, [aiHistory, user, history]);

    const handleLogEmotion = async (mood: number) => {
        try {
            if (!user.id) return;
            await logEmotion({
                userId: user.id,
                date: Date.now(),
                mood,
                energy: 3,
                stress: 3,
                context: 'daily_checkin',
            });
            setShowEmotionCheck(false);
        } catch (error) {
            console.error('Failed to log emotion:', error);
        }
    };

    const handleSubmitDailyCheckin = async () => {
        if (!user.id) return;
        try {
            await logDailyCheckin({
                userId: user.id,
                date: Date.now(),
                ...checkinForm,
            });

            await logEmotion({
                userId: user.id,
                date: Date.now(),
                mood: checkinForm.mood,
                energy: checkinForm.energy,
                stress: 3,
                feeling: 'daily_checkin',
                context: `transport:${checkinForm.transportMode}`,
            });

            setShowEmotionCheck(false);
        } catch (error) {
            console.error('Failed to save daily check-in', error);
        }
    };

    useEffect(() => {
        const loadInitialMessages = async () => {
            if (historyData === undefined) return;
            try {
                // Get AI coach greeting
                const coach = await getCoachGreeting(user, history);
                setGreeting(coach.greeting);
                setCoachMessage(coach.message);
                setSuggestions(coach.suggestions);
                setReferences(coach.references);

                // Generate today's workout
                const workout = generateWorkout(user, history);
                setTodayWorkout(workout);

                // Load memory data
                setBestLifts(getBestLifts(history).slice(0, 3));
                setMilestones(detectMilestones(user, history).reverse().slice(0, 3));
            } catch (error) {
                console.error('Dashboard init error:', error);
                setGreeting(`Welcome back, ${user.name}! 💪`);
                setCoachMessage('Ready for another great session? Let\'s make today count.');
            } finally {
                setLoading(false);
            }
        };
        loadInitialMessages();
    }, [user, historyData]);

    if (loading || historyData === undefined) {
        return (
            <div className="flex items-center justify-center h-full min-h-[500px]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-[#6C63FF] animate-spin" />
                    <p className="text-slate-400 text-sm">Coach Arjun is preparing your session...</p>
                </div>
            </div>
        );
    }

    const recoveryColor = recoveryStatus.overall === 'fresh' ? 'text-green-400' :
        recoveryStatus.overall === 'recovered' ? 'text-emerald-400' :
            recoveryStatus.overall === 'moderate' ? 'text-yellow-400' :
                recoveryStatus.overall === 'fatigued' ? 'text-orange-400' : 'text-red-400';

    return (
        <div className="max-w-7xl mx-auto flex flex-col gap-6 p-4 lg:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEditProfile?.()}
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-slate-200 hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                        <UserCog size={14} /> Edit Profile
                    </button>
                    <button
                        onClick={() => onLogout?.()}
                        className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-sm font-semibold text-red-300 hover:bg-red-500/20 transition-all flex items-center gap-2"
                    >
                        <LogOut size={14} /> Logout
                    </button>
                </div>
                <p className="text-xs text-slate-400">Today burn estimate: {caloriesBurnedToday} kcal</p>
            </div>

            {/* Coach Greeting Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-gradient-to-br ${uiConfig.theme.accentGradient} opacity-15 border border-white/20 rounded-3xl p-6 lg:p-8 relative overflow-hidden`}
            >
                <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>
                <div className="flex items-start gap-4 relative z-10">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${uiConfig.theme.accentGradient} flex items-center justify-center text-white text-xl font-bold shadow-lg shrink-0`}>
                        {user.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-bold text-[#6C63FF]">Coach Arjun</h3>
                            <span className="text-[10px] font-medium bg-[#6C63FF]/20 text-[#6C63FF] px-2 py-0.5 rounded-full">AI Trainer</span>
                        </div>
                        <p className="text-xl lg:text-2xl font-bold text-white mb-2">{greeting}</p>
                        <p className="text-slate-300 text-sm leading-relaxed">{coachMessage}</p>
                        <p className="text-xs text-slate-400 mt-2">{personalizationNudge}</p>

                        {references.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {references.slice(0, 2).map((ref, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                                        <TrendingUp size={12} className="text-[#6C63FF] mt-0.5 shrink-0" />
                                        <span>{ref}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {suggestions.length > 0 && (
                    <div className="flex gap-2 mt-5 flex-wrap">
                        {suggestions.map((s, i) => (
                            <span key={i} className="text-xs bg-white/5 border border-white/10 text-slate-300 px-3 py-1.5 rounded-full">
                                💡 {s}
                            </span>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Consistency Score */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.06] transition-all cursor-pointer"
                    onClick={() => onNavigate('progress')}
                >
                    <div className="flex items-center justify-between mb-3">
                        <Trophy className="text-yellow-400" size={20} />
                        <span className="text-[10px] font-semibold bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded-full">Score</span>
                    </div>
                    <p className="text-3xl font-extrabold text-white">{consistencyScore}<span className="text-lg text-slate-500">%</span></p>
                    <p className="text-xs text-slate-400 mt-1">Consistency</p>
                </motion.div>

                {/* Recovery */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.06] transition-all cursor-pointer"
                >
                    <div className="flex items-center justify-between mb-3">
                        <Heart className={recoveryColor} size={20} />
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${recoveryStatus.score >= 70 ? 'bg-green-400/10 text-green-400' :
                            recoveryStatus.score >= 40 ? 'bg-yellow-400/10 text-yellow-400' :
                                'bg-red-400/10 text-red-400'
                            }`}>{recoveryStatus.overall}</span>
                    </div>
                    <p className="text-3xl font-extrabold text-white">{recoveryStatus.score}<span className="text-lg text-slate-500">%</span></p>
                    <p className="text-xs text-slate-400 mt-1">Recovery</p>
                </motion.div>

                {/* Calories Target */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.06] transition-all cursor-pointer"
                    onClick={() => onNavigate('nutrition')}
                >
                    <div className="flex items-center justify-between mb-3">
                        <Flame className="text-orange-400" size={20} />
                        <span className="text-[10px] font-semibold bg-orange-400/10 text-orange-400 px-2 py-0.5 rounded-full">Daily</span>
                    </div>
                    <p className="text-3xl font-extrabold text-white">{nutritionSummary.calories.toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-1">Target kcal</p>
                </motion.div>

                {/* Protein Target */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.06] transition-all cursor-pointer"
                    onClick={() => onNavigate('nutrition')}
                >
                    <div className="flex items-center justify-between mb-3">
                        <Target className="text-[#6C63FF]" size={20} />
                        <span className="text-[10px] font-semibold bg-[#6C63FF]/10 text-[#6C63FF] px-2 py-0.5 rounded-full">{nutritionSummary.proteinPerKg}g/kg</span>
                    </div>
                    <p className="text-3xl font-extrabold text-white">{nutritionSummary.protein}<span className="text-lg text-slate-500">g</span></p>
                    <p className="text-xs text-slate-400 mt-1">Protein Target</p>
                </motion.div>
            </div>

            {/* Main Content Grid */}
            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${uiConfig.layout === 'dense' ? 'lg:gap-4' : 'lg:gap-8'}`}>
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Level 5 Emotional Check-in */}
                    {showEmotionCheck && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gradient-to-br from-[#6C63FF]/10 to-purple-600/10 border border-[#6C63FF]/20 rounded-3xl p-6 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                                <Heart size={48} className="text-[#6C63FF] fill-[#6C63FF]/10" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 relative z-10">Daily Pulse</h3>
                            <p className="text-sm text-slate-400 mb-6 relative z-10">Specifically, how are you feeling right now, {user.name}?</p>

                            <div className="flex gap-4 relative z-10">
                                {[
                                    { icon: '😔', label: 'Rough', val: 1, color: 'hover:bg-red-500/10 hover:border-red-500/20' },
                                    { icon: '😐', label: 'Okay', val: 3, color: 'hover:bg-yellow-500/10 hover:border-yellow-400/20' },
                                    { icon: '😊', label: 'Strong', val: 5, color: 'hover:bg-green-500/10 hover:border-green-500/20' },
                                ].map((e) => (
                                    <button
                                        key={e.val}
                                        onClick={() => handleLogEmotion(e.val)}
                                        className={`flex-1 p-4 rounded-2xl bg-white/5 border border-white/10 ${e.color} transition-all group/btn`}
                                    >
                                        <span className="text-3xl block transform group-hover/btn:scale-110 transition-transform">{e.icon}</span>
                                        <span className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-widest">{e.label}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Priority Section: Workout or Motivation */}
                    {(uiConfig.prioritySection === 'workout' || uiConfig.prioritySection === 'motivation') ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-6 hover:shadow-[0_0_30px_rgba(108,99,255,0.08)] transition-shadow"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Dumbbell size={20} className="text-[#6C63FF]" />
                                        Today's Workout
                                    </h2>
                                    <p className="text-sm text-slate-400 mt-1">{todayWorkout?.splitDay} — {todayWorkout?.focus}</p>
                                </div>
                                {todayWorkout && todayWorkout.exercises.length > 0 && (
                                    <div className="flex items-center gap-3 text-xs text-slate-400">
                                        <span className="flex items-center gap-1"><Clock size={12} /> {todayWorkout.estimatedDuration} min</span>
                                        <span className={`px-2 py-1 rounded-full ${todayWorkout.intensity === 'intense' ? 'bg-red-500/10 text-red-400' :
                                            todayWorkout.intensity === 'moderate' ? 'bg-yellow-500/10 text-yellow-400' :
                                                'bg-green-500/10 text-green-400'
                                            }`}>{todayWorkout.intensity}</span>
                                    </div>
                                )}
                            </div>

                            {todayWorkout && todayWorkout.exercises.length > 0 ? (
                                <>
                                    <div className="space-y-3 mb-5">
                                        {todayWorkout.exercises.slice(0, 5).map((ex, i) => (
                                            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.06] transition-all group">
                                                <div className="w-10 h-10 rounded-xl bg-[#6C63FF]/10 flex items-center justify-center text-sm font-bold text-[#6C63FF]">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-white truncate">{ex.exercise.name}</p>
                                                    <p className="text-xs text-slate-500">{ex.exercise.muscleGroup} • {ex.exercise.equipment}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-white">{ex.sets} × {ex.reps}</p>
                                                    <p className="text-[10px] text-slate-500">{ex.restSeconds}s rest</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => onNavigate('workouts')}
                                        className={`w-full py-3 bg-gradient-to-r ${uiConfig.theme.accentGradient} text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]`}
                                    >
                                        <Zap size={16} />
                                        Start Workout
                                    </button>
                                </>
                            ) : (
                                <div className="text-center py-10">
                                    <Sun className="mx-auto text-yellow-400 mb-3" size={40} />
                                    <p className="text-lg font-bold text-white">Rest Day</p>
                                    <p className="text-sm text-slate-400 mt-2">{todayWorkout?.coachNote}</p>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        /* Alternate Priority: PRs & Milestones (For Competitive/Analytical) */
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-6"
                        >
                            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                                <Trophy size={22} className="text-yellow-400" />
                                Achievement Registry
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Top Performance Records</p>
                                    <div className="space-y-3">
                                        {bestLifts.map((pr, i) => (
                                            <div key={i} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex justify-between items-center group hover:bg-white/[0.05] transition-all">
                                                <div>
                                                    <p className="text-sm font-bold text-white">{pr.exerciseName}</p>
                                                    <p className="text-[10px] text-slate-500">{new Date(pr.date).toLocaleDateString()}</p>
                                                </div>
                                                <p className="text-xl font-black text-yellow-400">{pr.weight}kg</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Key Milestones</p>
                                    <div className="space-y-3">
                                        {milestones.map((m, i) => (
                                            <div key={i} className="p-4 rounded-2xl bg-[#6C63FF]/5 border border-[#6C63FF]/10 flex gap-4 hover:bg-[#6C63FF]/10 transition-all">
                                                <div className="w-10 h-10 rounded-xl bg-[#6C63FF]/10 flex items-center justify-center shrink-0">
                                                    <Zap className="text-[#6C63FF]" size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">{m.label}</p>
                                                    <p className="text-[10px] text-slate-500">{new Date(m.date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Weekly Plan (Secondary for main area) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-6"
                        >
                            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                                <Calendar size={18} className="text-[#6C63FF]" />
                                Schedule Highlights
                            </h2>
                            <div className="space-y-2">
                                {weeklyPlan.filter(d => d.isToday || !d.isRest).slice(0, 4).map((day, i) => (
                                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${day.isToday ? 'bg-[#6C63FF]/10 border border-[#6C63FF]/20' : 'bg-white/5'}`}>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold text-slate-500">{day.day}</span>
                                            <span className="text-sm text-slate-300">{day.label}</span>
                                        </div>
                                        {day.isToday && <span className="text-[10px] font-bold text-[#6C63FF]">ACTIVE</span>}
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Flipped Section: Workout or Achievements */}
                        {(uiConfig.prioritySection === 'data' || uiConfig.prioritySection === 'milestones') ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-6"
                            >
                                <h2 className="text-lg font-bold text-white mb-4">Active Plan</h2>
                                <p className="text-sm text-slate-300">{todayWorkout?.splitDay}</p>
                                <div className="mt-4 flex gap-2">
                                    <button onClick={() => onNavigate('workouts')} className="flex-1 py-2 bg-white/5 rounded-xl text-xs hover:bg-white/10 transition-all">Details</button>
                                    <button onClick={() => onNavigate('workouts')} className="flex-1 py-2 bg-[#6C63FF] rounded-xl text-xs text-white font-bold transition-all">Start</button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-6"
                            >
                                <h2 className="text-lg font-bold text-white mb-4">Records</h2>
                                <div className="space-y-2">
                                    {bestLifts.map((pr, i) => (
                                        <div key={i} className="flex justify-between items-center text-xs">
                                            <span className="text-slate-400">{pr.exerciseName}</span>
                                            <span className="font-bold text-white">{pr.weight}kg</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Compact Coaching */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#6C63FF]/5 border border-[#6C63FF]/10 rounded-3xl p-6"
                    >
                        <h3 className="text-xs font-bold text-[#6C63FF] uppercase mb-4">Quick Coaching</h3>
                        <div className="space-y-4">
                            {suggestions.slice(0, 3).map((s, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-[#6C63FF]/20 flex items-center justify-center shrink-0">
                                        <Activity size={12} className="text-[#6C63FF]" />
                                    </div>
                                    <p className="text-xs text-slate-300 italic">"{s}"</p>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => onNavigate('coach')}
                            className={`w-full mt-6 py-3 bg-gradient-to-r ${uiConfig.theme.accentGradient} text-white rounded-2xl font-bold text-xs shadow-lg flex items-center justify-center gap-2`}
                        >
                            <MessageCircle size={14} /> Open Coach Chat
                        </button>
                    </motion.div>

                    {/* Nutrition Preview */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-6"
                    >
                        <h3 className="text-sm font-bold text-white mb-4">Nutrition</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] text-slate-500 uppercase font-bold">Protein</span>
                                <span className="text-sm font-bold text-white">{nutritionSummary.protein}g</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-[#6C63FF]" style={{ width: '65%' }}></div>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] text-slate-500 uppercase font-bold">Cals</span>
                                <span className="text-sm font-bold text-white">{nutritionSummary.calories}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-[#6C63FF]/20 via-purple-500/15 to-[#6C63FF]/20 border border-[#6C63FF]/40 rounded-3xl p-8 shadow-lg shadow-[#6C63FF]/10"
                >
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                            <Target size={24} className="text-[#6C63FF]" />
                            Required Daily Check-in
                        </h2>
                        <p className="text-sm text-slate-200">Log today's body, meals, supplements, gym timing, and commute for fully personalized coaching.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                        <div>
                            <label className="text-sm font-bold text-white block mb-2.5">📏 Current Weight (kg)</label>
                            <input
                                type="number"
                                value={checkinForm.weight}
                                onChange={(e) => setCheckinForm({ ...checkinForm, weight: Number(e.target.value) })}
                                placeholder={String(user.weight || 70)}
                                className="w-full bg-white/8 border border-white/20 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-300 focus:outline-none focus:border-[#6C63FF]/80 focus:ring-2 focus:ring-[#6C63FF]/50 transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-bold text-white block mb-2.5">📐 Height (cm)</label>
                            <input
                                type="number"
                                value={checkinForm.height}
                                onChange={(e) => setCheckinForm({ ...checkinForm, height: Number(e.target.value) })}
                                placeholder={String(user.height || 170)}
                                className="w-full bg-white/8 border border-white/20 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-300 focus:outline-none focus:border-[#6C63FF]/80 focus:ring-2 focus:ring-[#6C63FF]/50 transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-bold text-white block mb-2.5">⏰ Woke Up Time</label>
                            <input
                                type="time"
                                value={checkinForm.gymTiming}
                                onChange={(e) => setCheckinForm({ ...checkinForm, gymTiming: e.target.value })}
                                className="w-full bg-white/8 border border-white/20 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#6C63FF]/80 focus:ring-2 focus:ring-[#6C63FF]/50 transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-bold text-white block mb-2.5">🍽️ Planned Meals Today</label>
                            <input
                                type="text"
                                value={checkinForm.plannedMeals}
                                onChange={(e) => setCheckinForm({ ...checkinForm, plannedMeals: e.target.value })}
                                placeholder="Breakfast, Lunch, Dinner..."
                                className="w-full bg-white/8 border border-white/20 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-300 focus:outline-none focus:border-[#6C63FF]/80 focus:ring-2 focus:ring-[#6C63FF]/50 transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-bold text-white block mb-2.5">🥗 What You Have Eaten</label>
                            <input
                                type="text"
                                value={checkinForm.eatenMeals}
                                onChange={(e) => setCheckinForm({ ...checkinForm, eatenMeals: e.target.value })}
                                placeholder="Breakfast, Lunch, Dinner..."
                                className="w-full bg-white/8 border border-white/20 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-300 focus:outline-none focus:border-[#6C63FF]/80 focus:ring-2 focus:ring-[#6C63FF]/50 transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-bold text-white block mb-2.5">⚡ Pre-Workout Meal</label>
                            <input
                                type="text"
                                value={checkinForm.preWorkoutMeal}
                                onChange={(e) => setCheckinForm({ ...checkinForm, preWorkoutMeal: e.target.value })}
                                placeholder="e.g., Banana + Oats"
                                className="w-full bg-white/8 border border-white/20 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-300 focus:outline-none focus:border-[#6C63FF]/80 focus:ring-2 focus:ring-[#6C63FF]/50 transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-bold text-white block mb-2.5">💊 Supplements / Powders Used</label>
                            <input
                                type="text"
                                value={checkinForm.supplementsTaken}
                                onChange={(e) => setCheckinForm({ ...checkinForm, supplementsTaken: e.target.value })}
                                placeholder="1"
                                className="w-full bg-white/8 border border-white/20 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-300 focus:outline-none focus:border-[#6C63FF]/80 focus:ring-2 focus:ring-[#6C63FF]/50 transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-bold text-white block mb-2.5">🔥 Post-Workout Meals</label>
                            <input
                                type="number"
                                min="0"
                                max="3"
                                placeholder="1"
                                className="w-full bg-white/8 border border-white/20 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-300 focus:outline-none focus:border-[#6C63FF]/80 focus:ring-2 focus:ring-[#6C63FF]/50 transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-bold text-white block mb-2.5">🏋️ Exercise Type</label>
                            <select className="w-full bg-white/8 border border-white/20 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#6C63FF]/80 focus:ring-2 focus:ring-[#6C63FF]/50 transition-all">
                                <option className="bg-[#0B0C15]">Walk (preferred)</option>
                                <option className="bg-[#0B0C15]">Running</option>
                                <option className="bg-[#0B0C15]">Gym</option>
                                <option className="bg-[#0B0C15]">Cardio</option>
                                <option className="bg-[#0B0C15]">Strength</option>
                                <option className="bg-[#0B0C15]">Mixed</option>
                                <option className="bg-[#0B0C15]">Rest Day</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-bold text-white block mb-2.5">⏱️ Gym Duration (min)</label>
                            <input
                                type="number"
                                min="0"
                                placeholder="60"
                                className="w-full bg-white/8 border border-white/20 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-300 focus:outline-none focus:border-[#6C63FF]/80 focus:ring-2 focus:ring-[#6C63FF]/50 transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-bold text-white block mb-2.5">🚗 Commute Time (min)</label>
                            <input
                                type="number"
                                min="0"
                                placeholder="30"
                                className="w-full bg-white/8 border border-white/20 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-300 focus:outline-none focus:border-[#6C63FF]/80 focus:ring-2 focus:ring-[#6C63FF]/50 transition-all"
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="text-sm font-bold text-white block mb-2.5">💭 Anything Else Today? (stress, sleep quality, soreness)</label>
                        <textarea
                            value={checkinForm.notes}
                            onChange={(e) => setCheckinForm({ ...checkinForm, notes: e.target.value })}
                            placeholder="Add any notes about your day..."
                            rows={4}
                            className="w-full bg-white/8 border border-white/20 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-300 focus:outline-none focus:border-[#6C63FF]/80 focus:ring-2 focus:ring-[#6C63FF]/50 transition-all resize-none"
                        />
                    </div>

                    <button
                        onClick={handleSubmitDailyCheckin}
                        className="w-full bg-gradient-to-r from-[#6C63FF] to-purple-500 hover:from-[#5B54DD] hover:to-purple-600 text-white rounded-2xl px-6 py-4 font-bold text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#6C63FF]/30"
                    >
                        <Zap size={20} />
                        Submit Daily Check-in
                    </button>
                </motion.div>
        </div>
    );
}
