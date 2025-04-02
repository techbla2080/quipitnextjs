// components/Tree.tsx
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
    const groundGradient = ctx.createLinearGradient(0, canvas.height - 30, 0, canvas.height);
    groundGradient.addColorStop(0, '#3E2723');
    groundGradient.addColorStop(1, '#5D4037');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
    
    // Draw trunk
    ctx.fillStyle = '#795548';
    const trunkWidth = 20 + Math.min(level * 2, 10);
    ctx.fillRect(canvas.width / 2 - trunkWidth / 2, canvas.height - 30 - 100, trunkWidth, 100);
    
    // Add trunk texture
    ctx.strokeStyle = '#5D4037';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - trunkWidth / 2 + (i * trunkWidth / 5), canvas.height - 30);
      ctx.lineTo(canvas.width / 2 - trunkWidth / 2 + (i * trunkWidth / 5), canvas.height - 30 - 100);
      ctx.stroke();
    }
    
    // Draw branches based on level
    if (level > 1) {
      // Left branch
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, canvas.height - 30 - 70);
      ctx.lineTo(canvas.width / 2 - 30, canvas.height - 30 - 90);
      ctx.strokeStyle = '#795548';
      ctx.lineWidth = 5;
      ctx.stroke();
      
      // Right branch
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, canvas.height - 30 - 50);
      ctx.lineTo(canvas.width / 2 + 25, canvas.height - 30 - 70);
      ctx.stroke();
    }
    
    // Draw foliage (tree crown)
    const foliageSize = 30 + Math.min(level * 5, 40);
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height - 30 - 120, 0,
      canvas.width / 2, canvas.height - 30 - 120, foliageSize
    );
    gradient.addColorStop(0, '#4CAF50');
    gradient.addColorStop(1, '#2E7D32');
    ctx.fillStyle = gradient;
    
    // Draw multiple circles for a fuller tree crown
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height - 30 - 120, foliageSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Add some variation based on level
    if (level > 2) {
      ctx.fillStyle = '#388E3C';
      ctx.beginPath();
      ctx.arc(canvas.width / 2 - 20, canvas.height - 30 - 140, foliageSize * 0.6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(canvas.width / 2 + 20, canvas.height - 30 - 100, foliageSize * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add fruits/flowers at higher levels
    if (level > 3) {
      const fruitCount = Math.min(level - 2, 8);
      ctx.fillStyle = '#FF5722';
      
      for (let i = 0; i < fruitCount; i++) {
        const angle = (i / fruitCount) * Math.PI * 2;
        const radius = foliageSize * 0.7;
        const x = canvas.width / 2 + Math.cos(angle) * radius;
        const y = (canvas.height - 30 - 120) + Math.sin(angle) * radius;
        
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

  }, [points, level]);

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} width={300} height={260} className="mb-2" />
      
      <div className="w-full max-w-xs bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
        <div className="flex justify-between items-center mb-2">
          <div>
            <div className="text-xs text-gray-400">Level</div>
            <div className="text-2xl font-bold text-emerald-400">{level}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">Points</div>
            <div className="text-2xl font-bold text-emerald-400">{points}</div>
          </div>
        </div>
        
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progress</span>
            <span>{10 - (points % 10)} points to next level</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${(points % 10) * 10}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}