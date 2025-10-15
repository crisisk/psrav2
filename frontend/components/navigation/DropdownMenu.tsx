import React, { useState, useRef, useEffect, useCallback, useMemo, useImperativeHandle, forwardRef } from 'react';
import { ChevronRight, MoreVertical } from 'lucide-react'; // Using lucide-react for icons

// --- Types ---

// Base item structure
export type DropdownItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: (event: React.MouseEvent | React.KeyboardEvent) => void;
  disabled?: boolean;
  type?: 'item' | 'divider' | 'submenu';
  items?: DropdownItem[]; // For submenu
};

// Component Props
export type DropdownMenuProps = {
  items: DropdownItem[];
  trigger?: React.ReactNode;
  className?: string;
  onClose?: () => void;
};

// --- Utility Components ---

/**
 * DropdownDivider component for visual separation.
 */
const DropdownDivider: React.FC = () => (
  <div className="my-1 h-px bg-sevensa-border" role="separator" />
);

// --- Dropdown Menu Content Ref Type ---

type DropdownMenuContentRef = {
  focusFirst: () => void;
  focusLast: () => void;
  focusItem: (index: number) => void;
};

// --- Dropdown Item Component ---

type DropdownMenuItemProps = {
  item: DropdownItem;
  index: number;
  onSelect: (item: DropdownItem, event: React.MouseEvent | React.KeyboardEvent) => void;
  isFocused: boolean;
  onFocusChange: (index: number) => void;
  onOpenSubmenu: (item: DropdownItem, index: number) => void;
  onCloseSubmenu: () => void;
  isSubmenuOpen: boolean;
  focusSubmenu: (item: DropdownItem) => void;
};

/**
 * Individual item within the dropdown menu. Handles focus, click, and hover.
 */
const DropdownMenuItem = forwardRef<HTMLDivElement, DropdownMenuItemProps>(({
  item,
  index,
  onSelect,
  isFocused,
  onFocusChange,
  onOpenSubmenu,
  onCloseSubmenu,
  isSubmenuOpen,
  focusSubmenu,
}, ref) => {
  const isSubmenu = item.type === 'submenu';

  // Programmatically focus the item when it becomes the focused item in the menu
  useEffect(() => {
    if (isFocused && ref && 'current' in ref && ref.current) {
      ref.current.focus();
    }
  }, [isFocused, ref]);

  const handleMouseEnter = useCallback(() => {
    onFocusChange(index);
    if (isSubmenu) {
      onOpenSubmenu(item, index);
    } else {
      onCloseSubmenu();
    }
  }, [index, item, onFocusChange, onOpenSubmenu, onCloseSubmenu, isSubmenu]);

  const handleClick = useCallback((event: React.MouseEvent) => {
    if (item.disabled) return;
    if (!isSubmenu) {
      onSelect(item, event);
    } else {
      // For mouse click on submenu item, open it and focus the first item
      onOpenSubmenu(item, index);
      focusSubmenu(item);
    }
  }, [item, isSubmenu, onSelect, onOpenSubmenu, index, focusSubmenu]);

  if (item.type === 'divider') {
    return <DropdownDivider />;
  }

  // Sevensa Branding & Styling
  const baseClasses = `
    flex items-center w-full px-3 py-2 text-sm cursor-pointer transition-colors duration-150
    ${item.disabled ? 'text-sevensa-disabled cursor-not-allowed' : 'text-sevensa-text hover:bg-sevensa-primary-light focus:outline-none focus:bg-sevensa-primary-light'}
    ${isFocused ? 'bg-sevensa-primary-light' : ''}
  `;

  return (
    <div
      ref={ref}
      className={baseClasses}
      role="menuitem"
      tabIndex={isFocused ? 0 : -1} // Only the focused item is in the tab order
      aria-disabled={item.disabled}
      aria-haspopup={isSubmenu ? 'menu' : undefined}
      aria-expanded={isSubmenu ? isSubmenuOpen : undefined}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onFocus={() => onFocusChange(index)} // Ensure focus state is correct if tabbed into
    >
      {item.icon && <span className="mr-2 h-4 w-4">{item.icon}</span>}
      <span className="flex-grow">{item.label}</span>
      {isSubmenu && <ChevronRight className="ml-2 h-4 w-4" />}
    </div>
  );
});

DropdownMenuItem.displayName = 'DropdownMenuItem';

// --- Dropdown Menu Content (Recursive) ---

type DropdownMenuContentProps = {
  items: DropdownItem[];
  onSelect: (item: DropdownItem, event: React.MouseEvent | React.KeyboardEvent) => void;
  onCloseMenu: () => void;
  isSubmenu?: boolean;
  onFocusParent?: () => void; // For submenu to focus its parent item
};

/**
 * Container for the menu items, handling focus and keyboard navigation logic.
 */
const DropdownMenuContent = forwardRef<DropdownMenuContentRef, DropdownMenuContentProps>(({
  items,
  onSelect,
  onCloseMenu,
  isSubmenu = false,
  onFocusParent,
}, ref) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const submenuRef = useRef<DropdownMenuContentRef>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [openSubmenu, setOpenSubmenu] = useState<{ item: DropdownItem; index: number } | null>(null);

  // Filter out non-interactive items for focus management
  const focusableItems = useMemo(() => items.filter(item => item.type !== 'divider'), [items]);
  const focusableItemCount = focusableItems.length;

  // Map from focusable index to original item index
  const getOriginalIndex = useCallback((focusableIndex: number) => {
    let focusCounter = -1;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type !== 'divider') {
        focusCounter++;
        if (focusCounter === focusableIndex) {
          return i;
        }
      }
    }
    return -1;
  }, [items]);

  // Map from original item index to focusable index
  const getFocusableIndex = useCallback((originalIndex: number) => {
    let focusCounter = 0;
    for (let i = 0; i < originalIndex; i++) {
      if (items[i].type !== 'divider') {
        focusCounter++;
      }
    }
    return items[originalIndex].type !== 'divider' ? focusCounter : -1;
  }, [items]);

  // Public methods for parent components (e.g., main DropdownMenu)
  useImperativeHandle(ref, () => ({
    focusFirst: () => {
      if (focusableItemCount > 0) {
        setFocusedIndex(0);
        // Focus will be handled by the useEffect in DropdownMenuItem
      }
    },
    focusLast: () => {
      if (focusableItemCount > 0) {
        setFocusedIndex(focusableItemCount - 1);
      }
    },
    focusItem: (index: number) => {
      const focusableIdx = getFocusableIndex(index);
      if (focusableIdx !== -1) {
        setFocusedIndex(focusableIdx);
      }
    },
  }));

  const handleFocusChange = useCallback((originalIndex: number) => {
    const focusableIdx = getFocusableIndex(originalIndex);
    if (focusableIdx !== -1) {
      setFocusedIndex(focusableIdx);
    }
  }, [getFocusableIndex]);

  const handleOpenSubmenu = useCallback((item: DropdownItem, index: number) => {
    setOpenSubmenu({ item, index });
  }, []);

  const handleCloseSubmenu = useCallback(() => {
    setOpenSubmenu(null);
  }, []);

  const focusSubmenu = useCallback((item: DropdownItem) => {
    // This is called on mouse click of a submenu item
    // The submenu will open, and its mount effect will focus the first item
  }, []);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (focusableItemCount === 0) return;

    const currentOriginalIndex = getOriginalIndex(focusedIndex);
    const currentItem = items[currentOriginalIndex];
    const isSubmenuOpen = openSubmenu !== null;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => (prev + 1) % focusableItemCount);
        handleCloseSubmenu(); // Close submenu when moving focus away
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => (prev - 1 + focusableItemCount) % focusableItemCount);
        handleCloseSubmenu(); // Close submenu when moving focus away
        break;
      case 'ArrowRight':
        if (currentItem?.type === 'submenu') {
          event.preventDefault();
          if (!isSubmenuOpen) {
            handleOpenSubmenu(currentItem, currentOriginalIndex);
          }
          // Focus the first item in the newly opened submenu
          setTimeout(() => submenuRef.current?.focusFirst(), 0);
        } else if (isSubmenu) {
          // If in a submenu, ArrowRight should do nothing
          event.preventDefault();
        }
        break;
      case 'ArrowLeft':
        if (isSubmenu) {
          event.preventDefault();
          if (isSubmenuOpen) {
            handleCloseSubmenu();
          } else if (onFocusParent) {
            onFocusParent(); // Move focus back to the parent menu item
          }
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (currentItem && !currentItem.disabled) {
          if (currentItem.type !== 'submenu') {
            onSelect(currentItem, event);
          } else {
            handleOpenSubmenu(currentItem, currentOriginalIndex);
            setTimeout(() => submenuRef.current?.focusFirst(), 0);
          }
        }
        break;
      case 'Escape':
        event.preventDefault();
        onCloseMenu(); // Close the entire menu
        break;
      case 'Home':
        event.preventDefault();
        setFocusedIndex(0);
        handleCloseSubmenu();
        break;
      case 'End':
        event.preventDefault();
        setFocusedIndex(focusableItemCount - 1);
        handleCloseSubmenu();
        break;
      default:
        // Type-ahead search could be implemented here
        break;
    }
  }, [focusedIndex, focusableItemCount, items, onSelect, openSubmenu, isSubmenu, getOriginalIndex, handleOpenSubmenu, handleCloseSubmenu, onCloseMenu, onFocusParent]);

  // Recursive rendering of items
  const renderedItems = items.map((item, originalIndex) => {
    const focusableIndex = getFocusableIndex(originalIndex);
    const isCurrentFocused = focusableIndex === focusedIndex && focusableIndex !== -1;
    const isSubmenuOpen = openSubmenu?.index === originalIndex;

    if (item.type === 'divider') {
      return <DropdownDivider key={`divider-${originalIndex}`} />;
    }

    return (
      <div key={item.id} className="relative">
        <DropdownMenuItem
          ref={el => { itemRefs.current[originalIndex] = el; }}
          item={item}
          index={originalIndex}
          onSelect={onSelect}
          isFocused={isCurrentFocused}
          onFocusChange={handleFocusChange}
          onOpenSubmenu={handleOpenSubmenu}
          onCloseSubmenu={handleCloseSubmenu}
          isSubmenuOpen={isSubmenuOpen}
          focusSubmenu={focusSubmenu}
        />
        {/* Render the submenu content */}
        {item.type === 'submenu' && isSubmenuOpen && (
          <div
            className="absolute left-full top-0 ml-1 z-20"
            role="menu"
            aria-label={item.label}
            onKeyDown={handleKeyDown} // Submenu handles its own keyboard events
          >
            <DropdownMenuContent
              ref={submenuRef}
              items={item.items || []}
              onSelect={onSelect}
              onCloseMenu={onCloseMenu}
              isSubmenu={true}
              onFocusParent={() => {
                handleCloseSubmenu();
                itemRefs.current[originalIndex]?.focus(); // Focus back to the parent item
              }}
            />
          </div>
        )}
      </div>
    );
  });

  // Sevensa Branding:
  const menuClasses = `
    min-w-[12rem] bg-sevensa-background rounded-lg shadow-sevensa-lg py-1 ring-1 ring-sevensa-border ring-opacity-5
    ${isSubmenu ? 'absolute' : ''}
  `;

  return (
    <div
      ref={menuRef}
      className={menuClasses}
      role="menu"
      tabIndex={-1} // Not focusable via tab, but can receive focus programmatically
      onKeyDown={handleKeyDown}
      onMouseLeave={handleCloseSubmenu} // Close submenu when mouse leaves the parent menu
    >
      {renderedItems}
    </div>
  );
});

DropdownMenuContent.displayName = 'DropdownMenuContent';

// --- Main Component ---

/**
 * The main DropdownMenu component.
 */
const DropdownMenu: React.FC<DropdownMenuProps> = ({
  items,
  trigger = (
    <button
      className="p-2 rounded-full text-sevensa-text hover:bg-sevensa-primary-light focus:outline-none focus:ring-2 focus:ring-sevensa-primary"
      aria-label="Open menu"
    >
      <MoreVertical className="h-5 w-5" />
    </button>
  ),
  className = '',
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<DropdownMenuContentRef>(null);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    onClose?.();
    // Return focus to the trigger element
    if (triggerRef.current) {
      const triggerElement = triggerRef.current.querySelector('button, a, div[tabindex="0"]');
      if (triggerElement instanceof HTMLElement) {
        triggerElement.focus();
      }
    }
  }, [onClose]);

  const handleSelect = useCallback((item: DropdownItem, event: React.MouseEvent | React.KeyboardEvent) => {
    if (item.onClick) {
      item.onClick(event);
    }
    handleClose(); // Close menu on item selection
  }, [handleClose]);

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClose]);

  // Focus the menu content when it opens
  useEffect(() => {
    if (isOpen) {
      // Use a timeout to ensure the content is rendered before trying to focus
      const timer = setTimeout(() => {
        contentRef.current?.focusFirst();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      <div ref={triggerRef}>
        {/* Clone the trigger element to add necessary ARIA and event handlers */}
        {React.isValidElement(trigger) && (
          React.cloneElement(trigger, {
            onClick: toggleMenu,
            'aria-haspopup': 'menu',
            'aria-expanded': isOpen,
            // The main menu container handles Escape key, not the trigger
          })
        )}
      </div>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 origin-top-right z-10"
        >
          <DropdownMenuContent
            ref={contentRef}
            items={items}
            onSelect={handleSelect}
            onCloseMenu={handleClose}
          />
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;

// --- Sevensa Tailwind Configuration (Mock for context) ---
// NOTE: The following classes are assumed to be defined in the project's tailwind.config.js
// to fulfill the "Sevensa branding" requirement.
// - bg-sevensa-background: Primary background color (e.g., white)
// - text-sevensa-text: Primary text color (e.g., black/dark gray)
// - bg-sevensa-primary-light: Light shade of primary color for hover/focus
// - focus:ring-sevensa-primary: Primary color for focus rings
// - text-sevensa-disabled: Color for disabled text
// - bg-sevensa-border: Color for borders/dividers
