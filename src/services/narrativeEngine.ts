/**
 * Narrative Engine — Level 6 (Narrative Storytelling) of the Personalization Pyramid
 * Converts raw fitness data into human-readable progress stories.
 */

import { type UserProfile, type WorkoutLog } from './store';
import { getBestLifts, detectMilestones } from './memoryEngine';

export interface ProgressHighlights {
    title: string;
    narrative: string;
    metrics: { label: string; value: string | number; change?: number }[];
    tone: 'celebratory' | 'analytical' | 'supportive';
}

/**
 * Generates a monthly or weekly narrative summary
 */
export function generateProgressNarrative(user: UserProfile, history: WorkoutLog[]): ProgressHighlights {
    const bestLifts = getBestLifts(history);
    const milestones = detectMilestones(user, history);

    // 1. Determine primary theme
    const recentWorkouts = history.slice(-7);
    const completedPlannedRatio = recentWorkouts.length / (user.daysPerWeek || 1);

    let tone: ProgressHighlights['tone'] = 'supportive';
    let title = 'Your Journey This Week';
    let narrative = '';

    // 2. Build the story components
    const components: string[] = [];

    // Consistency Section
    if (completedPlannedRatio >= 1) {
        components.push(`You've been remarkably consistent, hitting every single session you planned.`);
        tone = 'celebratory';
    } else if (completedPlannedRatio >= 0.7) {
        components.push(`You're staying steady with your training, maintaining a solid rhythm even on busy days.`);
        tone = 'analytical';
    } else {
        components.push(`It's been a challenging period for your schedule, but you're still showing up when it counts.`);
        tone = 'supportive';
    }

    // Strength/PR Section
    const recentPRs = bestLifts.filter(pr => pr.date > Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (recentPRs.length > 0) {
        components.push(`Your strength is trending upward — specifically with your ${recentPRs[0].exerciseName} which hit a new peak of ${recentPRs[0].weight}kg.`);
    }

    // volume trend
    if (history.length >= 2) {
        const last = history[history.length - 1];
        const prev = history[history.length - 2];
        const lastVolume = last.exercises.reduce((s, e) => s + e.sets.reduce((ss, set) => ss + (set.weight * set.reps), 0), 0);
        const prevVolume = prev.exercises.reduce((s, e) => s + e.sets.reduce((ss, set) => ss + (set.weight * set.reps), 0), 0);

        if (lastVolume > prevVolume) {
            components.push(`You increased your total work volume by ${Math.round((lastVolume / prevVolume - 1) * 100)}% in your most recent session.`);
        }
    }

    // Final Narrative Construction
    narrative = components.join(' ');

    return {
        title,
        narrative,
        metrics: [
            { label: 'Consistency', value: `${Math.round(completedPlannedRatio * 100)}%` },
            { label: 'Total PRs', value: bestLifts.length },
            { label: 'Active Streak', value: user.psychState.consistencyStreak }
        ],
        tone
    };
}
