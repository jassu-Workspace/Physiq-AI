/**
 * UI Adapter — Maps User Archetypes to Layout and Style Configurations
 * Level 4 (Contextual UI) of the Personalization Pyramid
 */

import { type UserProfile } from './store';

export interface UIConfig {
    layout: 'dense' | 'spread' | 'focus';
    prioritySection: 'workout' | 'motivation' | 'data' | 'milestones';
    theme: {
        glowColor: string;
        accentGradient: string;
    };
    hiddenFeatures: string[];
    visibleFeatures: string[];
    motivationalIntensity: 'high' | 'medium' | 'subtle';
}

/**
 * Returns UI configuration based on the user's behavioral archetype
 */
export function getUIConfig(user: UserProfile): UIConfig {
    const archetype = user.userType || 'unknown';

    const configs: Record<string, UIConfig> = {
        disciplined: {
            layout: 'dense',
            prioritySection: 'workout',
            theme: {
                glowColor: 'rgba(234, 88, 12, 0.4)', // Orange-red
                accentGradient: 'from-orange-500 to-red-600'
            },
            hiddenFeatures: ['motivational_card'],
            visibleFeatures: ['detailed_metrics', 'volume_chart'],
            motivationalIntensity: 'subtle'
        },
        struggler: {
            layout: 'focus',
            prioritySection: 'motivation',
            theme: {
                glowColor: 'rgba(56, 189, 248, 0.4)', // Blue
                accentGradient: 'from-blue-400 to-indigo-500'
            },
            hiddenFeatures: ['complex_volume_charts'],
            visibleFeatures: ['big_motivational_card', 'essential_workout_stats'],
            motivationalIntensity: 'high'
        },
        analytical: {
            layout: 'dense',
            prioritySection: 'data',
            theme: {
                glowColor: 'rgba(52, 211, 153, 0.4)', // Emerald
                accentGradient: 'from-emerald-400 to-teal-600'
            },
            hiddenFeatures: ['fluff_text'],
            visibleFeatures: ['recovery_breakdown', 'scientific_notes', 'data_viz'],
            motivationalIntensity: 'subtle'
        },
        competitive: {
            layout: 'spread',
            prioritySection: 'milestones',
            theme: {
                glowColor: 'rgba(168, 85, 247, 0.4)', // Purple
                accentGradient: 'from-purple-500 to-pink-600'
            },
            hiddenFeatures: [],
            visibleFeatures: ['pr_leaderboard', 'streak_counter', 'challenge_badges'],
            motivationalIntensity: 'medium'
        },
        unknown: {
            layout: 'spread',
            prioritySection: 'workout',
            theme: {
                glowColor: 'rgba(108, 99, 255, 0.4)', // Original Purple
                accentGradient: 'from-[#6C63FF] to-purple-600'
            },
            hiddenFeatures: [],
            visibleFeatures: ['standard_dashboard'],
            motivationalIntensity: 'medium'
        }
    };

    return configs[archetype] || configs.unknown;
}
