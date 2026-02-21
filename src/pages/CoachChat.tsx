import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { MessageCircle, Send, Sparkles, Clock, User, Bot, Loader2 } from 'lucide-react';
import { type UserProfile, type AIMessage, useWorkoutHistory, normalizeWorkoutLog, useAIMessages } from '../services/store';
import { getCoachGreeting, getMotivationalMessage, explainPlanDecision } from '../services/coachAI';
import { generateCoachMessage } from '../services/psychologyEngine';
import { detectArchetype } from '../services/identityEngine';
import { supabase } from '../services/supabase';

interface CoachChatProps {
    user: UserProfile;
}

interface ChatMessage {
    id: string;
    sender: 'coach' | 'user';
    content: string;
    timestamp: number;
    type?: 'greeting' | 'motivation' | 'explanation' | 'suggestion';
}

const quickQuestions = [
    "Why this workout split?",
    "Am I overtraining?",
    "How's my consistency?",
    "Motivate me!",
    "Explain my diet plan",
    "What should I improve?",
];

export default function CoachChat({ user }: CoachChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Supabase integrations
    const aiHistory = useAIMessages(user.id, 10);
    const historyData = useWorkoutHistory(user.id);
    const history = (historyData || []).map(normalizeWorkoutLog);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Archetype Detection Effect
    useEffect(() => {
        if (historyData && user.id) {
            const history = (historyData || []).map(normalizeWorkoutLog);
            const profile = detectArchetype(user, history.filter(w => w.date >= Date.now() - 14 * 24 * 60 * 60 * 1000), messages as any, history);
            if (profile.type !== user.userType) {
                supabase
                    .from('profiles')
                    .update({
                        user_type: profile.type,
                        coach_style: profile.coachStyle,
                        motivation_trigger: profile.motivationTrigger,
                        response_preference: profile.responsePreference
                    })
                    .eq('id', user.id)
                    .then(({ error }) => {
                        if (error) console.error('Error updating profile archetype:', error);
                    });
            }
        }
    }, [aiHistory, user, history]);

    useEffect(() => {
        const loadInitialMessages = async () => {
            try {
                const coach = await getCoachGreeting(user, history);
                const initialMessages: ChatMessage[] = [
                    {
                        id: 'init_1',
                        sender: 'coach',
                        content: coach.greeting,
                        timestamp: Date.now() - 2000,
                        type: 'greeting',
                    },
                    {
                        id: 'init_2',
                        sender: 'coach',
                        content: coach.message,
                        timestamp: Date.now() - 1000,
                        type: 'motivation',
                    },
                ];

                if (coach.references.length > 0) {
                    initialMessages.push({
                        id: 'init_3',
                        sender: 'coach',
                        content: coach.references.join('\n\n'),
                        timestamp: Date.now(),
                        type: 'explanation',
                    });
                }

                // Load past AI messages from Supabase
                const pastChatMessages: ChatMessage[] = (aiHistory || []).map(msg => ({
                    id: msg.id,
                    sender: 'coach',
                    content: msg.content,
                    timestamp: msg.timestamp,
                    type: msg.type as ChatMessage['type'],
                }));

                setMessages([...pastChatMessages.slice(0, 5), ...initialMessages]);
            } catch {
                setMessages([{
                    id: 'init_fallback',
                    sender: 'coach',
                    content: `Hey ${user.name}! I'm Coach Arjun, your personal AI trainer. Ask me anything about your training, nutrition, or progress. I'm here to help you succeed.`,
                    timestamp: Date.now(),
                    type: 'greeting',
                }]);
            } finally {
                setInitialLoading(false);
            }
        };
        loadInitialMessages();
    }, [user]);

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || loading) return;

        const userMsg: ChatMessage = {
            id: 'user_' + Date.now(),
            sender: 'user',
            content: text.trim(),
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setLoading(true);

        try {
            let response = '';
            const lowerText = text.toLowerCase();

            if (lowerText.includes('why') && (lowerText.includes('split') || lowerText.includes('workout'))) {
                response = await explainPlanDecision(
                    user,
                    `Custom ${user.daysPerWeek}-day schedule`,
                    `Based on your ${user.fitnessLevel} fitness level and ${user.goal.replace('_', ' ')} goal, your custom weekly schedule provides optimal frequency and recovery balance. Each muscle group gets trained with adequate recovery between sessions.`
                );
            } else if (lowerText.includes('overtraining') || lowerText.includes('overtrain')) {
                const coachMsg = generateCoachMessage(user, history);
                response = `Based on your recent training data:\n\n`;
                if (user.psychState.consistencyStreak > 14) {
                    response += `You've been training consistently for ${user.psychState.consistencyStreak} days. That's impressive, but watch for signs of fatigue — irritability, decreased performance, or persistent soreness.\n\n`;
                    response += `If any of those resonate, take an active recovery day. Deload weeks every 4-6 weeks are also crucial for long-term progress.`;
                } else {
                    response += `Your current training frequency looks well within recovery capacity. Keep listening to your body — if energy levels stay above 3/5, you're in a good zone.`;
                }
                const streak = user.psychState.consistencyStreak;
                response = `Here's your consistency breakdown:\n\n`;
                response += `• Current streak: ${streak} days\n`;
                response += `• Total logged workouts: ${history.length}\n`;
                response += `• Training frequency: ${user.daysPerWeek}x per week\n`;
                response += `• Motivation level: ${user.psychState.motivationLevel}\n\n`;
                if (streak >= 7) {
                    response += `You're in the top tier of consistency. Research shows it takes 66 days on average to form a habit — you're well on your way.`;
                } else {
                    response += `Every session counts. Focus on showing up, even for shorter sessions. Consistency beats intensity every time.`;
                }
            } else if (lowerText.includes('motivat') || lowerText.includes('inspire')) {
                response = await getMotivationalMessage(user,
                    user.psychState.consistencyStreak >= 7 ? 'streak_milestone' :
                        user.psychState.recentSkipCount > 3 ? 'returning_after_break' :
                            'workout_complete'
                );
            } else if (lowerText.includes('diet') || lowerText.includes('nutrition') || lowerText.includes('food')) {
                response = `Your nutrition plan is calibrated for ${user.goal.replace('_', ' ')}:\n\n`;
                response += `• Diet type: ${user.dietType.replace('_', '-')}\n`;
                response += `• City: ${user.city} (hyperlocal food suggestions)\n`;
                response += `• Strategy: Carb cycling — high carbs on training days, lower on rest days\n\n`;
                response += `The nutrition page has your full meal plan with local food options. Every food recommendation is available in ${user.city}.`;
            } else if (lowerText.includes('improve') || lowerText.includes('better') || lowerText.includes('weak')) {
                response = `Based on your profile, here are my top improvement areas:\n\n`;
                response += `1. **Consistency**: Aim for ${user.daysPerWeek} sessions/week minimum\n`;
                response += `2. **Progressive overload**: Increase weight by 2.5% every 2 weeks\n`;
                response += `3. **Sleep**: 7-9 hours is non-negotiable for recovery\n`;
                response += `4. **Protein intake**: Hit your daily target — it's the foundation\n`;
                response += `5. **Track everything**: What gets measured gets managed\n\n`;
                response += `Small improvements compound. A 1% improvement daily = 37x better in a year.`;
            } else {
                const coachMsg = generateCoachMessage(user, history);
                response = coachMsg.mainMessage + '\n\n' + coachMsg.suggestions.map(s => `• ${s}`).join('\n');
            }

            const aiMsg: ChatMessage = {
                id: 'coach_' + Date.now(),
                sender: 'coach',
                content: response,
                timestamp: Date.now(),
                type: 'explanation',
            };
            setMessages(prev => [...prev, aiMsg]);

            // Save to Supabase
            await supabase
                .from('ai_messages')
                .insert([{
                    user_id: user.id!,
                    timestamp: Date.now(),
                    type: 'plan_explanation',
                    content: response,
                    context: text,
                }]);
        } catch {
            setMessages(prev => [...prev, {
                id: 'error_' + Date.now(),
                sender: 'coach',
                content: "I'm having a moment — let me try again. In the meantime, trust the process and keep showing up!",
                timestamp: Date.now(),
            }]);
        } finally {
            setLoading(false);
        }
    };

    // Persona Mapping
    const personaMap: Record<string, { label: string; subLabel: string; color: string }> = {
        disciplined: { label: 'Elite Coach', subLabel: 'Performance Optimized', color: 'from-orange-500 to-red-600' },
        struggler: { label: 'Supportive Mentor', subLabel: 'Empathy Mode Active', color: 'from-blue-400 to-indigo-500' },
        analytical: { label: 'Data Scientist', subLabel: 'Scientific Precision', color: 'from-emerald-400 to-teal-600' },
        competitive: { label: 'Challenge Coach', subLabel: 'High Intensity Mode', color: 'from-purple-500 to-pink-600' },
        unknown: { label: 'Coach Arjun', subLabel: 'General AI Trainer', color: 'from-[#6C63FF] to-purple-600' }
    };

    const persona = personaMap[user.userType || 'unknown'] || personaMap.unknown;

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-[#6C63FF] animate-spin" />
                    <p className="text-sm text-slate-400">Coach Arjun is joining...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full max-w-3xl mx-auto">
            {/* Header */}
            <div className="p-4 lg:p-6 pb-3 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${persona.color} flex items-center justify-center text-white text-lg font-bold shadow-lg`}>
                        {persona.label[0]}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            {persona.label}
                            <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
                        </h2>
                        <p className="text-xs text-slate-400">{persona.subLabel}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-[10px] bg-[#6C63FF]/10 text-[#6C63FF] px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                            <Sparkles size={10} />
                            Identity Aware
                        </span>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${msg.sender === 'coach'
                            ? 'bg-[#6C63FF]/20 text-[#6C63FF]'
                            : 'bg-white/10 text-white'
                            }`}>
                            {msg.sender === 'coach' ? <Bot size={14} /> : <User size={14} />}
                        </div>
                        <div className={`max-w-[80%] ${msg.sender === 'user' ? 'text-right' : ''}`}>
                            <div className={`inline-block p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.sender === 'coach'
                                ? 'bg-white/[0.04] border border-white/[0.06] text-slate-200'
                                : 'bg-[#6C63FF] text-white'
                                }`}>
                                {msg.content}
                            </div>
                            <p className="text-[10px] text-slate-600 mt-1 px-1">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </motion.div>
                ))}

                {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#6C63FF]/20 flex items-center justify-center">
                            <Bot size={14} className="text-[#6C63FF]" />
                        </div>
                        <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 lg:px-6 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
                {quickQuestions.map((q, i) => (
                    <button
                        key={i}
                        onClick={() => handleSendMessage(q)}
                        className="shrink-0 text-xs bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-xl hover:bg-[#6C63FF]/10 hover:border-[#6C63FF]/30 hover:text-white transition-all"
                    >
                        {q}
                    </button>
                ))}
            </div>

            {/* Input */}
            <div className="p-4 lg:p-6 pt-3 border-t border-white/5">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage(inputValue)}
                        placeholder="Ask Coach Arjun anything..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#6C63FF]/50 transition-all"
                    />
                    <button
                        onClick={() => handleSendMessage(inputValue)}
                        disabled={!inputValue.trim() || loading}
                        className="w-12 h-12 rounded-2xl bg-[#6C63FF] text-white flex items-center justify-center shadow-[0_0_20px_rgba(108,99,255,0.4)] hover:shadow-[0_0_30px_rgba(108,99,255,0.6)] transition-all disabled:opacity-30 disabled:shadow-none"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
