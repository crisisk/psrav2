'use client';
import { useEffect, useState } from 'react';

type Note = {
  id: string;
  leadId: string;
  text: string;
  createdAt: string;
};

export default function LeadNotes({ leadId }: { leadId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [error, setError] = useState('');

  // Fetch notes when component mounts or leadId changes
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await fetch(`/api/lead-notes?leadId=${leadId}`);
        if (!response.ok) throw new Error('Failed to fetch notes');
        const data = await response.json();
        setNotes(data);
      } catch (err) {
        setError('Failed to load notes');
      }
    };

    fetchNotes();
  }, [leadId]);

  // Handle note submission
  const submitNote = async () => {
    if (!newNote.trim()) {
      setError('Note cannot be empty');
      return;
    }

    try {
      const response = await fetch('/api/lead-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, text: newNote }),
      });

      if (!response.ok) throw new Error('Failed to save note');

      const savedNote = await response.json();
      setNotes([savedNote, ...notes]);
      setNewNote('');
      setError('');
    } catch (err) {
      setError('Failed to save note');
    }
  };

  // Handle note deletion
  const deleteNote = async (noteId: string) => {
    try {
      const response = await fetch('/api/lead-notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: noteId }),
      });

      if (!response.ok) throw new Error('Failed to delete note');

      setNotes(notes.filter(note => note.id !== noteId));
    } catch (err) {
      setError('Failed to delete note');
    }
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-white">
        <textarea
          value={newNote}
          onChange={(e) => {
            setNewNote(e.target.value);
            setError('');
          }}
          placeholder="Add new note..."
          className="w-full p-2 border rounded mb-2"
          rows={3}
        />
        <div className="flex justify-between items-center">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            onClick={submitNote}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
            disabled={!newNote.trim()}
          >
            Add Note
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {notes.map((note) => (
          <div key={note.id} className="border rounded-lg p-4 bg-white">
            <p className="text-gray-600 mb-2">{note.text}</p>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>{new Date(note.createdAt).toLocaleDateString()}</span>
              <button
                onClick={() => deleteNote(note.id)}
                className="text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
