// Curated Exercise Database — derived from 600k fitness dataset patterns
// Covers all major muscle groups, equipment types, and difficulty levels

export interface ExerciseVariation {
    name: string;
    equipment: Equipment;
    difficulty: string; // "easier", "same", "harder"
    why: string; // Why to use this variation
}

export interface Exercise {
    id: string;
    name: string;
    muscleGroup: MuscleGroup;
    secondaryMuscles: MuscleGroup[];
    equipment: Equipment;
    level: 'beginner' | 'intermediate' | 'advanced';
    category: 'compound' | 'isolation' | 'cardio' | 'flexibility';
    defaultSets: number;
    defaultReps: string; // "8-12" or "30s" for timed
    instructions: string;
    tips: string;
    imageUrl?: string; // URL to exercise image/GIF
    alternationNote?: string; // Instructions for alternating between exercises for faster recovery
    variations?: ExerciseVariation[]; // Alternative variations of this exercise
}

export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'quadriceps' | 'core' | 'forearms' | 'full_body';

export type Equipment =
    | 'barbell' | 'dumbbell' | 'cable' | 'machine'
    | 'bodyweight' | 'kettlebell' | 'resistance_band'
    | 'ez_bar' | 'smith_machine' | 'none';

export const exercises: Exercise[] = [
    // === CHEST ===
    { id: "ex001", name: "Barbell Bench Press", muscleGroup: "chest", secondaryMuscles: ["triceps", "shoulders"], equipment: "barbell", level: "intermediate", category: "compound", defaultSets: 4, defaultReps: "6-10", instructions: "Lie flat on bench, grip bar slightly wider than shoulder width, lower to chest, press up.", tips: "Keep feet flat, arch natural, squeeze shoulder blades together.", variations: [
        { name: "Dumbbell Bench Press", equipment: "dumbbell", difficulty: "same", why: "Greater range of motion, isolates each side" },
        { name: "Machine Chest Press", equipment: "machine", difficulty: "easier", why: "No stabilizer muscles needed, safer form" },
        { name: "Smith Machine Bench Press", equipment: "smith_machine", difficulty: "easier", why: "Fixed bar path, good for beginners" },
    ] },
    { id: "ex002", name: "Incline Dumbbell Press", muscleGroup: "chest", secondaryMuscles: ["shoulders", "triceps"], equipment: "dumbbell", level: "intermediate", category: "compound", defaultSets: 3, defaultReps: "8-12", instructions: "Set bench to 30-45 degrees, press dumbbells from chest level upward.", tips: "Don't flare elbows too wide; feel the upper chest stretch.", variations: [
        { name: "Incline Barbell Press", equipment: "barbell", difficulty: "same", why: "Allows heavier weights, more stability" },
        { name: "Low Incline Machine Press", equipment: "machine", difficulty: "easier", why: "Fixed path, easier to learn form" },
        { name: "Dumbbell Floor Press", equipment: "dumbbell", difficulty: "harder", why: "No back support, core engagement" },
    ] },
    { id: "ex003", name: "Dumbbell Flyes", muscleGroup: "chest", secondaryMuscles: [], equipment: "dumbbell", level: "beginner", category: "isolation", defaultSets: 3, defaultReps: "10-15", instructions: "Lie flat, arms extended with slight bend, lower in arc to sides, squeeze back up.", tips: "Keep slight bend in elbows throughout; don't go too deep.", variations: [
        { name: "Cable Crossover", equipment: "cable", difficulty: "easier", why: "Constant tension, safer on joints" },
        { name: "Machine Fly", equipment: "machine", difficulty: "easier", why: "Fixed path, good form learning" },
        { name: "Resistance Band Fly", equipment: "resistance_band", difficulty: "easier", why: "Travel-friendly, joint-friendly" },
    ] },
    { id: "ex004", name: "Cable Crossover", muscleGroup: "chest", secondaryMuscles: [], equipment: "cable", level: "intermediate", category: "isolation", defaultSets: 3, defaultReps: "12-15", instructions: "Stand between cables, bring handles together in front of chest.", tips: "Lean slightly forward; cross hands at bottom for peak contraction.", variations: [
        { name: "Dumbbell Fly", equipment: "dumbbell", difficulty: "harder", why: "Requires more stabilization" },
        { name: "Resistance Band Fly", equipment: "resistance_band", difficulty: "easier", why: "Portable, lighter resistance" },
        { name: "Low to High Cable Fly", equipment: "cable", difficulty: "same", why: "Targets lower/middle chest" },
    ] },
    { id: "ex005", name: "Push-Ups", muscleGroup: "chest", secondaryMuscles: ["triceps", "shoulders", "core"], equipment: "bodyweight", level: "beginner", category: "compound", defaultSets: 3, defaultReps: "12-20", instructions: "Hands shoulder width, lower chest to floor, push back up.", tips: "Keep core tight, body in straight line.", variations: [
        { name: "Incline Push-Ups", equipment: "bodyweight", difficulty: "easier", why: "Less bodyweight, beginner-friendly" },
        { name: "Decline Push-Ups", equipment: "bodyweight", difficulty: "harder", why: "More weight on upper chest" },
        { name: "Wide Grip Push-Ups", equipment: "bodyweight", difficulty: "same", why: "More chest emphasis" },
        { name: "Diamond Push-Ups", equipment: "bodyweight", difficulty: "harder", why: "Heavy tricep focus" },
    ] },
    { id: "ex006", name: "Decline Bench Press", muscleGroup: "chest", secondaryMuscles: ["triceps"], equipment: "barbell", level: "intermediate", category: "compound", defaultSets: 3, defaultReps: "8-12", instructions: "Set bench to decline, perform bench press movement.", tips: "Great for lower chest development.", variations: [
        { name: "Decline Dumbbell Press", equipment: "dumbbell", difficulty: "same", why: "Greater range, ROM emphasis" },
        { name: "Decline Machine Press", equipment: "machine", difficulty: "easier", why: "Safer, fixed form" },
    ] },
    { id: "ex007", name: "Machine Chest Press", muscleGroup: "chest", secondaryMuscles: ["triceps", "shoulders"], equipment: "machine", level: "beginner", category: "compound", defaultSets: 3, defaultReps: "10-12", instructions: "Sit back, press handles forward until arms extended.", tips: "Good for beginners to learn the pressing pattern.", variations: [
        { name: "Barbell Bench Press", equipment: "barbell", difficulty: "harder", why: "Requires stabilization" },
        { name: "Dumbbell Press", equipment: "dumbbell", difficulty: "harder", why: "Unilateral, more control needed" },
    ] },
    { id: "ex008", name: "Pec Deck Machine", muscleGroup: "chest", secondaryMuscles: [], equipment: "machine", level: "beginner", category: "isolation", defaultSets: 3, defaultReps: "12-15", instructions: "Sit with arms on pads, bring arms together in front.", tips: "Squeeze hard at the peak contraction.", variations: [
        { name: "Cable Crossover", equipment: "cable", difficulty: "same", why: "Better ROM, more natural movement" },
        { name: "Dumbbell Fly", equipment: "dumbbell", difficulty: "harder", why: "Requires stabilization" },
    ] },

    // === BACK ===
    { id: "ex010", name: "Barbell Deadlift", muscleGroup: "back", secondaryMuscles: ["core", "forearms"], equipment: "barbell", level: "advanced", category: "compound", defaultSets: 4, defaultReps: "4-6", instructions: "Stand with feet hip-width, hinge at hips, grip bar, drive through heels.", tips: "Keep back straight, engage lats, don't round lower back.", alternationNote: "Alternate: Deadlift → Biceps Curls → Back → Biceps (allows arms to recover while working back)" },
    { id: "ex011", name: "Pull-Ups", muscleGroup: "back", secondaryMuscles: ["biceps", "forearms"], equipment: "bodyweight", level: "intermediate", category: "compound", defaultSets: 4, defaultReps: "6-12", instructions: "Grip bar overhand, pull chin above bar, lower with control.", tips: "Initiate pull with lats, not arms. Full extension at bottom." },
    { id: "ex012", name: "Barbell Row", muscleGroup: "back", secondaryMuscles: ["biceps", "forearms"], equipment: "barbell", level: "intermediate", category: "compound", defaultSets: 4, defaultReps: "6-10", instructions: "Bend at hips ~45 degrees, pull bar to lower chest/upper abs.", tips: "Squeeze shoulder blades together at top.", alternationNote: "Pair with Biceps: After rows, move to biceps exercises for optimal recovery" },
    { id: "ex013", name: "Lat Pulldown", muscleGroup: "back", secondaryMuscles: ["biceps", "forearms"], equipment: "cable", level: "beginner", category: "compound", defaultSets: 3, defaultReps: "10-12", instructions: "Sit at machine, pull bar to upper chest, lean slightly back.", tips: "Focus on pulling elbows down, not hands." },
    { id: "ex014", name: "Seated Cable Row", muscleGroup: "back", secondaryMuscles: ["biceps"], equipment: "cable", level: "beginner", category: "compound", defaultSets: 3, defaultReps: "10-12", instructions: "Sit upright, pull handle to stomach, squeeze back.", tips: "Don't lean too far back; keep torso relatively still." },
    { id: "ex015", name: "Dumbbell Row", muscleGroup: "back", secondaryMuscles: ["biceps", "forearms"], equipment: "dumbbell", level: "beginner", category: "compound", defaultSets: 3, defaultReps: "8-12", instructions: "One hand on bench, row dumbbell to hip with other arm.", tips: "Keep elbow close to body, pull to hip not shoulder." },
    { id: "ex016", name: "T-Bar Row", muscleGroup: "back", secondaryMuscles: ["biceps"], equipment: "barbell", level: "intermediate", category: "compound", defaultSets: 3, defaultReps: "8-12", instructions: "Straddle bar, pull to chest using close grip handle.", tips: "Great for mid-back thickness." },
    { id: "ex017", name: "Face Pulls", muscleGroup: "back", secondaryMuscles: ["shoulders"], equipment: "cable", level: "beginner", category: "isolation", defaultSets: 3, defaultReps: "15-20", instructions: "Pull rope to face level, externally rotating at top.", tips: "Essential for shoulder health and rear delt development." },

    // === SHOULDERS ===
    { id: "ex020", name: "Overhead Press", muscleGroup: "shoulders", secondaryMuscles: ["triceps"], equipment: "barbell", level: "intermediate", category: "compound", defaultSets: 4, defaultReps: "6-10", instructions: "Press bar from shoulders to overhead, lock out arms.", tips: "Brace core, don't lean back excessively." },
    { id: "ex021", name: "Dumbbell Lateral Raise", muscleGroup: "shoulders", secondaryMuscles: [], equipment: "dumbbell", level: "beginner", category: "isolation", defaultSets: 3, defaultReps: "12-15", instructions: "Arms at sides, raise dumbbells to shoulder height.", tips: "Slight lean forward, lead with elbows not hands." },
    { id: "ex022", name: "Seated Dumbbell Press", muscleGroup: "shoulders", secondaryMuscles: ["triceps"], equipment: "dumbbell", level: "intermediate", category: "compound", defaultSets: 3, defaultReps: "8-12", instructions: "Sit with back support, press dumbbells overhead.", tips: "Don't flare elbows, keep controlled movement." },
    { id: "ex023", name: "Rear Delt Flyes", muscleGroup: "shoulders", secondaryMuscles: [], equipment: "dumbbell", level: "beginner", category: "isolation", defaultSets: 3, defaultReps: "12-15", instructions: "Bent over, raise dumbbells to sides targeting rear delts.", tips: "Pinch shoulder blades at top of movement." },
    { id: "ex024", name: "Arnold Press", muscleGroup: "shoulders", secondaryMuscles: ["triceps"], equipment: "dumbbell", level: "intermediate", category: "compound", defaultSets: 3, defaultReps: "8-12", instructions: "Start palms facing you, rotate as you press overhead.", tips: "Smooth rotation throughout the movement." },
    { id: "ex025", name: "Cable Lateral Raise", muscleGroup: "shoulders", secondaryMuscles: [], equipment: "cable", level: "intermediate", category: "isolation", defaultSets: 3, defaultReps: "12-15", instructions: "Stand beside cable, raise arm to shoulder height.", tips: "Constant tension throughout the range of motion." },
    { id: "ex026", name: "Upright Row", muscleGroup: "shoulders", secondaryMuscles: [], equipment: "barbell", level: "intermediate", category: "compound", defaultSets: 3, defaultReps: "10-12", instructions: "Pull bar up along body to chin height.", tips: "Wide grip is safer for shoulders." },

    // === BICEPS ===
    { id: "ex030", name: "Barbell Curl", muscleGroup: "biceps", secondaryMuscles: ["forearms"], equipment: "barbell", level: "beginner", category: "isolation", defaultSets: 3, defaultReps: "8-12", instructions: "Curl bar from thighs to chest, squeeze at top.", tips: "Keep elbows pinned to sides, don't swing.", alternationNote: "Alternate with Back exercises: Back → Biceps → Back → Biceps allows faster muscle recovery" },
    { id: "ex031", name: "Dumbbell Hammer Curl", muscleGroup: "biceps", secondaryMuscles: ["forearms"], equipment: "dumbbell", level: "beginner", category: "isolation", defaultSets: 3, defaultReps: "10-12", instructions: "Curl with neutral grip (palms facing each other).", tips: "Targets brachialis for arm thickness." },
    { id: "ex032", name: "Incline Dumbbell Curl", muscleGroup: "biceps", secondaryMuscles: [], equipment: "dumbbell", level: "intermediate", category: "isolation", defaultSets: 3, defaultReps: "10-12", instructions: "Sit on incline bench, curl dumbbells with full stretch.", tips: "Great stretch on the long head of biceps." },
    { id: "ex033", name: "Preacher Curl", muscleGroup: "biceps", secondaryMuscles: [], equipment: "ez_bar", level: "intermediate", category: "isolation", defaultSets: 3, defaultReps: "10-12", instructions: "Arms on preacher pad, curl weight up.", tips: "Eliminates cheating — pure biceps isolation." },
    { id: "ex034", name: "Cable Curl", muscleGroup: "biceps", secondaryMuscles: [], equipment: "cable", level: "beginner", category: "isolation", defaultSets: 3, defaultReps: "12-15", instructions: "Curl cable handle from low position.", tips: "Constant tension makes this excellent for pump." },
    { id: "ex035", name: "Concentration Curl", muscleGroup: "biceps", secondaryMuscles: [], equipment: "dumbbell", level: "beginner", category: "isolation", defaultSets: 3, defaultReps: "10-12", instructions: "Sit, elbow on inner thigh, curl dumbbell.", tips: "Peak contraction focus." },

    // === TRICEPS ===
    { id: "ex040", name: "Close-Grip Bench Press", muscleGroup: "triceps", secondaryMuscles: ["chest"], equipment: "barbell", level: "intermediate", category: "compound", defaultSets: 3, defaultReps: "8-12", instructions: "Bench press with hands inside shoulder width.", tips: "Keep elbows close to body." },
    { id: "ex041", name: "Tricep Rope Pushdown", muscleGroup: "triceps", secondaryMuscles: [], equipment: "cable", level: "beginner", category: "isolation", defaultSets: 3, defaultReps: "12-15", instructions: "Push rope down, split at bottom, squeeze triceps.", tips: "Keep upper arms stationary." },
    { id: "ex042", name: "Overhead Tricep Extension", muscleGroup: "triceps", secondaryMuscles: [], equipment: "dumbbell", level: "intermediate", category: "isolation", defaultSets: 3, defaultReps: "10-12", instructions: "Hold dumbbell overhead, lower behind head, extend.", tips: "Stretches long head of triceps effectively." },
    { id: "ex043", name: "Skull Crushers", muscleGroup: "triceps", secondaryMuscles: [], equipment: "ez_bar", level: "intermediate", category: "isolation", defaultSets: 3, defaultReps: "10-12", instructions: "Lower bar to forehead, extend arms to lock out.", tips: "Keep elbows pointing at ceiling." },
    { id: "ex044", name: "Diamond Push-Ups", muscleGroup: "triceps", secondaryMuscles: ["chest"], equipment: "bodyweight", level: "intermediate", category: "compound", defaultSets: 3, defaultReps: "10-15", instructions: "Push-ups with hands close together forming diamond shape.", tips: "Great bodyweight tricep builder." },
    { id: "ex045", name: "Tricep Dips", muscleGroup: "triceps", secondaryMuscles: ["chest", "shoulders"], equipment: "bodyweight", level: "intermediate", category: "compound", defaultSets: 3, defaultReps: "8-12", instructions: "Support on parallel bars, lower body, press back up.", tips: "Lean forward slightly for more chest, stay upright for triceps.", alternationNote: "Pair with Chest for a Push day: Chest → Triceps → Chest → Triceps" },

    // === QUADRICEPS ===
    { id: "ex050", name: "Barbell Back Squat", muscleGroup: "quadriceps", secondaryMuscles: ["core"], equipment: "barbell", level: "intermediate", category: "compound", defaultSets: 4, defaultReps: "6-10", instructions: "Bar on upper back, squat to parallel or below, drive up.", tips: "Knees track over toes, chest up, brace core." },
    { id: "ex051", name: "Leg Press", muscleGroup: "quadriceps", secondaryMuscles: [], equipment: "machine", level: "beginner", category: "compound", defaultSets: 4, defaultReps: "10-12", instructions: "Sit in machine, press platform away, lower with control.", tips: "Don't lock out knees fully at top." },
    { id: "ex052", name: "Leg Extension", muscleGroup: "quadriceps", secondaryMuscles: [], equipment: "machine", level: "beginner", category: "isolation", defaultSets: 3, defaultReps: "12-15", instructions: "Sit in machine, extend legs to full lockout.", tips: "Squeeze quads hard at top." },
    { id: "ex053", name: "Bulgarian Split Squat", muscleGroup: "quadriceps", secondaryMuscles: [], equipment: "dumbbell", level: "advanced", category: "compound", defaultSets: 3, defaultReps: "8-12", instructions: "Rear foot elevated on bench, squat on front leg.", tips: "Excellent for unilateral leg development." },
    { id: "ex054", name: "Front Squat", muscleGroup: "quadriceps", secondaryMuscles: ["core"], equipment: "barbell", level: "advanced", category: "compound", defaultSets: 4, defaultReps: "6-10", instructions: "Bar on front delts, squat down keeping torso upright.", tips: "More quad-dominant than back squat." },
    { id: "ex055", name: "Walking Lunges", muscleGroup: "quadriceps", secondaryMuscles: [], equipment: "dumbbell", level: "beginner", category: "compound", defaultSets: 3, defaultReps: "12-16", instructions: "Step forward into lunge, alternate legs walking forward.", tips: "Keep torso upright, knee behind toes." },
    { id: "ex056", name: "Goblet Squat", muscleGroup: "quadriceps", secondaryMuscles: ["core"], equipment: "dumbbell", level: "beginner", category: "compound", defaultSets: 3, defaultReps: "12-15", instructions: "Hold dumbbell at chest, squat down between legs.", tips: "Great for learning squat form." },

    // === CORE ===
    { id: "ex090", name: "Plank", muscleGroup: "core", secondaryMuscles: ["shoulders"], equipment: "bodyweight", level: "beginner", category: "isolation", defaultSets: 3, defaultReps: "30-60s", instructions: "Hold push-up position on forearms, body straight.", tips: "Don't let hips sag or pike up." },
    { id: "ex091", name: "Cable Woodchop", muscleGroup: "core", secondaryMuscles: ["shoulders"], equipment: "cable", level: "intermediate", category: "compound", defaultSets: 3, defaultReps: "12-15", instructions: "Rotate torso pulling cable diagonally across body.", tips: "Rotate through core, not arms." },
    { id: "ex092", name: "Hanging Leg Raise", muscleGroup: "core", secondaryMuscles: ["forearms"], equipment: "bodyweight", level: "advanced", category: "isolation", defaultSets: 3, defaultReps: "10-15", instructions: "Hang from bar, raise legs to horizontal or above.", tips: "Control the movement, no swinging." },
    { id: "ex093", name: "Ab Wheel Rollout", muscleGroup: "core", secondaryMuscles: ["shoulders"], equipment: "none", level: "advanced", category: "compound", defaultSets: 3, defaultReps: "8-12", instructions: "Kneel, roll wheel forward extending body, pull back.", tips: "Keep core braced throughout." },
    { id: "ex094", name: "Russian Twist", muscleGroup: "core", secondaryMuscles: [], equipment: "dumbbell", level: "beginner", category: "isolation", defaultSets: 3, defaultReps: "20-30", instructions: "Sit with feet elevated, rotate torso side to side.", tips: "Keep back straight, don't round shoulders." },
    { id: "ex095", name: "Dead Bug", muscleGroup: "core", secondaryMuscles: [], equipment: "bodyweight", level: "beginner", category: "isolation", defaultSets: 3, defaultReps: "10-12", instructions: "Lie on back, extend opposite arm and leg while bracing core.", tips: "Keep lower back pressed to floor." },
    { id: "ex096", name: "Mountain Climbers", muscleGroup: "core", secondaryMuscles: ["shoulders", "quadriceps"], equipment: "bodyweight", level: "beginner", category: "cardio", defaultSets: 3, defaultReps: "30-45s", instructions: "In plank position, alternate driving knees to chest.", tips: "Keep hips low and core tight." },

    // === FOREARMS ===
    { id: "ex110", name: "Wrist Curl", muscleGroup: "forearms", secondaryMuscles: [], equipment: "barbell", level: "beginner", category: "isolation", defaultSets: 3, defaultReps: "15-20", instructions: "Forearms on bench, curl wrist up.", tips: "Use light weight, high reps." },
    { id: "ex111", name: "Reverse Curl", muscleGroup: "forearms", secondaryMuscles: ["biceps"], equipment: "barbell", level: "intermediate", category: "isolation", defaultSets: 3, defaultReps: "12-15", instructions: "Curl bar with overhand grip.", tips: "Also targets brachioradialis." },

    // === FULL BODY / COMPOUND ===
    { id: "ex120", name: "Clean and Press", muscleGroup: "full_body", secondaryMuscles: ["shoulders", "back", "quadriceps"], equipment: "barbell", level: "advanced", category: "compound", defaultSets: 4, defaultReps: "4-6", instructions: "Clean bar to shoulders, press overhead.", tips: "Explosive movement — focus on form first." },
    { id: "ex121", name: "Kettlebell Swing", muscleGroup: "full_body", secondaryMuscles: ["core", "shoulders"], equipment: "kettlebell", level: "intermediate", category: "compound", defaultSets: 3, defaultReps: "15-20", instructions: "Hinge and swing kettlebell to shoulder height.", tips: "Power comes from hip hinge, not arms." },
    { id: "ex122", name: "Burpees", muscleGroup: "full_body", secondaryMuscles: ["chest", "quadriceps", "core"], equipment: "bodyweight", level: "intermediate", category: "cardio", defaultSets: 3, defaultReps: "10-15", instructions: "Drop to push-up, jump up explosively.", tips: "Great conditioning exercise." },
    { id: "ex123", name: "Thrusters", muscleGroup: "full_body", secondaryMuscles: ["quadriceps", "shoulders", "core"], equipment: "dumbbell", level: "advanced", category: "compound", defaultSets: 3, defaultReps: "10-12", instructions: "Front squat into overhead press in one fluid motion.", tips: "Use momentum from squat to drive the press." },
    { id: "ex124", name: "Turkish Get-Up", muscleGroup: "full_body", secondaryMuscles: ["shoulders", "core"], equipment: "kettlebell", level: "advanced", category: "compound", defaultSets: 3, defaultReps: "3-5", instructions: "From lying position, stand up while holding weight overhead.", tips: "Learn each phase separately before combining." },
];

// Helper functions
export function getExercisesByMuscle(muscle: MuscleGroup): Exercise[] {
    return exercises.filter(e => e.muscleGroup === muscle || e.secondaryMuscles.includes(muscle));
}

export function getExercisesByLevel(level: Exercise['level']): Exercise[] {
    return exercises.filter(e => e.level === level);
}

export function getExercisesByEquipment(equipment: Equipment): Exercise[] {
    return exercises.filter(e => e.equipment === equipment);
}

export function getCompoundExercises(): Exercise[] {
    return exercises.filter(e => e.category === 'compound');
}

export function getRandomExercises(muscle: MuscleGroup, count: number, level?: Exercise['level']): Exercise[] {
    let pool = exercises.filter(e => e.muscleGroup === muscle);
    if (level) pool = pool.filter(e => e.level === level || e.level === 'beginner');
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}
