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
import { supabase } from './services/supabase';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const user = useNormalizedUser();
  const isLoading = user === undefined;

  const handleOnboardingComplete = (_newUser: UserProfile) => {
    setIsEditingProfile(false);
  };

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setActiveTab('dashboard');
    setIsEditingProfile(false);
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-[#0B0C15] via-[#1a1a2e] to-[#0B0C15]">
        <div className="flex flex-col items-center gap-6">
          {/* Rotating gradient loader */}
          <div className="relative w-16 h-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#4D96FF] to-[#6C63FF] p-1"
            >
              <div className="inset-0 bg-[#0B0C15] rounded-xl" />
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-2 rounded-xl bg-gradient-to-br from-[#4D96FF]/40 to-[#6C63FF]/40 flex items-center justify-center"
            >
              <Zap size={28} className="text-[#4D96FF]" />
            </motion.div>
          </div>

          {/* Animated text */}
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-center"
          >
            <p className="text-slate-300 text-sm font-semibold">Loading Physiq-AI</p>
            <p className="text-slate-500 text-xs mt-2">Preparing your fitness journey...</p>
          </motion.div>

          {/* Progress bar */}
          <motion.div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden backdrop-blur">
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="h-full bg-gradient-to-r from-transparent via-[#4D96FF] to-transparent w-1/3"
            />
          </motion.div>
        </div>
      </div>
    );
  }

  // If no user is authenticated (null), show Auth page
  // Note: store.ts useUser returns null if no session, undefined if loading
  if (user === null) {
    return <Auth />;
  }

  // Show onboarding if authenticated but profile is incomplete (common for first Google sign-in)
  const profileCompleted = (user as any).profileCompleted !== false;
  if (!profileCompleted || !user.name || !user.goal || !user.customSchedule || user.daysPerWeek <= 0 || !user.gymExperience) {
    return <Onboarding onComplete={handleOnboardingComplete} initialUser={user} mode="create" />;
  }

  if (isEditingProfile) {
    return <Onboarding onComplete={handleOnboardingComplete} initialUser={user} mode="edit" onCancel={() => setIsEditingProfile(false)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard user={user!} onNavigate={handleNavigate} onLogout={handleLogout} onEditProfile={handleEditProfile} />;
      case 'workouts':
        return <WorkoutPlan user={user!} />;
      case 'exercises':
        return <ExerciseLibrary />;
      case 'nutrition':
        return <NutritionDashboard user={user!} />;
      case 'coach':
        return <CoachChat user={user!} />;
      case 'progress':
        return <Progress user={user!} />;
      default:
        return <Dashboard user={user!} onNavigate={handleNavigate} onLogout={handleLogout} onEditProfile={handleEditProfile} />;
    }
  };

  return (
    <div className="flex h-screen w-full relative overflow-hidden bg-gradient-to-br from-[#0B0C15] via-[#1a1a2e] to-[#0B0C15] text-white">
      {/* Animated gradient background mesh */}
      <motion.div
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
        className="fixed inset-0 z-0 bg-[radial-gradient(at_0%_0%,hsla(220,90%,56%,0.2)_0,transparent_40%),radial-gradient(at_50%_0%,hsla(260,80%,40%,0.15)_0,transparent_50%),radial-gradient(at_100%_100%,hsla(200,100%,50%,0.1)_0,transparent_50%)]"
        style={{ backgroundSize: '200% 200%' }}
      />

      {/* Glassmorphic overlay grid */}
      <div className="fixed inset-0 z-0 opacity-5 bg-[linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userName={user.name} onLogout={handleLogout} />

      <main className="relative z-10 flex-1 h-full overflow-y-auto scroll-smooth">
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

      {/* Floating particles effect (subtle) */}
      <motion.div
        className="fixed top-10 left-1/4 w-2 h-2 bg-[#4D96FF] rounded-full opacity-20"
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="fixed bottom-20 right-1/4 w-1.5 h-1.5 bg-[#6C63FF] rounded-full opacity-15"
        animate={{
          y: [0, 20, 0],
          x: [0, -15, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />
    </div>
  );
}
