import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutDashboard,
  Utensils,
  Dumbbell,
  MessageCircle,
  TrendingUp,
  LogOut,
  Bell,
  Search,
  User,
  Library
} from 'lucide-react';
import { motion } from 'motion/react';
import { useExerciseDB } from '../services/exerciseDB';
import { combinedFoods } from '../data/combinedFoods';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userName?: string;
  onLogout?: () => Promise<void> | void;
}

type AppNotification = {
  id: string;
  title: string;
  message: string;
  timeLabel: string;
  tab: string;
};

const STATIC_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: 'Hydration Reminder',
    message: 'Drink 250 ml water now to stay on track.',
    timeLabel: 'Now',
    tab: 'nutrition',
  },
  {
    id: 'n2',
    title: 'Hydration Reminder',
    message: 'You are due for your next water break.',
    timeLabel: 'In 30 min',
    tab: 'nutrition',
  },
  {
    id: 'n3',
    title: 'Workout Plan',
    message: 'Open today’s workout and complete your first set.',
    timeLabel: 'Today',
    tab: 'workouts',
  },
  {
    id: 'n4',
    title: 'Coach Tip',
    message: 'Ask Coach Arjun for a quick motivation boost.',
    timeLabel: 'Anytime',
    tab: 'coach',
  },
];

export default function Sidebar({ activeTab, setActiveTab, userName = 'Athlete', onLogout }: SidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const { exercises } = useExerciseDB();
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const unreadCount = useMemo(() => STATIC_NOTIFICATIONS.length, []);

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

  const resolveTabFromQuery = (query: string): string => {
    const value = query.toLowerCase();

    const hasExerciseMatch = exercises.some((exercise) => {
      const nameMatch = exercise.name.toLowerCase().includes(value);
      const muscleMatch = exercise.primaryMuscles.some((muscle) => muscle.toLowerCase().includes(value));
      const equipmentMatch = (exercise.equipment ?? '').toLowerCase().includes(value);
      return nameMatch || muscleMatch || equipmentMatch;
    });

    const hasFoodMatch = combinedFoods.some((food) => {
      const nameMatch = food.name.toLowerCase().includes(value);
      const localNameMatch = (food.nameLocal ?? '').toLowerCase().includes(value);
      return nameMatch || localNameMatch;
    });

    if (/(food|meal|macro|nutrition|calorie|hydration|water)/.test(value)) return 'nutrition';
    if (/(workout|exercise|gym|set|rep|strength|routine)/.test(value)) return value.includes('exercise') ? 'exercises' : 'workouts';
    if (/(coach|chat|ai|advice|motivation)/.test(value)) return 'coach';
    if (/(progress|analytics|history|streak|recovery)/.test(value)) return 'progress';
    if (/(home|dashboard|overview)/.test(value)) return 'dashboard';
    if (hasExerciseMatch) return 'exercises';
    if (hasFoodMatch) return 'nutrition';
    return activeTab;
  };

  const handleUniversalSearch = () => {
    const query = searchQuery.trim();
    if (!query) return;

    const targetTab = resolveTabFromQuery(query);
    const payload = {
      query,
      targetTab,
      timestamp: Date.now(),
    };

    try {
      window.localStorage.setItem('app:global-search:last', JSON.stringify(payload));
    } catch {
      // Ignore storage errors and continue with event dispatch fallback.
    }

    if (targetTab !== activeTab) {
      setActiveTab(targetTab);
    }

    window.dispatchEvent(new CustomEvent('app:global-search', {
      detail: payload,
    }));
  };

  const handleNotificationClick = (tab: string) => {
    setActiveTab(tab);
    setShowNotifications(false);
  };

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!notificationsRef.current?.contains(target)) {
        setShowNotifications(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', onDocumentClick);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onDocumentClick);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  return (
    <>
      {/* Top Header */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="fixed top-0 left-0 right-0 z-40 h-16 border-b border-gray-200 bg-white/95 px-6 backdrop-blur"
      >
        <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white shadow-sm">
              P
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Physiq-AI</p>
              <p className="text-xs text-slate-500">Smart Fitness Coach</p>
            </div>
          </motion.div>

          <div className="hidden md:flex min-w-[240px] max-w-sm flex-1 items-center rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleUniversalSearch();
                }
              }}
              placeholder="Search foods, workouts, coach..."
              className="w-full border-0 bg-transparent px-2 text-sm text-slate-500 outline-none"
            />
            <button
              onClick={handleUniversalSearch}
              className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-blue-600"
              title="Universal Search"
            >
              <Search size={14} />
            </button>
          </div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="relative flex items-center gap-3" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications((prev) => !prev)}
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-slate-500 hover:text-blue-600"
              aria-label="Open notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white">
                <User size={13} />
              </div>
              <span className="pr-1 text-xs font-semibold text-slate-700">{userName}</span>
            </div>

            {showNotifications && (
              <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-bold text-slate-900">Notifications</p>
                  <p className="text-xs text-slate-500">Static reminders</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {STATIC_NOTIFICATIONS.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification.tab)}
                      className="w-full border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">{notification.timeLabel}</span>
                      </div>
                      <p className="text-xs text-slate-600">{notification.message}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom Navigation */}
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="fixed bottom-5 left-0 right-0 z-50 flex justify-center items-center px-4"
      >
        <div className="max-w-full overflow-x-auto rounded-full border border-gray-200 bg-white px-3 py-2 shadow-xl">
          <div className="flex items-center justify-center gap-1 whitespace-nowrap">
            <div className="flex items-center gap-1 rounded-full bg-gray-50 px-2 py-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <motion.button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className={`relative group flex flex-col items-center gap-0.5 rounded-full px-3 py-2 transition-all duration-200 flex-shrink-0 ${
                      isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute inset-0 rounded-full border border-blue-200"
                        transition={{ type: 'spring', bounce: 0.25, stiffness: 220 }}
                      />
                    )}

                    <motion.div
                      animate={{
                        scale: isActive ? 1.08 : 1,
                        y: isActive ? -1 : 0,
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="relative z-10 transition-all flex-shrink-0"
                    >
                      <Icon size={18} />
                    </motion.div>

                    <motion.span
                      animate={{
                        opacity: isActive || hoveredId === item.id ? 1 : 0,
                        scale: isActive || hoveredId === item.id ? 1 : 0.85,
                        y: isActive || hoveredId === item.id ? 0 : -6,
                      }}
                      transition={{ type: 'spring', stiffness: 360, damping: 24 }}
                      className="relative z-10 hidden whitespace-nowrap text-[9px] font-semibold transition-all group-hover:block"
                    >
                      {item.label}
                    </motion.span>
                  </motion.button>
                );
              })}
            </div>

            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              className="ml-1 flex-shrink-0 rounded-full border border-red-200 bg-red-50 p-2.5 text-red-500 transition-all duration-200 hover:bg-red-100"
              title="Logout"
            >
              <LogOut size={16} />
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Spacing for fixed elements */}
      <style>{`
        main {
          padding-top: 4rem;
          padding-bottom: 6rem;
          scroll-behavior: smooth;
        }
        main::-webkit-scrollbar {
          width: 6px;
        }
        main::-webkit-scrollbar-track {
          background: transparent;
        }
        main::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        main::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </>
  );
}
