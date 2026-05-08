import {
  format, startOfMonth, endOfMonth, subMonths,
  differenceInCalendarDays, parseISO, isAfter,
} from 'date-fns';
import { supabase } from './supabase';
import type { MealEntry, MealType, DayMeals } from './types';

export interface PeriodStats {
  label: string;
  totalMeals: number;
  uniqueMeals: number;
  newMeals: number;
  daysLogged: number;
  completionRate: number;
  daysInPeriod: number;
}

export async function getAllMeals(): Promise<MealEntry[]> {
  const { data, error } = await supabase
    .from('meal_entries')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw error;
  return data as MealEntry[];
}

export async function addOrUpdateMeal(date: string, type: MealType, name: string): Promise<MealEntry> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('meal_entries')
    .upsert(
      { user_id: user.id, date, type, name: name.trim() },
      { onConflict: 'user_id,date,type' }
    )
    .select()
    .single();

  if (error) throw error;
  return data as MealEntry;
}

export async function deleteMeal(id: string): Promise<void> {
  const { error } = await supabase
    .from('meal_entries')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getMealsForDate(date: string): Promise<DayMeals> {
  const { data, error } = await supabase
    .from('meal_entries')
    .select('*')
    .eq('date', date);

  if (error) throw error;

  const day: DayMeals = { date };
  for (const meal of (data as MealEntry[])) {
    day[meal.type] = meal;
  }
  return day;
}

export async function getMealsForDateRange(startDate: string, endDate: string): Promise<MealEntry[]> {
  const { data, error } = await supabase
    .from('meal_entries')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) throw error;
  return data as MealEntry[];
}

export async function getUniqueMealNames(): Promise<string[]> {
  const meals = await getAllMeals();
  const names = new Set(meals.map(m => m.name.toLowerCase()));
  return Array.from(names).sort();
}

// ── Analytics queries ──

export async function getMealFrequency(): Promise<{ name: string; count: number }[]> {
  const meals = await getAllMeals();
  const freq: Record<string, number> = {};
  for (const m of meals) {
    const key = m.name.toLowerCase();
    freq[key] = (freq[key] || 0) + 1;
  }
  return Object.entries(freq)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getLastEatenMap(): Promise<{ name: string; lastDate: string; daysAgo: number }[]> {
  const meals = await getAllMeals();
  const lastEaten: Record<string, string> = {};
  for (const m of meals) {
    const key = m.name.toLowerCase();
    if (!lastEaten[key] || m.date > lastEaten[key]) {
      lastEaten[key] = m.date;
    }
  }
  const today = new Date();
  return Object.entries(lastEaten)
    .map(([name, lastDate]) => {
      const diff = Math.floor((today.getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
      return { name, lastDate, daysAgo: diff };
    })
    .sort((a, b) => b.daysAgo - a.daysAgo);
}

export async function getMealsByType(): Promise<{ type: string; count: number }[]> {
  const meals = await getAllMeals();
  const counts = { breakfast: 0, lunch: 0, dinner: 0 };
  for (const m of meals) {
    counts[m.type]++;
  }
  return Object.entries(counts).map(([type, count]) => ({ type, count }));
}

export async function getWeeklyTrend(): Promise<{ week: string; meals: number }[]> {
  const meals = await getAllMeals();
  const weeks: Record<string, number> = {};
  for (const m of meals) {
    const d = new Date(m.date);
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - d.getDay());
    const key = startOfWeek.toISOString().split('T')[0];
    weeks[key] = (weeks[key] || 0) + 1;
  }
  return Object.entries(weeks)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([week, meals]) => ({ week, meals }));
}

export async function getLoggingStreak(): Promise<number> {
  const meals = await getAllMeals();
  const datesWithMeals = new Set(meals.map(m => m.date));
  let streak = 0;
  const today = new Date();
  for (let i = 0; ; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (datesWithMeals.has(key)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export async function getCompletionRate(): Promise<{ complete: number; total: number; rate: number }> {
  const meals = await getAllMeals();
  const byDate: Record<string, Set<string>> = {};
  for (const m of meals) {
    (byDate[m.date] ??= new Set()).add(m.type);
  }
  const total = Object.keys(byDate).length;
  const complete = Object.values(byDate).filter(types => types.size === 3).length;
  return { complete, total, rate: total > 0 ? Math.round((complete / total) * 100) : 0 };
}

export async function getStreakStats(): Promise<{ current: number; longest: number; longestGap: number }> {
  const meals = await getAllMeals();
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
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (dateSet.has(format(d, 'yyyy-MM-dd'))) current++;
    else break;
  }

  return { current, longest, longestGap };
}

export async function getMonthlyComparison(): Promise<{ thisMonth: PeriodStats; lastMonth: PeriodStats }> {
  const meals = await getAllMeals();
  const today = new Date();

  const firstSeen: Record<string, string> = {};
  for (const m of meals) {
    const key = m.name.toLowerCase();
    if (!firstSeen[key] || m.date < firstSeen[key]) firstSeen[key] = m.date;
  }

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

export async function getTopMealByType(): Promise<Record<string, { name: string; count: number }>> {
  const meals = await getAllMeals();
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
