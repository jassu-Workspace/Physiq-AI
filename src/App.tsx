import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import WorkoutPlan from './pages/WorkoutPlan';
import NutritionDashboard from './pages/NutritionDashboard';
import CoachChat from './pages/CoachChat';
import Progress from './pages/Progress';
import Onboarding from './pages/Onboarding';
import Auth from './pages/Auth';
import ExerciseLibrary from './pages/ExerciseLibrary';
import { motion, AnimatePresence } from 'motion/react';
import { Zap } from 'lucide-react';
import { type UserProfile, useNormalizedUser } from './services/store';
import { signOut } from 'firebase/auth';
import { auth } from './services/firebase';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [completedProfile, setCompletedProfile] = useState<UserProfile | null>(null);
  const user = useNormalizedUser();
  const resolvedUser = completedProfile ?? user;
  const isLoading = resolvedUser === undefined;

  const handleOnboardingComplete = (newUser: UserProfile) => {
    setCompletedProfile(newUser);
    setActiveTab('dashboard');
    setIsEditingProfile(false);
  };

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setActiveTab('dashboard');
    setIsEditingProfile(false);
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-white via-slate-100 to-blue-50">
        <div className="flex flex-col items-center gap-6">
          {/* Rotating gradient loader */}
          <div className="relative w-16 h-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-1"
            >
              <div className="inset-0 rounded-xl bg-white" />
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-2 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center"
            >
              <Zap size={28} className="text-blue-600" />
            </motion.div>
          </div>

          {/* Animated text */}
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-center"
          >
            <p className="text-slate-800 text-sm font-semibold">Loading Physiq-AI</p>
            <p className="text-slate-500 text-xs mt-2">Preparing your fitness journey...</p>
          </motion.div>

          {/* Progress bar */}
          <motion.div className="w-48 h-1 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="h-full bg-gradient-to-r from-transparent via-blue-500 to-transparent w-1/3"
            />
          </motion.div>
        </div>
      </div>
    );
  }

  // If no user is authenticated (null), show Auth page
  // Note: store.ts useUser returns null if no session, undefined if loading
  if (resolvedUser === null) {
    return <Auth />;
  }

  // Show onboarding if authenticated but profile is incomplete (common for first Google sign-in)
  const profileCompleted = (resolvedUser as any).profileCompleted !== false;
  if (!profileCompleted || !resolvedUser.name || !resolvedUser.goal || !resolvedUser.customSchedule || resolvedUser.daysPerWeek <= 0 || !resolvedUser.gymExperience) {
    return <Onboarding onComplete={handleOnboardingComplete} initialUser={resolvedUser} mode="create" />;
  }

  if (isEditingProfile) {
    return <Onboarding onComplete={handleOnboardingComplete} initialUser={resolvedUser} mode="edit" onCancel={() => setIsEditingProfile(false)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard user={resolvedUser!} onNavigate={handleNavigate} onLogout={handleLogout} onEditProfile={handleEditProfile} />;
      case 'workouts':
        return <WorkoutPlan user={resolvedUser!} />;
      case 'exercises':
        return <ExerciseLibrary />;
      case 'nutrition':
        return <NutritionDashboard user={resolvedUser!} />;
      case 'coach':
        return <CoachChat user={resolvedUser!} />;
      case 'progress':
        return <Progress user={resolvedUser!} />;
      default:
        return <Dashboard user={resolvedUser!} onNavigate={handleNavigate} onLogout={handleLogout} onEditProfile={handleEditProfile} />;
    }
  };

  return (
    <div className="app-light flex h-screen w-full relative overflow-hidden bg-slate-50 text-slate-900">

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userName={resolvedUser.name} onLogout={handleLogout} />

      <main className="relative z-10 flex-1 h-full overflow-y-auto scroll-smooth bg-slate-50">
        {/* Scroll reveal animations */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
