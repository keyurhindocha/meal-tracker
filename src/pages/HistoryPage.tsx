import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  format, startOfWeek, addWeeks, subWeeks, addDays,
  startOfMonth, addMonths, subMonths, isSameDay, isSameMonth,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2, Calendar, CalendarDays, Search, X } from 'lucide-react';
import { getMealsForDateRange, getAllMeals, addOrUpdateMeal, deleteMeal } from '../storage';
import MealNameInput from '../components/MealNameInput';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [meals, setMeals] = useState<MealEntry[] | null>(null);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [query, setQuery] = useState('');
  const [allMeals, setAllMeals] = useState<MealEntry[] | null>(null);
  const [loadingAll, setLoadingAll] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Dismiss the date picker on outside click / Escape.
  useEffect(() => {
    if (!showCalendar) return;
    function handlePointerDown(e: MouseEvent) {
      if (!calendarRef.current?.contains(e.target as Node)) setShowCalendar(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowCalendar(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showCalendar]);

  // The URL is the source of truth for which week is shown, so links like
  // /history?date=2026-01-19 (from Analytics) land on the right week and
  // any week stays bookmarkable.
  const dateParam = searchParams.get('date');
  const parsedParam = dateParam ? new Date(`${dateParam}T00:00:00`) : null;
  const weekStart = startOfWeek(
    parsedParam && !isNaN(parsedParam.getTime()) ? parsedParam : new Date()
  );

  function goToWeekOf(date: Date) {
    setSearchParams({ date: format(startOfWeek(date), 'yyyy-MM-dd') }, { replace: true });
  }

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
      setAllMeals(null); // invalidate the search cache
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setEditingCell(null);
  }

  function isEditing(dateStr: string, type: MealType) {
    return editingCell?.dateStr === dateStr && editingCell?.type === type;
  }

  // Search spans all history, so pull the full set the first time it's needed
  // rather than on every page load. Edits invalidate it (see commitEdit).
  function loadAllMeals() {
    if (allMeals || loadingAll) return;
    setLoadingAll(true);
    getAllMeals()
      .then(setAllMeals)
      .finally(() => setLoadingAll(false));
  }

  const trimmedQuery = query.trim().toLowerCase();
  const isSearching = trimmedQuery !== '';
  const results = isSearching && allMeals
    ? allMeals.filter(m => m.name.toLowerCase().includes(trimmedQuery))
    : [];

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
            onClick={() => goToWeekOf(subWeeks(weekStart, 1))}
            className="p-2 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-slate-500 transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => goToWeekOf(new Date())}
            disabled={isCurrentWeek}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
              isCurrentWeek
                ? 'text-slate-400 bg-slate-100 cursor-default'
                : 'text-primary-700 bg-primary-50 hover:bg-primary-100'
            }`}
          >
            This Week
          </button>
          {/* Wrapper owns dismissal so a click on the toggle doesn't close-then-reopen */}
          <div ref={calendarRef} className="relative">
            <button
              onClick={() => setShowCalendar(v => !v)}
              className={`block p-2 rounded-xl transition-colors ${
                showCalendar
                  ? 'bg-primary-50 text-primary-700'
                  : 'hover:bg-slate-100 active:bg-slate-200 text-slate-500'
              }`}
              aria-label="Jump to date"
              aria-expanded={showCalendar}
              title="Jump to date"
            >
              <CalendarDays className="w-5 h-5" />
            </button>
            {showCalendar && (
              <DatePickerPopover
                weekStart={weekStart}
                onSelect={date => {
                  goToWeekOf(date);
                  setShowCalendar(false);
                }}
              />
            )}
          </div>
          <button
            onClick={() => goToWeekOf(addWeeks(weekStart, 1))}
            className="p-2 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-slate-500 transition-colors"
            aria-label="Next week"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search across all history */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          value={query}
          onFocus={loadAllMeals}
          onChange={e => {
            setQuery(e.target.value);
            loadAllMeals();
          }}
          onKeyDown={e => e.key === 'Escape' && setQuery('')}
          placeholder="Search all meals…"
          className="w-full pl-10 pr-10 py-2.5 text-sm bg-white rounded-xl card-soft ring-1 ring-slate-200/60 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-primary-400 transition-shadow"
        />
        {isSearching && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isSearching ? (
        allMeals === null ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          </div>
        ) : (
          <SearchResults
            results={results}
            query={trimmedQuery}
            onPick={date => {
              goToWeekOf(new Date(`${date}T00:00:00`));
              setQuery('');
            }}
          />
        )
      ) : meals === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          {/* overflow-hidden rounds the table corners, but would clip the
              autocomplete dropdown — so drop it while a cell is being edited. */}
          <div className={`hidden md:block bg-white rounded-2xl card-soft ${editingCell ? '' : 'overflow-hidden'}`}>
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
                              <MealNameInput
                                value={editValue}
                                onChange={setEditValue}
                                onCommit={commitEdit}
                                onCancel={cancelEdit}
                                onBlur={commitEdit}
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
                            <MealNameInput
                              value={editValue}
                              onChange={setEditValue}
                              onCommit={commitEdit}
                              onCancel={cancelEdit}
                              onBlur={commitEdit}
                              placeholder="Add meal…"
                              wrapperClassName="flex-1 min-w-0"
                              className={`w-full px-2 py-0.5 text-sm rounded-lg ring-1 ring-inset outline-none bg-white ${mealColors[type]} ${editRingColors[type]}`}
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

        </>
      )}

      {saving && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2.5 bg-slate-900/90 text-white text-xs font-medium rounded-xl shadow-lg backdrop-blur-sm">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Saving…
        </div>
      )}
    </div>
  );
}

function SearchResults({ results, query, onPick }: {
  results: MealEntry[];
  query: string;
  onPick: (date: string) => void;
}) {
  if (results.length === 0) {
    return (
      <div className="bg-white rounded-2xl card-soft p-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
          <Search className="w-7 h-7 text-slate-300" />
        </div>
        <p className="text-slate-700 font-semibold">No meals match “{query}”</p>
        <p className="text-slate-400 text-sm mt-1">Try a different search term</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl card-soft overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {results.length} result{results.length !== 1 ? 's' : ''} for “{query}”
        </p>
        <p className="text-[10px] text-slate-400 hidden sm:block">Tap a result to open that week</p>
      </div>
      <div className="divide-y divide-slate-50">
        {results.map(meal => {
          const date = new Date(`${meal.date}T00:00:00`);
          return (
            <button
              key={meal.id}
              onClick={() => onPick(meal.date)}
              className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-slate-50/80 transition-colors group"
            >
              <span
                className={`shrink-0 w-6 h-6 rounded-md text-[10px] font-bold flex items-center justify-center ring-1 ring-inset ${mealColors[meal.type]}`}
                title={meal.type}
              >
                {typeLabel[meal.type]}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-slate-800 capitalize truncate">
                  {highlightMatch(meal.name, query)}
                </span>
                <span className="block text-xs text-slate-400 capitalize">{meal.type}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-sm font-semibold text-slate-600 tabular-nums">
                  {format(date, 'MMM d, yyyy')}
                </span>
                <span className="block text-xs text-slate-400">{dayNames[date.getDay()]}</span>
              </span>
              <ChevronRight className="w-4 h-4 shrink-0 text-slate-300 group-hover:text-primary-500 transition-colors" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function highlightMatch(name: string, query: string) {
  const idx = name.toLowerCase().indexOf(query);
  if (idx === -1) return name;
  return (
    <>
      {name.slice(0, idx)}
      <mark className="bg-amber-200/70 text-slate-900 rounded px-0.5">
        {name.slice(idx, idx + query.length)}
      </mark>
      {name.slice(idx + query.length)}
    </>
  );
}

function DatePickerPopover({ weekStart, onSelect }: {
  weekStart: Date;
  onSelect: (date: Date) => void;
}) {
  const [month, setMonth] = useState(() => startOfMonth(weekStart));

  const gridStart = startOfWeek(startOfMonth(month));
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const weekEndTime = addDays(weekStart, 6).getTime();
  const today = new Date();

  return (
    <div className="absolute right-0 top-full mt-2 z-40 w-[17rem] bg-white rounded-2xl card-soft ring-1 ring-slate-200/60 p-3">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setMonth(subMonths(month, 1))}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-slate-800">{format(month, 'MMMM yyyy')}</span>
        <button
          onClick={() => setMonth(addMonths(month, 1))}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {dayNames.map((name, i) => (
          <div key={i} className="text-center text-[10px] font-bold uppercase text-slate-400 py-1">
            {name[0]}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((date, i) => {
          const time = date.getTime();
          const inSelectedWeek = time >= weekStart.getTime() && time <= weekEndTime;
          const isToday = isSameDay(date, today);
          // A selected week fills exactly one row, so round only its Sun/Sat ends.
          const bandEdges = `${i % 7 === 0 ? 'rounded-l-lg ' : ''}${i % 7 === 6 ? 'rounded-r-lg' : ''}`;
          return (
            <button
              key={date.toISOString()}
              onClick={() => onSelect(date)}
              className={`h-8 text-xs transition-colors ${
                inSelectedWeek
                  ? `bg-primary-500 text-white font-bold ${bandEdges}`
                  : `rounded-lg hover:bg-slate-100 ${
                      isToday
                        ? 'text-primary-700 font-bold'
                        : isSameMonth(date, month)
                        ? 'text-slate-700 font-medium'
                        : 'text-slate-300'
                    }`
              }`}
            >
              {format(date, 'd')}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onSelect(new Date())}
        className="w-full mt-2 py-1.5 text-xs font-semibold text-primary-700 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors"
      >
        Jump to today
      </button>
    </div>
  );
}
