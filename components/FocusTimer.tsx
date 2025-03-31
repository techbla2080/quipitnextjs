"use client";

import { useState, useEffect } from 'react';

interface FocusTimerProps {
  taskId: string;
  onComplete: () => void;
}

export default function FocusTimer({ taskId, onComplete }: FocusTimerProps) {
  // Default to 25 minutes (25 * 60 seconds)
  // For testing purposes, you might want to use a shorter time like 10 seconds
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
    }
    
    return () => clearInterval(timer);
  }, [running, time, onComplete]);

  // Format time as MM:SS
  const formatTime = () => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="mt-3 flex items-center">
      <div className="mr-4 bg-gray-100 dark:bg-gray-900 rounded-lg px-3 py-2">
        <p className="text-xl font-mono">{formatTime()}</p>
        {sessions > 0 && (
          <p className="text-xs text-gray-500">Sessions: {sessions}</p>
        )}
      </div>
      <button 
        onClick={() => setRunning(!running)} 
        className={`px-4 py-2 rounded-lg transition-colors ${
          running 
            ? 'bg-red-600 text-white hover:bg-red-700' 
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {running ? 'Pause' : 'Start Focus'}
      </button>
    </div>
  );
}