import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react'; // Using lucide-react for a common icon

// --- 1. TypeScript Interfaces ---

/**
 * Defines the props for the main Accordion component.
 * @property {ReactNode} children - The AccordionItem components.
 * @property {'single' | 'multiple'} type - The expansion mode. 'single' allows only one item open at a time.
 * @property {string | string[]} defaultValue - The ID(s) of the item(s) to be open by default.
 * @property {string} className - Optional class name for the main container.
 */
interface AccordionProps {
  children: ReactNode;
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  className?: string;
}

/**
 * Defines the props for a single Accordion Item.
 * @property {string} value - A unique identifier for the item.
 * @property {ReactNode} children - The AccordionHeader and AccordionContent components.
 * @property {string} className - Optional class name for the item container.
 */
interface AccordionItemProps {
  value: string;
  children: ReactNode;
  className?: string;
}

/**
 * Defines the props for the Accordion Header (trigger).
 * @property {ReactNode} children - The content of the header.
 * @property {string} className - Optional class name for the header button.
 */
interface AccordionHeaderProps {
  children: ReactNode;
  className?: string;
}

/**
 * Defines the props for the Accordion Content (collapsible area).
 * @property {ReactNode} children - The content to be displayed when expanded.
 * @property {string} className - Optional class name for the content container.
 */
interface AccordionContentProps {
  children: ReactNode;
  className?: string;
}

/**
 * Defines the shape of the Accordion Context.
 * @property {string[]} openItems - Array of IDs of currently open items.
 * @property {'single' | 'multiple'} type - The expansion mode.
 * @property {(value: string) => void} toggleItem - Function to toggle the open state of an item.
 */
interface AccordionContextType {
  openItems: string[];
  type: 'single' | 'multiple';
  toggleItem: (value: string) => void;
}

// --- 2. Context Creation ---

const AccordionContext = createContext<AccordionContextType | undefined>(undefined);

const useAccordionContext = () => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion components must be used within the <Accordion> component');
  }
  return context;
};

// --- 3. Accordion Root Component (Logic) ---

const Accordion = ({ children, type = 'single', defaultValue = [], className = '' }: AccordionProps) => {
  const initialValue = Array.isArray(defaultValue) ? defaultValue : [defaultValue];
  const [openItems, setOpenItems] = useState<string[]>(type === 'single' ? initialValue.slice(0, 1) : initialValue);

  const toggleItem = useCallback((value: string) => {
    setOpenItems(prevOpenItems => {
      const isCurrentlyOpen = prevOpenItems.includes(value);

      if (type === 'single') {
        // Single mode: If open, close it. If closed, open it (and close others).
        return isCurrentlyOpen ? [] : [value];
      } else {
        // Multiple mode: Toggle the item.
        return isCurrentlyOpen
          ? prevOpenItems.filter(id => id !== value)
          : [...prevOpenItems, value];
      }
    });
  }, [type]);

  const contextValue = useMemo(() => ({
    openItems,
    type,
    toggleItem,
  }), [openItems, type, toggleItem]);

  return (
    <AccordionContext.Provider value={contextValue}>
      <div className={`w-full ${className}`}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

// --- 4. Accordion Item Component (State and Structure) ---

const AccordionItemContext = createContext<{ value: string } | undefined>(undefined);

const useAccordionItemContext = () => {
  const context = useContext(AccordionItemContext);
  if (!context) {
    throw new Error('AccordionItem components must be used within the <AccordionItem> component');
  }
  return context;
};

const AccordionItem = ({ value, children, className = '' }: AccordionItemProps) => {
  const { openItems } = useAccordionContext();
  const isOpen = openItems.includes(value);

  const itemContextValue = useMemo(() => ({ value }), [value]);

  // Sevensa Branding: Subtle border for separation
  return (
    <AccordionItemContext.Provider value={itemContextValue}>
      <div
        className={`border-b border-sevensa-gray-200 last:border-b-0 ${className}`}
        data-state={isOpen ? 'open' : 'closed'}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
};

// --- 5. Accordion Header Component (Trigger) ---

const AccordionHeader = ({ children, className = '' }: AccordionHeaderProps) => {
  const { value } = useAccordionItemContext();
  const { openItems, toggleItem } = useAccordionContext();
  const isOpen = openItems.includes(value);

  // Sevensa Branding: Primary color for active state, focus ring
  const baseClasses = 'flex justify-between items-center w-full py-4 px-5 text-left font-medium transition-colors duration-200 ease-in-out';
  const stateClasses = isOpen
    ? 'text-sevensa-primary-600 hover:text-sevensa-primary-700'
    : 'text-sevensa-gray-900 hover:text-sevensa-primary-600';

  return (
    <h3 className="text-lg">
      <button
        type="button"
        className={`${baseClasses} ${stateClasses} ${className}`}
        onClick={() => toggleItem(value)}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${value}`}
        id={`accordion-header-${value}`}
      >
        {children}
        <ChevronDown
          className={`h-5 w-5 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-sevensa-primary-600' : 'text-sevensa-gray-500'}`}
        />
      </button>
    </h3>
  );
};

// --- 6. Accordion Content Component (Collapsible Area) ---

const AccordionContent = ({ children, className = '' }: AccordionContentProps) => {
  const { value } = useAccordionItemContext();
  const { openItems } = useAccordionContext();
  const isOpen = openItems.includes(value);

  // Tailwind CSS for smooth animation: max-h-0 and overflow-hidden for closed state
  // Note: For true "smooth" animation, a dedicated animation library or a more complex CSS transition (like using a ref to measure height) is often needed.
  // We use a simple max-height transition here, which is a common Tailwind pattern for this.
  const contentClasses = isOpen
    ? 'max-h-screen opacity-100 pt-0 pb-5' // Open state
    : 'max-h-0 opacity-0 pt-0 pb-0'; // Closed state

  // Sevensa Branding: Padding and text color
  const baseClasses = 'overflow-hidden transition-[max-height,opacity,padding] duration-500 ease-in-out text-sevensa-gray-600 px-5';

  return (
    <div
      id={`accordion-content-${value}`}
      role="region"
      aria-labelledby={`accordion-header-${value}`}
      hidden={!isOpen}
      className={`${baseClasses} ${contentClasses} ${className}`}
    >
      <div className="pb-4">
        {children}
      </div>
    </div>
  );
};

// --- 7. Export Compound Component ---

/**
 * A collapsible panel component with smooth animations and support for single or multiple expansion.
 *
 * @example
 * <Accordion type="multiple" defaultValue={['item-1']}>
 *   <Accordion.Item value="item-1">
 *     <Accordion.Header>Is this component accessible?</Accordion.Header>
 *     <Accordion.Content>Yes, it includes ARIA attributes like aria-expanded, aria-controls, and role="region".</Accordion.Content>
 *   </Accordion.Item>
 *   <Accordion.Item value="item-2">
 *     <Accordion.Header>What about Sevensa branding?</Accordion.Header>
 *     <Accordion.Content>It uses placeholder classes like 'sevensa-primary-600' and 'sevensa-gray-200' for easy integration with a Sevensa-themed Tailwind config.</Accordion.Content>
 *   </Accordion.Item>
 * </Accordion>
 */
const AccordionComponent = Object.assign(Accordion, {
  Item: AccordionItem,
  Header: AccordionHeader,
  Content: AccordionContent,
});

export default AccordionComponent;