import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  Weight, 
  Trophy, 
  Brain, 
  ArrowRight,
  Activity,
  Smile,
  Loader2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';
import { api, AnalyticsData } from '../services/api';

const StatCard = ({ 
  title, 
  value, 
  unit, 
  subtitle, 
  trend, 
  trendValue, 
  iconType,
  trendColor 
}: {
  title: string;
  value: string;
  unit: string;
  subtitle: string;
  trend: 'up' | 'down';
  trendValue: string;
  iconType: string;
  trendColor: string;
}) => {
  const Icon = iconType === 'weight' ? Weight : iconType === 'trophy' ? Trophy : CheckCircle;
  
  return (
    <div className="glass-panel p-6 rounded-[2rem] flex flex-col justify-between group hover:bg-white/5 transition-colors duration-300 relative overflow-hidden h-full">
      <div className={`absolute -right-10 -top-10 w-32 h-32 ${trendColor === 'green' ? 'bg-green-500/10' : 'bg-orange-500/10'} rounded-full blur-2xl group-hover:opacity-100 opacity-50 transition-all`} />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-white/5 text-slate-300">
            <Icon size={20} />
          </span>
          <span className="text-slate-300 font-medium">{title}</span>
        </div>
        <span className={`flex items-center px-2 py-1 rounded-lg text-xs font-bold ${
          trendColor === 'green' ? 'text-green-400 bg-green-400/10' : 'text-orange-400 bg-orange-400/10'
        }`}>
          {trend === 'up' ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
          {trendValue}
        </span>
      </div>
      
      <div className="relative z-10">
        <p className="text-4xl font-bold text-white tracking-tight tabular-nums">
          {value} <span className="text-xl text-slate-500 font-medium">{unit}</span>
        </p>
        <p className="text-slate-400 text-sm mt-2">{subtitle}</p>
      </div>
    </div>
  );
};

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await api.getAnalyticsData();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch analytics data", error);
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
    <div className="max-w-[1200px] mx-auto flex flex-col gap-8 p-4 lg:p-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-lg">
            Your Journey, Sarah
          </h1>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-blue-200 text-xs font-semibold uppercase tracking-wider shadow-[0_0_10px_rgba(17,50,212,0.3)]">
              Focus
            </span>
            <p className="text-slate-400 text-lg font-medium">Strength & Stability</p>
          </div>
        </div>

        {/* Toggle */}
        <div className="p-2 rounded-full bg-[#151824] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.05)] flex gap-1 items-center">
          <button className="px-6 py-2.5 rounded-full text-sm font-semibold text-slate-400 hover:text-white transition-all hover:bg-[#1f2333]">Week</button>
          <button className="px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-primary shadow-[0_0_15px_rgba(17,50,212,0.5)]">Month</button>
          <button className="px-6 py-2.5 rounded-full text-sm font-semibold text-slate-400 hover:text-white transition-all hover:bg-[#1f2333]">Year</button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.metrics.map((metric, index) => (
          <StatCard 
            key={index}
            {...metric}
          />
        ))}
      </div>

      {/* Chart Section */}
      <div className="glass-panel rounded-[2.5rem] p-8 relative overflow-hidden min-h-[420px] flex flex-col">
        <div className="flex flex-wrap justify-between items-end mb-8 relative z-10">
          <div>
            <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-1">Performance Trends</h3>
            <div className="flex items-baseline gap-4">
              <h2 className="text-3xl font-bold text-white">Strength Progress</h2>
              <span className="text-green-400 text-sm font-medium bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20 flex items-center gap-1">
                <TrendingUp size={14} />
                Steady Growth
              </span>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(17,50,212,0.5)]"></span>
              <span className="text-sm text-slate-300">Volume Load</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-600"></span>
              <span className="text-sm text-slate-500">Projected</span>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1132d4" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#1132d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }} 
                dy={10}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e202e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#1132d4" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.insights.map((insight, index) => (
          <div key={index} className="glass-panel p-6 rounded-[2rem] flex items-center gap-6 relative overflow-hidden group hover:bg-white/5 transition-colors">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${
              insight.type === 'recovery' ? 'from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/20' : 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/20'
            } flex items-center justify-center border shadow-lg`}>
              {insight.type === 'recovery' ? <Activity size={32} /> : <Smile size={32} />}
            </div>
            <div className="flex-1 relative z-10">
              <h4 className="text-white text-lg font-bold mb-1">{insight.title}</h4>
              <p className="text-slate-400 text-sm leading-relaxed">{insight.description}</p>
            </div>
            <button className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors">
              <ArrowRight size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
