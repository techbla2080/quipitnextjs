import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Plane, Clock, Sparkles, MapPin, Globe, Heart } from 'lucide-react';

interface EnhancedLoadingUIProps {
  isLoading: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

const EnhancedLoadingUI: React.FC<EnhancedLoadingUIProps> = ({ 
  isLoading, 
  error, 
  onRetry 
}) => {
  const [dots, setDots] = useState('');
  const [currentMessage, setCurrentMessage] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const messages = [
    "AI is analyzing your travel preferences...",
    "Researching destinations and activities...",
    "Planning your perfect itinerary...",
    "Almost ready! Finalizing details..."
  ];

  const icons = [Plane, MapPin, Globe, Heart];

  // Animated dots
  useEffect(() => {
    if (!isLoading) return;
    
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Rotating messages
  useEffect(() => {
    if (!isLoading) return;
    
    const interval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % messages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isLoading, messages.length]);

  // Timer
  useEffect(() => {
    if (!isLoading) return;
    
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const CurrentIcon = icons[currentMessage];

  // Error state
  if (error) {
    return (
      <Card className="w-full bg-gradient-to-r from-red-50 to-pink-50 border-red-200 dark:from-red-900/20 dark:to-pink-900/20 dark:border-red-700">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Plane className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
                Oops! Something went wrong
              </h3>
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                {error.message}
              </p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLoading) {
    return null;
  }

  return (
    <Card className="w-full bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 dark:from-blue-900/20 dark:to-cyan-900/20 dark:border-blue-700">
      <CardContent className="p-6">
        <div className="text-center space-y-6">
          {/* Animated Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center animate-pulse">
                <CurrentIcon className="h-10 w-10 text-blue-500 animate-bounce" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="h-6 w-6 text-yellow-500 animate-ping" />
              </div>
            </div>
          </div>

          {/* Main Message */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              Creating Your Perfect Trip
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              {messages[currentMessage]}
              <span className="text-blue-500 font-bold">{dots}</span>
            </p>
          </div>

          {/* Progress Indicators */}
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`w-3 h-3 rounded-full transition-all duration-500 ${
                  step <= Math.floor((elapsedTime / 10) + 1)
                    ? 'bg-blue-500 scale-110'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Timer */}
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
            <Clock className="h-4 w-4" />
            <span>Time elapsed: {formatTime(elapsedTime)}</span>
          </div>

          {/* Fun Facts */}
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-600 dark:text-gray-300">
              💡 <strong>Did you know?</strong> Our AI analyzes thousands of travel experiences to create your perfect itinerary!
            </p>
          </div>

          {/* Estimated Time */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>This usually takes 2-3 minutes. Please don't close this page.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedLoadingUI; 