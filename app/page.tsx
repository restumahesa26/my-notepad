'use client';

import React, { useState } from 'react';
import {
  Plus,
  FileText,
  X,
  Menu,
  Moon,
  Sun,
  Layout,
  Trash2,
  Edit2
} from 'lucide-react';
import { useNotesList } from '@/lib/useNotesList';
import NoteEditor from '@/components/NoteEditor';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { cn } from '@/lib/utils'; // Assuming you have this utility
import { ref, set, remove, update } from 'firebase/database';
import { db } from '@/lib/firebaseConfig';

export default function Home() {
  // Global App State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Data State
  const { notes, loading } = useNotesList();

  // Tab State
  const [openTabs, setOpenTabs] = useState<string[]>(['demo-note']);
  const [activeTab, setActiveTab] = useState('demo-note');

  // Renaming State
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingSource, setEditingSource] = useState<'sidebar' | 'tab' | null>(null);
  const [editTitleInput, setEditTitleInput] = useState('');

  // Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  // Actions
  const openNote = (noteId: string) => {
    if (!openTabs.includes(noteId)) {
      setOpenTabs([...openTabs, noteId]);
    }
    setActiveTab(noteId);
  };

  const closeTab = (noteId: string) => {
    // Helper to close tab logic without event
    const newTabs = openTabs.filter(id => id !== noteId);
    setOpenTabs(newTabs);

    // If we closed the active tab, switch to another
    if (activeTab === noteId) {
      if (newTabs.length > 0) {
        setActiveTab(newTabs[newTabs.length - 1]);
      } else {
        setActiveTab(''); // No tabs open
      }
    }
  };

  const handleCloseTab = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    closeTab(noteId);
  };

  const createNote = async () => {
    const newId = `note-${Date.now()}`;
    // Initialize in DB
    const noteRef = ref(db, `notes/${newId}`);
    await set(noteRef, {
      text: '',
      title: 'New Note',
      createdAt: Date.now()
    });
    // Ensure we aren't stuck in editing another note
    setEditingNoteId(null);
    setEditingSource(null);
    openNote(newId);
  };

  const initiateDelete = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    setNoteToDelete(noteId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!noteToDelete) return;

    // Close tab if open
    if (openTabs.includes(noteToDelete)) {
      closeTab(noteToDelete);
    }

    // Remove from Firebase
    const noteRef = ref(db, `notes/${noteToDelete}`);
    await remove(noteRef);

    setNoteToDelete(null);
  };

  // Renaming Logic
  const startRenaming = (e: React.MouseEvent, noteId: string, currentTitle: string, source: 'sidebar' | 'tab') => {
    e.stopPropagation();
    // We don't force switch tab if renaming from sidebar, but typically UX expects it.
    // If not open, do we open it? Maybe not necessary for rename.
    setEditingNoteId(noteId);
    setEditingSource(source);
    setEditTitleInput(currentTitle);
  };

  const saveRename = async () => {
    if (editingNoteId) {
      const noteRef = ref(db, `notes/${editingNoteId}`);
      await update(noteRef, { title: editTitleInput });
      setEditingNoteId(null);
      setEditingSource(null);
    }
  };

  const cancelRename = () => {
    setEditingNoteId(null);
    setEditingSource(null);
  };

  // Helper to get title for a tab
  const getNoteTitle = (id: string) => {
    const n = notes.find(n => n.id === id);
    return n ? n.title : 'Loading...';
  };

  return (
    <div className={cn(
      "flex h-screen w-full overflow-hidden transition-colors duration-300",
      isDarkMode ? "bg-zinc-950 text-zinc-100" : "bg-[#f5f5f7] text-gray-900"
    )}>

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        isDarkMode={isDarkMode}
      />

      {/* SIDEBAR */}
      <aside className={cn(
        "flex-col border-r transition-all duration-300 shadow-sm",
        isDarkMode ? "bg-zinc-900/50 border-zinc-800 backdrop-blur-xl" : "bg-white/80 border-gray-200/60 backdrop-blur-xl",
        sidebarOpen ? "w-72" : "w-0 overflow-hidden opacity-0"
      )}>
        <div className="p-4 border-b border-inherit flex items-center justify-between">
          <span className="font-semibold text-sm tracking-tight flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-sm"></div>
            Explorer
          </span>
          <button onClick={createNote} className={cn(
            "p-1.5 rounded-md transition-all",
            isDarkMode ? "hover:bg-zinc-800 text-zinc-400 hover:text-white" : "hover:bg-gray-100 text-gray-500 hover:text-black"
          )} title="Create New Note">
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {loading && <div className="p-4 text-xs text-gray-400 animate-pulse">Loading notes...</div>}

          {!loading && notes.map((note) => (
            <div
              key={note.id}
              onClick={() => openNote(note.id)}
              className={cn(
                "px-3 py-2 text-sm cursor-pointer rounded-lg flex items-center justify-between gap-2.5 transition-all group",
                activeTab === note.id
                  ? (isDarkMode ? "bg-blue-600/10 text-blue-400" : "bg-white shadow-sm text-gray-900 font-medium")
                  : (isDarkMode ? "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200" : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-900")
              )}
            >
              {editingNoteId === note.id && editingSource === 'sidebar' ? (
                <input
                  autoFocus
                  type="text"
                  value={editTitleInput}
                  onChange={(e) => setEditTitleInput(e.target.value)}
                  onBlur={saveRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveRename();
                    if (e.key === 'Escape') cancelRename();
                  }}
                  className="bg-transparent border-b border-blue-500 focus:outline-none w-full min-w-0 py-0.5"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <div className="flex items-center gap-2 truncate flex-1">
                    <FileText size={15} className={cn("transition-colors flex-shrink-0", activeTab === note.id ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500")} />
                    <span className="truncate">{note.title || 'Untitled'}</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => startRenaming(e, note.id, note.title, 'sidebar')}
                      className={cn(
                        "p-1 rounded-md transition-all",
                        isDarkMode ? "hover:bg-zinc-700 text-zinc-500 hover:text-zinc-200" : "hover:bg-gray-200 text-gray-400 hover:text-gray-700"
                      )}
                      title="Rename Note"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={(e) => initiateDelete(e, note.id)}
                      className={cn(
                        "p-1 rounded-md transition-all",
                        isDarkMode ? "hover:bg-red-900/30 text-zinc-500 hover:text-red-400" : "hover:bg-red-50 text-gray-400 hover:text-red-500"
                      )}
                      title="Delete Note"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {notes.length === 0 && !loading && (
            <div className="p-4 text-xs text-gray-400 text-center italic">No notes found. Create one!</div>
          )}
        </div>
      </aside>

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent">

        {/* TOP BAR / TABS */}
        <header className={cn(
          "h-12 border-b flex items-center select-none z-40",
          isDarkMode ? "bg-zinc-900/80 border-zinc-800 backdrop-blur-md" : "bg-[#f5f5f7]/80 border-gray-200/60 backdrop-blur-md"
        )}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              "w-12 h-full flex items-center justify-center transition-colors",
              isDarkMode ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-gray-200 text-gray-500"
            )}
          >
            <Layout size={18} />
          </button>

          {/* TABS SCROLL AREA */}
          <div className="flex-1 flex items-end h-full overflow-x-auto no-scrollbar pt-2 px-1 gap-1">
            {openTabs.map(noteId => (
              <div
                key={noteId}
                onClick={() => setActiveTab(noteId)}
                onDoubleClick={(e) => startRenaming(e, noteId, getNoteTitle(noteId), 'tab')}
                className={cn(
                  "h-[calc(100%-4px)] pl-3 pr-2 min-w-[140px] max-w-[240px] rounded-t-lg border-x border-t flex items-center justify-between gap-3 text-xs cursor-pointer group transition-all relative",
                  isDarkMode
                    ? (activeTab === noteId ? "bg-zinc-950 border-zinc-800 text-zinc-200" : "bg-zinc-800/20 border-transparent text-zinc-500 hover:bg-zinc-800")
                    : (activeTab === noteId ? "bg-white border-gray-200/60 shadow-sm text-gray-800 z-10" : "bg-gray-100/50 border-transparent text-gray-500 hover:bg-gray-200/50")
                )}
                title="Double-click to rename"
              >
                {editingNoteId === noteId && editingSource === 'tab' ? (
                  <input
                    autoFocus
                    type="text"
                    value={editTitleInput}
                    onChange={(e) => setEditTitleInput(e.target.value)}
                    onBlur={saveRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRename();
                      if (e.key === 'Escape') cancelRename();
                    }}
                    className={cn(
                      "bg-transparent border-b-2 focus:outline-none w-full min-w-0 py-0.5 text-inherit z-50 relative",
                      isDarkMode ? "border-blue-500 text-white" : "border-blue-500 text-gray-900"
                    )}
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="truncate font-medium select-none">{getNoteTitle(noteId)}</span>
                )}

                {!editingNoteId && (
                  <button
                    onClick={(e) => handleCloseTab(e, noteId)}
                    className={cn(
                      "opacity-0 group-hover:opacity-100 p-0.5 rounded-full transition-all",
                      isDarkMode ? "hover:bg-zinc-700 text-zinc-400" : "hover:bg-gray-300 text-gray-500"
                    )}
                  >
                    <X size={12} />
                  </button>
                )}

                {/* Active Indicator Line for Tabs */}
                {activeTab === noteId && !editingNoteId && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full"></div>
                )}
              </div>
            ))}
          </div>

          {/* WINDOW ACTIONS */}
          <div className="flex items-center px-4 gap-3 border-l border-inherit h-4/6 my-auto">
            {/* Delete Current Active Note Button */}
            {activeTab && (
              <button
                onClick={(e) => initiateDelete(e, activeTab)}
                className={cn(
                  "p-1.5 rounded-full transition-all shadow-sm group",
                  isDarkMode ? "bg-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-zinc-700" : "bg-white text-gray-400 hover:text-red-500 hover:bg-red-50"
                )}
                title="Delete Current Note"
              >
                <Trash2 size={16} />
              </button>
            )}

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={cn(
                "p-1.5 rounded-full transition-all shadow-sm",
                isDarkMode ? "bg-zinc-800 text-yellow-400 hover:bg-zinc-700" : "bg-white text-gray-600 hover:bg-gray-50"
              )}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {/* EDITOR CONTENT */}
        <main className={cn(
          "flex-1 relative overflow-hidden",
          isDarkMode ? "bg-zinc-950" : "bg-white"
        )}>
          {activeTab ? (
            <NoteEditor key={activeTab} noteId={activeTab} isDarkMode={isDarkMode} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg", isDarkMode ? "bg-zinc-900" : "bg-white")}>
                <div className="w-8 h-8 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"></div>
              </div>
              <p className="font-medium text-sm">Select a note to view</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
