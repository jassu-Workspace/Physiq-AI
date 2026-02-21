import pandas as pd
import json
import os

TSV_PATH = r'C:\Users\jaswa\.cache\kagglehub\datasets\justsahil\opennutrition-foods-database\versions\2\opennutrition_foods.tsv'
OUTPUT_PATH = r'C:\Users\jaswa\OneDrive\Desktop\Projects\Gym\src\data\openNutritionFoods.ts'

print('Loading TSV...')
df = pd.read_csv(TSV_PATH, sep=chr(9), low_memory=False)
print(f'Total rows: {len(df)}')

df = df[df['type'] == 'everyday'].copy()
print(f'Everyday rows: {len(df)}')

category_keywords = {
    'breakfast': ['oat','cereal','granola','pancake','waffle','muffin','bagel','toast','porridge','overnight oat','breakfast','morning','grits','cream of wheat'],
    'pre_workout': ['energy bar','protein bar','pre-workout','energy gel','sports drink','banana','rice cake'],
    'post_workout': ['protein shake','whey','casein','recovery shake','post workout','protein powder'],
    'snack': ['chip','cracker','cookie','candy','chocolate','popcorn','bar','nut','nut butter','almond','cashew','peanut','walnut','seed','trail mix','dried fruit','jerky','pretzel','rice cake','fruit','apple','orange','grape','berry','strawberry','blueberry','yogurt','string cheese'],
    'lunch': ['sandwich','wrap','burger','salad','soup','hot dog','sub','club','sushi','bowl','taco','burrito','quesadilla','falafel','shawarma'],
    'dinner': ['steak','roast','baked','grilled','fried chicken','pasta','pizza','stew','casserole','lasagna','curry','rice','noodle','ramen','pho','chili','pot pie','meatball','meatloaf'],
}

def infer_category(name):
    n = name.lower()
    for cat, keywords in category_keywords.items():
        for kw in keywords:
            if kw in n:
                return cat
    return 'lunch'

meat_keywords = ['chicken','beef','pork','lamb','turkey','fish','salmon','tuna','shrimp','crab','lobster','clam','oyster','mussel','anchovy','sardine','tilapia','cod','halibut','trout','bacon','ham','sausage','hot dog','pepperoni','prosciutto','salami','deli meat','venison','bison','duck','seafood','meat']
veg_keywords = ['milk','cheese','yogurt','butter','cream','dairy','ghee','paneer','whey','casein']

def infer_diet_type(name):
    n = name.lower()
    if any(kw in n for kw in meat_keywords):
        return 'non_vegetarian'
    if 'egg' in n:
        return 'eggetarian'
    if any(kw in n for kw in veg_keywords):
        return 'vegetarian'
    return 'vegan'

# Process the data
print('Processing data...')
df['category'] = df['name'].apply(infer_category)
df['type'] = df['name'].apply(infer_diet_type)

# Parse nutrition
import ast
df['nutrition'] = df['nutrition_100g'].apply(ast.literal_eval)

# Extract nutrition fields
df['calories'] = df['nutrition'].apply(lambda x: x.get('calories', 0))
df['protein'] = df['nutrition'].apply(lambda x: x.get('protein', 0))
df['carbs'] = df['nutrition'].apply(lambda x: x.get('carbohydrates', 0))
df['fats'] = df['nutrition'].apply(lambda x: x.get('total_fat', 0))
df['fiber'] = df['nutrition'].apply(lambda x: x.get('dietary_fiber', 0))

# Clean names
df['name'] = df['name'].str.replace('"', '').str.replace('\n', ' ').str.replace('\r', ' ')

# Select and rename columns
df = df[['name', 'category', 'type', 'calories', 'protein', 'carbs', 'fats', 'fiber']].copy()

# Fill missing values
df = df.fillna(0)

# Convert to list of dicts
foods = df.to_dict('records')

# Add id and other fields
for i, food in enumerate(foods):
    food['id'] = f"f{i+1000:04d}"
    food['nameLocal'] = food['name']  # Assuming no local names
    food['servingSize'] = '100g'  # Assuming standard serving
    food['micronutrients'] = []  # Empty for now
    food['availableAt'] = 'Various'  # Placeholder
    food['prepTime'] = 0  # Placeholder
    food['isStreetFood'] = False  # Placeholder
    food['healthRating'] = 3  # Default

# Generate TypeScript
ts_content = f"""// Auto-generated from Open Nutrition Database
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

export const openNutritionFoods: FoodItem[] = {json.dumps(foods, indent=2, ensure_ascii=False)};
"""

with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
    f.write(ts_content)

print(f'Generated {len(foods)} foods in {OUTPUT_PATH}')
