import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface NoteLoaderProps {
  isSignedIn: boolean;
  setActiveNoteId: (id: string | null) => void;
  setNotes: (notes: any[]) => void;
}

const NoteLoader: React.FC<NoteLoaderProps> = ({ 
  isSignedIn, 
  setActiveNoteId, 
  setNotes 
}) => {
  const searchParams = useSearchParams();

  useEffect(() => {
    // This runs when the component mounts
    const loadNoteFromURL = async () => {
      // Get noteId from URL
      const noteId = searchParams.get('noteId');
      
      if (noteId && isSignedIn) {
        try {
          console.log("Loading note from URL with ID:", noteId);
          // Fetch the specific note
          const response = await fetch(`/api/notes/${noteId}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch note');
          }
          
          const data = await response.json();
          if (data.success && data.note) {
            console.log("Loaded note:", data.note);
            // Set your note state variables
            setActiveNoteId(data.note._id);
            
            // If your note structure has entries
            if (data.note.entries && data.note.entries.length > 0) {
              // Update your UI with the note content
              setNotes([data.note]); // If you're using a notes array
            }
          }
        } catch (error) {
          console.error("Error loading note from URL:", error);
        }
      }
    };
    
    loadNoteFromURL();
  }, [isSignedIn, searchParams, setActiveNoteId, setNotes]);

  // This component doesn't render anything visible
  return null;
};

export default NoteLoader;