'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface LeadNote {
  id: string;
  content: string;
  leadId: string;
  userId: string;
  createdAt: Date;
}

interface LeadNotesProps {
  leadId: string;
  userId: string;
}

export function LeadNotes({ leadId, userId }: LeadNotesProps) {
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch notes on component mount
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
  const handleAddNote = async () => {
    if (!newNote.trim()) {
      setError('Note content cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/lead-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote, leadId, userId }),
      });

      if (!response.ok) throw new Error('Failed to add note');

      const createdNote = await response.json();
      setNotes([createdNote, ...notes]);
      setNewNote('');
      setError('');
    } catch (err) {
      setError('Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle note deletion
  const handleDeleteNote = async (noteId: string) => {
    try {
      const response = await fetch('/api/lead-notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId }),
      });

      if (!response.ok) throw new Error('Failed to delete note');

      setNotes(notes.filter((note) => note.id !== noteId));
    } catch (err) {
      setError('Failed to delete note');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Lead Notes</h2>

      {/* Add Note Form */}
      <div className="mb-6">
        <div className="flex gap-2">
          <Input
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a new note..."
            className="flex-1"
            disabled={isSubmitting}
          />
          <Button
            onClick={handleAddNote}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Note'}
          </Button>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <p className="text-gray-600">{note.content}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteNote(note.id)}
                className="text-red-500 hover:text-red-700"
              >
                Delete
              </Button>
            </div>
            <p className="text-sm text-gray-400">
              {new Date(note.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
