// Muscle Recovery Data & Volume Guidelines
// Used by the Workout Intelligence Engine for recovery scoring and overtraining detection

export interface MuscleRecoveryData {
    muscleGroup: string;
    recoveryHours: number; // minimum hours for full recovery
    volumePerWeek: { min: number; max: number; optimal: number }; // sets per week
    frequencyPerWeek: { min: number; max: number }; // training sessions per week
    fatigueMultiplier: number; // 1.0 = normal, higher = generates more systemic fatigue
}

export const muscleRecoveryMap: Record<string, MuscleRecoveryData> = {
    chest: { muscleGroup: "chest", recoveryHours: 48, volumePerWeek: { min: 10, max: 20, optimal: 14 }, frequencyPerWeek: { min: 1, max: 3 }, fatigueMultiplier: 1.2 },
    back: { muscleGroup: "back", recoveryHours: 48, volumePerWeek: { min: 10, max: 25, optimal: 16 }, frequencyPerWeek: { min: 2, max: 3 }, fatigueMultiplier: 1.3 },
    shoulders: { muscleGroup: "shoulders", recoveryHours: 36, volumePerWeek: { min: 8, max: 18, optimal: 12 }, frequencyPerWeek: { min: 2, max: 3 }, fatigueMultiplier: 0.8 },
    biceps: { muscleGroup: "biceps", recoveryHours: 36, volumePerWeek: { min: 6, max: 14, optimal: 10 }, frequencyPerWeek: { min: 2, max: 3 }, fatigueMultiplier: 0.5 },
    triceps: { muscleGroup: "triceps", recoveryHours: 36, volumePerWeek: { min: 6, max: 14, optimal: 10 }, frequencyPerWeek: { min: 2, max: 3 }, fatigueMultiplier: 0.5 },
    quadriceps: { muscleGroup: "quadriceps", recoveryHours: 72, volumePerWeek: { min: 8, max: 20, optimal: 14 }, frequencyPerWeek: { min: 1, max: 3 }, fatigueMultiplier: 1.5 },
    hamstrings: { muscleGroup: "hamstrings", recoveryHours: 72, volumePerWeek: { min: 6, max: 16, optimal: 10 }, frequencyPerWeek: { min: 1, max: 3 }, fatigueMultiplier: 1.3 },
    glutes: { muscleGroup: "glutes", recoveryHours: 48, volumePerWeek: { min: 6, max: 16, optimal: 10 }, frequencyPerWeek: { min: 2, max: 3 }, fatigueMultiplier: 1.2 },
    calves: { muscleGroup: "calves", recoveryHours: 24, volumePerWeek: { min: 8, max: 16, optimal: 12 }, frequencyPerWeek: { min: 2, max: 4 }, fatigueMultiplier: 0.3 },
    core: { muscleGroup: "core", recoveryHours: 24, volumePerWeek: { min: 6, max: 16, optimal: 10 }, frequencyPerWeek: { min: 2, max: 5 }, fatigueMultiplier: 0.3 },
    traps: { muscleGroup: "traps", recoveryHours: 36, volumePerWeek: { min: 4, max: 12, optimal: 8 }, frequencyPerWeek: { min: 1, max: 3 }, fatigueMultiplier: 0.6 },
    forearms: { muscleGroup: "forearms", recoveryHours: 24, volumePerWeek: { min: 4, max: 12, optimal: 6 }, frequencyPerWeek: { min: 2, max: 4 }, fatigueMultiplier: 0.3 },
    lats: { muscleGroup: "lats", recoveryHours: 48, volumePerWeek: { min: 8, max: 20, optimal: 14 }, frequencyPerWeek: { min: 2, max: 3 }, fatigueMultiplier: 1.2 },
};

// Workout Split Templates
export interface SplitTemplate {
    id: string;
    name: string;
    daysPerWeek: number;
    level: 'beginner' | 'intermediate' | 'advanced';
    split: { day: number; label: string; muscleGroups: string[]; focus: string }[];
    description: string;
}

export const splitTemplates: SplitTemplate[] = [
    {
        id: "split_fullbody_3",
        name: "Full Body 3-Day",
        daysPerWeek: 3,
        level: "beginner",
        split: [
            { day: 1, label: "Full Body A", muscleGroups: ["chest", "back", "quadriceps", "shoulders", "core"], focus: "Compound movements" },
            { day: 2, label: "Rest", muscleGroups: [], focus: "Recovery" },
            { day: 3, label: "Full Body B", muscleGroups: ["chest", "back", "hamstrings", "glutes", "biceps", "triceps"], focus: "Compound + isolation" },
            { day: 4, label: "Rest", muscleGroups: [], focus: "Recovery" },
            { day: 5, label: "Full Body C", muscleGroups: ["back", "shoulders", "quadriceps", "core", "calves"], focus: "Volume focus" },
            { day: 6, label: "Rest", muscleGroups: [], focus: "Recovery" },
            { day: 7, label: "Rest", muscleGroups: [], focus: "Recovery" },
        ],
        description: "Perfect for beginners. 3 full body workouts per week with adequate recovery."
    },
    {
        id: "split_upper_lower_4",
        name: "Upper/Lower 4-Day",
        daysPerWeek: 4,
        level: "intermediate",
        split: [
            { day: 1, label: "Upper A", muscleGroups: ["chest", "back", "shoulders", "biceps", "triceps"], focus: "Strength focus — heavy compounds" },
            { day: 2, label: "Lower A", muscleGroups: ["quadriceps", "hamstrings", "glutes", "calves", "core"], focus: "Strength focus — squat dominant" },
            { day: 3, label: "Rest", muscleGroups: [], focus: "Active recovery" },
            { day: 4, label: "Upper B", muscleGroups: ["chest", "back", "shoulders", "biceps", "triceps"], focus: "Hypertrophy — higher volume" },
            { day: 5, label: "Lower B", muscleGroups: ["quadriceps", "hamstrings", "glutes", "calves", "core"], focus: "Hypertrophy — hinge dominant" },
            { day: 6, label: "Rest", muscleGroups: [], focus: "Recovery" },
            { day: 7, label: "Rest", muscleGroups: [], focus: "Recovery" },
        ],
        description: "Great balance of frequency and recovery. Each muscle hit 2x/week."
    },
    {
        id: "split_ppl_6",
        name: "Push/Pull/Legs 6-Day",
        daysPerWeek: 6,
        level: "advanced",
        split: [
            { day: 1, label: "Push A", muscleGroups: ["chest", "shoulders", "triceps"], focus: "Heavy strength" },
            { day: 2, label: "Pull A", muscleGroups: ["back", "biceps", "forearms", "traps"], focus: "Heavy strength" },
            { day: 3, label: "Legs A", muscleGroups: ["quadriceps", "hamstrings", "glutes", "calves", "core"], focus: "Squat dominant" },
            { day: 4, label: "Push B", muscleGroups: ["chest", "shoulders", "triceps"], focus: "Hypertrophy volume" },
            { day: 5, label: "Pull B", muscleGroups: ["back", "lats", "biceps", "traps"], focus: "Hypertrophy volume" },
            { day: 6, label: "Legs B", muscleGroups: ["quadriceps", "hamstrings", "glutes", "calves", "core"], focus: "Hinge dominant" },
            { day: 7, label: "Rest", muscleGroups: [], focus: "Full recovery" },
        ],
        description: "Maximum volume and frequency. For experienced lifters only."
    },
    {
        id: "split_ppl_3",
        name: "Push/Pull/Legs 3-Day",
        daysPerWeek: 3,
        level: "beginner",
        split: [
            { day: 1, label: "Push", muscleGroups: ["chest", "shoulders", "triceps"], focus: "All pressing movements" },
            { day: 2, label: "Rest", muscleGroups: [], focus: "Recovery" },
            { day: 3, label: "Pull", muscleGroups: ["back", "biceps", "forearms", "traps"], focus: "All pulling movements" },
            { day: 4, label: "Rest", muscleGroups: [], focus: "Recovery" },
            { day: 5, label: "Legs", muscleGroups: ["quadriceps", "hamstrings", "glutes", "calves", "core"], focus: "Lower body" },
            { day: 6, label: "Rest", muscleGroups: [], focus: "Recovery" },
            { day: 7, label: "Rest", muscleGroups: [], focus: "Recovery" },
        ],
        description: "Simple 3-day split. Good for beginners who prefer body part focus."
    },
    {
        id: "split_bro_5",
        name: "5-Day Bro Split",
        daysPerWeek: 5,
        level: "intermediate",
        split: [
            { day: 1, label: "Chest", muscleGroups: ["chest", "core"], focus: "High volume chest" },
            { day: 2, label: "Back", muscleGroups: ["back", "lats", "traps"], focus: "Width and thickness" },
            { day: 3, label: "Shoulders + Arms", muscleGroups: ["shoulders", "biceps", "triceps"], focus: "Delts and arms" },
            { day: 4, label: "Legs", muscleGroups: ["quadriceps", "hamstrings", "glutes", "calves"], focus: "Full leg day" },
            { day: 5, label: "Weak Points", muscleGroups: ["core", "forearms", "calves"], focus: "Bring up lagging parts" },
            { day: 6, label: "Rest", muscleGroups: [], focus: "Recovery" },
            { day: 7, label: "Rest", muscleGroups: [], focus: "Recovery" },
        ],
        description: "Classic bodybuilding split. Maximum volume per muscle per session."
    }
];

// Helper functions
export function getRecoveryData(muscle: string): MuscleRecoveryData | undefined {
    return muscleRecoveryMap[muscle];
}

export function getSplitsForLevel(level: SplitTemplate['level']): SplitTemplate[] {
    return splitTemplates.filter(s => s.level === level);
}

export function calculateRecoveryScore(
    muscle: string,
    hoursSinceLastTrained: number,
    setsLastSession: number
): number {
    const data = muscleRecoveryMap[muscle];
    if (!data) return 100;

    const recoveryRatio = Math.min(hoursSinceLastTrained / data.recoveryHours, 1);
    const volumeStress = Math.min(setsLastSession / data.volumePerWeek.max, 1);

    // Score 0-100: 100 = fully recovered
    return Math.round(recoveryRatio * 100 * (1 - volumeStress * 0.2));
}

export function isOvertrained(
    muscle: string,
    weeklyVolume: number,
    weeklyFrequency: number
): { overtrained: boolean; reason: string } {
    const data = muscleRecoveryMap[muscle];
    if (!data) return { overtrained: false, reason: '' };

    if (weeklyVolume > data.volumePerWeek.max) {
        return { overtrained: true, reason: `Volume too high: ${weeklyVolume} sets/week exceeds max of ${data.volumePerWeek.max}` };
    }
    if (weeklyFrequency > data.frequencyPerWeek.max) {
        return { overtrained: true, reason: `Frequency too high: ${weeklyFrequency}x/week exceeds max of ${data.frequencyPerWeek.max}` };
    }
    return { overtrained: false, reason: '' };
}
