"use client";

import { useEffect, useRef } from 'react';

interface TreeProps {
  points: number;
  level: number;
}

export default function Tree({ points, level }: TreeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw tree trunk
    ctx.fillStyle = 'brown';
    ctx.fillRect(90, 50, 20, 100); // Trunk
    
    // Draw tree crown
    ctx.fillStyle = 'green';
    ctx.beginPath();
    ctx.arc(100, 50, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Add some decoration based on level
    if (level > 1) {
      // Add more branches/leaves as level increases
      ctx.fillStyle = 'darkgreen';
      ctx.beginPath();
      ctx.arc(85, 60, 15, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(115, 60, 15, 0, Math.PI * 2);
      ctx.fill();
    }
    
    if (level > 3) {
      // Add some fruits/flowers at higher levels
      ctx.fillStyle = 'red';
      for (let i = 0; i < Math.min(level, 8); i++) {
        const angle = (i / Math.min(level, 8)) * Math.PI * 2;
        const x = 100 + Math.cos(angle) * 25;
        const y = 50 + Math.sin(angle) * 25;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [points, level]);

  return (
    <div className="flex flex-col items-center mt-4">
      <canvas ref={canvasRef} width={200} height={180} />
      <p className="text-center text-gray-700 dark:text-gray-300 mt-2">
        Level {level} • {points} points • {10 - (points % 10)} points to next level
      </p>
    </div>
  );
}