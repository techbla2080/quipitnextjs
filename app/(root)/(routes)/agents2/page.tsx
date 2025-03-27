// app/agent2/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { fetchOpenAI } from '@/lib/api/openai';

// Define the type for a note entry
interface NoteEntry {
  originalText: string;
  analysis: string;
  tag: string;
  timestamp: string;
}

// Define the type for a note document
interface Note {
  _id: string;
  userId: string;
  title: string;
  entries: NoteEntry[];
  createdAt: string;
  updatedAt: string;
}

// Define the type for a pending note entry
interface PendingNote {
  noteId?: string;
  title?: string;
  originalText: string;
  analysis: string;
  tag: string;
  timestamp?: string;
}

export default function KarpathyNotePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [notes, setNotes] = useState<Note[]>([]); // Array of note documents
  const [input, setInput] = useState<string>('');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null); // ID of the note being edited
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreatingNewNote, setIsCreatingNewNote] = useState<boolean>(false);
  const [newNoteTitle, setNewNoteTitle] = useState<string>('');

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingNoteRef = useRef<PendingNote | null>(null);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      redirect('/sign-in');
    }
  }, [isLoaded, isSignedIn]);

  // Fetch the user's notes on mount
  useEffect(() => {
    const fetchNotes = async () => {
      if (!isSignedIn || !user?.id) return;

      try {
        const response = await fetch('/api/notes');
        if (!response.ok) {
          throw new Error('Failed to fetch notes');
        }
        const data = await response.json();
        if (data.success && data.notes) {
          setNotes(data.notes);
          // Set the first note as active if there are any notes
          if (data.notes.length > 0) {
            setActiveNoteId(data.notes[0]._id);
          }
        } else {
          throw new Error(data.error || 'Failed to fetch notes');
        }
      } catch (error) {
        console.error('Error fetching notes:', error);
        setErrorMessage('Failed to load notes. Please check your internet connection and try again.');
      }
    };
    if (isSignedIn) {
      fetchNotes();
    }
  }, [isSignedIn, user?.id]);

  // Auto-save functionality for pending note
  useEffect(() => {
    if (!isSignedIn || !user?.id || !pendingNoteRef.current) {
      return;
    }

    // Clear existing timer if there is one
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set a new timer for auto-save
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        setSaveStatus('Saving...');
        
        if (!pendingNoteRef.current) return;
        
        const { noteId, originalText, analysis, tag, timestamp } = pendingNoteRef.current;
        
        // Create appropriate request body based on whether this is a new note or an update
        let requestBody;
        
        if (noteId) {
          // For existing note, include noteId and entry data
          requestBody = { 
            noteId, 
            entry: {
              originalText, 
              analysis, 
              tag,
              timestamp: timestamp || new Date().toISOString()
            }
          };
        } else {
          // For new note, include title and entry data
          requestBody = { 
            title: newNoteTitle || 'Untitled Note', 
            entry: {
              originalText, 
              analysis, 
              tag,
              timestamp: timestamp || new Date().toISOString()
            }
          };
        }

        const response = await fetch('/api/notes', {
          method: noteId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error('Failed to save note');
        }

        const data = await response.json();
        if (data.success) {
          setSaveStatus('All changes saved');
          // Update the notes state
          setNotes((prevNotes) => {
            const updatedNotes = [...prevNotes];
            if (noteId) {
              // Update existing note
              const noteIndex = updatedNotes.findIndex(note => note._id === noteId);
              if (noteIndex !== -1) {
                updatedNotes[noteIndex] = data.note;
              }
            } else {
              // Add new note
              updatedNotes.unshift(data.note);
              setActiveNoteId(data.note._id);
              setIsCreatingNewNote(false);
              setNewNoteTitle('');
            }
            return updatedNotes;
          });
          pendingNoteRef.current = null; // Clear the pending note
        } else {
          throw new Error(data.error || 'Failed to save note');
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
        setSaveStatus('Save failed');
        setErrorMessage('Failed to save note. Please check your internet connection and try again.');
      }
    }, 5000); // 5 seconds delay

    // Cleanup function
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [isSignedIn, user?.id, newNoteTitle]);

  // Append a new note entry
  const handleAppend = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setIsProcessing(true);
    
    try {
      // Get AI-powered tag and analysis
      const response = await fetchOpenAI({
        prompt: `For this note, provide: 1) A suggested tag (like "todo", "watch", "read"), 2) A brief analysis or insight about the note's content.
        
Note: ${input}

Return in format:
Tag: [your tag]
Analysis: [your analysis]`,
        max_tokens: 100,
      });
      
      // Extract tag and analysis from response
      const aiResponse = response.choices[0].text.trim();
      let tag = "general";
      let analysis = "";
      
      // Parse the AI response
      const tagMatch = aiResponse.match(/Tag: (.*?)(\n|$)/);
      const analysisMatch = aiResponse.match(/Analysis: (.*)/s);
      
      if (tagMatch && tagMatch[1]) tag = tagMatch[1].trim();
      if (analysisMatch && analysisMatch[1]) analysis = analysisMatch[1].trim();
      
      const timestamp = new Date().toISOString();
      
      // Create a properly typed PendingNote object
      pendingNoteRef.current = {
        noteId: activeNoteId || undefined,
        title: newNoteTitle || undefined,
        originalText: input,
        analysis,
        tag,
        timestamp
      };
      
      // Add to notes immediately for display
      const formattedNote: NoteEntry = {
        originalText: input,
        analysis,
        tag,
        timestamp,
      };
      
      setNotes((prevNotes) => {
        const updatedNotes = [...prevNotes];
        if (activeNoteId) {
          // Add to existing note
          const noteIndex = updatedNotes.findIndex(note => note._id === activeNoteId);
          if (noteIndex !== -1) {
            updatedNotes[noteIndex].entries.unshift(formattedNote);
            updatedNotes[noteIndex].updatedAt = timestamp;
          }
        } else {
          // This case is handled by the auto-save, but we can display it temporarily
          const tempNote: Note = {
            _id: 'temp',
            userId: user?.id || '',
            title: newNoteTitle || 'Untitled Note',
            entries: [formattedNote],
            createdAt: timestamp,
            updatedAt: timestamp
          };
          updatedNotes.unshift(tempNote);
        }
        return updatedNotes;
      });
      
      setInput('');
      setSaveStatus('Changes pending...');
    } catch (error) {
      console.error('Error with OpenAI API:', error);
      // Fallback to just adding the raw input
      const timestamp = new Date().toISOString();
      const formattedNote: NoteEntry = {
        originalText: input,
        analysis: '',
        tag: 'general',
        timestamp,
      };
      
      setNotes((prevNotes) => {
        const updatedNotes = [...prevNotes];
        if (activeNoteId) {
          const noteIndex = updatedNotes.findIndex(note => note._id === activeNoteId);
          if (noteIndex !== -1) {
            updatedNotes[noteIndex].entries.unshift(formattedNote);
            updatedNotes[noteIndex].updatedAt = timestamp;
          }
        } else {
          const tempNote: Note = {
            _id: 'temp',
            userId: user?.id || '',
            title: newNoteTitle || 'Untitled Note',
            entries: [formattedNote],
            createdAt: timestamp,
            updatedAt: timestamp
          };
          updatedNotes.unshift(tempNote);
        }
        return updatedNotes;
      });
      
      setInput('');
    } finally {
      setIsProcessing(false);
    }
  };

  // Rescue a note entry to the top
  const handleRescue = (entryIndex: number): void => {
    if (!activeNoteId) return;

    setNotes((prevNotes) => {
      const updatedNotes = [...prevNotes];
      const noteIndex = updatedNotes.findIndex(note => note._id === activeNoteId);
      if (noteIndex === -1 || entryIndex >= updatedNotes[noteIndex].entries.length) return prevNotes;
      
      const entryToRescue = updatedNotes[noteIndex].entries[entryIndex];
      const otherEntries = updatedNotes[noteIndex].entries.filter((_, i) => i !== entryIndex);
      
      updatedNotes[noteIndex].entries = [entryToRescue, ...otherEntries];
      updatedNotes[noteIndex].updatedAt = new Date().toISOString();
      return updatedNotes;
    });
    
    // Send PATCH request to update on server
    if (activeNoteId) {
      fetch('/api/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: activeNoteId,
          operation: 'rescue',
          entryIndex
        }),
      }).then(response => {
        if (!response.ok) {
          throw new Error('Failed to update note on server');
        }
        return response.json();
      }).then(data => {
        if (data.success) {
          setSaveStatus('Changes saved');
        }
      }).catch(error => {
        console.error('Error rescuing entry:', error);
        setErrorMessage('Failed to rescue entry. Please try again.');
      });
    }
    
    setActiveLineIndex(null);
  };

  // Delete a note entry
  const handleDelete = (entryIndex: number): void => {
    if (!activeNoteId) return;

    setNotes((prevNotes) => {
      const updatedNotes = [...prevNotes];
      const noteIndex = updatedNotes.findIndex(note => note._id === activeNoteId);
      if (noteIndex === -1 || entryIndex >= updatedNotes[noteIndex].entries.length) return prevNotes;
      
      updatedNotes[noteIndex].entries = updatedNotes[noteIndex].entries.filter((_, i) => i !== entryIndex);
      updatedNotes[noteIndex].updatedAt = new Date().toISOString();
      return updatedNotes;
    });
    
    // Send PATCH request to update on server
    if (activeNoteId) {
      fetch('/api/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: activeNoteId,
          operation: 'delete',
          entryIndex
        }),
      }).then(response => {
        if (!response.ok) {
          throw new Error('Failed to update note on server');
        }
        return response.json();
      }).then(data => {
        if (data.success) {
          setSaveStatus('Changes saved');
        }
      }).catch(error => {
        console.error('Error deleting entry:', error);
        setErrorMessage('Failed to delete entry. Please try again.');
      });
    }
    
    setActiveLineIndex(null);
  };

  // Handle click on checkbox
  const handleCheckboxClick = (index: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (activeLineIndex === index) {
      setActiveLineIndex(null);
    } else {
      setActiveLineIndex(index);
    }
  };

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setActiveLineIndex(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return 'Unknown time';
    }
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-t-2 border-purple-500 rounded-full animate-spin"></div>
        <p className="ml-2">Loading...</p>
      </div>
    );
  }

  const activeNote = notes.find(note => note._id === activeNoteId);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar for saved notes */}
      {showSidebar && (
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold dark:text-white">Saved Notes</h2>
            <button 
              onClick={() => {
                setIsCreatingNewNote(true);
                setActiveNoteId(null);
                setInput('');
                setNewNoteTitle('');
              }}
              className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
            >
              New
            </button>
          </div>
          
          <div className="space-y-2 max-h-[calc(100vh-8rem)] overflow-y-auto">
            {notes.length === 0 ? (
              <p className="text-gray-500 text-sm">No saved notes yet.</p>
            ) : (
              notes.map((note) => (
                <div 
                  key={note._id} 
                  onClick={() => {
                    setActiveNoteId(note._id);
                    setIsCreatingNewNote(false);
                    setInput('');
                  }}
                  className={`p-2 border rounded cursor-pointer ${activeNoteId === note._id ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  <div className="font-medium text-sm truncate dark:text-white">{note.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTime(note.updatedAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Main content */}
      <div className={`flex-1 flex flex-col ${showSidebar ? 'ml-0' : ''} transition-all duration-300 overflow-auto`}>
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-2xl font-semibold dark:text-white">DropThought</h1>
          </div>
          
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">{saveStatus}</span>
          </div>
        </div>
        
        <div className="p-4 max-w-4xl mx-auto w-full">
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400">Inspired by Andrej Karpathy's append-and-review method</p>
          </div>
          
          {/* Display error message if any */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {errorMessage}
            </div>
          )}
          
          {/* Append Form */}
          {isCreatingNewNote ? (
            <div className="mb-6">
              <input
                type="text"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="Enter note title..."
                className="w-full p-3 mb-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 dark:bg-gray-800 dark:text-white dark:border-gray-700"
              />
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Add the first entry for this note..."
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                rows={2}
                disabled={isProcessing}
              />
              <div className="flex justify-end mt-2">
                <button 
                  onClick={handleAppend}
                  className={`px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition ${isProcessing || !newNoteTitle.trim() || !input.trim() ? 'opacity-50 cursor-not-allowed' : ''} dark:bg-gray-700 dark:hover:bg-gray-600`}
                  disabled={isProcessing || !newNoteTitle.trim() || !input.trim()}
                >
                  {isProcessing ? 'Adding...' : 'Create Note'}
                </button>
              </div>
            </div>
          ) : activeNoteId ? (
            <form onSubmit={handleAppend} className="mb-6">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Add a new entry to this note..."
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                rows={2}
                disabled={isProcessing}
              />
              <div className="flex justify-end mt-2">
                <button 
                  type="submit" 
                  className={`px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition ${isProcessing || !input.trim() ? 'opacity-50 cursor-not-allowed' : ''} dark:bg-gray-700 dark:hover:bg-gray-600`}
                  disabled={isProcessing || !input.trim()}
                >
                  {isProcessing ? 'Adding...' : 'Add to Top'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-gray-400 text-center py-8 dark:text-gray-500">
              Select a note from the sidebar or create a new one to start adding entries.
            </div>
          )}
          
          {/* Main Note Display with Exact Three-Part Structure */}
          {activeNote && (
            <div className="relative border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700">
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-4 dark:text-white">{activeNote.title}</h3>
                {activeNote.entries.length === 0 ? (
                  <div className="text-gray-400 text-center py-8 dark:text-gray-500">
                    No entries yet. Add an entry to get started.
                  </div>
                ) : (
                  activeNote.entries.map((entry: NoteEntry, entryIndex: number) => (
                    <div key={entryIndex} className="relative mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-start">
                        {/* Checkbox */}
                        <div 
                          className="cursor-pointer mr-3 mt-1 w-6 h-6 flex-shrink-0"
                          onClick={(e) => handleCheckboxClick(entryIndex, e)}
                        >
                          {activeLineIndex === entryIndex ? (
                            <div className="w-5 h-5 border border-gray-400 rounded-sm flex items-center justify-center bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="green" className="w-4 h-4">
                                <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-5 h-5 border border-gray-300 rounded-sm dark:border-gray-600"></div>
                          )}
                        </div>
                        
                        {/* Note content in simple vertical layout */}
                        <div className="flex-grow">
                          {/* Part 1: Original Text */}
                          <div className="mb-2">
                            <div className="text-md dark:text-white">
                              {entry.originalText}
                            </div>
                          </div>
                          
                          {/* Part 2: AI Analysis */}
                          {entry.analysis && (
                            <div className="mb-2 text-blue-600 dark:text-blue-400">
                              AI Analysis: {entry.analysis}
                            </div>
                          )}
                          
                          {/* Part 3: Tag */}
                          {entry.tag && (
                            <div className="text-gray-700 dark:text-gray-400">
                              Tag: {entry.tag}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatTime(entry.timestamp)}
                          </div>
                        </div>
                        
                        {/* Actions button */}
                        <div>
                          <button 
                            className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            onClick={(e) => handleCheckboxClick(entryIndex, e)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {/* Dropdown Menu when active */}
                      {activeLineIndex === entryIndex && (
                        <div 
                          ref={dropdownRef}
                          className="absolute bg-white dark:bg-gray-800 border rounded shadow-lg z-10 right-0 top-8 dark:border-gray-700"
                        >
                          <button 
                            onClick={() => handleRescue(entryIndex)} 
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                          >
                            Rescue to Top
                          </button>
                          <button 
                            onClick={() => handleDelete(entryIndex)} 
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          
          <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
            <p>
              Your notes are automatically saved every few seconds and will appear in the sidebar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}