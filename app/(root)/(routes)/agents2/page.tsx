'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

export default function KarpathyNotePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [noteContent, setNoteContent] = useState('');
  const [input, setInput] = useState('');
  const [selection, setSelection] = useState(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [insights, setInsights] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const textAreaRef = useRef(null);
  const contextMenuRef = useRef(null);

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
- ✅ write a blog post on note taking lol
- do actual work

Read: Abundance book?
respond to Stephen

set up https://bearblog.dev/

idea: World of ChatGPT

Human brain FLOPS assuming each synapse is ~1 FLOP:
1e11 neurons * 1e4 synapses * 1e1 fires/s = 1e16 FLOPS (i.e. 10 petaflops)

ffmpeg -r 24 -f image2 -s 512x512 -i out/frame%04d.jpg -vcodec libx264 -crf 10 -pix_fmt yuv420p test.mp4

buy razors
haircut
Zac Bookman pod: "Real companies measure revenue"

Fix youtube link on my website to llmc talk

the teacher voice`;
      setNoteContent(exampleNote);
    }
  }, [isLoaded, isSignedIn, noteContent]);

  // Handle text selection
  const handleTextSelect = () => {
    if (textAreaRef.current) {
      const start = textAreaRef.current.selectionStart;
      const end = textAreaRef.current.selectionEnd;
      
      if (start !== end) {
        // Find paragraph boundaries
        const text = textAreaRef.current.value;
        
        // Find the start of the paragraph
        let paragraphStart = start;
        while (paragraphStart > 0 && text[paragraphStart - 1] !== '\n') {
          paragraphStart--;
        }
        
        // Find the end of the paragraph
        let paragraphEnd = end;
        while (paragraphEnd < text.length && text[paragraphEnd] !== '\n') {
          paragraphEnd++;
        }
        
        setSelection({
          start: paragraphStart,
          end: paragraphEnd,
          text: text.substring(paragraphStart, paragraphEnd)
        });
        
        // Calculate position for context menu
        const textAreaRect = textAreaRef.current.getBoundingClientRect();
        const selectionRect = getSelectionCoords();
        
        if (selectionRect) {
          setContextMenuPosition({
            x: selectionRect.right - textAreaRect.left,
            y: selectionRect.bottom - textAreaRect.top
          });
          setShowContextMenu(true);
        }
      } else {
        setSelection(null);
        setShowContextMenu(false);
      }
    }
  };

  // Get coordinates of text selection
  const getSelectionCoords = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      return rect;
    }
    return null;
  };

  // Handle click outside context menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        contextMenuRef.current && 
        !contextMenuRef.current.contains(event.target) &&
        textAreaRef.current &&
        !textAreaRef.current.contains(event.target)
      ) {
        setShowContextMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Append a new note
  const handleAppend = (e) => {
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

  // Rescue selected text (move to top)
  const handleRescue = () => {
    if (!selection) return;
    
    const beforeSelection = noteContent.substring(0, selection.start);
    const afterSelection = noteContent.substring(selection.end);
    const selectedText = selection.text;
    
    // Remove the selected text and add it to the top
    const newContent = selectedText + '\n\n' + beforeSelection + afterSelection;
    setNoteContent(newContent);
    setShowContextMenu(false);
    setSelection(null);
  };

  // Delete selected text
  const handleDelete = () => {
    if (!selection) return;
    
    const beforeSelection = noteContent.substring(0, selection.start);
    const afterSelection = noteContent.substring(selection.end);
    
    // Remove the selected text
    const newContent = beforeSelection + afterSelection;
    setNoteContent(newContent);
    setShowContextMenu(false);
    setSelection(null);
  };

  // Review mode - AI analysis
  const handleReviewMode = async () => {
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
        "You have several task-related items at the top of your note.",
        "Consider scheduling time to read the Abundance book.",
        "There are multiple technical references that might be useful to organize.",
        "Personal errands (buy razors, haircut) could be grouped together."
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
      
      {/* Main Note Text Area */}
      <div className="relative">
        <textarea
          ref={textAreaRef}
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          onMouseUp={handleTextSelect}
          onKeyUp={handleTextSelect}
          className="w-full h-[70vh] p-4 border rounded-lg font-mono text-sm focus:outline-none resize-none whitespace-pre-wrap"
          style={{ lineHeight: '1.5' }}
        />
        
        {/* Contextual Menu */}
        {showContextMenu && (
          <div 
            ref={contextMenuRef}
            className="absolute bg-white border rounded-md shadow-lg z-10"
            style={{ 
              top: `${contextMenuPosition.y + 10}px`, 
              left: `${contextMenuPosition.x}px` 
            }}
          >
            <button 
              onClick={handleRescue} 
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Rescue to Top
            </button>
            <button 
              onClick={handleDelete} 
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