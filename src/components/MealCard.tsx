import { useState, useRef, useEffect } from 'react';
import type { MealType, MealEntry } from '../types';
import { addOrUpdateMeal, deleteMeal, getUniqueMealNames } from '../storage';
import { Sun, Cloud, Moon, Pencil, Trash2, Check, X, Plus } from 'lucide-react';

const mealConfig: Record<MealType, {
  icon: typeof Sun;
  label: string;
  iconColor: string;
  iconBg: string;
  ring: string;
  gradient: string;
}> = {
  breakfast: {
    icon: Sun,
    label: 'Breakfast',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-100',
    ring: 'ring-amber-200',
    gradient: 'from-amber-50 to-orange-50',
  },
  lunch: {
    icon: Cloud,
    label: 'Lunch',
    iconColor: 'text-sky-600',
    iconBg: 'bg-sky-100',
    ring: 'ring-sky-200',
    gradient: 'from-sky-50 to-cyan-50',
  },
  dinner: {
    icon: Moon,
    label: 'Dinner',
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-100',
    ring: 'ring-indigo-200',
    gradient: 'from-indigo-50 to-violet-50',
  },
};

interface Props {
  date: string;
  type: MealType;
  meal?: MealEntry;
  onUpdate: () => void;
}

export default function MealCard({ date, type, meal, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(meal?.name || '');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const config = mealConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const handleSave = async () => {
    if (value.trim()) {
      setSaving(true);
      await addOrUpdateMeal(date, type, value.trim());
      onUpdate();
      setSaving(false);
    }
    setEditing(false);
    setShowSuggestions(false);
  };

  const handleDelete = async () => {
    if (meal) {
      await deleteMeal(meal.id);
      setValue('');
      onUpdate();
    }
  };

  const handleInputChange = async (text: string) => {
    setValue(text);
    if (text.length > 0) {
      const allNames = await getUniqueMealNames();
      const filtered = allNames.filter(n => n.includes(text.toLowerCase()));
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (name: string) => {
    setValue(name);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  if (editing) {
    return (
      <div className={`rounded-2xl bg-gradient-to-br ${config.gradient} ring-1 ${config.ring} p-4 md:p-5 card-soft scale-in`}>
        <div className="flex items-center gap-2.5 mb-3">
          <div className={`w-8 h-8 rounded-lg ${config.iconBg} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${config.iconColor}`} />
          </div>
          <span className="font-semibold text-slate-800">{config.label}</span>
        </div>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => handleInputChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') { setEditing(false); setShowSuggestions(false); }
            }}
            placeholder="What did you eat?"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow shadow-sm"
          />
          {showSuggestions && (
            <div className="absolute z-10 top-full mt-1.5 w-full bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden scale-in">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => handleSuggestionClick(s)}
                  className="w-full text-left px-3.5 py-2.5 text-sm hover:bg-slate-50 capitalize transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary-500/30 active:scale-95 disabled:opacity-50 transition-all"
          >
            <Check className="w-4 h-4" /> Save
          </button>
          <button
            onClick={() => { setEditing(false); setShowSuggestions(false); setValue(meal?.name || ''); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 active:scale-95 transition-all border border-slate-200"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
        </div>
      </div>
    );
  }

  if (!meal) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="group w-full text-left rounded-2xl bg-white/60 ring-1 ring-slate-200 ring-dashed p-4 md:p-5 hover:ring-solid hover:ring-2 hover:ring-primary-300 hover:bg-white transition-all"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${config.iconBg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
            <Icon className={`w-5 h-5 ${config.iconColor}`} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{config.label}</p>
            <p className="text-sm text-slate-400 group-hover:text-primary-600 transition-colors flex items-center gap-1 mt-0.5">
              <Plus className="w-3.5 h-3.5" /> Add a meal
            </p>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className={`group relative rounded-2xl bg-gradient-to-br ${config.gradient} ring-1 ${config.ring} p-4 md:p-5 card-soft card-soft-hover`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl ${config.iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${config.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{config.label}</p>
          <p className="mt-0.5 text-base font-semibold text-slate-800 capitalize break-words">{meal.name}</p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity">
          <button
            onClick={() => { setValue(meal.name); setEditing(true); }}
            className="p-1.5 rounded-lg hover:bg-white/80 text-slate-400 hover:text-slate-700 active:scale-95 transition-all"
            aria-label="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 active:scale-95 transition-all"
            aria-label="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
