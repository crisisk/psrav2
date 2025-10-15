import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// --- Types ---

/**
 * Props for the RangeSlider component.
 * It uses a controlled component pattern, requiring `value` and `onChange`.
 */
export interface RangeSliderProps {
  /** The minimum allowed value for the range. */
  min: number;
  /** The maximum allowed value for the range. */
  max: number;
  /** The granularity of the slider values. */
  step: number;
  /** The current value of the range: [minRangeValue, maxRangeValue]. */
  value: [number, number];
  /** Callback function when the slider value changes. */
  onChange: (value: [number, number]) => void;
  /** Optional name for the form input (for form submission). */
  name?: string;
  /** Optional label for the slider. */
  label?: string;
  /** Optional error message for form validation. */
  error?: string;
  /** Optional boolean to disable the slider. */
  disabled?: boolean;
  /** Optional class name for custom styling of the container. */
  className?: string;
  /** Optional function to format the displayed value (e.g., add currency). */
  formatValue?: (value: number) => string;
}

// --- Utility Functions ---

/**
 * Calculates the percentage position of a value within a min/max range.
 * @param value The current value.
 * @param min The minimum value of the range.
 * @param max The maximum value of the range.
 * @returns The percentage (0 to 100).
 */
const getPercent = (value: number, min: number, max: number): number => {
  return ((value - min) / (max - min)) * 100;
};

/**
 * Clamps a value between a minimum and maximum.
 * @param value The value to clamp.
 * @param min The minimum bound.
 * @param max The maximum bound.
 * @returns The clamped value.
 */
const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// --- Component ---

/**
 * A dual-handle range slider component built with React and Tailwind CSS.
 * It supports min/max values, step, and is designed for form integration.
 * Sevensa Branding: Uses indigo-600 for the active track and handles.
 */
const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  step,
  value,
  onChange,
  name,
  label,
  error,
  disabled = false,
  className = '',
  formatValue = (v) => v.toString(),
}) => {
  const [minVal, maxVal] = value;
  const rangeRef = useRef<HTMLDivElement>(null);

  // Calculate percentage positions for styling
  const minPercent = useMemo(() => getPercent(minVal, min, max), [minVal, min, max]);
  const maxPercent = useMemo(() => getPercent(maxVal, min, max), [maxVal, min, max]);

  // --- Handlers ---

  /**
   * Handles changes to the minimum value input.
   */
  const handleMinChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newMinVal = Number(event.target.value);
    // Ensure new min value does not exceed the current max value
    const clampedMinVal = clamp(newMinVal, min, maxVal);
    onChange([clampedMinVal, maxVal]);
  }, [min, maxVal, onChange]);

  /**
   * Handles changes to the maximum value input.
   */
  const handleMaxChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newMaxVal = Number(event.target.value);
    // Ensure new max value is not less than the current min value
    const clampedMaxVal = clamp(newMaxVal, minVal, max);
    onChange([minVal, clampedMaxVal]);
  }, [max, minVal, onChange]);

  // --- Styling Classes ---

  const trackClass = 'absolute h-1 bg-gray-200 rounded-full w-full';
  const activeTrackClass = 'absolute h-1 bg-indigo-600 rounded-full';
  const handleBaseClass = `absolute w-5 h-5 rounded-full shadow-md transition-all duration-200 ease-in-out cursor-pointer z-20 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 ${
    disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-white border-2 border-indigo-600 hover:scale-110'
  }`;

  // --- Render ---

  return (
    <div className={`range-slider-container ${className} ${disabled ? 'opacity-60' : ''}`}>
      {/* Label and Value Display */}
      <div className="flex justify-between items-center mb-2">
        {label && (
          <label htmlFor={name} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="text-sm font-semibold text-gray-900">
          {formatValue(minVal)} - {formatValue(maxVal)}
        </div>
      </div>

      {/* Slider Area */}
      <div className="relative h-5 flex items-center" ref={rangeRef}>
        {/* Hidden Input Fields for Form Submission and Validation */}
        {/* These are the actual form elements that hold the value */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          onChange={handleMinChange}
          className="absolute pointer-events-none w-full h-0 opacity-0"
          aria-label="Minimum range value"
          name={name ? `${name}_min` : undefined}
          disabled={disabled}
          required={!!error} // Simple way to link error state to required attribute
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxVal}
          onChange={handleMaxChange}
          className="absolute pointer-events-none w-full h-0 opacity-0"
          aria-label="Maximum range value"
          name={name ? `${name}_max` : undefined}
          disabled={disabled}
          required={!!error}
        />

        {/* Track */}
        <div className={trackClass} />

        {/* Active Track (Fill) */}
        <div
          className={activeTrackClass}
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />

        {/* Min Handle (Visual) */}
        <div
          className={handleBaseClass}
          style={{
            left: `${minPercent}%`,
            transform: 'translateX(-50%)',
          }}
        >
          {/* Actual Range Input for Interactivity - Min */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={minVal}
            onChange={handleMinChange}
            disabled={disabled}
            className="absolute w-full h-full opacity-0 cursor-pointer z-30"
            style={{
              // This is a trick to make the input visually align with the handle
              // The actual input is a full-width range, but we only want to drag the handle
              // We use the visual handle as a proxy for the actual input
              // The z-index ensures it's clickable
              // The visual handle is positioned by the minPercent, and the input is full width
              // We rely on the browser's default range input behavior for dragging
              // For a true custom slider, we'd use mouse events, but this is simpler and more accessible
              left: 0,
              top: 0,
            }}
          />
        </div>

        {/* Max Handle (Visual) */}
        <div
          className={handleBaseClass}
          style={{
            left: `${maxPercent}%`,
            transform: 'translateX(-50%)',
          }}
        >
          {/* Actual Range Input for Interactivity - Max */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={maxVal}
            onChange={handleMaxChange}
            disabled={disabled}
            className="absolute w-full h-full opacity-0 cursor-pointer z-30"
            style={{
              left: 0,
              top: 0,
            }}
          />
        </div>
      </div>

      {/* Min/Max Value Labels */}
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default RangeSlider;