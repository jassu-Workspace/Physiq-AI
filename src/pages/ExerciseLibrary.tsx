import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Dumbbell, Filter, BookOpen, ChevronRight } from 'lucide-react';
import {
    useExerciseDB,
    getExerciseImageUrl,
    ALL_MUSCLES,
    ALL_EQUIPMENT,
    ALL_CATEGORIES,
    type FreeExercise,
} from '../services/exerciseDB';

export const MUSCLE_LABEL: Record<string, string> = {
    abdominals: 'Abs', abductors: 'Abductors', adductors: 'Adductors',
    biceps: 'Biceps', calves: 'Calves', chest: 'Chest', forearms: 'Forearms',
    glutes: 'Glutes', hamstrings: 'Hamstrings', lats: 'Lats',
    'lower back': 'Lower Back', 'middle back': 'Mid Back', neck: 'Neck',
    quadriceps: 'Quads', shoulders: 'Shoulders', traps: 'Traps', triceps: 'Triceps',
};

export const LEVEL_COLOR: Record<string, string> = {
    beginner: 'bg-green-500/10 text-green-400',
    intermediate: 'bg-yellow-500/10 text-yellow-400',
    expert: 'bg-red-500/10 text-red-400',
};

export const CAT_COLOR: Record<string, string> = {
    strength: 'bg-[#6C63FF]/10 text-[#6C63FF]',
    powerlifting: 'bg-orange-500/10 text-orange-400',
    cardio: 'bg-pink-500/10 text-pink-400',
    stretching: 'bg-teal-500/10 text-teal-400',
    'olympic weightlifting': 'bg-amber-500/10 text-amber-400',
    strongman: 'bg-red-500/10 text-red-400',
    plyometrics: 'bg-cyan-500/10 text-cyan-400',
};

export function ExerciseCard({ ex, onSelect }: { ex: FreeExercise; onSelect: () => void }) {
    const imgSrc = ex.images[0] ? getExerciseImageUrl(ex.images[0]) : null;
    const [imgFailed, setImgFailed] = useState(false);

    return (
        <button
            onClick={onSelect}
            className="text-left w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-[#6C63FF]/30 rounded-2xl overflow-hidden transition-all group flex flex-col"
        >
            {/* Fixed-height image area — always rendered for consistent card alignment */}
            <div className="w-full h-36 bg-black/20 overflow-hidden shrink-0 relative">
                {imgSrc && !imgFailed ? (
                    <img
                        src={imgSrc}
                        alt={ex.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={() => setImgFailed(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Dumbbell size={28} className="text-white/10" />
                    </div>
                )}
                {/* Level badge overlay */}
                <span className={`absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded-full capitalize font-medium ${LEVEL_COLOR[ex.level] ?? 'bg-white/10 text-slate-400'}`}>
                    {ex.level}
                </span>
            </div>

            {/* Card body */}
            <div className="p-3 flex flex-col flex-1">
                <p className="text-sm font-semibold text-white leading-snug mb-2 line-clamp-2 flex-1">{ex.name}</p>
                <div className="flex flex-wrap gap-1 mb-1.5">
                    {ex.primaryMuscles.slice(0, 2).map(m => (
                        <span key={m} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#6C63FF]/10 text-[#6C63FF]">
                            {MUSCLE_LABEL[m] ?? m}
                        </span>
                    ))}
                </div>
                <div className="flex items-center justify-between mt-auto">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${CAT_COLOR[ex.category] ?? 'bg-white/5 text-slate-400'}`}>
                        {ex.category}
                    </span>
                    {ex.equipment && (
                        <span className="text-[10px] text-slate-500 capitalize truncate ml-1">{ex.equipment}</span>
                    )}
                </div>
            </div>
        </button>
    );
}

export function ExerciseDetail({ ex, onClose }: { ex: FreeExercise; onClose: () => void }) {
    const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});
    const imgs = ex.images.map(getExerciseImageUrl);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.92, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.92, y: 20 }}
                transition={{ duration: 0.2 }}
                onClick={e => e.stopPropagation()}
                className="bg-[#0F1020] border border-white/[0.08] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
                {/* Images side-by-side */}
                {imgs.length > 0 && (
                    <div className="flex gap-2 p-4 pb-0">
                        {imgs.map((src, i) => (
                            !imgErrors[i] && (
                                <div key={i} className="flex-1 h-52 bg-black/30 rounded-2xl overflow-hidden">
                                    <img
                                        src={src}
                                        alt={`${ex.name} step ${i + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={() => setImgErrors(p => ({ ...p, [i]: true }))}
                                    />
                                </div>
                            )
                        ))}
                    </div>
                )}

                <div className="px-6 py-5 space-y-4">
                    {/* Title + close */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-extrabold text-white leading-tight">{ex.name}</h2>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${LEVEL_COLOR[ex.level]}`}>{ex.level}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${CAT_COLOR[ex.category] ?? 'bg-white/5 text-slate-400'}`}>{ex.category}</span>
                                {ex.mechanic && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400 capitalize">{ex.mechanic}</span>
                                )}
                                {ex.force && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400 capitalize">{ex.force}</span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="shrink-0 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                        >
                            <X size={16} className="text-slate-400" />
                        </button>
                    </div>

                    {/* Equipment & Muscles */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/[0.03] rounded-xl p-3">
                            <p className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wide">Equipment</p>
                            <p className="text-sm text-slate-200 capitalize">{ex.equipment || 'None'}</p>
                        </div>
                        <div className="bg-white/[0.03] rounded-xl p-3">
                            <p className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wide">Primary Muscles</p>
                            <div className="flex flex-wrap gap-1">
                                {ex.primaryMuscles.map(m => (
                                    <span key={m} className="text-xs text-[#6C63FF] capitalize">{MUSCLE_LABEL[m] ?? m}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {ex.secondaryMuscles.length > 0 && (
                        <div className="bg-white/[0.03] rounded-xl p-3">
                            <p className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wide">Also works</p>
                            <div className="flex flex-wrap gap-1.5">
                                {ex.secondaryMuscles.map(m => (
                                    <span key={m} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-300 capitalize">
                                        {MUSCLE_LABEL[m] ?? m}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    <div>
                        <p className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            <BookOpen size={14} className="text-[#6C63FF]" />
                            Step-by-Step Instructions
                        </p>
                        <ol className="space-y-2.5">
                            {ex.instructions.map((step, i) => (
                                <li key={i} className="flex gap-3">
                                    <span className="shrink-0 w-6 h-6 rounded-full bg-[#6C63FF]/15 text-[#6C63FF] flex items-center justify-center text-xs font-bold mt-0.5">
                                        {i + 1}
                                    </span>
                                    <p className="text-sm text-slate-300 leading-relaxed">{step}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

const QUICK_MUSCLES = [
    { key: 'chest', label: 'Chest' },
    { key: 'lats', label: 'Back' },
    { key: 'shoulders', label: 'Shoulders' },
    { key: 'biceps', label: 'Biceps' },
    { key: 'triceps', label: 'Triceps' },
    { key: 'quadriceps', label: 'Legs' },
    { key: 'hamstrings', label: 'Hamstrings' },
    { key: 'glutes', label: 'Glutes' },
    { key: 'abdominals', label: 'Abs' },
    { key: 'calves', label: 'Calves' },
];

export default function ExerciseLibrary() {
    const { exercises, loading } = useExerciseDB();
    const [search, setSearch] = useState('');
    const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
    const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
    const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [selected, setSelected] = useState<FreeExercise | null>(null);

    const filtered = useMemo(() => {
        let list = exercises;
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(e =>
                e.name.toLowerCase().includes(q) ||
                e.primaryMuscles.some(m => m.toLowerCase().includes(q)) ||
                (e.equipment ?? '').toLowerCase().includes(q)
            );
        }
        if (selectedMuscle) {
            list = list.filter(e =>
                e.primaryMuscles.includes(selectedMuscle) ||
                e.secondaryMuscles.includes(selectedMuscle)
            );
        }
        if (selectedEquipment) list = list.filter(e => e.equipment === selectedEquipment);
        if (selectedLevel) list = list.filter(e => e.level === selectedLevel);
        if (selectedCategory) list = list.filter(e => e.category === selectedCategory);
        return list;
    }, [exercises, search, selectedMuscle, selectedEquipment, selectedLevel, selectedCategory]);

    const activeFilterCount = [selectedMuscle, selectedEquipment, selectedLevel, selectedCategory].filter(Boolean).length;

    const clearFilters = () => {
        setSelectedMuscle(null);
        setSelectedEquipment(null);
        setSelectedLevel(null);
        setSelectedCategory(null);
    };

    return (
        <div className="max-w-6xl mx-auto flex flex-col gap-5 p-4 lg:p-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl lg:text-4xl font-extrabold text-white flex items-center gap-3">
                    <Dumbbell className="text-[#6C63FF]" size={32} />
                    Exercise Library
                </h1>
                <p className="text-slate-400 mt-1 text-sm">
                    {loading ? 'Loading exercises...' : `${exercises.length} exercises`}
                    {!loading && filtered.length !== exercises.length && ` · ${filtered.length} shown`}
                </p>
            </div>

            {/* Search + Filters row */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search exercises, muscles, equipment..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#6C63FF]/50"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                            <X size={13} className="text-slate-400 hover:text-white" />
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setShowFilters(f => !f)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all whitespace-nowrap ${showFilters || activeFilterCount > 0
                        ? 'bg-[#6C63FF]/15 border-[#6C63FF]/30 text-[#6C63FF]'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
                >
                    <Filter size={14} />
                    Filters
                    {activeFilterCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-[#6C63FF] text-white text-[10px] flex items-center justify-center">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
                {activeFilterCount > 0 && (
                    <button
                        onClick={clearFilters}
                        className="px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-all whitespace-nowrap"
                    >
                        Clear all
                    </button>
                )}
            </div>

            {/* Quick muscle chips */}
            <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
                {QUICK_MUSCLES.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setSelectedMuscle(selectedMuscle === key ? null : key)}
                        className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all ${selectedMuscle === key
                            ? 'bg-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/30'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Expandable filter panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 space-y-4">
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">All Muscle Groups</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {ALL_MUSCLES.map(m => (
                                        <button key={m}
                                            onClick={() => setSelectedMuscle(selectedMuscle === m ? null : m)}
                                            className={`text-xs px-2.5 py-1 rounded-full transition-all capitalize ${selectedMuscle === m ? 'bg-[#6C63FF] text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                        >
                                            {MUSCLE_LABEL[m] ?? m}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">Level</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {['beginner', 'intermediate', 'expert'].map(l => (
                                            <button key={l}
                                                onClick={() => setSelectedLevel(selectedLevel === l ? null : l)}
                                                className={`text-xs px-2.5 py-1 rounded-full capitalize transition-all ${selectedLevel === l ? 'bg-[#6C63FF] text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                            >{l}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">Category</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {ALL_CATEGORIES.map(c => (
                                            <button key={c}
                                                onClick={() => setSelectedCategory(selectedCategory === c ? null : c)}
                                                className={`text-xs px-2.5 py-1 rounded-full capitalize transition-all ${selectedCategory === c ? 'bg-[#6C63FF] text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                            >{c}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">Equipment</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {ALL_EQUIPMENT.map(eq => (
                                            <button key={eq}
                                                onClick={() => setSelectedEquipment(selectedEquipment === eq ? null : eq)}
                                                className={`text-xs px-2.5 py-1 rounded-full capitalize transition-all ${selectedEquipment === eq ? 'bg-[#6C63FF] text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                            >{eq}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading skeleton */}
            {loading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="animate-pulse bg-white/[0.03] rounded-2xl h-56" />
                    ))}
                </div>
            )}

            {/* Exercise grid */}
            {!loading && (
                filtered.length === 0 ? (
                    <div className="text-center py-20 text-slate-500">
                        <Dumbbell size={40} className="mx-auto mb-3 opacity-20" />
                        <p className="text-sm">No exercises found. Try adjusting your filters.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {filtered.map(ex => (
                            <ExerciseCard key={ex.id} ex={ex} onSelect={() => setSelected(ex)} />
                        ))}
                    </div>
                )
            )}

            {/* Detail modal */}
            <AnimatePresence>
                {selected && <ExerciseDetail ex={selected} onClose={() => setSelected(null)} />}
            </AnimatePresence>
        </div>
    );
}
