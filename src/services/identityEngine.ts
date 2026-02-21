/**
 * Identity Engine — Behavioral Classification & Personalized Coaching Style
 * Level 5 of the Personalization Pyramid
 */

import { type UserProfile, type WorkoutLog, type AIMessage } from './store';
import { getConsistencyScore } from './psychologyEngine';

export type UserArchetype = 'disciplined' | 'struggler' | 'analytical' | 'competitive' | 'unknown';

export interface IdentityProfile {
    type: UserArchetype;
    coachStyle: 'performance' | 'supportive' | 'detailed' | 'challenge';
    motivationTrigger: 'achievement' | 'consistency' | 'data' | 'competition';
    responsePreference: 'short' | 'medium' | 'detailed';
}

/**
 * Detects the user's personality archetype based on behavioral data
 */
export function detectArchetype(
    user: UserProfile,
    recentWorkouts: WorkoutLog[],
    aiMessages: AIMessage[],
    history: WorkoutLog[]
): IdentityProfile {
    const consistencyScore = getConsistencyScore(user, history);
    const streak = user.psychState.consistencyStreak;
    const recentSkips = user.psychState.recentSkipCount;

    // 1. Analytical Detection (High frequency of "why" explanations)
    const explanationMessages = aiMessages.filter(m => m.type === 'plan_explanation');
    if (explanationMessages.length >= 3) {
        return {
            type: 'analytical',
            coachStyle: 'detailed',
            motivationTrigger: 'data',
            responsePreference: 'detailed'
        };
    }

    // 2. Disciplined Performer Detection (High consistency + long streak)
    if (consistencyScore > 85 && streak >= 14) {
        return {
            type: 'disciplined',
            coachStyle: 'performance',
            motivationTrigger: 'achievement',
            responsePreference: 'short'
        };
    }

    // 3. Competitive Detection (Strong streak focus)
    if (streak >= 7 && consistencyScore > 70) {
        return {
            type: 'competitive',
            coachStyle: 'challenge',
            motivationTrigger: 'competition',
            responsePreference: 'medium'
        };
    }

    // 4. Struggler Detection (Low adherence + many skips)
    if (consistencyScore < 40 || recentSkips > 3) {
        return {
            type: 'struggler',
            coachStyle: 'supportive',
            motivationTrigger: 'consistency',
            responsePreference: 'medium'
        };
    }

    // Default: Return currently set or unknown
    return {
        type: user.userType || 'unknown',
        coachStyle: user.coachStyle || 'supportive',
        motivationTrigger: user.motivationTrigger || 'consistency',
        responsePreference: user.responsePreference || 'medium'
    };
}

/**
 * Returns a personalized system prompt snippet for Gemini based on user identity
 */
export function getCoachIdentityInstructions(profile: IdentityProfile): string {
    const styles: Record<string, string> = {
        performance: "Focus on results and performance metrics. Be a high-performance coach. Acknowledge hard work but don't over-praise. Keep it punchy and direct.",
        supportive: "Be exceptionally warm and empathetic. Your goal is to keep them coming back. Praise effort over results. Use gentle nudges and show total understanding of life's hurdles.",
        detailed: "Provide scientific and technical context for your recommendations. Reference biological mechanisms, biomechanics, or recovery rates. Be precise and thorough.",
        challenge: "Use competitive language. Challenge them to beat their streak or their past lift. Be high-energy and exciting. Frame the workout as a battle to be won."
    };

    const preferences: Record<string, string> = {
        short: "Keep your response very brief — maximum 2 sentences.",
        medium: "Keep your response concise — 3 to 4 sentences.",
        detailed: "Feel free to be thorough and provide detailed explanations."
    };

    return `COACH STYLE: ${styles[profile.coachStyle] || styles.supportive}\nRESPONSE PREFERENCE: ${preferences[profile.responsePreference] || preferences.medium}`;
}
