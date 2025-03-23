// app/agent2/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

export default function KarpathyNotePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [noteContent, setNoteContent] = useState<string>('');
  const [input, setInput] = useState<string>('');
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [insights, setInsights] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      redirect('/sign-in');
    }
  }, [isLoaded, isSignedIn]);

  // Parse the noteContent into lines
  const noteLines = noteContent.split('\n');

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

  // Append a new note
  const handleAppend = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setIsProcessing(true);
    
    // Process with OpenAI (simulated)
    setTimeout(() => {
      const newNote = input + '\n'; // One newline after the input
      const updatedContent = noteContent ? newNote + '\n' + noteContent : newNote; // Add an extra newline if noteContent exists
      setNoteContent(updatedContent);
      setInput('');
      setIsProcessing(false);
    }, 300);
  };

  // Rescue a line to the top
  const handleRescue = (index: number): void => {
    console.log("Rescuing line at index:", index);
    const lines = noteContent.split('\n');
    console.log("Lines:", lines);
    
    let startIndex = index;
    let endIndex = index;
    
    // Find paragraph boundaries
    while (startIndex > 0 && lines[startIndex - 1].trim() !== '') {
      startIndex--;
    }
    
    while (endIndex < lines.length - 1 && lines[endIndex + 1].trim() !== '') {
      endIndex++;
    }
    
    console.log("Paragraph boundaries:", startIndex, endIndex);
    
    // Extract the paragraph
    const paragraph = lines.slice(startIndex, endIndex + 1).join('\n');
    console.log("Paragraph to rescue:", paragraph);
    
    // Create a new array without the paragraph
    const newLines = [
      ...lines.slice(0, startIndex),
      ...lines.slice(endIndex + 1)
    ];
    console.log("Remaining lines:", newLines);
    
    // Move it to the top
    const newContent = paragraph + '\n' + newLines.join('\n');
    console.log("New content:", newContent);
    
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
      
      {/* Main Note with Checkbox Selection - Skip Empty Lines */}
      <div className="relative border rounded-lg bg-white">
        <div className="p-4">
          {noteLines.length === 0 ? (
            <div className="text-gray-400 text-center py-8">
              Your notes will appear here. Add a note to get started.
            </div>
          ) : (
            noteLines.map((line, index) => 
              line.trim() ? (
                <div key={`${index}-${line}`} className="relative flex items-start group mb-2">
                  <div 
                    className="cursor-pointer mr-2 w-6 h-6 flex items-center justify-center"
                    onClick={(e) => handleCheckboxClick(index, e)}
                  >
                    {activeLineIndex === index ? (
                      <div className="w-4 h-4 border border-gray-500 rounded-sm flex items-center justify-center bg-gray-100">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="green" className="w-3 h-3">
                          <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-4 h-4 border border-gray-300 rounded-sm group-hover:border-gray-500"></div>
                    )}
                  </div>
                  <div className="flex-grow whitespace-pre-wrap py-1">{line}</div>
                  
                  {/* Dropdown Menu - Positioned at the right side */}
                  {activeLineIndex === index && (
                    <div 
                      ref={dropdownRef}
                      className="absolute bg-white border rounded shadow-lg z-10 right-4"
                      style={{ top: '-10px' }}
                    >
                      <button 
                        onClick={() => handleRescue(index)} 
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Rescue to Top
                      </button>
                      <button 
                        onClick={() => handleDelete(index)} 
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div key={`${index}-empty`} className="h-2"></div>
              )
            )
          )}
        </div>
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
              {insights.length === 0 ? (
                <li>Add some notes to get insights.</li>
              ) : (
                insights.map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <span className="inline-block mr-2 text-gray-700">•</span>
                    <span>{insight}</span>
                  </li>
                ))
              )}
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