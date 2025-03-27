import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

interface SavedNote {
  _id: string;
  userId: string;
  title: string;
  entries: {
    originalText: string;
    analysis: string;
    tag: string;
    timestamp: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface SavedNotesSectionProps {
  isNavigating: boolean;
  setIsNavigating: (value: boolean) => void;
}

const SavedNotesSection: React.FC<SavedNotesSectionProps> = ({ 
  isNavigating,
  setIsNavigating
}) => {
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const router = useRouter();

  // Fetch saved notes
  const fetchSavedNotes = async () => {
    try {
      console.log('Starting to fetch saved notes...');
      const response = await fetch('/api/notes');
      
      if (!response.ok) {
        console.error('Fetch response not ok:', response.status);
        return;
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.notes)) {
        console.log('Formatted notes:', data.notes);
        setSavedNotes(data.notes);
      }
    } catch (error) {
      console.error('Error in fetchSavedNotes:', error);
    }
  };

  // Navigate to a note
  const navigateToNote = async (note: SavedNote) => {
    if (isNavigating) return;
    
    try {
      setIsNavigating(true);
      console.log('Starting navigation to note:', note._id);
      
      const url = `/agents2?noteId=${note._id}`;
      window.history.pushState({}, '', url);
      
      // Small delay to show loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      window.location.reload();
    } catch (error) {
      console.error('Navigation error:', error);
      setIsNavigating(false);
    }
  };

  // Delete a note
  const handleDeleteNote = async (e: React.MouseEvent<HTMLButtonElement>, noteId: string) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/notes?id=${noteId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete note');
      }

      setSavedNotes(current => current.filter(note => note._id !== noteId));
      toast.success('Note deleted successfully');

      const urlParams = new URLSearchParams(window.location.search);
      const currentNoteId = urlParams.get('noteId');
      
      if (currentNoteId === noteId) {
        router.push('/agents2');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  // Load notes on mount and set up event listener
  useEffect(() => {
    fetchSavedNotes();
    
    const handleNoteSaved = async () => {
      console.log('Note saved event received in sidebar');
      await fetchSavedNotes();
    };

    window.addEventListener('noteSaved', handleNoteSaved);
    
    return () => {
      window.removeEventListener('noteSaved', handleNoteSaved);
    };
  }, []);

  return (
    <div className="border-t border-gray-100 pt-4 mt-4">
      <h2 className="px-4 py-2 text-sm font-semibold text-gray-800 tracking-wide">
        SAVED NOTES
      </h2>
      {savedNotes.length > 0 ? (
        <div className="space-y-2">
          {savedNotes.map((note) => {
            const urlParams = new URLSearchParams(window.location.search);
            const isActive = urlParams.get('noteId') === note._id;
            // Get the first entry's text for display or show the title
            const displayText = note.entries.length > 0 
              ? note.entries[0].originalText.substring(0, 30) + (note.entries[0].originalText.length > 30 ? '...' : '')
              : note.title;
            
            return (
              <div
                key={note._id}
                className={`
                  px-2 py-3 w-full
                  hover:bg-blue-50/50 rounded-lg 
                  cursor-pointer group transition-all
                  ${isActive ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-white shadow-sm'}
                `}
                onClick={() => navigateToNote(note)}
              >
                <div className="flex items-center justify-between mb-2 w-full">
                  <span className="font-semibold text-gray-800 truncate max-w-[160px]">
                    {note.title}
                  </span>
                  <Button
                    onClick={(e) => handleDeleteNote(e, note._id)}
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  >
                    <Trash className="h-4 w-4 text-gray-400 hover:text-red-500" />
                  </Button>
                </div>

                <div className="flex flex-col space-y-2 text-sm text-gray-600">
                  <div className="truncate">{displayText}</div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 shrink-0" />
                    <span className="truncate">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: isActive ? '100%' : '75%' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="px-4 text-sm text-gray-500">No saved notes</p>
      )}
    </div>
  );
};

export default SavedNotesSection;