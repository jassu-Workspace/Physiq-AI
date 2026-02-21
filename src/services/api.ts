import { 
  Sun, 
  Moon, 
  Egg, 
  Utensils, 
  Fish, 
  Salad, 
  Coffee, 
  Carrot, 
  Beef, 
  Weight, 
  Trophy, 
  CheckCircle, 
  Activity, 
  Smile 
} from 'lucide-react';

// Types
export interface MacroData {
  value: number;
  total: number;
  unit: string;
}

export interface MealItem {
  name: string;
  cals: number;
  protein: number;
  iconType: 'egg' | 'utensils' | 'fish' | 'salad' | 'coffee' | 'carrot' | 'beef';
  bgColor: string;
  textColor: string;
  checked: boolean;
}

export interface Meal {
  title: string;
  calories: number;
  iconType: 'sun' | 'moon';
  iconColor: string;
  completed: boolean;
  items: MealItem[];
}

export interface NutritionData {
  macros: {
    protein: MacroData;
    carbs: MacroData;
    fats: MacroData;
  };
  calories: {
    current: number;
    total: number;
  };
  meals: Meal[];
  snacks: {
    count: number;
    calories: number;
  };
  hydration: {
    current: number;
    target: number;
  };
}

export interface StatMetric {
  title: string;
  value: string;
  unit: string;
  subtitle: string;
  trend: 'up' | 'down';
  trendValue: string;
  iconType: 'weight' | 'trophy' | 'checkCircle';
  trendColor: 'green' | 'orange';
}

export interface ChartPoint {
  name: string;
  value: number;
}

export interface Insight {
  title: string;
  description: string;
  type: 'recovery' | 'resilience';
}

export interface AnalyticsData {
  metrics: StatMetric[];
  chartData: ChartPoint[];
  insights: Insight[];
}

export interface MonthlyReviewData {
  consistency: {
    score: number;
    attended: number;
    total: number;
  };
  stats: {
    volume: {
      value: string;
      unit: string;
      trend: string;
    };
    workouts: {
      value: number;
      unit: string;
      status: string;
    };
  };
  coachInsight: {
    message: string;
    author: string;
  };
}

// Mock Data
const nutritionData: NutritionData = {
  macros: {
    protein: { value: 124, total: 180, unit: 'g' },
    carbs: { value: 195, total: 250, unit: 'g' },
    fats: { value: 58, total: 70, unit: 'g' },
  },
  calories: { current: 1880, total: 2400 },
  meals: [
    {
      title: 'Breakfast',
      calories: 600,
      iconType: 'sun',
      iconColor: 'text-yellow-400',
      completed: true,
      items: [
        { name: '3 Egg Omelette', cals: 210, protein: 18, iconType: 'egg', bgColor: 'bg-orange-500/10', textColor: 'text-orange-400', checked: true },
        { name: 'Oatmeal & Berries', cals: 300, protein: 6, iconType: 'utensils', bgColor: 'bg-yellow-500/10', textColor: 'text-yellow-400', checked: true },
        { name: 'Black Coffee', cals: 5, protein: 0, iconType: 'coffee', bgColor: 'bg-stone-500/10', textColor: 'text-stone-400', checked: true }
      ]
    },
    {
      title: 'Lunch',
      calories: 800,
      iconType: 'sun',
      iconColor: 'text-orange-400',
      completed: false,
      items: [
        { name: 'Grilled Chicken Breast', cals: 280, protein: 45, iconType: 'utensils', bgColor: 'bg-red-500/10', textColor: 'text-red-400', checked: false },
        { name: 'Quinoa & Avocado', cals: 320, protein: 8, iconType: 'salad', bgColor: 'bg-green-500/10', textColor: 'text-green-400', checked: false }
      ]
    },
    {
      title: 'Dinner',
      calories: 600,
      iconType: 'moon',
      iconColor: 'text-indigo-300',
      completed: false,
      items: []
    }
  ],
  snacks: { count: 2, calories: 320 },
  hydration: { current: 1500, target: 2500 }
};

const analyticsData: AnalyticsData = {
  metrics: [
    {
      title: 'Current Weight',
      value: '141.5',
      unit: 'lbs',
      subtitle: 'Approaching target weight',
      trend: 'down',
      trendValue: '0.8%',
      iconType: 'weight',
      trendColor: 'orange'
    },
    {
      title: 'Personal Best',
      value: '220',
      unit: 'lbs',
      subtitle: 'New record on deadlift',
      trend: 'up',
      trendValue: '2.3%',
      iconType: 'trophy',
      trendColor: 'green'
    },
    {
      title: 'Consistency',
      value: '94',
      unit: '%',
      subtitle: 'Top 5% of members',
      trend: 'up',
      trendValue: 'High',
      iconType: 'checkCircle',
      trendColor: 'green'
    }
  ],
  chartData: [
    { name: 'Week 1', value: 145 },
    { name: 'Week 2', value: 170 },
    { name: 'Week 3', value: 185 },
    { name: 'Week 4', value: 220 },
  ],
  insights: [
    {
      title: 'Recovery Mode Active',
      description: 'Your HRV is higher than usual. We\'ve adjusted your next session to focus on mobility.',
      type: 'recovery'
    },
    {
      title: 'Mental Resilience',
      description: 'You\'ve logged 7 "Great" mood ratings in a row after workouts. Keep it up!',
      type: 'resilience'
    }
  ]
};

const monthlyReviewData: MonthlyReviewData = {
  consistency: {
    score: 94,
    attended: 26,
    total: 28
  },
  stats: {
    volume: { value: '13,200', unit: 'kg', trend: '+18%' },
    workouts: { value: 26, unit: 'sessions', status: 'On Target' }
  },
  coachInsight: {
    message: "You crushed your volume goals this month! The consistency in your compound lifts is really paying off. Let's focus on mobility next month to sustain this growth.",
    author: "Coach Sarah"
  }
};

// Simulated API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  getNutritionData: async (): Promise<NutritionData> => {
    await delay(800); // Simulate network latency
    return nutritionData;
  },
  getAnalyticsData: async (): Promise<AnalyticsData> => {
    await delay(1000);
    return analyticsData;
  },
  getMonthlyReviewData: async (): Promise<MonthlyReviewData> => {
    await delay(1200);
    return monthlyReviewData;
  }
};
