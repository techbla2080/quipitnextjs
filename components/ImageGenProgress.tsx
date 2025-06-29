import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, Wand2, Image, Star } from 'lucide-react';

const messages = [
  "Dreaming up your design...",
  "Adding a touch of magic...",
  "Rendering in 3D space...",
  "Almost there! Polishing details..."
];

const funFacts = [
  "💡 Did you know? AI can generate thousands of design variations in seconds!",
  "✨ Pro tip: Try different styles for unique results.",
  "🎨 Fun fact: No two AI-generated images are ever exactly the same.",
  "🪄 Magic: Our AI blends art and science for your perfect design."
];

export default function ImageGenProgress() {
  const [dots, setDots] = useState('');
  const [currentMessage, setCurrentMessage] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [factIndex, setFactIndex] = useState(() => Math.floor(Math.random() * funFacts.length));

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Rotating messages
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  // Icon drama
  const icons = [<Wand2 className="h-10 w-10 text-indigo-500 animate-bounce" />, <Image className="h-10 w-10 text-indigo-500 animate-bounce" />, <Star className="h-10 w-10 text-yellow-500 animate-bounce" />];
  const CurrentIcon = icons[currentMessage % icons.length];

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative mb-4">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center animate-pulse">
          {CurrentIcon}
        </div>
        <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-400 animate-ping" />
      </div>
      <div className="text-lg font-semibold text-indigo-700 mb-1">
        {messages[currentMessage]}<span className="text-indigo-500 font-bold">{dots}</span>
      </div>
      <div className="flex justify-center space-x-2 my-2">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`w-3 h-3 rounded-full transition-all duration-500 ${
              step <= Math.floor((elapsedTime / 10) + 1)
                ? 'bg-indigo-500 scale-110'
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Time elapsed: {formatTime(elapsedTime)}</span>
      </div>
      <div className="bg-white/50 rounded-lg p-4 text-xs text-gray-600 text-center mt-2">
        {funFacts[factIndex]}
      </div>
      <div className="text-xs text-gray-400 mt-2">
        This usually takes 10-30 seconds. Please don&apos;t close this page.
      </div>
    </div>
  );
} 