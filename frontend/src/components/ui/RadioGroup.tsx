import React, { useMemo } from 'react';

// Define the structure for a single radio option
export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// Define the props for the RadioGroup component
export interface RadioGroupProps {
  /** The unique name for the radio group (required for form submission and accessibility) */
  name: string;
  /** The list of options to display in the radio group */
  options: RadioOption[];
  /** The currently selected value */
  value: string;
  /** Callback function to handle value changes */
  onChange: (value: string) => void;
  /** Optional label for the entire radio group (for accessibility) */
  label?: string;
  /** Optional class name for the container */
  className?: string;
  /** Optional flag to display options horizontally */
  horizontal?: boolean;
}

// Custom Tailwind colors for Sevensa branding
// Primary: #00A896 (sevensa-primary)
// Secondary/Text: #2D3A45 (sevensa-dark)

const SEVENSA_PRIMARY = '#00A896';
const SEVENSA_DARK = '#2D3A45';

/**
 * A production-ready, accessible Radio Button Group component styled with Tailwind CSS.
 * It uses Sevensa branding colors and supports responsive horizontal/vertical layouts.
 */
const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  options,
  value,
  onChange,
  label,
  className = '',
  horizontal = false,
}) => {
  const containerClasses = useMemo(() => 
    // Responsive design: defaults to vertical, uses horizontal if prop is true, and wraps on small screens
    `flex flex-wrap ${horizontal ? 'flex-row space-x-6' : 'flex-col space-y-3'} ${className}`,
    [horizontal, className]
  );

  return (
    <div 
      className={`font-sans ${className}`}
      role="radiogroup"
      aria-labelledby={label ? `${name}-label` : undefined}
    >
      {label && (
        <span 
          id={`${name}-label`} 
          className="text-sm font-medium mb-2 block"
          style={{ color: SEVENSA_DARK }}
        >
          {label}
        </span>
      )}
      <div className={containerClasses}>
        {options.map((option) => {
          const isChecked = option.value === value;
          const disabled = option.disabled || false;

          const handleOptionChange = () => {
            if (!disabled) {
              onChange(option.value);
            }
          };

          // Tailwind classes for the custom radio button appearance
          // We use appearance-none and custom styling to ensure cross-browser consistency
          const radioClasses = `
            appearance-none 
            w-5 h-5 
            rounded-full 
            border-2 
            transition-all 
            duration-200 
            flex-shrink-0
            cursor-pointer
            focus:outline-none 
            focus:ring-2 
            focus:ring-offset-2 
            focus:ring-opacity-50
            ${disabled 
              ? 'border-gray-300 bg-gray-100 cursor-not-allowed' 
              : isChecked 
                ? 'border-transparent' 
                : 'border-gray-400 hover:border-gray-500'
            }
          `;

          // Dynamic styles for Sevensa branding and focus ring
          const checkedStyle = isChecked ? { 
            backgroundColor: SEVENSA_PRIMARY, 
            borderColor: SEVENSA_PRIMARY,
            boxShadow: `0 0 0 2px ${SEVENSA_PRIMARY}`, // Custom ring/focus effect
          } : {};

          const labelClasses = `
            ml-3 
            text-base 
            select-none
            ${disabled ? 'text-gray-500' : 'text-gray-800'}
            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          `;

          return (
            <label 
              key={option.value} 
              className="flex items-center"
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={isChecked}
                onChange={handleOptionChange}
                disabled={disabled}
                className={radioClasses}
                style={checkedStyle}
                // Accessibility attributes
                aria-checked={isChecked}
                aria-disabled={disabled}
                // The label element is wrapping the input, so no need for aria-label on input itself
              />
              <span className={labelClasses} style={{ color: disabled ? undefined : SEVENSA_DARK }}>
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default RadioGroup;