/**
 * CodeEditor Component
 * Syntax-highlighted code editor with line numbers
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { clsx } from 'clsx'

export interface CodeEditorProps {
  value: string
  onChange?: (value: string) => void
  language?: 'javascript' | 'typescript' | 'python' | 'json' | 'html' | 'css' | 'sql'
  theme?: 'light' | 'dark'
  readOnly?: boolean
  showLineNumbers?: boolean
  height?: string
  placeholder?: string
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'javascript',
  theme = 'dark',
  readOnly = false,
  showLineNumbers = true,
  height = '400px',
  placeholder = '// Start coding...',
}) => {
  const [code, setCode] = useState(value)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [lineCount, setLineCount] = useState(1)

  useEffect(() => {
    setCode(value)
    const lines = value.split('\n').length
    setLineCount(lines)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setCode(newValue)
    const lines = newValue.split('\n').length
    setLineCount(lines)
    onChange?.(newValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.currentTarget.selectionStart
      const end = e.currentTarget.selectionEnd
      const newValue = code.substring(0, start) + '  ' + code.substring(end)
      setCode(newValue)
      onChange?.(newValue)
      
      // Set cursor position after tab
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2
        }
      }, 0)
    }
  }

  const themeClasses = {
    light: {
      bg: 'bg-white',
      text: 'text-gray-900',
      lineNumbers: 'bg-gray-50 text-gray-500 border-gray-200',
      border: 'border-gray-300',
    },
    dark: {
      bg: 'bg-gray-900',
      text: 'text-gray-100',
      lineNumbers: 'bg-gray-800 text-gray-500 border-gray-700',
      border: 'border-gray-700',
    },
  }

  const currentTheme = themeClasses[theme]

  return (
    <div className={clsx('rounded-lg border overflow-hidden', currentTheme.border)}>
      {/* Header */}
      <div className={clsx('px-4 py-2 border-b flex items-center justify-between', currentTheme.bg, currentTheme.border)}>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className={clsx('text-sm font-mono ml-3', currentTheme.text)}>
            {language}
          </span>
        </div>
        {readOnly && (
          <span className="text-xs px-2 py-1 bg-gray-500/20 rounded text-gray-400">
            Read Only
          </span>
        )}
      </div>

      {/* Editor */}
      <div className="flex" style={{ height }}>
        {/* Line Numbers */}
        {showLineNumbers && (
          <div className={clsx('px-3 py-3 text-right select-none', currentTheme.lineNumbers)}>
            <div className="font-mono text-sm leading-6">
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i + 1}>{i + 1}</div>
              ))}
            </div>
          </div>
        )}

        {/* Code Area */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            readOnly={readOnly}
            placeholder={placeholder}
            spellCheck={false}
            className={clsx(
              'w-full h-full px-4 py-3 font-mono text-sm leading-6 resize-none focus:outline-none',
              currentTheme.bg,
              currentTheme.text,
              'placeholder:text-gray-500'
            )}
            style={{
              tabSize: 2,
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className={clsx('px-4 py-2 border-t flex items-center justify-between text-xs', currentTheme.bg, currentTheme.border, currentTheme.text)}>
        <div className="flex items-center gap-4">
          <span>Lines: {lineCount}</span>
          <span>Characters: {code.length}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <span>UTF-8</span>
          <span>•</span>
          <span>LF</span>
        </div>
      </div>
    </div>
  )
}

export default CodeEditor

