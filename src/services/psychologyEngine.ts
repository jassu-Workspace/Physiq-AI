// Psychology Engine — Behavioral analysis, tone adaptation, and memory-driven coaching
// This is the "soul" of the trainer personality

import { type UserProfile, type WorkoutLog, type AIMessage } from './store';

export interface CoachMessage {
    greeting: string;
    mainMessage: string;
    tone: 'energetic' | 'calm' | 'supportive' | 'analytical' | 'empathetic';
    motivationLevel: 'high' | 'medium' | 'low';
    references: string[]; // past references like "Last week you..."
    suggestions: string[];
}

// Time-based greeting system
function getTimeBasedGreeting(name: string): { greeting: string; timeContext: 'morning' | 'afternoon' | 'evening' | 'night' } {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
        const morningGreetings = [
            `Good morning, ${name}! 🌅 Fresh day, fresh energy.`,
            `Rise and grind, ${name}! ☀️ Morning workouts hit different.`,
            `Hey ${name}! Early bird energy today — love to see it.`,
            `Morning, ${name}! Your body is primed for performance right now.`,
        ];
        return { greeting: morningGreetings[Math.floor(Math.random() * morningGreetings.length)], timeContext: 'morning' };
    }

    if (hour >= 12 && hour < 17) {
        const afternoonGreetings = [
            `Good afternoon, ${name}! 💪 Time to power through.`,
            `Hey ${name}, afternoon session? Smart choice — your strength peaks around now.`,
            `What's good, ${name}! Let's make this afternoon count.`,
        ];
        return { greeting: afternoonGreetings[Math.floor(Math.random() * afternoonGreetings.length)], timeContext: 'afternoon' };
    }

    if (hour >= 17 && hour < 21) {
        const eveningGreetings = [
            `Good evening, ${name}! 🌆 Let's close the day strong.`,
            `Evening, ${name}. Perfect time to de-stress and train.`,
            `Hey ${name}! Evening session — your muscles are warm and ready.`,
        ];
        return { greeting: eveningGreetings[Math.floor(Math.random() * eveningGreetings.length)], timeContext: 'evening' };
    }

    const nightGreetings = [
        `Late night session, ${name}? 🌙 Respect the dedication.`,
        `Hey ${name}, burning the midnight oil? Let's keep it focused and efficient.`,
        `Night mode, ${name}. Quick recovery-focused work tonight.`,
    ];
    return { greeting: nightGreetings[Math.floor(Math.random() * nightGreetings.length)], timeContext: 'night' };
}

// Analyze user behavior and determine tone
function analyzeBehavior(user: UserProfile, recentWorkouts: WorkoutLog[]): {
    tone: CoachMessage['tone'];
    motivationLevel: CoachMessage['motivationLevel'];
    behaviorInsights: string[];
} {
    const psych = user.psychState;
    const insights: string[] = [];
    let tone: CoachMessage['tone'] = 'supportive';
    let motivationLevel: CoachMessage['motivationLevel'] = 'medium';

    // Check streak
    if (psych.consistencyStreak >= 14) {
        tone = 'energetic';
        motivationLevel = 'high';
        insights.push(`🔥 You're on a ${psych.consistencyStreak}-day streak! Incredible consistency.`);
    } else if (psych.consistencyStreak >= 7) {
        tone = 'analytical';
        motivationLevel = 'high';
        insights.push(`📈 ${psych.consistencyStreak}-day streak building. Your body is adapting beautifully.`);
    } else if (psych.consistencyStreak >= 3) {
        tone = 'supportive';
        motivationLevel = 'medium';
        insights.push(`Nice — ${psych.consistencyStreak} days going. Keep building that momentum.`);
    }

    // Check for missed workouts
    if (psych.recentSkipCount > 3) {
        tone = 'empathetic';
        motivationLevel = 'low';
        insights.push(`I noticed you've been away a bit. That's completely normal — consistency fluctuates, and it's better to come back than to not come back at all.`);
    } else if (psych.recentSkipCount > 1) {
        tone = 'supportive';
        insights.push(`A couple of missed sessions — no stress. Let's adjust the plan so it fits your current energy.`);
    }

    // Check mood trends
    if (recentWorkouts.length >= 3) {
        const avgMood = recentWorkouts.reduce((s, w) => s + w.moodAfter, 0) / recentWorkouts.length;
        if (avgMood >= 4) {
            insights.push(`Your mood has been consistently great after workouts lately. Exercise is your medicine. 💊`);
        } else if (avgMood <= 2) {
            tone = 'empathetic';
            insights.push(`I've noticed your post-workout mood has been lower. We might need to adjust intensity to avoid burnout.`);
        }
    }

    // Check energy levels
    if (recentWorkouts.length > 0) {
        const lastWorkout = recentWorkouts[recentWorkouts.length - 1];
        if (lastWorkout.energyLevel <= 2) {
            insights.push(`Your energy was low last session. Today, I've dialed back the volume a bit. Quality over quantity.`);
        }
    }

    return { tone, motivationLevel, behaviorInsights: insights };
}

import {
    getMemorySeeds,
    generateMemoryReferences,
    getAverageMood
} from './memoryEngine';

// Coach messages are now generated using externalized memory-reference logic

// Main function: Generate coach message
export function generateCoachMessage(user: UserProfile, history: WorkoutLog[]): CoachMessage {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentWorkouts = history.filter(w => w.date >= cutoff);
    const { greeting, timeContext } = getTimeBasedGreeting(user.name);

    // Level 1-4 Behavioral Analysis
    const { tone: baseTone, motivationLevel, behaviorInsights } = analyzeBehavior(user, recentWorkouts);

    // Level 5: Persona Adaptation
    const archetype = user.userType || 'unknown';
    let mainMessage = '';
    const suggestions: string[] = [];
    let activeTone = baseTone;

    // Apply Archetype-specific overrides
    if (archetype === 'disciplined') {
        activeTone = 'energetic';
        mainMessage = `You're operating at a high level, ${user.name}. Your consistency is elite — you're in that top 1% bracket of performers. Today's session is optimized for maximum efficiency. Let's get in, dominate, and move on.`;
        suggestions.push('Record your RPE for every set to refine the next phase');
        suggestions.push('Focus on explosive concentric movements today');
    } else if (archetype === 'struggler') {
        activeTone = 'empathetic';
        mainMessage = `Hey ${user.name}, checking in. The hardest part isn't the lifting — it's just showing up when life gets heavy. I've stripped today's session down to the absolute essentials. We're focusing on quality over quantity. You've got this.`;
        suggestions.push('If energy is low, just complete the first 2 compound lifts');
        suggestions.push('Remember: a 15-minute workout beats a 0-minute workout');
    } else if (archetype === 'analytical') {
        activeTone = 'analytical';
        mainMessage = `Based on your recent volume trends and recovery markers, your physiological adaptation is progressing as expected. I've balanced today's load to ensure we're hitting that sweet spot between stimulus and recovery.`;
        suggestions.push('Monitor your heart rate recovery between sets');
        suggestions.push('Review the "Why" explanation for today\'s volume choice');
    } else if (archetype === 'competitive') {
        activeTone = 'energetic';
        mainMessage = `Time to raise the bar, ${user.name}. You're on a roll, and honestly? You're out-training most people in your fitness bracket right now. I've added a "Challenge Set" to today's main lift. Let's see what you're made of.`;
        suggestions.push('Try to beat your rep count from last week on the final set');
        suggestions.push('Keep that streak alive — consistency is your greatest weapon');
    } else {
        // Fallback to base logic
        switch (activeTone) {
            case 'energetic':
                mainMessage = `You're absolutely crushing it! Your consistency is setting you apart. Let's keep the momentum — today's session is designed to capitalize on your current strength gains.`;
                break;
            case 'empathetic':
                mainMessage = `Taking time off doesn't erase your progress. Today, we'll ease back in with a session that feels good, not punishing. Quality over quantity.`;
                break;
            case 'analytical':
                mainMessage = `Looking at your recent data, your recovery patterns are solid and your volume is trending upward. Small, calculated increases are the way forward.`;
                break;
            case 'calm':
                mainMessage = timeContext === 'night'
                    ? `Late session — focus on mind-muscle connection and efficiency. No ego lifting, just quality work.`
                    : `Today's plan is designed for steady progress. No rush, no stress. Just a productive session.`;
                break;
            case 'supportive':
            default:
                mainMessage = `Good to see you today! Every session is another investment in your future self. I've tailored today's plan based on where you are right now.`;
                break;
        }
        suggestions.push('Focus on mind-muscle connection for every rep');
        suggestions.push('Stay hydrated throughout the session');
    }

    return {
        greeting,
        mainMessage,
        tone: activeTone,
        motivationLevel,
        references: [...behaviorInsights, ...generateMemoryReferences(user, recentWorkouts, history)],
        suggestions,
    };
}

// Get consistency score (0-100) — Level 5 Multi-factor Score
export function getConsistencyScore(user: UserProfile, history: WorkoutLog[]): number {
    const workouts = history;
    const last30Days = workouts.filter(w => w.date > Date.now() - 30 * 24 * 60 * 60 * 1000);
    const planned = user.daysPerWeek * 4; // Approx 4 weeks

    if (planned === 0) return 0;

    // Part A: Workout Adherence (70% weight)
    const adherence = Math.min(100, (last30Days.length / planned) * 100);

    // Part B: Psychological Engagement (30% weight)
    const moodScore = getAverageMood(workouts); // 1-5 scale
    const engagement = (moodScore / 5) * 100;

    // Part C: Final Weighting
    return Math.round((adherence * 0.7) + (engagement * 0.3));
}

// Get recovery status
export function getRecoveryStatus(user: UserProfile, history: WorkoutLog[]): {
    overall: 'fresh' | 'recovered' | 'moderate' | 'fatigued' | 'overtrained';
    score: number;
    recommendation: string;
} {
    const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000;
    const recentWorkouts = history.filter(w => w.date >= cutoff);

    if (recentWorkouts.length === 0) {
        return { overall: 'fresh', score: 100, recommendation: 'Fully rested — perfect time for an intense session!' };
    }

    const lastWorkout = recentWorkouts[recentWorkouts.length - 1];
    const hoursSinceLast = (Date.now() - lastWorkout.date) / (1000 * 60 * 60);
    const totalSetsRecent = recentWorkouts.reduce((s, w) =>
        s + w.exercises.reduce((ss, e) => ss + e.sets.length, 0), 0);

    let score = 100;

    // Time penalty
    if (hoursSinceLast < 12) score -= 40;
    else if (hoursSinceLast < 24) score -= 20;
    else if (hoursSinceLast < 48) score -= 5;

    // Volume penalty
    if (totalSetsRecent > 60) score -= 20;
    else if (totalSetsRecent > 40) score -= 10;

    // Energy bonus
    if (lastWorkout.energyLevel >= 4) score += 10;
    else if (lastWorkout.energyLevel <= 2) score -= 10;

    score = Math.max(0, Math.min(100, score));

    let overall: 'fresh' | 'recovered' | 'moderate' | 'fatigued' | 'overtrained';
    let recommendation: string;

    if (score >= 85) {
        overall = 'fresh'; recommendation = 'You\'re fully recovered. Push hard today!';
    } else if (score >= 70) {
        overall = 'recovered'; recommendation = 'Good recovery. Standard intensity is perfect.';
    } else if (score >= 50) {
        overall = 'moderate'; recommendation = 'Moderate fatigue — consider lighter weights or fewer sets.';
    } else if (score >= 30) {
        overall = 'fatigued'; recommendation = 'High fatigue detected. Light session or active recovery recommended.';
    } else {
        overall = 'overtrained'; recommendation = 'Rest day strongly recommended. Your body needs recovery.';
    }

    return { overall, score, recommendation };
}

// Weekly adherence data for charts
export function getWeeklyAdherence(user: UserProfile, history: WorkoutLog[], weeks: number = 4): { week: string; planned: number; completed: number; percentage: number }[] {
    if (!user) return [];

    const result: { week: string; planned: number; completed: number; percentage: number }[] = [];

    for (let i = weeks - 1; i >= 0; i--) {
        const weekStart = Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000;
        const weekEnd = Date.now() - i * 7 * 24 * 60 * 60 * 1000;
        const weekWorkouts = history.filter(w => w.date >= weekStart && w.date < weekEnd);

        const planned = user.daysPerWeek;
        const completed = weekWorkouts.length;

        result.push({
            week: `Week ${weeks - i}`,
            planned,
            completed,
            percentage: planned > 0 ? Math.round((completed / planned) * 100) : 0,
        });
    }

    return result;
}
