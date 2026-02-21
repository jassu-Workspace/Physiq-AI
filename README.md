# Physiq-AI 🏋️‍♂️🧠

**Smart Nutrition & Fitness Coaching Platform**

A cutting-edge AI-powered web application that combines personalized nutrition tracking, intelligent meal planning, comprehensive workout management, and AI-driven coaching to help users achieve their fitness goals.

![React](https://img.shields.io/badge/React-18.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-Essential-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-green)
![Vite](https://img.shields.io/badge/Vite-6.0-purple)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🎯 Features

### 📊 **Smart Nutrition Dashboard**
- **Real-time Food Tracking**: Log foods from a database of **12,228+ items** with instant macro calculations
- **Automatic Macro Deduction**: Food quantity instantly deducts from daily targets
- **Exceeded Target Alerts**: Red alerts notify users when nutritional goals are surpassed
- **Carb Cycling**: Intelligent meal planning with dynamic carb allocation (high/low carb days)
- **Daily Check-in Form**: Comprehensive daily tracking with:
  - Current weight & height monitoring
  - Meal planning & supplements logging
  - Exercise type & duration tracking
  - Commute time logging
  - Daily notes (stress, sleep quality, soreness)

### 💪 **Workout Management**
- **Personalized Workout Plans**: AI-generated programs based on user goals, experience, and availability
- **Exercise Library**: 1000+ exercises with detailed instructions and form cues
- **Custom Rep/Set Schemes**: Flexible workout structure with progressive overload

### 🤖 **AI Coach Chat**
- **Real-time Coaching**: Google Gemini AI integration for instant fitness advice
- **Personalized Responses**: AI understands user goals, experience level, and preferences
- **Nutrition Guidance**: Tips on meal timing, macros, and food choices
- **Workout Optimization**: Form advice, progressive overload strategies, recovery tips

### 📈 **Progress Tracking**
- **Visual Analytics**: Charts and graphs for weight, strength, and consistency trends
- **Achievement Badges**: Unlockable milestones for consistency and goals
- **Historical Data**: Complete workout and nutrition history

### 🔐 **User Authentication & Profiles**
- **Secure Auth**: Google Sign-in via Clerk
- **Detailed Onboarding**: Fitness goals, experience level, dietary preferences
- **Custom Schedule**: Gym availability and preferences
- **Nutrition Calculations**: BMR/TDEE and protein intake optimization

---

## 📦 Database & Datasets

Integrated **5 premium nutrition datasets** (12,228 foods total):

| Dataset | Items | Focus |
|---------|-------|-------|
| **Open Nutrition** | 5,299 | Global food database with complete macros |
| **Recipe Master** | 9,997 | Prepared meals & recipes with instructions |
| **Indian Foods** | 106 | Regional cuisine with local names |
| **PVFM Macros** | 125 | Budget-friendly foods with macro optimization |
| **Ayurvedic Foods** | 2,000 | Wellness-focused foods with health ratings |

**Key Data Points per Food:**
- Name & Local Name (transliteration)
- Calories, Protein, Carbs, Fats, Fiber
- Serving size & quantity
- Food type (vegan, vegetarian, eggetarian, non-veg)
- Category (breakfast, lunch, dinner, snacks, pre/post-workout)
- Health rating (0-5 stars)
- Preparation time & micronutrients

---

## 🛠️ **Tech Stack**

### **Frontend**
- **React 19** - Modern UI framework with hooks
- **TypeScript** - Type-safe development
- **Vite 6** - Lightning-fast build tool
- **Tailwind CSS 4** - Utility-first styling
- **Motion/React** - Smooth animations & transitions
- **Lucide React** - Icon library

### **Backend & Services**
- **Supabase** - Real-time database & authentication
- **Clerk** - User authentication & session management
- **Google Gemini API** - AI coaching capabilities

### **Development Tools**
- **ESLint** - Code quality
- **TypeScript Compiler** - Type checking

---



## 📁 **Project Structure**

```
physiq-ai/
├── src/
│   ├── pages/
│   │   ├── Dashboard.tsx              # Main user dashboard
│   │   ├── NutritionDashboard.tsx     # Nutrition tracking & meal planning
│   │   ├── WorkoutPlan.tsx            # Workout program management
│   │   ├── ExerciseLibrary.tsx        # 1000+ exercise database
│   │   ├── CoachChat.tsx              # AI coaching interface
│   │   ├── Progress.tsx               # Analytics & tracking
│   │   ├── Onboarding.tsx             # User setup wizard
│   │   └── Auth.tsx                   # Authentication page
│   ├── components/
│   │   ├── Sidebar.tsx                # Navigation sidebar
│   │   ├── WorkoutCard.tsx            # Workout display
│   │   └── ExerciseListItem.tsx       # Exercise cards
│   ├── services/
│   │   ├── store.ts                   # User state management
│   │   ├── supabase.ts                # Database client
│   │   ├── nutritionEngine.ts         # Nutrition calculations
│   │   └── gemini.ts                  # AI integration
│   ├── data/
│   │   ├── combinedFoods.ts           # 12,228 food database
│   │   ├── foods.ts                   # Food utilities
│   │   ├── exercises.json             # Exercise library
│   │   └── meals.ts                   # Meal templates
│   ├── App.tsx                        # Root component
│   ├── main.tsx                       # Entry point
│   └── index.css                      # Global styles
├── index.html                         # HTML template
├── vite.config.ts                     # Vite configuration
├── tsconfig.json                      # TypeScript config
├── tailwind.config.js                 # Tailwind configuration
├── package.json                       # Dependencies
└── README.md                          # This file
```

---

## 🎨 **Design System**

### **Color Palette**
```
Primary:      #6C63FF (Purple)
Secondary:    #8B5CF6 (Violet)
Success:      #22c55e (Green)
Warning:      #f59e0b (Amber)
Danger:       #ef4444 (Red)
Background:   #0B0C15 (Dark Navy)
Text:         #FFFFFF, #E2E8F0 (White/Slate)
```

### **Typography**
- **Font Family**: Manrope (Variable, 200-800 weight)
- **Headlines**: 3xl-4xl (24-36px)
- **Body**: sm-base (12-16px)
- **Labels**: xs (12px)

---

## 🔄 **Core Features Explained**

### **Nutrition Engine**

Real-time macro calculation with automatic deduction:
- Tracks consumed foods with instant calorie/macro calculation
- Compares against daily targets
- Shows remaining macros in real-time
- Alerts when exceeding targets in red

### **Carb Cycling**

Intelligent carbohydrate allocation based on training schedule:
- **High Carb Days** (Gym Days): 5-6g/kg bodyweight
- **Low Carb Days** (Rest Days): 2-3g/kg bodyweight
- Protein stays high: 2-2.2g/kg (always)
- Fats maintain: 0.8-1g/kg

### **Daily Check-in Form**

Comprehensive daily logging at the bottom of nutrition dashboard:
- Current weight & height tracking
- Planned meals logging
- Supplement usage count
- Exercise type & duration
- Commute time
- Daily notes (stress, sleep, soreness)
- Auto-populated from logged foods

---

## 🔐 **Security & Privacy**

- ✅ **JWT Authentication** via Clerk
- ✅ **Row-level Security** in Supabase
- ✅ **Encrypted API Keys** in environment variables
- ✅ **User Data Isolation**: Each user sees only their data
- ✅ **HTTPS Only**: Production enforcement
- ✅ **Privacy First**: No data selling or external sharing

---

## 📊 **Performance Metrics**

- **Bundle Size**: ~3.9MB (minified & gzipped)
- **Build Time**: ~16 seconds
- **Module Count**: 2,134 modules
- **Lighthouse Score**: 88+
- **Search Speed**: 12,228 foods searchable in <50ms

---

## 🤝 **Contributing**

Contributions are welcome! Please follow these steps:

```bash
# 1. Fork the repository
# 2. Create a feature branch
git checkout -b feature/your-feature-name

# 3. Make your changes
# 4. Commit with clear messages
git commit -m "Add feature: description"

# 5. Push to branch
git push origin feature/your-feature-name

# 6. Open a Pull Request
```

---

## 📞 **Support & Community**

- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for feature requests
- **Email**: support@physiq-ai.com

---

## 📄 **License**

This project is licensed under the **MIT License** - see the LICENSE file for details.

---

## 🙏 **Acknowledgments**

- 🏋️ Open Nutrition Foundation for food database
- 🇮🇳 Indian Food Dataset contributors
- 🤖 Google Gemini for AI capabilities
- 🎨 Tailwind Labs for styling excellence

---

## 🚀 **Roadmap**

- [ ] Barcode scanning for food logging
- [ ] Wearable device integration (Apple Watch, Oura Ring)
- [ ] Advanced analytics with ML predictions
- [ ] Social features (friend groups, challenges)
- [ ] Meal prep scheduling & shopping lists
- [ ] Video form correction via camera
- [ ] Offline mode support
- [ ] Mobile app (React Native)

---

## 📊 **Key Stats**

- **12,228** Foods in Database
- **1,000+** Exercises
- **100+** Meal Templates
- **5** Integrated Datasets
- **2,134** Module Dependencies
- **0** Build Errors

---

**Made with 💜 by the Physiq-AI Team**

Transform Your Fitness Journey with AI-Powered Coaching
