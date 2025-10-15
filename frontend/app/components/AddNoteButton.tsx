'use client';

export const AddNoteButton = () => {
  const handleAddNote = async () => {
    const content = window.prompt('Enter note content:');
    if (!content) return;

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to add note');
      }

      const data = await response.json();
      alert(`Note added successfully! ID: ${data.id}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  return (
    <button
      onClick={handleAddNote}
      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      Add Note
    </button>
  );
};