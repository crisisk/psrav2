import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';

// --- Types and Interfaces ---

/**
 * Defines a single item in the context menu.
 */
export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (id: string) => void;
  disabled?: boolean;
  separator?: boolean;
}

/**
 * Defines the props for the ContextMenu component.
 */
export interface ContextMenuProps {
  items: ContextMenuItem[];
  children: React.ReactNode;
}

/**
 * Defines the state for the context menu's position and visibility.
 */
interface MenuState {
  visible: boolean;
  x: number;
  y: number;
}

// --- Constants for Sevensa Branding ---
const SEVENSA_CLASSES = {
  // Menu container styling (dark theme, rounded, shadow, z-index)
  menu: 'bg-gray-800 border border-gray-700 rounded-lg shadow-2xl py-1 z-50 min-w-[160px] focus:outline-none',
  // Menu item base styling
  item: 'flex items-center px-3 py-2 text-sm text-gray-200 cursor-pointer transition-colors duration-100',
  // Menu item hover styling
  itemHover: 'hover:bg-blue-600 hover:text-white',
  // Menu item focus styling for keyboard navigation
  itemFocus: 'focus:bg-blue-600 focus:text-white outline-none',
  // Disabled item styling
  disabled: 'opacity-50 cursor-not-allowed text-gray-500',
  // Separator styling
  separator: 'h-px bg-gray-700 my-1',
  // Icon styling
  icon: 'mr-3 h-4 w-4',
};

// --- ContextMenu Component ---

const ContextMenu: React.FC<ContextMenuProps> = ({ items, children }) => {
  const [menuState, setMenuState] = useState<MenuState>({ visible: false, x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const activeItemIndexRef = useRef<number>(-1);

  /**
   * Focuses a specific item in the menu based on its index in the focusable list.
   */
  const focusItem = useCallback((index: number) => {
    if (menuRef.current) {
      const focusableItems = Array.from(menuRef.current.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])')) as HTMLElement[];
      if (focusableItems.length > 0 && index >= 0 && index < focusableItems.length) {
        focusableItems[index].focus();
        activeItemIndexRef.current = index;
      }
    }
  }, []);

  /**
   * Closes the context menu and returns focus to the trigger element.
   */
  const handleClose = useCallback(() => {
    setMenuState({ visible: false, x: 0, y: 0 });
    activeItemIndexRef.current = -1;
    if (triggerRef.current) {
      // Use a timeout to ensure focus is returned after the menu is removed from the DOM
      setTimeout(() => triggerRef.current?.focus(), 0);
    }
  }, []);

  /**
   * Handles the right-click event to show the menu.
   */
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();

    let x = event.clientX;
    let y = event.clientY;

    setMenuState({ visible: true, x, y });
  }, []);

  // Effect to handle clicks outside the menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    if (menuState.visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuState.visible, handleClose]);

  // Effect to adjust menu position if it goes off-screen and to focus the first item
  useEffect(() => {
    if (menuState.visible && menuRef.current) {
      const menu = menuRef.current;
      const { innerWidth, innerHeight } = window;
      const { offsetWidth, offsetHeight } = menu;

      let { x, y } = menuState;

      // Adjust X position
      if (x + offsetWidth > innerWidth) {
        x = innerWidth - offsetWidth - 10;
      }

      // Adjust Y position
      if (y + offsetHeight > innerHeight) {
        y = innerHeight - offsetHeight - 10;
      }

      if (x !== menuState.x || y !== menuState.y) {
        setMenuState(prev => ({ ...prev, x, y }));
      }

      // Focus the first item when the menu becomes visible
      setTimeout(() => {
        focusItem(0);
      }, 0);
    }
  }, [menuState.visible, menuState.x, menuState.y, focusItem]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!menuRef.current) return;

    const focusableItems = Array.from(menuRef.current.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])')) as HTMLElement[];
    const currentActiveIndex = activeItemIndexRef.current;

    if (focusableItems.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusItem((currentActiveIndex + 1) % focusableItems.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        // Calculate previous index, handling wrap-around
        focusItem((currentActiveIndex - 1 + focusableItems.length) % focusableItems.length);
        break;
      case 'Escape':
        event.preventDefault();
        handleClose();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (currentActiveIndex !== -1) {
          // Simulate click on the focused element to trigger onClick and close
          focusableItems[currentActiveIndex].click();
        }
        break;
      default:
        // Allow other keys to pass through (e.g., for global shortcuts)
        break;
    }
  }, [focusItem, handleClose]);

  // Wrap children in a div to attach the context menu listener and make it focusable
  const trigger = useMemo(() => (
    <div
      ref={triggerRef}
      onContextMenu={handleContextMenu}
      aria-haspopup="menu"
      tabIndex={0} // Make the trigger focusable for keyboard users
      className="inline-block" // Ensure the div doesn't take full width unnecessarily
    >
      {children}
    </div>
  ), [children, handleContextMenu]);

  // The Menu component to be rendered via Portal
  const MenuPortal = menuState.visible ? createPortal(
    <div
      ref={menuRef}
      role="menu"
      // The menu container itself does not need to be focusable (tabIndex=-1)
      // as focus is managed on the menu items, but we attach the keydown handler here.
      tabIndex={-1}
      style={{ top: menuState.y, left: menuState.x }}
      className={`fixed ${SEVENSA_CLASSES.menu}`}
      onKeyDown={handleKeyDown}
    >
      {items.map((item, index) => (
        item.separator ? (
          <div key={`sep-${index}`} className={SEVENSA_CLASSES.separator} role="separator" />
        ) : (
          <div
            key={item.id}
            role="menuitem"
            tabIndex={item.disabled ? -1 : 0} // Only non-disabled items are focusable
            aria-disabled={item.disabled}
            onClick={() => {
              if (!item.disabled) {
                item.onClick(item.id);
                handleClose();
              }
            }}
            onFocus={() => {
              // Update the active index when an item receives focus (e.g., via mouse or tab)
              const focusableItems = Array.from(menuRef.current!.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])')) as HTMLElement[];
              const focusedIndex = focusableItems.findIndex(el => el === document.activeElement);
              activeItemIndexRef.current = focusedIndex;
            }}
            className={`${SEVENSA_CLASSES.item} ${item.disabled ? SEVENSA_CLASSES.disabled : SEVENSA_CLASSES.itemHover} ${SEVENSA_CLASSES.itemFocus}`}
          >
            {item.icon && <span className={SEVENSA_CLASSES.icon}>{item.icon}</span>}
            {item.label}
          </div>
        )
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <>
      {trigger}
      {MenuPortal}
    </>
  );
};

export default ContextMenu;