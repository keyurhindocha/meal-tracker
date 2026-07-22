import { useState, useEffect, useMemo } from 'react';
import { format, startOfWeek, addWeeks, subWeeks, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2, CalendarDays } from 'lucide-react';
import { getMealsForDateRange } from '../storage';
import type { MealEntry, MealType } from '../types';

const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const dotColors: Record<MealType, string> = {
  breakfast: 'bg-amber-400',
  lunch: 'bg-sky-400',
  dinner: 'bg-indigo-400',
};

const WEEKS = 6;

export default function OverviewPage() {
  const [anchor, setAnchor] = useState(() => subWeeks(startOfWeek(new Date()), WEEKS - 1));
  const [meals, setMeals] = useState<MealEntry[] | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const endDate = addDays(addWeeks(anchor, WEEKS), -1);
  const startStr = format(anchor, 'yyyy-MM-dd');
  const endStr = format(endDate, 'yyyy-MM-dd');

  useEffect(() => {
    setMeals(null);
    getMealsForDateRange(startStr, endStr).then(setMeals);
  }, [startStr, endStr]);

  const mealsByDate = useMemo(() => {
    if (!meals) return {};
    const map: Record<string, MealEntry[]> = {};
    for (const m of meals) (map[m.date] ??= []).push(m);
    return map;
  }, [meals]);

  const weeks = useMemo(() => {
    return Array.from({ length: WEEKS }, (_, w) => {
      const weekStart = addWeeks(anchor, w);
      return Array.from({ length: 7 }, (_, d) => {
        const date = addDays(weekStart, d);
        return { date, dateStr: format(date, 'yyyy-MM-dd') };
      });
    });
  }, [anchor]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const goBack = () => setAnchor(subWeeks(anchor, WEEKS));
  const goForward = () => setAnchor(addWeeks(anchor, WEEKS));
  const goToNow = () => setAnchor(subWeeks(startOfWeek(new Date()), WEEKS - 1));
  const showingCurrent = format(subWeeks(startOfWeek(new Date()), WEEKS - 1), 'yyyy-MM-dd') === startStr;

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6 md:mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/30">
              <CalendarDays className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Overview</p>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            {WEEKS} Weeks
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {format(anchor, 'MMM d')} – {format(endDate, 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <button onClick={goBack} className="p-2 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-slate-500 transition-colors" aria-label="Earlier">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNow}
            disabled={showingCurrent}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
              showingCurrent
                ? 'text-slate-400 bg-slate-100 cursor-default'
                : 'text-primary-700 bg-primary-50 hover:bg-primary-100'
            }`}
          >
            Current
          </button>
          <button onClick={goForward} className="p-2 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-slate-500 transition-colors" aria-label="Later">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 mb-4">
        {(['breakfast', 'lunch', 'dinner'] as MealType[]).map(type => (
          <div key={type} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${dotColors[type]}`} />
            <span className="text-xs font-medium text-slate-500 capitalize">{type}</span>
          </div>
        ))}
      </div>

      {meals === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl card-soft overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
            {dayHeaders.map(d => (
              <div key={d} className="px-1 py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map(({ date, dateStr }) => {
                const isToday = dateStr === todayStr;
                const dayMeals = mealsByDate[dateStr] || [];
                const isHovered = hoveredCell === dateStr;
                const fullyLogged = dayMeals.length === 3;

                return (
                  <div
                    key={dateStr}
                    className={`relative px-1 py-2 md:px-2 md:py-2.5 min-h-[56px] md:min-h-[68px] transition-colors cursor-default
                      ${isToday ? 'bg-gradient-to-br from-primary-50 to-white ring-2 ring-inset ring-primary-300' : 'hover:bg-slate-50'}`}
                    onMouseEnter={() => setHoveredCell(dateStr)}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    <div className={`text-xs md:text-sm font-semibold mb-1.5 ${isToday ? 'text-primary-700' : fullyLogged ? 'text-slate-700' : 'text-slate-500'}`}>
                      {format(date, 'd')}
                    </div>

                    <div className="flex gap-1">
                      {(['breakfast', 'lunch', 'dinner'] as MealType[]).map(type => {
                        const has = dayMeals.some(m => m.type === type);
                        return (
                          <span
                            key={type}
                            className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-colors ${has ? dotColors[type] : 'bg-slate-200'}`}
                          />
                        );
                      })}
                    </div>

                    {isHovered && dayMeals.length > 0 && (
                      <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-slate-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl whitespace-nowrap pointer-events-none scale-in">
                        {dayMeals.map(m => (
                          <div key={m.id} className="capitalize">
                            <span className="text-slate-400">{m.type}:</span> {m.name}
                          </div>
                        ))}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-900" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
