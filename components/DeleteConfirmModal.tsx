import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isDarkMode: boolean;
    title?: string;
    description?: string;
}

export default function DeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    isDarkMode,
    title = "Delete this note?",
    description = "This action will move the note to trash."
}: DeleteConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className={cn(
                    "w-full max-w-sm rounded-2xl shadow-2xl scale-100 opacity-100 animate-in zoom-in-95 duration-200 border",
                    isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-100"
                )}
            >
                <div className="p-6 text-center">
                    <div className={cn(
                        "w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center",
                        isDarkMode ? "bg-red-900/20 text-red-500" : "bg-red-50 text-red-500"
                    )}>
                        <AlertTriangle size={24} />
                    </div>

                    <h3 className={cn(
                        "text-lg font-semibold mb-2",
                        isDarkMode ? "text-white" : "text-gray-900"
                    )}>
                        {title}
                    </h3>

                    <p className={cn(
                        "text-sm mb-6",
                        isDarkMode ? "text-zinc-400" : "text-gray-500"
                    )}>
                        {description}
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className={cn(
                                "flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                                isDarkMode
                                    ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                            )}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
