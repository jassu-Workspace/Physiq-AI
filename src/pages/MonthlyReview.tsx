import React, { useEffect, useState } from 'react';
import { Calendar, TrendingUp, CheckCircle, ArrowRight, Quote, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { api, MonthlyReviewData } from '../services/api';

export default function MonthlyReview() {
  const [data, setData] = useState<MonthlyReviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await api.getMonthlyReviewData();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch monthly review data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex items-center justify-center min-h-full p-4 md:p-8">
      <div className="glass-panel rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden max-w-5xl w-full bg-[#141e18]/80 backdrop-blur-xl border-white/10">
        {/* Glow Effect */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">October in Review</h1>
            <p className="text-slate-400 font-medium text-lg">Building a stronger you, one day at a time.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <Calendar className="text-green-400" size={20} />
            <span className="text-sm font-semibold text-slate-300">Oct 01 - Oct 31</span>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
          {/* Consistency Ring */}
          <div className="col-span-1 md:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-[#1c2822] shadow-[8px_8px_16px_rgba(0,0,0,0.25),-8px_-8px_16px_rgba(255,255,255,0.03)] border border-white/5 relative group">
            <h3 className="text-slate-300 font-medium mb-6 text-center">Consistency Score</h3>
            
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90">
                <circle className="text-slate-800/50" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeWidth="12" />
                <motion.circle 
                  initial={{ strokeDashoffset: 552 }}
                  animate={{ strokeDashoffset: 552 - (552 * data.consistency.score / 100) }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  className="filter drop-shadow-[0_0_6px_rgba(19,236,109,0.5)]" 
                  cx="96" 
                  cy="96" 
                  fill="transparent" 
                  r="88" 
                  stroke="#13ec6d" 
                  strokeDasharray="552" 
                  strokeDashoffset="552" 
                  strokeLinecap="round" 
                  strokeWidth="12" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-white tracking-tight">{data.consistency.score}%</span>
                <span className="text-xs text-green-400 font-medium mt-1 uppercase tracking-wider">Excellent</span>
              </div>
            </div>
            
            <p className="text-slate-400 text-sm mt-6 text-center px-4">
              You showed up for <span className="text-white font-bold">{data.consistency.attended}/{data.consistency.total}</span> planned sessions.
            </p>
          </div>

          {/* Stats & Graph */}
          <div className="col-span-1 md:col-span-8 flex flex-col justify-between gap-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[140px] p-5 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-slate-400 text-sm mb-1">Total Volume</p>
                <p className="text-2xl font-bold text-white">{data.stats.volume.value} <span className="text-sm font-normal text-slate-500">{data.stats.volume.unit}</span></p>
                <div className="flex items-center gap-1 mt-2 text-green-400 text-sm font-medium">
                  <TrendingUp size={16} />
                  <span>{data.stats.volume.trend}</span>
                </div>
              </div>
              <div className="flex-1 min-w-[140px] p-5 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-slate-400 text-sm mb-1">Workouts</p>
                <p className="text-2xl font-bold text-white">{data.stats.workouts.value} <span className="text-sm font-normal text-slate-500">{data.stats.workouts.unit}</span></p>
                <div className="flex items-center gap-1 mt-2 text-green-400 text-sm font-medium">
                  <CheckCircle size={16} />
                  <span>{data.stats.workouts.status}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 p-6 rounded-2xl bg-[#1c2822] shadow-[8px_8px_16px_rgba(0,0,0,0.25),-8px_-8px_16px_rgba(255,255,255,0.03)] border border-white/5 relative overflow-hidden min-h-[200px]">
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-slate-300 font-medium">Strength Progression</h3>
                <div className="flex gap-4 text-xs text-slate-500">
                  <span>Week 1</span>
                  <span>Week 2</span>
                  <span>Week 3</span>
                  <span>Week 4</span>
                </div>
              </div>
              
              {/* Simple SVG Chart for visual fidelity to design */}
              <div className="relative h-40 w-full">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 400 150">
                  <defs>
                    <linearGradient id="chartGradientGreen" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#13ec6d" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#13ec6d" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 120 C40 120, 60 80, 100 90 C140 100, 160 50, 200 60 C240 70, 260 40, 300 30 C340 20, 360 40, 400 10 V150 H0 Z" fill="url(#chartGradientGreen)" />
                  <path 
                    d="M0 120 C40 120, 60 80, 100 90 C140 100, 160 50, 200 60 C240 70, 260 40, 300 30 C340 20, 360 40, 400 10" 
                    fill="none" 
                    stroke="#13ec6d" 
                    strokeWidth="3" 
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_8px_rgba(19,236,109,0.4)]"
                  />
                  <circle cx="100" cy="90" r="4" fill="#102218" stroke="#13ec6d" strokeWidth="2" />
                  <circle cx="200" cy="60" r="4" fill="#102218" stroke="#13ec6d" strokeWidth="2" />
                  <circle cx="300" cy="30" r="4" fill="#102218" stroke="#13ec6d" strokeWidth="2" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Coach Insight */}
        <div className="mb-10 relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
          <div className="relative flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-green-500/30 transition-colors duration-300">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-green-500/30 shadow-lg">
                <img 
                  alt="Coach Sarah" 
                  className="w-full h-full object-cover" 
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop" 
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-green-500 text-black rounded-full p-1 border-2 border-[#102218]">
                <Quote size={12} fill="currentColor" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Coach's Insight</p>
              <p className="text-slate-200 text-lg font-medium italic leading-relaxed">
                "{data.coachInsight.message}"
              </p>
              <p className="text-green-400 text-sm font-semibold mt-2">— {data.coachInsight.author}</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <button className="relative group bg-[#1c2822] hover:bg-[#23332b] text-white px-12 py-5 rounded-full shadow-[6px_6px_12px_rgba(0,0,0,0.3),-4px_-4px_10px_rgba(255,255,255,0.1),inset_2px_2px_4px_rgba(255,255,255,0.2),inset_-2px_-2px_4px_rgba(0,0,0,0.2)] transition-all duration-300 active:scale-95 flex items-center gap-3">
            <span className="text-lg font-bold tracking-wide">Continue Journey</span>
            <ArrowRight className="group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </div>
  );
}
