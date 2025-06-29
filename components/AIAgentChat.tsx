// components/AIAgentChat.tsx
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '@/types';
import { fetchOpenAI } from '@/lib/api/openai';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAgentChatProps {
  task: Task;
  onTaskUpdate: (updates: Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>>) => void;
}

export default function AIAgentChat({ task, onTaskUpdate }: AIAgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentSuggestion, setAgentSuggestion] = useState<Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // When the component mounts, add an initial AI greeting
  useEffect(() => {
    const initialMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Hi! I'm your AI assistant. I can help you with your task "${task.title}". Would you like me to suggest improvements or changes to this task?`,
      timestamp: new Date()
    };
    setMessages([initialMessage]);
  }, [task.title]);

  // Auto-scroll to the bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const analyzeTaskAutomatically = async () => {
    setIsLoading(true);
    try {
      const response = await fetchOpenAI({
        prompt: `Analyze this task and suggest one improvement (be brief):
        Title: ${task.title}
        Description: ${task.description || 'No description provided'}
        Priority: ${task.priority}
        Category: ${task.category}
        Status: ${task.status}
        Tags: ${task.tags?.join(', ') || 'No tags'}`,
        max_tokens: 150,
      });

      const content = response.choices[0].text.trim();
      
      // Generate a random suggestion to demonstrate functionality
      const suggestions = [
        { priority: 'high' as const },
        { status: 'in-progress' as const },
        { 
          description: task.description 
            ? `${task.description} (AI suggested update: break this into smaller steps)` 
            : 'AI suggested adding a description to improve clarity.'
        },
        {
          tags: [...(task.tags || []), 'AI-reviewed']
        }
      ];
      
      const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
      setAgentSuggestion(randomSuggestion);

      // Add AI analysis message
      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I've analyzed your task and have a suggestion: ${content}`,
        timestamp: new Date()
      };
      setMessages(prevMessages => [...prevMessages, newMessage]);
    } catch (error) {
      console.error('Error getting AI analysis:', error);
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I had trouble analyzing your task. How else can I help you with it?',
        timestamp: new Date()
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-analyze task and provide suggestions after a few seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      analyzeTaskAutomatically();
    }, 3000);
    return () => clearTimeout(timer);
  }, [analyzeTaskAutomatically]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Get AI response
      const response = await fetchOpenAI({
        prompt: `Conversation about task "${task.title}". User says: ${inputValue}. 
        Respond as a helpful AI assistant. Be brief but friendly. If appropriate, suggest task changes.`,
        max_tokens: 150,
      });

      const aiResponse = response.choices[0].text.trim();
      const aiMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };
      setMessages(prevMessages => [...prevMessages, aiMessage]);

      // Randomly decide if AI will make a task suggestion (for demo purposes)
      if (Math.random() > 0.7) {
        // Example suggestions - in a real app, these would be more sophisticated
        const suggestions = [
          { priority: task.priority === 'high' ? 'medium' as const : 'high' as const },
          { status: task.status === 'pending' ? 'in-progress' as const : 'pending' as const },
          { tags: [...(task.tags || []), 'discussed'] }
        ];
        
        const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
        setAgentSuggestion(randomSuggestion);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I had trouble responding. Could you try again?',
        timestamp: new Date()
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const applySuggestion = () => {
    if (agentSuggestion) {
      onTaskUpdate(agentSuggestion);
      
      // Add a confirmation message
      const confirmMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I\'ve updated your task with my suggestion!',
        timestamp: new Date()
      };
      setMessages(prevMessages => [...prevMessages, confirmMessage]);
      
      // Clear the suggestion
      setAgentSuggestion(null);
    }
  };

  const dismissSuggestion = () => {
    setAgentSuggestion(null);
    
    // Add a message acknowledging the dismissal
    const dismissMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'No problem! Let me know if you need any other help with this task.',
        timestamp: new Date()
    };
    setMessages(prevMessages => [...prevMessages, dismissMessage]);
  };

  // Format timestamp for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700/50 overflow-hidden h-full flex flex-col">
      <div className="bg-gray-900/60 px-4 py-3 border-b border-gray-700/50">
        <h3 className="text-lg font-medium text-white flex items-center">
          <div className="w-2 h-2 bg-neon-cyan rounded-full mr-2 animate-pulse"></div>
          Task Assistant
        </h3>
      </div>
      
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-neon-purple/20 text-white'
                    : 'bg-neon-cyan/10 text-white'
                }`}
              >
                <div className="text-sm mb-1">{message.content}</div>
                <div className="text-xs text-gray-400 text-right">{formatTime(message.timestamp)}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800/80 rounded-lg px-4 py-2 text-gray-300">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        {/* AI Suggestion Card */}
        <AnimatePresence>
          {agentSuggestion && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-neon-purple/20 border border-neon-purple/50 rounded-lg p-4 mt-4"
            >
              <h4 className="text-neon-purple text-sm font-medium mb-2">Suggested Changes</h4>
              <div className="text-white text-sm mb-3">
                {agentSuggestion.priority && (
                  <p>Change priority to: <span className="font-medium">{agentSuggestion.priority}</span></p>
                )}
                {agentSuggestion.status && (
                  <p>Change status to: <span className="font-medium">{agentSuggestion.status}</span></p>
                )}
                {agentSuggestion.description && (
                  <p>Update description</p>
                )}
                {agentSuggestion.tags && (
                  <p>Add tags: <span className="font-medium">{agentSuggestion.tags.filter(tag => !task.tags?.includes(tag)).join(', ')}</span></p>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={applySuggestion}
                  className="px-3 py-1 bg-neon-purple/30 hover:bg-neon-purple/50 text-white text-sm rounded-md transition-colors"
                >
                  Apply Changes
                </button>
                <button
                  onClick={dismissSuggestion}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-md transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700/50 bg-gray-800/30">
        <div className="flex">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Ask me about this task..."
            className="flex-1 bg-gray-800/50 border border-gray-700 rounded-l-lg px-4 py-2 text-white focus:outline-none focus:border-neon-cyan"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className={`px-4 py-2 rounded-r-lg ${
              isLoading || !inputValue.trim()
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-neon-cyan text-gray-900'
            }`}
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}