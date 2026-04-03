import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isBefore,
  isAfter,
  startOfDay,
  parse,
} from 'date-fns';

interface DatePickerProps {
  value: string;            // yyyy-MM-dd
  onChange: (date: string) => void;
  min?: string;             // yyyy-MM-dd
  max?: string;             // yyyy-MM-dd
  label?: string;
  disabled?: boolean;
  placeholder?: string;
}

const WEEKDAY_KEYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function parseDate(s: string): Date {
  return parse(s, 'yyyy-MM-dd', new Date());
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  label,
  disabled = false,
  placeholder,
}: DatePickerProps) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t('components.datePicker.selectDate');
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(() =>
    value ? startOfMonth(parseDate(value)) : startOfMonth(new Date())
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = value ? parseDate(value) : null;
  const today = startOfDay(new Date());
  const minDate = min ? startOfDay(parseDate(min)) : undefined;
  const maxDate = max ? startOfDay(parseDate(max)) : undefined;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Sync viewMonth when value changes externally
  useEffect(() => {
    if (value) {
      setViewMonth(startOfMonth(parseDate(value)));
    }
  }, [value]);

  const handleSelect = useCallback((date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'));
    setOpen(false);
  }, [onChange]);

  const isDisabled = useCallback((date: Date) => {
    if (minDate && isBefore(date, minDate)) return true;
    if (maxDate && isAfter(date, maxDate)) return true;
    return false;
  }, [minDate, maxDate]);

  const canGoPrev = !minDate || isAfter(startOfMonth(viewMonth), startOfMonth(minDate));
  const canGoNext = !maxDate || isBefore(endOfMonth(viewMonth), startOfMonth(maxDate));

  // Build calendar grid (Monday-start weeks)
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const weeks: Date[][] = [];
  let day = calStart;
  while (day <= calEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  const displayValue = selected ? format(selected, 'MMM d, yyyy') : '';

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium mb-1.5 text-[var(--color-text)]">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={`
          w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-left
          rounded-[var(--radius-md)] border bg-[var(--color-surface)]
          transition-colors cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
          ${open
            ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20'
            : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
          }
        `}
      >
        <span className={displayValue ? 'text-[var(--color-text)]' : 'text-[var(--color-text-tertiary)]'}>
          {displayValue || resolvedPlaceholder}
        </span>
        <Calendar className="w-4 h-4 text-[var(--color-text-tertiary)] shrink-0" />
      </button>

      {/* Dropdown calendar */}
      {open && (
        <div
          className="absolute z-50 mt-1 w-[300px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] p-3 animate-[fadeIn_150ms_ease-out]"
          style={{ left: 0 }}
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => canGoPrev && setViewMonth(m => subMonths(m, 1))}
              disabled={!canGoPrev}
              className="p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label={t('components.datePicker.previousMonth')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span
              className="text-sm font-semibold text-[var(--color-text)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {format(viewMonth, 'MMMM yyyy')}
            </span>
            <button
              type="button"
              onClick={() => canGoNext && setViewMonth(m => addMonths(m, 1))}
              disabled={!canGoNext}
              className="p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label={t('components.datePicker.nextMonth')}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAY_KEYS.map(d => (
              <div
                key={d}
                className="text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Date grid */}
          <div className="grid grid-cols-7">
            {weeks.map((week, wi) =>
              week.map((date, di) => {
                const inMonth = isSameMonth(date, viewMonth);
                const isToday = isSameDay(date, today);
                const isSelected = selected ? isSameDay(date, selected) : false;
                const off = isDisabled(date);

                return (
                  <button
                    key={`${wi}-${di}`}
                    type="button"
                    disabled={off || !inMonth}
                    onClick={() => !off && inMonth && handleSelect(date)}
                    className={`
                      relative w-full aspect-square flex items-center justify-center
                      text-sm rounded-[var(--radius-sm)] transition-colors
                      ${!inMonth
                        ? 'text-[var(--color-text-tertiary)]/30 cursor-default'
                        : off
                          ? 'text-[var(--color-text-tertiary)] cursor-not-allowed opacity-40'
                          : isSelected
                            ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)] font-semibold'
                            : isToday
                              ? 'text-[var(--color-primary)] font-semibold hover:bg-[var(--color-primary-subtle)]'
                              : 'text-[var(--color-text)] hover:bg-[var(--color-hover)]'
                      }
                    `}
                  >
                    {date.getDate()}
                    {isToday && !isSelected && (
                      <span className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--color-primary)]" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-divider)]">
            <button
              type="button"
              onClick={() => {
                if (!isDisabled(today)) {
                  setViewMonth(startOfMonth(today));
                  handleSelect(today);
                }
              }}
              disabled={isDisabled(today)}
              className="text-xs font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t('components.datePicker.today')}
            </button>
            {selected && (
              <span className="text-xs text-[var(--color-text-tertiary)]">
                {format(selected, 'EEE, MMM d')}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
