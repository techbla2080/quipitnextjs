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

  /* Commenting out Live analysis of notes
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
          if (idx < noteContent.split('\n\n').length) {
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
  */

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
  };

  // Delete a note
  const handleDelete = (index: number): void => {
    const notes = noteContent.split('\n\n');
    if (index >= notes.length) return;
    
    const updatedNotes = notes.filter((_, i) => i !== index);
    setNoteContent(updatedNotes.join('\n\n'));
    setActiveLineIndex(null);
  };

  /* Commenting out Review mode
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
  */

  /* Commenting out Natural language query
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
  */

  /* Commenting out Live suggestion actions
  const handleSuggestionAction = async (index: number, suggestion: string) => {
    setIsProcessing(true);
    try {
      if (suggestion.toLowerCase().includes('set a calendar event')) {
        const notes = noteContent.split('\n\n');
        const note = notes[index];
        const response = await fetchOpenAI({
          prompt: `Extract the event details (e.g., time, description) from this note to set a calendar event:\n${note}`,
          max_tokens: 50,
        });
        const eventDetails = response.choices[0].text.trim();
        console.log(`Simulating calendar event creation: ${eventDetails}`);
        setLiveSuggestions(prev => ({ ...prev, [index]: 'Event scheduled.' }));
      } else if (suggestion.toLowerCase().includes('add to to-do list')) {
        const notes = noteContent.split('\n\n');
        const note = notes[index];
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
  */

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
      
      {/* Action Hub Floating Button - Commented out
      <button
        onClick={() => setIsHubOpen(!isHubOpen)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition animate-float"
      >
        {isHubOpen ? 'Close Hub' : 'Action Hub'}
      </button>
      */}
      
      {/* Action Hub Panel - Commented out
      {isHubOpen && (
        <div className="fixed bottom-16 right-4 w-80 bg-white border rounded-lg shadow-lg p-4">
          <h2 className="text-lg font-bold mb-4">Action Hub</h2>
          
          <div className="mb-4">
            <h3 className="text-md font-semibold">Current Context</h3>
            {activeLineIndex !== null ? (
              <p className="text-gray-700">{noteContent.split('\n\n')[activeLineIndex]?.split('\n')[0] || 'No note selected'}</p>
            ) : (
              <p className="text-gray-700">All Notes</p>
            )}
          </div>
          
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
          
          {queryResponse && (
            <div className="p-2 border rounded-lg bg-gray-50">
              <h3 className="text-md font-semibold">Query Response</h3>
              <p>{queryResponse}</p>
            </div>
          )}
        </div>
      )}
      */}
      
      {/* Review Mode Toggle - Commented out
      <div className="flex justify-end mb-4">
        <button
          onClick={handleReviewMode}
          className={`px-4 py-2 ${isReviewMode ? 'bg-gray-600' : 'bg-gray-800'} text-white rounded-lg hover:bg-gray-700 transition`}
          disabled={isProcessing}
        >
          {isReviewMode ? 'Exit Review' : 'Review Notes'}
        </button>
      </div>
      */}
      
      {/* Main Note Display with Exact Three-Part Structure */}
      <div className="relative border rounded-lg bg-white">
        <div className="p-4">
          {noteContent.trim() === '' ? (
            <div className="text-gray-400 text-center py-8">
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
                <div key={noteIndex} className="relative mb-4 pb-3 border-b border-gray-100">
                  <div className="flex items-start">
                    {/* Checkbox */}
                    <div 
                      className="cursor-pointer mr-3 mt-1 w-6 h-6 flex-shrink-0"
                      onClick={(e) => handleCheckboxClick(noteIndex, e)}
                    >
                      {activeLineIndex === noteIndex ? (
                        <div className="w-5 h-5 border border-gray-400 rounded-sm flex items-center justify-center bg-gray-50">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="green" className="w-4 h-4">
                            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-5 h-5 border border-gray-300 rounded-sm"></div>
                      )}
                    </div>
                    
                    {/* Note Content - Exactly as specified */}
                    <div className="flex-grow">
                      {/* Part 1: Original Text */}
                      <div className="mb-2">
                        {originalText}
                      </div>
                      
                      {/* Part 2: AI Analysis */}
                      {analysisLine && (
                        <div className="mb-2 text-blue-600">
                          {analysisLine}
                        </div>
                      )}
                      
                      {/* Part 3: Tag */}
                      {tagLine && (
                        <div className="text-gray-700">
                          {tagLine}
                        </div>
                      )}
                    </div>
                    
                    {/* Actions button */}
                    <div>
                      <button 
                        className="p-1 text-gray-400 hover:text-gray-700"
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
                      className="absolute bg-white border rounded shadow-lg z-10 right-0 top-8"
                    >
                      <button 
                        onClick={() => handleRescue(noteIndex)} 
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Rescue to Top
                      </button>
                      <button 
                        onClick={() => handleDelete(noteIndex)} 
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
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
      
      {/* Review Insights - Commented out
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
      */}
      
      <div className="mt-4 text-center text-xs text-gray-500">
        <p>
          Testing version - notes are stored in memory and will be lost on page refresh.
        </p>
      </div>
    </div>
  );
}