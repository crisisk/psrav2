import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { CheckIcon, XCircleIcon } from '@heroicons/react/20/solid';

// --- Types and Interfaces ---

/**
 * Defines the structure for a single step in the Stepper component.
 * @property {string | number} id - Unique identifier for the step.
 * @property {string} label - The text label for the step.
 * @property {'complete' | 'active' | 'upcoming' | 'error'} status - The current state of the step.
 * @property {boolean} [isClickable=true] - Whether the step can be clicked to navigate.
 */
export interface Step {
  id: string | number;
  label: string;
  status: 'complete' | 'active' | 'upcoming' | 'error';
  isClickable?: boolean;
}

/**
 * Defines the props for the Stepper component.
 * @property {Step[]} steps - An array of step objects.
 * @property {(id: string | number) => void} onStepClick - Callback function when a clickable step is activated.
 * @property {string} [className] - Optional class name for the main container.
 */
export interface StepperProps {
  steps: Step[];
  onStepClick: (id: string | number) => void;
  className?: string;
}

// --- Constants for Sevensa Branding (Indigo/Blue Primary) ---

const SEVENSA_PRIMARY = 'indigo'; // Tailwind color for Sevensa branding

// --- Utility Components ---

/**
 * Renders the icon for a step based on its status.
 */
const StepIcon: React.FC<{ status: Step['status']; isClickable: boolean }> = ({ status, isClickable }) => {
  const baseClasses = 'flex h-8 w-8 items-center justify-center rounded-full ring-1 ring-inset';
  const iconClasses = 'h-5 w-5';

  switch (status) {
    case 'complete':
      return (
        <div className={\`\${baseClasses} bg-\${SEVENSA_PRIMARY}-600 ring-\${SEVENSA_PRIMARY}-600\`}>
          <CheckIcon className={\`\${iconClasses} text-white\`} aria-hidden="true" />
        </div>
      );
    case 'active':
      return (
        <div className={\`\${baseClasses} border-2 border-\${SEVENSA_PRIMARY}-600 bg-white ring-white\`}>
          <span className={\`h-2.5 w-2.5 rounded-full bg-\${SEVENSA_PRIMARY}-600\`} aria-hidden="true" />
        </div>
      );
    case 'error':
      return (
        <div className={\`\${baseClasses} bg-red-600 ring-red-600\`}>
          <XCircleIcon className={\`\${iconClasses} text-white\`} aria-hidden="true" />
        </div>
      );
    case 'upcoming':
    default:
      return (
        <div className={\`\${baseClasses} \${isClickable ? \`bg-white ring-gray-300 hover:ring-\${SEVENSA_PRIMARY}-600\` : 'bg-white ring-gray-200'}\`}>
          <span className="text-sm font-medium text-gray-500">{/* Step number will be in the parent element */}</span>
        </div>
      );
  }
};

/**
 * Renders a single step item.
 */
const StepItem: React.FC<{
  step: Step;
  stepIndex: number;
  isLast: boolean;
  onStepClick: (id: string | number) => void;
  tabIndex: number;
  setTabIndex: (index: number) => void;
}> = ({ step, stepIndex, isLast, onStepClick, tabIndex, setTabIndex }) => {
  const { id, label, status, isClickable = true } = step;
  const ref = useRef<HTMLButtonElement>(null);

  const handleStepClick = useCallback(() => {
    if (isClickable) {
      onStepClick(id);
    }
  }, [id, isClickable, onStepClick]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleStepClick();
      }
    },
    [handleStepClick]
  );

  const isInteractive = isClickable && status !== 'active';
  const isCurrentFocus = tabIndex === stepIndex;

  useEffect(() => {
    if (isCurrentFocus && ref.current) {
      ref.current.focus();
    }
  }, [isCurrentFocus]);

  const stepClasses = useMemo(() => {
    let classes = 'group flex items-center text-sm font-medium focus:outline-none';
    if (isInteractive) {
      classes += \` cursor-pointer hover:text-\${SEVENSA_PRIMARY}-600\`;
    } else {
      classes += ' cursor-default';
    }

    switch (status) {
      case 'complete':
        classes += \` text-\${SEVENSA_PRIMARY}-600\`;
        break;
      case 'active':
        classes += \` text-\${SEVENSA_PRIMARY}-600\`;
        break;
      case 'error':
        classes += ' text-red-600';
        break;
      case 'upcoming':
      default:
        classes += ' text-gray-500';
        break;
    }
    return classes;
  }, [status, isInteractive]);

  const lineClasses = useMemo(() => {
    let classes = 'absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5';
    switch (status) {
      case 'complete':
        classes += \` bg-\${SEVENSA_PRIMARY}-600\`;
        break;
      case 'active':
      case 'error':
      case 'upcoming':
      default:
        classes += ' bg-gray-300';
        break;
    }
    return classes;
  }, [status]);

  const StepContent = (
    <>
      <span className="relative flex h-10 w-10 items-center justify-center">
        {status === 'upcoming' ? (
          <div className={\`flex h-8 w-8 items-center justify-center rounded-full ring-1 ring-inset \${isInteractive ? \`bg-white ring-gray-300 group-hover:ring-\${SEVENSA_PRIMARY}-600\` : 'bg-white ring-gray-200'}\`}>
            <span className="text-sm font-medium text-gray-500">{stepIndex + 1}</span>
          </div>
        ) : (
          <StepIcon status={status} isClickable={isClickable} />
        )}
      </span>
      <span className="ml-4 text-sm font-medium">{label}</span>
    </>
  );

  return (
    <li className="relative pb-10">
      {!isLast ? <div className={lineClasses} aria-hidden="true" /> : null}

      <button
        ref={ref}
        type="button"
        onClick={handleStepClick}
        onKeyDown={handleKeyDown}
        className={stepClasses}
        aria-current={status === 'active' ? 'step' : undefined}
        aria-disabled={!isInteractive}
        tabIndex={isCurrentFocus ? 0 : -1}
        disabled={!isInteractive}
      >
        {StepContent}
      </button>
    </li>
  );
};

// --- Main Component ---

/**
 * A multi-step form indicator with progress, clickable steps, and validation states.
 *
 * @param {StepperProps} props - The component props.
 * @returns {JSX.Element} The Stepper component.
 */
const Stepper: React.FC<StepperProps> = ({ steps, onStepClick, className = '' }) => {
  const [tabIndex, setTabIndex] = React.useState(steps.findIndex(s => s.status === 'active') || 0);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLOListElement>) => {
      const interactiveSteps = steps.map((step, index) => ({ ...step, index })).filter(s => s.isClickable && s.status !== 'active');
      const interactiveIndices = interactiveSteps.map(s => s.index);

      if (interactiveIndices.length === 0) return;

      let newIndex = tabIndex;

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        const currentIndexInInteractive = interactiveIndices.indexOf(tabIndex);
        const nextIndexInInteractive = (currentIndexInInteractive + 1) % interactiveIndices.length;
        newIndex = interactiveIndices[nextIndexInInteractive];
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        const currentIndexInInteractive = interactiveIndices.indexOf(tabIndex);
        const prevIndexInInteractive = (currentIndexInInteractive - 1 + interactiveIndices.length) % interactiveIndices.length;
        newIndex = interactiveIndices[prevIndexInInteractive];
      } else if (event.key === 'Home') {
        event.preventDefault();
        newIndex = interactiveIndices[0];
      } else if (event.key === 'End') {
        event.preventDefault();
        newIndex = interactiveIndices[interactiveIndices.length - 1];
      }

      if (newIndex !== tabIndex) {
        setTabIndex(newIndex);
      }
    },
    [steps, tabIndex]
  );

  return (
    <nav aria-label="Progress" className={\`\${className}\`}>
      <ol
        role="list"
        className="overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {steps.map((step, stepIndex) => (
          <StepItem
            key={step.id}
            step={step}
            stepIndex={stepIndex}
            isLast={stepIndex === steps.length - 1}
            onStepClick={onStepClick}
            tabIndex={tabIndex}
            setTabIndex={setTabIndex}
          />
        ))}
      </ol>
    </nav>
  );
};

export default Stepper;