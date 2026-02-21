import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Calendar, Flame, Target, Activity, Award, Dumbbell, Zap } from 'lucide-react';
import { type UserProfile, type WorkoutLog, type LoggedExercise, type LoggedSet, normalizeWorkoutLog, useWorkoutHistory } from '../services/store';
import { getConsistencyScore, getWeeklyAdherence, getRecoveryStatus } from '../services/psychologyEngine';
import { generateProgressNarrative } from '../services/narrativeEngine';

interface ProgressProps {
    user: UserProfile;
}

export default function Progress({ user }: ProgressProps) {
    const historyData = useWorkoutHistory(user.id);
    const history = (historyData || []).map(normalizeWorkoutLog);

    const narrative = generateProgressNarrative(user, history);
    const consistencyScore = getConsistencyScore(user, history);
    const weeklyAdherence = getWeeklyAdherence(user, history, 4);
    const recovery = getRecoveryStatus(user, history);
    const recentWorkouts = history.filter(w => w.date >= Date.now() - 30 * 24 * 60 * 60 * 1000);

    const totalVolume = useMemo(() => {
        return recentWorkouts.reduce((total, w) => {
            return total + w.exercises.reduce((exTotal, ex) => {
                return exTotal + ex.sets.reduce((setTotal, set) => setTotal + set.weight * set.reps, 0);
            }, 0);
        }, 0);
    }, [recentWorkouts]);

    const avgMood = useMemo(() => {
        if (recentWorkouts.length === 0) return 0;
        return Math.round(recentWorkouts.reduce((s, w) => s + w.moodAfter, 0) / recentWorkouts.length * 10) / 10;
    }, [recentWorkouts]);

    const daysSinceStart = Math.floor((Date.now() - (user.createdAt || Date.now())) / (1000 * 60 * 60 * 24));

    return (
        <div className="max-w-5xl mx-auto flex flex-col gap-6 p-4 lg:p-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl lg:text-4xl font-extrabold text-white flex items-center gap-3">
                    <TrendingUp className="text-[#6C63FF]" size={32} />
                    Progress
                </h1>
                <p className="text-slate-400 mt-1">Day {daysSinceStart || 1} of your journey</p>
            </div>

            {/* Level 6 Progress Narrative Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-8 rounded-3xl border shadow-xl relative overflow-hidden ${narrative.tone === 'celebratory' ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20' :
                    narrative.tone === 'analytical' ? 'bg-gradient-to-br from-[#6C63FF]/10 to-blue-500/10 border-[#6C63FF]/20' :
                        'bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-white/10'
                    }`}
            >
                {/* Decorative background accent */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#6C63FF]/10 blur-[80px] pointer-events-none"></div>

                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className={`p-2 rounded-xl ${narrative.tone === 'celebratory' ? 'bg-yellow-400/20 text-yellow-400' : 'bg-[#6C63FF]/20 text-[#6C63FF]'}`}>
                        <Award size={20} />
                    </div>
                    <h2 className="text-lg font-bold text-white uppercase tracking-wider">{narrative.title}</h2>
                </div>

                <p className="text-xl lg:text-2xl font-serif italic text-white leading-relaxed relative z-10">
                    "{narrative.narrative}"
                </p>

                <div className="grid grid-cols-3 gap-6 mt-10 relative z-10">
                    {narrative.metrics.map((m, i) => (
                        <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-4 group hover:bg-white/10 transition-colors">
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">{m.label}</p>
                            <p className="text-xl font-black text-white">{m.value}</p>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Score Ring */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-[#6C63FF]/15 to-purple-600/10 border border-[#6C63FF]/20 rounded-3xl p-8 flex flex-col items-center"
            >
                <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                        <circle
                            cx="50" cy="50" r="42"
                            fill="none"
                            stroke="url(#gradient)"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={`${(consistencyScore / 100) * 264} 264`}
                        />
                        <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#6C63FF" />
                                <stop offset="100%" stopColor="#a855f7" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="text-center">
                        <p className="text-4xl font-extrabold text-white">{consistencyScore}</p>
                        <p className="text-xs text-slate-400">Consistency</p>
                    </div>
                </div>
                <p className="text-sm text-slate-300 mt-4 text-center max-w-md">
                    {consistencyScore >= 80 ? "You're an absolute machine! Top-tier consistency." :
                        consistencyScore >= 50 ? "Good consistency! Keep building that habit loop." :
                            consistencyScore > 0 ? "Every rep counts. Let's build momentum together." :
                                "Log your first workout to start tracking! 💪"}
                </p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: Dumbbell, label: 'Total Workouts', value: history.length, color: 'text-blue-400', bg: 'bg-blue-400' },
                    { icon: Flame, label: 'Current Streak', value: `${user.psychState.consistencyStreak}d`, color: 'text-orange-400', bg: 'bg-orange-400' },
                    { icon: Activity, label: 'Total Volume', value: totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(0)}k` : `${totalVolume}`, suffix: 'kg', color: 'text-green-400', bg: 'bg-green-400' },
                    { icon: Award, label: 'Avg Mood', value: avgMood || '—', suffix: '/5', color: 'text-yellow-400', bg: 'bg-yellow-400' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5"
                    >
                        <stat.icon className={stat.color} size={20} />
                        <p className="text-2xl font-extrabold text-white mt-3">
                            {stat.value}<span className="text-sm text-slate-500">{(stat as any).suffix || ''}</span>
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Weekly Adherence */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-5">
                    <Calendar size={18} className="text-[#6C63FF]" />
                    Weekly Adherence
                </h2>
                <div className="space-y-4">
                    {weeklyAdherence.map((week, i) => (
                        <div key={i}>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-300 font-medium">{week.week}</span>
                                <span className="text-xs text-slate-400">
                                    {week.completed}/{week.planned} workouts • {week.percentage}%
                                </span>
                            </div>
                            <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    className={`h-full rounded-full ${week.percentage >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                        week.percentage >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                            'bg-gradient-to-r from-red-500 to-pink-500'
                                        }`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(week.percentage, 100)}%` }}
                                    transition={{ duration: 0.5, delay: 0.1 * i }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
                {weeklyAdherence.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-6">Complete your first week to see adherence data</p>
                )}
            </div>

            {/* Recovery Status */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-5">
                    <Zap size={18} className="text-yellow-400" />
                    Current Recovery Status
                </h2>
                <div className="flex items-center gap-4 mb-4">
                    <div className="relative w-20 h-20">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                            <circle
                                cx="50" cy="50" r="42"
                                fill="none"
                                stroke={recovery.score >= 70 ? '#22c55e' : recovery.score >= 40 ? '#eab308' : '#ef4444'}
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${(recovery.score / 100) * 264} 264`}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold text-white">{recovery.score}%</span>
                        </div>
                    </div>
                    <div>
                        <p className={`text-lg capitalize font-bold ${recovery.overall === 'fresh' || recovery.overall === 'recovered' ? 'text-green-400' :
                            recovery.overall === 'moderate' ? 'text-yellow-400' : 'text-red-400'
                            }`}>{recovery.overall}</p>
                        <p className="text-sm text-slate-400">{recovery.recommendation}</p>
                    </div>
                </div>
            </div>

            {/* Recent Workout History */}
            {recentWorkouts.length > 0 && (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-5">
                        <Dumbbell size={18} className="text-[#6C63FF]" />
                        Recent Workouts
                    </h2>
                    <div className="space-y-3">
                        {history.slice(0, 5).map((log, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                <div className="w-10 h-10 rounded-xl bg-[#6C63FF]/10 flex items-center justify-center">
                                    <Dumbbell size={16} className="text-[#6C63FF]" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-white">{log.splitDay}</p>
                                    <p className="text-xs text-slate-500">{new Date(log.date).toLocaleDateString()} • {log.exercises.length} exercises</p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 text-xs font-bold text-green-400">
                                        <Zap size={10} />
                                        {log.moodAfter}/5
                                    </div>
                                    <p className="text-[10px] text-slate-500">{log.duration} min</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
