import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import {
  Code2,
  PlusCircle,
  TrendingUp,
  Award,
  AlertCircle,
  Calendar,
  Zap,
  BarChart3,
  PieChart as PieIcon,
  LineChart as LineIcon,
  Loader2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await API.get('/reviews/analytics');
        setAnalytics(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load analytics metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-indigo-400">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-xs font-medium">Computing Dashboard Analytics...</span>
      </div>
    );
  }

  const cards = [
    { title: 'Total Reviews', value: analytics?.totalReviews || 0, icon: Code2, color: 'text-indigo-400', bg: 'bg-indigo-600/10' },
    { title: 'Average Score', value: `${analytics?.averageScore || 0}/100`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-600/10' },
    { title: 'Most Used Language', value: analytics?.mostUsedLanguage || 'N/A', icon: Sparkles, color: 'text-cyan-400', bg: 'bg-cyan-600/10' },
    { title: 'Best Score', value: `${analytics?.bestScore || 0}/100`, icon: Award, color: 'text-amber-400', bg: 'bg-amber-600/10' },
    { title: 'Worst Score', value: `${analytics?.worstScore || 0}/100`, icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-600/10' },
    { title: 'Weekly Reviews', value: analytics?.weeklyReviews || 0, icon: Calendar, color: 'text-indigo-400', bg: 'bg-indigo-600/10' },
    { title: 'Monthly Reviews', value: analytics?.monthlyReviews || 0, icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-600/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900/60 via-slate-900 to-cyan-950/40 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> Real-time Analytics Active
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Developer Dashboard, {user?.name}! 👋
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Monitor code quality score trends, language distributions, performance benchmarks, and weekly review activity.
          </p>
          <div className="pt-2 flex flex-wrap gap-4">
            <Link
              to="/new-review"
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Start New Code Review
            </Link>
          </div>
        </div>
      </div>

      {/* 7 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-3 hover:border-slate-700 transition-all shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{card.title}</span>
                <div className={`p-2.5 rounded-xl ${card.bg} ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Bar Chart: Score Range Distribution */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" /> Score Range Distribution (Bar Chart)
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">Total: {analytics?.totalReviews}</span>
          </div>

          <div className="space-y-4 pt-2">
            {analytics?.scoreDistribution?.map((item) => {
              const percentage = analytics.totalReviews > 0
                ? Math.round((item.count / analytics.totalReviews) * 100)
                : 0;
              return (
                <div key={item.range} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span>Score Range {item.range}</span>
                    <span>{item.count} reviews ({percentage}%)</span>
                  </div>
                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Pie/Donut Chart: Language Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <PieIcon className="w-4 h-4 text-cyan-400" /> Language Breakdown (Pie Ratio)
            </h2>

            <div className="space-y-3">
              {analytics?.languageDistribution?.length === 0 ? (
                <p className="text-xs text-slate-400">No language data available.</p>
              ) : (
                analytics?.languageDistribution?.map((lang, idx) => {
                  const percent = analytics.totalReviews > 0
                    ? Math.round((lang.count / analytics.totalReviews) * 100)
                    : 0;
                  return (
                    <div key={idx} className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                        <span className="font-semibold text-slate-200">{lang.language}</span>
                      </div>
                      <span className="font-mono text-slate-400">{lang.count} ({percent}%)</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Line Chart: Timeline Activity Trend */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <LineIcon className="w-4 h-4 text-emerald-400" /> Review Timeline & Health Trend (Line Activity)
          </h2>
          <Link to="/history" className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
            View History <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {analytics?.timelineData?.length === 0 ? (
          <p className="text-xs text-slate-400 bg-slate-950 p-4 rounded-xl border border-slate-800">
            No historical timeline data recorded yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            {analytics?.timelineData?.map((item, idx) => (
              <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center space-y-1">
                <span className="text-[11px] font-mono text-slate-400">{item.date}</span>
                <p className="text-lg font-bold text-emerald-400">{item.avgScore}/100</p>
                <span className="text-[10px] text-slate-500">{item.count} reviews</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
