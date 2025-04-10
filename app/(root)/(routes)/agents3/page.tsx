// app/(root)/(routes)/agents3/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TaskCard from '@/components/TaskCard';
import TaskFilters from '@/components/TaskFilters';
import VisualizationTabs from '@/components/VisualizationsTab';
import AIAgentChat from '@/components/AIAgentChat';
import { Task } from '@/types';
import { fetchOpenAI } from '@/lib/api/openai';

export default function TaskFlow() {
  // State
  const [taskInput, setTaskInput] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  
  // Filter and sort state
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority'>('newest');

  // Focus mode state
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  // Sample initial tasks
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      user_id: 'user1',
      title: 'Design UI mockups for dashboard',
      description: 'Create wireframes and high-fidelity designs for the analytics dashboard',
      status: 'pending',
      category: 'creative',
      priority: 'high',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      tags: ['Design', 'Work']
    },
    {
      id: '2',
      user_id: 'user1',
      title: 'Research component libraries for React',
      description: 'Evaluate different UI component libraries to speed up development',
      status: 'in-progress',
      category: 'analytical',
      priority: 'medium',
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      tags: ['Research', 'Coding']
    },
    {
      id: '3',
      user_id: 'user1',
      title: 'Update project documentation',
      description: 'Ensure all code is properly documented for the team',
      status: 'done',
      category: 'routine',
      priority: 'low',
      created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
      tags: ['Work']
    }
  ]);
  
  // Sample available tags (in a real app, you would generate this from tasks)
  const availableTags = ['Design', 'Work', 'Research', 'Coding', 'Documentation', 'Meeting', 'Urgent', 'AI-reviewed', 'discussed'];
  
  // Refs
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    // Filter by tag
    const matchesTag = filterTag === null || (task.tags && task.tags.includes(filterTag));
    
    // Filter by search term
    const matchesSearch = searchTerm === '' || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesTag && matchesSearch;
  });
  
  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (sortBy === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else if (sortBy === 'priority') {
      const priorityValue = { high: 3, medium: 2, low: 1 };
      return (priorityValue[b.priority || 'low'] || 0) - (priorityValue[a.priority || 'low'] || 0);
    }
    return 0;
  });
  
  // Group tasks by status
  const pendingTasks = sortedTasks.filter(task => task.status === 'pending');
  const inProgressTasks = sortedTasks.filter(task => task.status === 'in-progress');
  const completedTasks = sortedTasks.filter(task => task.status === 'done');
  
  // Function to get the focused task (for cleaner code)
  const getFocusedTask = () => {
    return tasks.find(task => task.id === focusedTaskId);
  };
  
  // Show notification
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, 3000);
  };
  
  // Task management functions
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskInput.trim()) return;
    
    setLoading(true);
    
    try {
      let category: 'creative' | 'analytical' | 'routine' = 'routine';
      
      // AI categorization
      const response = await fetchOpenAI({
        prompt: `Categorize this task into one of these categories: creative, analytical, routine. Task: ${taskInput}`,
        max_tokens: 50,
      });
      
      const categoryText = response.choices[0].text.trim().toLowerCase();
      if (categoryText.includes('creative')) {
        category = 'creative';
      } else if (categoryText.includes('analytical')) {
        category = 'analytical';
      }
      
      const newTask: Task = {
        id: Date.now().toString(),
        user_id: 'user1',
        title: taskInput,
        description: taskDescription,
        status: 'pending',
        category,
        priority: 'medium',
        created_at: new Date().toISOString(),
        tags: []
      };
      
      setTasks([newTask, ...tasks]);
      
      // Reset form
      setTaskInput('');
      setTaskDescription('');
      
      // Show success notification
      showNotification('Task added successfully!', 'success');
      
      // Create particle effect
      createParticleEffect('add');
      
    } catch (error) {
      console.error('Error adding task:', error);
      showNotification('Failed to add task', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const updateTaskStatus = (taskId: string, newStatus: 'pending' | 'in-progress' | 'done') => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    );
    
    setTasks(updatedTasks);
    
    if (newStatus === 'done') {
      createParticleEffect('complete');
      showNotification('Task completed!', 'success');
    } else if (newStatus === 'in-progress') {
      showNotification('Task moved to in-progress', 'info');
    } else {
      showNotification('Task moved to pending', 'info');
    }
  };
  
  const deleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    
    // If deleting the focused task, exit focus mode
    if (focusedTaskId === taskId) {
      setIsFocusMode(false);
      setFocusedTaskId(null);
    }
    
    showNotification('Task deleted', 'info');
  };
  
  const editTask = (taskId: string, updates: Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>>) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    );
    
    setTasks(updatedTasks);
    showNotification('Task updated', 'success');
  };
  
  const createParticleEffect = (type: 'add' | 'complete' | 'focus' = 'complete') => {
    // Color based on type
    const color = type === 'add' 
      ? 'rgba(80, 255, 150, 0.8)'  // Green for add
      : type === 'focus'
      ? 'rgba(255, 95, 217, 0.8)'  // Purple for focus
      : 'rgba(80, 255, 255, 0.8)'; // Cyan for complete
    
    // Create particles
    for (let i = 0; i < 10; i++) {
      const particle = document.createElement('div');
      const size = Math.random() * 10 + 5;
      const posX = Math.random() * window.innerWidth;
      const posY = Math.random() * window.innerHeight;
      
      particle.className = 'particle';
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${posX}px`;
      particle.style.top = `${posY}px`;
      particle.style.background = color;
      particle.style.boxShadow = `0 0 15px 2px ${color}`;
      particle.style.position = 'fixed';
      particle.style.borderRadius = '50%';
      particle.style.pointerEvents = 'none';
      particle.style.zIndex = '50';
      particle.style.animation = 'particle 1s ease-out forwards';
      
      document.body.appendChild(particle);
      
      // Remove after animation
      setTimeout(() => {
        particle.remove();
      }, 1000);
    }
  };
  
  const focusOnTask = (taskId: string) => {
    if (focusedTaskId === taskId && isFocusMode) {
      // Clicking on the already focused task will exit focus mode
      setFocusedTaskId(null);
      setIsFocusMode(false);
      showNotification('Exited focus mode', 'info');
    } else {
      // Enter focus mode on the selected task
      setFocusedTaskId(taskId);
      setIsFocusMode(true);
      showNotification('Focus mode activated', 'info');
      
      // Create focus effect animation
      createParticleEffect('focus');
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4 md:p-8">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
              notification.type === 'success' 
                ? 'bg-neon-green/20 border border-neon-green text-neon-green'
                : notification.type === 'error'
                ? 'bg-red-500/20 border border-red-500 text-red-400'
                : 'bg-neon-cyan/20 border border-neon-cyan text-neon-cyan'
            }`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">
          TaskFlow AI
        </h1>
        <p className="text-gray-400">
          A next-generation task management system
        </p>
      </header>
      
      {/* Add Task Form */}
      <form 
        onSubmit={handleAddTask}
        className="max-w-2xl mx-auto mb-8 p-6 bg-gray-800/30 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-[0_0_20px_rgba(80,255,255,0.1)]"
      >
        <h2 className="text-xl font-bold mb-4 text-neon-cyan">Add New Task</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Title
          </label>
          <input
            type="text"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-neon-cyan text-white"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Description (optional)
          </label>
          <textarea
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="Add more details about this task..."
            rows={3}
            className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-neon-cyan text-white resize-none"
          />
        </div>
        
        <div className="flex justify-end">
          <motion.button
            type="submit"
            disabled={loading || !taskInput.trim()}
            className={`px-6 py-2 rounded-lg font-medium ${
              loading || !taskInput.trim()
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-neon-cyan text-gray-900 shadow-[0_0_15px_rgba(80,255,255,0.3)]'
            }`}
            whileHover={!loading && taskInput.trim() ? { scale: 1.05 } : {}}
            whileTap={!loading && taskInput.trim() ? { scale: 0.95 } : {}}
          >
            {loading ? 'Adding...' : 'Add Task'}
          </motion.button>
        </div>
      </form>
      
      {/* Task Filters */}
      <TaskFilters
        availableTags={availableTags}
        filterTag={filterTag}
        setFilterTag={setFilterTag}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />
      
      {/* Task Lists - conditionally render normal view or focus mode */}
      {!isFocusMode ? (
        // Normal kanban board view
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* To Do column */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-neon-cyan">
              To Do <span className="text-sm text-gray-400">({pendingTasks.length})</span>
            </h2>
            <div className="space-y-4">
              <AnimatePresence>
                {pendingTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={updateTaskStatus}
                    onFocus={focusOnTask}
                    onDelete={deleteTask}
                    onEdit={editTask}
                  />
                ))}
                {pendingTasks.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    className="p-4 bg-gray-800/30 text-gray-400 rounded-lg text-center"
                  >
                    No pending tasks
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {/* In Progress column */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-neon-purple">
              In Progress <span className="text-sm text-gray-400">({inProgressTasks.length})</span>
            </h2>
            <div className="space-y-4">
              <AnimatePresence>
                {inProgressTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={updateTaskStatus}
                    onFocus={focusOnTask}
                    onDelete={deleteTask}
                    onEdit={editTask}
                  />
                ))}
                {inProgressTasks.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    className="p-4 bg-gray-800/30 text-gray-400 rounded-lg text-center"
                  >
                    No tasks in progress
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Completed column */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-neon-green">
              Completed <span className="text-sm text-gray-400">({completedTasks.length})</span>
            </h2>
            <div className="space-y-4">
              <AnimatePresence>
                {completedTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={updateTaskStatus}
                    onFocus={focusOnTask}
                    onDelete={deleteTask}
                    onEdit={editTask}
                  />
                ))}
                {completedTasks.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    className="p-4 bg-gray-800/30 text-gray-400 rounded-lg text-center"
                  >
                    No completed tasks
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      ) : (
        // Focus mode - enhanced view of the selected task with AI agent
        <motion.div 
          className="max-w-6xl mx-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {getFocusedTask() && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column - Task details */}
              <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl border border-gray-700/50 overflow-hidden shadow-[0_0_30px_rgba(80,255,255,0.15)]">
                {/* Header */}
                <div className="bg-gray-900/60 px-6 py-4 flex justify-between items-center border-b border-gray-700/50">
                  <h2 className="text-2xl font-bold text-white">Task Details</h2>
                  <button
                    onClick={() => setIsFocusMode(false)}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-colors"
                  >
                    Exit Focus
                  </button>
                </div>
                
                {/* Task content */}
                <div className="p-6">
                  {/* Title */}
                  <div className="mb-6">
                    <h3 className="text-3xl font-bold mb-4 text-white">{getFocusedTask()?.title}</h3>
                    
                    {/* Status Badge */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        getFocusedTask()?.status === 'pending'
                          ? 'bg-neon-cyan/20 text-neon-cyan'
                          : getFocusedTask()?.status === 'in-progress'
                          ? 'bg-neon-purple/20 text-neon-purple'
                          : 'bg-neon-green/20 text-neon-green'
                      }`}>
                        {getFocusedTask()?.status === 'pending'
                          ? 'To Do'
                          : getFocusedTask()?.status === 'in-progress'
                          ? 'In Progress'
                          : 'Completed'}
                      </span>
                      
                      <span className={`px-3 py-1 rounded-full text-sm font-medium bg-gray-700 text-white`}>
                        {getFocusedTask()?.category}
                      </span>
                      
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        getFocusedTask()?.priority === 'high'
                          ? 'bg-red-500/20 text-red-400'
                          : getFocusedTask()?.priority === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {getFocusedTask()?.priority} priority
                      </span>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-gray-300 mb-2">Description</h4>
                    <p className="text-gray-400 bg-gray-800/30 p-4 rounded-lg">
                      {getFocusedTask()?.description || 'No description provided.'}
                    </p>
                  </div>
                  
                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Tags */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-300 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {(getFocusedTask()?.tags ?? []).length > 0 ? (
                          (getFocusedTask()?.tags ?? []).map(tag => (
                            <span 
                              key={tag} 
                              className="px-3 py-1 bg-gray-800/80 text-gray-300 rounded-full text-sm"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500">No tags</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Creation Date */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-300 mb-2">Created</h4>
                      <p className="text-gray-400">
                        {getFocusedTask()?.created_at 
                          ? new Date(getFocusedTask()?.created_at || '').toLocaleString() 
                          : 'Unknown date'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="border-t border-gray-700/50 pt-6">
                    <div className="flex flex-col md:flex-row md:justify-between gap-4">
                      {/* Status Change Buttons */}
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => focusedTaskId && updateTaskStatus(focusedTaskId, 'pending')}
                          className={`px-4 py-2 rounded-md transition-colors ${
                            getFocusedTask()?.status === 'pending'
                              ? 'bg-neon-cyan/20 border border-neon-cyan text-neon-cyan'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          To Do
                        </button>
                        <button
                          onClick={() => focusedTaskId && updateTaskStatus(focusedTaskId, 'in-progress')}
                          className={`px-4 py-2 rounded-md transition-colors ${
                            getFocusedTask()?.status === 'in-progress'
                              ? 'bg-neon-purple/20 border border-neon-purple text-neon-purple'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          In Progress
                        </button>
                        <button
                          onClick={() => focusedTaskId && updateTaskStatus(focusedTaskId, 'done')}
                          className={`px-4 py-2 rounded-md transition-colors ${
                            getFocusedTask()?.status === 'done'
                              ? 'bg-neon-green/20 border border-neon-green text-neon-green'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          Completed
                        </button>
                      </div>
                      
                      {/* Delete Button */}
                      <button
                        onClick={() => {
                          if (focusedTaskId) {
                            deleteTask(focusedTaskId);
                            setIsFocusMode(false);
                          }
                        }}
                        className="px-4 py-2 bg-red-500/20 border border-red-500 text-red-400 rounded-md hover:bg-red-500/30 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right column - AI Agent Chat */}
              <div className="h-[calc(100vh-12rem)] flex flex-col">
                {getFocusedTask() && (
                  <AIAgentChat 
                    task={getFocusedTask()!} 
                    onTaskUpdate={(updates) => {
                      if (focusedTaskId) {
                        editTask(focusedTaskId, updates);
                        showNotification('Task updated by AI assistant', 'success');
                      }
                    }} 
                  />
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
      
      {/* Visualization Tabs (combined 2D and 3D) */}
      <VisualizationTabs tasks={tasks} />
      
      {/* CSS for particle animation */}
      <style jsx global>{`
        @keyframes particle {
          0% { 
            transform: translate(0, 0) scale(1); 
            opacity: 1; 
          }
          100% { 
            transform: translate(var(--random-x, 0), var(--random-y, -100px)) scale(0); 
            opacity: 0; 
          }
        }
      `}</style>
    </div>
  );
}