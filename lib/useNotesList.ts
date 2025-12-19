import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from './firebaseConfig';

export interface NoteItem {
    id: string;
    title: string; // We might need to derive this from content or store it
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
                    // Simple title derivation: "Untitled" or just ID for now, 
                    // or we could peek at 'text' content if available in the snapshot.
                    // Let's try to grab the first few chars of 'text' if it exists.
                    title: val[key].title || val[key].text?.slice(0, 15) || 'Untitled Note'
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
