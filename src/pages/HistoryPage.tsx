import { useState, useEffect, useRef } from 'react';
import { format, startOfWeek, addWeeks, subWeeks, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2, Calendar } from 'lucide-react';
import { getMealsForDateRange, addOrUpdateMeal, deleteMeal } from '../storage';
import type { MealType, MealEntry } from '../types';

const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const mealColors: Record<MealType, string> = {
  breakfast: 'bg-amber-100/80 text-amber-800 ring-amber-200',
  lunch: 'bg-sky-100/80 text-sky-800 ring-sky-200',
  dinner: 'bg-indigo-100/80 text-indigo-800 ring-indigo-200',
};

const editRingColors: Record<MealType, string> = {
  breakfast: 'ring-amber-400 focus:ring-amber-500',
  lunch: 'ring-sky-400 focus:ring-sky-500',
  dinner: 'ring-indigo-400 focus:ring-indigo-500',
};

const typeLabel: Record<MealType, string> = {
  breakfast: 'B',
  lunch: 'L',
  dinner: 'D',
};

interface EditingCell {
  dateStr: string;
  type: MealType;
}

export default function HistoryPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [meals, setMeals] = useState<MealEntry[] | null>(null);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const weekEnd = addDays(weekStart, 6);
  const startStr = format(weekStart, 'yyyy-MM-dd');
  const endStr = format(weekEnd, 'yyyy-MM-dd');

  useEffect(() => {
    setMeals(null);
    getMealsForDateRange(startStr, endStr).then(setMeals);
  }, [startStr, endStr]);

  useEffect(() => {
    if (editingCell) inputRef.current?.focus();
  }, [editingCell]);

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayMeals = (meals ?? []).filter(m => m.date === dateStr);
    return { date, dateStr, dayMeals };
  });

  const isCurrentWeek = format(startOfWeek(new Date()), 'yyyy-MM-dd') === startStr;

  function startEdit(dateStr: string, type: MealType, currentName: string) {
    setEditingCell({ dateStr, type });
    setEditValue(currentName);
  }

  async function commitEdit() {
    if (!editingCell || saving) return;
    const { dateStr, type } = editingCell;
    const trimmed = editValue.trim();
    const existingMeal = meals?.find(m => m.date === dateStr && m.type === type);

    setEditingCell(null);

    if (trimmed === (existingMeal?.name ?? '')) return;

    setSaving(true);
    try {
      if (trimmed === '' && existingMeal) {
        await deleteMeal(existingMeal.id);
        setMeals(prev => prev?.filter(m => m.id !== existingMeal.id) ?? null);
      } else if (trimmed !== '') {
        const updated = await addOrUpdateMeal(dateStr, type, trimmed);
        setMeals(prev => {
          if (!prev) return prev;
          const without = prev.filter(m => !(m.date === dateStr && m.type === type));
          return [...without, updated];
        });
      }
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setEditingCell(null);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') cancelEdit();
  }

  function isEditing(dateStr: string, type: MealType) {
    return editingCell?.dateStr === dateStr && editingCell?.type === type;
  }

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
                        const editing = isEditing(dateStr, type);
                        return (
                          <td
                            key={type}
                            className="px-5 py-3"
                            onDoubleClick={() => !editing && startEdit(dateStr, type, meal?.name ?? '')}
                          >
                            {editing ? (
                              <input
                                ref={inputRef}
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={handleKeyDown}
                                placeholder="Add meal…"
                                className={`w-full px-2.5 py-1 text-xs rounded-full ring-1 ring-inset outline-none bg-white ${mealColors[type]} ${editRingColors[type]}`}
                              />
                            ) : meal ? (
                              <span
                                title="Double-click to edit"
                                className={`inline-block cursor-pointer px-3 py-1 rounded-full text-xs font-medium capitalize ring-1 ring-inset ${mealColors[type]} hover:brightness-95 transition-all`}
                              >
                                {meal.name}
                              </span>
                            ) : (
                              <span
                                title="Double-click to add"
                                className="text-slate-300 text-xs cursor-pointer hover:text-slate-400 transition-colors select-none"
                              >
                                —
                              </span>
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
                  <div className="space-y-1.5">
                    {mealTypes.map(type => {
                      const meal = dayMeals.find(m => m.type === type);
                      const editing = isEditing(dateStr, type);
                      return (
                        <div
                          key={type}
                          className="flex items-center gap-2"
                          onDoubleClick={() => !editing && startEdit(dateStr, type, meal?.name ?? '')}
                        >
                          <span className={`shrink-0 w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center ring-1 ring-inset ${mealColors[type]}`}>
                            {typeLabel[type]}
                          </span>
                          {editing ? (
                            <input
                              ref={inputRef}
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={handleKeyDown}
                              placeholder="Add meal…"
                              className={`flex-1 px-2 py-0.5 text-sm rounded-lg ring-1 ring-inset outline-none bg-white ${mealColors[type]} ${editRingColors[type]}`}
                            />
                          ) : meal ? (
                            <span className="text-sm text-slate-700 capitalize truncate cursor-pointer" title="Double-click to edit">
                              {meal.name}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300 cursor-pointer" title="Double-click to add">—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {saving && (
            <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2.5 bg-slate-900/90 text-white text-xs font-medium rounded-xl shadow-lg backdrop-blur-sm">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving…
            </div>
          )}
        </>
      )}
    </div>
  );
}
