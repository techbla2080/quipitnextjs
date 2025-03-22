'use client';

interface Note {
  id: string;
  content: string;
  createdAt: Date;
}

interface NoteListProps {
  notes: Note[];
  onRescue: (id: string) => void;
  onDelete: (id: string) => void;
  isProcessing: boolean;
}

export default function NoteList({
  notes,
  onRescue,
  onDelete,
  isProcessing,
}: NoteListProps) {
  return (
    <div className="space-y-4">
      {notes.length === 0 ? (
        <div className="p-8 text-center text-gray-500 border border-dashed rounded-lg">
          Your notes will appear here. New notes will be at the top.
        </div>
      ) : (
        notes.map((note) => {
          // Extract tag if present
          const hasTag = note.content.includes(':');
          const tag = hasTag ? note.content.split(':', 1)[0] : null;
          const content = hasTag ? note.content.substring(note.content.indexOf(':') + 1).trim() : note.content;
          
          // Choose color based on tag
          let tagColor = 'bg-gray-200 text-gray-800';
          if (tag === 'watch') tagColor = 'bg-blue-200 text-blue-800';
          if (tag === 'read') tagColor = 'bg-green-200 text-green-800';
          if (tag === 'task') tagColor = 'bg-red-200 text-red-800';
          if (tag === 'idea') tagColor = 'bg-purple-200 text-purple-800';
          if (tag === 'note') tagColor = 'bg-yellow-200 text-yellow-800';
          
          return (
            <div 
              key={note.id} 
              className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-grow">
                  {tag && (
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mr-2 ${tagColor}`}>
                      {tag}
                    </span>
                  )}
                  <p className="mt-1">{content}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {new Date(note.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onRescue(note.id)}
                    className={`px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition text-sm ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isProcessing}
                    title="Move to top"
                  >
                    Rescue
                  </button>
                  <button
                    onClick={() => onDelete(note.id)}
                    className={`px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isProcessing}
                    title="Delete note"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}