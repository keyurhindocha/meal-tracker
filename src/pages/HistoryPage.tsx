import { useState, useEffect } from 'react';
import { format, startOfWeek, addWeeks, subWeeks, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2, Calendar } from 'lucide-react';
import { getMealsForDateRange } from '../storage';
import type { MealType, MealEntry } from '../types';

const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const mealColors: Record<MealType, string> = {
  breakfast: 'bg-amber-100/80 text-amber-800 ring-amber-200',
  lunch: 'bg-sky-100/80 text-sky-800 ring-sky-200',
  dinner: 'bg-indigo-100/80 text-indigo-800 ring-indigo-200',
};

const typeLabel: Record<MealType, string> = {
  breakfast: 'B',
  lunch: 'L',
  dinner: 'D',
};

export default function HistoryPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [meals, setMeals] = useState<MealEntry[] | null>(null);

  const weekEnd = addDays(weekStart, 6);
  const startStr = format(weekStart, 'yyyy-MM-dd');
  const endStr = format(weekEnd, 'yyyy-MM-dd');

  useEffect(() => {
    setMeals(null);
    getMealsForDateRange(startStr, endStr).then(setMeals);
  }, [startStr, endStr]);

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayMeals = (meals ?? []).filter(m => m.date === dateStr);
    return { date, dateStr, dayMeals };
  });

  const isCurrentWeek = format(startOfWeek(new Date()), 'yyyy-MM-dd') === startStr;

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6 md:mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/30">
              <Calendar className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">History</p>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d')}
          </h2>
          <p className="text-sm text-slate-500 mt-1">{format(weekStart, 'yyyy')}</p>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <button
            onClick={() => setWeekStart(subWeeks(weekStart, 1))}
            className="p-2 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-slate-500 transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          {!isCurrentWeek && (
            <button
              onClick={() => setWeekStart(startOfWeek(new Date()))}
              className="px-3 py-1.5 text-xs font-semibold text-primary-700 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors"
            >
              This Week
            </button>
          )}
          <button
            onClick={() => setWeekStart(addWeeks(weekStart, 1))}
            className="p-2 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-slate-500 transition-colors"
            aria-label="Next week"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {meals === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl card-soft overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide w-24">Day</th>
                  {mealTypes.map(type => (
                    <th key={type} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      {type}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map(({ date, dateStr, dayMeals }) => {
                  const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
                  return (
                    <tr key={dateStr} className={`border-b border-slate-50 last:border-0 transition-colors ${isToday ? 'bg-primary-50/40' : 'hover:bg-slate-50/50'}`}>
                      <td className="px-5 py-3.5">
                        <div className="text-xs text-slate-400">{dayNames[date.getDay()]}</div>
                        <div className={`text-base font-semibold ${isToday ? 'text-primary-700' : 'text-slate-700'}`}>
                          {format(date, 'd')}
                        </div>
                      </td>
                      {mealTypes.map(type => {
                        const meal = dayMeals.find(m => m.type === type);
                        return (
                          <td key={type} className="px-5 py-3.5">
                            {meal ? (
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ring-1 ring-inset ${mealColors[type]}`}>
                                {meal.name}
                              </span>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden grid gap-3">
            {days.map(({ date, dateStr, dayMeals }) => {
              const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
              return (
                <div
                  key={dateStr}
                  className={`relative rounded-2xl p-4 transition-all ${
                    isToday
                      ? 'bg-gradient-to-br from-primary-50 to-white ring-2 ring-primary-200 card-soft'
                      : 'bg-white card-soft'
                  }`}
                >
                  <div className="flex items-baseline justify-between mb-2.5">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-xl font-bold ${isToday ? 'text-primary-700' : 'text-slate-800'}`}>
                        {format(date, 'd')}
                      </span>
                      <span className={`text-xs font-semibold uppercase tracking-wide ${isToday ? 'text-primary-600' : 'text-slate-400'}`}>
                        {dayNames[date.getDay()]}
                      </span>
                    </div>
                    {isToday && (
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-primary-600 text-white px-2 py-0.5 rounded-full">
                        Today
                      </span>
                    )}
                  </div>
                  {dayMeals.length > 0 ? (
                    <div className="space-y-1.5">
                      {dayMeals.map(m => (
                        <div key={m.id} className="flex items-center gap-2">
                          <span className={`shrink-0 w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center ring-1 ring-inset ${mealColors[m.type]}`}>
                            {typeLabel[m.type]}
                          </span>
                          <span className="text-sm text-slate-700 capitalize truncate">{m.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">No meals logged</span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
