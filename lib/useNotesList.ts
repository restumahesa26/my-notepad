import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from './firebaseConfig';

export interface NoteItem {
    id: string;
    title: string;
    isDeleted?: boolean;
}

export const useNotesList = () => {
    const [notes, setNotes] = useState<NoteItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const notesRef = ref(db, 'notes');
        const unsubscribe = onValue(notesRef, (snapshot) => {
            const val = snapshot.val();
            if (val) {
                const list = Object.keys(val).map((key) => ({
                    id: key,
                    title: val[key].title || val[key].text?.slice(0, 15) || 'Untitled Note',
                    isDeleted: val[key].isDeleted || false
                }));
                setNotes(list);
            } else {
                setNotes([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { notes, loading };
};
