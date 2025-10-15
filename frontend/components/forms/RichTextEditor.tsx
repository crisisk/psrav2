import React, { useCallback, useEffect, useState } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';

// --- Icons (Placeholder for a real icon library like Lucide or Heroicons) ---
// In a real project, these would be imported from a library.
// For this example, we'll use simple text or SVG placeholders.
const Icon = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <span className={`inline-block w-5 h-5 text-center ${className}`}>{children}</span>
);

// --- Toolbar Component ---

interface ToolbarButtonProps {
  editor: Editor;
  command: () => boolean;
  isActive: boolean;
  icon: React.ReactNode;
  title: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ editor, command, isActive, icon, title }) => (
  <button
    type="button"
    onClick={command}
    title={title}
    className={`p-2 rounded transition-colors duration-150 ${
      isActive
        ? 'bg-sevensa-primary text-white hover:bg-sevensa-primary-dark'
        : 'text-gray-600 hover:bg-gray-200'
    }`}
    disabled={!editor}
  >
    {icon}
  </button>
);

const MenuBar: React.FC<{ editor: Editor | null }> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-gray-300 bg-gray-50 rounded-t-lg">
      <ToolbarButton
        editor={editor}
        command={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        icon={<Icon className="font-bold">B</Icon>}
        title="Bold (Ctrl+B)"
      />
      <ToolbarButton
        editor={editor}
        command={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        icon={<Icon className="italic">I</Icon>}
        title="Italic (Ctrl+I)"
      />
      <ToolbarButton
        editor={editor}
        command={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        icon={<Icon className="line-through">S</Icon>}
        title="Strike (Ctrl+Shift+X)"
      />
      <ToolbarButton
        editor={editor}
        command={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        icon={<Icon>{"</>"}</Icon>}
        title="Code (Ctrl+E)"
      />
      <div className="w-px h-full bg-gray-300 mx-1" />
      <ToolbarButton
        editor={editor}
        command={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        icon={<Icon className="font-extrabold">H1</Icon>}
        title="Heading 1 (Ctrl+Alt+1)"
      />
      <ToolbarButton
        editor={editor}
        command={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        icon={<Icon className="font-bold">H2</Icon>}
        title="Heading 2 (Ctrl+Alt+2)"
      />
      <ToolbarButton
        editor={editor}
        command={() => editor.chain().focus().setParagraph().run()}
        isActive={editor.isActive('paragraph')}
        icon={<Icon>P</Icon>}
        title="Paragraph (Ctrl+Shift+0)"
      />
      <div className="w-px h-full bg-gray-300 mx-1" />
      <ToolbarButton
        editor={editor}
        command={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        icon={<Icon>UL</Icon>}
        title="Bullet List (Ctrl+Shift+8)"
      />
      <ToolbarButton
        editor={editor}
        command={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        icon={<Icon>OL</Icon>}
        title="Ordered List (Ctrl+Shift+7)"
      />
      <ToolbarButton
        editor={editor}
        command={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        icon={<Icon>&ldquo;</Icon>}
        title="Blockquote (Ctrl+Shift+B)"
      />
      <ToolbarButton
        editor={editor}
        command={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        icon={<Icon>{"{}"}</Icon>}
        title="Code Block (Ctrl+Alt+C)"
      />
      <div className="w-px h-full bg-gray-300 mx-1" />
      <ToolbarButton
        editor={editor}
        command={setLink}
        isActive={editor.isActive('link')}
        icon={<Icon>🔗</Icon>}
        title="Set Link (Ctrl+K)"
      />
      <ToolbarButton
        editor={editor}
        command={() => editor.chain().focus().unsetLink().run()}
        isActive={false}
        icon={<Icon>🚫🔗</Icon>}
        title="Unset Link"
      />
      <div className="w-px h-full bg-gray-300 mx-1" />
      <ToolbarButton
        editor={editor}
        command={() => editor.chain().focus().setHorizontalRule().run()}
        isActive={false}
        icon={<Icon>HR</Icon>}
        title="Horizontal Rule"
      />
      <ToolbarButton
        editor={editor}
        command={() => editor.chain().focus().undo().run()}
        isActive={false}
        icon={<Icon>↩</Icon>}
        title="Undo (Ctrl+Z)"
      />
      <ToolbarButton
        editor={editor}
        command={() => editor.chain().focus().redo().run()}
        isActive={false}
        icon={<Icon>↪</Icon>}
        title="Redo (Ctrl+Shift+Z)"
      />
    </div>
  );
};

// --- RichTextEditor Component ---

interface RichTextEditorProps {
  /** The content value (HTML string) */
  value: string;
  /** Callback for when the content changes (returns HTML string) */
  onChange: (value: string) => void;
  /** Optional placeholder text */
  placeholder?: string;
  /** Optional name for form validation/accessibility */
  name?: string;
  /** Optional error message for validation */
  error?: string;
  /** Optional boolean to indicate if the field is required */
  required?: boolean;
  /** Optional class name for the main container */
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write something amazing...',
  name,
  error,
  required = false,
  className = '',
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable hard break to allow for better markdown compatibility
        hardBreak: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-sevensa-primary hover:text-sevensa-primary-dark underline transition-colors',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      // The tiptap-markdown extension is used to handle markdown input/output
      Markdown,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      // For a standard WYSIWYG that accepts markdown shortcuts and outputs HTML:
      onChange(editor.getHTML());
    },
    onBlur: () => setIsFocused(false),
    onFocus: () => setIsFocused(true),
    editorProps: {
      attributes: {
        // Apply Tailwind classes to the editor content area
        // The 'prose' class is from @tailwindcss/typography, which is assumed to be installed
        class: 'prose max-w-none p-4 min-h-[200px] focus:outline-none',
      },
    },
  }, [placeholder]); // Re-initialize if placeholder changes

  // Effect to handle external value changes (e.g., form reset)
  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      // Use setContent to update the editor content without losing focus
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  // Sevensa Branding: Customizing the border and focus state
  // Assumes 'sevensa-primary' and 'sevensa-primary-dark' are defined in Tailwind config
  const borderClasses = error
    ? 'border-red-500 ring-2 ring-red-500'
    : isFocused
    ? 'border-sevensa-primary ring-2 ring-sevensa-primary'
    : 'border-gray-300';

  return (
    <div className={`RichTextEditor ${className}`}>
      {/* Hidden input for form validation/submission */}
      <input
        type="hidden"
        name={name}
        value={value}
        required={required}
        // This input is purely for form submission/validation and is hidden
        // The actual editor content is managed by TipTap
      />

      <div
        className={`border rounded-lg shadow-sm transition-all duration-200 ${borderClasses}`}
      >
        <MenuBar editor={editor} />
        <div className="bg-white rounded-b-lg">
          <EditorContent editor={editor} />
        </div>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default RichTextEditor;