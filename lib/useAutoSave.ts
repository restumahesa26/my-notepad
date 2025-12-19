import { useState, useMemo } from 'react';
import { ref, set } from 'firebase/database';
import { db } from './firebaseConfig';
import { debounce } from './utils';

export const useAutoSave = (noteId: string = 'demo-note') => {
    const [status, setStatus] = useState<'Saved' | 'Saving...' | 'Error'>('Saved');

    const debouncedSaveText = useMemo(
        () =>
            debounce((text: string) => {
                const textRef = ref(db, `notes/${noteId}/text`);
                set(textRef, text)
                    .then(() => setStatus('Saved'))
                    .catch(() => setStatus('Error'));
            }, 1000),
        [noteId]
    );

    const saveText = (text: string) => {
        setStatus('Saving...');
        debouncedSaveText(text);
    };

    const saveDrawing = (data: any) => {
        setStatus('Saving...');
        const drawRef = ref(db, `notes/${noteId}/drawing`);
        set(drawRef, data)
            .then(() => setStatus('Saved'))
            .catch(() => setStatus('Error'));
    };

    const saveTitle = (title: string) => {
        setStatus('Saving...');
        const titleRef = ref(db, `notes/${noteId}/title`);
        set(titleRef, title)
            .then(() => setStatus('Saved'))
            .catch(() => setStatus('Error'));
    };

    return { saveText, saveDrawing, saveTitle, status };
};
