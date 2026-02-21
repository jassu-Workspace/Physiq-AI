import React, { useState } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../services/supabase';
import { Loader2, Sparkles, Mail, Lock, User, Dumbbell } from 'lucide-react';

type AuthView = 'login' | 'signup';

function GoogleLogo() {
    return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.2-1.9 2.9l3 2.3c1.8-1.7 2.9-4.2 2.9-7.1 0-.7-.1-1.4-.2-2H12z" />
            <path fill="#34A853" d="M12 22c2.6 0 4.8-.9 6.4-2.4l-3-2.3c-.8.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.2l-3.1 2.4C4.8 19.8 8.1 22 12 22z" />
            <path fill="#4A90E2" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2L3.3 7.6C2.5 9.1 2 10.5 2 12s.5 2.9 1.3 4.4L6.4 14z" />
            <path fill="#FBBC05" d="M12 5.8c1.4 0 2.7.5 3.7 1.5l2.7-2.7C16.8 3 14.6 2 12 2 8.1 2 4.8 4.2 3.3 7.6L6.4 10c.8-2.4 3-4.2 5.6-4.2z" />
        </svg>
    );
}

export default function Auth() {
    const [authView, setAuthView] = useState<AuthView>('login');
    const isLogin = authView === 'login';
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || "Unable to sign in right now.");
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: fullName.trim() || undefined,
                    },
                },
            });
            if (error) throw error;
            setError("Confirmation email sent! Please check your inbox.");
        } catch (err: any) {
            setError(err.message || "An error occurred during authentication.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || "Failed to sign in with Google.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0B0C15] relative overflow-hidden">
            {/* Ambient Background Mesh */}
            <div className="fixed inset-0 z-0 bg-[radial-gradient(at_0%_0%,hsla(253,16%,7%,1)_0,transparent_50%),radial-gradient(at_50%_0%,hsla(225,39%,30%,1)_0,transparent_50%),radial-gradient(at_100%_0%,hsla(339,49%,30%,1)_0,transparent_50%)] pointer-events-none opacity-60"></div>

            <div className="relative z-10 w-full max-w-md p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] rounded-[2.5rem] p-8 lg:p-10 shadow-2xl shadow-[#000000]/40"
                >
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6C63FF] to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-[#6C63FF]/30">
                            <Dumbbell className="text-white" size={32} />
                        </div>
                        <h1 className="text-2xl font-black text-white text-center">
                            Coach Arjun <span className="text-[#6C63FF]">AI</span>
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">Your journey starts here.</p>
                    </div>

                    <div className="mb-6 grid grid-cols-2 bg-white/5 border border-white/10 rounded-2xl p-1">
                        <button
                            onClick={() => {
                                setAuthView('login');
                                setError(null);
                            }}
                            className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${isLogin ? 'bg-[#6C63FF] text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            Login Page
                        </button>
                        <button
                            onClick={() => {
                                setAuthView('signup');
                                setError(null);
                            }}
                            className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${!isLogin ? 'bg-[#6C63FF] text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            Sign Up Page
                        </button>
                    </div>

                    {/* Google Button - Glass + Clay Style */}
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full mb-6 py-3.5 bg-white/8 border border-white/15 rounded-xl flex items-center justify-center gap-3 text-white text-sm font-bold shadow-[8px_8px_18px_rgba(0,0,0,0.35),-6px_-6px_14px_rgba(255,255,255,0.05)] hover:bg-white/12 hover:shadow-[10px_10px_22px_rgba(0,0,0,0.38),-8px_-8px_18px_rgba(108,99,255,0.15)] transition-all group relative overflow-hidden active:scale-[0.98]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#6C63FF]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        <GoogleLogo />
                        Sign in with Google
                    </button>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/5"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                            <span className="bg-[#0B0C15] px-4 text-slate-500">Or continue with email</span>
                        </div>
                    </div>

                    <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
                        {!isLogin && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[#6C63FF] uppercase tracking-widest px-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Your full name"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-3.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-[#6C63FF]/50 transition-all"
                                    />
                                </div>
                            </div>
                        )}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[#6C63FF] uppercase tracking-widest px-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-3.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-[#6C63FF]/50 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[#6C63FF] uppercase tracking-widest px-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-3.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-[#6C63FF]/50 transition-all"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className={`p-4 rounded-2xl text-xs font-medium ${error.includes('sent') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-[#6C63FF] to-purple-600 text-white rounded-2xl font-bold text-sm shadow-[0_0_20px_rgba(108,99,255,0.4)] hover:shadow-[0_0_30px_rgba(108,99,255,0.6)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? "Sign In" : "Create Account")}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-slate-400 text-[13px]">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                            <button
                                onClick={() => {
                                    setAuthView(isLogin ? 'signup' : 'login');
                                    setError(null);
                                }}
                                className="ml-2 text-[#6C63FF] font-bold hover:underline"
                            >
                                {isLogin ? "Sign Up" : "Sign In"}
                            </button>
                        </p>
                    </div>

                    <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-center gap-2">
                        <Sparkles size={14} className="text-[#6C63FF]" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Powered by Supabase & Gemini</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
