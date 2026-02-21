import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    User, ChevronRight, ChevronLeft, Dumbbell, Target, Calendar,
    Utensils, Pill, Check, Zap, Moon, Sun, Coffee, Droplets, Scale,
    Ruler, Activity, Heart, Clock, Sparkles, MapPin
} from 'lucide-react';
import {
    type UserProfile, type WeeklySchedule, type DaySchedule, type WorkoutSession,
    type SupplementProfile, type DayName,
    createEmptySchedule, createDefaultSupplements, generateSessionLabel, countTrainingDays
} from '../services/store';
import { supabase } from '../services/supabase';
import { type MuscleGroup } from '../data/exercises';

interface OnboardingProps {
    onComplete: (user: UserProfile) => void;
    initialUser?: UserProfile;
    mode?: 'create' | 'edit';
    onCancel?: () => void;
}

const TOTAL_STEPS = 8;

const GYM_EXPERIENCE_OPTIONS = [
    { val: 'newbie' as const, label: '🌱 Newbie', desc: 'Less than 3 months', tips: 'Focus on form and consistency' },
    { val: 'casual' as const, label: '🏃 Casual', desc: '3-12 months', tips: 'Building a routine now' },
    { val: 'consistent' as const, label: '💪 Consistent', desc: '1-3 years', tips: 'Serious about gains' },
    { val: 'veteran' as const, label: '🏆 Veteran', desc: '3+ years', tips: 'Advanced training methods' },
];

const ALL_MUSCLES: { id: MuscleGroup; label: string; emoji: string }[] = [
    { id: 'back', label: 'Back', emoji: '🔙' },
    { id: 'biceps', label: 'Biceps', emoji: '💪' },
    { id: 'chest', label: 'Chest', emoji: '🫁' },
    { id: 'triceps', label: 'Triceps', emoji: '🦾' },
    { id: 'shoulders', label: 'Shoulders', emoji: '💪' },
    { id: 'quadriceps', label: 'Legs', emoji: '🦵' },
    { id: 'core', label: 'Abs', emoji: '🎯' },
    { id: 'forearms', label: 'Forearms', emoji: '✊' },
];

const DAY_NAMES: { key: DayName; label: string; short: string }[] = [
    { key: 'monday', label: 'Monday', short: 'Mon' },
    { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
    { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
    { key: 'thursday', label: 'Thursday', short: 'Thu' },
    { key: 'friday', label: 'Friday', short: 'Fri' },
    { key: 'saturday', label: 'Saturday', short: 'Sat' },
    { key: 'sunday', label: 'Sunday', short: 'Sun' },
];

const QUICK_TEMPLATES = [
    {
        name: 'Push/Pull/Legs (6 day)',
        schedule: {
            monday: { sessions: [{ timeSlot: 'morning' as const, muscleGroups: ['chest', 'shoulders', 'triceps'] as MuscleGroup[], label: 'Push' }], isRestDay: false },
            tuesday: { sessions: [{ timeSlot: 'morning' as const, muscleGroups: ['back', 'biceps', 'forearms'] as MuscleGroup[], label: 'Pull' }], isRestDay: false },
            wednesday: { sessions: [{ timeSlot: 'morning' as const, muscleGroups: ['quadriceps', 'core'] as MuscleGroup[], label: 'Legs' }], isRestDay: false },
            thursday: { sessions: [{ timeSlot: 'morning' as const, muscleGroups: ['chest', 'shoulders', 'triceps'] as MuscleGroup[], label: 'Push' }], isRestDay: false },
            friday: { sessions: [{ timeSlot: 'morning' as const, muscleGroups: ['back', 'biceps', 'forearms'] as MuscleGroup[], label: 'Pull' }], isRestDay: false },
            saturday: { sessions: [{ timeSlot: 'morning' as const, muscleGroups: ['quadriceps', 'core'] as MuscleGroup[], label: 'Legs' }], isRestDay: false },
            sunday: { sessions: [], isRestDay: true },
        }
    },
    {
        name: 'Upper/Lower (4 day)',
        schedule: {
            monday: { sessions: [{ timeSlot: 'morning' as const, muscleGroups: ['chest', 'back', 'shoulders', 'biceps', 'triceps'] as MuscleGroup[], label: 'Upper Body' }], isRestDay: false },
            tuesday: { sessions: [{ timeSlot: 'morning' as const, muscleGroups: ['quadriceps', 'core'] as MuscleGroup[], label: 'Lower Body' }], isRestDay: false },
            wednesday: { sessions: [], isRestDay: true },
            thursday: { sessions: [{ timeSlot: 'morning' as const, muscleGroups: ['chest', 'back', 'shoulders', 'biceps', 'triceps'] as MuscleGroup[], label: 'Upper Body' }], isRestDay: false },
            friday: { sessions: [{ timeSlot: 'morning' as const, muscleGroups: ['quadriceps', 'core'] as MuscleGroup[], label: 'Lower Body' }], isRestDay: false },
            saturday: { sessions: [], isRestDay: true },
            sunday: { sessions: [], isRestDay: true },
        }
    },
    {
        name: 'Bro Split (5 day)',
        schedule: {
            monday: { sessions: [{ timeSlot: 'morning' as const, muscleGroups: ['chest'] as MuscleGroup[], label: 'Chest' }], isRestDay: false },
            tuesday: { sessions: [{ timeSlot: 'morning' as const, muscleGroups: ['back'] as MuscleGroup[], label: 'Back' }], isRestDay: false },
            wednesday: { sessions: [{ timeSlot: 'morning' as const, muscleGroups: ['shoulders'] as MuscleGroup[], label: 'Shoulders' }], isRestDay: false },
            thursday: { sessions: [{ timeSlot: 'morning' as const, muscleGroups: ['biceps', 'triceps'] as MuscleGroup[], label: 'Arms' }], isRestDay: false },
            friday: { sessions: [{ timeSlot: 'morning' as const, muscleGroups: ['quadriceps', 'core'] as MuscleGroup[], label: 'Legs' }], isRestDay: false },
            saturday: { sessions: [], isRestDay: true },
            sunday: { sessions: [], isRestDay: true },
        }
    },
    {
        name: 'Custom (build your own)',
        schedule: null,
    }
];

export default function Onboarding({ onComplete, initialUser, mode = 'create', onCancel }: OnboardingProps) {
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Step 1: Basic info
    const [name, setName] = useState(initialUser?.name ?? '');
    const [age, setAge] = useState(initialUser?.age ?? 22);
    const [gender, setGender] = useState<'male' | 'female' | 'other'>(initialUser?.gender ?? 'male');

    // Step 2: Gym Experience
    const [gymExperience, setGymExperience] = useState<UserProfile['gymExperience']>(initialUser?.gymExperience ?? 'casual');

    // Step 3: Body & Goal
    const [weight, setWeight] = useState(initialUser?.weight ?? 70);
    const [height, setHeight] = useState(initialUser?.height ?? 170);
    const [fitnessLevel, setFitnessLevel] = useState<UserProfile['fitnessLevel']>(initialUser?.fitnessLevel ?? 'intermediate');
    const [goal, setGoal] = useState<UserProfile['goal']>(initialUser?.goal ?? 'muscle_gain');
    const [trainingStyle, setTrainingStyle] = useState<UserProfile['trainingStyle']>(initialUser?.trainingStyle ?? 'bodybuilding');
    const [bodyFat, setBodyFat] = useState(initialUser?.bodyFat ?? 15);
    const [daysPerWeek, setDaysPerWeek] = useState(initialUser?.daysPerWeek ?? 3);
    const [schedule, setSchedule] = useState<WeeklySchedule>(initialUser?.customSchedule ?? createEmptySchedule());
    const [selectedDay, setSelectedDay] = useState<DayName>('monday');
    const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

    // Step 4: Sessions per day
    // (integrated into step 3 — add sessions directly)

    // Step 5: Diet
    const [dietType, setDietType] = useState<UserProfile['dietType']>(initialUser?.dietType ?? 'non_vegetarian');
    const [mealsPerDay, setMealsPerDay] = useState(initialUser?.mealsPerDay ?? 4);
    const [city, setCity] = useState(initialUser?.city ?? 'Visakhapatnam');

    // Step 6: Supplements
    const [supplements, setSupplements] = useState<SupplementProfile>(initialUser?.supplements ?? createDefaultSupplements());

    // Step 7: Lifestyle
    const [wakeUpTime, setWakeUpTime] = useState(initialUser?.wakeUpTime ?? '06:00');
    const [sleepTime, setSleepTime] = useState(initialUser?.sleepTime ?? '22:00');
    const [waterGoal, setWaterGoal] = useState(initialUser?.waterIntakeGoal ?? 3);

    useEffect(() => {
        if (!initialUser) return;
        setName(initialUser.name ?? '');
        setAge(initialUser.age ?? 22);
        setGender(initialUser.gender ?? 'male');
        setGymExperience(initialUser.gymExperience ?? 'casual');
        setWeight(initialUser.weight ?? 70);
        setHeight(initialUser.height ?? 170);
        setFitnessLevel(initialUser.fitnessLevel ?? 'intermediate');
        setGoal(initialUser.goal ?? 'muscle_gain');
        setTrainingStyle(initialUser.trainingStyle ?? 'bodybuilding');
        setBodyFat(initialUser.bodyFat ?? 15);
        setDaysPerWeek(initialUser.daysPerWeek ?? 3);
        setSchedule(initialUser.customSchedule ?? createEmptySchedule());
        setDietType(initialUser.dietType ?? 'non_vegetarian');
        setMealsPerDay(initialUser.mealsPerDay ?? 4);
        setCity(initialUser.city ?? 'Visakhapatnam');
        setSupplements(initialUser.supplements ?? createDefaultSupplements());
        setWakeUpTime(initialUser.wakeUpTime ?? '06:00');
        setSleepTime(initialUser.sleepTime ?? '22:00');
        setWaterGoal(initialUser.waterIntakeGoal ?? 3);
    }, [initialUser?.id]);

    const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
    const prev = () => setStep(s => Math.max(s - 1, 0));

    const handleComplete = async () => {
        if (isSubmitting) return;

        setSubmitError(null);
        setIsSubmitting(true);

        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) {
                setSubmitError('Your session expired. Please sign in again.');
                return;
            }

            // Generate Magic Defaults
            const defaultSchedule = createEmptySchedule();
            // Basic PPL default based on training style
            if (trainingStyle === 'bodybuilding') {
                defaultSchedule.monday = { sessions: [{ timeSlot: 'morning', muscleGroups: ['chest', 'triceps'], label: 'Push' }], isRestDay: false };
                defaultSchedule.tuesday = { sessions: [{ timeSlot: 'morning', muscleGroups: ['back', 'biceps'], label: 'Pull' }], isRestDay: false };
                defaultSchedule.wednesday = { sessions: [{ timeSlot: 'morning', muscleGroups: ['quadriceps', 'core'], label: 'Legs' }], isRestDay: false };
            }

            const finalSchedule = countTrainingDays(schedule) > 0 ? schedule : defaultSchedule;

            const profileData = {
                id: authUser.id,
                name: name || 'Athlete',
                age,
                gender,
                gym_experience: gymExperience,
                weight,
                height,
                body_fat: bodyFat,
                fitness_level: fitnessLevel,
                goal,
                training_style: trainingStyle,
                custom_schedule: finalSchedule,
                days_per_week: Math.max(daysPerWeek, countTrainingDays(finalSchedule)),
                diet_type: dietType,
                meals_per_day: mealsPerDay,
                city,
                supplements: supplements,
                wake_up_time: wakeUpTime,
                sleep_time: sleepTime,
                water_intake_goal: waterGoal,
                user_type: 'unknown',
                coach_style: 'supportive',
                motivation_trigger: 'consistency',
                response_preference: 'medium',
                psych_state: {
                    motivationLevel: 'high',
                    consistencyStreak: 0,
                    totalSkippedWorkouts: 0,
                    recentSkipCount: 0,
                    lastMoodRating: 4,
                    emotionalMemory: [],
                    preferredTone: 'supportive',
                },
                updated_at: new Date().toISOString(),
                created_at: initialUser?.createdAt ? new Date(initialUser.createdAt).toISOString() : new Date().toISOString(),
            };

            console.log('Upserting profile:', JSON.stringify(profileData, null, 2));

            const { data, error } = await supabase
                .from('profiles')
                .upsert(profileData, { onConflict: 'id' })
                .select();

            if (error) {
                console.error('Supabase error details:', error);
                throw new Error(`Supabase error: ${error.message}`);
            }

            console.log('Profile saved successfully:', data);
            onComplete(profileData as any as UserProfile);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error("Failed to complete onboarding:", errorMsg);
            setSubmitError(`Could not save your profile: ${errorMsg}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleMuscleForDay = (dayKey: DayName, muscle: MuscleGroup) => {
        setSchedule(prev => {
            const day = { ...prev[dayKey] };
            if (day.sessions.length === 0) {
                day.sessions = [{ timeSlot: 'morning', muscleGroups: [], label: '' }];
                day.isRestDay = false;
            }
            const session = { ...day.sessions[0] };
            const idx = session.muscleGroups.indexOf(muscle);
            if (idx >= 0) {
                session.muscleGroups = session.muscleGroups.filter(m => m !== muscle);
            } else {
                session.muscleGroups = [...session.muscleGroups, muscle];
            }
            session.label = generateSessionLabel(session.muscleGroups);
            if (session.muscleGroups.length === 0) {
                day.sessions = [];
                day.isRestDay = true;
            } else {
                day.sessions = [session];
            }
            return { ...prev, [dayKey]: day };
        });
    };

    const addSessionToDay = (dayKey: DayName) => {
        setSchedule(prev => {
            const day = { ...prev[dayKey] };
            if (day.sessions.length < 3) {
                day.sessions = [...day.sessions, { timeSlot: day.sessions.length === 1 ? 'afternoon' : 'evening', muscleGroups: [], label: '' }];
                day.isRestDay = false;
            }
            return { ...prev, [dayKey]: day };
        });
    };

    const removeSession = (dayKey: DayName, sessionIdx: number) => {
        setSchedule(prev => {
            const day = { ...prev[dayKey] };
            day.sessions = day.sessions.filter((_, i) => i !== sessionIdx);
            if (day.sessions.length === 0) day.isRestDay = true;
            return { ...prev, [dayKey]: day };
        });
    };

    const toggleMuscleForSession = (dayKey: DayName, sessionIdx: number, muscle: MuscleGroup) => {
        setSchedule(prev => {
            const day = { ...prev[dayKey] };
            const sessions = [...day.sessions];
            const session = { ...sessions[sessionIdx] };
            const idx = session.muscleGroups.indexOf(muscle);
            if (idx >= 0) {
                session.muscleGroups = session.muscleGroups.filter(m => m !== muscle);
            } else {
                session.muscleGroups = [...session.muscleGroups, muscle];
            }
            session.label = generateSessionLabel(session.muscleGroups);
            sessions[sessionIdx] = session;
            day.sessions = sessions;
            return { ...prev, [dayKey]: day };
        });
    };

    const setTimeSlotForSession = (dayKey: DayName, sessionIdx: number, slot: WorkoutSession['timeSlot']) => {
        setSchedule(prev => {
            const day = { ...prev[dayKey] };
            const sessions = [...day.sessions];
            sessions[sessionIdx] = { ...sessions[sessionIdx], timeSlot: slot };
            day.sessions = sessions;
            return { ...prev, [dayKey]: day };
        });
    };

    const toggleRestDay = (dayKey: DayName) => {
        setSchedule(prev => {
            const day = { ...prev[dayKey] };
            day.isRestDay = !day.isRestDay;
            if (day.isRestDay) day.sessions = [];
            else if (day.sessions.length === 0) {
                day.sessions = [{ timeSlot: 'morning', muscleGroups: [], label: '' }];
            }
            return { ...prev, [dayKey]: day };
        });
    };

    const applyTemplate = (templateIdx: number) => {
        const tmpl = QUICK_TEMPLATES[templateIdx];
        setSelectedTemplate(templateIdx);
        if (tmpl.schedule) {
            setSchedule(tmpl.schedule as WeeklySchedule);
        } else {
            setSchedule(createEmptySchedule());
        }
    };

    const updateSupplement = (key: keyof SupplementProfile, field: string, value: unknown) => {
        setSupplements(prev => ({
            ...prev,
            [key]: { ...(prev[key] as Record<string, unknown>), [field]: value },
        }));
    };

    const canAdvance = () => {
        switch (step) {
            case 0: return name.trim().length > 0;
            case 1: return true; // gym experience always selected
            case 2: return weight > 0 && height > 0;
            case 3: return countTrainingDays(schedule) > 0;
            case 4: return true;
            case 5: return true;
            case 6: return true;
            case 7: return true;
            default: return true;
        }
    };

    const stepInfo = [
        { title: 'About You', subtitle: "Let's get to know you", icon: User },
        { title: 'Gym Experience', subtitle: 'How long have you been training?', icon: Dumbbell },
        { title: 'Body & Goals', subtitle: 'Your physique and objectives', icon: Target },
        { title: 'Weekly Schedule', subtitle: 'What do you train each day?', icon: Calendar },
        { title: 'Session Timing', subtitle: 'When do you hit the gym?', icon: Clock },
        { title: 'Diet & Food', subtitle: 'Your eating habits', icon: Utensils },
        { title: 'Supplements', subtitle: 'What supplements do you take?', icon: Pill },
        { title: 'Review & Start', subtitle: 'Everything looks good?', icon: Sparkles },
    ];

    const currentStep = stepInfo[step];

    return (
        <div className="onboarding-light min-h-screen bg-slate-50 text-slate-900 flex flex-col">
            {/* Ambient */}
            <div className="fixed inset-0 z-0 bg-[radial-gradient(at_0%_0%,#ffffff_0,transparent_45%),radial-gradient(at_50%_0%,#dbeafe_0,transparent_50%),radial-gradient(at_100%_0%,#ede9fe_0,transparent_55%)] pointer-events-none opacity-90" />

            <div className="relative z-10 flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-8">
                {/* Progress */}
                <div className="flex items-center gap-2 mb-8">
                    {stepInfo.map((_, i) => (
                        <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/5">
                            <motion.div
                                className={`h-full rounded-full ${i <= step ? 'bg-gradient-to-r from-[#6C63FF] to-purple-500' : ''}`}
                                initial={{ width: 0 }}
                                animate={{ width: i <= step ? '100%' : '0%' }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <currentStep.icon size={24} className="text-[#6C63FF]" />
                        <h1 className="text-2xl font-extrabold">{mode === 'edit' ? `Edit Profile · ${currentStep.title}` : currentStep.title}</h1>
                    </div>
                    <p className="text-slate-600 text-sm">{currentStep.subtitle} — Step {step + 1} of {TOTAL_STEPS}</p>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            {/* STEP 0: Basic Info */}
                            {step === 0 && (
                                <>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-2 block">Your Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="What should Coach Arjun call you?"
                                            className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-[#6C63FF]/50 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-3 block">Age</label>
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => setAge(a => Math.max(14, a - 1))} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-xl font-bold hover:bg-white/10 transition-all">−</button>
                                            <span className="text-3xl font-extrabold w-16 text-center">{age}</span>
                                            <button onClick={() => setAge(a => Math.min(80, a + 1))} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-xl font-bold hover:bg-white/10 transition-all">+</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-3 block">Gender</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {(['male', 'female', 'other'] as const).map(g => (
                                                <button key={g} onClick={() => setGender(g)}
                                                    className={`py-3 rounded-2xl text-sm font-semibold transition-all ${gender === g
                                                        ? 'bg-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/30'
                                                        : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'}`}>
                                                    {g === 'male' ? '♂ Male' : g === 'female' ? '♀ Female' : '⚧ Other'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* STEP 1: Gym Experience */}
                            {step === 1 && (
                                <>
                                    <div className="space-y-4">
                                        <p className="text-sm text-slate-300 leading-relaxed">
                                            Understanding your gym experience helps Coach Arjun prescribe the perfect workout intensity, exercise selection, and progression strategy for you.
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {GYM_EXPERIENCE_OPTIONS.map(opt => (
                                                <button key={opt.val} onClick={() => setGymExperience(opt.val)}
                                                    className={`p-4 rounded-2xl text-left transition-all ${gymExperience === opt.val
                                                        ? 'bg-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/30'
                                                        : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'}`}>
                                                    <p className="text-sm font-semibold">{opt.label}</p>
                                                    <p className="text-[11px] opacity-70 mt-1">{opt.desc}</p>
                                                    <p className="text-[10px] opacity-50 mt-2 italic">{opt.tips}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* STEP 2: Body & Goals */}
                            {step === 2 && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-slate-400 mb-2 flex items-center gap-1 block"><Scale size={12} /> Weight (kg)</label>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setWeight(w => Math.max(30, w - 1))} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 font-bold hover:bg-white/10">−</button>
                                                <span className="text-2xl font-extrabold flex-1 text-center">{weight}</span>
                                                <button onClick={() => setWeight(w => Math.min(200, w + 1))} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 font-bold hover:bg-white/10">+</button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 mb-2 flex items-center gap-1 block"><Ruler size={12} /> Height (cm)</label>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setHeight(h => Math.max(100, h - 1))} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 font-bold hover:bg-white/10">−</button>
                                                <span className="text-2xl font-extrabold flex-1 text-center">{height}</span>
                                                <button onClick={() => setHeight(h => Math.min(230, h + 1))} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 font-bold hover:bg-white/10">+</button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 mb-2 flex items-center gap-1 block"><Activity size={12} /> Body Fat (%)</label>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setBodyFat(b => Math.max(3, b - 1))} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 font-bold hover:bg-white/10">−</button>
                                                <span className="text-2xl font-extrabold flex-1 text-center">{bodyFat}%</span>
                                                <button onClick={() => setBodyFat(b => Math.min(60, b + 1))} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 font-bold hover:bg-white/10">+</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-3 block"><Activity size={12} className="inline" /> Fitness Level</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {([
                                                { val: 'beginner' as const, label: '🌱 Beginner', desc: '<6 months' },
                                                { val: 'intermediate' as const, label: '💪 Intermediate', desc: '6mo-2yr' },
                                                { val: 'advanced' as const, label: '🔥 Advanced', desc: '2+ years' },
                                            ]).map(l => (
                                                <button key={l.val} onClick={() => setFitnessLevel(l.val)}
                                                    className={`py-3 px-2 rounded-2xl text-center transition-all ${fitnessLevel === l.val
                                                        ? 'bg-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/30'
                                                        : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'}`}>
                                                    <p className="text-sm font-semibold">{l.label}</p>
                                                    <p className="text-[10px] opacity-60 mt-0.5">{l.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-3 block"><Target size={12} className="inline" /> Primary Goal</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {([
                                                { val: 'muscle_gain' as const, label: '💪 Muscle Gain', desc: 'Build size & strength' },
                                                { val: 'fat_loss' as const, label: '🔥 Fat Loss', desc: 'Get lean & cut' },
                                                { val: 'strength' as const, label: '🏋️ Strength', desc: 'Max power output' },
                                                { val: 'maintenance' as const, label: '⚖️ Maintenance', desc: 'Stay consistent' },
                                            ]).map(g => (
                                                <button key={g.val} onClick={() => setGoal(g.val)}
                                                    className={`py-3 px-3 rounded-2xl text-left transition-all ${goal === g.val
                                                        ? 'bg-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/30'
                                                        : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'}`}>
                                                    <p className="text-sm font-semibold">{g.label}</p>
                                                    <p className="text-[10px] opacity-60">{g.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-3 block">Training Style</label>
                                        <div className="flex flex-wrap gap-2">
                                            {([
                                                { val: 'bodybuilding' as const, label: '🏗️ Bodybuilding' },
                                                { val: 'powerlifting' as const, label: '🏋️ Powerlifting' },
                                                { val: 'functional' as const, label: '🤸 Functional' },
                                                { val: 'calisthenics' as const, label: '🤙 Calisthenics' },
                                                { val: 'mixed' as const, label: '🔄 Mixed' },
                                            ]).map(s => (
                                                <button key={s.val} onClick={() => setTrainingStyle(s.val)}
                                                    className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition-all ${trainingStyle === s.val
                                                        ? 'bg-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/30'
                                                        : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'}`}>
                                                    {s.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* STEP 3: Weekly Schedule Builder */}
                            {step === 3 && (
                                <>
                                    {/* Quick Templates */}
                                    <div>
                                        <label className="text-xs text-slate-400 mb-3 block">Quick Start Templates</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {QUICK_TEMPLATES.map((tmpl, i) => (
                                                <button key={i} onClick={() => applyTemplate(i)}
                                                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold text-left transition-all ${selectedTemplate === i
                                                        ? 'bg-[#6C63FF]/20 border border-[#6C63FF]/40 text-[#6C63FF]'
                                                        : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'}`}>
                                                    {tmpl.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Day Tabs */}
                                    <div>
                                        <label className="text-xs text-slate-400 mb-3 block">Click a day → select muscle groups</label>
                                        <div className="flex gap-1.5 overflow-x-auto pb-2">
                                            {DAY_NAMES.map(d => {
                                                const dayData = schedule[d.key];
                                                const hasWorkout = !dayData.isRestDay && dayData.sessions.some(s => s.muscleGroups.length > 0);
                                                return (
                                                    <button key={d.key} onClick={() => setSelectedDay(d.key)}
                                                        className={`shrink-0 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${selectedDay === d.key
                                                            ? 'bg-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/30'
                                                            : hasWorkout
                                                                ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                                                                : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
                                                            }`}>
                                                        <span>{d.short}</span>
                                                        {hasWorkout && selectedDay !== d.key && <span className="ml-1">✓</span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Selected Day Config */}
                                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-bold text-white capitalize">{selectedDay}</h3>
                                            <button onClick={() => toggleRestDay(selectedDay)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${schedule[selectedDay].isRestDay
                                                    ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                                                    : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'}`}>
                                                {schedule[selectedDay].isRestDay ? '😴 Rest Day' : 'Mark as rest'}
                                            </button>
                                        </div>

                                        {!schedule[selectedDay].isRestDay && (
                                            <>
                                                {schedule[selectedDay].sessions.map((session, sIdx) => (
                                                    <div key={sIdx} className="mb-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-slate-500">Session {sIdx + 1}</span>
                                                                <div className="flex gap-1">
                                                                    {(['morning', 'afternoon', 'evening'] as const).map(slot => (
                                                                        <button key={slot} onClick={() => setTimeSlotForSession(selectedDay, sIdx, slot)}
                                                                            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${session.timeSlot === slot
                                                                                ? 'bg-[#6C63FF]/20 text-[#6C63FF]'
                                                                                : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>
                                                                            {slot === 'morning' ? '🌅' : slot === 'afternoon' ? '☀️' : '🌙'} {slot}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            {schedule[selectedDay].sessions.length > 1 && (
                                                                <button onClick={() => removeSession(selectedDay, sIdx)} className="text-xs text-red-400 hover:text-red-300">✕ Remove</button>
                                                            )}
                                                        </div>

                                                        {/* Muscle Group Chips */}
                                                        <div className="flex flex-wrap gap-2">
                                                            {ALL_MUSCLES.map(m => {
                                                                const isSelected = session.muscleGroups.includes(m.id);
                                                                return (
                                                                    <button key={m.id} onClick={() => {
                                                                        if (schedule[selectedDay].sessions.length > 1) {
                                                                            toggleMuscleForSession(selectedDay, sIdx, m.id);
                                                                        } else {
                                                                            toggleMuscleForDay(selectedDay, m.id);
                                                                        }
                                                                    }}
                                                                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isSelected
                                                                            ? 'bg-[#6C63FF] text-white shadow-md shadow-[#6C63FF]/30'
                                                                            : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                                                                        {m.emoji} {m.label}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        {session.label && (
                                                            <p className="text-[10px] text-[#6C63FF] mt-2 font-medium">→ {session.label}</p>
                                                        )}
                                                    </div>
                                                ))}

                                                {schedule[selectedDay].sessions.length < 3 && (
                                                    <button onClick={() => addSessionToDay(selectedDay)}
                                                        className="w-full py-2.5 rounded-xl border border-dashed border-white/10 text-xs text-slate-500 hover:text-white hover:border-[#6C63FF]/30 transition-all">
                                                        + Add Another Session (2-a-day training)
                                                    </button>
                                                )}
                                            </>
                                        )}

                                        {schedule[selectedDay].isRestDay && (
                                            <div className="text-center py-6">
                                                <p className="text-slate-500 text-sm">😴 Rest day — recovery is growth!</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Schedule Overview */}
                                    <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
                                        <p className="text-xs text-slate-500 mb-2">Week Overview — {countTrainingDays(schedule)} training days</p>
                                        <div className="flex gap-1">
                                            {DAY_NAMES.map(d => {
                                                const day = schedule[d.key];
                                                const muscles = day.sessions.flatMap(s => s.muscleGroups);
                                                return (
                                                    <div key={d.key} className={`flex-1 rounded-lg p-2 text-center ${muscles.length > 0 ? 'bg-[#6C63FF]/10 border border-[#6C63FF]/20' : 'bg-white/[0.02] border border-white/[0.04]'}`}>
                                                        <p className="text-[10px] font-bold text-slate-400">{d.short}</p>
                                                        {muscles.length > 0 ? (
                                                            <p className="text-[8px] text-[#6C63FF] mt-0.5 leading-tight">{muscles.slice(0, 2).map(m => m.slice(0, 3)).join('+')}{muscles.length > 2 ? `+${muscles.length - 2}` : ''}</p>
                                                        ) : (
                                                            <p className="text-[8px] text-slate-600 mt-0.5">Rest</p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* STEP 4: Session Timing & Schedule Review */}
                            {step === 4 && (
                                <>
                                    <div className="space-y-3">
                                        {DAY_NAMES.map(d => {
                                            const day = schedule[d.key];
                                            if (day.isRestDay || day.sessions.length === 0) return (
                                                <div key={d.key} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 flex items-center gap-3">
                                                    <span className="text-xs font-bold text-slate-500 w-10">{d.short}</span>
                                                    <span className="text-xs text-slate-600">Rest Day 😴</span>
                                                </div>
                                            );
                                            return (
                                                <div key={d.key} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                                                    <p className="text-xs font-bold text-white mb-2">{d.label}</p>
                                                    {day.sessions.map((session, sIdx) => (
                                                        <div key={sIdx} className="flex items-center gap-3 mb-2 last:mb-0">
                                                            <div className="flex gap-1">
                                                                {(['morning', 'afternoon', 'evening'] as const).map(slot => (
                                                                    <button key={slot} onClick={() => setTimeSlotForSession(d.key, sIdx, slot)}
                                                                        className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${session.timeSlot === slot
                                                                            ? 'bg-[#6C63FF] text-white'
                                                                            : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>
                                                                        {slot === 'morning' ? '🌅' : slot === 'afternoon' ? '☀️' : '🌙'}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-xs text-white font-medium">{session.label || 'No muscles selected'}</p>
                                                                <p className="text-[10px] text-slate-500">{session.muscleGroups.length} muscle groups</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="bg-[#6C63FF]/5 border border-[#6C63FF]/10 rounded-xl p-4">
                                        <p className="text-xs text-[#6C63FF] font-semibold mb-1">💡 Tip</p>
                                        <p className="text-xs text-slate-300">Morning workouts boost metabolism all day. Evening sessions let you lift heavier after eating. Pick what you'll stick to!</p>
                                    </div>
                                </>
                            )}

                            {/* STEP 5: Diet & Food */}
                            {step === 5 && (
                                <>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-3 block">Diet Type</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {([
                                                { val: 'non_vegetarian' as const, label: '🥩 Non-Vegetarian', desc: 'Chicken, fish, eggs, dairy' },
                                                { val: 'vegetarian' as const, label: '🥬 Vegetarian', desc: 'Dairy, eggs, no meat' },
                                                { val: 'eggetarian' as const, label: '🥚 Eggetarian', desc: 'Eggs + vegetarian' },
                                                { val: 'vegan' as const, label: '🌱 Vegan', desc: 'Plant-based only' },
                                            ]).map(d => (
                                                <button key={d.val} onClick={() => setDietType(d.val)}
                                                    className={`py-3 px-3 rounded-2xl text-left transition-all ${dietType === d.val
                                                        ? 'bg-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/30'
                                                        : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'}`}>
                                                    <p className="text-sm font-semibold">{d.label}</p>
                                                    <p className="text-[10px] opacity-60">{d.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-3 block">Meals Per Day</label>
                                        <div className="flex gap-2">
                                            {[3, 4, 5, 6].map(n => (
                                                <button key={n} onClick={() => setMealsPerDay(n)}
                                                    className={`flex-1 py-3 rounded-2xl text-center text-sm font-bold transition-all ${mealsPerDay === n
                                                        ? 'bg-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/30'
                                                        : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'}`}>
                                                    {n}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-2 block">City (for food recommendations)</label>
                                        <input
                                            type="text"
                                            value={city}
                                            onChange={e => setCity(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-[#6C63FF]/50"
                                            placeholder="Visakhapatnam"
                                        />
                                        <p className="text-[10px] text-slate-600 mt-1">We'll suggest foods you can actually find locally</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-3 block"><Droplets size={12} className="inline" /> Daily Water Goal (liters)</label>
                                        <div className="flex gap-2">
                                            {[2, 2.5, 3, 3.5, 4].map(n => (
                                                <button key={n} onClick={() => setWaterGoal(n)}
                                                    className={`flex-1 py-3 rounded-2xl text-center text-sm font-bold transition-all ${waterGoal === n
                                                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                                        : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'}`}>
                                                    {n}L
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* STEP 6: Supplements */}
                            {step === 6 && (
                                <>
                                    <div className="space-y-3">
                                        {/* Whey Protein */}
                                        <div className={`rounded-2xl p-4 transition-all ${supplements.wheyProtein.takes
                                            ? 'bg-[#6C63FF]/10 border border-[#6C63FF]/30'
                                            : 'bg-white/[0.03] border border-white/[0.06]'}`}>
                                            <button onClick={() => updateSupplement('wheyProtein', 'takes', !supplements.wheyProtein.takes)}
                                                className="w-full flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg">🥛</span>
                                                    <div className="text-left">
                                                        <p className="text-sm font-bold text-white">Whey Protein</p>
                                                        <p className="text-[10px] text-slate-500">Post-workout / meal replacement</p>
                                                    </div>
                                                </div>
                                                <div className={`w-10 h-6 rounded-full flex items-center p-0.5 transition-all ${supplements.wheyProtein.takes ? 'bg-[#6C63FF] justify-end' : 'bg-white/10 justify-start'}`}>
                                                    <div className="w-5 h-5 bg-white rounded-full shadow" />
                                                </div>
                                            </button>
                                            {supplements.wheyProtein.takes && (
                                                <div className="mt-4 space-y-3 pl-8">
                                                    <div>
                                                        <label className="text-[10px] text-slate-400 mb-1 block">Scoops per day</label>
                                                        <div className="flex gap-2">
                                                            {[1, 2, 3].map(n => (
                                                                <button key={n} onClick={() => updateSupplement('wheyProtein', 'servingsPerDay', n)}
                                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${supplements.wheyProtein.servingsPerDay === n
                                                                        ? 'bg-[#6C63FF] text-white' : 'bg-white/5 text-slate-400'}`}>
                                                                    {n} scoop{n > 1 ? 's' : ''}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-slate-400 mb-1 block">Protein per scoop (g)</label>
                                                        <div className="flex gap-2">
                                                            {[20, 24, 25, 30].map(n => (
                                                                <button key={n} onClick={() => updateSupplement('wheyProtein', 'proteinPerServing', n)}
                                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${supplements.wheyProtein.proteinPerServing === n
                                                                        ? 'bg-[#6C63FF] text-white' : 'bg-white/5 text-slate-400'}`}>
                                                                    {n}g
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Creatine */}
                                        <div className={`rounded-2xl p-4 transition-all ${supplements.creatine.takes
                                            ? 'bg-[#6C63FF]/10 border border-[#6C63FF]/30'
                                            : 'bg-white/[0.03] border border-white/[0.06]'}`}>
                                            <button onClick={() => updateSupplement('creatine', 'takes', !supplements.creatine.takes)}
                                                className="w-full flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg">⚡</span>
                                                    <div className="text-left">
                                                        <p className="text-sm font-bold text-white">Creatine Monohydrate</p>
                                                        <p className="text-[10px] text-slate-500">5g/day for strength & recovery</p>
                                                    </div>
                                                </div>
                                                <div className={`w-10 h-6 rounded-full flex items-center p-0.5 transition-all ${supplements.creatine.takes ? 'bg-[#6C63FF] justify-end' : 'bg-white/10 justify-start'}`}>
                                                    <div className="w-5 h-5 bg-white rounded-full shadow" />
                                                </div>
                                            </button>
                                            {supplements.creatine.takes && (
                                                <div className="mt-3 pl-8">
                                                    <label className="text-[10px] text-slate-400 mb-1 block">Daily dose (g)</label>
                                                    <div className="flex gap-2">
                                                        {[3, 5, 10].map(n => (
                                                            <button key={n} onClick={() => updateSupplement('creatine', 'dailyGrams', n)}
                                                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${supplements.creatine.dailyGrams === n
                                                                    ? 'bg-[#6C63FF] text-white' : 'bg-white/5 text-slate-400'}`}>
                                                                {n}g{n === 5 ? ' ✓' : n === 10 ? ' (loading)' : ''}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Pre-Workout */}
                                        <div className={`rounded-2xl p-4 transition-all ${supplements.preWorkout.takes
                                            ? 'bg-[#6C63FF]/10 border border-[#6C63FF]/30'
                                            : 'bg-white/[0.03] border border-white/[0.06]'}`}>
                                            <button onClick={() => updateSupplement('preWorkout', 'takes', !supplements.preWorkout.takes)}
                                                className="w-full flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg">🚀</span>
                                                    <div className="text-left">
                                                        <p className="text-sm font-bold text-white">Pre-Workout</p>
                                                        <p className="text-[10px] text-slate-500">Caffeine + pump ingredients</p>
                                                    </div>
                                                </div>
                                                <div className={`w-10 h-6 rounded-full flex items-center p-0.5 transition-all ${supplements.preWorkout.takes ? 'bg-[#6C63FF] justify-end' : 'bg-white/10 justify-start'}`}>
                                                    <div className="w-5 h-5 bg-white rounded-full shadow" />
                                                </div>
                                            </button>
                                        </div>

                                        {/* BCAA */}
                                        <div className={`rounded-2xl p-4 transition-all ${supplements.bcaa.takes
                                            ? 'bg-[#6C63FF]/10 border border-[#6C63FF]/30'
                                            : 'bg-white/[0.03] border border-white/[0.06]'}`}>
                                            <button onClick={() => updateSupplement('bcaa', 'takes', !supplements.bcaa.takes)}
                                                className="w-full flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg">💊</span>
                                                    <div className="text-left">
                                                        <p className="text-sm font-bold text-white">BCAAs</p>
                                                        <p className="text-[10px] text-slate-500">Intra-workout amino acids</p>
                                                    </div>
                                                </div>
                                                <div className={`w-10 h-6 rounded-full flex items-center p-0.5 transition-all ${supplements.bcaa.takes ? 'bg-[#6C63FF] justify-end' : 'bg-white/10 justify-start'}`}>
                                                    <div className="w-5 h-5 bg-white rounded-full shadow" />
                                                </div>
                                            </button>
                                        </div>

                                        {/* Multivitamin */}
                                        <div className={`rounded-2xl p-4 transition-all ${supplements.multivitamin.takes
                                            ? 'bg-[#6C63FF]/10 border border-[#6C63FF]/30'
                                            : 'bg-white/[0.03] border border-white/[0.06]'}`}>
                                            <button onClick={() => updateSupplement('multivitamin', 'takes', !supplements.multivitamin.takes)}
                                                className="w-full flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg">🌈</span>
                                                    <div className="text-left">
                                                        <p className="text-sm font-bold text-white">Multivitamin</p>
                                                        <p className="text-[10px] text-slate-500">Daily micronutrient insurance</p>
                                                    </div>
                                                </div>
                                                <div className={`w-10 h-6 rounded-full flex items-center p-0.5 transition-all ${supplements.multivitamin.takes ? 'bg-[#6C63FF] justify-end' : 'bg-white/10 justify-start'}`}>
                                                    <div className="w-5 h-5 bg-white rounded-full shadow" />
                                                </div>
                                            </button>
                                        </div>

                                        {/* Fish Oil */}
                                        <div className={`rounded-2xl p-4 transition-all ${supplements.fishOil.takes
                                            ? 'bg-[#6C63FF]/10 border border-[#6C63FF]/30'
                                            : 'bg-white/[0.03] border border-white/[0.06]'}`}>
                                            <button onClick={() => updateSupplement('fishOil', 'takes', !supplements.fishOil.takes)}
                                                className="w-full flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg">🐟</span>
                                                    <div className="text-left">
                                                        <p className="text-sm font-bold text-white">Fish Oil / Omega-3</p>
                                                        <p className="text-[10px] text-slate-500">Joint health & inflammation</p>
                                                    </div>
                                                </div>
                                                <div className={`w-10 h-6 rounded-full flex items-center p-0.5 transition-all ${supplements.fishOil.takes ? 'bg-[#6C63FF] justify-end' : 'bg-white/10 justify-start'}`}>
                                                    <div className="w-5 h-5 bg-white rounded-full shadow" />
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Supplement summary */}
                                    {supplements.wheyProtein.takes && (
                                        <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3">
                                            <p className="text-xs text-green-400">
                                                📊 Supplement protein: <strong>{supplements.wheyProtein.proteinPerServing * supplements.wheyProtein.servingsPerDay}g/day</strong> from whey
                                                — this will be subtracted from your food protein target
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* STEP 7: Review & Confirm */}
                            {step === 7 && (
                                <>
                                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 space-y-4">
                                        <h3 className="text-sm font-bold text-[#6C63FF]">Your Profile</h3>
                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div><span className="text-slate-500">Name</span><p className="text-white font-semibold">{name || 'Athlete'}</p></div>
                                            <div><span className="text-slate-500">Age</span><p className="text-white font-semibold">{age}</p></div>
                                            <div><span className="text-slate-500">Weight</span><p className="text-white font-semibold">{weight} kg</p></div>
                                            <div><span className="text-slate-500">Height</span><p className="text-white font-semibold">{height} cm</p></div>
                                            <div><span className="text-slate-500">Gym Experience</span><p className="text-white font-semibold capitalize">{gymExperience}</p></div>
                                            <div><span className="text-slate-500">Level</span><p className="text-white font-semibold capitalize">{fitnessLevel}</p></div>
                                            <div><span className="text-slate-500">Goal</span><p className="text-white font-semibold capitalize">{goal.replace('_', ' ')}</p></div>
                                        </div>
                                    </div>

                                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
                                        <h3 className="text-sm font-bold text-[#6C63FF] mb-3">Weekly Schedule</h3>
                                        <div className="space-y-2">
                                            {DAY_NAMES.map(d => {
                                                const day = schedule[d.key];
                                                return (
                                                    <div key={d.key} className="flex items-center gap-3 text-xs">
                                                        <span className="w-10 text-slate-500 font-bold">{d.short}</span>
                                                        {day.isRestDay || day.sessions.length === 0 ? (
                                                            <span className="text-slate-600">Rest</span>
                                                        ) : (
                                                            <div className="flex flex-wrap gap-1">
                                                                {day.sessions.map((s, i) => (
                                                                    <span key={i} className="bg-[#6C63FF]/10 text-[#6C63FF] px-2 py-1 rounded-lg text-[10px] font-medium">
                                                                        {s.timeSlot === 'morning' ? '🌅' : s.timeSlot === 'afternoon' ? '☀️' : '🌙'} {s.label}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-3">{countTrainingDays(schedule)} training days/week</p>
                                    </div>

                                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
                                        <h3 className="text-sm font-bold text-[#6C63FF] mb-2">Nutrition & Supplements</h3>
                                        <div className="text-xs space-y-1.5 text-slate-300">
                                            <p>🍽️ {mealsPerDay} meals/day • {dietType.replace('_', '-')} • {city}</p>
                                            <p>💧 {waterGoal}L water/day</p>
                                            {supplements.wheyProtein.takes && <p>🥛 Whey: {supplements.wheyProtein.servingsPerDay} scoop(s) × {supplements.wheyProtein.proteinPerServing}g = {supplements.wheyProtein.servingsPerDay * supplements.wheyProtein.proteinPerServing}g protein</p>}
                                            {supplements.creatine.takes && <p>⚡ Creatine: {supplements.creatine.dailyGrams}g/day</p>}
                                            {supplements.preWorkout.takes && <p>🚀 Pre-workout: Yes</p>}
                                            {supplements.bcaa.takes && <p>💊 BCAAs: Yes</p>}
                                            {supplements.multivitamin.takes && <p>🌈 Multivitamin: Yes</p>}
                                            {supplements.fishOil.takes && <p>🐟 Fish Oil: Yes</p>}
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Navigation */}
                <div className="flex gap-3 mt-8 pt-4 border-t border-slate-200">
                    {mode === 'edit' && onCancel && (
                        <button onClick={onCancel}
                            className="flex items-center gap-2 px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
                            Cancel
                        </button>
                    )}
                    {step > 0 && (
                        <button onClick={prev}
                            className="flex items-center gap-2 px-6 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm font-semibold text-slate-300 hover:bg-white/10 transition-all">
                            <ChevronLeft size={16} /> Back
                        </button>
                    )}
                    {submitError && (
                        <div className="flex-1 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {submitError}
                        </div>
                    )}
                    <button
                        onClick={step === TOTAL_STEPS - 1 ? handleComplete : next}
                        disabled={!canAdvance() || isSubmitting}
                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all ${canAdvance() && !isSubmitting
                            ? 'bg-gradient-to-r from-[#6C63FF] to-purple-500 text-white shadow-[0_0_25px_rgba(108,99,255,0.4)] hover:shadow-[0_0_35px_rgba(108,99,255,0.6)]'
                            : 'bg-white/5 text-slate-600 cursor-not-allowed'}`}>
                        {isSubmitting ? (
                            <>Saving profile...</>
                        ) : step === TOTAL_STEPS - 1 ? (
                            <><Sparkles size={16} /> {mode === 'edit' ? 'Update Profile' : 'Start My Journey'}</>
                        ) : (
                            <>Continue <ChevronRight size={16} /></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
