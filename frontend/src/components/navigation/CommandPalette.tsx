import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Command, X } from 'lucide-react';

// --- Types and Interfaces ---

/**
 * Defines the structure for a single command item in the palette.
 */
export interface CommandItem {
  id: string;
  icon?: React.ReactNode;
  label: string;
  keywords: string[];
  action: () => void;
}

/**
 * Defines the props for the CommandPalette component.
 */
export interface CommandPaletteProps {
  commands: CommandItem[];
  placeholder?: string;
  triggerKey?: string; // e.g., 'k' for Cmd+K
}

// --- Utility Components ---

const CommandShortcut: React.FC<{ keys: string[] }> = ({ keys }) => (
  <div className="flex items-center space-x-1 text-xs text-gray-400">
    {keys.map((key, index) => (
      <kbd
        key={index}
        className="inline-flex items-center justify-center h-5 min-w-5 px-1 border border-gray-700 rounded bg-gray-800 font-mono text-gray-300 shadow-sm"
      >
        {key}
      </kbd>
    ))}
  </div>
);

// --- Main Component ---

const CommandPalette: React.FC<CommandPaletteProps> = ({
  commands,
  placeholder = 'Search commands or navigate...',
  triggerKey = 'k',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Sevensa Branding: Dark theme with a subtle teal accent
  const SEVENSA_ACCENT = 'text-teal-400';
  const SEVENSA_BG = 'bg-gray-900';
  const SEVENSA_BORDER = 'border-gray-700';
  const SEVENSA_HOVER = 'hover:bg-gray-800';
  const SEVENSA_SELECTED = 'bg-teal-900/50 border-teal-500/50';

  // 1. Filtering Logic
  const filteredCommands = useMemo(() => {
    if (!searchQuery) {
      return commands;
    }
    const query = searchQuery.toLowerCase();
    return commands.filter(command =>
      command.label.toLowerCase().includes(query) ||
      command.keywords.some(keyword => keyword.toLowerCase().includes(query))
    );
  }, [commands, searchQuery]);

  // Reset active index when filtered commands change
  useEffect(() => {
    setActiveIndex(0);
  }, [filteredCommands]);

  // 2. Keyboard Shortcut (Cmd+K) to toggle
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Check for Cmd/Ctrl + triggerKey
    const isTrigger = (event.metaKey || event.ctrlKey) && event.key === triggerKey;
    
    if (isTrigger) {
      event.preventDefault();
      setIsOpen(prev => !prev);
    } else if (event.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  }, [isOpen, triggerKey]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Focus the input when the palette opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      // Reset search query and active index on open
      setSearchQuery('');
      setActiveIndex(0);
    }
  }, [isOpen]);

  // 3. Keyboard Navigation (Up/Down/Enter)
  const handleListKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredCommands.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex(prev => (prev + 1) % filteredCommands.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        break;
      case 'Enter':
        event.preventDefault();
        if (filteredCommands[activeIndex]) {
          filteredCommands[activeIndex].action();
          setIsOpen(false); // Close after action
        }
        break;
      default:
        break;
    }
  }, [filteredCommands, activeIndex]);

  // 4. Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeItem = listRef.current.children[activeIndex] as HTMLElement;
      if (activeItem) {
        activeItem.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [activeIndex]);

  if (!isOpen) {
    return null;
  }

  return (
    // Modal Overlay (Accessible Dialog)
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-10 backdrop-blur-sm bg-black/50"
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-palette-title"
    >
      {/* Palette Container */}
      <div
        className={`w-full max-w-xl mt-16 rounded-xl shadow-2xl ${SEVENSA_BG} ${SEVENSA_BORDER} border`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        {/* Search Input Area */}
        <div className={`flex items-center p-4 border-b ${SEVENSA_BORDER}`}>
          <Search className={`w-5 h-5 mr-3 flex-shrink-0 ${SEVENSA_ACCENT}`} />
          <input
            id="command-palette-input"
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleListKeyDown}
            className={`w-full text-lg font-medium bg-transparent text-white placeholder-gray-500 focus:outline-none`}
            autoComplete="off"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-list"
            aria-autocomplete="list"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 ml-3 text-gray-400 rounded-full hover:bg-gray-800"
            aria-label="Close command palette"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Command List */}
        <ul
          id="command-palette-list"
          ref={listRef}
          className="max-h-96 overflow-y-auto p-2"
          role="listbox"
          aria-label="Available commands"
        >
          {filteredCommands.length > 0 ? (
            filteredCommands.map((command, index) => (
              <li
                key={command.id}
                role="option"
                aria-selected={index === activeIndex}
                className={`flex items-center justify-between p-3 my-1 rounded-lg cursor-pointer transition-colors duration-150 ${SEVENSA_HOVER} ${
                  index === activeIndex ? SEVENSA_SELECTED : 'bg-transparent'
                }`}
                onClick={() => {
                  command.action();
                  setIsOpen(false);
                }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <div className="flex items-center">
                  {command.icon ? (
                    <span className={`w-5 h-5 mr-3 flex-shrink-0 ${index === activeIndex ? SEVENSA_ACCENT : 'text-gray-400'}`}>
                      {command.icon}
                    </span>
                  ) : (
                    <Command className={`w-5 h-5 mr-3 flex-shrink-0 ${index === activeIndex ? SEVENSA_ACCENT : 'text-gray-400'}`} />
                  )}
                  <span className={`text-white font-medium ${index === activeIndex ? SEVENSA_ACCENT : 'text-gray-200'}`}>
                    {command.label}
                  </span>
                </div>
                {/* Display Cmd/Ctrl + triggerKey shortcut */}
                <CommandShortcut keys={['⌘', triggerKey.toUpperCase()]} />
              </li>
            ))
          ) : (
            <li className="p-4 text-center text-gray-500">
              No results found for "{searchQuery}"
            </li>
          )}
        </ul>

        {/* Footer Hint */}
        <div className={`p-3 text-xs text-gray-500 border-t ${SEVENSA_BORDER} flex justify-between items-center`}>
          <p>
            <span className="font-semibold">Sevensa Command Palette</span>
          </p>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <CommandShortcut keys={['↑', '↓']} />
              <span className="ml-2">to navigate</span>
            </div>
            <div className="flex items-center">
              <CommandShortcut keys={['↵']} />
              <span className="ml-2">to select</span>
            </div>
            <div className="flex items-center">
              <CommandShortcut keys={['esc']} />
              <span className="ml-2">to close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;