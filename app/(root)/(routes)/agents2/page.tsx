'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

interface NoteItem {
  id: string;
  content: string;
  createdAt: Date;
}

export default function KarpathyNotePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [noteItems, setNoteItems] = useState<NoteItem[]>([]);
  const [input, setInput] = useState<string>('');
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [insights, setInsights] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      redirect('/sign-in');
    }
  }, [isLoaded, isSignedIn]);

  // Load example notes for testing
  useEffect(() => {
    if (isLoaded && isSignedIn && noteItems.length === 0) {
      const exampleItems = [
        {
          id: '1',
          content: 'TODO for today:\n- ✅ morning exercise\n- write a blog post\n- do actual work',
          createdAt: new Date(Date.now() - 3600000) // 1 hour ago
        },
        {
          id: '2',
          content: 'Read: Abundance book?',
          createdAt: new Date(Date.now() - 7200000) // 2 hours ago
        },
        {
          id: '3',
          content: 'idea: World of ChatGPT',
          createdAt: new Date(Date.now() - 10800000) // 3 hours ago
        }
      ];
      setNoteItems(exampleItems);
    }
  }, [isLoaded, isSignedIn, noteItems.length]);

  // Append a new note
  const handleAppend = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setIsProcessing(true);
    
    // Process with OpenAI (in a real implementation)
    // For this example, we'll just append without AI processing
    setTimeout(() => {
      const newNote: NoteItem = {
        id: Date.now().toString(),
        content: input,
        createdAt: new Date(),
      };
      setNoteItems([newNote, ...noteItems]);
      setInput('');
      setIsProcessing(false);
    }, 300);
  };

  // Rescue a note (move to top)
  const handleRescue = (id: string): void => {
    const note = noteItems.find(item => item.id === id);
    if (!note) return;
    
    const newNote: NoteItem = {
      id: Date.now().toString(),
      content: note.content,
      createdAt: new Date(),
    };
    
    setNoteItems([newNote, ...noteItems.filter(item => item.id !== id)]);
  };

  // Delete a note
  const handleDelete = (id: string): void => {
    setNoteItems(noteItems.filter(item => item.id !== id));
  };

  // Review mode - AI analysis
  const handleReviewMode = async (): Promise<void> => {
    if (isReviewMode) {
      setIsReviewMode(false);
      return;
    }
    
    setIsProcessing(true);
    setIsReviewMode(true);
    
    // In a real implementation, this would call OpenAI
    // Here we'll simulate the analysis
    setTimeout(() => {
      const generatedInsights = [
        "You have a TODO list at the top of your notes",
        "Consider scheduling time to read the Abundance book"
      ];
      
      setInsights(generatedInsights);
      setIsProcessing(false);
    }, 1000);
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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">DropThought</h1>
        <p className="text-gray-600">Inspired by Andrej Karpathy's append-and-review method</p>
      </div>
      
      {/* Append Form */}
      <form onSubmit={handleAppend} className="mb-6">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a new note..."
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
          rows={2}
          disabled={isProcessing}
        />
        <div className="flex justify-end mt-2">
          <button 
            type="submit" 
            className={`px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isProcessing}
          >
            {isProcessing ? 'Adding...' : 'Add to Top'}
          </button>
        </div>
      </form>
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Your Notes</h2>
        <button
          onClick={handleReviewMode}
          className={`px-4 py-2 ${isReviewMode ? 'bg-gray-600' : 'bg-gray-800'} text-white rounded-lg hover:bg-gray-700 transition`}
          disabled={isProcessing}
        >
          {isReviewMode ? 'Exit Review' : 'Review Notes'}
        </button>
      </div>
      
      {/* Main Notes List - More user-friendly approach */}
      <div className="space-y-3 mb-6">
        {noteItems.length === 0 ? (
          <div className="p-8 text-center text-gray-500 border border-dashed rounded-lg">
            Your notes will appear here. New notes will be at the top.
          </div>
        ) : (
          noteItems.map((note) => (
            <div key={note.id} className="border rounded-lg p-4 bg-white">
              <div className="whitespace-pre-wrap mb-2">{note.content}</div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {note.createdAt.toLocaleString()}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleRescue(note.id)}
                    className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                    title="Move to top"
                  >
                    Rescue
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                    title="Remove note"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Review Insights */}
      {isReviewMode && (
        <div className="mt-6 p-5 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-bold mb-4">Review Insights</h2>
          {isProcessing ? (
            <div className="text-center py-4">
              <p className="mb-2">Analyzing your notes...</p>
              <div className="w-8 h-8 border-t-2 border-gray-500 rounded-full animate-spin mx-auto"></div>
            </div>
          ) : (
            <ul className="space-y-2">
              {insights.map((insight, index) => (
                <li key={index} className="flex items-start">
                  <span className="inline-block mr-2 text-gray-700">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      <div className="mt-4 text-center text-xs text-gray-500">
        <p>
          Testing version - notes are stored in memory and will be lost on page refresh.
        </p>
      </div>
    </div>
  );
}