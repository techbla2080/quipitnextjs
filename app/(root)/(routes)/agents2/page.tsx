'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { fetchOpenAI } from '@/lib/api/openai';

export default function KarpathyNotePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [noteContent, setNoteContent] = useState<string>('');
  const [input, setInput] = useState<string>('');
  const [queryInput, setQueryInput] = useState<string>('');
  const [queryResponse, setQueryResponse] = useState<string>('');
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [insights, setInsights] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [liveSuggestions, setLiveSuggestions] = useState<{ [key: number]: string }>({});
  const [categories, setCategories] = useState<{ [key: string]: string[] }>({});
  const [isHubOpen, setIsHubOpen] = useState<boolean>(false);
  const [noteMemory, setNoteMemory] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [savedNotes, setSavedNotes] = useState<any[]>([]);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string>('');

  // Update noteMemory when noteContent changes
  useEffect(() => {
    if (noteContent) {
      setNoteMemory(noteContent);
    }
  }, [noteContent]);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      redirect('/sign-in');
    }
  }, [isLoaded, isSignedIn]);

  // Fetch saved notes when component mounts
  useEffect(() => {
    if (isSignedIn && user?.id) {
      fetchSavedNotes();
    }
  }, [isSignedIn, user?.id]);

  // Auto-save functionality
  useEffect(() => {
    if (!isSignedIn || !user?.id || !noteContent.trim() || noteContent === lastSavedContentRef.current) {
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
        await saveNotesToBackend();
        setSaveStatus('All changes saved');
        lastSavedContentRef.current = noteContent;
        
        // Refresh the list of saved notes
        fetchSavedNotes();
      } catch (error) {
        console.error('Auto-save failed:', error);
        setSaveStatus('Save failed');
      }
    }, 5000); // 5 seconds delay

    // Cleanup function
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [noteContent, isSignedIn, user?.id]);

  // Function to fetch saved notes
  const fetchSavedNotes = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/notes?userId=${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }
      
      const data = await response.json();
      if (data.success && data.notes) {
        setSavedNotes(data.notes);
      }
    } catch (error) {
      console.error('Error fetching saved notes:', error);
    }
  };

  // Function to save notes to backend
  const saveNotesToBackend = async () => {
    if (!user?.id || !noteContent.trim()) return;

    // Extract the title from the first line or use a default
    const firstLine = noteContent.split('\n')[0];
    const title = firstLine?.trim().substring(0, 50) || 'Untitled Note';
    
    const noteData = {
      userId: user.id,
      title,
      content: noteContent,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/notes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
      });

      if (!response.ok) {
        throw new Error('Failed to save note');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving note:', error);
      throw error;
    }
  };

  // Function to load a saved note
  const loadSavedNote = async (noteId: string) => {
    try {
      setSaveStatus('Loading...');
      const response = await fetch(`/api/notes/${noteId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load note');
      }
      
      const data = await response.json();
      if (data.success && data.note) {
        setNoteContent(data.note.content);
        lastSavedContentRef.current = data.note.content;
        setSaveStatus('Note loaded');
      }
    } catch (error) {
      console.error('Error loading note:', error);
      setSaveStatus('Failed to load');
    }
  };

  // Function to create a new note
  const createNewNote = () => {
    lastSavedContentRef.current = '';
    setNoteContent('');
    setSaveStatus('');
    setInput('');
  };

  // Append a new note with the updated three-part structure
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
      
      // Format the note with original input, AI analysis, and tag
      const formattedNote = `${input}\nAI Analysis: ${analysis}\nTag: ${tag}`;
      
      // Add to notes
      const updatedContent = noteContent ? formattedNote + '\n\n' + noteContent : formattedNote;
      setNoteContent(updatedContent);
      setInput('');
      
      // Trigger save status update
      setSaveStatus('Changes pending...');
    } catch (error) {
      console.error('Error with OpenAI API:', error);
      // Fallback to just adding the raw input
      const newNote = input + '\n';
      const updatedContent = noteContent ? newNote + '\n' + noteContent : newNote;
      setNoteContent(updatedContent);
      setInput('');
    } finally {
      setIsProcessing(false);
    }
  };

  // Rescue a note to the top
  const handleRescue = (index: number): void => {
    const notes = noteContent.split('\n\n');
    if (index >= notes.length) return;
    
    const noteToRescue = notes[index];
    const otherNotes = notes.filter((_, i) => i !== index);
    
    const newContent = [noteToRescue, ...otherNotes].join('\n\n');
    setNoteContent(newContent);
    setActiveLineIndex(null);
    setSaveStatus('Changes pending...');
  };

  // Delete a note
  const handleDelete = (index: number): void => {
    const notes = noteContent.split('\n\n');
    if (index >= notes.length) return;
    
    const updatedNotes = notes.filter((_, i) => i !== index);
    setNoteContent(updatedNotes.join('\n\n'));
    setActiveLineIndex(null);
    setSaveStatus('Changes pending...');
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

  // Format time for display
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

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar for saved notes */}
      {showSidebar && (
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold dark:text-white">Saved Notes</h2>
            <button 
              onClick={createNewNote}
              className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
            >
              New
            </button>
          </div>
          
          <div className="space-y-2 max-h-[calc(100vh-8rem)] overflow-y-auto">
            {savedNotes.length === 0 ? (
              <p className="text-gray-500 text-sm">No saved notes yet.</p>
            ) : (
              savedNotes.map((note) => (
                <div 
                  key={note.id} 
                  onClick={() => loadSavedNote(note.id)}
                  className="p-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <div className="font-medium text-sm truncate dark:text-white">{note.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTime(note.timestamp)}
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
          
          {/* Append Form */}
          <form onSubmit={handleAppend} className="mb-6">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Add a new note..."
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 dark:bg-gray-800 dark:text-white dark:border-gray-700"
              rows={2}
              disabled={isProcessing}
            />
            <div className="flex justify-end mt-2">
              <button 
                type="submit" 
                className={`px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''} dark:bg-gray-700 dark:hover:bg-gray-600`}
                disabled={isProcessing}
              >
                {isProcessing ? 'Adding...' : 'Add to Top'}
              </button>
            </div>
          </form>
          
          {/* Main Note Display with Exact Three-Part Structure */}
          <div className="relative border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700">
            <div className="p-4">
              {noteContent.trim() === '' ? (
                <div className="text-gray-400 text-center py-8 dark:text-gray-500">
                  Your notes will appear here. Add a note to get started.
                </div>
              ) : (
                // Split content into separate notes by double newlines
                noteContent.split('\n\n').map((noteBlock, noteIndex) => {
                  // Split each note into its components (original text, analysis, tag)
                  const noteParts = noteBlock.split('\n');
                  
                  // Extract parts (first line is the original input)
                  const originalText = noteParts[0] || '';
                  const analysisLine = noteParts.find(line => line.startsWith('AI Analysis:')) || '';
                  const tagLine = noteParts.find(line => line.startsWith('Tag:')) || '';
                  
                  return originalText.trim() ? (
                    <div key={noteIndex} className="relative mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-start">
                        {/* Checkbox */}
                        <div 
                          className="cursor-pointer mr-3 mt-1 w-6 h-6 flex-shrink-0"
                          onClick={(e) => handleCheckboxClick(noteIndex, e)}
                        >
                          {activeLineIndex === noteIndex ? (
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
                              {originalText}
                            </div>
                          </div>
                          
                          {/* Part 2: AI Analysis */}
                          {analysisLine && (
                            <div className="mb-2 text-blue-600 dark:text-blue-400">
                              {analysisLine}
                            </div>
                          )}
                          
                          {/* Part 3: Tag */}
                          {tagLine && (
                            <div className="text-gray-700 dark:text-gray-400">
                              {tagLine}
                            </div>
                          )}
                        </div>
                        
                        {/* Actions button */}
                        <div>
                          <button 
                            className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            onClick={(e) => handleCheckboxClick(noteIndex, e)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {/* Dropdown Menu when active */}
                      {activeLineIndex === noteIndex && (
                        <div 
                          ref={dropdownRef}
                          className="absolute bg-white dark:bg-gray-800 border rounded shadow-lg z-10 right-0 top-8 dark:border-gray-700"
                        >
                          <button 
                            onClick={() => handleRescue(noteIndex)} 
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                          >
                            Rescue to Top
                          </button>
                          <button 
                            onClick={() => handleDelete(noteIndex)} 
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null;
                })
              )}
            </div>
          </div>
          
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