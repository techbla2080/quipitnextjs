// components/TaskAI.tsx
"use client";

import { useState, useEffect } from 'react';
import { fetchOpenAI } from '@/lib/api/openai';

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'done';
  category?: 'creative' | 'analytical' | 'physical';
}

export default function TaskAI({ task }: { task: Task }) {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<{text: string, sender: 'user' | 'ai', timestamp: number}[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Initial AI greeting when component mounts
  useEffect(() => {
    async function getInitialResponse() {
      setLoading(true);
      try {
        const response = await fetchOpenAI({
          prompt: `You are a "Growth Spirit" assistant for the task: "${task.title}". 
          This task is categorized as ${task.category || "uncategorized"}. 
          Introduce yourself as a Growth Spirit and offer 2-3 specific ways to help with this task.
          Keep your response under 100 words and be encouraging.`,
          max_tokens: 150,
        });
        
        setConversation([{
          text: response.choices[0].text,
          sender: 'ai',
          timestamp: Date.now()
        }]);
      } catch (error) {
        console.error('Error getting AI response:', error);
        setConversation([{
          text: "I'm your Growth Spirit for this task. I'm here to help you break it down and complete it efficiently.",
          sender: 'ai',
          timestamp: Date.now()
        }]);
      } finally {
        setLoading(false);
      }
    }
    
    getInitialResponse();
  }, [task]);
  
  const sendMessage = async () => {
    if (!message.trim() || loading) return;
    
    // Add user message to conversation
    const updatedConversation = [
      ...conversation,
      {
        text: message,
        sender: 'user',
        timestamp: Date.now()
      }
    ];
    
    setConversation(updatedConversation);
    const userMessage = message;
    setMessage('');
    setLoading(true);
    
    try {
      // Create conversation history for context
      const conversationHistory = updatedConversation
        .map(msg => `${msg.sender === 'user' ? 'User' : 'Growth Spirit'}: ${msg.text}`)
        .join('\n');
      
      const response = await fetchOpenAI({
        prompt: `${conversationHistory}
        
        You are a Growth Spirit productivity assistant for the specific task: "${task.title}".
        This task is categorized as ${task.category || "uncategorized"}.
        Your goal is to help the user complete this specific task by breaking it down, suggesting approaches, or providing resources.
        Always be concise, practical, and focused on THIS specific task.
        Respond directly to the user's last message with practical guidance.`,
        max_tokens: 200,
      });
      
      setConversation([
        ...updatedConversation,
        {
          text: response.choices[0].text,
          sender: 'ai',
          timestamp: Date.now()
        }
      ]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setConversation([
        ...updatedConversation,
        {
          text: "I'm sorry, I couldn't generate a response right now. Let's continue helping with your task.",
          sender: 'ai',
          timestamp: Date.now()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border-t border-white/5 p-4">
      <h4 className="text-emerald-400 font-medium mb-3 flex items-center">
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
        </svg>
        Growth Spirit
      </h4>
      
      <div className="h-48 overflow-y-auto mb-4 pr-2 scrollbar-thin scrollbar-thumb-gray-600">
        {conversation.map((msg, index) => (
          <div
            key={index}
            className={`mb-3 ${msg.sender === 'user' ? 'ml-auto max-w-[75%]' : 'mr-auto max-w-[75%]'}`}
          >
            <div className={`rounded-lg p-3 ${
              msg.sender === 'user' 
                ? 'bg-emerald-500/20 text-white' 
                : 'bg-white/10 text-emerald-100'
            }`}>
              {msg.text}
            </div>
            <p className="text-xs text-white/40 mt-1">
              {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </p>
          </div>
        ))}
        
        {loading && (
          <div className="bg-white/10 rounded-lg p-3 text-white inline-block">
            <div className="flex space-x-1">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse delay-150"></span>
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse delay-300"></span>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask your Growth Spirit..."
          className="flex-grow bg-white/5 border border-white/10 rounded-l-lg px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-r-lg transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}