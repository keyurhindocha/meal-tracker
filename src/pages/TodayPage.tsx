import { useState, useCallback, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2, CheckCircle2, UtensilsCrossed } from 'lucide-react';
import { getMealsForDate } from '../storage';
import type { MealType, DayMeals } from '../types';
import MealCard from '../components/MealCard';

const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];

export default function TodayPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dayMeals, setDayMeals] = useState<DayMeals | null>(null);
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const loadMeals = useCallback(async (date: string) => {
    const meals = await getMealsForDate(date);
    setDayMeals(meals);
  }, []);

  useEffect(() => {
    loadMeals(dateStr);
  }, [dateStr, loadMeals]);

  const refresh = useCallback(() => {
    loadMeals(format(selectedDate, 'yyyy-MM-dd'));
  }, [selectedDate, loadMeals]);

  const changeDate = (offset: number) => {
    const newDate = offset > 0 ? addDays(selectedDate, offset) : subDays(selectedDate, Math.abs(offset));
    setSelectedDate(newDate);
  };

  const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
  const loggedCount = dayMeals
    ? [dayMeals.breakfast, dayMeals.lunch, dayMeals.dinner].filter(Boolean).length
    : 0;
  const progress = (loggedCount / 3) * 100;

  if (!dayMeals) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Hero header */}
      <div className="flex items-start justify-between gap-4 mb-6 md:mb-8">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md shadow-blue-500/30">
              <UtensilsCrossed className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
              {isToday ? 'Today' : format(selectedDate, 'EEEE')}
            </p>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight truncate">
            {format(selectedDate, 'MMMM d')}
          </h2>
          <p className="text-sm text-slate-500 mt-1">{format(selectedDate, 'yyyy')}</p>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-slate-500 transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          {!isToday && (
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1.5 text-xs font-semibold text-primary-700 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors"
            >
              Today
            </button>
          )}
          <button
            onClick={() => changeDate(1)}
            className="p-2 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-slate-500 transition-colors"
            aria-label="Next day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress card */}
      <div className="rounded-2xl bg-white card-soft p-4 md:p-5 mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {loggedCount === 3 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
            )}
            <span className="text-sm font-semibold text-slate-700">
              {loggedCount} of 3 meals logged
            </span>
          </div>
          <span className={`text-xs font-semibold ${loggedCount === 3 ? 'text-emerald-600' : 'text-slate-400'}`}>
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              loggedCount === 3
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                : 'bg-gradient-to-r from-primary-400 to-primary-600'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Meal cards */}
      <div className="grid gap-3 md:gap-4">
        {mealTypes.map(type => (
          <MealCard
            key={type}
            date={dateStr}
            type={type}
            meal={dayMeals[type]}
            onUpdate={refresh}
          />
        ))}
      </div>
    </div>
  );
}
