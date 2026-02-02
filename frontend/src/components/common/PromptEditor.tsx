import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'

import { createLowlight } from 'lowlight'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Quote,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Eraser,
  Link as LinkIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/* ---------------- LOWLIGHT SETUP ---------------- */
const lowlight = createLowlight()
lowlight.register('javascript', javascript)
lowlight.register('json', json)

/* ---------------- PROPS ---------------- */
interface PromptEditorProps {
  value: string // HTML
  isEditing: boolean
  onChange: (value: string) => void // HTML
}

/* ---------------- COMPONENT ---------------- */
export function PromptEditor({ value, isEditing, onChange }: PromptEditorProps) {
  const editor = useEditor({
    editable: isEditing,
    extensions: [
      StarterKit.configure({
        codeBlock: false, // disable default code block
      }),
      Underline,
      Link,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: value, // MUST be HTML
    onUpdate: ({ editor }) => {
      // IMPORTANT: preserve formatting
      onChange(editor.getHTML())
    },
  })

  if (!editor) return null

  return (
    <div className="rounded-md border">
      {/* ================= TOOLBAR ================= */}
      {isEditing && (
        <div className="flex flex-wrap gap-1 border-b bg-gray-50 px-2 py-1">
          {/* Undo / Redo */}
          <ToolbarButton
            icon={<Undo size={16} />}
            onClick={() => editor.chain().focus().undo().run()}
          />
          <ToolbarButton
            icon={<Redo size={16} />}
            onClick={() => editor.chain().focus().redo().run()}
          />

          {/* Inline formatting */}
          <ToolbarButton
            icon={<Bold size={16} />}
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          />
          <ToolbarButton
            icon={<Italic size={16} />}
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          />
          <ToolbarButton
            icon={<UnderlineIcon size={16} />}
            active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          />
          <ToolbarButton
            icon={<Strikethrough size={16} />}
            active={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          />
          <ToolbarButton
            icon={<Code size={16} />}
            active={editor.isActive('code')}
            onClick={() => editor.chain().focus().toggleCode().run()}
          />

          {/* Block formatting */}
          <ToolbarButton
            icon={<Quote size={16} />}
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          />
          <ToolbarButton
            icon={<Code size={16} />}
            active={editor.isActive('codeBlock')}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          />

          {/* Lists */}
          <ToolbarButton
            icon={<List size={16} />}
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          />
          <ToolbarButton
            icon={<ListOrdered size={16} />}
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          />

          {/* Alignment */}
          <ToolbarButton
            icon={<AlignLeft size={16} />}
            active={editor.isActive({ textAlign: 'left' })}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
          />
          <ToolbarButton
            icon={<AlignCenter size={16} />}
            active={editor.isActive({ textAlign: 'center' })}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
          />
          <ToolbarButton
            icon={<AlignRight size={16} />}
            active={editor.isActive({ textAlign: 'right' })}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
          />

          {/* Link */}
          <ToolbarButton
            icon={<LinkIcon size={16} />}
            active={editor.isActive('link')}
            onClick={() => {
              const url = window.prompt('Enter URL')
              if (url) {
                editor.chain().focus().setLink({ href: url }).run()
              }
            }}
          />

          {/* Clear */}
          <ToolbarButton
            icon={<Eraser size={16} />}
            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          />
        </div>
      )}

      {/* ================= EDITOR ================= */}
      <EditorContent
        editor={editor}
        className={cn(
          'min-h-[360px] p-3 text-sm',
          isEditing ? 'bg-white' : 'bg-transparent text-muted-foreground',
        )}
      />
    </div>
  )
}

/* ---------------- TOOLBAR BUTTON ---------------- */
function ToolbarButton({
  icon,
  active = false,
  onClick,
}: {
  icon: React.ReactNode
  active?: boolean
  onClick: () => void
}) {
  return (
    <Button type="button" size="icon" variant={active ? 'default' : 'ghost'} onClick={onClick}>
      {icon}
    </Button>
  )
}
