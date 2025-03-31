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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-green-700 dark:text-green-500 mb-4">Productivity Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Task Statistics</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600 dark:text-gray-300">Tasks Completed</span>
                <span className="font-bold text-green-600">{completedTasks}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-600">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600 dark:text-gray-300">Tasks Pending</span>
                <span className="font-bold text-yellow-600">{pendingTasks}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-600">
                <div 
                  className="bg-yellow-500 h-2 rounded-full" 
                  style={{ width: `${pendingTasks > 0 ? 100 - completionRate : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600 dark:text-gray-300">Completion Rate</span>
                <span className="font-bold text-blue-600">{completionRate}%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Tree Growth</h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                {treeLevel}
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200">Current Level</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Keep growing!</p>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600 dark:text-gray-300">Total Points</span>
                <span className="font-bold text-green-600">{treePoints}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-600">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${(treePoints % 10) * 10}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">
                {10 - (treePoints % 10)} points to level {treeLevel + 1}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}