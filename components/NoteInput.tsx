'use client';

import { useState } from 'react';

interface NoteInputProps {
  onAppend: (note: string) => void;
  isProcessing: boolean;
}

export default function NoteInput({ onAppend, isProcessing }: NoteInputProps) {
  const [input, setInput] = useState('');
  const [localProcessing, setLocalProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    
    setLocalProcessing(true);
    
    try {
      // Use the server-side API route for OpenAI processing
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Summarize this note and suggest a tag (e.g., "watch:", "read:", "task:", "idea:"): ${input}`,
          maxTokens: 50,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process note');
      }
      
      const data = await response.json();
      const summarizedNote = data.choices[0].text.trim();
      onAppend(summarizedNote);
      setInput('');
    } catch (error) {
      console.error('Error with OpenAI processing:', error);
      // Fallback to raw input if OpenAI fails
      onAppend(`note: ${input}`);
      setInput('');
    } finally {
      setLocalProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="What's on your mind? Type a note..."
        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        rows={3}
        disabled={isProcessing || localProcessing}
      />
      <div className="flex justify-between items-center mt-2">
        <p className="text-sm text-gray-500">
          OpenAI will process and tag your note
        </p>
        <button 
          type="submit" 
          className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition ${(isProcessing || localProcessing) ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isProcessing || localProcessing}
        >
          {localProcessing ? 'Processing with OpenAI...' : 'Add Note'}
        </button>
      </div>
    </form>
  );
}