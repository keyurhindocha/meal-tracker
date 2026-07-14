import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, ComposedChart, Line,
} from 'recharts';
import {
  Loader2, Flame, UtensilsCrossed, CheckCircle2, Sparkles, Sun, Cloud, Moon,
  Trophy, CalendarX2, TrendingUp, TrendingDown, Minus, BarChart3,
  Heart, CalendarHeart, RefreshCw, Compass, Repeat, Link2, Star,
} from 'lucide-react';
import { getAllMeals } from '../storage';
import {
  getMealFrequency, getLastEatenMap, getMealsByType, getWeeklyTrend,
  getCompletionRate, getTopMealByType, getStreakStats, getMonthlyComparison,
  getRotation, getWeekdayPatterns, getVarietyByMonth, getOneHitWonders,
  getPairings, getInsights,
} from '../analytics';
import type { Insight } from '../analytics';
import type { MealEntry } from '../types';

const TYPE_COLORS: Record<string, string> = { breakfast: '#f59e0b', lunch: '#0ea5e9', dinner: '#6366f1' };
const TYPE_GRADIENT: Record<string, string> = {
  breakfast: 'from-amber-50 to-orange-50',
  lunch: 'from-sky-50 to-cyan-50',
  dinner: 'from-indigo-50 to-violet-50',
};
const TYPE_RING: Record<string, string> = {
  breakfast: 'ring-amber-200',
  lunch: 'ring-sky-200',
  dinner: 'ring-indigo-200',
};
const TYPE_TEXT: Record<string, string> = {
  breakfast: 'text-amber-700',
  lunch: 'text-sky-700',
  dinner: 'text-indigo-700',
};
const TYPE_ICONS: Record<string, typeof Sun> = { breakfast: Sun, lunch: Cloud, dinner: Moon };

const INSIGHT_ICONS: Record<Insight['icon'], typeof Heart> = {
  heart: Heart,
  calendar: CalendarHeart,
  refresh: RefreshCw,
  sparkles: Sparkles,
  compass: Compass,
};
const INSIGHT_STYLES: Record<Insight['icon'], { gradient: string; ring: string; iconColor: string }> = {
  heart: { gradient: 'from-rose-50 to-pink-50', ring: 'ring-rose-200', iconColor: 'text-rose-500' },
  calendar: { gradient: 'from-violet-50 to-purple-50', ring: 'ring-violet-200', iconColor: 'text-violet-500' },
  refresh: { gradient: 'from-amber-50 to-orange-50', ring: 'ring-amber-200', iconColor: 'text-amber-600' },
  sparkles: { gradient: 'from-emerald-50 to-teal-50', ring: 'ring-emerald-200', iconColor: 'text-emerald-500' },
  compass: { gradient: 'from-sky-50 to-cyan-50', ring: 'ring-sky-200', iconColor: 'text-sky-500' },
};

const TOOLTIP_STYLE = {
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  fontSize: '13px',
  boxShadow: '0 8px 24px -8px rgba(15, 23, 42, 0.15)',
};

export default function AnalyticsPage() {
  const [meals, setMeals] = useState<MealEntry[] | null>(null);

  useEffect(() => {
    getAllMeals().then(setMeals);
  }, []);

  const data = useMemo(() => {
    if (!meals) return null;
    return {
      frequency: getMealFrequency(meals),
      lastEaten: getLastEatenMap(meals),
      byType: getMealsByType(meals),
      trend: getWeeklyTrend(meals),
      completion: getCompletionRate(meals),
      topByType: getTopMealByType(meals),
      streakStats: getStreakStats(meals),
      comparison: getMonthlyComparison(meals),
      rotation: getRotation(meals),
      weekdays: getWeekdayPatterns(meals),
      variety: getVarietyByMonth(meals),
      oneHits: getOneHitWonders(meals),
      pairings: getPairings(meals),
      insights: getInsights(meals),
    };
  }, [meals]);

  if (!data) {
    return (
      <div>
        <Header />
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  const {
    frequency, lastEaten, byType, trend, completion, topByType,
    streakStats, comparison, rotation, weekdays, variety, oneHits, pairings, insights,
  } = data;
  const topMeals = frequency.slice(0, 10);
  const totalMeals = frequency.reduce((sum, f) => sum + f.count, 0);
  const uniqueCount = frequency.length;
  const varietyScore = totalMeals > 0 ? Math.round((uniqueCount / totalMeals) * 100) : 0;

  if (totalMeals === 0) {
    return (
      <div>
        <Header />
        <div className="bg-white rounded-2xl card-soft p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed className="w-7 h-7 text-primary-600" />
          </div>
          <p className="text-slate-700 font-semibold">No meal data yet</p>
          <p className="text-slate-400 text-sm mt-1">Start logging meals to see your analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />

      {/* Auto-generated insights */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          {insights.map(insight => {
            const Icon = INSIGHT_ICONS[insight.icon];
            const style = INSIGHT_STYLES[insight.icon];
            return (
              <div key={insight.title} className={`rounded-2xl bg-gradient-to-br ${style.gradient} ring-1 ${style.ring} p-4 card-soft flex items-start gap-3`}>
                <div className="w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center shrink-0">
                  <Icon className={`w-5 h-5 ${style.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-slate-900 font-bold capitalize">{insight.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{insight.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Top stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard
          icon={<UtensilsCrossed className="w-5 h-5 text-primary-600" />}
          label="Total Meals"
          value={totalMeals.toString()}
          gradient="from-primary-50 to-blue-50"
        />
        <StatCard
          icon={<Flame className="w-5 h-5 text-orange-500" />}
          label="Streak"
          value={`${streakStats.current} day${streakStats.current !== 1 ? 's' : ''}`}
          gradient="from-orange-50 to-amber-50"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          label="Completion"
          value={`${completion.rate}%`}
          sub={`${completion.complete}/${completion.total} days`}
          gradient="from-emerald-50 to-green-50"
        />
        <StatCard
          icon={<Sparkles className="w-5 h-5 text-violet-500" />}
          label="Variety"
          value={`${uniqueCount} meals`}
          sub={`${varietyScore}% unique`}
          gradient="from-violet-50 to-purple-50"
        />
      </div>

      {/* Top meal by type */}
      {Object.keys(topByType).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          {(['breakfast', 'lunch', 'dinner'] as const).map(type => {
            const top = topByType[type];
            if (!top) return null;
            const Icon = TYPE_ICONS[type];
            return (
              <div key={type} className={`rounded-2xl bg-gradient-to-br ${TYPE_GRADIENT[type]} ring-1 ${TYPE_RING[type]} p-4 card-soft`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`w-4 h-4 ${TYPE_TEXT[type]}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${TYPE_TEXT[type]}`}>
                    Top {type}
                  </span>
                </div>
                <p className="text-slate-900 font-bold capitalize truncate">{top.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{top.count} time{top.count !== 1 ? 's' : ''}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Meal rotation */}
      {rotation.length > 0 && (
        <div className="bg-white rounded-2xl card-soft p-5 mb-5">
          <SectionTitle icon={<Repeat className="w-4 h-4 text-primary-500" />} title="Your Rotation" sub="How often your regulars come back around" />
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="py-2.5 text-left">Meal</th>
                  <th className="py-2.5 text-right">Eaten</th>
                  <th className="py-2.5 text-right">Cadence</th>
                  <th className="py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rotation.map(item => (
                  <tr key={item.name}>
                    <td className="py-3 text-slate-700 font-medium capitalize">{item.name}</td>
                    <td className="py-3 text-right text-slate-500 tabular-nums">{item.count}×</td>
                    <td className="py-3 text-right text-slate-500 tabular-nums">every ~{item.avgGap}d</td>
                    <td className="py-3 text-right">
                      <RotationStatus dueIn={item.dueIn} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Weekday patterns */}
      {weekdays.some(d => d.top) && (
        <div className="bg-white rounded-2xl card-soft p-5 mb-5">
          <SectionTitle icon={<CalendarHeart className="w-4 h-4 text-violet-500" />} title="Weekday Habits" sub="Your most-eaten meal for each day of the week" />
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {weekdays.map(day => (
              <div key={day.weekday} className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{day.weekday}</p>
                {day.top ? (
                  <>
                    <p className="text-xs font-semibold text-slate-800 capitalize mt-1 truncate" title={day.top.name}>{day.top.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{day.top.count}×</p>
                  </>
                ) : (
                  <p className="text-xs text-slate-300 mt-1">—</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <div className="bg-white rounded-2xl card-soft p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Most Eaten Meals</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topMeals} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} className="capitalize" />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl card-soft p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Meals by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={byType}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={55}
                paddingAngle={4}
                label={((props: { type?: string; percent?: number }) => `${props.type} ${((props.percent ?? 0) * 100).toFixed(0)}%`) as unknown as import('recharts').PieLabel}
              >
                {byType.map(entry => (
                  <Cell key={entry.type} fill={TYPE_COLORS[entry.type]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Variety & discovery */}
      {variety.some(v => v.total > 0) && (
        <div className="bg-white rounded-2xl card-soft p-5 mb-5">
          <SectionTitle icon={<Compass className="w-4 h-4 text-emerald-500" />} title="Variety & Discovery" sub="New meals tried each month, and how varied your eating was" />
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={variety}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f1f5f9' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar yAxisId="left" dataKey="newMeals" name="New meals tried" fill="#10b981" radius={[6, 6, 0, 0]} barSize={28} />
              <Line yAxisId="right" type="monotone" dataKey="varietyPct" name="Variety %" stroke="#8b5cf6" strokeWidth={2.5} dot={{ fill: '#8b5cf6', r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Pairings & one-hit wonders */}
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <div className="bg-white rounded-2xl card-soft p-5">
          <SectionTitle icon={<Link2 className="w-4 h-4 text-sky-500" />} title="Go-To Combos" sub="Lunch + dinner pairs that repeat on the same day" />
          {pairings.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {pairings.map(p => (
                <div key={`${p.lunch}|${p.dinner}`} className="flex items-center justify-between py-2.5 gap-2">
                  <span className="text-slate-700 font-medium capitalize truncate">
                    {p.lunch} <span className="text-slate-300 font-normal">+</span> {p.dinner}
                  </span>
                  <span className="text-sm font-bold tabular-nums text-slate-500 shrink-0">{p.count}×</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-4">No repeating lunch + dinner combos yet.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl card-soft p-5">
          <SectionTitle icon={<Star className="w-4 h-4 text-amber-500" />} title="One-Hit Wonders" sub={`${oneHits.length} meal${oneHits.length !== 1 ? 's' : ''} you've only had once — worth a rerun?`} />
          {oneHits.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {oneHits.slice(0, 8).map(({ name, date, daysAgo }) => (
                <div key={name} className="flex items-center justify-between py-2.5 gap-2">
                  <span className="text-slate-700 font-medium capitalize truncate">{name}</span>
                  <div className="text-right flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold tabular-nums text-slate-500">{daysAgo}d ago</span>
                    <span className="text-[10px] text-slate-400 hidden md:inline">{date}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-4">Every meal has been repeated at least once.</p>
          )}
        </div>
      </div>

      {/* Weekly trend */}
      {trend.length > 1 && (
        <div className="bg-white rounded-2xl card-soft p-5 mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Weekly Logging Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area
                type="monotone"
                dataKey="meals"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#trendGradient)"
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Streak records */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard
          icon={<Trophy className="w-5 h-5 text-yellow-500" />}
          label="Best Streak"
          value={`${streakStats.longest} day${streakStats.longest !== 1 ? 's' : ''}`}
          sub={streakStats.longest > 0 && streakStats.longest === streakStats.current ? 'current is your best!' : 'longest run'}
          gradient="from-yellow-50 to-amber-50"
        />
        <StatCard
          icon={<CalendarX2 className="w-5 h-5 text-rose-500" />}
          label="Longest Gap"
          value={`${streakStats.longestGap} day${streakStats.longestGap !== 1 ? 's' : ''}`}
          sub={streakStats.longestGap > 0 ? 'without logging' : 'no gaps yet'}
          gradient="from-rose-50 to-pink-50"
        />
      </div>

      {/* Month-over-month */}
      <div className="bg-white rounded-2xl card-soft p-5 mb-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Month-over-Month</h3>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <th className="py-2.5 text-left">Metric</th>
                <th className="py-2.5 text-right">{comparison.thisMonth.label}</th>
                <th className="py-2.5 text-right">{comparison.lastMonth.label}</th>
                <th className="py-2.5 text-right">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <ComparisonRow label="Meals logged" current={comparison.thisMonth.totalMeals} previous={comparison.lastMonth.totalMeals} />
              <ComparisonRow label="Unique meals" current={comparison.thisMonth.uniqueMeals} previous={comparison.lastMonth.uniqueMeals} />
              <ComparisonRow label="New meals tried" current={comparison.thisMonth.newMeals} previous={comparison.lastMonth.newMeals} />
              <ComparisonRow label="Completion %" current={comparison.thisMonth.completionRate} previous={comparison.lastMonth.completionRate} suffix="%" />
            </tbody>
          </table>
        </div>
      </div>

      {/* Haven't had in a while */}
      <div className="bg-white rounded-2xl card-soft p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Haven't Had in a While</h3>
        <div className="divide-y divide-slate-50">
          {lastEaten.slice(0, 10).map(({ name, daysAgo, lastDate }) => (
            <div key={name} className="flex items-center justify-between py-2.5 group">
              <span className="text-slate-700 font-medium capitalize truncate pr-2">{name}</span>
              <div className="text-right flex items-center gap-2 shrink-0">
                <span className={`text-sm font-bold tabular-nums ${daysAgo > 14 ? 'text-rose-500' : daysAgo > 7 ? 'text-amber-500' : 'text-slate-500'}`}>
                  {daysAgo}d
                </span>
                <span className="text-[10px] text-slate-400 hidden md:inline">{lastDate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="mb-6 md:mb-8">
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/30">
          <BarChart3 className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-700">Analytics</p>
      </div>
      <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Your patterns</h2>
      <p className="text-sm text-slate-500 mt-1">Insights from your logged meals</p>
    </div>
  );
}

function SectionTitle({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5">
        {icon}
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h3>
      </div>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function RotationStatus({ dueIn }: { dueIn: number }) {
  if (dueIn <= -2) {
    return (
      <span className="inline-block px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-xs font-bold ring-1 ring-rose-200">
        {-dueIn}d overdue
      </span>
    );
  }
  if (dueIn <= 1) {
    return (
      <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-xs font-bold ring-1 ring-amber-200">
        due now
      </span>
    );
  }
  return (
    <span className="inline-block px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 text-xs font-medium ring-1 ring-slate-200 tabular-nums">
      in ~{dueIn}d
    </span>
  );
}

function ComparisonRow({ label, current, previous, suffix = '' }: {
  label: string;
  current: number;
  previous: number;
  suffix?: string;
}) {
  const delta = current - previous;
  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const colorClass = delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-600' : 'text-slate-400';

  return (
    <tr>
      <td className="py-3 text-slate-700 font-medium">{label}</td>
      <td className="py-3 text-right text-slate-900 font-bold tabular-nums">{current}{suffix}</td>
      <td className="py-3 text-right text-slate-500 tabular-nums">{previous}{suffix}</td>
      <td className={`py-3 text-right font-bold tabular-nums ${colorClass}`}>
        <span className="inline-flex items-center gap-1 justify-end">
          <Icon className="w-3.5 h-3.5" />
          {delta > 0 ? '+' : ''}{delta}{suffix}
        </span>
      </td>
    </tr>
  );
}

function StatCard({ icon, label, value, sub, gradient }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  gradient: string;
}) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${gradient} ring-1 ring-slate-200/60 p-4 card-soft`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-xl font-bold text-slate-900 truncate">{value}</p>
      {sub && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}
