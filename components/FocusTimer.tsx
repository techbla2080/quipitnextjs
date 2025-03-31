"use client";

import { useState, useEffect } from 'react';

interface FocusTimerProps {
  taskId: string;
  onComplete: () => void;
}

export default function FocusTimer({ taskId, onComplete }: FocusTimerProps) {
  const [time, setTime] = useState(25 * 60); // 25 minutes in seconds
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
      setTime(25 * 60);
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
    <div className="mt-2 flex items-center">
      <div className="mr-4">
        <p className="text-2xl font-mono">{formatTime()}</p>
        <p className="text-xs text-gray-500">Sessions: {sessions}</p>
      </div>
      <button 
        onClick={() => setRunning(!running)} 
        className={`px-3 py-1 rounded-md ${
          running 
            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
            : 'bg-green-100 text-green-700 hover:bg-green-200'
        }`}
      >
        {running ? 'Pause' : 'Start Focus'}
      </button>
    </div>
  );
}