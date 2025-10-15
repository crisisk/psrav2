import React from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

// Define the props interface for the EmptyState component
interface EmptyStateProps {
  /** The icon to display in the empty state. */
  icon?: React.ReactNode;
  /** The main title or message. */
  title: string;
  /** A detailed description or secondary message. */
  description: string;
  /** The text for the optional action button. */
  buttonText?: string;
  /** The callback function for the action button click. */
  onAction?: () => void;
}

/**
 * A production-ready, accessible, and branded EmptyState component.
 * It provides a placeholder with an icon, message, and an optional action button.
 * Uses Tailwind CSS for styling and is designed with Sevensa branding in mind.
 * 
 * Accessibility Notes:
 * - The action button is a native <button> element, providing inherent keyboard navigation and semantics.
 * - The icon is marked with aria-hidden="true" if it's a default or cloned element, as it's decorative.
 * - The button has an implicit role="button" and is focusable.
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  buttonText,
  onAction,
}) => {
  // Use a default icon if none is provided
  const IconComponent = icon || (
    <ExclamationCircleIcon className="h-12 w-12 text-gray-400" aria-hidden="true" />
  );

  // Sevensa branding: using a clean, professional look with a primary blue for the button.
  // Using 'indigo' as a placeholder for a Sevensa-branded primary color.
  const primaryColor = 'indigo'; 

  return (
    <div className="text-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          {/* Ensure the icon is wrapped to apply size and color if it's a custom node */}
          {React.isValidElement(IconComponent) ? (
            React.cloneElement(IconComponent as React.ReactElement, {
              className: `h-12 w-12 text-${primaryColor}-500 mx-auto`,
              'aria-hidden': 'true',
            })
          ) : (
            <div className={`h-12 w-12 text-${primaryColor}-500 mx-auto`}>{IconComponent}</div>
          )}
        </div>

        {/* Title */}
        <h3 className="mt-2 text-lg font-medium text-gray-900">{title}</h3>

        {/* Description */}
        <p className="mt-1 text-sm text-gray-500">{description}</p>

        {/* Action Button (Optional) */}
        {buttonText && onAction && (
          <div className="mt-6">
            <button
              type="button"
              onClick={onAction}
              // Tailwind classes for Sevensa-branded button
              className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-${primaryColor}-600 hover:bg-${primaryColor}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${primaryColor}-500`}
              // Accessibility: The button text serves as the accessible label.
            >
              {buttonText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyState;