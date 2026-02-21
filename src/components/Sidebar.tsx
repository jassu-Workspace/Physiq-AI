import React, { useState } from 'react';
import {
  LayoutDashboard,
  Utensils,
  Dumbbell,
  MessageCircle,
  TrendingUp,
  LogOut,
  Zap,
  Library
} from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userName?: string;
  onLogout?: () => Promise<void> | void;
}

export default function Sidebar({ activeTab, setActiveTab, userName = 'Athlete', onLogout }: SidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
    { id: 'workouts', icon: Dumbbell, label: 'Workouts' },
    { id: 'exercises', icon: Library, label: 'Exercises' },
    { id: 'nutrition', icon: Utensils, label: 'Nutrition' },
    { id: 'coach', icon: MessageCircle, label: 'Coach' },
    { id: 'progress', icon: TrendingUp, label: 'Progress' },
  ];

  const handleLogout = async () => {
    if (onLogout) await onLogout();
  };

  return (
    <>
      {/* Top Glassmorphic Header */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="fixed top-0 left-0 right-0 z-40 h-16 bg-gradient-to-br from-[#1a1a2e]/50 via-[#0f0f1e]/60 to-transparent backdrop-blur-xl border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4D96FF] to-[#6C63FF] flex items-center justify-center shadow-lg shadow-[#4D96FF]/40 relative overflow-hidden">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 bg-gradient-to-br from-[#4D96FF] to-[#6C63FF]"
              />
              <Zap size={18} className="text-white relative z-10" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Physiq-AI</p>
              <p className="text-xs text-slate-400">Smart Fitness Coach</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-right"
          >
            <p className="text-sm font-semibold text-white">Welcome, {userName}!</p>
            <p className="text-xs text-slate-400">Ready to transform?</p>
          </motion.div>
        </div>

        {/* Animated border glow */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#4D96FF]/50 to-transparent"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </motion.div>

      {/* Bottom Snackbar Navigation */}
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="fixed bottom-5 left-0 right-0 z-50 flex justify-center items-center px-4"
      >
        {/* Glassmorphic Snackbar with safe area */}
        <div className="bg-gradient-to-br from-[#1a1a2e]/80 via-[#0f0f1e]/85 to-[#0a0a14]/90 backdrop-blur-2xl border border-white/15 rounded-full px-8 py-4 shadow-2xl shadow-[#4D96FF]/20 max-w-full overflow-x-auto">
          <div className="flex items-center justify-center gap-3 whitespace-nowrap">
            {/* Logo/Brand */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4D96FF] to-[#6C63FF] flex items-center justify-center shadow-lg shadow-[#4D96FF]/40 flex-shrink-0">
                <Zap size={16} className="text-white" />
              </div>
              <span className="text-sm font-bold text-white hidden sm:inline flex-shrink-0">Physiq</span>
            </motion.div>

            {/* Menu Items Container */}
            <div className="flex items-center gap-1 bg-white/5 rounded-full px-3 py-1.5 flex-shrink-0">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <motion.button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.88, rotate: -5 }}
                    className="relative group flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-full transition-all duration-300 flex-shrink-0"
                  >
                    {/* Active Indicator Glow */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute inset-0 bg-gradient-to-br from-[#4D96FF]/30 to-[#6C63FF]/20 rounded-full blur-md"
                        transition={{ type: 'spring', bounce: 0.4, stiffness: 200 }}
                      />
                    )}

                    {/* Icon with spring animation */}
                    <motion.div
                      animate={{
                        scale: isActive ? 1.2 : 1,
                        y: isActive ? -2 : 0,
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className={`relative z-10 transition-all flex-shrink-0 ${
                        isActive 
                          ? 'text-[#4D96FF] drop-shadow-lg' 
                          : 'text-slate-400 group-hover:text-white'
                      }`}
                    >
                      <Icon size={21} />
                    </motion.div>

                    {/* Label with spring pop animation - hidden on mobile */}
                    <motion.span
                      animate={{
                        opacity: isActive || hoveredId === item.id ? 1 : 0,
                        scale: isActive || hoveredId === item.id ? 1 : 0.7,
                        y: isActive || hoveredId === item.id ? 0 : -10,
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className={`text-[8px] font-bold whitespace-nowrap transition-all relative z-10 hidden group-hover:block ${
                        isActive ? 'text-[#4D96FF]' : 'text-slate-300'
                      }`}
                    >
                      {item.label}
                    </motion.span>
                  </motion.button>
                );
              })}
            </div>

            {/* Logout Button */}
            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.12, rotate: 10 }}
              whileTap={{ scale: 0.85 }}
              className="ml-2 p-3 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30 transition-all duration-300 shadow-lg shadow-red-500/20 flex-shrink-0"
              title="Logout"
            >
              <LogOut size={18} />
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Spacing for fixed elements */}
      <style>{`
        main {
          padding-top: 4rem;
          padding-bottom: 8rem;
          scroll-behavior: smooth;
        }
        /* Hide scrollbar but allow scrolling */
        main::-webkit-scrollbar {
          width: 6px;
        }
        main::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        main::-webkit-scrollbar-thumb {
          background: rgba(77, 150, 255, 0.3);
          border-radius: 3px;
        }
        main::-webkit-scrollbar-thumb:hover {
          background: rgba(77, 150, 255, 0.5);
        }
      `}</style>
    </>
  );
}
