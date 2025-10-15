import React, { TextareaHTMLAttributes } from 'react';

// Define the custom colors for Sevensa branding for reference
// Primary: #00A896 (A vibrant teal/cyan)
// Secondary: #2D3A45 (A dark slate/charcoal)

// Extend the standard Textarea HTML attributes and add custom props
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Optional label for the textarea, important for accessibility.
   */
  label?: string;
  /**
   * Optional description or hint text to display below the textarea.
   */
  hint?: string;
  /**
   * Optional error message to display, which also changes the border color.
   */
  error?: string;
  /**
   * Custom class names to apply to the textarea element.
   */
  className?: string;
}

/**
 * A production-ready, accessible, and responsive multi-line text input component.
 * It is styled using Tailwind CSS and incorporates Sevensa branding colors.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, id, className = '', ...rest }, ref) => {
    // Generate a unique ID if one is not provided for accessibility
    const textareaId = id || `textarea-${Math.random().toString(36).substring(2, 9)}`;

    // Base styling for the textarea
    const baseClasses = `
      block
      w-full
      px-3
      py-2
      text-base
      leading-6
      text-[#2D3A45]
      placeholder-gray-400
      bg-white
      border
      rounded-md
      shadow-sm
      transition
      duration-150
      ease-in-out
      appearance-none
      resize-y
      sm:text-sm
      focus:outline-none
      focus:ring-2
      focus:ring-offset-0
      focus:ring-[#00A896]
    `;

    // Error and default border styling
    const borderClasses = error
      ? 'border-red-500 focus:border-red-500'
      : 'border-gray-300 focus:border-gray-400';

    // Combine all classes
    const combinedClasses = `${baseClasses} ${borderClasses} ${className}`;

    return (
      <div className="w-full">
        {/* Label for accessibility */}
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-[#2D3A45] mb-1"
          >
            {label}
          </label>
        )}

        {/* Textarea element */}
        <textarea
          id={textareaId}
          ref={ref}
          className={combinedClasses}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
          {...rest}
        />

        {/* Error message */}
        {error && (
          <p className="mt-1 text-sm text-red-600" id={`${textareaId}-error`} role="alert">
            {error}
          </p>
        )}

        {/* Hint text */}
        {!error && hint && (
          <p className="mt-1 text-sm text-gray-500" id={`${textareaId}-hint`}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;