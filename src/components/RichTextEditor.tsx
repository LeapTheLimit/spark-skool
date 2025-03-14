'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  RotateCcw,
  RotateCw,
  Copy,
  Scissors,
  Clipboard,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { forwardRef, useImperativeHandle } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

// Define language-specific configurations
const languageConfig = {
  en: {
    direction: 'ltr',
    tooltips: {
      undo: 'Undo',
      redo: 'Redo',
      copy: 'Copy',
      cut: 'Cut',
      paste: 'Paste',
      font: 'Select Font'
    }
  },
  ar: {
    direction: 'rtl',
    tooltips: {
      undo: 'تراجع',
      redo: 'إعادة',
      copy: 'نسخ',
      cut: 'قص',
      paste: 'لصق',
      font: 'اختر الخط'
    }
  },
  he: {
    direction: 'rtl',
    tooltips: {
      undo: 'בטל',
      redo: 'בצע שוב',
      copy: 'העתק',
      cut: 'גזור',
      paste: 'הדבק',
      font: 'בחר גופן'
    }
  }
};

const RichTextEditor = forwardRef<any, RichTextEditorProps>(({ content, onChange }, ref) => {
  const { language } = useLanguage();
  const isRTL = language === 'ar' || language === 'he';
  const config = languageConfig[language as keyof typeof languageConfig];

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        defaultAlignment: isRTL ? 'right' : 'left'
      }),
      Highlight,
      Underline,
      Link
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        dir: config.direction,
        class: `prose max-w-none p-4 focus:outline-none text-black ${
          isRTL ? 'text-right' : 'text-left'
        }`
      }
    }
  });

  useImperativeHandle(ref, () => ({
    setContent: (newContent: string) => {
      editor?.commands.setContent(newContent);
    },
  }));

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-200">
        <div className="flex flex-wrap gap-2 p-2">
          {/* File Operations */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => editor?.commands.undo()}
              className="p-2 rounded hover:bg-blue-50"
              title={config.tooltips.undo}
            >
              <RotateCcw size={18} className="text-black" />
            </button>
            <button
              onClick={() => editor?.commands.redo()}
              className="p-2 rounded hover:bg-blue-50"
              title={config.tooltips.redo}
            >
              <RotateCw size={18} className="text-black" />
            </button>
            <div className="h-6 w-px bg-gray-300" />
            <button
              onClick={() => {
                navigator.clipboard.writeText(editor?.getHTML() || '');
                toast.success('Copied to clipboard');
              }}
              className="p-2 rounded hover:bg-blue-50"
              title={config.tooltips.copy}
            >
              <Copy size={18} className="text-black" />
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(editor?.getHTML() || '');
                editor?.commands.clearContent();
                toast.success('Cut to clipboard');
              }}
              className="p-2 rounded hover:bg-blue-50"
              title={config.tooltips.cut}
            >
              <Scissors size={18} className="text-black" />
            </button>
            <button
              onClick={async () => {
                const text = await navigator.clipboard.readText();
                editor?.commands.insertContent(text);
                toast.success('Pasted from clipboard');
              }}
              className="p-2 rounded hover:bg-blue-50"
              title={config.tooltips.paste}
            >
              <Clipboard size={18} className="text-black" />
            </button>
          </div>

          {/* Formatting Toolbar */}
          <div className="flex items-center gap-2">
            {/* Text Style */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-2 rounded hover:bg-blue-50 ${editor.isActive('bold') ? 'bg-blue-50' : ''}`}
              >
                <Bold size={20} className="text-black" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-2 rounded hover:bg-blue-50 ${editor.isActive('italic') ? 'bg-blue-50' : ''}`}
              >
                <Italic size={20} className="text-black" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`p-2 rounded hover:bg-blue-50 ${editor.isActive('underline') ? 'bg-blue-50' : ''}`}
              >
                <UnderlineIcon size={20} className="text-black" />
              </button>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-300" />

            {/* Headings */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`p-2 rounded hover:bg-blue-50 ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-50' : ''}`}
              >
                <Heading1 size={20} className="text-black" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-2 rounded hover:bg-blue-50 ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-50' : ''}`}
              >
                <Heading2 size={20} className="text-black" />
              </button>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-300" />

            {/* Alignment */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={`p-2 rounded hover:bg-blue-50 ${editor.isActive({ textAlign: 'left' }) ? 'bg-blue-50' : ''}`}
              >
                <AlignLeft size={20} className="text-black" />
              </button>
              <button
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={`p-2 rounded hover:bg-blue-50 ${editor.isActive({ textAlign: 'center' }) ? 'bg-blue-50' : ''}`}
              >
                <AlignCenter size={20} className="text-black" />
              </button>
              <button
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={`p-2 rounded hover:bg-blue-50 ${editor.isActive({ textAlign: 'right' }) ? 'bg-blue-50' : ''}`}
              >
                <AlignRight size={20} className="text-black" />
              </button>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-300" />

            {/* Lists */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-2 rounded hover:bg-blue-50 ${editor.isActive('bulletList') ? 'bg-blue-50' : ''}`}
              >
                <List size={20} className="text-black" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-2 rounded hover:bg-blue-50 ${editor.isActive('orderedList') ? 'bg-blue-50' : ''}`}
              >
                <ListOrdered size={20} className="text-black" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-100 p-8">
        <div className="mx-auto bg-white rounded-lg shadow-sm max-w-[850px] min-h-[1000px]">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor; 