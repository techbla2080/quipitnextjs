'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { setTasks, addTask, completeTask, updatePoints, setTree, prioritizeTasks, toggleTaskExpansion } from '../../../../features/tasks';
import { RootState } from '../../../../store';
import { fetchOpenAI } from '../../../../lib/api/openai';
import FocusTimer from '../../../../components/FocusTimer';
import TaskAI from '../../../../components/TaskAI';
import Dashboard from '../../../../components/Dashboard';
import Forest from '../../../../components/Forest';
import WellBeing from '../../../../components/WellBeing';

export default function ProductiviTreePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [taskInput, setTaskInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [prioritizing, setPrioritizing] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const dispatch = useDispatch();
  const { tasks, tree, expandedTaskId } = useSelector((state: RootState) => state.tasks);

  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const completedTasks = tasks.filter(task => task.status === 'done');
  const treePoints = tree.points;
  const treeLevel = tree.level;

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      redirect('/sign-in');
    }
  }, [isLoaded, isSignedIn]);

  // Fetch tasks and tree
  useEffect(() => {
    if (isSignedIn && user?.id) {
      fetchTasks();
      fetchTree();
    }
  }, [isSignedIn, user?.id]);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?userId=${user.id}`);
      const data = await response.json();
      dispatch(setTasks(data));
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchTree = async () => {
    try {
      const response = await fetch(`/api/tree/${user.id}`);
      const data = await response.json();
      dispatch(setTree({ points: data.points, level: data.level }));
    } catch (error) {
      console.error('Error fetching tree:', error);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskInput.trim()) return;

    setLoading(true);
    try {
      const response = await fetchOpenAI({
        prompt: `Categorize this task into one of these categories: creative, analytical, routine. Task: ${taskInput}`,
        max_tokens: 50,
      });
      const categoryMatch = response.choices[0].text.trim().match(/creative|analytical|routine/);
      const category = categoryMatch ? categoryMatch[0] : 'routine';

      const taskResponse = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, title: taskInput, category }),
      });
      const data = await taskResponse.json();
      dispatch(addTask(data));
      setTaskInput('');
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (taskId: string) => {
    try {
      const response = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, userId: user.id }),
      });
      const data = await response.json();
      dispatch(completeTask(taskId));
      dispatch(setTree({ points: data.tree.points, level: data.tree.level }));
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const prioritizeTasks = async () => {
    setPrioritizing(true);
    try {
      const response = await fetchOpenAI({
        prompt: `Prioritize these tasks: ${pendingTasks.map(t => t.title).join(', ')}`,
        max_tokens: 100,
      });
      const order = response.choices[0].text.trim().split(', ');
      const reordered = order.map((title: string) => pendingTasks.find(t => t.title === title));
      const completed = tasks.filter(t => t.status === 'done');
      dispatch(prioritizeTasks([...reordered, ...completed]));
    } catch (error) {
      console.error('Error prioritizing tasks:', error);
    } finally {
      setPrioritizing(false);
    }
  };

  const handleTimerComplete = () => {
    // No additional action needed; points are updated in FocusTimer
  };

  const toggleTaskExpansion = (taskId: string) => {
    dispatch(toggleTaskExpansion(taskId));
  };

  if (!isLoaded || !isSignedIn) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar (placeholder for saved tasks) */}
      {showSidebar && (
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold dark:text-white">Saved Tasks</h2>
          </div>
          <div className="space-y-2 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <p className="text-gray-500 text-sm">Tasks appear below.</p>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`flex-1 flex flex-col ${showSidebar ? 'ml-0' : ''} transition-all duration-300 overflow-auto`}>
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-2xl font-semibold dark:text-white">ProductiviTree (Agent 3)</h1>
          </div>
        </div>

        <div className="p-4 max-w-4xl mx-auto w-full">
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400">Grow your productivity, one task at a time!</p>
          </div>

          {/* Add Task Form */}
          <form onSubmit={handleAddTask} className="mb-6">
            <div className="mb-4">
              <input
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="Plant a new task..."
                disabled={loading}
                className="w-full bg-white/5 border border-gray-700 rounded-xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div className="flex justify-between mt-3 gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex-grow"
              >
                {loading ? 'Planting...' : 'Plant Task'}
              </button>

              <button
                type="button"
                onClick={prioritizeTasks}
                disabled={prioritizing || pendingTasks.length < 2}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {prioritizing ? 'Prioritizing...' : 'AI Prioritize'}
              </button>
            </div>
          </form>

          {/* Task List */}
          <div className="mb-8">
            <h2 className="text-xl text-emerald-400 mb-4">Growing Tasks</h2>
            {pendingTasks.length === 0 ? (
              <div className="text-gray-400 text-center py-8 border border-dashed border-gray-700 rounded-xl">
                No active tasks. Add one to start growing your tree!
              </div>
            ) : (
              <div className="space-y-4">
                {pendingTasks.map(task => (
                  <div
                    key={task._id}
                    className={`border border-gray-700 rounded-xl overflow-hidden transition-all duration-300 ${
                      task.category === 'creative' ? 'border-l-4 border-l-purple-500' :
                      task.category === 'analytical' ? 'border-l-4 border-l-blue-500' :
                      'border-l-4 border-l-emerald-500'
                    }`}
                  >
                    <div className="flex items-start p-4 bg-gray-800/50">
                      <div
                        className="flex-grow cursor-pointer"
                        onClick={() => toggleTaskExpansion(task._id)}
                      >
                        <div className="flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-2 ${
                            task.category === 'creative' ? 'bg-purple-500' :
                            task.category === 'analytical' ? 'bg-blue-500' :
                            'bg-emerald-500'
                          }`}></span>
                          <h3 className="text-lg font-medium text-white">{task.title}</h3>
                        </div>
                        <div className="mt-1">
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300 mr-2">
                            {task.category || 'Task'}
                          </span>
                          <span className="text-xs text-gray-400">
                            <span className="inline-flex items-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1"></span>
                              Growth Spirit Available
                            </span>
                          </span>
                        </div>
                        <FocusTimer taskId={task._id} onComplete={handleTimerComplete} />
                      </div>
                      <button
                        onClick={() => completeTask(task._id)}
                        className="ml-4 px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                      >
                        Complete
                      </button>
                    </div>

                    {/* Expanded view with AI */}
                    {expandedTaskId === task._id && (
                      <TaskAI task={task} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Tasks */}
          <div className="mb-8">
            <h2 className="text-xl text-emerald-400 mb-4">Harvested Tasks</h2>
            {completedTasks.length === 0 ? (
              <div className="text-gray-400 text-center py-4 border border-dashed border-gray-700 rounded-xl">
                No completed tasks yet.
              </div>
            ) : (
              <div className="space-y-2">
                {completedTasks.map(task => (
                  <div
                    key={task._id}
                    className="p-3 rounded-lg bg-gray-800/30 opacity-70"
                  >
                    <p className="text-gray-300 line-through">{task.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Well-Being */}
          <WellBeing />

          {/* Forest */}
          <Forest userId={user.id} />

          {/* Dashboard */}
          <Dashboard
            completedTasks={completedTasks.length}
            pendingTasks={pendingTasks.length}
            treeLevel={treeLevel}
            treePoints={treePoints}
          />
        </div>
      </div>
    </div>
  );
}