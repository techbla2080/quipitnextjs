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
    
    // Draw ground
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
    
    // Draw tree trunk
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(canvas.width / 2 - 10, canvas.height - 20 - 80, 20, 80);
    
    // Draw tree crown - size based on level
    const baseSize = 30;
    const growthFactor = level * 5;
    const crownSize = baseSize + growthFactor;
    
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height - 20 - 80 - 30, crownSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Add decorations based on level
    if (level >= 2) {
      // Add more detailed branches
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, canvas.height - 20 - 60);
      ctx.lineTo(canvas.width / 2 - 30, canvas.height - 20 - 80);
      ctx.lineTo(canvas.width / 2 - 25, canvas.height - 20 - 80);
      ctx.lineTo(canvas.width / 2, canvas.height - 20 - 65);
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, canvas.height - 20 - 60);
      ctx.lineTo(canvas.width / 2 + 30, canvas.height - 20 - 80);
      ctx.lineTo(canvas.width / 2 + 25, canvas.height - 20 - 80);
      ctx.lineTo(canvas.width / 2, canvas.height - 20 - 65);
      ctx.fill();
    }
    
    if (level >= 3) {
      // Add smaller foliage clusters
      ctx.fillStyle = '#32CD32';
      ctx.beginPath();
      ctx.arc(canvas.width / 2 - 20, canvas.height - 20 - 100, 20, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(canvas.width / 2 + 20, canvas.height - 20 - 100, 20, 0, Math.PI * 2);
      ctx.fill();
    }
    
    if (level >= 5) {
      // Add fruits/flowers
      const fruitCount = Math.min(level - 4, 10);
      ctx.fillStyle = '#FF6347';
      
      for (let i = 0; i < fruitCount; i++) {
        const angle = (Math.PI * 2 * i) / fruitCount;
        const x = canvas.width / 2 + Math.cos(angle) * (crownSize - 10);
        const y = (canvas.height - 20 - 80 - 30) + Math.sin(angle) * (crownSize - 10);
        
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
  }, [points, level]);

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} width={300} height={250} className="mb-4" />
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 w-full max-w-xs">
        <div className="flex justify-between">
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-300">Level</span>
            <p className="text-2xl font-bold text-green-600">{level}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-300">Points</span>
            <p className="text-2xl font-bold text-green-600">{points}</p>
          </div>
        </div>
        
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-1">Next level in {10 - (points % 10)} points</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div 
              className="bg-green-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${(points % 10) * 10}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}