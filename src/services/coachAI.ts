// Gemini AI Coach — Lightweight refinement layer
// Takes structured data and produces human-like coaching messages

import { type UserProfile, type AIMessage, type WorkoutLog, store } from './store';
import { generateCoachMessage, type CoachMessage } from './psychologyEngine';
import { getCoachIdentityInstructions } from './identityEngine';

// Gemini API integration (lightweight — refinement only)
async function callGemini(prompt: string): Promise<string | null> {
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY ||
        (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : null);

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        return null; // Fallback to rule-based
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 300,
                    topP: 0.9,
                },
            }),
        });

        if (!response.ok) return null;

        const data = await response.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch {
        return null;
    }
}

// Build prompt for Gemini refinement
function buildRefinementPrompt(
    coachMessage: CoachMessage,
    user: UserProfile,
    context: 'greeting' | 'plan_explanation' | 'progress_review' | 'adjustment'
): string {
    const identityInstructions = getCoachIdentityInstructions({
        type: user.userType || 'unknown',
        coachStyle: user.coachStyle || 'supportive',
        motivationTrigger: user.motivationTrigger || 'consistency',
        responsePreference: user.responsePreference || 'medium'
    });

    return `You are Coach Arjun, a professional and psychologically aware personal trainer. 
    
${identityInstructions}

CORE PRINCIPLES:
- Data-informed but emotionally intelligent  
- WEAVE IN personal memory references naturally (e.g., "I noticed your PR on ${user.goal.includes('strength') ? 'bench press' : 'volume'} recently")
- NEVER be generic or robotic
- Uses ${coachMessage.tone} tone

CONTEXT: ${context}
USER: ${user.name}, ${user.age}yo, ${user.fitnessLevel} level, goal: ${user.goal}
PSYCHOLOGY STATE: Motivation ${coachMessage.motivationLevel}, Streak: ${user.psychState.consistencyStreak} days

BASE MESSAGE TO REFINE:
"${coachMessage.mainMessage}"

PERSONAL MEMORIES / REFERENCES TO WEAVE IN:
${coachMessage.references.map(r => `- ${r}`).join('\n')}

SUGGESTIONS TO INCLUDE:
${coachMessage.suggestions.map(s => `- ${s}`).join('\n')}

Rewrite the base message in your specific coach identity. Keep it ultra-personal. If there are PRs or milestones in the references, make them the focal point of the encouragement. Do NOT use excessive emojis.`;
}

// Main AI coach function
export async function getCoachGreeting(user: UserProfile, history: WorkoutLog[]): Promise<{
    greeting: string;
    message: string;
    tone: CoachMessage['tone'];
    suggestions: string[];
    references: string[];
    isAIRefined: boolean;
}> {
    const coachMessage = generateCoachMessage(user, history);

    // Check cache first
    const lastMessage = store.getLastAIMessage('greeting');
    if (lastMessage && Date.now() - lastMessage.timestamp < 30 * 60 * 1000) {
        // Use cached message if less than 30 minutes old
        return {
            greeting: coachMessage.greeting,
            message: lastMessage.content,
            tone: coachMessage.tone,
            suggestions: coachMessage.suggestions,
            references: coachMessage.references,
            isAIRefined: true,
        };
    }

    // Try Gemini refinement
    const prompt = buildRefinementPrompt(coachMessage, user, 'greeting');
    const aiRefined = await callGemini(prompt);

    const finalMessage = aiRefined || coachMessage.mainMessage;

    // Cache the message
    const aiMsg: AIMessage = {
        id: 'msg_' + Date.now(),
        userId: user.id,
        timestamp: Date.now(),
        type: 'greeting',
        content: finalMessage,
        context: `tone:${coachMessage.tone},motivation:${coachMessage.motivationLevel}`,
    };
    store.saveAIMessage(aiMsg);

    return {
        greeting: coachMessage.greeting,
        message: finalMessage,
        tone: coachMessage.tone,
        suggestions: coachMessage.suggestions,
        references: coachMessage.references,
        isAIRefined: !!aiRefined,
    };
}

// Get explanation for a plan decision
export async function explainPlanDecision(
    user: UserProfile,
    decision: string,
    reasoning: string
): Promise<string> {
    const prompt = `You are Coach Arjun explaining a training decision to ${user.name}.
Decision: ${decision}
Technical reasoning: ${reasoning}
Explain WHY in 2 sentences. Be conversational, not clinical. The user should trust the reasoning.`;

    const aiExplanation = await callGemini(prompt);
    return aiExplanation || reasoning;
}

// Get motivational message for a specific context
export async function getMotivationalMessage(
    user: UserProfile,
    context: 'workout_complete' | 'streak_milestone' | 'returning_after_break' | 'new_pr'
): Promise<string> {
    const contextMessages: Record<string, string> = {
        workout_complete: `Another session in the books! Your body just got a little bit stronger, whether you felt it or not. The compound effect of showing up is your real superpower.`,
        streak_milestone: `🎯 ${user.psychState.consistencyStreak}-day streak! Most people never make it this far. You're building something permanent here — a relationship with fitness that lasts.`,
        returning_after_break: `Welcome back, ${user.name}. No judgment here — life happens. The fact that you came back says everything about your character. Let's start where you are, not where you left off.`,
        new_pr: `New personal record! 🏆 This isn't just a number — it's proof that your program is working and your effort is paying off. Document this moment.`,
    };

    const baseMessage = contextMessages[context] || 'Keep pushing forward!';

    const prompt = `You are Coach Arjun, a warm and analytical personal trainer.
Refine this ${context} message for ${user.name} (${user.fitnessLevel} level, ${user.goal} goal):
"${baseMessage}"
Keep it 2-3 sentences. Personal and genuine.`;

    const refined = await callGemini(prompt);
    return refined || baseMessage;
}
