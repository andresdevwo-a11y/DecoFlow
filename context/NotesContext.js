import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as Database from '../services/Database';

const NotesContext = createContext();

export const NotesProvider = ({ children }) => {
    const [notes, setNotes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadNotes = useCallback(async () => {
        setIsLoading(true);
        try {
            const loadedNotes = await Database.getNotes();
            setNotes(loadedNotes);
        } catch (error) {
            console.error("Error loading notes:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load notes on mount
    useEffect(() => {
        loadNotes();
    }, [loadNotes]);

    const addNote = useCallback(async (noteData) => {
        try {
            const newNote = {
                ...noteData,
                id: noteData.id || Database.generateUUID(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            await Database.createNote(newNote);
            setNotes(prev => [newNote, ...prev]);
            return newNote;
        } catch (error) {
            console.error("Error creating note:", error);
            throw error;
        }
    }, []);

    const updateNote = useCallback(async (noteData) => {
        try {
            const updatedNote = {
                ...noteData,
                updatedAt: new Date().toISOString()
            };
            await Database.updateNote(updatedNote);
            setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
            return updatedNote;
        } catch (error) {
            console.error("Error updating note:", error);
            throw error;
        }
    }, []);

    const deleteNote = useCallback(async (id) => {
        try {
            await Database.deleteNote(id);
            setNotes(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error("Error deleting note:", error);
            throw error;
        }
    }, []);

    return (
        <NotesContext.Provider value={{
            notes,
            isLoading,
            loadNotes,
            addNote,
            updateNote,
            deleteNote
        }}>
            {children}
        </NotesContext.Provider>
    );
};

export const useNotes = () => {
    const context = useContext(NotesContext);
    if (!context) {
        throw new Error('useNotes must be used within a NotesProvider');
    }
    return context;
};
