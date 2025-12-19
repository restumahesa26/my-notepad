'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Type,
    Pencil,
    Eraser,
    Trash2,
    Cloud,
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    CheckSquare
} from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebaseConfig';
import { useAutoSave } from '@/lib/useAutoSave';

// Tiptap
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

interface NoteEditorProps {
    noteId: string;
    isDarkMode: boolean;
}

export default function NoteEditor({ noteId, isDarkMode }: NoteEditorProps) {
    // --- STATE MANAGEMENT ---
    const [mode, setMode] = useState<'text' | 'draw'>('text');
    const [title, setTitle] = useState('');

    // Custom hook for saving
    const { saveText, saveDrawing, saveTitle, status } = useAutoSave(noteId);

    // Drawing States
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushColor, setBrushColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(3);
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');

    // Data for canvas sync
    const [remoteDrawingData, setRemoteDrawingData] = useState<string | null>(null);

    // --- TIPTAP EDITOR SETUP ---
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
        ],
        editorProps: {
            attributes: {
                class: `prose prose-sm sm:prose-base focus:outline-none max-w-none h-full ${isDarkMode ? 'prose-invert text-zinc-200' : 'text-gray-800'
                    } p-8`,
            },
        },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            saveText(html); // Saving HTML content
        },
        immediatelyRender: false,
    });

    // --- INITIAL DATA LOADING ---
    useEffect(() => {
        // Text Sync (Load Once)
        const textRef = ref(db, `notes/${noteId}/text`);
        onValue(textRef, (snapshot) => {
            const val = snapshot.val();
            if (val !== null && editor && editor.isEmpty) {
                // Only content if editor is empty to avoid overwriting typing
                // Actually, "editor.isEmpty" might be too strict if user just typed 1 char.
                // Ideally we track if we have initialized.
                // For this MVP, we just set content on mount equivalent.
                // Since this effect runs on noteId change and editor instance:
                editor.commands.setContent(val);
            }
        }, { onlyOnce: true });

        // Title Sync
        const titleRef = ref(db, `notes/${noteId}/title`);
        onValue(titleRef, (snapshot) => {
            const val = snapshot.val();
            if (val) setTitle(val);
        }, { onlyOnce: true });

        // Drawing Sync
        const drawRef = ref(db, `notes/${noteId}/drawing`);
        const unsubDraw = onValue(drawRef, (snapshot) => {
            const val = snapshot.val();
            if (val && typeof val === 'string') {
                setRemoteDrawingData(val);
            }
        });

        return () => {
            unsubDraw();
        };
    }, [noteId, editor]); // Editor dependency ensures we set content when editor is ready

    // --- HANDLERS ---

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setTitle(val);
        // Debounce saving title to avoid spamming too much? 
        // useAutoSave doesn't debounce title yet? 
        // Let's just save it. It's fine for small inputs.
        saveTitle(val);
    };

    // Canvas Logic
    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Get correct coordinates for mouse or touch
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        ctx.beginPath();
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        ctx.lineWidth = brushSize; // Dynamic size
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out'; // True transparency eraser
            // Eraser often needs to be bigger? Let's use same slider but maybe multiply? 
            // User requested "adjust width of eraser brush". We will use the same 'brushSize' state.
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = brushColor;
        }

        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            // Save canvas state
            const canvas = canvasRef.current;
            if (canvas) {
                saveDrawing(canvas.toDataURL());
            }
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
            saveDrawing(null); // Clear remote
        }
    };

    // Resize canvas & Load remote data
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas && canvas.parentElement) {
            const parent = canvas.parentElement;
            if (canvas.width !== parent.clientWidth || canvas.height !== parent.clientHeight) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
            }

            if (remoteDrawingData) {
                const img = new Image();
                img.onload = () => {
                    const ctx = canvas.getContext('2d');
                    ctx?.clearRect(0, 0, canvas.width, canvas.height); // Clear before drawing remote to avoid artifacts
                    ctx?.drawImage(img, 0, 0);
                };
                img.src = remoteDrawingData;
            }
        }
    }, [mode, remoteDrawingData]);

    // Helpers for custom cursor
    const getCursorStyle = () => {
        if (mode !== 'draw') return undefined; // default
        // We can use an SVG cursor or simple CSS geometry if possible, but circle cursor usually needs SVG or PNG.
        // Let's create a dynamic SVG string for the cursor.
        const size = brushSize;
        const half = size / 2 + 1; // +1 for stroke boundary
        const total = size + 2;

        // Use a simple circle svg
        // We need to encode it.
        // Stroke Black or White depending on theme? Or just gray to be visible on both?
        // Let's use a distinct color like gray with white outline.
        const svg = `
          <svg width="${total}" height="${total}" viewBox="0 0 ${total} ${total}" xmlns="http://www.w3.org/2000/svg">
            <circle cx="${total / 2}" cy="${total / 2}" r="${size / 2}" fill="none" stroke="gray" stroke-width="1" />
          </svg>
        `;
        const url = `data:image/svg+xml;base64,${btoa(svg)}`;
        return { cursor: `url(${url}) ${total / 2} ${total / 2}, crosshair` };
    };

    return (
        <div className="flex flex-col h-full overflow-hidden relative">
            <div className={`flex items-center justify-between px-4 py-2 border-b transition-colors duration-300 ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} z-20`}>
                {/* Internal Toolbar for this Note */}
                <div className="flex items-center gap-4 flex-1">
                    {/* Title Input */}
                    <input
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        placeholder="Untitled Note"
                        className={`bg-transparent font-semibold focus:outline-none border-b border-transparent focus:border-blue-500 w-48 ${isDarkMode ? 'text-white' : 'text-black'}`}
                    />

                    <div className={`flex items-center p-1 rounded-lg border ${isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-gray-100 border-gray-200'}`}>
                        <button
                            onClick={() => setMode('text')}
                            className={`p-1.5 rounded-md transition-all ${mode === 'text' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Text Mode"
                        >
                            <Type size={16} />
                        </button>
                        <button
                            onClick={() => setMode('draw')}
                            className={`p-1.5 rounded-md transition-all ${mode === 'draw' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Draw Mode"
                        >
                            <Pencil size={16} />
                        </button>
                    </div>

                    {/* Status */}
                    <span className="text-xs text-gray-400">
                        {status === 'Saving...' ? 'Saving...' : 'Saved'}
                    </span>
                </div>

                {/* TEXT TOOLBAR */}
                {mode === 'text' && editor && (
                    <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-4 mr-4">
                        <button
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            className={`p-1.5 rounded-md ${editor.isActive('bold') ? 'bg-gray-200 text-black' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Bold"
                        >
                            <Bold size={16} />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            className={`p-1.5 rounded-md ${editor.isActive('italic') ? 'bg-gray-200 text-black' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Italic"
                        >
                            <Italic size={16} />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleUnderline().run()}
                            className={`p-1.5 rounded-md ${editor.isActive('underline') ? 'bg-gray-200 text-black' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Underline"
                        >
                            <UnderlineIcon size={16} />
                        </button>
                        <div className="w-px h-4 bg-gray-300 mx-1"></div>
                        <button
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            className={`p-1.5 rounded-md ${editor.isActive('bulletList') ? 'bg-gray-200 text-black' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Bullet List"
                        >
                            <List size={16} />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            className={`p-1.5 rounded-md ${editor.isActive('orderedList') ? 'bg-gray-200 text-black' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Numbered List"
                        >
                            <ListOrdered size={16} />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleTaskList().run()}
                            className={`p-1.5 rounded-md ${editor.isActive('taskList') ? 'bg-gray-200 text-black' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Checklist"
                        >
                            <CheckSquare size={16} />
                        </button>
                    </div>
                )}

                {/* Draw Tools (Visible always if mode is draw, or maybe strictly follow user request "same time").
             User said "write and draw at same time". I'll keep the toggle to switch "active layer" for input, 
             but visually they are stacked. 
         */}
                {mode === 'draw' && (
                    <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4">
                        {/* Tool Switcher */}
                        <div className="flex bg-gray-100 rounded-md p-1 border border-gray-200 dark:bg-zinc-800 dark:border-zinc-700">
                            <button onClick={() => setTool('pen')} className={`p-1.5 rounded-md ${tool === 'pen' ? 'bg-white shadow text-black' : 'text-gray-500'}`} title="Pencil"><Pencil size={14} /></button>
                            <button onClick={() => setTool('eraser')} className={`p-1.5 rounded-md ${tool === 'eraser' ? 'bg-white shadow text-black' : 'text-gray-500'}`} title="Eraser"><Eraser size={14} /></button>
                        </div>

                        {/* Size Slider */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold text-gray-400">Size</span>
                            <input
                                type="range"
                                min="1"
                                max="50"
                                value={brushSize}
                                onChange={(e) => setBrushSize(Number(e.target.value))}
                                className="w-20 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                            />
                            <span className="text-xs w-4 text-center">{brushSize}</span>
                        </div>

                        {/* Circular Color Picker (Moon shape / Circle) */}
                        <div className="relative group">
                            <div
                                className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-zinc-600 cursor-pointer shadow-sm overflow-hidden"
                                style={{ backgroundColor: brushColor }}
                            >
                                <input
                                    type="color"
                                    value={brushColor}
                                    onChange={(e) => {
                                        setBrushColor(e.target.value);
                                        setTool('pen'); // Switch back to 'pen' if picking color
                                    }}
                                    className="opacity-0 w-full h-full cursor-pointer"
                                    title="Choose Color"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className={`flex-1 relative w-full h-full ${isDarkMode ? 'bg-zinc-950' : 'bg-white'}`}>
                {/* Text Layer (Tiptap) */}
                <div className={`absolute inset-0 z-10 ${mode === 'text' ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                    {editor && <EditorContent editor={editor} className="h-full overflow-y-auto" />}
                </div>

                {/* Canvas Layer - Always visible (opacity 1), but z-index/pointer-events managed */}
                <div
                    className={`absolute inset-0 z-20 ${mode === 'draw' ? 'pointer-events-auto' : 'pointer-events-none'}`}
                    style={getCursorStyle()}
                >
                    <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-full block"
                    />
                </div>
            </div>
        </div>
    );
}
