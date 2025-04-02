'use client';

import { useState, useEffect } from 'react';

interface Task {
  id: string;
  title: string;
  category: string;
  priorityScore?: number;
  estimatedTime?: number;
}

const Agents3Page = () => {
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [prioritizing, setPrioritizing] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [treeLevel, setTreeLevel] = useState(1);
  const [treePoints, setTreePoints] = useState(0);

  // AI Analysis Functions using your OpenAI endpoint
  const analyzeTaskContent = async (taskTitle: string) => {
    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Analyze this task: "${taskTitle}". Provide:
          1. Category (creative, analytical, or default)
          2. Complexity score (0-1)
          3. Estimated time in minutes`,
          max_tokens: 100
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Parse the AI response (assuming it returns text in a structured format)
      const text = data.choices[0].text;
      const lines = text.split('\n').filter(Boolean);
      const categoryMatch = lines[0]?.match(/Category: (\w+)/);
      const complexityMatch = lines[1]?.match(/Complexity: ([\d.]+)/);
      const timeMatch = lines[2]?.match(/Time: (\d+)/);

      return {
        suggestedCategory: categoryMatch?.[1] || 'default',
        complexityScore: parseFloat(complexityMatch?.[1] || '0.5'),
        estimatedTime: parseInt(timeMatch?.[1] || '30')
      };
    } catch (error) {
      console.error('Task analysis failed:', error);
      return {
        suggestedCategory: 'default',
        complexityScore: 0.5,
        estimatedTime: 30
      };
    }
  };

  const prioritizeTasks = async () => {
    setPrioritizing(true);
    try {
      const prioritized = await Promise.all(pendingTasks.map(async task => {
        const analysis = await analyzeTaskContent(task.title);
        return {
          ...task,
          priorityScore: analysis.complexityScore * 100,
          estimatedTime: analysis.estimatedTime
        };
      }));
      setPendingTasks(prioritized.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0)));
    } finally {
      setPrioritizing(false);
    }
  };

  const TaskAI = ({ task }: { task: Task }) => {
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    
    useEffect(() => {
      const getSuggestions = async () => {
        try {
          const response = await fetch('/api/openai', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: `Provide 3 specific suggestions to help complete this task: "${task.title}"`,
              max_tokens: 150
            }),
          });

          const data = await response.json();
          if (data.error) throw new Error(data.error);

          const suggestions = data.choices[0].text
            .split('\n')
            .filter((line: string) => line.trim())
            .map((line: string) => line.replace(/^\d+\.\s*/, '')); // Remove numbering
          
          setAiSuggestions(suggestions);
        } catch (error) {
          console.error('AI suggestions failed:', error);
          setAiSuggestions([
            `Break "${task.title}" into smaller steps`,
            `Estimated time: ${task.estimatedTime} minutes`,
            `Priority score: ${task.priorityScore?.toFixed(0)}`
          ]);
        }
      };
      getSuggestions();
    }, [task]);

    return (
      <div className="p-4 bg-gray-900/50">
        <h4 className="text-emerald-400">Growth Spirit Suggestions</h4>
        {aiSuggestions.length > 0 && (
          <ul className="text-gray-300 list-disc pl-5">
            {aiSuggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    setLoading(true);
    const analysis = await analyzeTaskContent(newTask);
    
    const task: Task = {
      id: Date.now().toString(),
      title: newTask,
      category: analysis.suggestedCategory,
      priorityScore: analysis.complexityScore * 100,
      estimatedTime: analysis.estimatedTime
    };
    
    setPendingTasks([task, ...pendingTasks]);
    setNewTask('');
    setLoading(false);
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  const completeTask = (taskId: string) => {
    const task = pendingTasks.find(t => t.id === taskId);
    if (task) {
      setPendingTasks(pendingTasks.filter(t => t.id !== taskId));
      setCompletedTasks([task, ...completedTasks]);
      setTreePoints(prev => prev + 10);
      if (treePoints + 10 >= treeLevel * 100) {
        setTreeLevel(prev => prev + 1);
      }
    }
  };

  const FocusTimer = ({ taskId }: { taskId: string }) => {
    return <div className="text-gray-400 text-sm mt-2">Timer Placeholder</div>;
  };

  const Dashboard = ({ completedTasks, pendingTasks, treeLevel, treePoints }: any) => {
    return (
      <div className="bg-gray-800/50 p-4 rounded-xl">
        <h2 className="text-xl text-emerald-400 mb-4">Growth Dashboard</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>Pending: {pendingTasks}</div>
          <div>Completed: {completedTasks}</div>
          <div>Tree Level: {treeLevel}</div>
          <div>Points: {treePoints}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl text-white mb-2">Task Garden</h1>
        <p className="text-gray-400">Grow your productivity tree</p>
      </div>

      <form onSubmit={handleSubmit} className="mb-8">
        <div>
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
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
                key={task.id}
                className={`border border-gray-700 rounded-xl overflow-hidden transition-all duration-300 ${
                  task.category === 'creative' ? 'border-l-4 border-l-purple-500' :
                  task.category === 'analytical' ? 'border-l-4 border-l-blue-500' :
                  'border-l-4 border-l-emerald-500'
                }`}
              >
                <div className="flex items-start p-4 bg-gray-800/50">
                  <div
                    className="flex-grow cursor-pointer"
                    onClick={() => toggleTaskExpansion(task.id)}
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
                    <FocusTimer taskId={task.id} />
                  </div>
                  <button
                    onClick={() => completeTask(task.id)}
                    className="ml-4 px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    Complete
                  </button>
                </div>
                {expandedTaskId === task.id && <TaskAI task={task} />}
              </div>
            ))}
          </div>
        )}
      </div>

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
                key={task.id}
                className="p-3 rounded-lg bg-gray-800/30 opacity-70"
              >
                <p className="text-gray-300 line-through">{task.title}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dashboard
        completedTasks={completedTasks.length}
        pendingTasks={pendingTasks.length}
        treeLevel={treeLevel}
        treePoints={treePoints}
      />
    </div>
  );
};

export default Agents3Page;