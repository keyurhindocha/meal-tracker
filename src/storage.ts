import { supabase } from './supabase';
import type { MealEntry, MealType, DayMeals } from './types';

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
