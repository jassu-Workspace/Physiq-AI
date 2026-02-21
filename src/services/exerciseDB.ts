// Free Exercise DB — types and loader
// Data sourced from https://github.com/yuhonas/free-exercise-db (873 exercises)

import { useState, useEffect } from 'react';

export interface FreeExercise {
    id: string;
    name: string;
    force: 'push' | 'pull' | 'static' | null;
    level: 'beginner' | 'intermediate' | 'expert';
    mechanic: 'compound' | 'isolation' | null;
    equipment: string | null;
    primaryMuscles: string[];
    secondaryMuscles: string[];
    instructions: string[];
    category: 'strength' | 'powerlifting' | 'cardio' | 'stretching' | 'olympic weightlifting' | 'strongman' | 'plyometrics';
    images: string[];
}

export const ALL_MUSCLES = [
    'abdominals', 'abductors', 'adductors', 'biceps', 'calves',
    'chest', 'forearms', 'glutes', 'hamstrings', 'lats',
    'lower back', 'middle back', 'neck', 'quadriceps', 'shoulders',
    'traps', 'triceps',
] as const;

export const ALL_EQUIPMENT = [
    'barbell', 'dumbbell', 'cable', 'machine', 'body only',
    'kettlebells', 'bands', 'e-z curl bar', 'medicine ball',
    'exercise ball', 'foam roll', 'other',
] as const;

export const ALL_CATEGORIES = [
    'strength', 'powerlifting', 'cardio', 'stretching',
    'olympic weightlifting', 'strongman', 'plyometrics',
] as const;

export type MuscleName = typeof ALL_MUSCLES[number];
export type EquipmentName = typeof ALL_EQUIPMENT[number];
export type CategoryName = typeof ALL_CATEGORIES[number];

let cachedExercises: FreeExercise[] | null = null;

export function useExerciseDB() {
    const [exercises, setExercises] = useState<FreeExercise[]>(cachedExercises ?? []);
    const [loading, setLoading] = useState(cachedExercises === null);

    useEffect(() => {
        if (cachedExercises) return;
        fetch('/exercises.json')
            .then(r => r.json())
            .then((data: FreeExercise[]) => {
                cachedExercises = data;
                setExercises(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return { exercises, loading };
}

export function getExerciseImageUrl(imageRef: string): string {
    return `/exercises/${imageRef}`;
}

// Map free-exercise-db exercise names/ids to our internal exercise names
// for showing images in the WorkoutPlan
export function findMatchingFreeExercise(
    exerciseName: string,
    freeExercises: FreeExercise[]
): FreeExercise | null {
    const nameLower = exerciseName.toLowerCase().replace(/[^a-z0-9]/g, '');
    // Try exact id match first (after normalizing)
    const exact = freeExercises.find(e =>
        e.id.toLowerCase().replace(/[^a-z0-9]/g, '') === nameLower
    );
    if (exact) return exact;
    // Try name match
    const byName = freeExercises.find(e =>
        e.name.toLowerCase().replace(/[^a-z0-9]/g, '') === nameLower
    );
    if (byName) return byName;
    // Partial match — find first where name contains all significant words
    const words = exerciseName.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const partial = freeExercises.find(e => {
        const eName = e.name.toLowerCase();
        return words.every(w => eName.includes(w));
    });
    return partial ?? null;
}
