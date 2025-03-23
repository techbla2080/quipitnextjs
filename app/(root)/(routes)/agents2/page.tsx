'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

interface Note {
  content: string;
  position: number;
}

export default function KarpathyNotePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [noteContent, setNoteContent] = useState<string>('');
  const [input, setInput] = useState<string>('');
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [insights, setInsights] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      redirect('/sign-in');
    }
  }, [isLoaded, isSignedIn]);

  // Load example notes for testing
  useEffect(() => {
    if (isLoaded && isSignedIn && noteContent === '') {
      const exampleNote = 
`TODO for today:
- ✅ morning exercise
- write a blog post
- do actual work

Read: Abundance book?

idea: World of ChatGPT`;
      setNoteContent(exampleNote);
    }
  }, [isLoaded, isSignedIn, noteContent]);

  // Parse the noteContent into lines
  const noteLines = noteContent.split('\n');

  // Handle click on selection box
  const handleSelectionClick = (index: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const lineHeight = 24; // approximate line height in pixels
    const linePosition = index * lineHeight + 60; // 60px offset for padding and header
    
    setActiveLineIndex(index);
    setDropdownPosition({
      top: linePosition,
      left: event.clientX,
    });
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

  // Append a new note
  const handleAppend = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setIsProcessing(true);
    
    // Process with OpenAI (in a real implementation)
    // For this example, we'll just append without AI processing
    setTimeout(() => {
      const newNote = input + '\n\n';
      setNoteContent(newNote + noteContent);
      setInput('');
      setIsProcessing(false);
    }, 300);
  };

  // Rescue a line to the top
  const handleRescue = (index: number): void => {
    const lines = noteContent.split('\n');
    let startIndex = index;
    let endIndex = index;
    
    // Find the paragraph boundaries
    while (startIndex > 0 && lines[startIndex - 1].trim() !== '') {
      startIndex--;
    }
    
    while (endIndex < lines.length - 1 && lines[endIndex + 1].trim() !== '') {
      endIndex++;
    }
    
    // Extract the paragraph
    const paragraph = lines.slice(startIndex, endIndex + 1).join('\n');
    
    // Remove the paragraph from its current position
    const beforeParagraph = lines.slice(0, startIndex);
    const afterParagraph = lines.slice(endIndex + 1);
    
    // Move it to the top
    const newContent = paragraph + '\n\n' + beforeParagraph.concat(afterParagraph).join('\n');
    setNoteContent(newContent);
    setActiveLineIndex(null);
  };

  // Delete a line
  const handleDelete = (index: number): void => {
    const lines = noteContent.split('\n');
    let startIndex = index;
    let endIndex = index;
    
    // Find the paragraph boundaries
    while (startIndex > 0 && lines[startIndex - 1].trim() !== '') {
      startIndex--;
    }
    
    while (endIndex < lines.length - 1 && lines[endIndex + 1].trim() !== '') {
      endIndex++;
    }
    
    // Remove the paragraph
    const newLines = [
      ...lines.slice(0, startIndex),
      ...lines.slice(endIndex + 1)
    ];
    
    setNoteContent(newLines.join('\n'));
    setActiveLineIndex(null);
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
      
      {/* Review Mode Toggle */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleReviewMode}
          className={`px-4 py-2 ${isReviewMode ? 'bg-gray-600' : 'bg-gray-800'} text-white rounded-lg hover:bg-gray-700 transition`}
          disabled={isProcessing}
        >
          {isReviewMode ? 'Exit Review' : 'Review Notes'}
        </button>
      </div>
      
      {/* Main Note with Line Selection */}
      <div className="relative border rounded-lg bg-white">
        <div className="p-4">
          {noteLines.map((line, index) => (
            <div key={index} className="relative flex items-start group">
              <div className="flex-grow whitespace-pre-wrap py-1">{line}</div>
              <button 
                className="opacity-0 group-hover:opacity-100 ml-2 p-1 text-gray-400 hover:text-gray-700"
                onClick={(e) => handleSelectionClick(index, e)}
              >
                ⋮
              </button>
            </div>
          ))}
        </div>
        
        {/* Dropdown Menu */}
        {activeLineIndex !== null && (
          <div 
            ref={dropdownRef}
            className="absolute bg-white border rounded shadow-lg z-10"
            style={{ 
              top: `${dropdownPosition.top}px`, 
              left: `${dropdownPosition.left - 100}px`
            }}
          >
            <button 
              onClick={() => handleRescue(activeLineIndex)} 
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Rescue to Top
            </button>
            <button 
              onClick={() => handleDelete(activeLineIndex)} 
              className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
            >
              Delete
            </button>
          </div>
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