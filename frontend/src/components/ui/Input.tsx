import React, { InputHTMLAttributes, useId } from 'react';

// Define the Sevensa colors for easy reference and Tailwind JIT compilation
// Primary: #00A896 (Sevensa Green)
// Dark/Text: #2D3A45 (Sevensa Dark)

// Extend standard HTML input attributes and add custom props
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  className?: string;
}

/**
 * A production-ready, accessible, and responsive Input component.
 * It includes a label, handles error states, and is styled with Tailwind CSS
 * using Sevensa branding colors.
 */
const Input: React.FC<InputProps> = ({
  label,
  name,
  error,
  required = false,
  className = '',
  id: propId,
  ...rest
}) => {
  // Use useId for unique and accessible ID generation
  const generatedId = useId();
  const inputId = propId || generatedId;
  const errorId = `${inputId}-error`;

  // Base classes for the input field
  const baseInputClasses = `
    w-full p-3 border rounded-lg transition-all duration-200
    text-[#2D3A45] placeholder-gray-400 focus:outline-none
    focus:ring-2
    sm:text-base
  `;

  // Conditional classes based on error state
  const errorClasses = error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
    : 'border-gray-300 focus:border-[#00A896] focus:ring-[#00A896]/30';

  // Combined class names
  const inputClasses = `${baseInputClasses} ${errorClasses} ${className}`;

  return (
    <div className="flex flex-col space-y-1">
      {/* Label */}
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-[#2D3A45] cursor-pointer"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input Field */}
      <input
        id={inputId}
        name={name}
        required={required}
        className={inputClasses}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...rest}
      />

      {/* Error Message */}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-sm text-red-500 mt-1"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;