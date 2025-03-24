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
  
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Parse the noteContent into lines
  const noteLines = noteContent.split('\n');

  // Live analysis of notes
  useEffect(() => {
    const analyzeNotes = async () => {
      if (!noteContent.trim()) return;
      
      try {
        // Categorize notes
        const categoryResponse = await fetchOpenAI({
          prompt: `Categorize these notes into groups (e.g., "Work", "Personal", "Research"):\n${noteContent}`,
          max_tokens: 100,
        });
        const categoryText = categoryResponse.choices[0].text.trim();
        const categoryLines = categoryText.split('\n').filter((line: string) => line.trim());
        const newCategories: { [key: string]: string[] } = {};
        categoryLines.forEach((line: string) => {
          const [category, note] = line.split(': ').map((part: string) => part.trim());
          if (category && note) {
            if (!newCategories[category]) newCategories[category] = [];
            newCategories[category].push(note);
          }
        });
        setCategories(newCategories);

        // Generate live suggestions
        const suggestionResponse = await fetchOpenAI({
          prompt: `For each note, provide a live suggestion (e.g., "Add to to-do list", "Set a calendar event"):\n${noteContent}`,
          max_tokens: 150,
        });
        const suggestionText = suggestionResponse.choices[0].text.trim();
        const suggestionLines = suggestionText.split('\n').filter((line: string) => line.trim());
        const newSuggestions: { [key: number]: string } = {};
        suggestionLines.forEach((line: string, idx: number) => {
          if (noteLines[idx] && noteLines[idx].trim()) {
            newSuggestions[idx] = line;
          }
        });
        setLiveSuggestions(newSuggestions);
      } catch (error) {
        console.error('Error with live analysis:', error);
      }
    };
    analyzeNotes();
  }, [noteContent]);

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
  const handleAppend = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setIsProcessing(true);
    
    try {
      const response = await fetchOpenAI({
        prompt: `Summarize this note and suggest a tag (e.g., "todo:", "watch:", "read:"):\n${input}`,
        max_tokens: 50,
      });
      const summarizedNote = response.choices[0].text.trim();
      const newNote = summarizedNote + '\n';
      const updatedContent = noteContent ? newNote + '\n' + noteContent : newNote;
      setNoteContent(updatedContent);
      setInput('');
    } catch (error) {
      console.error('Error with OpenAI API:', error);
      const newNote = input + '\n';
      const updatedContent = noteContent ? newNote + '\n' + noteContent : newNote;
      setNoteContent(updatedContent);
      setInput('');
    } finally {
      setIsProcessing(false);
    }
  };

  // Rescue a line to the top
  const handleRescue = (index: number): void => {
    const lines = noteContent.split('\n');
    let startIndex = index;
    let endIndex = index;
    
    while (startIndex > 0 && lines[startIndex - 1].trim() !== '') {
      startIndex--;
    }
    
    while (endIndex < lines.length - 1 && lines[endIndex + 1].trim() !== '') {
      endIndex++;
    }
    
    const paragraph = lines.slice(startIndex, endIndex + 1).join('\n');
    const newLines = [
      ...lines.slice(0, startIndex),
      ...lines.slice(endIndex + 1)
    ];
    
    const newContent = paragraph + '\n' + newLines.join('\n');
    setNoteContent(newContent);
    setActiveLineIndex(null);
  };

  // Delete a line
  const handleDelete = (index: number): void => {
    const lines = noteContent.split('\n');
    let startIndex = index;
    let endIndex = index;
    
    while (startIndex > 0 && lines[startIndex - 1].trim() !== '') {
      startIndex--;
    }
    
    while (endIndex < lines.length - 1 && lines[endIndex + 1].trim() !== '') {
      endIndex++;
    }
    
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
    
    try {
      const noteContents = noteContent.trim();
      if (!noteContents) {
        setInsights(['Add some notes to get insights.']);
        setIsProcessing(false);
        return;
      }
      
      const response = await fetchOpenAI({
        prompt: `Analyze these notes and provide actionable insights. Identify tasks, reminders, events, recurring themes, and suggest actions (e.g., set a calendar event, prioritize tasks, group related notes):\n${noteContents}`,
        max_tokens: 150,
      });
      const generatedInsights = response.choices[0].text.trim().split('\n').filter((insight: string) => insight.trim());
      setInsights(generatedInsights.length > 0 ? generatedInsights : ['No significant insights found.']);
    } catch (error) {
      console.error('Error with OpenAI API:', error);
      setInsights(['Unable to generate insights due to an error.']);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle natural language query
  const handleQuery = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!queryInput.trim()) return;
    
    setIsProcessing(true);
    setQueryResponse('');
    
    try {
      const response = await fetchOpenAI({
        prompt: `Based on these notes, please answer the following question:
Notes:
${noteMemory}
Question: ${queryInput}`,
        max_tokens: 150,
      });
      
      setQueryResponse(response.choices[0].text.trim());
    } catch (error) {
      console.error('Error with query:', error);
      setQueryResponse('Unable to process query due to an error.');
    } finally {
      setIsProcessing(false);
      setQueryInput('');
    }
  };

  // Handle live suggestion actions
  const handleSuggestionAction = async (index: number, suggestion: string) => {
    setIsProcessing(true);
    try {
      if (suggestion.toLowerCase().includes('set a calendar event')) {
        const note = noteLines[index];
        const response = await fetchOpenAI({
          prompt: `Extract the event details (e.g., time, description) from this note to set a calendar event:\n${note}`,
          max_tokens: 50,
        });
        const eventDetails = response.choices[0].text.trim();
        console.log(`Simulating calendar event creation: ${eventDetails}`);
        setLiveSuggestions(prev => ({ ...prev, [index]: 'Event scheduled.' }));
      } else if (suggestion.toLowerCase().includes('add to to-do list')) {
        const note = noteLines[index];
        console.log(`Simulating adding to to-do list: ${note}`);
        setLiveSuggestions(prev => ({ ...prev, [index]: 'Added to to-do list.' }));
      }
    } catch (error) {
      console.error('Error handling suggestion:', error);
      setLiveSuggestions(prev => ({ ...prev, [index]: 'Error processing suggestion.' }));
    } finally {
      setIsProcessing(false);
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
      
      {/* Action Hub Floating Button with Floating Effect */}
      <button
        onClick={() => setIsHubOpen(!isHubOpen)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition animate-float"
      >
        {isHubOpen ? 'Close Hub' : 'Action Hub'}
      </button>
      
      {/* Action Hub Panel */}
      {isHubOpen && (
        <div className="fixed bottom-16 right-4 w-80 bg-white border rounded-lg shadow-lg p-4">
          <h2 className="text-lg font-bold mb-4">Action Hub</h2>
          
          {/* Current Context */}
          <div className="mb-4">
            <h3 className="text-md font-semibold">Current Context</h3>
            {activeLineIndex !== null ? (
              <p className="text-gray-700">{noteLines[activeLineIndex]}</p>
            ) : (
              <p className="text-gray-700">All Notes</p>
            )}
          </div>
          
          {/* Live Suggestions */}
          <div className="mb-4">
            <h3 className="text-md font-semibold">Suggestions</h3>
            {activeLineIndex !== null && liveSuggestions[activeLineIndex] ? (
              <div className="flex items-center">
                <p className="text-gray-700">{liveSuggestions[activeLineIndex]}</p>
                {(liveSuggestions[activeLineIndex].toLowerCase().includes('set a calendar event') || liveSuggestions[activeLineIndex].toLowerCase().includes('add to to-do list')) && (
                  <button
                    onClick={() => handleSuggestionAction(activeLineIndex, liveSuggestions[activeLineIndex])}
                    className="ml-2 px-2 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                  >
                    Confirm
                  </button>
                )}
              </div>
            ) : (
              Object.entries(liveSuggestions).map(([idx, suggestion]) => (
                <div key={idx} className="flex items-center mb-2">
                  <p className="text-gray-700">{suggestion}</p>
                  {(suggestion.toLowerCase().includes('set a calendar event') || suggestion.toLowerCase().includes('add to to-do list')) && (
                    <button
                      onClick={() => handleSuggestionAction(Number(idx), suggestion)}
                      className="ml-2 px-2 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                      Confirm
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          
          {/* Categories */}
          {Object.keys(categories).length > 0 && (
            <div className="mb-4">
              <h3 className="text-md font-semibold">Categories</h3>
              {Object.entries(categories).map(([category, notes]) => (
                <div key={category} className="mb-2">
                  <h4 className="text-sm font-medium">{category}</h4>
                  <ul className="space-y-1">
                    {notes.map((note, idx) => (
                      <li key={idx} className="text-gray-700 text-sm">• {note}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          
          {/* Query Notes */}
          <form onSubmit={handleQuery} className="mb-4">
            <textarea
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Ask about your notes (e.g., 'What are my tasks?')"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
              rows={2}
              disabled={isProcessing}
            />
            <button 
              type="submit" 
              className={`w-full mt-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Query Notes'}
            </button>
          </form>
          
          {/* Query Response */}
          {queryResponse && (
            <div className="p-2 border rounded-lg bg-gray-50">
              <h3 className="text-md font-semibold">Query Response</h3>
              <p>{queryResponse}</p>
            </div>
          )}
        </div>
      )}
      
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