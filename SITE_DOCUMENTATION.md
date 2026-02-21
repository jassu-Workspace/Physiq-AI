# Gym Nutrition & Fitness Tracking Application
## Complete Layout, UI/UX Documentation

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Layout Structure](#layout-structure)
4. [Components & Sections](#components--sections)
5. [Design System](#design-system)
6. [Features Overview](#features-overview)
7. [Daily Check-in Logic](#daily-check-in-logic)
8. [Data Flow](#data-flow)
9. [Responsive Design](#responsive-design)
10. [Animation & Interactions](#animation--interactions)
11. [Nutrition Engine](#nutrition-engine)
12. [Dataset Integration](#dataset-integration)

---

## 🎯 Project Overview

**Name:** Gym Nutrition & Fitness Tracking Platform

**Purpose:** A comprehensive health and fitness management application that combines:
- Personalized nutrition planning
- Meal tracking and logging
- Daily macro monitoring
- Carb cycling recommendations
- Exercise library and tracking
- Progress analytics
- Supplement recommendations

**Tech Stack:**
- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Animations:** Motion/React
- **Icons:** Lucide React
- **State Management:** React Hooks + Context API
- **Build:** Vite + ESBuild

---

## 🏗️ Architecture

### Page Structure

The application follows a modular page-based architecture:

```
src/
├── pages/
│   ├── Auth.tsx                    # Login/Signup
│   ├── Onboarding.tsx              # User Profile Setup
│   ├── Dashboard.tsx               # Main Dashboard
│   ├── NutritionDashboard.tsx      # Nutrition Tracking (Primary Focus)
│   ├── ExerciseLibrary.tsx         # Exercise Catalog
│   ├── WorkoutPlan.tsx             # Workout Planning
│   ├── Progress.tsx                # Analytics & Progress
│   ├── AnalyticsDashboard.tsx      # Detailed Analytics
│   ├── MonthlyReview.tsx           # Monthly Summary
│   └── CoachChat.tsx               # AI Coach
├── components/                     # Reusable UI Components
├── services/
│   ├── store.ts                    # State Management
│   ├── nutritionEngine.ts          # Nutrition Calculations
│   └── Other services...
├── data/
│   ├── combinedFoods.ts             # 12,228+ Combined Food Database
│   ├── openNutritionFoods.ts        # 5,299 Open Nutrition Foods
│   ├── foods.ts                     # Local Hyperlocal Foods
│   ├── exercises.ts                 # Exercise Library
│   └── muscleRecovery.ts            # Recovery Data
└── App.tsx                         # Main App Router
```

---

## 📐 Layout Structure

### Global Layout
The application uses a **maximum width container** with responsive padding:

```tsx
<div className="max-w-5xl mx-auto flex flex-col gap-6 p-4 lg:p-8">
```

- **Max Width:** 64rem (1280px)
- **Centered:** Auto margins for horizontal centering
- **Padding:** 16px mobile / 32px desktop
- **Gap:** 24px between major sections

### Grid System

**Responsive Breakpoints:**
- Mobile: Default (0px - 640px)
- Tablet: md (768px - 1024px)
- Desktop: lg (1024px+)

**Grid Columns Used:**
- 1 column: Mobile
- 2 columns (grid-cols-2): Mid breakpoint
- 4 columns (grid-cols-4): Desktop

---

## 🎨 Components & Sections

### 1. **Header Section**
**Location:** Top of every page  
**Components:**
- Application logo/title
- User profile dropdown
- Navigation tabs
- Settings button

**Design:**
```
┌─────────────────────────────────────┐
│  Logo    Nav Tabs         Profile    │
└─────────────────────────────────────┘
```

---

### 2. **Nutrition Dashboard - Main Sections**

#### A. **Page Header**
```
┌─────────────────────────────────────┐
│ 🥘 Nutrition Plan                   │
│ 📍 Food recommendations             │
│        🟢 high carb day              │
└─────────────────────────────────────┘
```
- **Title:** "Nutrition Plan"
- **Subtitle:** Location-based + carb cycle status
- **Status Badge:** Color-coded (green=high, yellow=moderate, red=low)

---

#### B. **Food Logger / What Did You Eat? Section**
**Position:** Second major section  
**Background:** Gradient `from-[#6C63FF]/10 to-purple-500/10`  
**Border:** `border-[#6C63FF]/20`

**Subsections:**
1. **Food Search Input**
   ```
   ┌────────────────────────────────┐
   │ 🔍 Type food name...           │
   │ (Search enabled, autocomplete)  │
   └────────────────────────────────┘
   ```
   - Autocomplete from 12,228 foods
   - Shows: Name, Calories, Macros
   - Real-time filtering

2. **Category Browser**
   ```
   ┌──────────────────────────────────┐
   │ ▼ Browse all food sources        │
   │                                  │
   │ Breakfast │Lunch │Dinner │...   │
   │                                  │
   │ [Food List with details]         │
   └──────────────────────────────────┘
   ```
   - 6 categories: Breakfast, Lunch, Dinner, Snack, Pre-Workout, Post-Workout
   - Color-coded tabs
   - Scrollable food list (max-h-72)

3. **Servings Control**
   ```
   ┌─────────────┐  ┌────────────┐
   │ Servings    │  │ Add Food   │
   │ [1]         │  │ [Button]   │
   └─────────────┘  └────────────┘
   ```

4. **Consumed Totals Summary**
   ```
   ┌────────┬────────┬────────┬────────┐
   │ Cals   │ Protein│ Carbs  │ Fats   │
   │ 2500   │ 150g   │ 300g   │ 75g    │
   └────────┴────────┴────────┴────────┘
   ```

5. **Remaining Macros Card**
   ```
   ┌──────────────────────────────────┐
   │ 🎯 Remaining for today           │
   │ 150 kcal • 25g protein •         │
   │ 50g carbs • 15g fats             │
   └──────────────────────────────────┘
   ```

6. **Consumed Foods List**
   ```
   └─ Your meals today
      ├─ Chicken Breast × 2    [kcal]  [x]
      ├─ Rice Bowl × 1         [kcal]  [x]
      └─ Banana × 1            [kcal]  [x]
   ```
   - Scrollable (max-h-48)
   - Remove button on hover
   - Shows quantity and calories

---

#### C. **Daily Check-in Section** ⭐ NEW
**Position:** Below Food Logger  
**Background:** Gradient `from-emerald-500/10 to-teal-500/10`  
**Border:** `border-emerald-500/20`

**Layout:**
```
┌────────────────────────────────────────┐
│ 🎯 Daily Check-in                      │
│ Track each food individually with      │
│ serving sizes                          │
├────────────────────────────────────────┤
│ Stats Overview (4 columns)             │
│ ┌─────────┬─────────┬──────────┬─────┐│
│ │Consumed │Protein  │Carbs     │Fats││
│ │2500/3000│150/120g │300/250g  │75.5││
│ │kcal     │         │          │75g ││
│ └─────────┴─────────┴──────────┴─────┘│
├────────────────────────────────────────┤
│ ⚠️ Exceeded Targets Alert               │
│ (Shows if user goes over)              │
│ +250 kcal • Protein +30g • ...         │
├────────────────────────────────────────┤
│ Overall Progress Bar                   │
│ [████████████░░░░░░░] 83%              │
├────────────────────────────────────────┤
│ Tracked Meals (3)                      │
│ ┌────────────────────────────────────┐ │
│ │ Chicken Breast                     │ │
│ │ Quantity: 2 servings        [×]    │ │
│ │ ┌─────┬─────────┬──────┬────────┐ │ │
│ │ │ 300 │ 62g     │ 0g   │ 3.4g   │ │ │
│ │ │ Kcal│Protein  │Carbs │Fats    │ │ │
│ │ └─────┴─────────┴──────┴────────┘ │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

**Features:**
- **4-Column Stats:** Consumed vs Target for each macro
- **Color Coding:** Red if exceeded, normal if within
- **Alert System:** Shows when daily targets exceeded with exact amounts
- **Progress Bar:** Visual representation of calorie consumption
- **Tracked Meals Display:** Each food with quantity and expandable macro breakdown
- **Individual Food Cards:** Shows breakdown of each food's contribution

---

#### D. **Macro Overview / Daily Targets Section**
**Position:** After Daily Check-in  
**Layout:**
```
┌──────────────────────────────────────┐
│ Daily Targets                        │
│ BMR: 1800 • TDEE: 2400               │
│                              3000    │
│                              kcal    │
├──────────────────────────────────────┤
│  ┌─────────┐  ┌──────────┐  ┌─────┐ │
│  │ Protein │  │  Carbs   │  │ Fats│ │
│  │  150    │  │   250    │  │  75 │ │
│  │ of 150g │  │ of 250g  │  │ 75g │ │
│  │ [Circle]│  │ [Circle] │  │[Cir]│ │
│  └─────────┘  └──────────┘  └─────┘ │
├──────────────────────────────────────┤
│ 📋 Protein target: 2.2g/kg            │
│    optimized for muscle gain          │
└──────────────────────────────────────┘
```

**Components:**
- **Macro Rings:** SVG circular progress indicators
- **Color Scheme:** Purple (Protein), Green (Carbs), Amber (Fats)
- **Info Card:** Protein requirements based on goal

---

#### E. **Today's Meal Plan Section**
**Position:** After Macro Overview
```
┌──────────────────────────────────────┐
│ Today's Meal Plan                    │
├──────────────────────────────────────┤
│ ☕ Breakfast              2500 kcal │
│  ├─ Oats                  500 kcal  │
│  └─ Banana                150 kcal  │
├──────────────────────────────────────┤
│ ☀️ Lunch                 3000 kcal │
│  └─ Rice + Chicken...                │
├──────────────────────────────────────┤
│ 🌙 Dinner                2000 kcal │
│  └─ Dal + Roti...                    │
└──────────────────────────────────────┘
```

**Features:**
- **Meal Icons:** Category-specific icons
- **Calorie Display:** Right-aligned total
- **Expandable Foods:** Shows individual food items
- **Macro Breakdown:** Per food item colored breakdown

---

#### F. **Meal Plan Summary**
```
┌─────────────────────────────────────┐
│ Meal Plan Total                     │
├────────────┬──────────┬──────────────┤
│ Calories   │ Protein  │ Carbs │ Fats │
│ 7500       │ 450g     │ 750g  │ 225g │
└────────────┴──────────┴──────────────┘
```

---

#### G. **Next Meal Suggestions**
```
┌──────────────────────────────────────┐
│ Next meal suggestions                │
├──────────────────────────────────────┤
│ Grilled Chicken Breast               │
│ 165 kcal • 31P/0C/4F                 │
├──────────────────────────────────────┤
│ Brown Rice (150g)                    │
│ 195 kcal • 4.5P/43C/1.5F             │
└──────────────────────────────────────┘
```

---

#### H. **Diet Info Card**
```
┌──────────────────────────────────────┐
│ 📋 About Your Plan                   │
├──────────────────────────────────────┤
│ Your nutrition plan uses carb        │
│ cycling — higher carbs on training   │
│ days for performance, lower carbs    │
│ on rest days for fat burning. All    │
│ food recommendations are sourced     │
│ from Visakhapatnam with local        │
│ options you can actually find.       │
└──────────────────────────────────────┘
```

---

## 🎨 Design System

### Color Palette

| Element | Color | Usage |
|---------|-------|-------|
| Primary | `#6C63FF` (Purple) | Buttons, accents, protein highlights |
| Success | `#22c55e` (Green) | Carbs, healthy indicators |
| Warning | `#f59e0b` (Amber) | Fats, caution states |
| Danger | `#ef4444` (Red) | Exceeded targets, errors |
| Background | `#0f172a` (Slate-950) | Main background |
| Text Primary | `#ffffff` | Main text |
| Text Secondary | `#94a3b8` (Slate-400) | Sub-text |
| Border | `rgba(255,255,255,0.1)` | Light borders |

### Gradient Palette

- **Purple Gradient:** `from-[#6C63FF]/10 to-purple-500/10`
- **Emerald Gradient:** `from-emerald-500/10 to-teal-500/10`
- **Display Gradient:** `from-white via-white/80 to-white`

### Typography

| Type | Size | Weight | Usage |
|------|------|--------|-------|
| H1 | 28-36px (text-3xl/4xl) | Extrabold (800) | Page titles |
| H2 | 18px (text-lg) | Bold (700) | Section headers |
| H3 | 14px (text-sm) | Bold (700) | Component titles |
| Body | 14-16px (text-sm) | Regular (400) | Content text |
| Small | 12px (text-xs) | Regular/Medium | Labels, metadata |
| Tiny | 10px (text-[10px]) | Regular | Micro text |

---

## 🚀 Features Overview

### 1. **Smart Food Logging**
- Search across 12,228+ foods
- Autocomplete with instant suggestions
- Quantity/servings control
- Immediate macro calculation
- Add multiple foods seamlessly

### 2. **Daily Check-in System**
- Real-time tracking display
- Consumed vs Target comparison
- Alert system for exceeded targets
- Visual progress bar
- Individual food tracking
- Quick remove functionality

### 3. **Automatic Macro Deduction**
- Real-time calculation as foods are added
- Remaining macros updated instantly
- Target comparison with color coding
- Exceeded amounts clearly displayed

### 4. **Carb Cycling**
- Automatic detection of workout days
- Dynamic macro targets
- High/Low/Moderate carb recommendations
- Status badge display

### 5. **Meal Planning**
- AI-generated meal suggestions
- Category-based meal organization
- Personalized portion recommendations
- Supplement integration tracking

### 6. **Progress Analytics**
- Daily macro summaries
- Weekly progress tracking
- Monthly reviews
- Goal achievement metrics
- Historical data visualization

---

## 🎯 Daily Check-in Logic

### Data Flow

```
User Input (Food + Servings)
          ↓
  Validate & Find Food in DB
          ↓
  Calculate Macros (qty × food macros)
          ↓
  Add to consumedFoods State
          ↓
  Update totals (consumedTotals)
          ↓
  Calculate remaining (target - consumed)
          ↓
  Check if exceeded targets
          ↓
  Display alerts if necessary
          ↓
  Update UI components
```

### State Management

```typescript
const [consumedFoods, setConsumedFoods] = useState<
  {
    id: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    servings: number;
  }[]
>([]);

const consumedTotals = consumedFoods.reduce((acc, item) => {
  acc.calories += item.calories;
  acc.protein += item.protein;
  acc.carbs += item.carbs;
  acc.fats += item.fats;
  return acc;
}, { calories: 0, protein: 0, carbs: 0, fats: 0 });

const remaining = {
  calories: Math.max(0, targetCalories - consumedTotals.calories),
  protein: Math.max(0, targetProtein - consumedTotals.protein),
  carbs: Math.max(0, targetCarbs - consumedTotals.carbs),
  fats: Math.max(0, targetFats - consumedTotals.fats),
};
```

### Exceeded Targets Alert

**Condition Check:**
```typescript
if (consumedTotals.calories > mealPlan.targetCalories || 
    consumedTotals.protein > mealPlan.targetProtein || 
    consumedTotals.carbs > mealPlan.targetCarbs || 
    consumedTotals.fats > mealPlan.targetFats)
```

**Alert Display:**
- Red background: `bg-red-500/10 border-red-500/20`
- Warning icon + message
- Breakdown of all exceeded macros
- Uses emoji: ⚠️

### Color Coding System

| Consumed | Color | Background |
|----------|-------|-----------|
| < 50% of target | Green | Emerald |
| 50-80% of target | Yellow | Yellow |
| > 80% of target | Orange | Orange |
| > 100% of target | Red | Red |

---

## 📊 Data Flow

### Food Database Integration

```
┌──────────────────────────────────────────┐
│  Central Food Database (12,228 Foods)   │
├──────────────────────────────────────────┤
│ ├─ Open Nutrition Foods (5,299)         │
│ ├─ Indian Food Dataset (106)            │
│ ├─ Recipes Database (9,997)             │
│ ├─ PVFM Macros (125)                    │
│ ├─ Ayurvedic Foods (2,000)              │
│ └─ Hyperlocal Vizag Foods (~50)         │
└──────────────────────────────────────────┘
                    ↓
         Food Searchbar & Filters
                    ↓
         Autocomplete Suggestions
                    ↓
         User Selection + Quantity
                    ↓
      Consumed Foods List (State)
                    ↓
    Macro Calculations & Display
                    ↓
    Daily Targets Comparison
                    ↓
    Alert & Progress Updates
```

### State Management Flow

```
1. User Profile Setup (Onboarding)
   ↓ Store in localStorage via store.ts
   
2. Calculate BMR/TDEE (nutritionEngine.ts)
   ↓ Determine daily calorie needs
   
3. Generate Macro Targets
   ↓ Protein: Based on goal + 2.2g/kg
   ↓ Carbs: Carb cycling (high/low)
   ↓ Fats: Remaining calories / 9
   
4. Create Meal Plan
   ↓ Distribute across 6 meal types
   
5. Track Daily Consumption
   ↓ Real-time macro updates
   
6. Compare & Alert
   ↓ Show exceeded targets
```

---

## 📱 Responsive Design

### Breakpoints & Adaptations

**Mobile (< 768px)**
- Single column layout
- Stacked cards
- Full-width inputs
- Touch-friendly buttons (44px+ height)
- Simplified charts
- Condensed spacing (gap: 16px)

**Tablet (768px - 1024px)**
- 2-column grids where applicable
- Moderate spacing
- Horizontal scrolling for tables

**Desktop (> 1024px)**
- 4-column grids
- Full spacing (gap: 24px)
- Side-by-side comparisons
- Expanded detail views

### Responsive Classes Used

```tsx
className="grid-cols-2 md:grid-cols-4"        // 2 cols mobile, 4 cols desktop
className="text-sm lg:text-lg"                // Text scaling
className="p-4 lg:p-8"                        // Padding scaling
className="flex flex-col lg:flex-row"         // Layout switching
className="max-w-5xl"                         // Fixed max width
className="hidden md:block"                   // Hide/show elements
```

---

## ✨ Animation & Interactions

### Motion/React Animations

**Page Entrance:**
```tsx
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ delay: 0.1 }}
```

**Staggered List:**
```tsx
{meals.map((meal, idx) => (
  <motion.div
    transition={{ delay: 0.05 * idx }}
    {...}
  />
))}
```

### Interactive Elements

**Hover States:**
- Button scale: `hover:scale-105`
- Color changes: `hover:text-[#6C63FF]`
- Background changes: `hover:bg-white/10`
- Smooth transitions: `transition-all` (200ms default)

**Focus States:**
- Ring effect: `focus:ring-1 focus:ring-[#6C63FF]/30`
- Border highlight: `focus:border-[#6C63FF]/50`

**Active States:**
- Tab selection: `bg-[#6C63FF] text-white`
- Pressed buttons: `active:scale-95`

---

## 🧮 Nutrition Engine Details

### BMR Calculation (Mifflin-St Jeor)

**Male:**
```
BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
```

**Female:**
```
BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161
```

### TDEE Calculation

```
TDEE = BMR × Activity Factor
  1.2 = Sedentary
  1.375 = Light activity
  1.55 = Moderate activity
  1.725 = Very active
  1.9 = Extremely active
```

### Macro Target Calculation

**Protein:**
- Mass Gain: 2.2g per kg bodyweight
- Fat Loss: 2.0g per kg bodyweight
- Maintenance: 1.6g per kg bodyweight

**Carbs & Fats:**
- Remaining calories divided proportionally
- Typically: 45% carbs, 35% fats (flexible)
- Adjusted for carb cycling

### Carb Cycling

**High Carb Days (Training Days):**
- Carbs: 50% of total calories
- Fats: 30% of total calories
- Protein: 20% of total calories

**Low Carb Days (Rest Days):**
- Carbs: 30% of total calories
- Fats: 40% of total calories
- Protein: 30% of total calories

---

## 📚 Dataset Integration

### Food Database Composition

| Source | Count | Features | Quality |
|--------|-------|----------|---------|
| Open Nutrition | 5,299 | Comprehensive, global | ⭐⭐⭐⭐⭐ |
| Indian Foods | 106 | Regional, localized | ⭐⭐⭐⭐ |
| Recipes | 9,997 | Prepared meals, cuisines | ⭐⭐⭐⭐ |
| PVFM Macros | 125 | Budget-friendly options | ⭐⭐⭐⭐ |
| Ayurvedic | 2,000 | Wellness-focused | ⭐⭐⭐⭐ |
| **Total** | **12,228** | Diverse & comprehensive | ✅ |

### Food Item Structure

```typescript
interface FoodItem {
  id: string;                                    // Unique identifier
  name: string;                                  // English name
  nameLocal: string;                             // Local language name
  category: 'breakfast'|'lunch'|'dinner'|...    // Meal type
  type: 'vegetarian'|'non_vegetarian'|...       // Diet type
  calories: number;                              // Per 100g or serving
  protein: number;                               // Grams
  carbs: number;                                 // Grams
  fats: number;                                  // Grams
  fiber: number;                                 // Grams
  servingSize: string;                           // e.g., "100g", "1 cup"
  micronutrients: string[];                      // Key minerals/vitamins
  availableAt: string;                           // Source/location
  prepTime: number;                              // Minutes
  isStreetFood: boolean;                         // Quick access indicator
  healthRating: 1|2|3|4|5;                       // Quality rating
}
```

---

## 🎯 Key UI/UX Principles Applied

1. **Clarity First**: Information hierarchy is clear with size, color, and positioning
2. **Real-time Feedback**: Updates show immediately as user inputs data
3. **Color Psychology**: Colors convey meaning (green=good, red=warning)
4. **Whitespace**: Breathing room between sections prevents overwhelm
5. **Consistency**: Repeated patterns and structures throughout
6. **Accessibility**: High contrast ratios, readable fonts, semantic HTML
7. **Progressive Disclosure**: Expandable sections reveal details on demand
8. **Mobile-First**: Responsive from smallest to largest screens
9. **Interactive Feedback**: Hover, focus, active states on all interactive elements
10. **Animations**: Subtle motion guides user attention and provides feedback

---

## 📝 Summary

This document covers the complete design and functionality of the Gym Nutrition Tracking Application, focusing on:
- **Daily Check-in System** for accurate food tracking
- **Automatic Macro Calculations** with real-time display
- **Exceeded Target Alerts** to keep users informed
- **Responsive, Modern UI** with smooth animations
- **Comprehensive Food Database** with 12,228+ items
- **Smart Nutrition Engine** for personalized recommendations

The application prioritizes user experience, clarity, and data accuracy to help users achieve their fitness and nutrition goals.

---

**Last Updated:** February 21, 2026  
**Version:** 1.0  
**Status:** ✅ Production Ready
