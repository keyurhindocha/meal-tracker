import {
  format, startOfMonth, endOfMonth, subMonths, subDays,
  differenceInCalendarDays, parseISO, isAfter,
} from 'date-fns';
import type { MealEntry } from './types';

// Pure analytics computed from a single meal fetch — no queries here.

export interface PeriodStats {
  label: string;
  totalMeals: number;
  uniqueMeals: number;
  newMeals: number;
  daysLogged: number;
  completionRate: number;
  daysInPeriod: number;
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function daysAgo(date: string): number {
  return differenceInCalendarDays(new Date(), parseISO(date));
}

export function getMealFrequency(meals: MealEntry[]): { name: string; count: number }[] {
  const freq: Record<string, number> = {};
  for (const m of meals) {
    const key = m.name.toLowerCase();
    freq[key] = (freq[key] || 0) + 1;
  }
  return Object.entries(freq)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function getLastEatenMap(meals: MealEntry[]): { name: string; lastDate: string; daysAgo: number }[] {
  const lastEaten: Record<string, string> = {};
  for (const m of meals) {
    const key = m.name.toLowerCase();
    if (!lastEaten[key] || m.date > lastEaten[key]) {
      lastEaten[key] = m.date;
    }
  }
  return Object.entries(lastEaten)
    .map(([name, lastDate]) => ({ name, lastDate, daysAgo: daysAgo(lastDate) }))
    .sort((a, b) => b.daysAgo - a.daysAgo);
}

export function getMealsByType(meals: MealEntry[]): { type: string; count: number }[] {
  const counts = { breakfast: 0, lunch: 0, dinner: 0 };
  for (const m of meals) {
    counts[m.type]++;
  }
  return Object.entries(counts).map(([type, count]) => ({ type, count }));
}

export function getWeeklyTrend(meals: MealEntry[]): { week: string; meals: number }[] {
  const weeks: Record<string, number> = {};
  for (const m of meals) {
    const d = parseISO(m.date);
    const startOfWeek = subDays(d, d.getDay());
    const key = format(startOfWeek, 'yyyy-MM-dd');
    weeks[key] = (weeks[key] || 0) + 1;
  }
  return Object.entries(weeks)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([week, count]) => ({ week, meals: count }));
}

export function getCompletionRate(meals: MealEntry[]): { complete: number; total: number; rate: number } {
  const byDate: Record<string, Set<string>> = {};
  for (const m of meals) {
    (byDate[m.date] ??= new Set()).add(m.type);
  }
  const total = Object.keys(byDate).length;
  const complete = Object.values(byDate).filter(types => types.size === 3).length;
  return { complete, total, rate: total > 0 ? Math.round((complete / total) * 100) : 0 };
}

export function getStreakStats(meals: MealEntry[]): { current: number; longest: number; longestGap: number } {
  if (meals.length === 0) return { current: 0, longest: 0, longestGap: 0 };

  const dates = Array.from(new Set(meals.map(m => m.date))).sort();

  let longest = 1;
  let run = 1;
  let longestGap = 0;
  for (let i = 1; i < dates.length; i++) {
    const diff = differenceInCalendarDays(parseISO(dates[i]), parseISO(dates[i - 1]));
    if (diff === 1) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
      if (diff - 1 > longestGap) longestGap = diff - 1;
    }
  }

  const dateSet = new Set(dates);
  let current = 0;
  const today = new Date();
  for (let i = 0; ; i++) {
    if (dateSet.has(format(subDays(today, i), 'yyyy-MM-dd'))) current++;
    else break;
  }

  return { current, longest, longestGap };
}

export function getMonthlyComparison(meals: MealEntry[]): { thisMonth: PeriodStats; lastMonth: PeriodStats } {
  const today = new Date();
  const firstSeen = getFirstSeenMap(meals);

  function statsFor(start: Date, end: Date, label: string): PeriodStats {
    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');
    const periodMeals = meals.filter(m => m.date >= startStr && m.date <= endStr);
    const uniqueNames = new Set(periodMeals.map(m => m.name.toLowerCase()));
    const newMeals = Array.from(uniqueNames).filter(name => {
      const first = firstSeen[name];
      return first >= startStr && first <= endStr;
    }).length;

    const byDate: Record<string, Set<string>> = {};
    for (const m of periodMeals) (byDate[m.date] ??= new Set()).add(m.type);
    const complete = Object.values(byDate).filter(types => types.size === 3).length;

    const periodEnd = isAfter(end, today) ? today : end;
    const daysInPeriod = differenceInCalendarDays(periodEnd, start) + 1;
    const completionRate = daysInPeriod > 0 ? Math.round((complete / daysInPeriod) * 100) : 0;

    return {
      label,
      totalMeals: periodMeals.length,
      uniqueMeals: uniqueNames.size,
      newMeals,
      daysLogged: Object.keys(byDate).length,
      completionRate,
      daysInPeriod,
    };
  }

  const lastMonthDate = subMonths(today, 1);
  return {
    thisMonth: statsFor(startOfMonth(today), endOfMonth(today), format(today, 'MMM yyyy')),
    lastMonth: statsFor(startOfMonth(lastMonthDate), endOfMonth(lastMonthDate), format(lastMonthDate, 'MMM yyyy')),
  };
}

export function getTopMealByType(meals: MealEntry[]): Record<string, { name: string; count: number }> {
  const freq: Record<string, Record<string, number>> = { breakfast: {}, lunch: {}, dinner: {} };
  for (const m of meals) {
    const key = m.name.toLowerCase();
    freq[m.type][key] = (freq[m.type][key] || 0) + 1;
  }
  const result: Record<string, { name: string; count: number }> = {};
  for (const type of ['breakfast', 'lunch', 'dinner']) {
    const entries = Object.entries(freq[type]);
    if (entries.length > 0) {
      const [name, count] = entries.sort((a, b) => b[1] - a[1])[0];
      result[type] = { name, count };
    }
  }
  return result;
}

// ── Pattern insights ──

function getFirstSeenMap(meals: MealEntry[]): Record<string, string> {
  const firstSeen: Record<string, string> = {};
  for (const m of meals) {
    const key = m.name.toLowerCase();
    if (!firstSeen[key] || m.date < firstSeen[key]) firstSeen[key] = m.date;
  }
  return firstSeen;
}

function getDatesByName(meals: MealEntry[]): Record<string, string[]> {
  const byName: Record<string, Set<string>> = {};
  for (const m of meals) {
    (byName[m.name.toLowerCase()] ??= new Set()).add(m.date);
  }
  return Object.fromEntries(
    Object.entries(byName).map(([name, dates]) => [name, Array.from(dates).sort()])
  );
}

export interface RotationItem {
  name: string;
  count: number;
  avgGap: number;
  daysSince: number;
  /** Days until the meal is "due" again based on its usual cadence; negative = overdue. */
  dueIn: number;
}

/** Meals eaten on 3+ distinct days, with their usual repeat cadence. */
export function getRotation(meals: MealEntry[], limit = 8): RotationItem[] {
  const byName = getDatesByName(meals);
  const items: RotationItem[] = [];
  for (const [name, dates] of Object.entries(byName)) {
    if (dates.length < 3) continue;
    let gapSum = 0;
    for (let i = 1; i < dates.length; i++) {
      gapSum += differenceInCalendarDays(parseISO(dates[i]), parseISO(dates[i - 1]));
    }
    const avgGap = Math.round(gapSum / (dates.length - 1));
    const daysSince = daysAgo(dates[dates.length - 1]);
    items.push({ name, count: dates.length, avgGap, daysSince, dueIn: avgGap - daysSince });
  }
  return items.sort((a, b) => b.count - a.count).slice(0, limit);
}

export interface WeekdayPattern {
  weekday: string;
  total: number;
  top?: { name: string; count: number };
}

/** Most-eaten meal for each day of the week, Monday first. */
export function getWeekdayPatterns(meals: MealEntry[]): WeekdayPattern[] {
  const byDay: Record<number, Record<string, number>> = {};
  const totals: Record<number, number> = {};
  for (const m of meals) {
    const wd = parseISO(m.date).getDay();
    const key = m.name.toLowerCase();
    (byDay[wd] ??= {})[key] = (byDay[wd][key] || 0) + 1;
    totals[wd] = (totals[wd] || 0) + 1;
  }
  const order = [1, 2, 3, 4, 5, 6, 0];
  return order.map(wd => {
    const top = Object.entries(byDay[wd] ?? {}).sort((a, b) => b[1] - a[1])[0];
    return {
      weekday: WEEKDAY_NAMES[wd].slice(0, 3),
      total: totals[wd] || 0,
      top: top && top[1] >= 2 ? { name: top[0], count: top[1] } : undefined,
    };
  });
}

export interface MonthVariety {
  month: string;
  total: number;
  unique: number;
  newMeals: number;
  varietyPct: number;
}

/** Per-month totals, unique meals, and first-time meals for the last `months` months. */
export function getVarietyByMonth(meals: MealEntry[], months = 6): MonthVariety[] {
  const firstSeen = getFirstSeenMap(meals);
  const today = new Date();
  const result: MonthVariety[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const monthDate = subMonths(today, i);
    const startStr = format(startOfMonth(monthDate), 'yyyy-MM-dd');
    const endStr = format(endOfMonth(monthDate), 'yyyy-MM-dd');
    const periodMeals = meals.filter(m => m.date >= startStr && m.date <= endStr);
    const uniqueNames = new Set(periodMeals.map(m => m.name.toLowerCase()));
    const newMeals = Array.from(uniqueNames).filter(name => firstSeen[name] >= startStr).length;
    result.push({
      month: format(monthDate, 'MMM'),
      total: periodMeals.length,
      unique: uniqueNames.size,
      newMeals,
      varietyPct: periodMeals.length > 0 ? Math.round((uniqueNames.size / periodMeals.length) * 100) : 0,
    });
  }
  return result;
}

export interface OneHitWonder {
  name: string;
  date: string;
  daysAgo: number;
}

/** Meals eaten exactly once — candidates to revisit. */
export function getOneHitWonders(meals: MealEntry[]): OneHitWonder[] {
  const byName = getDatesByName(meals);
  const counts: Record<string, number> = {};
  for (const m of meals) {
    const key = m.name.toLowerCase();
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts)
    .filter(([, count]) => count === 1)
    .map(([name]) => {
      const date = byName[name][0];
      return { name, date, daysAgo: daysAgo(date) };
    })
    .sort((a, b) => b.daysAgo - a.daysAgo);
}

export interface Pairing {
  lunch: string;
  dinner: string;
  count: number;
}

/** Lunch + dinner combos that recur on the same day. */
export function getPairings(meals: MealEntry[], limit = 6): Pairing[] {
  const byDate: Record<string, { lunch?: string; dinner?: string }> = {};
  for (const m of meals) {
    if (m.type === 'lunch' || m.type === 'dinner') {
      (byDate[m.date] ??= {})[m.type] = m.name.toLowerCase();
    }
  }
  const combos: Record<string, number> = {};
  for (const day of Object.values(byDate)) {
    if (day.lunch && day.dinner) {
      const key = `${day.lunch}|${day.dinner}`;
      combos[key] = (combos[key] || 0) + 1;
    }
  }
  return Object.entries(combos)
    .filter(([, count]) => count >= 2)
    .map(([key, count]) => {
      const [lunch, dinner] = key.split('|');
      return { lunch, dinner, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export interface Insight {
  icon: 'heart' | 'calendar' | 'refresh' | 'sparkles' | 'compass';
  title: string;
  detail: string;
}

/** Auto-generated headline insights from eating patterns. */
export function getInsights(meals: MealEntry[]): Insight[] {
  if (meals.length === 0) return [];
  const insights: Insight[] = [];

  const freq = getMealFrequency(meals);
  const top = freq[0];
  if (top && top.count >= 3) {
    insights.push({
      icon: 'heart',
      title: `${top.name} is your go-to`,
      detail: `Logged ${top.count} times — ${Math.round((top.count / meals.length) * 100)}% of everything you've eaten.`,
    });
  }

  // Strongest weekday habit: a meal eaten 3+ times where most occurrences fall on one weekday
  const byName = getDatesByName(meals);
  let signature: { name: string; weekday: string; hits: number; total: number; share: number } | null = null;
  for (const [name, dates] of Object.entries(byName)) {
    if (dates.length < 3) continue;
    const dayCounts: Record<number, number> = {};
    for (const d of dates) {
      const wd = parseISO(d).getDay();
      dayCounts[wd] = (dayCounts[wd] || 0) + 1;
    }
    for (const [wd, hits] of Object.entries(dayCounts)) {
      const share = hits / dates.length;
      if (share >= 0.6 && (!signature || share > signature.share || (share === signature.share && dates.length > signature.total))) {
        signature = { name, weekday: WEEKDAY_NAMES[Number(wd)], hits, total: dates.length, share };
      }
    }
  }
  if (signature) {
    insights.push({
      icon: 'calendar',
      title: `${signature.name} is a ${signature.weekday} thing`,
      detail: `${signature.hits} of ${signature.total} times landed on a ${signature.weekday}.`,
    });
  }

  const overdue = getRotation(meals)
    .filter(r => r.dueIn <= -2)
    .sort((a, b) => a.dueIn - b.dueIn)[0];
  if (overdue) {
    insights.push({
      icon: 'refresh',
      title: `Due for a repeat: ${overdue.name}`,
      detail: `You usually have it every ~${overdue.avgGap} days — it's been ${overdue.daysSince}.`,
    });
  }

  // Discovery: only meaningful once tracking spans more than 30 days
  const firstSeen = getFirstSeenMap(meals);
  const earliest = meals.reduce((min, m) => (m.date < min ? m.date : min), meals[0].date);
  const cutoff = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  if (earliest < cutoff) {
    const recentNew = Object.entries(firstSeen)
      .filter(([, first]) => first >= cutoff)
      .sort((a, b) => b[1].localeCompare(a[1]));
    if (recentNew.length > 0) {
      const names = recentNew.slice(0, 3).map(([name]) => name).join(', ');
      insights.push({
        icon: 'sparkles',
        title: `${recentNew.length} new meal${recentNew.length !== 1 ? 's' : ''} in the last 30 days`,
        detail: `Latest first-tries: ${names}.`,
      });
    } else {
      const lastNew = Object.entries(firstSeen).sort((a, b) => b[1].localeCompare(a[1]))[0];
      insights.push({
        icon: 'compass',
        title: 'Nothing new in the last 30 days',
        detail: lastNew
          ? `Your last first-try was ${lastNew[0]}, ${daysAgo(lastNew[1])} days ago.`
          : 'Time to try something different?',
      });
    }
  }

  return insights.slice(0, 4);
}
