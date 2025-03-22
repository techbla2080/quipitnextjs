'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

// Components
import NoteInput from '@/components/NoteInput';
import NoteList from '@/components/NoteList';
import ReviewMode from '@/components/ReviewMode';

// Main Page
export default function DropThoughtPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [notes, setNotes] = useState<{ id: string; content: string; createdAt: Date }[]>([]);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      redirect('/sign-in');
    }
  }, [isLoaded, isSignedIn]);

  // Load example notes for testing
  useEffect(() => {
    if (isLoaded && isSignedIn && notes.length === 0) {
      const exampleNotes = [
        {
          id: '3',
          content: 'task: Implement MongoDB integration for DropThought',
          createdAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
        },
        {
          id: '2',
          content: 'read: Article about Andrej Karpathy\'s append-and-review method',
          createdAt: new Date(Date.now() - 3600000 * 5), // 5 hours ago
        },
        {
          id: '1',
          content: 'idea: Add search functionality to the note list',
          createdAt: new Date(Date.now() - 3600000 * 8), // 8 hours ago
        },
      ];
      setNotes(exampleNotes);
    }
  }, [isLoaded, isSignedIn, notes.length]);

  // Append a new note (in-memory)
  const handleAppend = (content: string) => {
    setIsProcessing(true);
    
    // Add slight delay for better UX
    setTimeout(() => {
      const newNote = {
        id: Date.now().toString(), // Temporary ID
        content,
        createdAt: new Date(),
      };
      setNotes([newNote, ...notes]);
      setIsProcessing(false);
    }, 300);
  };

  // Rescue a note (move to top)
  const handleRescue = (id: string) => {
    setIsProcessing(true);
    
    setTimeout(() => {
      const note = notes.find((n) => n.id === id);
      if (!note) {
        setIsProcessing(false);
        return;
      }
      
      const newNote = {
        id: Date.now().toString(), // New ID for the rescued note
        content: note.content,
        createdAt: new Date(),
      };
      setNotes([newNote, ...notes.filter((n) => n.id !== id)]);
      setIsProcessing(false);
    }, 300);
  };

  // Delete a note
  const handleDelete = (id: string) => {
    setIsProcessing(true);
    
    setTimeout(() => {
      setNotes(notes.filter((n) => n.id !== id));
      setIsProcessing(false);
    }, 300);
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-t-2 border-purple-500 rounded-full animate-spin"></div>
        <p className="ml-2">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-purple-700">DropThought Agent</h1>
          <p className="text-gray-600">Inspired by Andrej Karpathy's append-and-review method</p>
        </div>
        {user && (
          <div className="flex items-center space-x-2">
            <span className="text-sm">{user.firstName || 'User'}</span>
            {user.imageUrl && (
              <img 
                src={user.imageUrl} 
                alt="Profile" 
                className="w-8 h-8 rounded-full" 
              />
            )}
          </div>
        )}
      </div>
      
      <div className="mb-6 p-4 bg-purple-50 rounded-lg">
        <p className="text-sm">
          <strong>How it works:</strong> Add notes and they'll appear at the top. 
          Older notes naturally sink to the bottom. "Rescue" important notes to bring them back to the top, 
          or delete notes you no longer need. Use "Review Mode" to get AI-generated insights about your notes.
        </p>
      </div>
      
      <NoteInput onAppend={handleAppend} isProcessing={isProcessing} />
      
      <div className="flex justify-center my-6">
        <button
          onClick={() => setIsReviewMode(!isReviewMode)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center"
        >
          {isReviewMode ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Exit Review Mode
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              Enter Review Mode
            </>
          )}
        </button>
      </div>
      
      {isReviewMode && <ReviewMode notes={notes} />}
      
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Notes</h2>
          <span className="text-sm text-gray-500">{notes.length} notes</span>
        </div>
        <NoteList 
          notes={notes} 
          onRescue={handleRescue} 
          onDelete={handleDelete} 
          isProcessing={isProcessing}
        />
      </div>
      
      <div className="mt-8 text-center text-xs text-gray-500">
        <p>
          Testing version - notes are stored in memory and will be lost on page refresh.
          <br />
          Future version will include MongoDB persistence.
        </p>
      </div>
    </div>
  );
}