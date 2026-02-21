// Hyperlocal Food Database
// Accurate macro breakdowns for Indian (Andhra cuisine) foods

export interface FoodItem {
    id: string;
    name: string;
    nameLocal: string; // Telugu/local name
    category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout';
    type: 'vegetarian' | 'non_vegetarian' | 'vegan' | 'eggetarian';
    calories: number; // per serving
    protein: number; // grams
    carbs: number;
    fats: number;
    fiber: number;
    servingSize: string;
    micronutrients: string[];
    availableAt: string; // where to find in Vizag
    prepTime: number; // minutes
    isStreetFood: boolean;
    healthRating: 1 | 2 | 3 | 4 | 5; // 5 = healthiest
}

export const vizagFoods: FoodItem[] = [
    // === BREAKFAST ===
    { id: "f001", name: "Pesarattu", nameLocal: "పెసరట్టు", category: "breakfast", type: "vegan", calories: 180, protein: 12, carbs: 28, fats: 3, fiber: 4, servingSize: "2 dosas", micronutrients: ["Iron", "Folate", "Magnesium"], availableAt: "Home / Tiffin centers across Vizag", prepTime: 15, isStreetFood: false, healthRating: 5 },
    { id: "f002", name: "Idli with Sambar", nameLocal: "ఇడ్లీ సాంబార్", category: "breakfast", type: "vegan", calories: 220, protein: 8, carbs: 40, fats: 3, fiber: 3, servingSize: "4 idlis + sambar", micronutrients: ["B vitamins", "Iron", "Potassium"], availableAt: "Any tiffin center / Ram Ki Bandi / MVR", prepTime: 5, isStreetFood: false, healthRating: 5 },
    { id: "f003", name: "Upma", nameLocal: "ఉప్మా", category: "breakfast", type: "vegan", calories: 200, protein: 5, carbs: 32, fats: 6, fiber: 2, servingSize: "1 bowl (200g)", micronutrients: ["B vitamins", "Iron"], availableAt: "Home / Tiffin centers", prepTime: 10, isStreetFood: false, healthRating: 4 },
    { id: "f004", name: "Pongal", nameLocal: "పొంగల్", category: "breakfast", type: "vegetarian", calories: 250, protein: 7, carbs: 38, fats: 8, fiber: 2, servingSize: "1 bowl (200g)", micronutrients: ["B vitamins", "Zinc"], availableAt: "Sri Sai Ram Mess / Tiffin centers", prepTime: 20, isStreetFood: false, healthRating: 4 },
    { id: "f005", name: "Egg Dosa", nameLocal: "ఎగ్ దోస", category: "breakfast", type: "eggetarian", calories: 280, protein: 14, carbs: 30, fats: 12, fiber: 1, servingSize: "1 dosa", micronutrients: ["Protein", "B12", "Selenium"], availableAt: "Street dosa stalls / RK Beach area", prepTime: 10, isStreetFood: true, healthRating: 3 },
    { id: "f006", name: "Poha with Peanuts", nameLocal: "పోహా", category: "breakfast", type: "vegan", calories: 200, protein: 6, carbs: 34, fats: 6, fiber: 2, servingSize: "1 plate", micronutrients: ["Iron", "B vitamins"], availableAt: "Home / Tiffin centers", prepTime: 10, isStreetFood: false, healthRating: 4 },
    { id: "f007", name: "Ragi Malt", nameLocal: "రాగి మాల్ట్", category: "breakfast", type: "vegan", calories: 160, protein: 4, carbs: 32, fats: 2, fiber: 4, servingSize: "1 glass (250ml)", micronutrients: ["Calcium", "Iron", "Fiber"], availableAt: "Home preparation", prepTime: 10, isStreetFood: false, healthRating: 5 },
    { id: "f008", name: "Boiled Eggs", nameLocal: "ఉడకబెట్టిన గుడ్లు", category: "breakfast", type: "eggetarian", calories: 156, protein: 13, carbs: 1, fats: 11, fiber: 0, servingSize: "2 eggs", micronutrients: ["B12", "Selenium", "Vitamin D", "Choline"], availableAt: "Home / Street vendors", prepTime: 10, isStreetFood: false, healthRating: 5 },

    // === LUNCH ===
    { id: "f010", name: "Andhra Chicken Curry with Rice", nameLocal: "చికెన్ కర్రీ అన్నం", category: "lunch", type: "non_vegetarian", calories: 550, protein: 35, carbs: 55, fats: 18, fiber: 3, servingSize: "1 plate (rice + curry)", micronutrients: ["Protein", "Iron", "B12", "Zinc"], availableAt: "Subbayya Gari Hotel / Andhra Mess", prepTime: 0, isStreetFood: false, healthRating: 3 },
    { id: "f011", name: "Fish Curry with Rice (Chepala Pulusu)", nameLocal: "చేపల పులుసు అన్నం", category: "lunch", type: "non_vegetarian", calories: 480, protein: 32, carbs: 50, fats: 14, fiber: 2, servingSize: "1 plate", micronutrients: ["Omega-3", "Protein", "Vitamin D", "Iodine"], availableAt: "Beach area restaurants / Home", prepTime: 0, isStreetFood: false, healthRating: 4 },
    { id: "f012", name: "Pappu Annam (Dal Rice)", nameLocal: "పప్పు అన్నం", category: "lunch", type: "vegan", calories: 380, protein: 14, carbs: 60, fats: 8, fiber: 6, servingSize: "1 plate", micronutrients: ["Protein", "Iron", "Folate", "Fiber"], availableAt: "Home / Any meal service", prepTime: 15, isStreetFood: false, healthRating: 5 },
    { id: "f013", name: "Sambar Rice", nameLocal: "సాంబార్ అన్నం", category: "lunch", type: "vegan", calories: 350, protein: 10, carbs: 58, fats: 6, fiber: 5, servingSize: "1 plate", micronutrients: ["B vitamins", "Iron", "Fiber"], availableAt: "Home / Tiffin centers", prepTime: 20, isStreetFood: false, healthRating: 5 },
    { id: "f014", name: "Egg Biryani", nameLocal: "ఎగ్ బిర్యానీ", category: "lunch", type: "eggetarian", calories: 500, protein: 18, carbs: 62, fats: 18, fiber: 2, servingSize: "1 plate", micronutrients: ["Protein", "B12", "Iron"], availableAt: "Biryani Zone / Shah Ghouse type", prepTime: 0, isStreetFood: false, healthRating: 3 },
    { id: "f015", name: "Chicken Biryani", nameLocal: "చికెన్ బిర్యానీ", category: "lunch", type: "non_vegetarian", calories: 600, protein: 30, carbs: 65, fats: 22, fiber: 2, servingSize: "1 plate", micronutrients: ["Protein", "B12", "Iron", "Zinc"], availableAt: "Multiple biryani outlets in Vizag", prepTime: 0, isStreetFood: false, healthRating: 3 },
    { id: "f016", name: "Vegetable Thali", nameLocal: "వెజ్ థాలీ", category: "lunch", type: "vegetarian", calories: 550, protein: 15, carbs: 75, fats: 16, fiber: 8, servingSize: "Full thali", micronutrients: ["Multiple vitamins", "Minerals", "Fiber"], availableAt: "Andhra mess / Home", prepTime: 0, isStreetFood: false, healthRating: 4 },
    { id: "f017", name: "Curd Rice (Daddojanam)", nameLocal: "దద్దోజనం", category: "lunch", type: "vegetarian", calories: 280, protein: 8, carbs: 42, fats: 8, fiber: 1, servingSize: "1 bowl", micronutrients: ["Calcium", "Probiotics", "B12"], availableAt: "Home / Any mess", prepTime: 5, isStreetFood: false, healthRating: 4 },

    // === DINNER ===
    { id: "f020", name: "Chapati with Dal", nameLocal: "చపాతి పప్పు", category: "dinner", type: "vegan", calories: 350, protein: 14, carbs: 50, fats: 8, fiber: 6, servingSize: "3 chapati + dal", micronutrients: ["Protein", "Iron", "Fiber", "B vitamins"], availableAt: "Home / Roti centers", prepTime: 20, isStreetFood: false, healthRating: 5 },
    { id: "f021", name: "Egg Curry with Roti", nameLocal: "గుడ్డు కూర రోటీ", category: "dinner", type: "eggetarian", calories: 420, protein: 20, carbs: 45, fats: 16, fiber: 3, servingSize: "2 roti + egg curry", micronutrients: ["Protein", "B12", "Iron"], availableAt: "Home / Roti centers", prepTime: 15, isStreetFood: false, healthRating: 4 },
    { id: "f022", name: "Grilled Fish", nameLocal: "కాలిన చేప", category: "dinner", type: "non_vegetarian", calories: 250, protein: 38, carbs: 5, fats: 8, fiber: 0, servingSize: "200g fish", micronutrients: ["Omega-3", "Protein", "Vitamin D", "Selenium"], availableAt: "Beach restaurants / Home", prepTime: 20, isStreetFood: false, healthRating: 5 },
    { id: "f023", name: "Palak Paneer with Roti", nameLocal: "పాలకూర పన్నీర్ రోటీ", category: "dinner", type: "vegetarian", calories: 450, protein: 18, carbs: 42, fats: 20, fiber: 4, servingSize: "2 roti + curry", micronutrients: ["Calcium", "Iron", "Vitamin A", "Protein"], availableAt: "Home / North Indian restaurants", prepTime: 25, isStreetFood: false, healthRating: 4 },
    { id: "f024", name: "Chicken Stir Fry", nameLocal: "చికెన్ ఫ్రై", category: "dinner", type: "non_vegetarian", calories: 320, protein: 35, carbs: 8, fats: 16, fiber: 2, servingSize: "200g", micronutrients: ["Protein", "B6", "Niacin", "Phosphorus"], availableAt: "Home / Andhra restaurants", prepTime: 20, isStreetFood: false, healthRating: 4 },
    { id: "f025", name: "Mixed Vegetable Curry with Rice", nameLocal: "కూరగాయల కూర అన్నం", category: "dinner", type: "vegan", calories: 380, protein: 10, carbs: 58, fats: 10, fiber: 6, servingSize: "1 plate", micronutrients: ["Vitamins A/C", "Fiber", "Potassium"], availableAt: "Home", prepTime: 20, isStreetFood: false, healthRating: 5 },

    // === SNACKS ===
    { id: "f030", name: "Sprouts Chat", nameLocal: "మొలకల చాట్", category: "snack", type: "vegan", calories: 150, protein: 10, carbs: 22, fats: 2, fiber: 5, servingSize: "1 bowl", micronutrients: ["Protein", "Iron", "Folate", "Fiber"], availableAt: "Beach area / Home", prepTime: 5, isStreetFood: true, healthRating: 5 },
    { id: "f031", name: "Roasted Peanuts", nameLocal: "వేరుశెనగ", category: "snack", type: "vegan", calories: 200, protein: 8, carbs: 8, fats: 16, fiber: 3, servingSize: "50g", micronutrients: ["Protein", "Vitamin E", "Magnesium", "Niacin"], availableAt: "RK Beach / Street vendors", prepTime: 0, isStreetFood: true, healthRating: 4 },
    { id: "f032", name: "Banana (Arati Pandu)", nameLocal: "అరటి పండు", category: "snack", type: "vegan", calories: 105, protein: 1, carbs: 27, fats: 0, fiber: 3, servingSize: "1 medium banana", micronutrients: ["Potassium", "B6", "Vitamin C", "Manganese"], availableAt: "Any fruit vendor", prepTime: 0, isStreetFood: false, healthRating: 5 },
    { id: "f033", name: "Dry Fruit Mixture", nameLocal: "డ్రై ఫ్రూట్ మిక్స్", category: "snack", type: "vegan", calories: 180, protein: 5, carbs: 12, fats: 14, fiber: 2, servingSize: "30g", micronutrients: ["Vitamin E", "Iron", "Zinc", "Omega-3"], availableAt: "Dry fruit shops / Online", prepTime: 0, isStreetFood: false, healthRating: 5 },
    { id: "f034", name: "Punugulu", nameLocal: "పునుగులు", category: "snack", type: "vegan", calories: 280, protein: 5, carbs: 35, fats: 14, fiber: 1, servingSize: "6 pieces", micronutrients: ["Carbs", "B vitamins"], availableAt: "Street stalls / Tiffin centers", prepTime: 15, isStreetFood: true, healthRating: 2 },
    { id: "f035", name: "Muri Mixture (Puffed Rice Mix)", nameLocal: "ముర్మురాలు", category: "snack", type: "vegan", calories: 160, protein: 3, carbs: 28, fats: 5, fiber: 2, servingSize: "1 bowl", micronutrients: ["Iron", "B vitamins"], availableAt: "Beach area vendors", prepTime: 0, isStreetFood: true, healthRating: 3 },
    { id: "f036", name: "Greek Yogurt (Perugu)", nameLocal: "పెరుగు", category: "snack", type: "vegetarian", calories: 120, protein: 12, carbs: 8, fats: 4, fiber: 0, servingSize: "150g", micronutrients: ["Calcium", "Probiotics", "Protein", "B12"], availableAt: "Supermarkets / Home", prepTime: 0, isStreetFood: false, healthRating: 5 },

    // === PRE-WORKOUT ===
    { id: "f040", name: "Banana + Peanut Butter Toast", nameLocal: "బనానా పీనట్ బటర్ టోస్ట్", category: "pre_workout", type: "vegan", calories: 280, protein: 8, carbs: 38, fats: 12, fiber: 4, servingSize: "1 toast + 1 banana", micronutrients: ["Potassium", "B6", "Protein", "Magnesium"], availableAt: "Home preparation", prepTime: 5, isStreetFood: false, healthRating: 5 },
    { id: "f041", name: "Oats with Honey", nameLocal: "ఓట్స్ తేనె", category: "pre_workout", type: "vegetarian", calories: 220, protein: 6, carbs: 40, fats: 4, fiber: 4, servingSize: "1 bowl (50g oats)", micronutrients: ["Fiber", "Iron", "Manganese", "B vitamins"], availableAt: "Home preparation", prepTime: 5, isStreetFood: false, healthRating: 5 },
    { id: "f042", name: "Black Coffee", nameLocal: "బ్లాక్ కాఫీ", category: "pre_workout", type: "vegan", calories: 5, protein: 0, carbs: 1, fats: 0, fiber: 0, servingSize: "1 cup", micronutrients: ["Caffeine", "Antioxidants"], availableAt: "Home / Cafes", prepTime: 3, isStreetFood: false, healthRating: 4 },

    // === POST-WORKOUT ===
    { id: "f050", name: "Whey Protein Shake", nameLocal: "ప్రోటీన్ షేక్", category: "post_workout", type: "vegetarian", calories: 130, protein: 25, carbs: 3, fats: 2, fiber: 0, servingSize: "1 scoop (30g) + water", micronutrients: ["Protein", "BCAAs", "Calcium"], availableAt: "Online / Supplement stores", prepTime: 2, isStreetFood: false, healthRating: 5 },
    { id: "f051", name: "Egg White Omelette", nameLocal: "ఎగ్ వైట్ ఆమ్లెట్", category: "post_workout", type: "eggetarian", calories: 120, protein: 18, carbs: 2, fats: 4, fiber: 0, servingSize: "4 egg whites", micronutrients: ["Protein", "Selenium", "B2"], availableAt: "Home", prepTime: 5, isStreetFood: false, healthRating: 5 },
    { id: "f052", name: "Paneer Bhurji", nameLocal: "పన్నీర్ భుర్జీ", category: "post_workout", type: "vegetarian", calories: 250, protein: 18, carbs: 6, fats: 18, fiber: 1, servingSize: "150g", micronutrients: ["Protein", "Calcium", "B12", "Phosphorus"], availableAt: "Home / Restaurants", prepTime: 10, isStreetFood: false, healthRating: 4 },
    { id: "f053", name: "Chicken Breast (Grilled)", nameLocal: "గ్రిల్డ్ చికెన్ బ్రెస్ట్", category: "post_workout", type: "non_vegetarian", calories: 165, protein: 31, carbs: 0, fats: 4, fiber: 0, servingSize: "150g", micronutrients: ["Protein", "B6", "Niacin", "Phosphorus"], availableAt: "Home / Grill restaurants", prepTime: 15, isStreetFood: false, healthRating: 5 },
];

// Helper functions
export function getFoodsByCategory(category: FoodItem['category']): FoodItem[] {
    return vizagFoods.filter(f => f.category === category);
}

export function getFoodsByType(type: FoodItem['type']): FoodItem[] {
    return vizagFoods.filter(f => f.type === type);
}

export function getHighProteinFoods(minProtein: number = 15): FoodItem[] {
    return vizagFoods.filter(f => f.protein >= minProtein).sort((a, b) => b.protein - a.protein);
}

export function getHealthyFoods(minRating: number = 4): FoodItem[] {
    return vizagFoods.filter(f => f.healthRating >= minRating);
}

export function getMealPlanFoods(type: FoodItem['type'] | 'any', category: FoodItem['category']): FoodItem[] {
    return vizagFoods.filter(f => {
        const categoryMatch = f.category === category;
        const typeMatch = type === 'any' || f.type === type || (type === 'vegetarian' && (f.type === 'vegetarian' || f.type === 'vegan'));
        return categoryMatch && typeMatch;
    });
}
