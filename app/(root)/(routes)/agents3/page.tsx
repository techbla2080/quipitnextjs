'use client';

// React and Next.js imports
import { useState, useEffect } from 'react';
import { redirect } from 'next/navigation';

// Third-party imports
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';

// Custom imports
import { fetchOpenAI } from '@/lib/api/openai';
import { supabase } from '@/lib/supabase';

interface Task {
  id: string;
  user_id: string;
  title: string;
  status: string;
  category?: string;
  created_at: string;
}

export default function TaskFlowAIPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [taskInput, setTaskInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [prioritizing, setPrioritizing] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Calculate task metrics
  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress');
  const completedTasks = tasks.filter(task => task.status === 'done');

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      redirect('/sign-in');
    }
  }, [isLoaded, isSignedIn]);

  // Fetch tasks and set up real-time subscription
  useEffect(() => {
    // Only fetch tasks if the user is signed in and user object exists
    if (isSignedIn && user && user.id) {
      fetchTasks();
    }

    const taskSubscription = supabase
      .channel('tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, payload => {
        if (user && user.id) {
          fetchTasks();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(taskSubscription);
    };
  }, [isSignedIn, user]); // Depend on user object to re-run if user changes

  const fetchTasks = async () => {
    if (!user || !user.id) return; // Additional safeguard
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id);
    setTasks(data || []);
  };

  // Add a new task with AI categorization
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskInput.trim() || !user || !user.id) return;

    setLoading(true);
    try {
      const response = await fetchOpenAI({
        prompt: `Categorize this task into one of these categories: creative, analytical, routine. Task: ${taskInput}`,
        max_tokens: 50,
      });
      const categoryMatch = response.choices[0].text.trim().match(/creative|analytical|routine/);
      const category = categoryMatch ? categoryMatch[0] : 'routine';

      await supabase
        .from('tasks')
        .insert({ user_id: user.id, title: taskInput, category, status: 'pending' });
      setTaskInput('');
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setLoading(false);
    }
  };

  // Complete a task with a particle effect
  const completeTask = async (taskId: string) => {
    await supabase
      .from('tasks')
      .update({ status: 'done' })
      .eq('id', taskId);

    // Trigger a particle effect on completion
    const particle = document.createElement('div');
    particle.className = 'absolute w-4 h-4 rounded-full bg-neon-cyan animate-particle';
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 1000);
  };

  // AI-driven task prioritization
  const prioritizeTasks = async () => {
    setPrioritizing(true);
    try {
      const response = await fetchOpenAI({
        prompt: `Prioritize these tasks: ${pendingTasks.map(t => t.title).join(', ')}`,
        max_tokens: 100,
      });
      const order = response.choices[0].text.trim().split(', ');
      const reordered = order
        .map((title: string) => pendingTasks.find(t => t.title === title))
        .filter((task): task is Task => !!task); // Ensure no undefined tasks
      const nonPending = tasks.filter(t => t.status !== 'pending');
      setTasks([...reordered, ...nonPending]);
    } catch (error) {
      console.error('Error prioritizing tasks:', error);
    } finally {
      setPrioritizing(false);
    }
  };

  if (!isLoaded || !isSignedIn) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Sidebar */}
      {showSidebar && (
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-64 bg-gray-900/80 backdrop-blur-lg border-r border-gray-700/50 p-4 shadow-lg"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-neon-cyan [text-shadow:_0_0_10px_rgba(0,255,255,0.5)]">
              TaskFlow AI
            </h2>
          </div>
          <div className="space-y-2 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <p className="text-gray-400 text-sm">Your tasks are below.</p>
          </div>
        </motion.div>
      )}

      {/* Main content */}
      <div className={`flex-1 flex flex-col ${showSidebar ? 'ml-0' : ''} transition-all duration-300 overflow-auto`}>
        <div className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-lg border-b border-gray-700/50 p-4 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="mr-4 text-neon-cyan hover:text-neon-cyan/80 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-2xl font-semibold text-neon-cyan [text-shadow:_0_0_10px_rgba(0,255,255,0.5)]">
              TaskFlow AI
            </h1>
          </div>
        </div>

        <div className="p-6 max-w-4xl mx-auto w-full">
          <div className="mb-6">
            <p className="text-gray-300 text-lg [text-shadow:_0_0_5px_rgba(255,255,255,0.2)]">
              Manage your tasks with AI-powered insights and futuristic visuals.
            </p>
          </div>

          {/* Add Task Form */}
          <motion.form
            onSubmit={handleAddTask}
            className="mb-8 bg-gray-800/30 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6 shadow-[0_0_20px_rgba(0,255,255,0.1)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-4">
              <input
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="Add a new task..."
                disabled={loading}
                className="w-full bg-gray-900/50 border border-gray-700/50 rounded-xl px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 transition-all [box-shadow:_0_0_10px_rgba(0,255,255,0.2)]"
              />
            </div>

            <div className="flex justify-between gap-4">
              <motion.button
                type="submit"
                disabled={loading}
                className="flex-grow px-6 py-3 bg-neon-cyan text-gray-900 rounded-xl font-semibold hover:bg-neon-cyan/80 disabled:opacity-50 transition-all [box-shadow:_0_0_15px_rgba(0,255,255,0.5)]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {loading ? 'Adding...' : 'Add Task'}
              </motion.button>

              <motion.button
                type="button"
                onClick={prioritizeTasks}
                disabled={prioritizing || pendingTasks.length < 2}
                className="px-6 py-3 bg-neon-purple text-gray-900 rounded-xl font-semibold hover:bg-neon-purple/80 disabled:opacity-50 transition-all [box-shadow:_0_0_15px_rgba(147,51,234,0.5)]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {prioritizing ? 'Prioritizing...' : 'AI Prioritize'}
              </motion.button>
            </div>
          </motion.form>

          {/* Task List: To Do */}
          <div className="mb-8">
            <h2 className="text-xl text-neon-cyan mb-4 [text-shadow:_0_0_10px_rgba(0,255,255,0.5)]">To Do</h2>
            {pendingTasks.length === 0 ? (
              <motion.div
                className="text-gray-400 text-center py-8 border border-dashed border-gray-700/50 rounded-2xl bg-gray-800/20 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                No tasks to do. Add one to get started!
              </motion.div>
            ) : (
              <div className="space-y-4">
                {pendingTasks.map(task => (
                  <motion.div
                    key={task.id}
                    className={`bg-gray-800/30 backdrop-blur-md border border-gray-700/50 rounded-xl p-4 flex justify-between items-center shadow-[0_0_15px_rgba(0,255,255,0.1)] hover:shadow-[0_0_20px_rgba(0,255,255,0.2)] transition-all ${
                      task.category === 'creative' ? 'border-l-4 border-l-neon-purple' :
                      task.category === 'analytical' ? 'border-l-4 border-l-neon-cyan' :
                      'border-l-4 border-l-neon-green'
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div>
                      <h3 className="text-lg font-medium text-white">{task.title}</h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-700/50 text-gray-300">
                        {task.category || 'Task'}
                      </span>
                    </div>
                    <motion.button
                      onClick={() => completeTask(task.id)}
                      className="px-4 py-2 bg-neon-cyan text-gray-900 rounded-lg font-semibold hover:bg-neon-cyan/80 transition-all [box-shadow:_0_0_10px_rgba(0,255,255,0.5)]"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Complete
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Task List: In Progress */}
          <div className="mb-8">
            <h2 className="text-xl text-neon-purple mb-4 [text-shadow:_0_0_10px_rgba(147,51,234,0.5)]">In Progress</h2>
            {inProgressTasks.length === 0 ? (
              <motion.div
                className="text-gray-400 text-center py-4 border border-dashed border-gray-700/50 rounded-2xl bg-gray-800/20 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                No tasks in progress.
              </motion.div>
            ) : (
              <div className="space-y-2">
                {inProgressTasks.map(task => (
                  <motion.div
                    key={task.id}
                    className={`bg-gray-800/30 backdrop-blur-md border border-gray-700/50 rounded-xl p-4 flex justify-between items-center shadow-[0_0_15px_rgba(147,51,234,0.1)] hover:shadow-[0_0_20px_rgba(147,51,234,0.2)] transition-all ${
                      task.category === 'creative' ? 'border-l-4 border-l-neon-purple' :
                      task.category === 'analytical' ? 'border-l-4 border-l-neon-cyan' :
                      'border-l-4 border-l-neon-green'
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div>
                      <h3 className="text-lg font-medium text-white">{task.title}</h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-700/50 text-gray-300">
                        {task.category || 'Task'}
                      </span>
                    </div>
                    <motion.button
                      onClick={() => completeTask(task.id)}
                      className="px-4 py-2 bg-neon-purple text-gray-900 rounded-lg font-semibold hover:bg-neon-purple/80 transition-all [box-shadow:_0_0_10px_rgba(147,51,234,0.5)]"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Complete
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Task List: Completed */}
          <div className="mb-8">
            <h2 className="text-xl text-neon-green mb-4 [text-shadow:_0_0_10px_rgba(34,197,94,0.5)]">Completed Tasks</h2>
            {completedTasks.length === 0 ? (
              <motion.div
                className="text-gray-400 text-center py-4 border border-dashed border-gray-700/50 rounded-2xl bg-gray-800/20 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                No completed tasks yet.
              </motion.div>
            ) : (
              <div className="space-y-2">
                {completedTasks.map(task => (
                  <motion.div
                    key={task.id}
                    className="bg-gray-800/30 backdrop-blur-md border border-gray-700/50 rounded-xl p-4 opacity-70 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <p className="text-gray-300 line-through">{task.title}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}