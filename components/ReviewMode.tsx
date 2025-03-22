'use client';

import { useState, useEffect } from 'react';

interface Note {
  id: string;
  content: string;
  createdAt: Date;
}

// This interface only needs the notes property
interface ReviewModeProps {
  notes: Note[];
}

export default function ReviewMode({ notes }: ReviewModeProps) {
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate getting insights (replace with actual OpenAI call later)
    const analyzeNotes = () => {
      setIsLoading(true);
      
      // Simple mock insights generator
      setTimeout(() => {
        const watchCount = notes.filter(n => n.content.toLowerCase().includes('watch:')).length;
        const readCount = notes.filter(n => n.content.toLowerCase().includes('read:')).length;
        const taskCount = notes.filter(n => n.content.toLowerCase().includes('task:')).length;
        const ideaCount = notes.filter(n => n.content.toLowerCase().includes('idea:')).length;
        
        const generatedInsights = [];
        
        if (watchCount > 0) {
          generatedInsights.push(`You have ${watchCount} watch items. Consider scheduling time for media consumption.`);
        }
        
        if (readCount > 0) {
          generatedInsights.push(`You have ${readCount} reading items. Try allocating specific reading time.`);
        }
        
        if (taskCount > 0) {
          generatedInsights.push(`Priority: You have ${taskCount} tasks to complete. Focus on these first.`);
        }
        
        if (ideaCount > 0) {
          generatedInsights.push(`Creative: You have ${ideaCount} ideas noted. Set aside time to explore these concepts.`);
        }
        
        if (generatedInsights.length === 0) {
          generatedInsights.push("Add more notes with different tags to get specific insights.");
        }
        
        setInsights(generatedInsights);
        setIsLoading(false);
      }, 1000);
    };
    
    analyzeNotes();
  }, [notes]);

  return (
    <div className="mt-6 p-5 border rounded-lg bg-purple-50">
      <h2 className="text-xl font-bold mb-4">Review Insights</h2>
      
      {isLoading ? (
        <div className="text-center py-4">
          <p className="mb-2">Analyzing your notes...</p>
          <div className="w-8 h-8 border-t-2 border-purple-500 rounded-full animate-spin mx-auto"></div>
        </div>
      ) : (
        <ul className="space-y-2">
          {insights.map((insight, index) => (
            <li key={index} className="flex items-start">
              <span className="inline-block mr-2 text-purple-500">•</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      )}
      
      <p className="text-sm text-gray-500 mt-4">
        These insights are generated based on your notes
      </p>
    </div>
  );
}