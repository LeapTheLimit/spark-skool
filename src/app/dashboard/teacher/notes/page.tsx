'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { 
  PencilIcon, 
  XMarkIcon, 
  PlusIcon,
  PaperClipIcon,
  ArchiveBoxIcon,
  CheckIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

// Add these types at the top of the file
interface Note {
  id: string;
  content: string;
  category: string;
  createdAt: string;
  color: string;
  pinned: boolean;
  archived: boolean;
  lastEdited?: string;
  title?: string;
  updatedAt: string;
  tags?: string[];
}

interface NoteModalProps {
  note: Note;
  onClose: () => void;
  onSave: (note: Note) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onPin: (id: string) => void;
}

// Define the PinIcon component
const PinIcon = ({ className = "w-5 h-5" }) => (
  <svg 
    viewBox="0 0 48 48" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    fill="currentColor"
  >
    <path 
      fillRule="evenodd"
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M5.5,17.83a4.35,4.35,0,0,0,6.17,0l9.25,9.25-3.09,3.09a4.36,4.36,0,0,0,0,6.16l7.71-7.71L39.42,42.5H42.5V39.42L28.62,25.54,30.17,24l3.08-3.08,3.08-3.09a4.36,4.36,0,0,0-6.16,0l-3.09,3.09-9.25-9.25a4.35,4.35,0,0,0,0-6.17L14.75,8.58,8.58,14.75Z" 
    />
    <line 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      x1="28.62" 
      y1="25.54" 
      x2="25.54" 
      y2="28.62" 
    />
  </svg>
);

// Note Modal for editing
const NoteModal = ({ note, onClose, onSave, onDelete, onArchive, onPin }: NoteModalProps) => {
  const { t } = useLanguage();
  const [editedContent, setEditedContent] = useState(note.content);
  const [editedColor, setEditedColor] = useState(note.color || 'yellow');
  const editorRef = useRef<HTMLDivElement>(null);
  const newNoteRef = useRef<HTMLDivElement>(null);
  
  // Replace the addFormatting function with one that uses document.execCommand
  const applyFormatting = (command: string, value: string | undefined = undefined) => {
    // Make sure the editor has focus
    if (editorRef.current) {
      editorRef.current.focus();
    }
    
    // Execute the formatting command
    document.execCommand(command, false, value);
    
    // Update the editedContent state with the new HTML content
    if (editorRef.current) {
      setEditedContent(editorRef.current.innerHTML);
    }
  };
  
  const handleSave = () => {
    onSave({
      ...note,
      content: editedContent,
      color: editedColor,
      lastEdited: new Date().toISOString()
    });
  };
  
  useEffect(() => {
    const currentRef = newNoteRef.current;
    if (currentRef) {
      const handleFocus = function(this: HTMLDivElement) {
        if (this.innerHTML.trim() === '') {
          this.innerHTML = '';
        }
      };

      const handleBlur = function(this: HTMLDivElement) {
        if (this.innerHTML.trim() === '') {
          this.innerHTML = '';
        }
      };

      currentRef.addEventListener('focus', handleFocus);
      currentRef.addEventListener('blur', handleBlur);

      return () => {
        currentRef.removeEventListener('focus', handleFocus);
        currentRef.removeEventListener('blur', handleBlur);
      };
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white max-w-2xl w-full rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col`}>
        <div className={`p-4 flex justify-between items-center ${
          editedColor === 'yellow' ? 'bg-yellow-100' :
          editedColor === 'blue' ? 'bg-blue-100' :
          editedColor === 'green' ? 'bg-green-100' :
          editedColor === 'pink' ? 'bg-pink-100' :
          'bg-purple-100'
        }`}>
          <div className="flex space-x-2">
            {['yellow', 'blue', 'green', 'pink', 'purple'].map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setEditedColor(color)}
                className={`w-6 h-6 rounded-full ${
                  color === 'yellow' ? 'bg-yellow-300' :
                  color === 'blue' ? 'bg-blue-300' :
                  color === 'green' ? 'bg-green-300' :
                  color === 'pink' ? 'bg-pink-300' :
                  'bg-purple-300'
                } ${editedColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => applyFormatting('insertUnorderedList')}
              className="p-2 rounded-full hover:bg-white/30 text-gray-700"
              title={t('bulletList')}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 6H21M8 12H21M8 18H21M3 6H3.01M3 12H3.01M3 18H3.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={() => {
                const checkbox = '<input type="checkbox" class="mr-2 h-4 w-4">';
                applyFormatting('insertHTML', checkbox);
              }}
              className="p-2 rounded-full hover:bg-white/30 text-gray-700"
              title={t('addCheckbox')}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={() => onPin(note.id)}
              className={`p-2 rounded-full hover:bg-white/30 ${note.pinned ? 'text-amber-600' : 'text-gray-700'}`}
              title={note.pinned ? t('unpinNote') : t('pinNote')}
            >
              <PinIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => onArchive(note.id)}
              className={`p-2 rounded-full hover:bg-white/30 ${note.archived ? 'text-blue-600' : 'text-gray-700'}`}
              title={note.archived ? t('unarchiveNote') : t('archiveNote')}
            >
              <ArchiveBoxIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDelete(note.id)}
              className="p-2 rounded-full hover:bg-white/30 text-red-500"
              title={t('deleteNote')}
            >
              <TrashIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/30 text-gray-700"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Simplified formatting toolbar */}
        <div className="border-b p-2 flex gap-1 bg-gray-50">
          <button onClick={() => applyFormatting('bold')} className="p-2 rounded hover:bg-gray-100 text-gray-700" title={t('bold')}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 12H14C16.2091 12 18 10.2091 18 8C18 5.79086 16.2091 4 14 4H6V12ZM6 12H15C17.2091 12 19 13.7909 19 16C19 18.2091 17.2091 20 15 20H6V12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button onClick={() => applyFormatting('italic')} className="p-2 rounded hover:bg-gray-100 text-gray-700" title={t('italic')}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 4H10M14 20H5M15 4L9 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button onClick={() => applyFormatting('underline')} className="p-2 rounded hover:bg-gray-100 text-gray-700" title={t('underline')}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 5V11C7 14.3137 9.68629 17 13 17C16.3137 17 19 14.3137 19 11V5M5 19H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
          <button onClick={() => applyFormatting('insertUnorderedList')} className="p-2 rounded hover:bg-gray-100 text-gray-700" title={t('bulletList')}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 6H21M8 12H21M8 18H21M3 6H3.01M3 12H3.01M3 18H3.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button onClick={() => {
            const checkbox = '<input type="checkbox" class="mr-2 h-4 w-4">';
            applyFormatting('insertHTML', checkbox);
          }} className="p-2 rounded hover:bg-gray-100 text-gray-700" title={t('addCheckbox')}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        {/* Rich text editor div instead of textarea */}
        <div className="p-4 flex-1 overflow-auto bg-white">
          <div
            ref={editorRef}
            contentEditable
            dangerouslySetInnerHTML={{ __html: editedContent }}
            onInput={(e) => setEditedContent(e.currentTarget.innerHTML)}
            className="w-full h-full min-h-[300px] p-4 bg-white border-none focus:outline-none focus:ring-0 text-gray-800 whitespace-pre-wrap"
          />
        </div>
        
        <div className={`p-3 flex justify-between items-center text-xs text-gray-500 border-t ${
          editedColor === 'yellow' ? 'bg-yellow-50' :
          editedColor === 'blue' ? 'bg-blue-50' :
          editedColor === 'green' ? 'bg-green-50' :
          editedColor === 'pink' ? 'bg-pink-50' :
          'bg-purple-50'
        }`}>
          <div>
            {t('created')}: {format(new Date(note.createdAt), 'MMM d, yyyy')}
            {note.lastEdited && (
              <span className="ml-3">
                {t('edited')}: {format(new Date(note.lastEdited), 'MMM d, yyyy')}
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            className="px-4 py-1 bg-[#3ab8fe] text-white rounded-lg hover:bg-[#0099e5] transition-colors text-sm"
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function NotesPage() {
  const { t, language } = useLanguage();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [noteColor, setNoteColor] = useState('yellow');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'pinned' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add RTL support
  useEffect(() => {
    // Set document direction based on language
    const isRtl = language === 'ar' || language === 'he';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [language]);
  
  // Filter notes based on view mode and search query
  const filteredNotes = notes.filter(note => {
    // First filter by view mode
    const modeMatches = viewMode === 'pinned' 
      ? note.pinned && !note.archived 
      : viewMode === 'archived' 
        ? note.archived 
        : !note.archived;
    
    // Then filter by search query
    const searchMatches = !searchQuery || 
      note.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      note.content?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return modeMatches && searchMatches;
  });
  
  // Sort notes with pinned ones at the top
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    // First by pinned status (pinned first)
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    // Then by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  // Load notes from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem('teacherNotes');
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (error) {
        console.error('Failed to parse notes:', error);
        toast.error(t('failedToLoadNotes'));
      }
    }
  }, [t]);

  // Enhanced process content function to properly convert markdown to HTML
  const processContent = (content: string) => {
    if (!content) return '';
    
    // Handle bold with **text**
    let processed = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Handle italic with _text_
    processed = processed.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Handle underline with ~text~
    processed = processed.replace(/~(.*?)~/g, '<u>$1</u>');
    
    // Handle bullet points
    processed = processed.replace(/• (.*?)(?=$|\n)/g, '<div class="flex items-start gap-2 mb-1"><div class="w-1 h-1 mt-2 rounded-full bg-gray-600 flex-shrink-0"></div><div>$1</div></div>');
    
    // Handle checkboxes (unchecked)
    processed = processed.replace(/□ (.*?)(?=$|\n)/g, '<div class="flex items-start gap-1 mb-1"><div class="w-4 h-4 mt-1 border border-gray-400 rounded flex-shrink-0"></div><div>$1</div></div>');
    
    // Handle checkboxes (checked)
    processed = processed.replace(/■ (.*?)(?=$|\n)/g, '<div class="flex items-start gap-1 mb-1"><div class="w-4 h-4 mt-1 bg-gray-400 rounded flex-shrink-0 flex items-center justify-center"><svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div><div>$1</div></div>');
    
    // Handle line breaks
    processed = processed.replace(/\n/g, '<br>');
    
    return processed;
  };

  // Handle adding a new note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    
    const note: Note = {
      id: Date.now().toString(),
      content: newNote,
      category: 'note',
      createdAt: new Date().toISOString(),
      color: noteColor,
      pinned: false,
      archived: false,
      title: '',
      updatedAt: new Date().toISOString(),
      tags: []
    };
    
    setNotes(prevNotes => {
      const updatedNotes = [note, ...prevNotes];
      localStorage.setItem('teacherNotes', JSON.stringify(updatedNotes));
      return updatedNotes;
    });
    
    setNewNote('');
    // Randomly select a new color for the next note
    const colors = ['yellow', 'blue', 'green', 'pink', 'purple'];
    setNoteColor(colors[Math.floor(Math.random() * colors.length)]);
    
    toast.success(t('noteAdded'));
  };
  
  const updateNote = (updatedNote: Note) => {
    // Update UI
    const updatedNotes = notes.map(note => 
      note.id === updatedNote.id ? updatedNote : note
    );
    setNotes(updatedNotes);
    
    // Update localStorage
    localStorage.setItem('teacherNotes', JSON.stringify(updatedNotes));
    
    setSelectedNote(null);
    toast.success(t('noteSaved'));
  };
  
  const deleteNote = (id: string) => {
    if (confirm(t('confirmDeleteNote'))) {
      // Update UI
      const updatedNotes = notes.filter(note => note.id !== id);
      setNotes(updatedNotes);
      
      // Update localStorage
      localStorage.setItem('teacherNotes', JSON.stringify(updatedNotes));
      
      setSelectedNote(null);
      toast.success(t('noteDeleted'));
    }
  };
  
  const togglePinNote = (id: string) => {
    const note = notes.find(n => n.id === id);
    if (note) {
      const updated = { ...note, pinned: !note.pinned };
      updateNote(updated);
      toast.success(note.pinned ? t('noteUnpinned') : t('notePinned'));
    }
  };
  
  const toggleArchiveNote = (id: string) => {
    const note = notes.find(n => n.id === id);
    if (note) {
      const updated = { ...note, archived: !note.archived };
      updateNote(updated);
      toast.success(note.archived ? t('noteUnarchived') : t('noteArchived'));
    }
  };

  // Get background color based on note color
  const getNoteStyle = (color: string = 'yellow') => {
    const colorStyles: {[key: string]: string} = {
      yellow: 'bg-yellow-50 border-yellow-200 rotate-1',
      blue: 'bg-blue-50 border-blue-200 -rotate-1',
      green: 'bg-green-50 border-green-200 rotate-2',
      pink: 'bg-pink-50 border-pink-200 -rotate-2',
      purple: 'bg-purple-50 border-purple-200 rotate-1'
    };
    return colorStyles[color] || colorStyles.yellow;
  };

  // Add CSS for the placeholder text
  const newNoteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentRef = newNoteRef.current;
    if (currentRef) {
      const handleFocus = function(this: HTMLDivElement) {
        if (this.innerHTML.trim() === '') {
          this.innerHTML = '';
        }
      };

      const handleBlur = function(this: HTMLDivElement) {
        if (this.innerHTML.trim() === '') {
          this.innerHTML = '';
        }
      };

      currentRef.addEventListener('focus', handleFocus);
      currentRef.addEventListener('blur', handleBlur);

      return () => {
        currentRef.removeEventListener('focus', handleFocus);
        currentRef.removeEventListener('blur', handleBlur);
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-sky-50/30 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t('notes')}</h1>
          
          <div className="bg-white rounded-full shadow-sm border flex p-1">
            <button
              className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                viewMode === 'all' ? 'bg-[#3ab8fe] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setViewMode('all')}
            >
              {t('all')}
            </button>
            <button
              className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                viewMode === 'pinned' ? 'bg-[#3ab8fe] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setViewMode('pinned')}
            >
              {t('pinned')}
            </button>
            <button
              className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                viewMode === 'archived' ? 'bg-[#3ab8fe] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setViewMode('archived')}
            >
              {t('archived')}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          {viewMode !== 'archived' && (
            <div className="mb-8">
              <form onSubmit={handleAddNote} className="space-y-4">
                <div className="relative bg-white rounded-lg shadow-sm">
                  <div 
                    ref={newNoteRef}
                    contentEditable
                    onInput={(e) => setNewNote(e.currentTarget.innerHTML)}
                    className={`w-full p-6 min-h-[120px] border ${
                      noteColor === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
                      noteColor === 'blue' ? 'bg-blue-50 border-blue-200' :
                      noteColor === 'green' ? 'bg-green-50 border-green-200' :
                      noteColor === 'pink' ? 'bg-pink-50 border-pink-200' :
                      'bg-purple-50 border-purple-200'
                    } rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3ab8fe] text-gray-800 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500 empty:before:opacity-100`}
                    data-placeholder={t('addNewNotePlaceholder')}
                  />
                  <div className={`absolute top-3 ${language === 'ar' || language === 'he' ? 'left-3' : 'right-3'} flex space-x-2`}>
                    {['yellow', 'blue', 'green', 'pink', 'purple'].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNoteColor(color)}
                        className={`w-6 h-6 rounded-full ${
                          color === 'yellow' ? 'bg-yellow-300' :
                          color === 'blue' ? 'bg-blue-300' :
                          color === 'green' ? 'bg-green-300' :
                          color === 'pink' ? 'bg-pink-300' :
                          'bg-purple-300'
                        } ${noteColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#3ab8fe] text-white rounded-lg hover:bg-[#0099e5] transition-colors flex items-center gap-2"
                    disabled={!newNote.trim()}
                  >
                    <PlusIcon className="w-5 h-5" />
                    {t('addNote')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Notes Grid with improved interaction */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedNotes.length > 0 ? (
              sortedNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className={`${getNoteStyle(note.color)} shadow-md p-5 border relative h-[200px] overflow-hidden cursor-pointer group hover:shadow-lg transition-shadow`}
                >
                  {note.pinned && (
                    <div className="absolute top-2 right-2 text-amber-600">
                      <PinIcon className="w-4 h-4" />
                    </div>
                  )}
                  
                  {note.archived && (
                    <div className="absolute top-2 left-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md text-xs font-medium">
                      {t('archived')}
                    </div>
                  )}
                  
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePinNote(note.id);
                      }}
                      className={`p-1 rounded-full hover:bg-white/50 ${note.pinned ? 'text-amber-600' : 'text-gray-400'}`}
                    >
                      <PinIcon className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div 
                    className="font-medium text-gray-800 line-clamp-7 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: note.content }}
                  />
                  
                  <p className="text-xs text-gray-500 mt-4 absolute bottom-2 right-3">
                    {note.lastEdited ? format(new Date(note.lastEdited), 'MMM d') : format(new Date(note.createdAt), 'MMM d')}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="flex justify-center mb-4">
                  <div className="bg-yellow-100 p-5 rounded-lg rotate-3 shadow-md border border-yellow-200">
                    <PencilIcon className="w-16 h-16 text-yellow-500 mx-auto" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-700">
                  {viewMode === 'pinned' 
                    ? t('noPinnedNotes') 
                    : viewMode === 'archived' 
                      ? t('noArchivedNotes') 
                      : t('noNotesYet')}
                </h3>
                <p className="text-gray-500 mt-1 max-w-md mx-auto">
                  {viewMode === 'pinned' 
                    ? t('clickPinToPinNote') 
                    : viewMode === 'archived' 
                      ? t('archivedNotesAppearHere') 
                      : t('addFirstNotePrompt')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Note Edit Modal */}
      {selectedNote && (
        <NoteModal 
          note={selectedNote}
          onClose={() => setSelectedNote(null)}
          onSave={updateNote}
          onDelete={deleteNote}
          onArchive={toggleArchiveNote}
          onPin={togglePinNote}
        />
      )}
      
      {viewMode === 'archived' && filteredNotes.length > 0 && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => {
              if (confirm(t('confirmDeleteAllArchivedNotes'))) {
                // Delete all archived notes
                const nonArchivedNotes = notes.filter(note => !note.archived);
                setNotes(nonArchivedNotes);
                
                // Update localStorage
                localStorage.setItem('teacherNotes', JSON.stringify(nonArchivedNotes));
                
                toast.success(t('allArchivedNotesDeleted'));
              }
            }}
            className="bg-red-500 text-white p-3 rounded-full shadow-lg hover:bg-red-600 transition-colors"
            title={t('deleteAllArchived')}
          >
            <TrashIcon className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
} 