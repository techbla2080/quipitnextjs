// components/Dashboard.tsx
"use client";

interface DashboardProps {
  completedTasks: number;
  pendingTasks: number;
  treeLevel: number;
  treePoints: number;
}

export default function Dashboard({ 
  completedTasks, 
  pendingTasks, 
  treeLevel, 
  treePoints 
}: DashboardProps) {
  
  const completionRate = completedTasks + pendingTasks > 0 
    ? Math.round((completedTasks / (completedTasks + pendingTasks)) * 100) 
    : 0;
  
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <h2 className="text-xl font-medium text-emerald-400 mb-5">Productivity Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="font-medium text-white mb-3">Task Statistics</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-300">Tasks Completed</span>
                <span className="font-bold text-emerald-400">{completedTasks}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full" 
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-300">Tasks Pending</span>
                <span className="font-bold text-yellow-400">{pendingTasks}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full" 
                  style={{ width: `${pendingTasks > 0 ? 100 - completionRate : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-300">Completion Rate</span>
                <span className="font-bold text-blue-400">{completionRate}%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="font-medium text-white mb-3">Tree Growth</h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                {treeLevel}
              </div>
              <div>
                <p className="font-medium text-white">Current Level</p>
                <p className="text-sm text-gray-400">Keep growing!</p>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-300">Total Points</span>
                <span className="font-bold text-emerald-400">{treePoints}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full" 
                  style={{ width: `${(treePoints % 10) * 10}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-400 mt-1 text-right">
                {10 - (treePoints % 10)} points to level {treeLevel + 1}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}