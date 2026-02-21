import pandas as pd
import json
import os

OUTPUT_PATH = r'C:\Users\jaswa\OneDrive\Desktop\Projects\Gym\src\data\combinedFoods.ts'

# Load existing foods from TS file
ts_file = r'C:\Users\jaswa\OneDrive\Desktop\Projects\Gym\src\data\openNutritionFoods.ts'
with open(ts_file, 'r', encoding='utf-8') as f:
    content = f.read()
# Find the array
start = content.find('[')
end = content.find('];', start) + 1
json_str = content[start:end]
foods = json.loads(json_str)

# Function to add foods
def add_foods_from_csv(csv_path, mapping, category_map=None, type_map=None, serving_size='100g', source='Dataset'):
    try:
        df = pd.read_csv(csv_path)
        print(f'Loading {len(df)} foods from {csv_path}')
        for _, row in df.iterrows():
            food = {
                'id': f"f{len(foods)+1000:04d}",
                'name': row[mapping['name']],
                'nameLocal': row[mapping['name']],
                'category': category_map.get(row.get(mapping.get('category', ''), 'lunch'), 'lunch') if category_map else 'lunch',
                'type': type_map.get(row.get(mapping.get('type', ''), 'vegetarian'), 'vegetarian') if type_map else 'vegetarian',
                'calories': float(row.get(mapping.get('calories', 0), 0)),
                'protein': float(row.get(mapping.get('protein', 0), 0)),
                'carbs': float(row.get(mapping.get('carbs', 0), 0)),
                'fats': float(row.get(mapping.get('fats', 0), 0)),
                'fiber': float(row.get(mapping.get('fiber', 0), 0)),
                'servingSize': serving_size,
                'micronutrients': [],
                'availableAt': source,
                'prepTime': 0,
                'isStreetFood': False,
                'healthRating': 3
            }
            foods.append(food)
    except Exception as e:
        print(f'Error loading {csv_path}: {e}')

# Category mapping
category_keywords = {
    'breakfast': ['breakfast'],
    'lunch': ['lunch', 'main course'],
    'dinner': ['dinner'],
    'snack': ['snack', 'beverage', 'dessert'],
    'pre_workout': ['pre_workout'],
    'post_workout': ['post_workout']
}

def infer_category(name):
    n = name.lower()
    for cat, keywords in category_keywords.items():
        if any(kw in n for kw in keywords):
            return cat
    return 'lunch'

# Type mapping
type_map = {
    'Veg': 'vegetarian',
    'Non-Veg': 'non_vegetarian',
    'vegetarian': 'vegetarian',
    'non_vegetarian': 'non_vegetarian',
    'vegan': 'vegan',
    'eggetarian': 'eggetarian'
}

# Load archive (2) - Indian food
add_foods_from_csv(
    r'C:\Users\jaswa\OneDrive\Desktop\Projects\Gym\Food Datasets\archive (2)\indian_food_nutrition_calories - Sheet1.csv',
    {
        'name': 'Food_Item',
        'category': 'Category',
        'type': 'Category',
        'calories': 'Calories_per_100g',
        'protein': 'Protein_g',
        'carbs': 'Carbs_g',
        'fats': 'Fat_g',
        'fiber': 'Fiber_g'
    },
    category_map={'Lentils': 'lunch', 'Non-Veg': 'lunch', 'Veg': 'lunch'},
    type_map=type_map,
    serving_size='100g',
    source='Indian Food Dataset'
)

# Load archive (3) - Recipes
add_foods_from_csv(
    r'C:\Users\jaswa\OneDrive\Desktop\Projects\Gym\Food Datasets\archive (3)\recipes_master.csv',
    {
        'name': 'recipe_name',
        'category': 'meal_type',
        'type': 'is_vegetarian',
        'calories': 'calories_per_serving',
        'protein': 'protein_g',  # Assuming it has, but check
        'carbs': 'carbs_g',
        'fats': 'fats_g',
        'fiber': 'fiber_g'
    },
    category_map={'Lunch': 'lunch', 'Dinner': 'dinner', 'Beverage': 'snack', 'Dessert': 'snack'},
    type_map={'True': 'vegetarian', 'False': 'non_vegetarian'},
    serving_size='1 serving',
    source='Recipes Dataset'
)

# For recipes, need to check if nutrition columns exist
# Assuming recipe_nutrition.csv has the details

# Load archive (4) - PVFM
add_foods_from_csv(
    r'C:\Users\jaswa\OneDrive\Desktop\Projects\Gym\Food Datasets\archive (4)\pvfm_macros.csv',
    {
        'name': 'Food Item',
        'category': 'Food Class',
        'calories': 'Calories',  # Assuming
        'protein': 'Protein (g)',
        'carbs': 'Carbohydrates (g)',
        'fats': 'Fats (g)'
    },
    category_map={'Breakfast': 'breakfast', 'Snacks': 'snack', 'Nuts': 'snack'},
    serving_size='per serving',
    source='PVFM Dataset'
)

# Load archive (5) - Ayurvedic
add_foods_from_csv(
    r'C:\Users\jaswa\OneDrive\Desktop\Projects\Gym\Food Datasets\archive (5)\ayurvedic_food_dishes_dataset_large.csv',
    {
        'name': 'Food_Item',
        'calories': 'Calories',
        'protein': 'Protein_g',
        'carbs': 'Carbs_g',
        'fats': 'Fat_g'
    },
    serving_size='100g',
    source='Ayurvedic Dataset'
)

# Generate TypeScript
ts_content = f"""// Combined from multiple datasets
// {len(foods)} foods

export interface FoodItem {{
    id: string;
    name: string;
    nameLocal: string;
    category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout';
    type: 'vegetarian' | 'non_vegetarian' | 'vegan' | 'eggetarian';
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    servingSize: string;
    micronutrients: string[];
    availableAt: string;
    prepTime: number;
    isStreetFood: boolean;
    healthRating: 1 | 2 | 3 | 4 | 5;
}}

export const combinedFoods: FoodItem[] = {json.dumps(foods, indent=2, ensure_ascii=False)};
"""

with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
    f.write(ts_content)

print(f'Generated {len(foods)} foods in {OUTPUT_PATH}')