import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { MessageCircle, Send, Sparkles, Clock, User, Bot, Loader2, ChevronRight } from 'lucide-react';
import { type UserProfile, type AIMessage, useWorkoutHistory, normalizeWorkoutLog, useAIMessages } from '../services/store';
import { getCoachGreeting, getMotivationalMessage, explainPlanDecision } from '../services/coachAI';
import { generateCoachMessage } from '../services/psychologyEngine';
import { detectArchetype } from '../services/identityEngine';
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

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
                setDoc(doc(db, 'profiles', user.id), {
                        user_type: profile.type,
                        coach_style: profile.coachStyle,
                        motivation_trigger: profile.motivationTrigger,
                        response_preference: profile.responsePreference
                    }, { merge: true })
                    .catch((error) => {
                        console.error('Error updating profile archetype:', error);
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

    useEffect(() => {
        const applySearch = (queryText: string) => {
            const value = queryText.trim();
            if (!value) return;
            setInputValue(value);
        };

        const onGlobalSearch = (event: Event) => {
            const custom = event as CustomEvent<{ query?: string; targetTab?: string }>;
            const targetTab = custom.detail?.targetTab;
            const queryText = custom.detail?.query;
            if (!queryText) return;
            if (targetTab && targetTab !== 'coach') return;
            applySearch(queryText);
        };

        window.addEventListener('app:global-search', onGlobalSearch as EventListener);

        try {
            const stored = window.localStorage.getItem('app:global-search:last');
            if (stored) {
                const parsed = JSON.parse(stored) as { query?: string; targetTab?: string; timestamp?: number };
                const isFresh = typeof parsed.timestamp === 'number' && Date.now() - parsed.timestamp < 15000;
                if (isFresh && parsed.query && parsed.targetTab === 'coach') {
                    applySearch(parsed.query);
                }
            }
        } catch {
            // Ignore malformed or unavailable storage.
        }

        return () => {
            window.removeEventListener('app:global-search', onGlobalSearch as EventListener);
        };
    }, []);

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

            await addDoc(collection(db, 'ai_messages'), {
                    user_id: user.id!,
                    timestamp: Date.now(),
                    type: 'plan_explanation',
                    content: response,
                    context: text,
                });
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
            <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                    <p className="text-sm text-slate-500">Coach Arjun is joining...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60">
            <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 shadow-sm">
                <h1 className="text-xl font-bold text-slate-900">Coach Chat</h1>
                <div className="hidden items-center gap-3 md:flex">
                    <div className="flex items-center rounded-lg bg-slate-100 px-3 py-2">
                        <MessageCircle size={15} className="text-slate-400" />
                        <input readOnly value="Search conversation..." className="w-52 border-0 bg-transparent px-2 text-sm text-slate-500 outline-none" />
                    </div>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr ${persona.color} text-sm font-semibold text-white`}>{user.name?.[0] || 'U'}</div>
                </div>
            </header>

            <main className="relative flex flex-1 overflow-hidden">
                <aside className="hidden w-80 flex-col border-r border-slate-200 bg-white lg:flex">
                    <div className="border-b border-slate-100 p-5">
                        <div className="mb-3 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900">Coach Arjun AI</h2>
                                <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                                    <span className="h-2 w-2 rounded-full bg-green-500" /> Online & Ready
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-slate-500">Your personal AI fitness strategist. Ask about routine, diet, and recovery.</p>
                    </div>

                    <div className="flex-1 space-y-2 overflow-y-auto p-4">
                        <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Quick Actions</h3>
                        {quickQuestions.map((q) => (
                            <button
                                key={q}
                                onClick={() => handleSendMessage(q)}
                                className="flex w-full items-center justify-between rounded-xl border border-transparent p-3 text-left transition hover:border-slate-200 hover:bg-slate-50"
                            >
                                <span className="text-sm font-medium text-slate-700">{q}</span>
                                <ChevronRight size={14} className="text-slate-400" />
                            </button>
                        ))}

                        <div className="mt-5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white shadow-lg shadow-blue-500/20">
                            <div className="mb-2 flex items-center justify-between">
                                <TrendingUpMini />
                                <span className="rounded bg-white/20 px-2 py-1 text-xs font-medium">Goal</span>
                            </div>
                            <h4 className="text-lg font-bold">Weekly Target</h4>
                            <p className="mb-3 text-sm text-blue-100">Stay consistent this week and keep momentum high.</p>
                            <div className="h-1.5 w-full rounded-full bg-black/20">
                                <div className="h-1.5 w-[85%] rounded-full bg-white" />
                            </div>
                        </div>
                    </div>
                </aside>

                <section className="relative flex min-w-0 flex-1 flex-col">
                    <div className="chat-scroll flex-1 space-y-5 overflow-y-auto p-4 md:p-6 pb-36">
                        <div className="flex justify-center">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-400">Today</span>
                        </div>

                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${msg.sender === 'coach' ? 'bg-white border border-slate-200 text-blue-600' : `bg-gradient-to-tr ${persona.color} text-white`}`}>
                                    {msg.sender === 'coach' ? <Bot size={16} /> : <User size={15} />}
                                </div>

                                <div className={`max-w-[80%] ${msg.sender === 'user' ? 'text-right' : ''}`}>
                                    <div className={`inline-block rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap ${msg.sender === 'coach' ? 'rounded-tl-none border border-slate-200 bg-white text-slate-700 shadow-sm' : 'rounded-tr-none bg-blue-600 text-white shadow-md shadow-blue-500/20'}`}>
                                        {msg.content}
                                    </div>
                                    <p className="mt-1 px-1 text-[10px] text-slate-400">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </motion.div>
                        ))}

                        {loading && (
                            <div className="flex gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-blue-600">
                                    <Bot size={16} />
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="flex gap-1">
                                        <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                                        <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
                                        <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent px-4 pb-4 pt-8 md:px-6 md:pb-6">
                        <div className="mx-auto w-full max-w-4xl">
                            <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
                                {quickQuestions.slice(0, 3).map((q) => (
                                    <button key={q} onClick={() => handleSendMessage(q)} className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:border-blue-300 hover:text-blue-600">
                                        {q}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                                <button className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-blue-600">
                                    <Sparkles size={18} />
                                </button>
                                <textarea
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            void handleSendMessage(inputValue);
                                        }
                                    }}
                                    placeholder="Ask Coach Arjun anything..."
                                    rows={1}
                                    className="max-h-32 min-h-[44px] flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-slate-700 outline-none"
                                />
                                <button
                                    onClick={() => handleSendMessage(inputValue)}
                                    disabled={!inputValue.trim() || loading}
                                    className="rounded-xl bg-blue-600 p-2 text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-40"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                            <p className="mt-2 text-center text-[10px] text-slate-400">Coach Arjun AI can make mistakes. Consider checking important health info.</p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

function TrendingUpMini() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/80">
            <path d="M4 16L10 10L14 14L20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 8H20V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
