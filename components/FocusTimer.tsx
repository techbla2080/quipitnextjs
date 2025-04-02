// components/FocusTimer.tsx
"use client";

import { useState, useEffect } from 'react';

interface FocusTimerProps {
  taskId: string;
  onComplete: () => void;
}

export default function FocusTimer({ taskId, onComplete }: FocusTimerProps) {
  // For testing, you might want to set a shorter time like 10 seconds (10)
  // For production use 25 minutes (25 * 60)
  const [time, setTime] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (running && time > 0) {
      timer = setInterval(() => setTime(t => t - 1), 1000);
    } else if (running && time === 0) {
      // Timer completed
      setRunning(false);
      onComplete();
      setSessions(s => s + 1);
      setTime(25 * 60); // Reset timer
      
      // Play notification sound if browser supports it
      try {
        const audio = new Audio('/notification.mp3');
        audio.play();
      } catch (e) {
        console.log('Audio notification not supported');
      }
    }
    
    return () => clearInterval(timer);
  }, [running, time, onComplete]);

  // Format time as MM:SS
  const formatTime = () => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Calculate progress percentage
  const progress = ((25 * 60 - time) / (25 * 60)) * 100;

  return (
    <div className="mt-3 flex items-center">
      <div className="relative h-14 w-14 mr-3">
        {/* Background circle */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle 
            cx="18" 
            cy="18" 
            r="16" 
            fill="none" 
            stroke="#4B5563" 
            strokeWidth="2"
          />
          
          {/* Progress circle */}
          <circle 
            cx="18" 
            cy="18" 
            r="16" 
            fill="none" 
            stroke="#10B981" 
            strokeWidth="2" 
            strokeDasharray="100.53" 
            strokeDashoffset={100.53 - ((100.53 * progress) / 100)}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Time text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-mono">{formatTime()}</span>
        </div>
      </div>
      
      <div className="flex flex-col">
        <button 
          onClick={() => setRunning(!running)} 
          className={`px-3 py-1 rounded-md text-sm transition-colors ${
            running 
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
              : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
          }`}
        >
          {running ? 'Pause' : 'Start Focus'}
        </button>
        
        {sessions > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            Sessions: {sessions}
          </p>
        )}
      </div>
    </div>
  );
}