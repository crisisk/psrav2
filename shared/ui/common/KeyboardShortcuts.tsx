import { useState, useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcut {
  key: string;
  description: string;
}

const shortcuts: KeyboardShortcut[] = [
  { key: '⌘K or Ctrl+K', description: 'Search' },
  { key: '⌘N or Ctrl+N', description: 'New assessment' },
  { key: '⌘E or Ctrl+E', description: 'Export' },
  { key: '⌘? or Ctrl+?', description: 'Show shortcuts' },
  { key: 'Esc', description: 'Close modal' },
  { key: '/', description: 'Focus search' },
];

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal = ({ isOpen, onClose }: KeyboardShortcutsModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-bg-surface rounded-lg p-6 w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Keyboard className="h-6 w-6 text-sevensa-teal" />
            <h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg-base rounded-lg"
            >
              <span className="text-gray-700 dark:text-gray-300">{shortcut.description}</span>
              <kbd className="px-3 py-1 bg-white dark:bg-dark-bg-surface border border-gray-300 dark:border-gray-600 rounded text-sm font-mono shadow-sm">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Press <kbd className="px-2 py-1 bg-gray-100 rounded">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;
