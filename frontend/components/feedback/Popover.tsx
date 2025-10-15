import React, { useState, useMemo, useRef, cloneElement, isValidElement, useEffect } from 'react';
import {
  useFloating,
  useInteractions,
  useClick,
  useHover,
  useRole,
  useDismiss,
  FloatingArrow,
  arrow,
  offset,
  flip,
  shift,
  autoUpdate,
  Placement,
} from '@floating-ui/react';

// Define the assumed Sevensa brand color for the arrow fill
const SEVENSA_PRIMARY_COLOR = '#007bff';

interface PopoverProps {
  /** The element that triggers the popover (e.g., a button). */
  trigger: React.ReactElement;
  /** The content to display inside the popover. */
  content: React.ReactNode;
  /** The preferred placement of the popover relative to the trigger. */
  placement?: Placement;
  /** The interaction type to open the popover. */
  triggerType?: 'click' | 'hover' | 'both';
  /** Optional class name for the popover content container. */
  className?: string;
}

/**
 * A production-ready Popover component using Floating UI and Tailwind CSS.
 * It supports custom placement, click/hover triggers, smooth animations, and an arrow.
 * 
 * Note: The component assumes a Tailwind CSS configuration with 'sevensa-primary' color
 * and 'fade-in'/'fade-out' keyframes for smooth transitions.
 */
const Popover: React.FC<PopoverProps> = ({
  trigger,
  content,
  placement = 'top',
  triggerType = 'click',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Handle mounting/unmounting for smooth fade-out animation
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
    } else {
      // Delay unmounting until the fade-out animation (0.15s) is complete
      const timeout = setTimeout(() => setIsMounted(false), 150);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);
  const arrowRef = useRef(null);

  const { x, y, refs, strategy, context, middlewareData, placement: finalPlacement } = useFloating({
    placement,
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(10), // Offset the popover from the trigger
      flip(), // Flip to the opposite side if it overflows
      shift(), // Shift along the reference to keep it in view
      arrow({ element: arrowRef, padding: 10 }), // Add the arrow middleware
    ],
    whileElementsMounted: autoUpdate, // Keep position updated
  });

  const click = useClick(context, { enabled: triggerType === 'click' || triggerType === 'both' });
  const hover = useHover(context, {
    enabled: triggerType === 'hover' || triggerType === 'both',
    move: false, // Don't open on mouse move, only on enter/leave
    delay: {
      open: 100,
      close: 200,
    },
  });
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    hover,
    role,
    dismiss,
  ]);

  // Determine the side of the floating element where the arrow is attached
  const staticSide = {
    top: 'bottom',
    right: 'left',
    bottom: 'top',
    left: 'right',
  }[finalPlacement.split('-')[0]] as 'top' | 'right' | 'bottom' | 'left';

  // Clone the trigger element to inject the necessary ref and event handlers
  const referenceElement = useMemo(() => {
    if (!isValidElement(trigger)) {
      console.error('Popover trigger must be a valid React element.');
      return null;
    }
    return cloneElement(trigger, getReferenceProps({ ref: refs.setReference }));
  }, [trigger, getReferenceProps, refs.setReference]);

  if (!referenceElement) {
    return null;
  }

  return (
    <>
      {/* 1. The Trigger Element */}
      {referenceElement}

      {/* 2. The Popover Content */}
      {isMounted && (
        <div
          ref={refs.setFloating}
          style={{
            position: strategy,
            top: y ?? 0,
            left: x ?? 0,
            zIndex: 50, // High z-index to ensure it's on top
            // The arrow middleware provides the necessary CSS properties for the arrow
          }}
          className={`
            bg-white
            text-gray-800
            rounded-lg
            shadow-xl
            p-3
            border
            border-gray-200
            max-w-xs
            transition-opacity
            duration-150
            ease-out
            ${className}
            ${isOpen ? 'animate-fade-in' : 'animate-fade-out'}
          `}
          {...getFloatingProps({
            'aria-labelledby': 'popover-heading',
            'aria-describedby': 'popover-content',
          })}
        >
          {/* Popover Content */}
          <div id="popover-content">
            {content}
          </div>

          {/* 3. The Arrow */}
          <FloatingArrow
            ref={arrowRef}
            context={context}
            fill={SEVENSA_PRIMARY_COLOR} // Use the Sevensa primary color for the arrow
            className="text-white fill-current" // Tailwind class for the arrow body
            strokeWidth={1}
            stroke="#e5e7eb" // Tailwind gray-200 for a subtle border
            tipRadius={1}
          />
        </div>
      )}
    </>
  );
};

export default Popover;