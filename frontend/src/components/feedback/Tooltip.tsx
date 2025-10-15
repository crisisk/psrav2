import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  Placement,
  FloatingArrow,
  arrow,
} from '@floating-ui/react';

// --- Types and Interfaces ---

/**
 * Defines the props for the Tooltip component.
 */
export interface TooltipProps {
  /** The element that the tooltip will be attached to. */
  children: React.ReactNode;
  /** The content to display inside the tooltip. */
  content: React.ReactNode;
  /** The placement of the tooltip relative to the trigger element. */
  placement?: Placement;
  /** Delay in milliseconds before the tooltip appears (on hover). */
  delay?: number;
  /** Custom class name for the tooltip content container. */
  className?: string;
}

// --- Constants ---

// Sevensa branding color (interpreted as a primary blue)
const SEVENSA_COLOR = 'bg-blue-600';
const SEVENSA_TEXT_COLOR = 'text-white';
const ARROW_COLOR = '#2563eb'; // Tailwind blue-600 in hex

// --- Component Implementation ---

const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  placement = 'top',
  delay = 300,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const arrowRef = useRef(null);

  // Floating UI setup
  const { x, y, reference, floating, strategy, context, middlewareData } = useFloating({
    placement,
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(8), // Offset the tooltip from the trigger
      flip(),    // Flip to the opposite side if it overflows
      shift(),   // Shift along the boundary if it still overflows
      arrow({ element: arrowRef }), // Add arrow middleware
    ],
    whileElementsMounted: autoUpdate, // Keep position updated
  });

  // Interaction hooks
  const hover = useHover(context, { move: false, delay: { open: delay, close: 100 } });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });

  // Combine interactions
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  // Tailwind CSS classes for styling
  const baseClasses = `
    ${SEVENSA_COLOR} ${SEVENSA_TEXT_COLOR}
    px-3 py-1.5 rounded-lg shadow-xl
    text-sm font-medium
    transition-all duration-300 ease-in-out transform origin-bottom
    pointer-events-none
    ${className}
  `;

  // Dynamic classes for animation (fade in/out and slight scale/translate)
  const animationClasses = isOpen
    ? 'opacity-100 visible scale-100'
    : 'opacity-0 invisible scale-95';

  // Render the trigger element
  const trigger = React.cloneElement(
    children as React.ReactElement,
    getReferenceProps({
      ref: reference,
      ...children.props,
      'aria-describedby': isOpen ? 'tooltip-content' : undefined,
    })
  );

  return (
    <>
      {trigger}
      {isOpen && (
        <div
          ref={floating}
          style={{
            position: strategy,
            top: y ?? 0,
            left: x ?? 0,
            zIndex: 50, // High z-index to ensure visibility
          }}
          className={`${baseClasses} ${animationClasses}`}
          {...getFloatingProps()}
          id="tooltip-content"
          role="tooltip"
        >
          {content}
          <FloatingArrow
            ref={arrowRef}
            context={context}
            fill={ARROW_COLOR}
            className="text-blue-600" // Tailwind class for the arrow's color
            // The arrow element is a path, so we use fill for the color
          />
        </div>
      )}
    </>
  );
};

export default Tooltip;