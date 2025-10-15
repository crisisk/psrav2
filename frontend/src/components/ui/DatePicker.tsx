import React, { useState, useRef, useEffect } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  parse,
} from "date-fns";

interface DatePickerProps {
  selectedDate: Date | null;
  onDateChange: (date: Date | null) => void; // Updated to allow null
  id?: string;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  calendarClassName?: string;
}

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// Sevensa Branding Colors
const SEVENSA_TEAL = "#00A896";
const SEVENSA_TEAL_HOVER = "#009284";
const SEVENSA_DARK = "#2D3A45";

const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onDateChange,
  id,
  name,
  placeholder = "Select date (YYYY-MM-DD)",
  disabled = false,
  className = "",
  inputClassName = "",
  calendarClassName = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(
    selectedDate ?? new Date()
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Format selected date for input display
  const formattedDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";

  // Handle input change (allow manual typing)
  const [inputValue, setInputValue] = useState(formattedDate);

  useEffect(() => {
    setInputValue(formattedDate);
  }, [formattedDate]);

  // Close calendar on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Toggle calendar visibility
  const toggleCalendar = () => {
    if (disabled) return;
    setIsOpen((open) => !open);
  };

  // Handle date selection
  const handleDateSelect = (day: Date) => {
    onDateChange(day);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    if (!inputValue) {
      onDateChange(null); // Allow clearing date by empty input
      return;
    }
    // Attempt to parse the date from the input value
    const parsed = parse(inputValue, "yyyy-MM-dd", new Date());
    if (!isNaN(parsed.getTime())) {
      onDateChange(parsed);
      setCurrentMonth(parsed);
    } else {
      // Reset input to last valid date
      setInputValue(formattedDate);
    }
  };

  // Generate calendar grid for currentMonth
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    calendarDays.push(day);
    day = addDays(day, 1);
  }

  // Accessibility ids
  const calendarId = id ? `${id}-calendar` : undefined;
  const inputId = id ?? undefined;

  // Keyboard navigation: manage focus on calendar days
  const [focusedDayIndex, setFocusedDayIndex] = useState<number | null>(null);

  // When calendar opens, focus selected date or today
  useEffect(() => {
    if (isOpen) {
      // Find index of selected date, or today, or first day of the grid
      const selectedIndex = calendarDays.findIndex((day) =>
        selectedDate ? isSameDay(day, selectedDate) : false
      );
      const todayIndex = calendarDays.findIndex((day) =>
        isSameDay(day, new Date())
      );
      // Focus the selected date, or today, or the first day of the month if neither is present
      const initialFocusIndex = selectedIndex >= 0 ? selectedIndex : todayIndex >= 0 ? todayIndex : calendarDays.findIndex(d => isSameMonth(d, currentMonth));
      setFocusedDayIndex(initialFocusIndex >= 0 ? initialFocusIndex : 0);
    } else {
      setFocusedDayIndex(null);
    }
  }, [isOpen, calendarDays, selectedDate, currentMonth]);

  // Handle keyboard navigation inside calendar grid
  const onCalendarKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (focusedDayIndex === null) return;

    let newIndex = focusedDayIndex;
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        newIndex = focusedDayIndex - 7;
        break;
      case "ArrowDown":
        e.preventDefault();
        newIndex = focusedDayIndex + 7;
        break;
      case "ArrowLeft":
        e.preventDefault();
        newIndex = focusedDayIndex - 1;
        break;
      case "ArrowRight":
        e.preventDefault();
        newIndex = focusedDayIndex + 1;
        break;
      case "Home":
        e.preventDefault();
        newIndex = focusedDayIndex - (focusedDayIndex % 7);
        break;
      case "End":
        e.preventDefault();
        newIndex = focusedDayIndex + (6 - (focusedDayIndex % 7));
        break;
      case "PageUp":
        e.preventDefault();
        setCurrentMonth((m) => subMonths(m, 1));
        return;
      case "PageDown":
        e.preventDefault();
        setCurrentMonth((m) => addMonths(m, 1));
        return;
      case "Enter":
      case " ":
        e.preventDefault();
        const day = calendarDays[focusedDayIndex];
        if (isSameMonth(day, currentMonth)) {
          handleDateSelect(day);
        }
        return;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.focus();
        return;
      default:
        return;
    }

    // Clamp index to valid range
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= calendarDays.length) newIndex = calendarDays.length - 1;

    setFocusedDayIndex(newIndex);
  };

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <div className="flex items-center space-x-2">
        <input
          type="text"
          id={inputId}
          name={name}
          ref={inputRef}
          className={`w-36 rounded border border-[${SEVENSA_DARK}] bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-[${SEVENSA_TEAL}] focus:outline-none focus:ring-1 focus:ring-[${SEVENSA_TEAL}] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 ${inputClassName}`}
          placeholder={placeholder}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={calendarId}
          aria-disabled={disabled}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => !disabled && setIsOpen(true)}
          autoComplete="off"
          disabled={disabled}
          spellCheck={false}
          inputMode="text" // Changed to text to allow hyphens
          pattern="\d{4}-\d{2}-\d{2}"
        />
        <button
          type="button"
          aria-label={isOpen ? "Close calendar" : "Open calendar"}
          onClick={toggleCalendar}
          disabled={disabled}
          className={`rounded border border-[${SEVENSA_DARK}] bg-white p-2 text-[${SEVENSA_DARK}] hover:bg-[#E6F4F1] focus:outline-none focus:ring-2 focus:ring-[${SEVENSA_TEAL}] disabled:cursor-not-allowed disabled:text-gray-400`}
          tabIndex={-1}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div
          ref={calendarRef}
          id={calendarId}
          role="dialog"
          aria-modal="true"
          aria-label="Calendar"
          tabIndex={0} // Make calendar focusable for keyboard navigation
          onKeyDown={onCalendarKeyDown}
          className={`absolute z-50 mt-2 w-64 sm:w-72 rounded border border-[${SEVENSA_DARK}] bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${calendarClassName}`}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
            <button
              type="button"
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
              aria-label="Previous month"
              className={`rounded p-1 text-[${SEVENSA_DARK}] hover:bg-[#E6F4F1] focus:outline-none focus:ring-2 focus:ring-[${SEVENSA_TEAL}]`}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <h2
              className={`text-sm font-semibold text-[${SEVENSA_DARK}]`}
              aria-live="polite"
              aria-atomic="true"
            >
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <button
              type="button"
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              aria-label="Next month"
              className={`rounded p-1 text-[${SEVENSA_DARK}] hover:bg-[#E6F4F1] focus:outline-none focus:ring-2 focus:ring-[${SEVENSA_TEAL}]`}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <table
            className="w-full border-collapse text-center text-xs select-none"
            role="grid"
            aria-labelledby={calendarId}
          >
            <thead>
              <tr>
                {WEEK_DAYS.map((day, idx) => (
                  <th
                    key={day}
                    scope="col"
                    className={`border-b border-gray-200 px-2 py-1 font-medium text-[${SEVENSA_DARK}]`}
                    role="columnheader"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: calendarDays.length / 7 }).map((_, weekIndex) => (
                <tr key={weekIndex} role="row">
                  {calendarDays
                    .slice(weekIndex * 7, weekIndex * 7 + 7)
                    .map((day, dayIndex) => {
                      const isCurrentMonth = isSameMonth(day, currentMonth);
                      const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                      const isToday = isSameDay(day, new Date());
                      const index = weekIndex * 7 + dayIndex;
                      const isFocused = focusedDayIndex === index;

                      // Determine classes for button
                      const baseClasses =
                        "mx-auto my-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors";

                      // Note: Tailwind JIT mode requires full class strings, so we use bracket notation for custom colors.
                      // We must ensure the hover color is also explicitly defined.
                      const selectedClasses = `bg-[${SEVENSA_TEAL}] text-white hover:bg-[${SEVENSA_TEAL_HOVER}] focus:ring-2 focus:ring-[${SEVENSA_TEAL}] focus:ring-offset-1`;
                      const unselectedClasses = `text-[${SEVENSA_DARK}] hover:bg-[#E6F4F1] focus:ring-2 focus:ring-[${SEVENSA_TEAL}] focus:ring-offset-1`;
                      const disabledClasses = "text-gray-400 cursor-default hover:bg-transparent";
                      const todayClasses = `border border-[${SEVENSA_TEAL}]`;

                      const buttonClasses = [
                        baseClasses,
                        isSelected ? selectedClasses : unselectedClasses,
                        !isCurrentMonth ? disabledClasses : "",
                        isToday && !isSelected ? todayClasses : "",
                        isFocused && !isSelected ? `ring-2 ring-[${SEVENSA_TEAL}] ring-offset-1` : "",
                      ]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <td key={day.toISOString()} className="p-0" role="gridcell">
                          <button
                            type="button"
                            onClick={() => isCurrentMonth && handleDateSelect(day)}
                            disabled={!isCurrentMonth}
                            className={buttonClasses}
                            aria-current={isSelected ? "date" : isToday ? "true" : undefined}
                            aria-selected={isSelected}
                            tabIndex={isFocused ? 0 : -1}
                            onFocus={() => setFocusedDayIndex(index)}
                          >
                            {format(day, "d")}
                          </button>
                        </td>
                      );
                    })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DatePicker;