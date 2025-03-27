// components/NoteLoader.tsx
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface NoteEntry {
  originalText: string;
  analysis: string;
  tag: string;
  timestamp: string;
}

interface Note {
  _id: string;
  userId: string;
  title: string;
  entries: NoteEntry[];
  createdAt: string;
  updatedAt: string;
  content?: string; // Optional, for backward compatibility
}

interface NoteLoaderProps {
  isSignedIn: boolean;
  setActiveNoteId: (id: string | null) => void;
  setNotes: (notes: Note[]) => void;
  setNoteContent: (content: string) => void;
}

const NoteLoader: React.FC<NoteLoaderProps> = ({ 
  isSignedIn, 
  setActiveNoteId, 
  setNotes,
  setNoteContent
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
          // Use the correct API endpoint format
          const response = await fetch(`/api/notes?id=${noteId}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch note');
          }
          
          const data = await response.json();
          if (data.success && data.note) {
            console.log("Loaded note:", data.note);
            setActiveNoteId(data.note._id);
            
            // Check if entries exist and if they have content
            if (data.note.entries && data.note.entries.length > 0) {
              // Format the entries into the expected noteContent format
              const formattedContent = data.note.entries.map((entry: any) => {
                return `${entry.originalText || ''}\nAI Analysis: ${entry.analysis || ''}\nTag: ${entry.tag || 'general'}`;
              }).join('\n\n');
              
              // Update the noteContent state
              setNoteContent(formattedContent);
            } else if (data.note.content) {
              // Fallback to content if available
              setNoteContent(data.note.content);
            }
            
            setNotes([data.note]);
          }
        } catch (error) {
          console.error("Error loading note from URL:", error);
        }
      }
    };
    
    loadNoteFromURL();
  }, [isSignedIn, searchParams, setActiveNoteId, setNotes, setNoteContent]);

  // This component doesn't render anything visible
  return null;
};

export default NoteLoader;