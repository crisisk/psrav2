import React, { useState, useCallback, useMemo, useRef, useEffect, KeyboardEvent, FocusEvent } from 'react';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';

// --- Types ---

/**
 * Props for the TagInput component.
 * @template T - The type of the tag value, typically string.
 */
interface TagInputProps<T = string> {
  /** The current list of tags. */
  tags: T[];
  /** Callback function to update the list of tags. */
  setTags: (tags: T[]) => void;
  /** List of available suggestions for autocomplete. */
  suggestions: T[];
  /** Optional label for the input field. */
  label?: string;
  /** Optional placeholder text for the input field. */
  placeholder?: string;
  /** Optional function to validate a tag before adding it. Returns an error message or null/undefined if valid. */
  validateTag?: (tag: T) => string | undefined;
  /** Optional function to validate the entire list of tags. Returns an error message or null/undefined if valid. */
  validateAllTags?: (tags: T[]) => string | undefined;
  /** Optional maximum number of tags allowed. */
  maxTags?: number;
  /** Optional flag to disable the input. */
  disabled?: boolean;
  /** Optional custom class name for the container. */
  className?: string;
}

// --- Helper Components ---

/**
 * A single Tag component.
 */
const Tag: React.FC<{ tag: string; onRemove: () => void; disabled: boolean }> = ({ tag, onRemove, disabled }) => {
  return (
    <div className="flex items-center bg-indigo-100 text-indigo-800 text-sm font-medium mr-2 px-3 py-1 rounded-full dark:bg-indigo-900 dark:text-indigo-300 transition-colors duration-150">
      <span className="truncate max-w-xs">{tag}</span>
      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-2 p-0.5 rounded-full hover:bg-indigo-200 text-indigo-600 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          aria-label={`Remove tag ${tag}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

/**
 * A single Autocomplete Suggestion item.
 */
const SuggestionItem: React.FC<{
  suggestion: string;
  isHighlighted: boolean;
  onClick: () => void;
}> = ({ suggestion, isHighlighted, onClick }) => {
  const baseClasses = 'px-4 py-2 cursor-pointer text-sm transition-colors duration-150';
  const highlightClasses = isHighlighted ? 'bg-indigo-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700';

  return (
    <li
      className={`${baseClasses} ${highlightClasses}`}
      onClick={onClick}
      // Prevent blur event on input when clicking a suggestion
      onMouseDown={(e) => e.preventDefault()}
      role="option"
      aria-selected={isHighlighted}
    >
      {suggestion}
    </li>
  );
};

// --- Main Component ---

/**
 * A production-ready TagInput component with autocomplete, add/remove tags, and validation.
 * Styled with Tailwind CSS and Sevensa branding (using indigo color palette).
 */
const TagInput: React.FC<TagInputProps> = ({
  tags,
  setTags,
  suggestions,
  label,
  placeholder = 'Add a tag and press Enter or comma...',
  validateTag,
  validateAllTags,
  maxTags,
  disabled = false,
  className,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [tagError, setTagError] = useState<string | undefined>(undefined);
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);

  // --- Validation ---

  // Validate the entire list of tags
  const allTagsError = useMemo(() => validateAllTags?.(tags), [tags, validateAllTags]);

  // Determine the overall validation state
  const hasError = !!tagError || !!allTagsError;
  const validationMessage = tagError || allTagsError;

  // --- Autocomplete Logic ---

  const filteredSuggestions = useMemo(() => {
    if (!inputValue) return [];
    const lowerInput = inputValue.toLowerCase();
    return suggestions
      .filter(
        (s) =>
          s.toLowerCase().includes(lowerInput) && // Matches input
          !tags.includes(s as any) // Not already added
      )
      .slice(0, 5) as string[]; // Limit to 5 suggestions
  }, [inputValue, suggestions, tags]);

  useEffect(() => {
    // Reset highlighted index when suggestions change
    setHighlightedIndex(-1);
  }, [filteredSuggestions]);

  // --- Tag Management ---

  const addTag = useCallback(
    (tag: string) => {
      const trimmedTag = tag.trim();
      if (!trimmedTag || tags.includes(trimmedTag as any)) {
        setInputValue('');
        setTagError(undefined);
        return;
      }

      if (maxTags !== undefined && tags.length >= maxTags) {
        setTagError(`Maximum of ${maxTags} tags reached.`);
        return;
      }

      const validationMessage = validateTag?.(trimmedTag as any);
      if (validationMessage) {
        setTagError(validationMessage);
        return;
      }

      setTags([...tags, trimmedTag as any]);
      setInputValue('');
      setTagError(undefined);
    },
    [tags, setTags, validateTag, maxTags]
  );

  const removeTag = useCallback(
    (tagToRemove: string) => {
      setTags(tags.filter((tag) => tag !== (tagToRemove as any)));
      // Clear any tag-specific error when a tag is removed
      setTagError(undefined);
    },
    [tags, setTags]
  );

  // --- Event Handlers ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    // Clear error on input change
    setTagError(undefined);

    // Auto-add tag on comma or Enter
    if (value.endsWith(',') || value.endsWith(' ')) {
      const newTag = value.slice(0, -1);
      addTag(newTag);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const isAutocompleteOpen = filteredSuggestions.length > 0;

    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault(); // Prevent form submission or default comma behavior

      if (isAutocompleteOpen && highlightedIndex !== -1) {
        // Use highlighted suggestion
        addTag(filteredSuggestions[highlightedIndex]);
      } else {
        // Use current input value
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && inputValue === '') {
      // Remove last tag on backspace if input is empty
      if (tags.length > 0) {
        removeTag(tags[tags.length - 1] as string);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (isAutocompleteOpen) {
        setHighlightedIndex((prevIndex) =>
          prevIndex < filteredSuggestions.length - 1 ? prevIndex + 1 : 0
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isAutocompleteOpen) {
        setHighlightedIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : filteredSuggestions.length - 1
        );
      }
    } else if (e.key === 'Escape') {
      setHighlightedIndex(-1);
      // Optionally clear input or just close suggestions
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion);
    inputRef.current?.focus();
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    // Check if the focus is moving to a suggestion item (which is prevented by onMouseDown)
    // If not, and the input value is not empty, add it as a tag
    if (inputValue.trim() && !hasError) {
      addTag(inputValue);
    }
    setIsFocused(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  // --- Styling ---

  const baseClasses = 'flex flex-wrap items-center w-full min-h-[40px] p-1 border rounded-lg transition-all duration-200';
  const focusClasses = isFocused ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-gray-300 dark:border-gray-600';
  const errorClasses = hasError ? 'border-red-500 ring-2 ring-red-500' : '';
  const disabledClasses = disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white dark:bg-gray-800';

  return (
    <div className={`font-sans ${className}`}>
      {label && (
        <label htmlFor="tag-input-field" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div
        className={`${baseClasses} ${focusClasses} ${errorClasses} ${disabledClasses}`}
        onClick={() => inputRef.current?.focus()}
        aria-live="polite"
        aria-atomic="true"
      >
        {/* Render Tags */}
        {tags.map((tag) => (
          <Tag
            key={tag as string}
            tag={tag as string}
            onRemove={() => removeTag(tag as string)}
            disabled={disabled}
          />
        ))}

        {/* Input Field and Autocomplete Container */}
        <div className="relative flex-grow min-w-[100px]">
          <input
            ref={inputRef}
            id="tag-input-field"
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={tags.length === 0 ? placeholder : ''}
            disabled={disabled || (maxTags !== undefined && tags.length >= maxTags)}
            className="w-full p-2 text-sm text-gray-900 dark:text-white bg-transparent focus:outline-none disabled:cursor-not-allowed"
            aria-invalid={hasError}
            aria-describedby={validationMessage ? 'tag-input-error' : undefined}
            role="combobox"
            aria-expanded={filteredSuggestions.length > 0}
            aria-autocomplete="list"
            aria-controls="tag-suggestions-list"
          />

          {/* Autocomplete Dropdown */}
          {isFocused && filteredSuggestions.length > 0 && (
            <ul
              id="tag-suggestions-list"
              className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto dark:bg-gray-800 dark:border-gray-700"
              role="listbox"
            >
              {filteredSuggestions.map((suggestion, index) => (
                <SuggestionItem
                  key={suggestion as string}
                  suggestion={suggestion as string}
                  isHighlighted={index === highlightedIndex}
                  onClick={() => handleSuggestionClick(suggestion as string)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Validation Feedback */}
      {validationMessage && (
        <p id="tag-input-error" className="mt-1 text-sm flex items-center text-red-600 dark:text-red-400">
          <AlertTriangle className="w-4 h-4 mr-1" />
          {validationMessage}
        </p>
      )}
      {!validationMessage && tags.length > 0 && (
        <p className="mt-1 text-sm flex items-center text-green-600 dark:text-green-400">
          <CheckCircle className="w-4 h-4 mr-1" />
          {tags.length} tag{tags.length !== 1 ? 's' : ''} added.
          {maxTags && ` (Max: ${maxTags})`}
        </p>
      )}
    </div>
  );
};

export default TagInput;