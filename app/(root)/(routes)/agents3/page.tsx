"use client";

import { useState } from 'react';
import Tree from '@/components/Tree';
import FocusTimer from '@/components/FocusTimer';
import Dashboard from '@/components/DashBoard';

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'done';
}

export default function ProductiviTreePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskInput, setTaskInput] = useState('');
  const [treePoints, setTreePoints] = useState(0);
  const [treeLevel, setTreeLevel] = useState(1);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskInput.trim()) return;
    
    setTasks([
      ...tasks, 
      { id: Date.now().toString(), title: taskInput, status: 'pending' }
    ]);
    setTaskInput('');
  };

  const completeTask = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: 'done' } : task
    ));
    
    // Add points and update level
    const newPoints = treePoints + 10;
    setTreePoints(newPoints);
    setTreeLevel(Math.floor(newPoints / 10) + 1);
  };

  const handleTimerComplete = () => {
    // Add points for completing a pomodoro session
    const newPoints = treePoints + 5;
    setTreePoints(newPoints);
    setTreeLevel(Math.floor(newPoints / 10) + 1);
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'done');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold dark:text-white mb-4">ProductiviTree</h1>
        
        {/* Tree visualization */}
        <div className="mb-6 flex justify-center">
          <Tree points={treePoints} level={treeLevel} />
        </div>

        {/* Add Task Form */}
        <form onSubmit={addTask} className="mb-6">
          <input
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            placeholder="Add a task..."
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 dark:bg-gray-800 dark:text-white dark:border-gray-700"
          />
          <div className="flex justify-end mt-2">
            <button 
              type="submit" 
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Task
            </button>
          </div>
        </form>

        {/* Task List */}
        <div className="border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 p-4 mb-6">
          <h2 className="text-xl text-green-700 dark:text-white mb-3">Active Tasks</h2>
          {pendingTasks.length === 0 ? (
            <div className="text-gray-400 text-center py-8 dark:text-gray-500">
              No active tasks. Add one to start growing your tree!
            </div>
          ) : (
            <div className="space-y-4">
              {pendingTasks.map(task => (
                <div 
                  key={task.id} 
                  className="flex items-start p-3 border rounded-lg bg-gray-50 dark:bg-gray-700"
                >
                  <div className="flex-grow">
                    <p className="text-md font-medium dark:text-white">{task.title}</p>
                    <FocusTimer taskId={task.id} onComplete={handleTimerComplete} />
                  </div>
                  <button 
                    onClick={() => completeTask(task.id)} 
                    className="ml-2 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                  >
                    Complete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Tasks */}
        <div className="border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 p-4 mb-6">
          <h2 className="text-xl text-green-700 dark:text-white mb-3">Completed Tasks</h2>
          {completedTasks.length === 0 ? (
            <div className="text-gray-400 text-center py-4 dark:text-gray-500">
              No completed tasks yet.
            </div>
          ) : (
            <div className="space-y-2">
              {completedTasks.map(task => (
                <div 
                  key={task.id} 
                  className="p-2 rounded bg-gray-100 dark:bg-gray-700"
                >
                  <p className="text-gray-800 dark:text-gray-200 line-through">{task.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dashboard */}
        <Dashboard 
          completedTasks={completedTasks.length} 
          pendingTasks={pendingTasks.length}
          treeLevel={treeLevel}
          treePoints={treePoints}
        />
      </div>
    </div>
  );
}