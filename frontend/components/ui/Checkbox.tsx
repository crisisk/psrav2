import React, { InputHTMLAttributes, LabelHTMLAttributes, useRef, useEffect, ReactNode } from 'react';

// Define the custom colors for Tailwind JIT/AOT compilation if not already in tailwind.config.js
// Primary: #00A896 (Sevensa Green)
// Secondary: #2D3A45 (Sevensa Dark)

// Utility function to generate the class for the checkbox state
const getCheckboxClasses = (checked: boolean, indeterminate: boolean) => {
  // Base classes for the custom-styled checkbox
  const baseClasses = 'appearance-none h-5 w-5 border-2 rounded-sm cursor-pointer transition-all duration-150 ease-in-out focus:ring-2 focus:ring-offset-2';
  
  // State-specific classes
  if (indeterminate) {
    // Indeterminate state: Dark border, green background, white dash
    return `${baseClasses} border-[#2D3A45] bg-[#00A896] focus:ring-[#00A896] 
            before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:h-0.5 before:w-3 before:bg-white`;
  } else if (checked) {
    // Checked state: Green border, green background, white checkmark (using a custom background image or icon for a true Tailwind-only approach is complex, so we'll simulate with a simple checkmark/icon placeholder)
    // For a production-ready component, an SVG icon is usually preferred. Here we use a simple background color change and a pseudo-element for a visual cue.
    return `${baseClasses} border-[#00A896] bg-[#00A896] focus:ring-[#00A896] 
            before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:h-3 before:w-1.5 before:border-r-2 before:border-b-2 before:border-white before:rotate-45`;
  } else {
    // Unchecked state: Dark border, white background
    return `${baseClasses} border-[#2D3A45] bg-white hover:border-[#00A896] focus:ring-[#00A896]`;
  }
};

// --- Types ---

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'checked'> {
  /** The label content to display next to the checkbox. */
  label?: ReactNode;
  /** If true, the checkbox will be in the indeterminate state. */
  indeterminate?: boolean;
  /** Whether the checkbox is checked. */
  checked: boolean;
  /** Props to be spread onto the label element. */
  labelProps?: LabelHTMLAttributes<HTMLLabelElement>;
}

// --- Component ---

/**
 * A production-ready Checkbox component with label and indeterminate state,
 * styled with Tailwind CSS using Sevensa branding colors.
 */
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      indeterminate = false,
      checked,
      className = '',
      labelProps,
      id,
      ...rest
    },
    ref
  ) => {
    const defaultRef = useRef<HTMLInputElement>(null);
    const resolvedRef = (ref as React.MutableRefObject<HTMLInputElement | null>) || defaultRef;
    const checkboxId = id || `checkbox-${Math.random().toString(36).substring(2, 9)}`;

    // Effect to handle the indeterminate state, which must be set via the DOM property
    useEffect(() => {
      if (resolvedRef.current) {
        resolvedRef.current.indeterminate = indeterminate;
      }
    }, [resolvedRef, indeterminate]);

    // Determine the classes based on state
    const customClasses = getCheckboxClasses(checked, indeterminate);

    return (
      <div className="flex items-center">
        <input
          ref={resolvedRef}
          id={checkboxId}
          type="checkbox"
          checked={checked}
          // The actual input is visually hidden and replaced by a styled div/pseudo-elements.
          // We use a custom class to style the input directly to maintain accessibility and form submission.
          className={`relative ${customClasses} ${className}`}
          // ARIA attributes for accessibility
          aria-checked={indeterminate ? 'mixed' : checked}
          {...rest}
        />
        {label && (
          <label
            htmlFor={checkboxId}
            className="ml-2 text-sm font-medium text-[#2D3A45] cursor-pointer select-none"
            {...labelProps}
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
