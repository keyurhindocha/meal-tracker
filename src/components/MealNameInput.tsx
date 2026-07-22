import { useState, useRef, useEffect } from 'react';
import { getUniqueMealNames } from '../storage';

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** Enter with no suggestion highlighted. */
  onCommit: () => void;
  /** Escape with the dropdown already closed. */
  onCancel: () => void;
  onBlur?: () => void;
  placeholder?: string;
  /** Classes for the <input> itself, so callers keep their own sizing. */
  className?: string;
  /** Classes for the positioning wrapper (e.g. flex sizing in a row). */
  wrapperClassName?: string;
  maxSuggestions?: number;
}

/**
 * Text input that suggests previously-used meal names as you type.
 * Shared by the Today cards and the History inline editors.
 */
export default function MealNameInput({
  value,
  onChange,
  onCommit,
  onCancel,
  onBlur,
  placeholder,
  className,
  wrapperClassName = 'w-full',
  maxSuggestions = 6,
}: Props) {
  const [names, setNames] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    let cancelled = false;
    getUniqueMealNames().then(loaded => {
      if (!cancelled) setNames(loaded);
    });
    return () => { cancelled = true; };
  }, []);

  const query = value.trim().toLowerCase();
  // Skip an exact match — picking it would be a no-op.
  const suggestions = query
    ? names.filter(n => n.includes(query) && n !== query).slice(0, maxSuggestions)
    : [];
  const showDropdown = open && suggestions.length > 0;

  function pick(name: string) {
    onChange(name);
    setOpen(false);
    setHighlighted(-1);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (showDropdown) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlighted(i => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlighted(i => (i <= 0 ? suggestions.length : i) - 1);
        return;
      }
      if (e.key === 'Enter' && highlighted >= 0) {
        e.preventDefault();
        pick(suggestions[highlighted]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        setHighlighted(-1);
        return;
      }
    }
    if (e.key === 'Enter') onCommit();
    if (e.key === 'Escape') onCancel();
  }

  return (
    <div className={`relative ${wrapperClassName}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setOpen(true);
          setHighlighted(-1);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          setOpen(false);
          onBlur?.();
        }}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        className={className}
      />
      {showDropdown && (
        <div
          role="listbox"
          className="absolute z-30 top-full mt-1.5 left-0 min-w-full w-max max-w-[16rem] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden scale-in"
        >
          {suggestions.map((s, i) => (
            <button
              key={s}
              type="button"
              role="option"
              aria-selected={i === highlighted}
              // Keep focus on the input so a blur-to-save caller doesn't
              // tear this row down before the click lands.
              onMouseDown={e => e.preventDefault()}
              onClick={() => pick(s)}
              onMouseEnter={() => setHighlighted(i)}
              className={`w-full text-left px-3.5 py-2.5 text-sm capitalize transition-colors ${
                i === highlighted ? 'bg-primary-50 text-primary-700' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
