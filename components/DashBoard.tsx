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
    <div className="mt-6 border rounded-lg p-4 bg-white dark:bg-gray-800">
      <h2 className="text-xl text-green-700 dark:text-white mb-3">Productivity Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded p-3 bg-gray-50 dark:bg-gray-700">
          <h3 className="font-medium mb-2">Task Overview</h3>
          <p>Tasks Completed: <span className="font-bold text-green-600">{completedTasks}</span></p>
          <p>Tasks Pending: <span className="font-bold text-yellow-600">{pendingTasks}</span></p>
          <p>Completion Rate: <span className="font-bold">{completionRate}%</span></p>
        </div>
        
        <div className="border rounded p-3 bg-gray-50 dark:bg-gray-700">
          <h3 className="font-medium mb-2">Tree Progress</h3>
          <p>Current Level: <span className="font-bold text-green-600">{treeLevel}</span></p>
          <p>Total Points: <span className="font-bold">{treePoints}</span></p>
        </div>
      </div>
      
      {/* Level Progress Bar */}
      <div className="mt-4">
        <h3 className="font-medium mb-2">Level Progress</h3>
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div 
            className="bg-green-600 h-2.5 rounded-full" 
            style={{ width: `${(treePoints % 10) * 10}%` }}
          ></div>
        </div>
        <p className="text-xs text-right mt-1">
          {treePoints % 10}/10 points to level {treeLevel + 1}
        </p>
      </div>
    </div>
  );
}